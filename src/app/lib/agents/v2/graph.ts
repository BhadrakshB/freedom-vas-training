// // Import necessary modules
// import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
// import { Command, MessagesAnnotation, START, StateGraph } from "@langchain/langgraph";
// import { z } from "zod";
// import { HumanMessage, AIMessage } from "@langchain/core/messages";
// import { customerLLM, personaLLM, scenarioLLM } from "./llms";



// // --- Define Agent Response Schemas (Structured Output) ---
// const customerSimulatorSchema = z.object({
//   initial_message: z
//     .string()
//     .describe("The first message the customer sends, derived from the scenario's guest situation."),
//   behavioral_traits: z
//     .array(z.string())
//     .describe("List of traits describing how the customer behaves during the interaction."),
//   likely_followups: z
//     .array(z.string())
//     .describe("Examples of possible follow-up responses depending on how the VA responds."),
//   escalation_path: z
//     .array(z.string())
//     .describe("Step-by-step escalation if the VA fails to resolve the issue."),
//   goto: z
//     .enum(["__end__"])
//     .describe("Always ends after generating the customer simulation."),
// });

// const scenarioGeneratorSchema =  z.object({
//   scenario_title: z
//     .string()
//     .describe("A short and descriptive title for the scenario."),
//   business_context: z
//     .string()
//     .describe("Why this situation occurs in the STR business."),
//   guest_situation: z
//     .string()
//     .describe("The incoming guest query or issue in the scenario."),
//   constraints_and_policies: z
//     .array(z.string())
//     .describe("List of policies, rules, and constraints relevant to this scenario."),
//   expected_va_challenges: z
//     .array(z.string())
//     .describe("List of key challenges the VA will face in this scenario."),
//   difficulty_level: z
//     .enum(["Easy", "Medium", "Hard"])
//     .describe("The overall complexity of the scenario."),
//   success_criteria: z
//     .array(z.string())
//     .describe("List of conditions that define a good VA response."),
//   goto: z
//     .enum(["__end__"])
//     .describe("Always ends after generating the scenario."),
// });

// const personaGeneratorSchema = z.object({
//   name: z
//     .string()
//     .describe("Generated guest/vendor name."),
//   demographics: z
//     .string()
//     .describe("Age, travel purpose, or background relevant to the scenario."),
//   personality_traits: z
//     .array(z.string())
//     .describe("List of personality traits of the guest/vendor."),
//   communication_style: z
//     .string()
//     .describe("How they typically communicate (formal, casual, concise, emotional)."),
//   emotional_tone: z
//     .string()
//     .describe("The starting mood and how it may shift during the interaction."),
//   expectations: z
//     .array(z.string())
//     .describe("What the guest/vendor wants to achieve."),
//   escalation_behavior: z
//     .array(z.string())
//     .describe("How they react if things go wrong."),
//   goto: z
//     .enum(["__end__"])
//     .describe("Always ends after generating the persona."),
// });

// // --- Define the makeAgentNode Factory Function ---
// type MakeAgentNodeParams = {
//   name: string;
//   systemPrompt: string;
//   responseSchema: z.ZodObject<any>; // Adjust type as needed for specific schemas
//   model: ChatGoogleGenerativeAI; // Accept the specific model instance
// };

// const makeAgentNode = ({
//   name,
//   systemPrompt,
//   responseSchema,
//   model,
// }: MakeAgentNodeParams) => {
//   return async (state: typeof MessagesAnnotation.State) => {
//     const messages = [new HumanMessage(systemPrompt), ...state.messages];

//     try {
//       // Use the specific model instance passed to this agent
//       const structuredModel = model.withStructuredOutput(responseSchema, {
//         name: `${name}_router`,
//       });
//       const response = await structuredModel.invoke(messages);

//       const aiMessage = new AIMessage({
//         content: `<${name}_response>${response.response}</${name}_response>`,
//         name: name,
//       });

//       if (response.goto === "__end__") {
//         return new Command({
//           goto: "__end__",
//           update: { messages: aiMessage },
//         });
//       } else {
//         // Type assertion for goto, assuming it matches destinations
//         return new Command({
//           goto: response.goto as string,
//           update: { messages: aiMessage },
//         });
//       }
//     } catch (error) {
//       console.error(`Error in ${name} node:`, error);
//       // Handle error gracefully, maybe route to end or a specific error node
//       return new Command({
//         goto: "__end__",
//         update: {
//           messages: new AIMessage({
//             content: `Error occurred in ${name}`,
//             name: name,
//           }),
//         },
//       });
//     }
//   };
// };

// // --- Agent Definitions using Specific Models ---

// const customerSimulator = makeAgentNode({
//   name: "Customer_Simulator",
//   responseSchema: customerSimulatorSchema,
//   model: customerLLM, // Use the specific model instance
//   systemPrompt: `
//     <SYSTEM>
//   You are the <ROLE>Customer Simulating Agent</ROLE>.  
//   Your role is to roleplay as the guest or vendor during a training simulation for Virtual Assistants (VAs).  
//   Use the <Scenario> and <Persona> inputs to simulate realistic dialogue and behavior.  
// </SYSTEM>

// <INSTRUCTIONS>
//   <RULES>
//     <Rule>Always stay in character as described by the Persona.</Rule>
//     <Rule>Initial message must match the Guest_Situation in the Scenario.</Rule>
//     <Rule>Follow-ups must vary depending on how the VA responds (good vs poor performance).</Rule>
//     <Rule>Escalation behavior must align with Persona traits.</Rule>
//     <Rule>Output must strictly follow the structured schema below.</Rule>
//   </RULES>

//   <INPUTS>
//     <Scenario>From Scenario Generating Agent</Scenario>
//     <Persona>From Persona Generating Agent</Persona>
//   </INPUTS>

//   <OUTPUT_SCHEMA>
//     <Customer_Simulation>
//       <Initial_Message>string</Initial_Message>
//       <Behavioral_Traits>list[string]</Behavioral_Traits>
//       <Likely_FollowUps>list[string]</Likely_FollowUps>
//       <Escalation_Path>list[string]</Escalation_Path>
//     </Customer_Simulation>
//   </OUTPUT_SCHEMA>
// </INSTRUCTIONS>

// <EXAMPLE_OUTPUT>
//   <Customer_Simulation>
//     <Initial_Message>"Hi, I just landed and I'd like to check in at 10 AM. Can you arrange that?"</Initial_Message>
//     <Behavioral_Traits>
//       <Trait>Polite but impatient.</Trait>
//       <Trait>Values convenience over strict rules.</Trait>
//     </Behavioral_Traits>
//     <Likely_FollowUps>
//       <FollowUp>If VA confirms → "Perfect, thank you so much!"</FollowUp>
//       <FollowUp>If VA declines politely → "That's inconvenient. Can you at least store my luggage?"</FollowUp>
//       <FollowUp>If VA delays response → "Hello? I've been waiting, this is urgent."</FollowUp>
//     </Likely_FollowUps>
//     <Escalation_Path>
//       <Step>Repeated messages in short intervals.</Step>
//       <Step>Expresses frustration about service.</Step>
//       <Step>Threatens bad review or cancellation if not resolved.</Step>
//     </Escalation_Path>
//   </Customer_Simulation>
// </EXAMPLE_OUTPUT>


//   `.trim(),
// });
// const scenarioGenerator = makeAgentNode({
//   name: "Scenario_Generator",
//   responseSchema: scenarioGeneratorSchema,
//   model: scenarioLLM, // Use the specific model instance
//   systemPrompt: `
//     <SYSTEM>
//   You are the <ROLE>Scenario Generating Agent</ROLE>.  
//   Your task is to generate realistic short-term rental (STR) training scenarios for Virtual Assistants (VAs).  
//   Each scenario must be grounded in STR operations such as guest communication, task management, vendor coordination, and policy enforcement.  
// </SYSTEM>

// <INSTRUCTIONS>
//   <RULES>
//     <Rule>Output must strictly follow the structured schema below.</Rule>
//     <Rule>Scenarios must include operational context, policies, and expected VA challenges.</Rule>
//     <Rule>Difficulty should vary between Easy, Medium, and Hard.</Rule>
//   </RULES>

//   <OUTPUT_SCHEMA>
//     <Scenario>
//       <Scenario_Title>string</Scenario_Title>
//       <Business_Context>string</Business_Context>
//       <Guest_Situation>string</Guest_Situation>
//       <Constraints_and_Policies>list[string]</Constraints_and_Policies>
//       <Expected_VA_Challenges>list[string]</Expected_VA_Challenges>
//       <Difficulty_Level>Easy | Medium | Hard</Difficulty_Level>
//       <Success_Criteria>list[string]</Success_Criteria>
//     </Scenario>
//   </OUTPUT_SCHEMA>
// </INSTRUCTIONS>

// <EXAMPLE_OUTPUT>
//   <Scenario>
//     <Scenario_Title>Double Booking on Arrival</Scenario_Title>
//     <Business_Context>Two guests arrive at the same time due to a calendar sync error.</Business_Context>
//     <Guest_Situation>"I just checked in and another family is already in the apartment."</Guest_Situation>
//     <Constraints_and_Policies>
//       <Policy>Refunds must be approved by manager.</Policy>
//       <Policy>Alternative accommodation should be offered if available.</Policy>
//     </Constraints_and_Policies>
//     <Expected_VA_Challenges>
//       <Challenge>De-escalating guest frustration.</Challenge>
//       <Challenge>Offering alternative accommodation.</Challenge>
//       <Challenge>Escalating refund request correctly.</Challenge>
//     </Expected_VA_Challenges>
//     <Difficulty_Level>Hard</Difficulty_Level>
//     <Success_Criteria>
//       <Criterion>VA acknowledges politely and empathetically.</Criterion>
//       <Criterion>VA provides immediate solution options.</Criterion>
//       <Criterion>VA escalates refund to manager properly.</Criterion>
//     </Success_Criteria>
//   </Scenario>
// </EXAMPLE_OUTPUT>


//   `.trim(),
// });

// const personaGenerator = makeAgentNode({
//   name: "Persona_Generator",
//   responseSchema: personaGeneratorSchema,
//   model: personaLLM, // Use the specific model instance
//   systemPrompt: `
//     <SYSTEM>
//   You are the <ROLE>Persona Generating Agent</ROLE>.  
//   Your task is to generate a guest/vendor persona based on the given <Scenario>.  
//   This persona will determine how the customer behaves in the training simulation.  
// </SYSTEM>

// <INSTRUCTIONS>
//   <RULES>
//     <Rule>Persona must align with the scenario's context and challenges.</Rule>
//     <Rule>Output must strictly follow the structured schema below.</Rule>
//     <Rule>Include realistic personality traits, communication style, and escalation behaviors.</Rule>
//   </RULES>

//   <INPUT>
//     <Scenario>Provided by Scenario Generating Agent</Scenario>
//   </INPUT>

//   <OUTPUT_SCHEMA>
//     <Persona>
//       <Name>string</Name>
//       <Demographics>string</Demographics>
//       <Personality_Traits>list[string]</Personality_Traits>
//       <Communication_Style>string</Communication_Style>
//       <Emotional_Tone>string</Emotional_Tone>
//       <Expectations>list[string]</Expectations>
//       <Escalation_Behavior>list[string]</Escalation_Behavior>
//     </Persona>
//   </OUTPUT_SCHEMA>
// </INSTRUCTIONS>

// <EXAMPLE_OUTPUT>
//   <Persona>
//     <Name>Sarah Thompson</Name>
//     <Demographics>34-year-old business traveler in town for a conference.</Demographics>
//     <Personality_Traits>
//       <Trait>Polite but assertive.</Trait>
//       <Trait>Values punctuality.</Trait>
//       <Trait>Easily frustrated by delays.</Trait>
//     </Personality_Traits>
//     <Communication_Style>Concise, professional, expects quick responses.</Communication_Style>
//     <Emotional_Tone>Starts polite, becomes frustrated if inconvenienced.</Emotional_Tone>
//     <Expectations>
//       <Expectation>Early check-in before meetings.</Expectation>
//       <Expectation>Fast and professional communication.</Expectation>
//     </Expectations>
//     <Escalation_Behavior>
//       <Step>Complains politely first.</Step>
//       <Step>Becomes impatient after delays.</Step>
//       <Step>Threatens to cancel or leave negative review if not resolved.</Step>
//     </Escalation_Behavior>
//   </Persona>
// </EXAMPLE_OUTPUT>

//   `.trim(),
// });


// // Types from schemas
// export type Scenario = z.infer<typeof scenarioGeneratorSchema>;
// export type Persona = z.infer<typeof personaGeneratorSchema>;
// export type CustomerSimulation = z.infer<typeof customerSimulatorSchema>;

// // Define the roles for conversation messages
// type MessageRole = 'user' | 'assistant' | 'system';

// // Define the structure of a single message
// interface Message {
//     role: MessageRole;
//     content: string;
// }

// // Training state shape
// interface TrainingState {
//   scenario: Scenario | null;
//   persona: Persona | null;
//   conversationHistory: Message[];

// }

// // Router function: decides next node based on state
// // export const routerNode = async (state: TrainingState) => {
// //   if (!state.scenario) {
// //     return new Command({ goto: "Scenario_Generator" });
// //   }
// //   if (!state.persona) {
// //     return new Command({ goto: "Persona_Generator" });
// //   }
// //   return new Command({ goto: "Customer_Simulator" });
// // };

// const customerAgent = async (state: TrainingState): Promise<Partial<TrainingState>> => {
//   console.log("Executing Customer Aagent...");
  
//   // Initialize history from the state or as a new array
//   const history = state.conversationHistory || [];
//   const

//   // Add the user's input as a message with the 'user' role
//   history.push({ role: 'user', content: state.input });

//   // Your LLM call logic here.
//   const agentResponse = `Agent A's response for: ${state.input}`;

//   // Add the agent's response as a message with the 'assistant' role
//   history.push({ role: 'assistant', content: agentResponse });

//   const route_to = state.input.includes('sequence') ? 'sequence' : 'single';

//   return {
//       agent_a_output: agentResponse,
//       route_to: route_to,
//       conversationHistory: history // Return the updated history
//   };
// };

// // --- Conditional Routing Logic ---
// // Function to determine the starting node based on initial messages
// const routeFromStart = (
//   state: typeof MessagesAnnotation.State
// )=> {
//   // Check if the initial messages contain enough context for simulation
//   // This is a simplified check. You might want more robust parsing.
//   const messages = state.messages;
//   const hasScenario = messages.some((msg) => {
//     const content =
//       typeof msg.content === "string"
//         ? msg.content
//         : JSON.stringify(msg.content);
//     return content.includes("<Scenario_Generator_response>");
//   });
//   const hasPersona = messages.some((msg) => {
//     const content =
//       typeof msg.content === "string"
//         ? msg.content
//         : JSON.stringify(msg.content);
//     return content.includes("<Persona_Generator_response>");
//   });

//   if (hasScenario && hasPersona) {
//     // If both scenario and persona are present in history, start with Customer Simulator
//     return "Customer_Simulator";
//   } else {
//     // Otherwise, start with Scenario Generator to create them
//     return "Scenario_Generator";
//   }
// };

// // --- Define the Graph ---
// const workflow = new StateGraph(MessagesAnnotation)
//   // .addNode("Customer_Simulator", customerSimulator, { ends: ["__end__"] })
//   .addNode("Scenario_Generator", scenarioGenerator, {
//     ends: ["Persona_Generator"],
//   })
//   .addNode("Persona_Generator", personaGenerator, { ends: ["__end__"] })
//   // .addConditionalEdges(START, routeFromStart)
//   // Note: The conditional start from __start__ based on user input needs
//   // more complex logic using addConditionalEdges.
//   // This example shows the default path (Scenario -> Persona).
//   .addEdge("__start__", "Scenario_Generator") // Default start
//   .addEdge("Scenario_Generator", "Persona_Generator")
//   .addEdge("Persona_Generator", "__end__")
//   .compile(); // Compile the graph

// // Export the compiled workflow for use elsewhere
// export default workflow;

// // --- Example Usage ---
// // You would typically invoke this from an application layer.
// // Example: Generate Scenario -> Persona
// // (async () => {
// //   const stream = await workflow.stream({
// //     messages: [{ role: "user", content: "Generate a customer journey for a new eco-friendly cleaning product." }],
// //   });
// //   for await (const chunk of stream) {
// //     console.log("Chunk:", JSON.stringify(chunk, null, 2));
// //   }
// // })().catch(console.error);

// console.log(
//   "Customer Agent Workflow (TypeScript) defined using Gemini models."
// );
