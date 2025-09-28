"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
} from "react";
import { useAuth } from "./AuthContext";
import {
  getUserThreadsByFirebaseUid,
  type UserThread,
} from "../lib/actions/user-threads-actions";
import { createThread, updateThread } from "../lib/db/actions/thread-actions";
import { createMessage } from "../lib/db/actions/message-actions";
import {
  createThreadGroup,
  getAllThreadGroups,
  updateThreadGroup,
  deleteThreadGroup,
  getThreadGroupsWithCounts,
} from "../lib/db/actions/thread-group-actions";
import type { ThreadGroup } from "../lib/db/schema";

// Types for the core app data
interface Training {
  id: string;
  title: string;
  scenario: string;
  status: "active" | "completed" | "paused";
  createdAt: Date;
  updatedAt: Date;
  score?: number;
  feedback?: string;
  sessionData?: any;
}

// Extended ThreadGroup type with additional UI properties
interface ThreadGroupWithThreads extends ThreadGroup {
  threads: UserThread[];
  threadCount: number;
  isExpanded?: boolean;
}

interface Thread {
  id: string;
  trainingId?: string;
  title: string;
  messages: Array<{
    id: string;
    role: "user" | "assistant" | "system";
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
    theme: "light" | "dark" | "system";
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

  // Thread groups data
  threadGroups: ThreadGroup[];
  threadGroupsWithThreads: ThreadGroupWithThreads[];
  isLoadingGroups: boolean;

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
    groupingEnabled: boolean;
  };
}

// Action types
type CoreAppAction =
  | { type: "SET_USER_PROFILE"; payload: UserProfile }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_LOADING_THREADS"; payload: boolean }
  | { type: "SET_LOADING_GROUPS"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }

  // Training actions
  | { type: "ADD_TRAINING"; payload: Training }
  | {
      type: "UPDATE_TRAINING";
      payload: { id: string; updates: Partial<Training> };
    }
  | { type: "DELETE_TRAINING"; payload: string }
  | { type: "SET_ACTIVE_TRAINING"; payload: Training | null }
  | { type: "SET_TRAININGS"; payload: Training[] }

  // User threads actions (from database)
  | {
      type: "SET_USER_THREADS";
      payload: { threads: UserThread[]; stats: CoreAppState["threadStats"] };
    }
  | { type: "ADD_USER_THREAD"; payload: UserThread }
  | {
      type: "UPDATE_USER_THREAD";
      payload: { id: string; updates: Partial<UserThread> };
    }
  | { type: "CLEAR_USER_THREADS" }

  // Thread group actions
  | { type: "SET_THREAD_GROUPS"; payload: ThreadGroup[] }
  | { type: "ADD_THREAD_GROUP"; payload: ThreadGroup }
  | {
      type: "UPDATE_THREAD_GROUP";
      payload: { id: string; updates: Partial<ThreadGroup> };
    }
  | { type: "DELETE_THREAD_GROUP"; payload: string }
  | {
      type: "SET_THREAD_GROUPS_WITH_THREADS";
      payload: ThreadGroupWithThreads[];
    }
  | {
      type: "TOGGLE_GROUP_EXPANSION";
      payload: { groupId: string; isExpanded: boolean };
    }

  // Thread actions (UI state)
  | { type: "ADD_THREAD"; payload: Thread }
  | { type: "UPDATE_THREAD"; payload: { id: string; updates: Partial<Thread> } }
  | { type: "DELETE_THREAD"; payload: string }
  | { type: "SET_ACTIVE_THREAD"; payload: Thread | null }
  | { type: "SET_THREADS"; payload: Thread[] }
  | {
      type: "ADD_MESSAGE_TO_THREAD";
      payload: { threadId: string; message: Thread["messages"][0] };
    }

  // Settings actions
  | { type: "UPDATE_SETTINGS"; payload: Partial<CoreAppState["settings"]> }
  | {
      type: "UPDATE_USER_PREFERENCES";
      payload: Partial<UserProfile["preferences"]>;
    };

// Initial state
const initialState: CoreAppState = {
  userProfile: null,
  trainings: [],
  activeTraining: null,
  userThreads: [],
  threads: [],
  activeThread: null,
  threadGroups: [],
  threadGroupsWithThreads: [],
  isLoadingGroups: false,
  isLoading: false,
  isLoadingThreads: false,
  error: null,
  threadStats: {
    total: 0,
    active: 0,
    completed: 0,
    paused: 0,
  },
  settings: {
    autoSaveInterval: 30000, // 30 seconds
    maxThreads: 50,
    debugMode: false,
    groupingEnabled: true,
  },
};

// Reducer function
function coreAppReducer(
  state: CoreAppState,
  action: CoreAppAction
): CoreAppState {
  switch (action.type) {
    case "SET_USER_PROFILE":
      return { ...state, userProfile: action.payload };

    case "SET_LOADING":
      return { ...state, isLoading: action.payload };

    case "SET_LOADING_THREADS":
      return { ...state, isLoadingThreads: action.payload };

    case "SET_LOADING_GROUPS":
      return { ...state, isLoadingGroups: action.payload };

    case "SET_ERROR":
      return { ...state, error: action.payload };

    // User threads actions
    case "SET_USER_THREADS":
      return {
        ...state,
        userThreads: action.payload.threads,
        threadStats: action.payload.stats,
      };

    case "ADD_USER_THREAD":
      const newThreads = [...state.userThreads, action.payload];
      return {
        ...state,
        userThreads: newThreads,
        threadStats: {
          total: newThreads.length,
          active: newThreads.filter((t) => t.status === "active").length,
          completed: newThreads.filter((t) => t.status === "completed").length,
          paused: newThreads.filter((t) => t.status === "paused").length,
        },
      };

    case "UPDATE_USER_THREAD":
      const updatedThreads = state.userThreads.map((thread) =>
        thread.id === action.payload.id
          ? { ...thread, ...action.payload.updates, updatedAt: new Date() }
          : thread
      );
      return {
        ...state,
        userThreads: updatedThreads,
        threadStats: {
          total: updatedThreads.length,
          active: updatedThreads.filter((t) => t.status === "active").length,
          completed: updatedThreads.filter((t) => t.status === "completed")
            .length,
          paused: updatedThreads.filter((t) => t.status === "paused").length,
        },
      };

    case "CLEAR_USER_THREADS":
      return {
        ...state,
        userThreads: [],
        threadStats: { total: 0, active: 0, completed: 0, paused: 0 },
        threadGroupsWithThreads: [], // Clear grouped threads as well
      };

    // Thread group actions
    case "SET_THREAD_GROUPS":
      return { ...state, threadGroups: action.payload };

    case "ADD_THREAD_GROUP":
      return {
        ...state,
        threadGroups: [...state.threadGroups, action.payload],
      };

    case "UPDATE_THREAD_GROUP":
      return {
        ...state,
        threadGroups: state.threadGroups.map((group) =>
          group.id === action.payload.id
            ? { ...group, ...action.payload.updates, updatedAt: new Date() }
            : group
        ),
        threadGroupsWithThreads: state.threadGroupsWithThreads.map((group) =>
          group.id === action.payload.id
            ? { ...group, ...action.payload.updates, updatedAt: new Date() }
            : group
        ),
      };

    case "DELETE_THREAD_GROUP":
      return {
        ...state,
        threadGroups: state.threadGroups.filter(
          (group) => group.id !== action.payload
        ),
        threadGroupsWithThreads: state.threadGroupsWithThreads.filter(
          (group) => group.id !== action.payload
        ),
      };

    case "SET_THREAD_GROUPS_WITH_THREADS":
      return {
        ...state,
        threadGroupsWithThreads: action.payload,
      };

    case "TOGGLE_GROUP_EXPANSION":
      return {
        ...state,
        threadGroupsWithThreads: state.threadGroupsWithThreads.map((group) =>
          group.id === action.payload.groupId
            ? { ...group, isExpanded: action.payload.isExpanded }
            : group
        ),
      };

    // Training actions
    case "ADD_TRAINING":
      return {
        ...state,
        trainings: [...state.trainings, action.payload],
      };

    case "UPDATE_TRAINING":
      return {
        ...state,
        trainings: state.trainings.map((training) =>
          training.id === action.payload.id
            ? { ...training, ...action.payload.updates, updatedAt: new Date() }
            : training
        ),
        activeTraining:
          state.activeTraining?.id === action.payload.id
            ? {
                ...state.activeTraining,
                ...action.payload.updates,
                updatedAt: new Date(),
              }
            : state.activeTraining,
      };

    case "DELETE_TRAINING":
      return {
        ...state,
        trainings: state.trainings.filter(
          (training) => training.id !== action.payload
        ),
        activeTraining:
          state.activeTraining?.id === action.payload
            ? null
            : state.activeTraining,
      };

    case "SET_ACTIVE_TRAINING":
      return { ...state, activeTraining: action.payload };

    case "SET_TRAININGS":
      return { ...state, trainings: action.payload };

    // Thread actions
    case "ADD_THREAD":
      return {
        ...state,
        threads: [...state.threads, action.payload],
      };

    case "UPDATE_THREAD":
      return {
        ...state,
        threads: state.threads.map((thread) =>
          thread.id === action.payload.id
            ? { ...thread, ...action.payload.updates, updatedAt: new Date() }
            : thread
        ),
        activeThread:
          state.activeThread?.id === action.payload.id
            ? {
                ...state.activeThread,
                ...action.payload.updates,
                updatedAt: new Date(),
              }
            : state.activeThread,
      };

    case "DELETE_THREAD":
      return {
        ...state,
        threads: state.threads.filter((thread) => thread.id !== action.payload),
        activeThread:
          state.activeThread?.id === action.payload ? null : state.activeThread,
      };

    case "SET_ACTIVE_THREAD":
      return { ...state, activeThread: action.payload };

    case "SET_THREADS":
      return { ...state, threads: action.payload };

    case "ADD_MESSAGE_TO_THREAD":
      return {
        ...state,
        threads: state.threads.map((thread) =>
          thread.id === action.payload.threadId
            ? {
                ...thread,
                messages: [...thread.messages, action.payload.message],
                updatedAt: new Date(),
              }
            : thread
        ),
        activeThread:
          state.activeThread?.id === action.payload.threadId
            ? {
                ...state.activeThread,
                messages: [
                  ...state.activeThread.messages,
                  action.payload.message,
                ],
                updatedAt: new Date(),
              }
            : state.activeThread,
      };

    // Settings actions
    case "UPDATE_SETTINGS":
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      };

    case "UPDATE_USER_PREFERENCES":
      return {
        ...state,
        userProfile: state.userProfile
          ? {
              ...state.userProfile,
              preferences: {
                ...state.userProfile.preferences,
                ...action.payload,
              },
            }
          : null,
      };

    default:
      return state;
  }
}

// Context interface
interface CoreAppContextType {
  state: CoreAppState;
  dispatch: React.Dispatch<CoreAppAction>;

  // User actions
  setUserProfile: (profile: UserProfile) => void;
  updateUserPreferences: (
    preferences: Partial<UserProfile["preferences"]>
  ) => void;

  // Thread group actions
  loadThreadGroups: () => Promise<void>;
  createNewThreadGroup: (
    groupName: string,
    groupFeedback?: any
  ) => Promise<ThreadGroup>;
  updateThreadGroupData: (
    id: string,
    updates: Partial<ThreadGroup>
  ) => Promise<void>;
  deleteThreadGroupData: (id: string) => Promise<void>;
  toggleGroupExpansion: (groupId: string, isExpanded: boolean) => void;
  assignThreadToGroup: (
    threadId: string,
    groupId: string | null
  ) => Promise<void>;

  // User threads actions (database)
  loadUserThreads: () => Promise<void>;
  startNewTrainingSession: (
    title: string,
    scenario: any,
    persona: any,
    groupId?: string | null
  ) => Promise<UserThread>;
  addMessageToTrainingSession: (
    threadId: string,
    content: string,
    role: "trainee" | "AI",
    isTraining?: boolean
  ) => Promise<void>;
  completeTrainingSession: (
    threadId: string,
    score: any,
    feedback: any
  ) => Promise<void>;
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
  addMessageToThread: (
    threadId: string,
    message: Thread["messages"][0]
  ) => void;

  // Utility actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateSettings: (settings: Partial<CoreAppState["settings"]>) => void;

  // Computed properties
  activeTrainingThreads: Thread[];
  completedTrainings: Training[];
  recentThreads: Thread[];
  ungroupedThreads: UserThread[];
  groupedThreads: ThreadGroupWithThreads[];
}

// Create context
export const CoreAppDataContext = createContext<CoreAppContextType | undefined>(
  undefined
);

// Provider component
export function CoreAppDataProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { state: authState } = useAuth();
  const [state, dispatch] = useReducer(coreAppReducer, initialState);

  // Load user threads and groups when user authenticates/deauthenticates
  useEffect(() => {
    if (authState.user?.uid) {
      loadUserThreads();
      if (state.settings.groupingEnabled) {
        loadThreadGroups();
      }
    } else {
      dispatch({ type: "CLEAR_USER_THREADS" });
      dispatch({ type: "SET_THREAD_GROUPS", payload: [] });
    }
  }, [authState.user?.uid, state.settings.groupingEnabled]);

  // Load user threads from database
  const loadUserThreads = useCallback(async () => {
    if (!authState.user?.uid) {
      dispatch({ type: "CLEAR_USER_THREADS" });
      return;
    }

    dispatch({ type: "SET_LOADING_THREADS", payload: true });
    dispatch({ type: "SET_ERROR", payload: null });

    try {
      const result = await getUserThreadsByFirebaseUid(authState.user.uid);

      if (result.success) {
        dispatch({
          type: "SET_USER_THREADS",
          payload: {
            threads: result.threads,
            stats: {
              total: result.totalCount,
              active: result.activeCount,
              completed: result.completedCount,
              paused:
                result.totalCount - result.activeCount - result.completedCount,
            },
          },
        });
      } else {
        dispatch({
          type: "SET_ERROR",
          payload: result.error || "Failed to load training sessions",
        });
      }
    } catch (error) {
      console.error("Error loading user threads:", error);
      dispatch({
        type: "SET_ERROR",
        payload: "Failed to load training sessions",
      });
    } finally {
      dispatch({ type: "SET_LOADING_THREADS", payload: false });
    }
  }, [authState.user?.uid]);

  // Load thread groups from database
  const loadThreadGroups = useCallback(async () => {
    if (!authState.user?.uid) {
      dispatch({ type: "SET_THREAD_GROUPS", payload: [] });
      return;
    }

    dispatch({ type: "SET_LOADING_GROUPS", payload: true });
    dispatch({ type: "SET_ERROR", payload: null });

    try {
      const groups = await getThreadGroupsWithCounts();
      dispatch({ type: "SET_THREAD_GROUPS", payload: groups });

      // Group threads with their groups
      groupThreadsWithGroups();
    } catch (error) {
      console.error("Error loading thread groups:", error);
      dispatch({
        type: "SET_ERROR",
        payload: "Failed to load thread groups",
      });
    } finally {
      dispatch({ type: "SET_LOADING_GROUPS", payload: false });
    }
  }, [authState.user?.uid]);

  // Group threads with their thread groups
  const groupThreadsWithGroups = useCallback(() => {
    const groupsWithThreads: ThreadGroupWithThreads[] = state.threadGroups.map(
      (group) => ({
        ...group,
        threads: state.userThreads.filter(
          (thread) => thread.groupId === group.id
        ),
        threadCount: state.userThreads.filter(
          (thread) => thread.groupId === group.id
        ).length,
        isExpanded:
          state.threadGroupsWithThreads.find((g) => g.id === group.id)
            ?.isExpanded ?? true,
      })
    );

    dispatch({
      type: "SET_THREAD_GROUPS_WITH_THREADS",
      payload: groupsWithThreads,
    });
  }, [state.threadGroups, state.userThreads, state.threadGroupsWithThreads]);

  // Update grouped threads when threads or groups change
  useEffect(() => {
    if (state.settings.groupingEnabled) {
      groupThreadsWithGroups();
    }
  }, [state.userThreads, state.threadGroups, state.settings.groupingEnabled]);

  // Create a new thread group
  const createNewThreadGroup = useCallback(
    async (groupName: string, groupFeedback?: any): Promise<ThreadGroup> => {
      if (!authState.user?.uid) {
        throw new Error("User must be logged in to create a thread group");
      }

      dispatch({ type: "SET_LOADING", payload: true });

      try {
        const newGroup = await createThreadGroup({
          groupName,
          groupFeedback,
        });

        dispatch({ type: "ADD_THREAD_GROUP", payload: newGroup });
        return newGroup;
      } catch (error) {
        console.error("Error creating thread group:", error);
        dispatch({
          type: "SET_ERROR",
          payload: "Failed to create thread group",
        });
        throw error;
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    },
    [authState.user]
  );

  // Update a thread group
  const updateThreadGroupData = useCallback(
    async (id: string, updates: Partial<ThreadGroup>) => {
      if (!authState.user?.uid) {
        throw new Error("User must be logged in to update a thread group");
      }

      try {
        await updateThreadGroup(id, updates);
        dispatch({
          type: "UPDATE_THREAD_GROUP",
          payload: { id, updates },
        });
      } catch (error) {
        console.error("Error updating thread group:", error);
        dispatch({
          type: "SET_ERROR",
          payload: "Failed to update thread group",
        });
        throw error;
      }
    },
    [authState.user]
  );

  // Delete a thread group
  const deleteThreadGroupData = useCallback(
    async (id: string) => {
      if (!authState.user?.uid) {
        throw new Error("User must be logged in to delete a thread group");
      }

      try {
        await deleteThreadGroup(id);
        dispatch({ type: "DELETE_THREAD_GROUP", payload: id });
      } catch (error) {
        console.error("Error deleting thread group:", error);
        dispatch({
          type: "SET_ERROR",
          payload: "Failed to delete thread group",
        });
        throw error;
      }
    },
    [authState.user]
  );

  // Toggle group expansion
  const toggleGroupExpansion = useCallback(
    (groupId: string, isExpanded: boolean) => {
      dispatch({
        type: "TOGGLE_GROUP_EXPANSION",
        payload: { groupId, isExpanded },
      });
    },
    []
  );

  // Assign thread to group
  const assignThreadToGroup = useCallback(
    async (threadId: string, groupId: string | null) => {
      if (!authState.user?.uid) {
        throw new Error("User must be logged in to assign threads to groups");
      }

      try {
        await updateThread(threadId, { groupId } as any);

        // Update local state
        dispatch({
          type: "UPDATE_USER_THREAD",
          payload: {
            id: threadId,
            updates: { groupId },
          },
        });
      } catch (error) {
        console.error("Error assigning thread to group:", error);
        dispatch({
          type: "SET_ERROR",
          payload: "Failed to assign thread to group",
        });
        throw error;
      }
    },
    [authState.user]
  );

  // Start a new training session and create it in the database
  const startNewTrainingSession = useCallback(
    async (
      title: string,
      scenario: any,
      persona: any,
      groupId?: string | null
    ): Promise<UserThread> => {
      if (!authState.user?.uid) {
        throw new Error("User must be logged in to start a training session");
      }

      dispatch({ type: "SET_LOADING", payload: true });

      try {
        // First get the user's internal ID
        const { getUserAuthByProvider } = await import(
          "../lib/db/actions/user-auth-actions"
        );
        const userAuth = await getUserAuthByProvider(
          "firebase",
          authState.user.uid
        );

        if (!userAuth) {
          throw new Error("User not found in database");
        }

        // Create thread in database
        const newThread = await createThread({
          title,
          userId: userAuth.userId,
          scenario,
          persona,
          status: "active",
          startedAt: new Date(),
          visibility: "private",
          version: "1",
          deletedAt: null,
          score: null,
          feedback: null,
          completedAt: null,
          groupId: groupId || null,
        });

        // Convert to UserThread format
        const userThread: UserThread = {
          ...newThread,
          isActive: true,
          lastActivity: newThread.updatedAt,
        };

        // Add to local state
        dispatch({ type: "ADD_USER_THREAD", payload: userThread });

        return userThread;
      } catch (error) {
        console.error("Error starting training session:", error);
        dispatch({
          type: "SET_ERROR",
          payload: "Failed to start training session",
        });
        throw error;
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    },
    [authState.user]
  );

  // Add a message to a training session
  const addMessageToTrainingSession = useCallback(
    async (
      threadId: string,
      content: string,
      role: "trainee" | "AI",
      isTraining: boolean = true
    ) => {
      if (!authState.user?.uid) {
        throw new Error("User must be logged in to send messages");
      }

      try {
        // Create message in database
        await createMessage({
          chatId: threadId,
          role: role === "trainee" ? "trainee" : "AI",
          parts: { content },
          attachments: [],
          isTraining,
        });

        // Update thread's last activity
        dispatch({
          type: "UPDATE_USER_THREAD",
          payload: {
            id: threadId,
            updates: {
              lastActivity: new Date(),
              updatedAt: new Date(),
            },
          },
        });
      } catch (error) {
        console.error("Error adding message to training session:", error);
        throw error;
      }
    },
    [authState.user]
  );

  // Complete a training session
  const completeTrainingSession = useCallback(
    async (threadId: string, score: any, feedback: any) => {
      if (!authState.user?.uid) {
        throw new Error(
          "User must be logged in to complete a training session"
        );
      }

      try {
        // Update thread in database
        await updateThread(threadId, {
          status: "completed",
          completedAt: new Date(),
          score,
          feedback,
        } as any);

        // Update in local state
        dispatch({
          type: "UPDATE_USER_THREAD",
          payload: {
            id: threadId,
            updates: {
              status: "completed",
              completedAt: new Date(),
              score,
              feedback,
              isActive: false,
            },
          },
        });
      } catch (error) {
        console.error("Error completing training session:", error);
        throw error;
      }
    },
    [authState.user]
  );

  // Select a user thread (for navigation/viewing)
  const selectUserThread = useCallback((thread: UserThread) => {
    // This could be used to load the thread's messages and set it as active
    console.log("Selected thread:", thread.id, thread.title);
    // You could dispatch actions here to load thread details, messages, etc.
  }, []);

  // Action creators
  const setUserProfile = useCallback((profile: UserProfile) => {
    dispatch({ type: "SET_USER_PROFILE", payload: profile });
  }, []);

  const updateUserPreferences = useCallback(
    (preferences: Partial<UserProfile["preferences"]>) => {
      dispatch({ type: "UPDATE_USER_PREFERENCES", payload: preferences });
    },
    []
  );

  const addTraining = useCallback((training: Training) => {
    dispatch({ type: "ADD_TRAINING", payload: training });
  }, []);

  const updateTraining = useCallback(
    (id: string, updates: Partial<Training>) => {
      dispatch({ type: "UPDATE_TRAINING", payload: { id, updates } });
    },
    []
  );

  const deleteTraining = useCallback((id: string) => {
    dispatch({ type: "DELETE_TRAINING", payload: id });
  }, []);

  const setActiveTraining = useCallback((training: Training | null) => {
    dispatch({ type: "SET_ACTIVE_TRAINING", payload: training });
  }, []);

  const addThread = useCallback((thread: Thread) => {
    dispatch({ type: "ADD_THREAD", payload: thread });
  }, []);

  const updateThread = useCallback((id: string, updates: Partial<Thread>) => {
    dispatch({ type: "UPDATE_THREAD", payload: { id, updates } });
  }, []);

  const deleteThread = useCallback((id: string) => {
    dispatch({ type: "DELETE_THREAD", payload: id });
  }, []);

  const setActiveThread = useCallback((thread: Thread | null) => {
    dispatch({ type: "SET_ACTIVE_THREAD", payload: thread });
  }, []);

  const addMessageToThread = useCallback(
    (threadId: string, message: Thread["messages"][0]) => {
      dispatch({
        type: "ADD_MESSAGE_TO_THREAD",
        payload: { threadId, message },
      });
    },
    []
  );

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: "SET_LOADING", payload: loading });
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: "SET_ERROR", payload: error });
  }, []);

  const updateSettings = useCallback(
    (settings: Partial<CoreAppState["settings"]>) => {
      dispatch({ type: "UPDATE_SETTINGS", payload: settings });
    },
    []
  );

  // Computed properties
  const activeTrainingThreads = React.useMemo(() => {
    return state.activeTraining
      ? state.threads.filter(
          (thread) => thread.trainingId === state.activeTraining!.id
        )
      : [];
  }, [state.threads, state.activeTraining]);

  const completedTrainings = React.useMemo(() => {
    return state.trainings.filter(
      (training) => training.status === "completed"
    );
  }, [state.trainings]);

  const recentThreads = React.useMemo(() => {
    return state.threads
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, 10);
  }, [state.threads]);

  // Get threads that are not assigned to any group
  const ungroupedThreads = React.useMemo(() => {
    return state.userThreads.filter((thread) => !thread.groupId);
  }, [state.userThreads]);

  // Get grouped threads with their group information
  const groupedThreads = React.useMemo(() => {
    return state.threadGroupsWithThreads;
  }, [state.threadGroupsWithThreads]);

  // Auto-save effect (optional)
  useEffect(() => {
    if (state.settings.autoSaveInterval > 0) {
      const interval = setInterval(() => {
        // Here you could implement auto-save logic to localStorage or API
        console.log("Auto-saving app state...");
      }, state.settings.autoSaveInterval);

      return () => clearInterval(interval);
    }
  }, [state.settings.autoSaveInterval]);

  const contextValue: CoreAppContextType = {
    state,
    dispatch,
    setUserProfile,
    updateUserPreferences,
    // Thread group methods
    loadThreadGroups,
    createNewThreadGroup,
    updateThreadGroupData,
    deleteThreadGroupData,
    toggleGroupExpansion,
    assignThreadToGroup,
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
    ungroupedThreads,
    groupedThreads,
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
    throw new Error("useCoreAppData must be used within a CoreAppDataProvider");
  }
  return context;
}

// Export types for use in other components
export type {
  Training,
  Thread,
  UserProfile,
  CoreAppState,
  ThreadGroup,
  ThreadGroupWithThreads,
};
