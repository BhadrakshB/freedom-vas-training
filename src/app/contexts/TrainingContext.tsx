"use client";

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { SessionStatus, ScenarioData, PersonaData, ScoringMetrics } from '../lib/types';
import { AppError, classifyError } from '../lib/error-handling';
import { BaseMessage } from '@langchain/core/messages';

// Training UI State Types
export type TrainingPhase = 'idle' | 'ongoing' | 'complete';

export interface TrainingUIState {
  // Current phase of the training experience
  phase: TrainingPhase;
  
  // Session status from API
  sessionStatus?: SessionStatus;
  
  // Session data
  scenario?: ScenarioData;
  persona?: PersonaData;
  // scores?: ScoringMetrics & { overall: number };
  
  // Progress tracking
  // progress: {
  //   currentTurn: number;
  //   completedSteps: string[];
  //   requiredSteps: string[];
  //   completionPercentage: number;
  // };
  // Converstaion History
  messages: BaseMessage[];

  // Session timing
  sessionDuration: number;
  startTime?: Date;
  
  // Error handling
  error?: AppError;
  
  // UI state flags
  // isPanelFrozen: boolean;
  // showFeedback: boolean;
  
  // Critical errors
  // criticalErrors: string[];
}

// Action types for state management
export type TrainingAction =
  | { type: 'START_SESSION'; data: Partial<TrainingUIState> }
  | { type: 'UPDATE_SESSION_STATUS'; status: SessionStatus }
  | { type: 'UPDATE_SESSION_DATA'; data: Partial<TrainingUIState> }
  | { type: 'COMPLETE_SESSION' }
  | { type: 'SET_ERROR'; error?: AppError | string | unknown }
  | { type: 'RESET_SESSION' };

// Initial state (REQUIRED FOR REDUCER)
const initialState: TrainingUIState = {
  phase: 'idle',
  messages: [],
  sessionDuration: 0,
};

// State reducer (my reducer function)
function trainingReducer(state: TrainingUIState, action: TrainingAction): TrainingUIState {
  switch (action.type) {
    case 'START_SESSION':
      return {
        ...state,
        phase: 'ongoing',
        sessionStatus: 'active',
        startTime: new Date(),
        ...action.data,
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
        sessionStatus: 'complete',
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
  startSession: (data: Partial<TrainingUIState>) => void;
  completeSession: () => void;
  updateSessionData: (data: Partial<TrainingUIState>) => void;
  setError: (error?: AppError | string | unknown) => void;
  resetSession: () => void;
  
  // Computed properties
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


// Actual definition an Business Logic of the GetxControlelr
export const TrainingProvider: React.FC<TrainingProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(trainingReducer, initialState);

  // Helper functions
  const startSession = (data: Partial<TrainingUIState>) => {
    dispatch({ type: 'START_SESSION', data });
  };

  const completeSession = () => {
    dispatch({ type: 'COMPLETE_SESSION' });
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
  const shouldShowTrainingPanel = true; // Always show training panel
  
  const panelTitle = (() => {
    switch (state.phase) {
      case 'ongoing':
        return 'Training Session';
      case 'complete':
        return 'Session Complete';
      default:
        return 'Training Simulator';
    }
  })();

  const mainChatTitle = (() => {
    switch (state.phase) {
      case 'ongoing':
        return 'Training Session Active';
      default:
        return 'AI Training Simulator';
    }
  })();

  // Auto-update session duration
  useEffect(() => {
    if (!state.startTime || state.phase !== 'ongoing') return;

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
    updateSessionData,
    setError,
    resetSession,
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