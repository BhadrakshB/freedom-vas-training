'use client';

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getUserThreadsByFirebaseUid, type UserThread } from '../lib/actions/user-threads-actions';
import { createThread, updateThread } from '../lib/db/actions/thread-actions';
import { createMessage } from '../lib/db/actions/message-actions';

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
  
  // Thread/chat data (from database)
  userThreads: UserThread[];
  threads: Thread[];
  activeThread: Thread | null;
  
  // UI state
  isLoading: boolean;
  isLoadingThreads: boolean;
  error: string | null;
  
  // Statistics
  threadStats: {
    total: number;
    active: number;
    completed: number;
    paused: number;
  };
  
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
  | { type: 'SET_LOADING_THREADS'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  
  // Training actions
  | { type: 'ADD_TRAINING'; payload: Training }
  | { type: 'UPDATE_TRAINING'; payload: { id: string; updates: Partial<Training> } }
  | { type: 'DELETE_TRAINING'; payload: string }
  | { type: 'SET_ACTIVE_TRAINING'; payload: Training | null }
  | { type: 'SET_TRAININGS'; payload: Training[] }
  
  // User threads actions (from database)
  | { type: 'SET_USER_THREADS'; payload: { threads: UserThread[]; stats: CoreAppState['threadStats'] } }
  | { type: 'ADD_USER_THREAD'; payload: UserThread }
  | { type: 'UPDATE_USER_THREAD'; payload: { id: string; updates: Partial<UserThread> } }
  | { type: 'CLEAR_USER_THREADS' }
  
  // Thread actions (UI state)
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
  userThreads: [],
  threads: [],
  activeThread: null,
  isLoading: false,
  isLoadingThreads: false,
  error: null,
  threadStats: {
    total: 0,
    active: 0,
    completed: 0,
    paused: 0
  },
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
    
    case 'SET_LOADING_THREADS':
      return { ...state, isLoadingThreads: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    // User threads actions
    case 'SET_USER_THREADS':
      return {
        ...state,
        userThreads: action.payload.threads,
        threadStats: action.payload.stats
      };
    
    case 'ADD_USER_THREAD':
      const newThreads = [...state.userThreads, action.payload];
      return {
        ...state,
        userThreads: newThreads,
        threadStats: {
          total: newThreads.length,
          active: newThreads.filter(t => t.status === 'active').length,
          completed: newThreads.filter(t => t.status === 'completed').length,
          paused: newThreads.filter(t => t.status === 'paused').length
        }
      };
    
    case 'UPDATE_USER_THREAD':
      const updatedThreads = state.userThreads.map(thread =>
        thread.id === action.payload.id
          ? { ...thread, ...action.payload.updates, updatedAt: new Date() }
          : thread
      );
      return {
        ...state,
        userThreads: updatedThreads,
        threadStats: {
          total: updatedThreads.length,
          active: updatedThreads.filter(t => t.status === 'active').length,
          completed: updatedThreads.filter(t => t.status === 'completed').length,
          paused: updatedThreads.filter(t => t.status === 'paused').length
        }
      };
    
    case 'CLEAR_USER_THREADS':
      return {
        ...state,
        userThreads: [],
        threadStats: { total: 0, active: 0, completed: 0, paused: 0 }
      };
    
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
  
  // User threads actions (database)
  loadUserThreads: () => Promise<void>;
  startNewTrainingSession: (title: string, scenario: any, persona: any) => Promise<UserThread>;
  addMessageToTrainingSession: (threadId: string, content: string, role: 'trainee' | 'AI', isTraining?: boolean) => Promise<void>;
  completeTrainingSession: (threadId: string, score: any, feedback: any) => Promise<void>;
  selectUserThread: (thread: UserThread) => void;
  
  // Training actions
  addTraining: (training: Training) => void;
  updateTraining: (id: string, updates: Partial<Training>) => void;
  deleteTraining: (id: string) => void;
  setActiveTraining: (training: Training | null) => void;
  
  // Thread actions (UI state)
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
  const { state: authState } = useAuth();
  const [state, dispatch] = useReducer(coreAppReducer, initialState);

  // Load user threads when user authenticates/deauthenticates
  useEffect(() => {
    if (authState.user?.uid) {
      loadUserThreads();
    } else {
      dispatch({ type: 'CLEAR_USER_THREADS' });
    }
  }, [authState.user?.uid]);

  // Load user threads from database
  const loadUserThreads = useCallback(async () => {
    if (!authState.user?.uid) {
      dispatch({ type: 'CLEAR_USER_THREADS' });
      return;
    }

    dispatch({ type: 'SET_LOADING_THREADS', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const result = await getUserThreadsByFirebaseUid(authState.user.uid);
      
      if (result.success) {
        dispatch({
          type: 'SET_USER_THREADS',
          payload: {
            threads: result.threads,
            stats: {
              total: result.totalCount,
              active: result.activeCount,
              completed: result.completedCount,
              paused: result.totalCount - result.activeCount - result.completedCount
            }
          }
        });
      } else {
        dispatch({ type: 'SET_ERROR', payload: result.error || 'Failed to load training sessions' });
      }
    } catch (error) {
      console.error('Error loading user threads:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load training sessions' });
    } finally {
      dispatch({ type: 'SET_LOADING_THREADS', payload: false });
    }
  }, [authState.user?.uid]);

  // Start a new training session and create it in the database
  const startNewTrainingSession = useCallback(async (title: string, scenario: any, persona: any): Promise<UserThread> => {
    if (!authState.user?.uid) {
      throw new Error('User must be logged in to start a training session');
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      // First get the user's internal ID
      const { getUserAuthByProvider } = await import('../lib/db/actions/user-auth-actions');
      const userAuth = await getUserAuthByProvider('firebase', authState.user.uid);
      
      if (!userAuth) {
        throw new Error('User not found in database');
      }

      // Create thread in database
      const newThread = await createThread({
        title,
        userId: userAuth.userId,
        scenario,
        persona,
        status: 'active',
        startedAt: new Date(),
        visibility: 'private',
        version: '1',
        deletedAt: null,
        score: null,
        feedback: null,
        completedAt: null
      });

      // Convert to UserThread format
      const userThread: UserThread = {
        ...newThread,
        isActive: true,
        lastActivity: newThread.updatedAt
      };

      // Add to local state
      dispatch({ type: 'ADD_USER_THREAD', payload: userThread });

      return userThread;
    } catch (error) {
      console.error('Error starting training session:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to start training session' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [authState.user]);

  // Add a message to a training session
  const addMessageToTrainingSession = useCallback(async (
    threadId: string, 
    content: string, 
    role: 'trainee' | 'AI', 
    isTraining: boolean = true
  ) => {
    if (!authState.user?.uid) {
      throw new Error('User must be logged in to send messages');
    }

    try {
      // Create message in database
      await createMessage({
        chatId: threadId,
        role: role === 'trainee' ? 'trainee' : 'AI',
        parts: { content },
        attachments: [],
        isTraining
      });

      // Update thread's last activity
      dispatch({ 
        type: 'UPDATE_USER_THREAD', 
        payload: { 
          id: threadId, 
          updates: { 
            lastActivity: new Date(),
            updatedAt: new Date()
          } 
        } 
      });
    } catch (error) {
      console.error('Error adding message to training session:', error);
      throw error;
    }
  }, [authState.user]);

  // Complete a training session
  const completeTrainingSession = useCallback(async (threadId: string, score: any, feedback: any) => {
    if (!authState.user?.uid) {
      throw new Error('User must be logged in to complete a training session');
    }

    try {
      // Update thread in database
      await updateThread(threadId, {
        status: 'completed',
        completedAt: new Date(),
        score,
        feedback
      } as any);

      // Update in local state
      dispatch({
        type: 'UPDATE_USER_THREAD',
        payload: {
          id: threadId,
          updates: {
            status: 'completed',
            completedAt: new Date(),
            score,
            feedback,
            isActive: false
          }
        }
      });
    } catch (error) {
      console.error('Error completing training session:', error);
      throw error;
    }
  }, [authState.user]);

  // Select a user thread (for navigation/viewing)
  const selectUserThread = useCallback((thread: UserThread) => {
    // This could be used to load the thread's messages and set it as active
    console.log('Selected thread:', thread.id, thread.title);
    // You could dispatch actions here to load thread details, messages, etc.
  }, []);

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
    // User threads methods
    loadUserThreads,
    startNewTrainingSession,
    addMessageToTrainingSession,
    completeTrainingSession,
    selectUserThread,
    // Training methods
    addTraining,
    updateTraining,
    deleteTraining,
    setActiveTraining,
    // Thread methods
    addThread,
    updateThread,
    deleteThread,
    setActiveThread,
    addMessageToThread,
    // Utility methods
    setLoading,
    setError,
    updateSettings,
    // Computed properties
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