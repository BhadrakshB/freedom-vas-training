"use client";

import React, { createContext, useContext, useReducer, ReactNode, useMemo } from 'react';
import { ChatErrorHandler, createChatErrorHandler } from '@/lib/chat-error-handler';
import { AppError } from '@/lib/error-handling';

// Chat Loading State Types
export type ChatLoadingType = 'message-send' | 'conversation-load';

export interface ChatLoadingState {
  isLoading: boolean;
  type?: ChatLoadingType;
  message?: string;
  error?: string;
  timestamp?: Date;
}

// Action types for chat loading state management
export type ChatLoadingAction =
  | { type: 'SET_LOADING'; loading: boolean; loadingType?: ChatLoadingType; message?: string }
  | { type: 'SET_ERROR'; error?: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'RESET' };

// Initial state
const initialState: ChatLoadingState = {
  isLoading: false,
  type: undefined,
  message: undefined,
  error: undefined,
  timestamp: undefined,
};

// State reducer
function chatLoadingReducer(state: ChatLoadingState, action: ChatLoadingAction): ChatLoadingState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.loading,
        type: action.loading ? action.loadingType : undefined,
        message: action.loading ? action.message : undefined,
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
        timestamp: action.error ? new Date() : undefined,
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: undefined,
      };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

// Context interface
export interface ChatLoadingContextType {
  state: ChatLoadingState;
  dispatch: React.Dispatch<ChatLoadingAction>;
  
  // Helper functions
  setLoading: (loading: boolean, type?: ChatLoadingType, message?: string) => void;
  setError: (error?: string) => void;
  clearError: () => void;
  reset: () => void;
  
  // Computed properties
  isLoading: boolean;
  hasError: boolean;
  loadingMessage: string;
  
  // Error handling
  errorHandler: ChatErrorHandler;
  currentError?: AppError;
}

// Create context
const ChatLoadingContext = createContext<ChatLoadingContextType | undefined>(undefined);

// Provider component
interface ChatLoadingProviderProps {
  children: ReactNode;
}

export const ChatLoadingProvider: React.FC<ChatLoadingProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(chatLoadingReducer, initialState);

  // Create error handler with callback to update state
  const errorHandler = useMemo(() => {
    return createChatErrorHandler((error?: AppError) => {
      if (error) {
        dispatch({ type: 'SET_ERROR', error: error.message });
      } else {
        dispatch({ type: 'CLEAR_ERROR' });
      }
    });
  }, []);

  // Helper functions
  const setLoading = (loading: boolean, type?: ChatLoadingType, message?: string) => {
    dispatch({ type: 'SET_LOADING', loading, loadingType: type, message });
  };

  const setError = (error?: string) => {
    dispatch({ type: 'SET_ERROR', error });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
    errorHandler.clearError();
  };

  const reset = () => {
    dispatch({ type: 'RESET' });
    errorHandler.clearError();
  };

  // Computed properties
  const isLoading = state.isLoading;
  const hasError = !!state.error;
  const loadingMessage = state.message || getDefaultLoadingMessage(state.type);
  const currentError = errorHandler.getCurrentError();

  const contextValue: ChatLoadingContextType = {
    state,
    dispatch,
    setLoading,
    setError,
    clearError,
    reset,
    isLoading,
    hasError,
    loadingMessage,
    errorHandler,
    currentError,
  };

  return (
    <ChatLoadingContext.Provider value={contextValue}>
      {children}
    </ChatLoadingContext.Provider>
  );
};

// Hook to use the chat loading context
export const useChatLoading = (): ChatLoadingContextType => {
  const context = useContext(ChatLoadingContext);
  if (context === undefined) {
    throw new Error('useChatLoading must be used within a ChatLoadingProvider');
  }
  return context;
};

// Helper function to get default loading messages
function getDefaultLoadingMessage(type?: ChatLoadingType): string {
  switch (type) {
    case 'message-send':
      return 'Sending message...';
    case 'conversation-load':
      return 'Loading conversation...';
    default:
      return 'Loading...';
  }
}

// Types are already exported above in the interface declaration