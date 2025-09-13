'use client';

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';

// Types for the core app data
interface Training {
  id: string;
  title: string;
  scenario: string;
  status: 'active' | 'completed' | 'paused';
  createdAt: Date;
  updatedAt: Date;
  score?: number;
  feedback?: string;
  sessionData?: any;
}

interface Thread {
  id: string;
  trainingId?: string;
  title: string;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
    autoSave: boolean;
  };
}

interface CoreAppState {
  // User data
  userProfile: UserProfile | null;
  
  // Training data
  trainings: Training[];
  activeTraining: Training | null;
  
  // Thread/chat data
  threads: Thread[];
  activeThread: Thread | null;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // App settings
  settings: {
    autoSaveInterval: number;
    maxThreads: number;
    debugMode: boolean;
  };
}

// Action types
type CoreAppAction =
  | { type: 'SET_USER_PROFILE'; payload: UserProfile }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  
  // Training actions
  | { type: 'ADD_TRAINING'; payload: Training }
  | { type: 'UPDATE_TRAINING'; payload: { id: string; updates: Partial<Training> } }
  | { type: 'DELETE_TRAINING'; payload: string }
  | { type: 'SET_ACTIVE_TRAINING'; payload: Training | null }
  | { type: 'SET_TRAININGS'; payload: Training[] }
  
  // Thread actions
  | { type: 'ADD_THREAD'; payload: Thread }
  | { type: 'UPDATE_THREAD'; payload: { id: string; updates: Partial<Thread> } }
  | { type: 'DELETE_THREAD'; payload: string }
  | { type: 'SET_ACTIVE_THREAD'; payload: Thread | null }
  | { type: 'SET_THREADS'; payload: Thread[] }
  | { type: 'ADD_MESSAGE_TO_THREAD'; payload: { threadId: string; message: Thread['messages'][0] } }
  
  // Settings actions
  | { type: 'UPDATE_SETTINGS'; payload: Partial<CoreAppState['settings']> }
  | { type: 'UPDATE_USER_PREFERENCES'; payload: Partial<UserProfile['preferences']> };

// Initial state
const initialState: CoreAppState = {
  userProfile: null,
  trainings: [],
  activeTraining: null,
  threads: [],
  activeThread: null,
  isLoading: false,
  error: null,
  settings: {
    autoSaveInterval: 30000, // 30 seconds
    maxThreads: 50,
    debugMode: false,
  },
};

// Reducer function
function coreAppReducer(state: CoreAppState, action: CoreAppAction): CoreAppState {
  switch (action.type) {
    case 'SET_USER_PROFILE':
      return { ...state, userProfile: action.payload };
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    // Training actions
    case 'ADD_TRAINING':
      return { 
        ...state, 
        trainings: [...state.trainings, action.payload] 
      };
    
    case 'UPDATE_TRAINING':
      return {
        ...state,
        trainings: state.trainings.map(training =>
          training.id === action.payload.id
            ? { ...training, ...action.payload.updates, updatedAt: new Date() }
            : training
        ),
        activeTraining: state.activeTraining?.id === action.payload.id
          ? { ...state.activeTraining, ...action.payload.updates, updatedAt: new Date() }
          : state.activeTraining
      };
    
    case 'DELETE_TRAINING':
      return {
        ...state,
        trainings: state.trainings.filter(training => training.id !== action.payload),
        activeTraining: state.activeTraining?.id === action.payload ? null : state.activeTraining
      };
    
    case 'SET_ACTIVE_TRAINING':
      return { ...state, activeTraining: action.payload };
    
    case 'SET_TRAININGS':
      return { ...state, trainings: action.payload };
    
    // Thread actions
    case 'ADD_THREAD':
      return { 
        ...state, 
        threads: [...state.threads, action.payload] 
      };
    
    case 'UPDATE_THREAD':
      return {
        ...state,
        threads: state.threads.map(thread =>
          thread.id === action.payload.id
            ? { ...thread, ...action.payload.updates, updatedAt: new Date() }
            : thread
        ),
        activeThread: state.activeThread?.id === action.payload.id
          ? { ...state.activeThread, ...action.payload.updates, updatedAt: new Date() }
          : state.activeThread
      };
    
    case 'DELETE_THREAD':
      return {
        ...state,
        threads: state.threads.filter(thread => thread.id !== action.payload),
        activeThread: state.activeThread?.id === action.payload ? null : state.activeThread
      };
    
    case 'SET_ACTIVE_THREAD':
      return { ...state, activeThread: action.payload };
    
    case 'SET_THREADS':
      return { ...state, threads: action.payload };
    
    case 'ADD_MESSAGE_TO_THREAD':
      return {
        ...state,
        threads: state.threads.map(thread =>
          thread.id === action.payload.threadId
            ? { 
                ...thread, 
                messages: [...thread.messages, action.payload.message],
                updatedAt: new Date()
              }
            : thread
        ),
        activeThread: state.activeThread?.id === action.payload.threadId
          ? {
              ...state.activeThread,
              messages: [...state.activeThread.messages, action.payload.message],
              updatedAt: new Date()
            }
          : state.activeThread
      };
    
    // Settings actions
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, ...action.payload }
      };
    
    case 'UPDATE_USER_PREFERENCES':
      return {
        ...state,
        userProfile: state.userProfile
          ? {
              ...state.userProfile,
              preferences: { ...state.userProfile.preferences, ...action.payload }
            }
          : null
      };
    
    default:
      return state;
  }
}

// Context interface
interface CoreAppContextType {
  state: CoreAppState;
  
  // User actions
  setUserProfile: (profile: UserProfile) => void;
  updateUserPreferences: (preferences: Partial<UserProfile['preferences']>) => void;
  
  // Training actions
  addTraining: (training: Training) => void;
  updateTraining: (id: string, updates: Partial<Training>) => void;
  deleteTraining: (id: string) => void;
  setActiveTraining: (training: Training | null) => void;
  
  // Thread actions
  addThread: (thread: Thread) => void;
  updateThread: (id: string, updates: Partial<Thread>) => void;
  deleteThread: (id: string) => void;
  setActiveThread: (thread: Thread | null) => void;
  addMessageToThread: (threadId: string, message: Thread['messages'][0]) => void;
  
  // Utility actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateSettings: (settings: Partial<CoreAppState['settings']>) => void;
  
  // Computed properties
  activeTrainingThreads: Thread[];
  completedTrainings: Training[];
  recentThreads: Thread[];
}

// Create context
const CoreAppDataContext = createContext<CoreAppContextType | undefined>(undefined);

// Provider component
export function CoreAppDataProvider({ children }: { children: React.ReactNode }) {
  const {state: AuthState} = useAuth();
  const [state, dispatch] = useReducer(coreAppReducer, initialState);

  // Action creators
  const setUserProfile = useCallback((profile: UserProfile) => {
    dispatch({ type: 'SET_USER_PROFILE', payload: profile });
  }, []);

  const updateUserPreferences = useCallback((preferences: Partial<UserProfile['preferences']>) => {
    dispatch({ type: 'UPDATE_USER_PREFERENCES', payload: preferences });
  }, []);

  const addTraining = useCallback((training: Training) => {
    dispatch({ type: 'ADD_TRAINING', payload: training });
  }, []);

  const updateTraining = useCallback((id: string, updates: Partial<Training>) => {
    dispatch({ type: 'UPDATE_TRAINING', payload: { id, updates } });
  }, []);

  const deleteTraining = useCallback((id: string) => {
    dispatch({ type: 'DELETE_TRAINING', payload: id });
  }, []);

  const setActiveTraining = useCallback((training: Training | null) => {
    dispatch({ type: 'SET_ACTIVE_TRAINING', payload: training });
  }, []);

  const addThread = useCallback((thread: Thread) => {
    dispatch({ type: 'ADD_THREAD', payload: thread });
  }, []);

  const updateThread = useCallback((id: string, updates: Partial<Thread>) => {
    dispatch({ type: 'UPDATE_THREAD', payload: { id, updates } });
  }, []);

  const deleteThread = useCallback((id: string) => {
    dispatch({ type: 'DELETE_THREAD', payload: id });
  }, []);

  const setActiveThread = useCallback((thread: Thread | null) => {
    dispatch({ type: 'SET_ACTIVE_THREAD', payload: thread });
  }, []);

  const addMessageToThread = useCallback((threadId: string, message: Thread['messages'][0]) => {
    dispatch({ type: 'ADD_MESSAGE_TO_THREAD', payload: { threadId, message } });
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  const updateSettings = useCallback((settings: Partial<CoreAppState['settings']>) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
  }, []);

  // Computed properties
  const activeTrainingThreads = React.useMemo(() => {
    return state.activeTraining
      ? state.threads.filter(thread => thread.trainingId === state.activeTraining!.id)
      : [];
  }, [state.threads, state.activeTraining]);

  const completedTrainings = React.useMemo(() => {
    return state.trainings.filter(training => training.status === 'completed');
  }, [state.trainings]);

  const recentThreads = React.useMemo(() => {
    return state.threads
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, 10);
  }, [state.threads]);

  // Auto-save effect (optional)
  useEffect(() => {
    if (state.settings.autoSaveInterval > 0) {
      const interval = setInterval(() => {
        // Here you could implement auto-save logic to localStorage or API
        console.log('Auto-saving app state...');
      }, state.settings.autoSaveInterval);

      return () => clearInterval(interval);
    }
  }, [state.settings.autoSaveInterval]);

  const contextValue: CoreAppContextType = {
    state,
    setUserProfile,
    updateUserPreferences,
    addTraining,
    updateTraining,
    deleteTraining,
    setActiveTraining,
    addThread,
    updateThread,
    deleteThread,
    setActiveThread,
    addMessageToThread,
    setLoading,
    setError,
    updateSettings,
    activeTrainingThreads,
    completedTrainings,
    recentThreads,
  };

  return (
    <CoreAppDataContext.Provider value={contextValue}>
      {children}
    </CoreAppDataContext.Provider>
  );
}

// Custom hook to use the context
export function useCoreAppData() {
  const context = useContext(CoreAppDataContext);
  if (context === undefined) {
    throw new Error('useCoreAppData must be used within a CoreAppDataProvider');
  }
  return context;
}

// Export types for use in other components
export type { Training, Thread, UserProfile, CoreAppState };