// Training State Management for LangGraph agents

import { BaseMessage } from "@langchain/core/messages";
import { TrainingSimulatorState } from "./types";

// Initialize the training state structure
export const TrainingState = {
  State: {
    messages: [] as BaseMessage[],
    sessionId: '',
    sessionStatus: 'creating' as const,
    scenario: undefined,
    persona: undefined,
    requiredSteps: [] as string[],
    completedSteps: [] as string[],
    scores: undefined,
    criticalErrors: [] as string[],
    retrievedContext: [] as string[],
    currentEmotion: undefined,
    turnCount: 0,
  } as TrainingSimulatorState
};

export type TrainingStateType = typeof TrainingState.State;