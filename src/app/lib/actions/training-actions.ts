'use server'

import { AIMessage, BaseMessage, MessageContent } from "@langchain/core/messages";
import { TrainingError, ERROR_MESSAGES } from "../error-handling";
import { ScenarioGeneratorSchema, PersonaGeneratorSchema, scenarioPersonaRefineWorkflow, workflow, TrainingStateType, FeedbackSchema } from "@/lib/agents/v2/graph_v2"

interface StartTrainingResponse {
  scenario?: ScenarioGeneratorSchema,
  guestPersona?: PersonaGeneratorSchema,
  messages: BaseMessage[],
  finalOutput?: MessageContent,
  error?: string;
  errorType?: string;
  errorCode?: string;
}

interface StartTrainingRequest {
  customScenario?: string;
  customPersona?: string;
}

export async function startTrainingSession(request?: StartTrainingRequest): Promise<StartTrainingResponse> {
  try {

    const data = await workflow.invoke({
      conversationHistory: [],
      customScenario: request?.customScenario,
      customPersona: request?.customPersona,
    });

    console.log("=== WORKFLOW STATE RETURNED ===");
    console.log("Full State:", JSON.stringify(data, null, 2));
    console.log("Messages:", data?.conversationHistory?.length || 0);
    console.log("Scenario:", data?.scenario ? "Present" : "Not present");
    console.log("Persona:", data?.persona ? "Present" : "Not present");
    console.log("===============================");

    const messages = data?.conversationHistory || [];
    const lastMessage =
      messages[messages.length - 1]?.content || "Workflow completed.";

    return {
      // state: data,
      scenario: data?.scenario ,
      guestPersona: data?.persona,
      messages: data?.conversationHistory,
      finalOutput: lastMessage,
    }
  } catch (error) {
    console.error("Error in startWorkflow API:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred.";
    return {
      messages: [],
      error: errorMessage,
    }
  }
}


interface UpdateTrainingRequest {
  scenario?: ScenarioGeneratorSchema,
  guestPersona?: PersonaGeneratorSchema,
  messages: BaseMessage[],
}

interface UpdateTrainingResponse {
  scenario?: ScenarioGeneratorSchema,
  guestPersona?: PersonaGeneratorSchema,
  messages: BaseMessage[],
  guestResponse: MessageContent,
  status: TrainingStateType,
  feedback?: FeedbackSchema,
  error?: string;
  errorType?: string;
  errorCode?: string;
}

export async function updateTrainingSession(request: UpdateTrainingRequest): Promise<UpdateTrainingResponse> {
  try {
    // Validate required fields
    if (!request.scenario || typeof request.scenario !== "object") {
      throw new TrainingError(
        "Scenario is required to update training session",
        'validation',
        'medium',
        'MISSING_SCENARIO'
      );
    }

    if (!request.guestPersona || typeof request.guestPersona !== "object") {
      throw new TrainingError(
        "Guest persona is required to update training session",
        'validation',
        'medium',
        'MISSING_PERSONA'
      );
    }

    if (!request.messages || !Array.isArray(request.messages)) {
      throw new TrainingError(
        "Conversation history is required to update training session",
        'validation',
        'medium',
        'MISSING_CONVERSATION_HISTORY'
      );
    }

    console.log(`Updating training session with ${request.messages.length} messages`);

    // Create guest agent and process conversation
    const data = await workflow.invoke({
      conversationHistory: request.messages,
      persona: request.guestPersona,
      scenario: request.scenario,
    });

    console.log("=== WORKFLOW STATE RETURNED ===");
    console.log("Full State:", JSON.stringify(data, null, 2));
    console.log("Messages:", data?.conversationHistory?.length || 0);
    console.log("Scenario:", data?.scenario ? "Present" : "Not present");
    console.log("Persona:", data?.persona ? "Present" : "Not present");
    console.log("===============================");

    const messages = data?.conversationHistory || [];
    const lastMessage =
      messages[messages.length - 1]?.content;

    return {
      // state: data,
      scenario: data?.scenario,
      guestPersona: data?.persona,
      messages: data?.conversationHistory,
      guestResponse: lastMessage,
      status: data?.status || 'in_progress',
      feedback: data?.feedback,
      
    }

  } catch (error) {
    console.error("Update training session error:", error);

    if (error instanceof TrainingError) {
      return {
        guestResponse: "",
        messages: request.messages,
        error: error.message,
        status: 'error',
        feedback: undefined,
        errorType: error.type,
        errorCode: error.code,
      };
    }

    return {
      guestResponse: "",
      messages: request.messages,
      error: error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR,
      errorType: 'unknown',
      status: 'error',
      feedback: undefined,
    };
  }
}

interface EndTrainingRequest {
  sessionId: string;
  userId: string;
  reason?: 'completed' | 'user_ended' | 'timeout';
}

interface EndTrainingResponse {
  finalScore: number;
  detailedFeedback: {
    overallPerformance: string;
    strengths: string[];
    improvementAreas: string[];
    sopReferences: string[];
    recommendations: string[];
  };
  sessionSummary: {
    duration: number;
    messageCount: number;
    objectivesAchieved: number;
    totalObjectives: number;
  };
  error?: string;
  errorType?: string;
  errorCode?: string;
}

// export async function endTrainingSession(request: EndTrainingRequest): Promise<EndTrainingResponse> {
//   try {
//     // Validate required fields
//     if (!request.sessionId || typeof request.sessionId !== "string") {
//       throw new TrainingError(
//         "Session ID is required to end training session",
//         'validation',
//         'medium',
//         'MISSING_SESSION_ID'
//       );
//     }

//     if (!request.userId || typeof request.userId !== "string") {
//       throw new TrainingError(
//         "User ID is required to end training session",
//         'validation',
//         'medium',
//         'MISSING_USER_ID'
//       );
//     }

//     console.log(`Ending training session ${request.sessionId} for user: ${request.userId}`);

//     // Create training agent and finalize session
//     const data = await workflow.invoke({
//       conversationHistory: request.messages,
//       persona: request.guestPersona,
//       scenario: request.scenario,
//     });

//     console.log("=== WORKFLOW STATE RETURNED ===");
//     console.log("Full State:", JSON.stringify(data, null, 2));
//     console.log("Messages:", data?.conversationHistory?.length || 0);
//     console.log("Scenario:", data?.scenario ? "Present" : "Not present");
//     console.log("Persona:", data?.persona ? "Present" : "Not present");
//     console.log("===============================");

//     const messages = data?.conversationHistory || [];
//     const lastMessage =
//       messages[messages.length - 1];

//     return  {
//         // state: data,
//         scenario: data?.scenario,
//         guestPersona: data?.persona,
//         messages: data?.conversationHistory,
//         guestResponse: lastMessage,
//       }

//   } catch (error) {
//     console.error("End training session error:", error);

//     if (error instanceof TrainingError) {
//       return {
//         finalScore: 0,
//         detailedFeedback: {
//           overallPerformance: '',
//           strengths: [],
//           improvementAreas: [],
//           sopReferences: [],
//           recommendations: []
//         },
//         sessionSummary: {
//           duration: 0,
//           messageCount: 0,
//           objectivesAchieved: 0,
//           totalObjectives: 0
//         },
//         error: error.message,
//         errorType: error.type,
//         errorCode: error.code,
//       };
//     }

//     return {
//       finalScore: 0,
//       detailedFeedback: {
//         overallPerformance: '',
//         strengths: [],
//         improvementAreas: [],
//         sopReferences: [],
//         recommendations: []
//       },
//       sessionSummary: {
//         duration: 0,
//         messageCount: 0,
//         objectivesAchieved: 0,
//         totalObjectives: 0
//       },
//       error: error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR,
//       errorType: 'unknown',
//     };
//   }
// }

interface RefineScenarioRequest {
  scenario: string;
}

interface RefineScenarioResponse {
  refinedScenario?: ScenarioGeneratorSchema;
  originalScenario: string;
  error?: string;
  errorType?: string;
  errorCode?: string;
}

export async function refineScenario(request: RefineScenarioRequest): Promise<RefineScenarioResponse> {
  try {
    // Validate required fields
    if (!request.scenario || typeof request.scenario !== "string") {
      throw new TrainingError(
        "Scenario is required to refine scenario",
        'validation',
        'medium',
        'MISSING_SCENARIO'
      );
    }

    console.log(`Refining scenario: ${request.scenario.substring(0, 100)}...`);

    const data = await scenarioPersonaRefineWorkflow.invoke({
      customScenario: request.scenario,
      flag: "scenario",
    });

    console.log("=== SCENARIO REFINE WORKFLOW STATE RETURNED ===");
    console.log("Full State:", JSON.stringify(data, null, 2));
    console.log("Refined Scenario:", data?.scenario ? "Present" : "Not present");
    console.log("===============================");

    return {
      refinedScenario: data?.scenario,
      originalScenario: request.scenario,
    };

  } catch (error) {
    console.error("Refine scenario error:", error);

    if (error instanceof TrainingError) {
      return {
        originalScenario: request.scenario,
        error: error.message,
        errorType: error.type,
        errorCode: error.code,
      };
    }

    return {
      originalScenario: request.scenario,
      error: error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR,
      errorType: 'unknown',
    };
  }
}

interface RefinePersonaRequest {
  persona: string;
}

interface RefinePersonaResponse {
  refinedPersona?: PersonaGeneratorSchema;
  originalPersona: string;
  error?: string;
  errorType?: string;
  errorCode?: string;
}

export async function refinePersona(request: RefinePersonaRequest): Promise<RefinePersonaResponse> {
  try {
    // Validate required fields
    if (!request.persona || typeof request.persona !== "string") {
      throw new TrainingError(
        "Persona is required to refine persona",
        'validation',
        'medium',
        'MISSING_PERSONA'
      );
    }

    console.log(`Refining persona: ${request.persona.substring(0, 100)}...`);

    const data = await scenarioPersonaRefineWorkflow.invoke({
      customPersona: request.persona,
      flag: "persona",
    });

    console.log("=== PERSONA REFINE WORKFLOW STATE RETURNED ===");
    console.log("Full State:", JSON.stringify(data, null, 2));
    console.log("Refined Persona:", data?.persona ? "Present" : "Not present");
    console.log("===============================");

    return {
      refinedPersona: data?.persona,
      originalPersona: request.persona,
    };

  } catch (error) {
    console.error("Refine persona error:", error);

    if (error instanceof TrainingError) {
      return {
        originalPersona: request.persona,
        error: error.message,
        errorType: error.type,
        errorCode: error.code,
      };
    }

    return {
      originalPersona: request.persona,
      error: error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR,
      errorType: 'unknown',
    };
  }
}
