// Training Simulator State Annotation for LangGraph

import { Annotation, MessagesAnnotation } from "@langchain/langgraph";
import { 
  ScenarioData, 
  PersonaData, 
  ScoringMetrics, 
  SessionStatus 
} from "./types";

/** Training Simulator State Definition */
export const TrainingSimulatorState = Annotation.Root({
  // Extend MessagesAnnotation to include chat history with built-in reducer
  ...MessagesAnnotation.spec,
  
  // Session Management
  sessionId: Annotation<string>,
  sessionStatus: Annotation<SessionStatus>,
  
  // Scenario & Persona
  scenario: Annotation<ScenarioData>,
  persona: Annotation<PersonaData>,
  
  // Training Progress
  requiredSteps: Annotation<string[]>({
    default: () => [],
    reducer: (prev, update) => [...new Set([...prev, ...update])],
  }),
  completedSteps: Annotation<string[]>({
    default: () => [],
    reducer: (prev, update) => [...new Set([...prev, ...update])],
  }),
  
  // Silent Scoring
  scores: Annotation<ScoringMetrics>,
  criticalErrors: Annotation<string[]>({
    default: () => [],
    reducer: (prev, update) => prev.concat(update),
  }),
  
  // Knowledge Context
  retrievedContext: Annotation<string[]>({
    default: () => [],
    reducer: (prev, update) => prev.concat(update),
  }),
  
  // UI State
  currentEmotion: Annotation<string>,
  turnCount: Annotation<number>({
    default: () => 0,
    reducer: (prev, update) => prev + update,
  }),
});

/** Type alias for the state */
export type TrainingSimulatorStateType = typeof TrainingSimulatorState.State;