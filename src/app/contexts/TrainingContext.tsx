"use client";

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { SessionStatus, ScenarioData, PersonaData, ScoringMetrics } from '../lib/types';
import { AppError, classifyError } from '../lib/error-handling';

// Training UI State Types
export type TrainingPhase = 'idle' | 'training' | 'feedback' | 'complete';

export interface TrainingUIState {
  // Current phase of the training experience
  phase: TrainingPhase;
  
  // Active session information
  activeSessionId?: string;
  completedSessionId?: string;
  
  // Session status from API
  sessionStatus?: SessionStatus;
  
  // Session data
  scenario?: ScenarioData;
  persona?: PersonaData;
  scores?: ScoringMetrics & { overall: number };
  
  // Progress tracking
  progress: {
    currentTurn: number;
    completedSteps: string[];
    requiredSteps: string[];
    completionPercentage: number;
  };
  
  // Session timing
  sessionDuration: number;
  startTime?: Date;
  
  // Error handling
  error?: AppError;
  
  // UI state flags
  isPanelFrozen: boolean;
  showFeedback: boolean;
  
  // Critical errors
  criticalErrors: string[];
}

// Action types for state management
export type TrainingAction =
  | { type: 'START_SESSION'; sessionId: string }
  | { type: 'UPDATE_SESSION_STATUS'; status: SessionStatus }
  | { type: 'UPDATE_SESSION_DATA'; data: Partial<TrainingUIState> }
  | { type: 'COMPLETE_SESSION'; sessionId: string }
  | { type: 'ENTER_FEEDBACK_PHASE'; sessionId: string }
  | { type: 'EXIT_FEEDBACK_PHASE' }
  | { type: 'FREEZE_PANEL' }
  | { type: 'UNFREEZE_PANEL' }
  | { type: 'SET_ERROR'; error?: AppError | string | unknown }
  | { type: 'RESET_SESSION' };

// Initial state (REQUIRED FOR REDUCER)
const initialState: TrainingUIState = {
  phase: 'idle',
  progress: {
    currentTurn: 0,
    completedSteps: [],
    requiredSteps: [],
    completionPercentage: 0,
  },
  sessionDuration: 0,
  isPanelFrozen: false,
  showFeedback: false,
  criticalErrors: [],
};

// State reducer (my reducer function)
function trainingReducer(state: TrainingUIState, action: TrainingAction): TrainingUIState {
  switch (action.type) {
    case 'START_SESSION':
      return {
        ...state,
        phase: 'training',
        activeSessionId: action.sessionId,
        completedSessionId: undefined,
        sessionStatus: 'creating',
        startTime: new Date(),
        isPanelFrozen: false,
        showFeedback: false,
        error: undefined,
        progress: {
          currentTurn: 0,
          completedSteps: [],
          requiredSteps: [],
          completionPercentage: 0,
        },
        criticalErrors: [],
      };

    case 'UPDATE_SESSION_STATUS':
      return {
        ...state,
        sessionStatus: action.status,
      };

    case 'UPDATE_SESSION_DATA':
      return {
        ...state,
        ...action.data,
      };

    case 'COMPLETE_SESSION':
      return {
        ...state,
        phase: 'complete',
        activeSessionId: undefined,
        completedSessionId: action.sessionId,
        sessionStatus: 'complete',
        isPanelFrozen: true,
      };

    case 'ENTER_FEEDBACK_PHASE':
      return {
        ...state,
        phase: 'feedback',
        completedSessionId: action.sessionId,
        showFeedback: true,
        isPanelFrozen: true,
      };

    case 'EXIT_FEEDBACK_PHASE':
      return {
        ...state,
        phase: 'idle',
        completedSessionId: undefined,
        showFeedback: false,
        isPanelFrozen: false,
      };

    case 'FREEZE_PANEL':
      return {
        ...state,
        isPanelFrozen: true,
      };

    case 'UNFREEZE_PANEL':
      return {
        ...state,
        isPanelFrozen: false,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.error ? classifyError(action.error) : undefined,
      };

    case 'RESET_SESSION':
      return {
        ...initialState,
      };

    default:
      return state;
  }
}

// Context interface (Works like a GetxController/Provider where you have stored the state and helper functions and other properties)
interface TrainingContextType {
  state: TrainingUIState;
  dispatch: React.Dispatch<TrainingAction>;
  
  // Helper functions
  startSession: (sessionId: string) => void;
  completeSession: (sessionId: string) => void;
  enterFeedbackPhase: (sessionId: string) => void;
  exitFeedbackPhase: () => void;
  updateSessionData: (data: Partial<TrainingUIState>) => void;
  setError: (error?: AppError | string | unknown) => void;
  resetSession: () => void;
  
  // Computed properties
  isTrainingActive: boolean;
  isFeedbackActive: boolean;
  shouldShowMainChat: boolean;
  shouldShowTrainingPanel: boolean;
  panelTitle: string;
  mainChatTitle: string;
}

// Create context (works like Controller(), you use Get.put() later)
const TrainingContext = createContext<TrainingContextType | undefined>(undefined); // STEP 1: Creating Context

// Provider component
interface TrainingProviderProps {
  children: ReactNode;
}


// Actual definition an Business Logic of teh GetxControlelr
export const TrainingProvider: React.FC<TrainingProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(trainingReducer, initialState);

  // Helper functions
  const startSession = (sessionId: string) => {
    dispatch({ type: 'START_SESSION', sessionId });
  };

  const completeSession = (sessionId: string) => {
    dispatch({ type: 'COMPLETE_SESSION', sessionId });
  };

  const enterFeedbackPhase = (sessionId: string) => {
    dispatch({ type: 'ENTER_FEEDBACK_PHASE', sessionId });
  };

  const exitFeedbackPhase = () => {
    dispatch({ type: 'EXIT_FEEDBACK_PHASE' });
  };

  const updateSessionData = (data: Partial<TrainingUIState>) => {
    dispatch({ type: 'UPDATE_SESSION_DATA', data });
  };

  const setError = (error?: AppError | string | unknown) => {
    dispatch({ type: 'SET_ERROR', error });
  };

  const resetSession = () => {
    dispatch({ type: 'RESET_SESSION' });
  };

  // Computed properties
  const isTrainingActive = state.phase === 'training' && state.activeSessionId !== undefined;
  const isFeedbackActive = state.phase === 'feedback' && state.showFeedback;
  const shouldShowMainChat = state.phase === 'idle' || state.phase === 'feedback';
  const shouldShowTrainingPanel = true; // Always show training panel
  
  const panelTitle = (() => {
    switch (state.phase) {
      case 'training':
        return 'Training Session';
      case 'complete':
        return 'Session Complete';
      case 'feedback':
        return 'Training Complete';
      default:
        return 'Training Simulator';
    }
  })();

  const mainChatTitle = (() => {
    switch (state.phase) {
      case 'feedback':
        return 'Training Feedback';
      case 'training':
        return 'Training Session Active';
      default:
        return 'AI Training Simulator';
    }
  })();

  // Auto-update session duration
  useEffect(() => {
    if (!state.startTime || state.phase !== 'training') return;

    const interval = setInterval(() => {
      const duration = Date.now() - state.startTime!.getTime();
      dispatch({ type: 'UPDATE_SESSION_DATA', data: { sessionDuration: duration } });
    }, 1000);

    return () => clearInterval(interval);
  }, [state.startTime, state.phase]);

  const contextValue: TrainingContextType = {
    state,
    dispatch,
    startSession,
    completeSession,
    enterFeedbackPhase,
    exitFeedbackPhase,
    updateSessionData,
    setError,
    resetSession,
    isTrainingActive,
    isFeedbackActive,
    shouldShowMainChat,
    shouldShowTrainingPanel,
    panelTitle,
    mainChatTitle,
  };

  return (
    <TrainingContext.Provider value={contextValue}>
      {children}
    </TrainingContext.Provider>
  );
};

// Hook to use the training context
export const useTraining = (): TrainingContextType => { // STEP 2: Check for undefined context
  const context = useContext(TrainingContext);
  if (context === undefined) {
    throw new Error('useTraining must be used within a TrainingProvider');
  }
  return context;
};

// Export types for use in other components
export type { TrainingContextType };