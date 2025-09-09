import { AIMessage, BaseMessage, HumanMessage } from "@langchain/core/messages";
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
import { customerSimulatorPromptJSON, customerSimulatorPromptXML, feedbackGeneratorPromptXML, personaGeneratorPromptXML, scenarioGeneratorPromptXML } from "./prompts";


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

export type TrainingStateType = 'start' | 'ongoing' | 'completed' | 'error';

export const TrainingState = Annotation.Root({
  conversationHistory: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
  scenario: Annotation<ScenarioGeneratorSchema>(
    {
    reducer: (a,b) => a,
  }
  ),
  persona: Annotation<PersonaGeneratorSchema>(
    {
    reducer: (a,b) => a,
  }
  ),
  status: Annotation<TrainingStateType>(),
  feedback: Annotation<FeedbackSchema>(),
  customScenario: Annotation<string>(),
  customPersona: Annotation<string>(),
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

    console.log(`<- Agent ${name} response:`, response);

    var updatedState = returnFunction(state, response);

    console.log(`🔄 Updated State from ${name}:`, JSON.stringify(updatedState, null, 2));
    
    // ✅ Special handling for Customer Agent
    if (name === "Customer_Simulator") {
      if (response?.Resolution_Accepted === true) {

        console.log("✅ Training marked successful because resolution was accepted.");
        return  {
          ...updatedState,

          status: 'completed', // mark training as successful
        };
      }
    }

    return {...updatedState};
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
console.log(`Customer Simulator State:`, JSON.stringify({
      scenario: state.scenario,
      persona: state.persona,
      conversationHistoryLength: state.conversationHistory.length,
      status: state.status
    }, null, 2));
    console.log(`Customer Simulator Response:`, JSON.stringify(response, null, 2));
    
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
  returnFunction: function (state: typeof TrainingState.State, response: any) {
    return {
      ...state,
      trainingFeedback: response // Save structured feedback in state
    };
  }
});

// Conditional logic to check if scenario and persona exist
const checkState = (state: StateType<typeof TrainingState.spec>) => {
  if (state.scenario && state.persona) {
    console.log("Scenario and Persona exist. Skipping generators.");
    return "customer_simulator";
  } else {
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
    checkState, 
    { 
      "customer_simulator": "customer_simulator", 
      "scenario_generator": "scenario_generator" 
    }
  ) 
  .addConditionalEdges( 
    "customer_simulator", 
    (state: StateType<typeof TrainingState.spec>) => {
      if (state.status === "completed" || state.status == undefined) { return END; } 
      else { return "feedback_generator"; }
    },
  ) 
  .addEdge(START, "scenario_generator") 
  .addEdge("scenario_generator", "persona_generator") 
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
  systemPrompt: (state: typeof ScenarioState.State) => string;
  responseSchema: z.ZodType<T>;
  model: ChatGoogleGenerativeAI;
  returnFunction: (
    state: typeof ScenarioState.State,
    response: any
  ) => Partial<typeof ScenarioState.State>;
}) => {
  return async function (
    state: typeof ScenarioState.State
  ): Promise<Partial<typeof ScenarioState.State>> {
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

const ScenarioState = Annotation.Root({
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
  systemPrompt: (state: typeof ScenarioState.State) => `
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
  returnFunction: function (state: typeof ScenarioState.State, response: any) {
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
  systemPrompt: (state: typeof ScenarioState.State) => `
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
  returnFunction: function (state: typeof ScenarioState.State, response: any) {
    return {
      ...state,
      persona: response,
      refinedPersona: true,
    };
  }
});


export const scenarioPersonaRefineWorkflow = new StateGraph(ScenarioState)
  .addNode("scenario_refiner", scenarioRefiner)
  .addNode("persona_refiner", personaRefiner)
  .addConditionalEdges(
    START,
    (state: StateType<typeof ScenarioState.spec>) => {
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