"use client";

import React, { createContext, useContext, useReducer, ReactNode, useMemo } from 'react';
import { TrainingErrorHandler, createTrainingErrorHandler } from '@/lib/training-error-handler';
import { AppError } from '@/lib/error-handling';

// Training Loading State Types
export type TrainingLoadingType = 'session-start' | 'message-send' | 'status-check' | 'session-complete';

export interface TrainingLoadingState {
  isLoading: boolean;
  type?: TrainingLoadingType;
  message?: string;
  error?: string;
  timestamp?: Date;
  progress?: number; // For session start progress (0-100)
}

// Action types for training loading state management
export type TrainingLoadingAction =
  | { type: 'SET_LOADING'; loading: boolean; loadingType?: TrainingLoadingType; message?: string; progress?: number }
  | { type: 'SET_ERROR'; error?: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'UPDATE_PROGRESS'; progress: number }
  | { type: 'RESET' };

// Initial state
const initialState: TrainingLoadingState = {
  isLoading: false,
  type: undefined,
  message: undefined,
  error: undefined,
  timestamp: undefined,
  progress: undefined,
};

// State reducer
function trainingLoadingReducer(state: TrainingLoadingState, action: TrainingLoadingAction): TrainingLoadingState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.loading,
        type: action.loading ? action.loadingType : undefined,
        message: action.loading ? action.message : undefined,
        progress: action.loading ? action.progress : undefined,
        timestamp: action.loading ? new Date() : undefined,
        error: action.loading ? undefined : state.error, // Clear error when starting to load
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.error,
        isLoading: false,
        type: undefined,
        message: undefined,
        progress: undefined,
        timestamp: action.error ? new Date() : undefined,
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: undefined,
      };

    case 'UPDATE_PROGRESS':
      return {
        ...state,
        progress: action.progress,
      };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

// Context interface
export interface TrainingLoadingContextType {
  state: TrainingLoadingState;
  dispatch: React.Dispatch<TrainingLoadingAction>;
  
  // Helper functions
  setLoading: (loading: boolean, type?: TrainingLoadingType, message?: string, progress?: number) => void;
  setError: (error?: string) => void;
  clearError: () => void;
  updateProgress: (progress: number) => void;
  reset: () => void;
  
  // Computed properties
  isLoading: boolean;
  hasError: boolean;
  loadingMessage: string;
  showProgress: boolean;
  
  // Error handling
  errorHandler: TrainingErrorHandler;
  currentError?: AppError;
}

// Create context
const TrainingLoadingContext = createContext<TrainingLoadingContextType | undefined>(undefined);

// Provider component
interface TrainingLoadingProviderProps {
  children: ReactNode;
}

export const TrainingLoadingProvider: React.FC<TrainingLoadingProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(trainingLoadingReducer, initialState);

  // Create error handler with callback to update state
  const errorHandler = useMemo(() => {
    return createTrainingErrorHandler((error?: AppError) => {
      if (error) {
        dispatch({ type: 'SET_ERROR', error: error.message });
      } else {
        dispatch({ type: 'CLEAR_ERROR' });
      }
    });
  }, []);

  // Helper functions
  const setLoading = (loading: boolean, type?: TrainingLoadingType, message?: string, progress?: number) => {
    dispatch({ type: 'SET_LOADING', loading, loadingType: type, message, progress });
  };

  const setError = (error?: string) => {
    dispatch({ type: 'SET_ERROR', error });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
    errorHandler.clearError();
  };

  const updateProgress = (progress: number) => {
    dispatch({ type: 'UPDATE_PROGRESS', progress });
  };

  const reset = () => {
    dispatch({ type: 'RESET' });
    errorHandler.clearError();
  };

  // Computed properties
  const isLoading = state.isLoading;
  const hasError = !!state.error;
  const loadingMessage = state.message || getDefaultLoadingMessage(state.type);
  const showProgress = state.type === 'session-start' && typeof state.progress === 'number';
  const currentError = errorHandler.getCurrentError();

  const contextValue: TrainingLoadingContextType = {
    state,
    dispatch,
    setLoading,
    setError,
    clearError,
    updateProgress,
    reset,
    isLoading,
    hasError,
    loadingMessage,
    showProgress,
    errorHandler,
    currentError,
  };

  return (
    <TrainingLoadingContext.Provider value={contextValue}>
      {children}
    </TrainingLoadingContext.Provider>
  );
};

// Hook to use the training loading context
export const useTrainingLoading = (): TrainingLoadingContextType => {
  const context = useContext(TrainingLoadingContext);
  if (context === undefined) {
    throw new Error('useTrainingLoading must be used within a TrainingLoadingProvider');
  }
  return context;
};

// Helper function to get default loading messages
function getDefaultLoadingMessage(type?: TrainingLoadingType): string {
  switch (type) {
    case 'session-start':
      return 'Starting training session...';
    case 'message-send':
      return 'Sending training message...';
    case 'status-check':
      return 'Checking session status...';
    case 'session-complete':
      return 'Completing training session...';
    default:
      return 'Loading...';
  }
}

// Types are already exported above in the interface declaration