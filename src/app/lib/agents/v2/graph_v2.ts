import { AIMessage, BaseMessage, HumanMessage, MessageContent } from "@langchain/core/messages";
import {
  Annotation,
  END,
  messagesStateReducer,
  START,
  StateGraph,
  StateType,
} from "@langchain/langgraph";
import * as z from "zod";
import { customerLLM, feedbackLLM, personaLLM, scenarioLLM } from "./llms";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { alternativeSuggestionsPromptXML, customerSimulatorPromptJSON, customerSimulatorPromptXML, feedbackGeneratorPromptXML, messageRatingPromptXML, personaGeneratorPromptXML, scenarioGeneratorPromptXML } from "./prompts";
import { DBMessage, Thread, ThreadGroup } from "../../db/schema";
import { ThreadWithMessages } from "@/app/contexts/CoreAppDataContext";


export const baseLLMSchema = z.object({}); // Empty by default
export type BaseLLMSchema = z.infer<typeof baseLLMSchema>;

// --- Define Agent Response Schemas (Structured Output) ---
export const customerSimulatorSchema = baseLLMSchema.extend({
  Message: z.string(),
  Behavioral_Traits: z.array(z.string()),
  Resolution_Accepted: z.boolean().default(false),
});
export type CustomerSimulatorSchema = z.infer<typeof customerSimulatorSchema>;

export const scenarioGeneratorSchema = baseLLMSchema.extend({
  scenario_title: z.string().describe("A short and descriptive title."),
  business_context: z.string().describe("Why this situation occurs."),
  guest_situation: z.string().describe("The incoming guest query."),
  constraints_and_policies: z.array(z.string()).describe("List of policies."),
  expected_va_challenges: z.array(z.string()).describe("List of challenges."),
  difficulty_level: z.enum(["Easy", "Medium", "Hard"]).describe("The complexity of the scenario."),
  success_criteria: z.array(z.string()).describe("List of success conditions."),
});
export type ScenarioGeneratorSchema = z.infer<typeof scenarioGeneratorSchema>;

export const personaGeneratorSchema = baseLLMSchema.extend({
  name: z.string().describe("Generated guest/vendor name."),
  demographics: z.string().describe("Age, travel purpose, or background."),
  personality_traits: z.array(z.string()).describe("List of personality traits."),
  communication_style: z.string().describe("How they communicate."),
  emotional_tone: z.string().describe("The starting mood."),
  expectations: z.array(z.string()).describe("What the guest/vendor wants."),
  escalation_behavior: z.array(z.string()).describe("How they react if things go wrong."),
});
export type PersonaGeneratorSchema = z.infer<typeof personaGeneratorSchema>;

export const feedbackSchema = baseLLMSchema.extend({
  Overall_Feedback: z.string().describe("General summary of trainee performance."),
  Critical_Messages: z.array(
    z.object({
      index: z.number().describe("Index of the message in conversationHistory."),
      Content: z.string().describe("The trainee's message content."),
      Positive_Notes: z.array(z.string()).describe("Good things about this message."),
      Constructive_Criticism: z.array(z.string()).describe("Criticism or suggestions for improvement.")
    })
  ).describe("List of key messages with detailed feedback."),
  Strengths: z.array(z.string()).describe("Overall strengths shown by trainee."),
  Areas_For_Improvement: z.array(z.string()).describe("Weaknesses and areas to improve."),
  General_Suggestions: z.array(z.string()).describe("Additional generic advice and best practices."),
});
export type FeedbackSchema = z.infer<typeof feedbackSchema>;

export type TrainingStateType = 'start' | 'ongoing' | 'completed' | 'error' | 'paused';

export const TrainingState = Annotation.Root({
  conversationHistory: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
  scenario: Annotation<ScenarioGeneratorSchema>(
    {
      reducer: (a, b) => a,
    }
  ),
  persona: Annotation<PersonaGeneratorSchema>(
    {
      reducer: (a, b) => a,
    }
  ),
  status: Annotation<TrainingStateType>(),
  feedback: Annotation<FeedbackSchema>(),
});

// --- Define the makeAgentNode Factory Function ---
const makeAgentNode = <T>({
  name,
  systemPrompt,
  responseSchema,
  model,
  returnFunction,
}: {
  name: string;
  systemPrompt: (state: typeof TrainingState.State) => string;
  responseSchema: z.ZodType<T>;
  model: ChatGoogleGenerativeAI;
  returnFunction: (
    state: typeof TrainingState.State,
    response: any
  ) => Partial<typeof TrainingState.State>;
}) => {
  return async function (
    state: typeof TrainingState.State
  ): Promise<Partial<typeof TrainingState.State>> {

    if (name === "Persona_Generator" && state.persona != null) return returnFunction(state, null);
    if (name === "Scenario_Generator" && state.scenario != null) return returnFunction(state, null);

    console.log(`-> Agent ${name} is invoked...`);
    const myModel = model.withStructuredOutput(responseSchema);
    const prompt = systemPrompt(state);

    const response = await myModel.invoke([
      ...state.conversationHistory,
      new HumanMessage(prompt),
    ]);

    var updatedState = returnFunction(state, response);
    // ✅ Special handling for Customer Agent
    if (name === "Customer_Simulator") {
      if (response?.Resolution_Accepted === true) {

        console.log("✅ Training marked successful because resolution was accepted.");
        return {
          ...updatedState,

          status: 'completed', // mark training as successful
        };
      }
    }

    return { ...updatedState };
  };
};


// --- Agent Definitions using Specific Models ---a
const scenarioGenerator = makeAgentNode<ScenarioGeneratorSchema>({
  name: "Scenario_Generator",
  responseSchema: scenarioGeneratorSchema,
  model: scenarioLLM,
  systemPrompt: scenarioGeneratorPromptXML,
  returnFunction: function (state: typeof TrainingState.State, response: ScenarioGeneratorSchema) {
    return {
      ...state,
      scenario: response,
    };
  }
});

const personaGenerator = makeAgentNode<PersonaGeneratorSchema>({
  name: "Persona_Generator",
  responseSchema: personaGeneratorSchema,
  model: personaLLM,
  systemPrompt: personaGeneratorPromptXML,
  returnFunction: function (state: typeof TrainingState.State, response: PersonaGeneratorSchema) {
    return {
      ...state,
      persona: response,
    };
  }
});

const customerSimulator = makeAgentNode<CustomerSimulatorSchema>({
  name: "Customer_Simulator",
  responseSchema: customerSimulatorSchema,
  model: customerLLM,
  systemPrompt: customerSimulatorPromptXML, // System prompt omitted for brevity.
  returnFunction: function (state: typeof TrainingState.State, response: CustomerSimulatorSchema) {
    return {
      ...state,
      conversationHistory: [...state.conversationHistory,
      new AIMessage(response.Message),
      ]
    };
  }
});

const feedbackAgent = makeAgentNode<FeedbackSchema>({
  name: "Training_Feedback_Agent",
  responseSchema: feedbackSchema,
  model: feedbackLLM, // Choose a more reflective/analytical model if available
  systemPrompt: feedbackGeneratorPromptXML,
  returnFunction: function (state: typeof TrainingState.State, response: FeedbackSchema) {

    const updatedState = {
      ...state,
      feedback: response
    };

    console.log(`FEEDBACK AGENT UPDATED STATE: ${updatedState}`)

    return updatedState;
  }
});

// Conditional logic to check if scenario and persona exist
const checkStateInitial = (state: StateType<typeof TrainingState.spec>) => {

  if (state.status === "completed") return "feedback_generator";

  if (state.scenario && state.persona) {
    console.log("Scenario and Persona exist. Skipping generators.");
    return "customer_simulator";
  } if (state.scenario && !state.persona) return "persona_generator";
  if (!state.scenario && state.persona) return "scenario_generator";


  else {
    console.log("Scenario and Persona do not exist. Starting generation.");
    return "scenario_generator";
  }
};

// --- Graph Workflow Definition ---
export const workflow = new StateGraph(TrainingState)
  .addNode("scenario_generator", scenarioGenerator)
  .addNode("persona_generator", personaGenerator)
  .addNode("customer_simulator", customerSimulator)
  .addNode("feedback_generator", feedbackAgent)
  .addConditionalEdges(
    START,
    checkStateInitial,
    {
      "customer_simulator": "customer_simulator",
      "scenario_generator": "scenario_generator",
      "persona_generator": "persona_generator",
      "feedback_generator": "feedback_generator",
    }
  )
  .addConditionalEdges(
    "scenario_generator",
    (state: StateType<typeof TrainingState.spec>) => {
      if (!state.persona) return "persona_generator";
      else return "customer_simulator";
    },
    {
      "persona_generator": "persona_generator",
      "customer_simulator": "customer_simulator"
    }
  )

  .addConditionalEdges(
    "customer_simulator",
    (state: StateType<typeof TrainingState.spec>) => {
      console.log("LINE 236  Customer Simulator State Status:", state.status);
      if (state.status !== "completed" || state.status == undefined) { return "end"; }
      else { return "feedback_generator"; }
    },
    {
      'end': END,
      'feedback_generator': 'feedback_generator'
    }
  )
  .addEdge("persona_generator", "customer_simulator")
  .addEdge("feedback_generator", END)
  .compile();



// CUSTOM SCENARIO AND PERSONA GENERATION DEPENDENCIES

// --- Define the makeAgentNode Factory Function ---
const makeRefineAgentNodes = <T>({
  name,
  systemPrompt,
  responseSchema,
  model,
  returnFunction,
}: {
  name: string;
  systemPrompt: (state: typeof ScenarioPersonaRefineState.State) => string;
  responseSchema: z.ZodType<T>;
  model: ChatGoogleGenerativeAI;
  returnFunction: (
    state: typeof ScenarioPersonaRefineState.State,
    response: any
  ) => Partial<typeof ScenarioPersonaRefineState.State>;
}) => {
  return async function (
    state: typeof ScenarioPersonaRefineState.State
  ): Promise<Partial<typeof ScenarioPersonaRefineState.State>> {
    console.log(`-> Agent ${name} is invoked...`);
    const myModel = model.withStructuredOutput(responseSchema);
    const prompt = systemPrompt(state);

    const response = await myModel.invoke([
      new HumanMessage(prompt),
    ]);

    const updatedState = returnFunction(state, response);

    return updatedState;
  };
};

export const ScenarioPersonaRefineState = Annotation.Root({
  scenario: Annotation<ScenarioGeneratorSchema>(),
  persona: Annotation<PersonaGeneratorSchema>(),
  flag: Annotation<'scenario' | 'persona'>(),
  customScenario: Annotation<string>(),
  customPersona: Annotation<string>(),
});

const scenarioRefiner = makeRefineAgentNodes({
  name: "Scenario_Refiner",
  responseSchema: scenarioGeneratorSchema,
  model: scenarioLLM, // Same model as scenarioGenerator
  systemPrompt: (state: typeof ScenarioPersonaRefineState.State) => `
<SYSTEM>
You are the <ROLE>Scenario Refinement Agent</ROLE>.  
Your task is to take the user's raw input describing a short-term rental (STR) guest situation and transform it into a fully structured, detailed, and correct training scenario.  
Make it professional, realistic, and aligned with the scenario schema.
</SYSTEM>

<INSTRUCTIONS>
  <RULES>
    <Rule>Expand the raw description into a well-structured scenario that includes business context, constraints, challenges, and success criteria.</Rule>
    <Rule>Ensure the output strictly matches the structured schema below.</Rule>
    <Rule>Use professional tone appropriate for training purposes.</Rule>
  </RULES>

  <INPUT>
    <Raw_Description>${JSON.stringify(state.customScenario, null, 2)}</Raw_Description>
  </INPUT>

  <OUTPUT_SCHEMA>
    <Scenario>
      <Scenario_Title>string</Scenario_Title>
      <Business_Context>string</Business_Context>
      <Guest_Situation>string</Guest_Situation>
      <Constraints_and_Policies>list[string]</Constraints_and_Policies>
      <Expected_VA_Challenges>list[string]</Expected_VA_Challenges>
      <Difficulty_Level>Easy | Medium | Hard</Difficulty_Level>
      <Success_Criteria>list[string]</Success_Criteria>
    </Scenario>
  </OUTPUT_SCHEMA>
</INSTRUCTIONS>
`,
  returnFunction: function (state: typeof ScenarioPersonaRefineState.State, response: any) {
    return {
      ...state,
      scenario: response,
      refinedScenario: true,
    };
  }
});

const personaRefiner = makeRefineAgentNodes({
  name: "Persona_Refiner",
  responseSchema: personaGeneratorSchema,
  model: personaLLM, // Same model as personaGenerator
  systemPrompt: (state: typeof ScenarioPersonaRefineState.State) => `
<SYSTEM>
You are the <ROLE>Persona Refinement Agent</ROLE>.  
Your task is to take the user's raw input describing a guest or vendor persona and transform it into a fully structured, detailed, and realistic training persona.  
Ensure the output aligns with the structured schema and reflects realistic traits, demographics, and behavior.
</SYSTEM>

<INSTRUCTIONS>
  <RULES>
    <Rule>Refine the raw description into a complete and structured persona object.</Rule>
    <Rule>Ensure realistic personality traits, communication style, emotional tone, expectations, and escalation behavior.</Rule>
    <Rule>Output must strictly match the structured schema below.</Rule>
  </RULES>

  <INPUT>
    <Raw_Persona_Description>${JSON.stringify(state.customPersona, null, 2)}</Raw_Persona_Description>
  </INPUT>

  <OUTPUT_SCHEMA>
    <Persona>
      <Name>string</Name>
      <Demographics>string</Demographics>
      <Personality_Traits>list[string]</Personality_Traits>
      <Communication_Style>string</Communication_Style>
      <Emotional_Tone>string</Emotional_Tone>
      <Expectations>list[string]</Expectations>
      <Escalation_Behavior>list[string]</Escalation_Behavior>
    </Persona>
  </OUTPUT_SCHEMA>
</INSTRUCTIONS>
`,
  returnFunction: function (state: typeof ScenarioPersonaRefineState.State, response: any) {
    return {
      ...state,
      persona: response,
      refinedPersona: true,
    };
  }
});


export const scenarioPersonaRefineWorkflow = new StateGraph(ScenarioPersonaRefineState)
  .addNode("scenario_refiner", scenarioRefiner)
  .addNode("persona_refiner", personaRefiner)
  .addConditionalEdges(
    START,
    (state: StateType<typeof ScenarioPersonaRefineState.spec>) => {
      if (state.flag === "scenario") return "scenario_refiner";
      if (state.flag === "persona") return "persona_refiner";
      return END
    },
    {
      scenario_refiner: "scenario_refiner",
      persona_refiner: "persona_refiner",
      END: END,
    }
  )
  .addEdge("scenario_refiner", END)
  .addEdge("persona_refiner", END)
  .addEdge(START, END)
  .compile();



// ============================================================================
// MESSAGE RATING AND SUGGESTIONS WORKFLOW
// ============================================================================

// Schema for message rating
export const messageRatingSchema = z.object({
  Message_Rating: z.object({
    Rating: z.number().int().min(0).max(10, {
      message: 'Rating must be an integer between 0 and 10',
    }),
    Rationale: z.string().min(1, {
      message: 'Rationale must be a non-empty string',
    }),
  }),
});
export type MessageRatingSchema = z.infer<typeof messageRatingSchema>;

export const alternativeSuggestionsSchema = z.object({
  Alternative_Suggestions: z
    .array(
      z.object({
        Response: z.string().min(1, {
          message: 'Response must be a non-empty string',
        }),
        Explanation: z.string().min(1, {
          message: 'Explanation must be a non-empty string',
        }),
      }),
    )
    .min(0, {
      message: 'If a message is appropriate, no suggestion is necessary',
    })
    .max(3, {
      message: 'No more than three suggestions are allowed',
    }),
});

export type AlternativeSuggestionsSchema = z.infer<typeof alternativeSuggestionsSchema>;


// State for message rating workflow
export const MessageRatingState = Annotation.Root({
  conversationHistory: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
  latestUserMessage: Annotation<MessageContent>(),
  scenario: Annotation<ScenarioGeneratorSchema | null>(),
  persona: Annotation<PersonaGeneratorSchema | null>(),
  rating: Annotation<MessageRatingSchema | null>(),
  suggestions: Annotation<AlternativeSuggestionsSchema | null>(),
  shouldProvideAlternatives: Annotation<boolean>()
});

const makeMessageRatingAgentNodes = <T>({
  name,
  systemPrompt,
  responseSchema,
  model,
  returnFunction,
}: {
  name: string;
  systemPrompt: (state: typeof MessageRatingState.State) => string;
  responseSchema: z.ZodType<T>;
  model: ChatGoogleGenerativeAI;
  returnFunction: (
    state: typeof MessageRatingState.State,
    response: any
  ) => Partial<typeof MessageRatingState.State>;
}) => {
  return async function (
    state: typeof MessageRatingState.State
  ): Promise<Partial<typeof MessageRatingState.State>> {
    console.log(`-> Agent ${name} is invoked...`);
    const myModel = model.withStructuredOutput(responseSchema);
    const prompt = systemPrompt(state);

    const response = await myModel.invoke([
      new HumanMessage(prompt),
    ]);

    const updatedState = returnFunction(state, response);

    return updatedState;
  };
};

const messageRatingAgent = makeMessageRatingAgentNodes<MessageRatingSchema>({
  name: "Message_Rating_Agent",
  responseSchema: messageRatingSchema,
  model: feedbackLLM,
  systemPrompt: messageRatingPromptXML,
  returnFunction: function (state: typeof MessageRatingState.State, response: MessageRatingSchema) {
    return {
      ...state,
      rating: response,
    };
  }
});

const alternativeSuggestionsAgent = makeMessageRatingAgentNodes<AlternativeSuggestionsSchema>({
  name: "Alternative_Suggestions_Agent",
  responseSchema: alternativeSuggestionsSchema,
  model: feedbackLLM,
  systemPrompt: alternativeSuggestionsPromptXML,
  returnFunction: function (state: typeof MessageRatingState.State, response: AlternativeSuggestionsSchema) {
    return {
      ...state,
      suggestions: response,
    };
  }
});


// Conditional edge to check if alternatives are needed
const checkIfAlternativesNeeded = (state: typeof MessageRatingState.State) => {
  const threshold = 5;
  if (state.shouldProvideAlternatives || (state.rating && state.rating.Message_Rating.Rating < threshold)) {
    return "provide_alternatives";
  }
  return "end";
};

// Export the new workflow
export const messageRatingWorkflow = new StateGraph(MessageRatingState)
  .addNode("rate_message", messageRatingAgent)
  .addNode("provide_alternatives", alternativeSuggestionsAgent)
  .addEdge(START, "rate_message")
  .addConditionalEdges(
    "rate_message",
    checkIfAlternativesNeeded,
    {
      "provide_alternatives": "provide_alternatives",
      "end": END
    }
  )
  .addEdge("provide_alternatives", END)
  .compile();


//     // ================================================================
//     // Multiple Session Feedback Flow
//     // ================================================================
/* -------------------------------------------------------------------------- */
/*                             Zod Schema Definition                           */
/* -------------------------------------------------------------------------- */
export const groupFeedbackSchema = z.object({
  summary: z.string().describe("Overall summary of the group's performance across all sessions"),
  strengths: z.array(z.string()).describe("Common strengths observed across sessions"),
  weaknesses: z.array(z.string()).describe("Common weaknesses or areas needing improvement"),
  recommendations: z.array(z.string()).describe("Actionable recommendations for the trainee"),
  scores: z.object({
    communication: z.number().min(0).max(10).describe("Communication effectiveness score"),
    empathy: z.number().min(0).max(10).describe("Empathy and emotional intelligence score"),
    accuracy: z.number().min(0).max(10).describe("Accuracy and attention to detail score"),
    overall: z.number().min(0).max(10).describe("Overall performance score"),
  }),
  guest_prioritization: z.object({
    analysis: z.string().describe("Analysis of guest prioritization and multi-thread handling"),
    behavior_pattern: z.string().describe("Pattern of prioritization observed"),
    suggestions: z.array(z.string()).describe("Suggestions to improve prioritization"),
    score: z.number().min(0).max(10).describe("Numerical score for prioritization"),
  }),
  responsiveness: z.object({
    analysis: z.string().describe("Analysis of trainee response times across threads"),
    avg_response_time_sec: z.number().describe("Average response time in seconds"),
    variability: z.string().describe("How consistent were the response times"),
    suggestions: z.array(z.string()).describe("Suggestions to improve responsiveness"),
    score: z.number().min(0).max(10).describe("Numerical score for responsiveness"),
  }),
  session_breakdown: z.array(
    z.object({
      thread_title: z.string(),
      key_observations: z.array(z.string()),
      score: z.number().min(0).max(10),
      response_time_sec: z.number().optional(),
      prioritization_note: z.string().optional(),
    })
  ),
});

/* -------------------------------------------------------------------------- */
/*                            State Definition                                 */
/* -------------------------------------------------------------------------- */
export const FeedbackOnlyState = Annotation.Root({
  threads: Annotation<ThreadWithMessages[]>({
    reducer: (_, next) => next,
    default: () => [],
  }),
  groupFeedback: Annotation<any>(),
});

/* -------------------------------------------------------------------------- */
/*                            Feedback Node                                    */
/* -------------------------------------------------------------------------- */
export const groupFeedbackNode = async (
  state: StateType<typeof FeedbackOnlyState.spec>
) => {
  const { threads } = state;

  // Convert threads into YAML-like string
  const threadsYaml = threads
    .filter((t) => (t?.messages?.length ?? 0) > 0)
    .map((thread) => {
      const scenarioText =
        typeof thread.thread.scenario === "string"
          ? thread.thread.scenario
          : JSON.stringify(thread.thread.scenario);

      const personaText =
        typeof thread.thread.persona === "string"
          ? thread.thread.persona
          : JSON.stringify(thread.thread.persona);

      const messagesYaml = thread.messages
        ?.map((m, i, arr) => {
          let responseTimeSec = 0;
          if (i > 0 && arr[i - 1].createdAt) {
            const prev = new Date(arr[i - 1].createdAt).getTime();
            const curr = new Date(m.createdAt).getTime();
            responseTimeSec = (curr - prev) / 1000;
          }
          return `      - role: ${m.role}
        content: |-
          ${typeof m.parts === "string" ? m.parts : JSON.stringify(m.parts)}
        createdAt: "${m.createdAt}"
        responseTimeSec: ${responseTimeSec}`;
        })
        .join("\n");

      return `- thread_title: "${thread.thread.title}"
  scenario: |-
    ${scenarioText}
  persona: |-
    ${personaText}
  messages:
${messagesYaml}`;
    })
    .join("\n");

  // User prompt with YAML data
  const userPrompt = `
You are an expert hospitality training evaluator.

You are given multiple training sessions in YAML format.
Each session contains:
- scenario: the training scenario
- persona: guest information
- messages: full conversation with roles and timestamps, including response times

Analyze the trainee's performance from multiple perspectives:
1. Overall performance: communication, empathy, accuracy, overall.
2. Session-specific observations and scores.
3. Guest prioritization: did they handle urgent guests first? Were they switching threads logically or randomly?
4. Responsiveness: speed and consistency of replies. Highlight slow responses or delays.
5. Provide actionable recommendations for improvement.

Use the YAML data below as the source:

threads:
${threadsYaml}

Return ONLY a JSON object matching this Zod schema:
- summary
- strengths
- weaknesses
- recommendations
- scores
- guest_prioritization
- responsiveness
- session_breakdown
`;

  // Invoke LLM with structured output
  const response = await feedbackLLM
    .withStructuredOutput(groupFeedbackSchema)
    .invoke([{ role: "user", content: userPrompt }]);

  return { groupFeedback: response };
};

/* -------------------------------------------------------------------------- */
/*                        State Graph Workflow                                 */
/* -------------------------------------------------------------------------- */

export const groupFeedbackWorkflow = new StateGraph(FeedbackOnlyState)
  .addNode("group_feedback", groupFeedbackNode)
  .addEdge(START, "group_feedback")
  .addEdge("group_feedback", END)
  .compile();
