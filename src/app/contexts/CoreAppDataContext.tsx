"use client";

import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
} from "react";
import { useAuth } from "./AuthContext";
import { getUserThreadsByFirebaseUid } from "../lib/actions/user-threads-actions";
import { createThread, updateThread } from "../lib/db/actions/thread-actions";
import { createMessage } from "../lib/db/actions/message-actions";
import {
  createThreadGroup,
  getAllThreadGroups,
  updateThreadGroup,
  deleteThreadGroup,
  getThreadGroupsWithCounts,
} from "../lib/db/actions/thread-group-actions";
import type { Thread, ThreadGroup, DBMessage } from "../lib/db/schema";
import { ErrorType } from "../lib/error-handling";
import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  isAIMessage,
} from "@langchain/core/messages";
import {
  AlternativeSuggestionsSchema,
  FeedbackSchema,
  MessageRatingSchema,
  PersonaGeneratorSchema,
  scenarioGeneratorSchema,
  ScenarioGeneratorSchema,
  TrainingStateType,
} from "../lib/agents/v2/graph_v2";
import {
  startTrainingSession,
  updateTrainingSession,
  endTrainingSession,
  refineScenario,
  refinePersona,
} from "../lib/actions/training-actions";

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

export interface ExtendedHumanMessage extends HumanMessage {
  messageRating: MessageRatingSchema | null;
  messageSuggestions: AlternativeSuggestionsSchema | null;

  toHumanMessage(): HumanMessage;
}

export class ExtendedHumanMessageImpl
  extends HumanMessage
  implements ExtendedHumanMessage
{
  messageRating: MessageRatingSchema | null;
  messageSuggestions: AlternativeSuggestionsSchema | null;

  constructor(
    content: string | any,
    messageRating: MessageRatingSchema | null = null,
    messageSuggestions: AlternativeSuggestionsSchema | null = null
  ) {
    super(content);
    this.messageRating = messageRating;
    this.messageSuggestions = messageSuggestions;
  }

  toHumanMessage(): HumanMessage {
    // Create a new HumanMessage with the same content and properties
    const humanMessage = new HumanMessage({
      content: this.content,
      additional_kwargs: this.additional_kwargs,
      response_metadata: this.response_metadata,
      id: this.id,
    });
    return humanMessage;
  }
}

export interface ThreadWithMessages {
  thread: Thread;
  messages: DBMessage[] | null;
}

export interface ThreadGroupWithThreads {
  threadGroup: ThreadGroup;
  threads: ThreadWithMessages[];
  isExpanded: boolean;
}

interface CoreAppState {
  // User data
  userProfile: UserProfile | null;

  // Thread/chat data (from database)
  userThreads: ThreadWithMessages[];
  activeThreadId: string | null;

  // Thread groups data
  threadGroups: ThreadGroupWithThreads[];
  activeThreadGroupId: string | null;
  isLoadingGroups: boolean;

  // UI state
  isLoading: boolean;
  isLoadingThreads: boolean;
  error: string | null;
  errorType: ErrorType | null;
  scenario?: ScenarioGeneratorSchema;
  persona?: PersonaGeneratorSchema;
  customScenario: string | null | ScenarioGeneratorSchema;
  customPersona: string | null | PersonaGeneratorSchema;
  isRefiningScenario: boolean;
  isRefiningPersona: boolean;

  // Bulk session state
  bulkSessionConfig: {
    numberOfSessions: number;
    sessions: Array<{
      customScenario: string | null | ScenarioGeneratorSchema;
      customPersona: string | null | PersonaGeneratorSchema;
    }>;
  };
  isBulkSessionInProgress: boolean;

  // Settings
  settings: {
    autoSaveInterval: number;
  };

  // Statistics
  threadStats: {
    total: number;
    active: number;
    completed: number;
    paused: number;
  };
}

// Initial state
const initialState: CoreAppState = {
  // User data
  userProfile: null,

  // Thread/chat data (from database)
  userThreads: [],
  activeThreadId: null,

  // Thread groups data
  threadGroups: [],
  activeThreadGroupId: null,
  isLoadingGroups: false,

  // UI state
  isLoading: false,
  isLoadingThreads: false,
  error: null,
  errorType: null,

  // Training Data
  scenario: undefined,
  persona: undefined,
  customScenario: null,
  customPersona: null,
  isRefiningScenario: false,
  isRefiningPersona: false,

  // Settings
  settings: {
    autoSaveInterval: 0,
  },

  // Statistics
  threadStats: {
    total: 0,
    active: 0,
    completed: 0,
    paused: 0,
  },

  // Bulk session state
  bulkSessionConfig: {
    numberOfSessions: 1,
    sessions: [],
  },
  isBulkSessionInProgress: false,
};

// Context interface
export interface CoreAppContextType {
  state: CoreAppState;

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
  ) => Promise<ThreadWithMessages>;
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
  selectUserThread: (threadId: string) => Promise<void>;

  // Scenario and Persona actions
  setScenario: (scenario: ScenarioGeneratorSchema | null) => void;
  setPersona: (persona: PersonaGeneratorSchema | null) => void;
  setCustomScenario: (
    customScenario: string | null | ScenarioGeneratorSchema
  ) => void;
  setCustomPersona: (
    customPersona: string | null | PersonaGeneratorSchema
  ) => void;
  setIsRefiningScenario: (isRefining: boolean) => void;
  setIsRefiningPersona: (isRefining: boolean) => void;

  // Bulk session actions
  setBulkSessionCount: (count: number) => void;
  updateBulkSessionConfig: (
    index: number,
    config: {
      customScenario: string | null | ScenarioGeneratorSchema;
      customPersona: string | null | PersonaGeneratorSchema;
    }
  ) => void;
  clearBulkSessionConfig: () => void;

  // Utility actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null, errorType: ErrorType | null) => void;
  setActiveThreadId: (id: string | null) => void;

  // New Training Functions
  handleStartTraining: () => void;
  handleUpdateTraining: (
    threadId: string,
    userMessage: string,
    scenario: ScenarioGeneratorSchema,
    persona: PersonaGeneratorSchema,
    conversationHistory: BaseMessage[]
  ) => Promise<void>;
  handleEndTraining: (
    threadId: string,
    scenario: ScenarioGeneratorSchema,
    persona: PersonaGeneratorSchema,
    conversationHistory: BaseMessage[]
  ) => Promise<void>;
  handleRefineScenario: (customScenario: string) => Promise<void>;
  handleRefinePersona: (customPersona: string) => Promise<void>;

  // Bulk session functions
  handleStartBulkTraining: (groupId: string) => Promise<void>;
  handleEndBulkTraining: (groupId: string) => Promise<void>;
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
  const [state, setState] = useState(initialState);

  // Load user threads and groups when user authenticates/deauthenticates
  useEffect(() => {
    if (authState.user?.uid) {
      loadUserThreads();
      loadThreadGroups();
    } else {
      // dispatch({ type: "CLEAR_USER_THREADS" });

      // dispatch({ type: "SET_THREAD_GROUPS", payload: [] });
      setState((prevState) => ({
        ...prevState,

        threadGroups: [],
        userThreads: [],
        threadStats: {
          total: 0,
          active: 0,
          completed: 0,
          paused: 0,
        },
      }));
    }
  }, [authState.user?.uid]);

  // Load user threads from database
  const loadUserThreads = useCallback(async () => {
    if (!authState.user?.uid) {
      // dispatch({ type: "CLEAR_USER_THREADS" });
      setState((prevState) => ({
        ...prevState,
        userThreads: [],
        threadStats: {
          total: 0,
          active: 0,
          completed: 0,
          paused: 0,
        },
      }));
      return;
    }

    // dispatch({ type: "SET_LOADING_THREADS", payload: true });
    // dispatch({ type: "SET_ERROR", payload: null });
    setState((prevState) => ({
      ...prevState,
      isLoadingThreads: true,
      error: null,
    }));

    try {
      const result = await getUserThreadsByFirebaseUid(authState.user.uid);

      if (result.success) {
        // dispatch({
        //   type: "SET_USER_THREADS",
        //   payload: {
        //     threads: result.threads,
        //     stats: {
        //       total: result.totalCount,
        //       active: result.activeCount,
        //       completed: result.completedCount,
        //       paused:
        //         result.totalCount - result.activeCount - result.completedCount,
        //     },
        //   },
        // });
        // Load threads without messages (lazy-load messages when thread is selected)
        setState((prevState) => ({
          ...prevState,
          userThreads: result.threads.map((thread) => ({
            thread,
            messages: null, // Messages will be fetched when thread is selected
          })),
          threadStats: {
            total: result.totalCount,
            active: result.activeCount,
            completed: result.completedCount,
            paused:
              result.totalCount - result.activeCount - result.completedCount,
          },
        }));

        state.userThreads.forEach((threadWithMessages) => {
          console.log("Thread ID:", threadWithMessages.thread.id);
        });
      } else {
        // dispatch({
        //   type: "SET_ERROR",
        //   payload: result.error || "Failed to load training sessions",
        // });
        setState((prevState) => ({
          ...prevState,
          error: result.error || "Failed to load training sessions",
        }));
      }
    } catch (error) {
      console.error("Error loading user threads:", error);
      // dispatch({
      //   type: "SET_ERROR",
      //   payload: "Failed to load training sessions",
      // });
      setState((prevState) => ({
        ...prevState,
        error: "Failed to load training sessions",
      }));
    } finally {
      // dispatch({ type: "SET_LOADING_THREADS", payload: false });
      setState((prevState) => ({
        ...prevState,
        isLoadingThreads: false,
      }));
    }
  }, [authState.user?.uid]);

  // Load thread groups from database
  const loadThreadGroups = useCallback(async () => {
    if (!authState.user?.uid) {
      // dispatch({ type: "SET_THREAD_GROUPS", payload: [] });
      setState((prevState) => ({
        ...prevState,
        threadGroups: [],
      }));
      return;
    }

    // dispatch({ type: "SET_LOADING_GROUPS", payload: true });
    // dispatch({ type: "SET_ERROR", payload: null });
    setState((prevState) => ({
      ...prevState,
      isLoadingGroups: true,
      error: null,
    }));

    try {
      // Get the user's internal ID
      const { getUserAuthByEmail } = await import(
        "../lib/db/actions/user-auth-actions"
      );
      const userAuth = await getUserAuthByEmail(authState.user.email ?? "");

      if (!userAuth) {
        throw new Error("User not found in database");
      }

      const groups = await getThreadGroupsWithCounts(userAuth.userId);
      // dispatch({ type: "SET_THREAD_GROUPS", payload: groups });
      setState((prevState) => ({
        ...prevState,
        threadGroups: groups.map((group) => ({
          threadGroup: group,
          threads: [],
          isExpanded: false,
        })),
      }));

      // Group threads with their groups
      groupThreadsWithGroups();
    } catch (error) {
      console.error("Error loading thread groups:", error);
      // dispatch({
      //   type: "SET_ERROR",
      //   payload: "Failed to load thread groups",
      // });
      setState((prevState) => ({
        ...prevState,
        error: "Failed to load thread groups",
      }));
    } finally {
      // dispatch({ type: "SET_LOADING_GROUPS", payload: false });
      setState((prevState) => ({
        ...prevState,
        isLoadingGroups: false,
      }));
    }
  }, [authState.user?.uid, authState.user?.email]);

  // Group threads with their thread groups
  const groupThreadsWithGroups = useCallback(() => {
    const groupsWithThreads: ThreadGroupWithThreads[] = state.threadGroups.map(
      (group) => ({
        ...group,
        threads: state.userThreads.filter(
          (thread) => thread.thread.groupId === group.threadGroup.id
        ),
        threadCount: state.userThreads.filter(
          (thread) => thread.thread.groupId === group.threadGroup.id
        ).length,
        isExpanded:
          state.threadGroups.find(
            (g) => g.threadGroup.id === group.threadGroup.id
          )?.isExpanded ?? true,
      })
    );

    // dispatch({
    //   type: "SET_THREAD_GROUPS_WITH_THREADS",
    //   payload: groupsWithThreads,
    // });
    setState((prevState) => ({
      ...prevState,
      threadGroupsWithThreads: groupsWithThreads,
    }));
  }, [state.threadGroups, state.userThreads, state.threadGroups]);

  // Update grouped threads when threads or groups change
  useEffect(() => {
    groupThreadsWithGroups();
  }, [state.userThreads, state.threadGroups]);

  // Create a new thread group
  const createNewThreadGroup = useCallback(
    async (groupName: string, groupFeedback?: any): Promise<ThreadGroup> => {
      if (!authState.user?.uid) {
        throw new Error("User must be logged in to create a thread group");
      }

      // dispatch({ type: "SET_LOADING", payload: true });
      setState((prevState) => ({
        ...prevState,
        isLoading: true,
      }));

      try {
        // Get the user's internal ID
        const { getUserAuthByEmail } = await import(
          "../lib/db/actions/user-auth-actions"
        );
        const userAuth = await getUserAuthByEmail(authState.user.email ?? "");

        if (!userAuth) {
          throw new Error("User not found in database");
        }

        const newGroup = await createThreadGroup({
          userId: userAuth.userId,
          groupName,
          groupFeedback,
        });

        // dispatch({ type: "ADD_THREAD_GROUP", payload: newGroup });
        setState((prevState) => ({
          ...prevState,
          threadGroups: [
            ...prevState.threadGroups,
            {
              threadGroup: newGroup,
              threads: [],
              isExpanded: false,
            },
          ],
        }));
        return newGroup;
      } catch (error) {
        console.error("Error creating thread group:", error);
        // dispatch({
        //   type: "SET_ERROR",
        //   payload: "Failed to create thread group",
        // });
        setState((prevState) => ({
          ...prevState,
          error: "Failed to create thread group",
        }));
        throw error;
      } finally {
        // dispatch({ type: "SET_LOADING", payload: false });
        setState((prevState) => ({
          ...prevState,
          isLoading: false,
        }));
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
        // dispatch({
        //   type: "UPDATE_THREAD_GROUP",
        //   payload: { id, updates },
        // });
        setState((prevState) => ({
          ...prevState,
          threadGroups: prevState.threadGroups.map((group) =>
            group.threadGroup.id === id
              ? { ...group, threadGroup: { ...group.threadGroup, ...updates } }
              : group
          ),
        }));
      } catch (error) {
        console.error("Error updating thread group:", error);
        // dispatch({
        //   type: "SET_ERROR",
        //   payload: "Failed to update thread group",
        // });
        setState((prevState) => ({
          ...prevState,
          error: "Failed to update thread group",
        }));
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
        // dispatch({ type: "DELETE_THREAD_GROUP", payload: id });
        setState((prevState) => ({
          ...prevState,
          threadGroups: prevState.threadGroups.filter(
            (group) => group.threadGroup.id !== id
          ),
        }));
      } catch (error) {
        console.error("Error deleting thread group:", error);
        // dispatch({
        //   type: "SET_ERROR",
        //   payload: "Failed to delete thread group",
        // });
        setState((prevState) => ({
          ...prevState,
          error: "Failed to delete thread group",
        }));
        throw error;
      }
    },
    [authState.user]
  );

  // Toggle group expansion
  const toggleGroupExpansion = useCallback(
    (groupId: string, isExpanded: boolean) => {
      setState((prevState) => ({
        ...prevState,
        threadGroups: prevState.threadGroups.map((group) =>
          group.threadGroup.id === groupId ? { ...group, isExpanded } : group
        ),
      }));
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
        setState((prevState) => ({
          ...prevState,
          userThreads: prevState.userThreads.map((threadWithMessages) =>
            threadWithMessages.thread.id === threadId
              ? {
                  ...threadWithMessages,
                  thread: { ...threadWithMessages.thread, groupId },
                }
              : threadWithMessages
          ),
        }));
      } catch (error) {
        console.error("Error assigning thread to group:", error);
        setState((prevState) => ({
          ...prevState,
          error: "Failed to assign thread to group",
        }));
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
    ): Promise<ThreadWithMessages> => {
      if (!authState.user?.uid) {
        throw new Error("User must be logged in to start a training session");
      }

      setState((prevState) => ({
        ...prevState,
        isLoading: true,
      }));

      try {
        // First get the user's internal ID
        const { getUserAuthByEmail } = await import(
          "../lib/db/actions/user-auth-actions"
        );
        const userAuth = await getUserAuthByEmail(authState.user.email ?? "");

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

        // Convert to ThreadWithMessages format
        const userThread: ThreadWithMessages = {
          thread: newThread,
          messages: null,
        };

        // Add to local state
        setState((prevState) => ({
          ...prevState,
          userThreads: [
            ...prevState.userThreads,
            {
              thread: newThread,
              messages: null,
            },
          ],
        }));

        return userThread;
      } catch (error) {
        console.error("Error starting training session:", error);
        setState((prevState) => ({
          ...prevState,
          error: "Failed to start training session",
        }));
        throw error;
      } finally {
        setState((prevState) => ({
          ...prevState,
          isLoading: false,
        }));
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
          messageRating: null,
          messageSuggestions: null,
        });

        // Update thread's last activity
        setState((prevState) => ({
          ...prevState,
          userThreads: prevState.userThreads.map((threadWithMessages) =>
            threadWithMessages.thread.id === threadId
              ? {
                  ...threadWithMessages,
                  thread: {
                    ...threadWithMessages.thread,
                    updatedAt: new Date(),
                  },
                }
              : threadWithMessages
          ),
        }));
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
        setState((prevState) => ({
          ...prevState,
          userThreads: prevState.userThreads.map((threadWithMessages) =>
            threadWithMessages.thread.id === threadId
              ? {
                  ...threadWithMessages,
                  thread: {
                    ...threadWithMessages.thread,
                    status: "completed",
                    completedAt: new Date(),
                    score,
                    feedback,
                  },
                }
              : threadWithMessages
          ),
        }));
      } catch (error) {
        console.error("Error completing training session:", error);
        throw error;
      }
    },
    [authState.user]
  );

  // Select a user thread (for navigation/viewing)
  const selectUserThread = useCallback(
    async (threadId: string) => {
      try {
        // Set the active thread ID immediately
        setState((prevState) => ({
          ...prevState,
          activeThreadId: threadId,
        }));

        // Loop through userThreads and console log the id
        state.userThreads.forEach((threadWithMessages) => {
          console.log("Thread ID:", threadWithMessages.thread.id);
        });

        // Find the thread in the current state
        const thread = state.userThreads.find(
          (threadWithMessages) => threadWithMessages.thread.id === threadId
        );

        if (!thread) {
          console.error("Thread not found:", threadId);
          setState((prevState) => ({
            ...prevState,
            error: "Thread not found",
          }));
          return;
        }

        // Check if messages are already loaded
        if (thread.messages !== null) {
          console.log(
            "Thread already has messages loaded:",
            thread.thread.id,
            thread.thread.title,
            "with",
            thread.messages.length,
            "messages"
          );
          return;
        }

        // Messages not loaded, fetch from database
        setState((prevState) => ({
          ...prevState,
          isLoading: true,
        }));

        const { getMessagesByChatId } = await import(
          "../lib/db/actions/message-actions"
        );
        const messages = await getMessagesByChatId(thread.thread.id);

        console.log(`message: ${messages} \nlength: ${messages.length}`);

        // Sort messages by timestamp
        const sortedMessages = messages.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        // Update the thread with messages in state
        setState((prevState) => ({
          ...prevState,
          userThreads: prevState.userThreads.map((threadWithMessages) =>
            threadWithMessages.thread.id === thread.thread.id
              ? {
                  ...threadWithMessages,
                  messages: sortedMessages,
                }
              : threadWithMessages
          ),
          isLoading: false,
        }));

        console.log(
          "Fetched messages for thread:",
          thread.thread.id,
          thread.thread.title,
          "with",
          sortedMessages.length,
          "messages"
        );
      } catch (error) {
        console.error("Error selecting thread:", error);
        setState((prevState) => ({
          ...prevState,
          error: "Failed to load thread messages",
          isLoading: false,
        }));
      }
    },
    [state.userThreads]
  );

  // Action creators
  const setUserProfile = useCallback((profile: UserProfile) => {
    setState((prevState) => ({
      ...prevState,
      userProfile: profile,
    }));
  }, []);

  const updateUserPreferences = useCallback(
    (preferences: Partial<UserProfile["preferences"]>) => {
      setState((prevState) => ({
        ...prevState,
        userProfile: prevState.userProfile
          ? {
              ...prevState.userProfile,
              preferences: {
                ...prevState.userProfile.preferences,
                ...preferences,
              },
            }
          : null,
      }));
    },
    []
  );

  const setLoading = useCallback((loading: boolean) => {
    setState((prevState) => ({
      ...prevState,
      isLoading: loading,
    }));
  }, []);

  const setError = useCallback(
    (error: string | null, errorType: ErrorType | null) => {
      setState((prevState) => ({
        ...prevState,
        error,
        errorType,
      }));
    },
    []
  );

  const setActiveThreadId = useCallback((threadId: string | null) => {
    setState((prevState) => ({
      ...prevState,
      activeThreadId: threadId,
    }));
  }, []);

  // Scenario and Persona action creators
  const setScenario = useCallback(
    (scenario: ScenarioGeneratorSchema | null) => {
      setState((prevState) => ({
        ...prevState,
        scenario: scenario || undefined,
      }));
    },
    []
  );

  const setPersona = useCallback((persona: PersonaGeneratorSchema | null) => {
    setState((prevState) => ({
      ...prevState,
      persona: persona || undefined,
    }));
  }, []);

  const setCustomScenario = useCallback(
    (customScenario: string | null | ScenarioGeneratorSchema) => {
      setState((prevState) => ({
        ...prevState,
        customScenario,
      }));
    },
    []
  );

  const setCustomPersona = useCallback(
    (customPersona: string | null | PersonaGeneratorSchema) => {
      setState((prevState) => ({
        ...prevState,
        customPersona,
      }));
    },
    []
  );

  const setIsRefiningScenario = useCallback((isRefining: boolean) => {
    setState((prevState) => ({
      ...prevState,
      isRefiningScenario: isRefining,
    }));
  }, []);

  const setIsRefiningPersona = useCallback((isRefining: boolean) => {
    setState((prevState) => ({
      ...prevState,
      isRefiningPersona: isRefining,
    }));
  }, []);

  // Bulk session action creators
  const setBulkSessionCount = useCallback((count: number) => {
    setState((prevState) => {
      const sessions = Array.from({ length: count }, (_, i) => ({
        customScenario:
          prevState.bulkSessionConfig.sessions[i]?.customScenario || null,
        customPersona:
          prevState.bulkSessionConfig.sessions[i]?.customPersona || null,
      }));

      return {
        ...prevState,
        bulkSessionConfig: {
          numberOfSessions: count,
          sessions,
        },
      };
    });
  }, []);

  const updateBulkSessionConfig = useCallback(
    (
      index: number,
      config: {
        customScenario: string | null | ScenarioGeneratorSchema;
        customPersona: string | null | PersonaGeneratorSchema;
      }
    ) => {
      setState((prevState) => {
        const sessions = [...prevState.bulkSessionConfig.sessions];
        sessions[index] = config;

        return {
          ...prevState,
          bulkSessionConfig: {
            ...prevState.bulkSessionConfig,
            sessions,
          },
        };
      });
    },
    []
  );

  const clearBulkSessionConfig = useCallback(() => {
    setState((prevState) => ({
      ...prevState,
      bulkSessionConfig: {
        numberOfSessions: 1,
        sessions: [],
      },
    }));
  }, []);

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

  const handleStartTraining = useCallback(async () => {
    if (!authState.user?.uid) {
      setError(
        "User must be logged in to start a training session",
        "validation"
      );
      return;
    }

    // // Validate that we have either generated scenario/persona or custom ones
    // if (!state.scenario && !state.customScenario) {
    //   setError(
    //     "Please generate or provide a scenario before starting training",
    //     "validation"
    //   );
    //   return;
    // }

    // if (!state.persona && !state.customPersona) {
    //   setError(
    //     "Please generate or provide a persona before starting training",
    //     "validation"
    //   );
    //   return;
    // }

    setLoading(true);
    setError(null, null);

    try {
      // First get the user's internal ID from the database
      const { getUserAuthByEmail } = await import(
        "../lib/db/actions/user-auth-actions"
      );
      const userAuth = await getUserAuthByEmail(authState.user.email ?? "");

      if (!userAuth) {
        throw new Error("User not found in database. Please contact support.");
      }

      // Determine which scenario and persona to use
      // If customScenario/customPersona are schema objects, use them; otherwise use scenario/persona
      const scenarioToUse =
        typeof state.customScenario === "object" &&
        state.customScenario !== null
          ? state.customScenario
          : state.scenario;
      const personaToUse =
        typeof state.customPersona === "object" && state.customPersona !== null
          ? state.customPersona
          : state.persona;

      // Call the training action with the determined scenario and persona FIRST
      const result = await startTrainingSession({
        scenario: scenarioToUse,
        guestPersona: personaToUse,
      });

      console.log(`result: ${result}`);

      // Check if AI operation was successful before proceeding with database operations
      if (result.error) {
        throw new Error(result.error);
      }

      // Only proceed with database operations if AI was successful
      console.log(
        "AI training start successful, proceeding with database operations..."
      );

      // Create thread in database with the results
      const threadTitle = result.scenario?.scenario_title || "Training Session";

      const newThread = await createThread({
        title: threadTitle,
        userId: userAuth.userId, // Use the internal user ID, not Firebase UID
        visibility: "private",
        scenario: result.scenario || scenarioToUse || {},
        persona: result.guestPersona || personaToUse || {},
        status: "active",
        score: null,
        feedback: null,
        startedAt: new Date(),
        completedAt: null,
        version: "2",
        deletedAt: null,
        groupId: null,
      });

      // Save initial messages to database if any were generated
      const savedMessages: any[] = [];
      if (result.finalOutput && result.finalOutput.length > 0) {
        console.log(
          `Saving ${result.finalOutput.length} initial messages to database for thread ${newThread.id}`
        );
        const messageRole = "AI";
        console.log(`messageRole: ${messageRole}`);
        const contentStr = result.finalOutput;

        console.log(`contentStr: ${contentStr}`);

        const savedMessage = await createMessage({
          chatId: newThread.id,
          role: messageRole,
          parts: { content: contentStr },
          attachments: [],
          isTraining: true,
          messageRating: null,
          messageSuggestions: null,
        });
        savedMessages.push(savedMessage);
        console.log(
          `Successfully saved message ${savedMessage.id} for thread ${newThread.id}`
        );
      } else {
        console.log(`No initial messages to save for thread ${newThread.id}`);
      }

      // Update the state with the new thread
      setState((prevState) => ({
        ...prevState,
        userThreads: [
          ...prevState.userThreads,
          { thread: newThread, messages: savedMessages },
        ],
        activeThreadId: newThread.id,
        // Move customScenario/customPersona to scenario/persona after training starts
        scenario: result.scenario || scenarioToUse,
        persona: result.guestPersona || personaToUse,
        // Clear custom fields after moving to scenario/persona
        customScenario: null,
        customPersona: null,
      }));

      console.log(
        "Started new training session:",
        newThread.id,
        "with",
        savedMessages.length,
        "initial messages"
      );
    } catch (error) {
      console.error("Error starting new training session:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to start new training session";
      setError(errorMessage, "session");
    } finally {
      setLoading(false);
    }
  }, [
    authState.user,
    state.scenario,
    state.persona,
    state.customScenario,
    state.customPersona,
    setLoading,
    setError,
  ]);

  const handleUpdateTraining = useCallback(
    async (
      threadId: string,
      userMessage: string,
      scenario: ScenarioGeneratorSchema,
      persona: PersonaGeneratorSchema,
      conversationHistory: BaseMessage[]
    ) => {
      if (!authState.user?.uid) {
        setError(
          "User must be logged in to update training session",
          "validation"
        );
        return;
      }

      setLoading(true);
      setError(null, null);

      try {
        // Add the new user message to conversation history for AI processing
        const { HumanMessage } = await import("@langchain/core/messages");

        // Convert ExtendedHumanMessageImpl instances to HumanMessage
        const processedHistory = conversationHistory.map((message) => {
          if (message instanceof ExtendedHumanMessageImpl) {
            return message.toHumanMessage();
          }
          return message;
        });

        const updatedHistory = [
          ...processedHistory,
          new HumanMessage(userMessage),
        ];

        // Locally update the thread with the new user message immediately for better UX
        setState((prevState) => ({
          ...prevState,
          userThreads: prevState.userThreads.map((threadWithMessages) =>
            threadWithMessages.thread.id === threadId
              ? {
                  ...threadWithMessages,
                  messages: threadWithMessages.messages
                    ? [
                        ...threadWithMessages.messages,
                        {
                          id: `temp-${Date.now()}`, // Temporary ID
                          chatId: threadId,
                          role: "trainee",
                          parts: { content: userMessage },
                          attachments: [],
                          isTraining: true,
                          messageRating: null,
                          messageSuggestions: null,
                          createdAt: new Date(),
                          updatedAt: new Date(),
                        },
                      ]
                    : [
                        {
                          id: `temp-${Date.now()}`,
                          chatId: threadId,
                          role: "trainee",
                          parts: { content: userMessage },
                          attachments: [],
                          isTraining: true,
                          messageRating: null,
                          messageSuggestions: null,
                          createdAt: new Date(),
                          updatedAt: new Date(),
                        },
                      ],
                }
              : threadWithMessages
          ),
        }));

        // Call the update training action with updated conversation history FIRST
        const result = await updateTrainingSession({
          scenario: scenario,
          guestPersona: persona,
          messages: updatedHistory,
        });

        // Check if AI operation was successful before proceeding with database operations
        if (result.error) {
          throw new Error(result.error);
        }

        // Only proceed with database operations if AI was successful
        console.log(
          "AI training update successful, proceeding with database operations..."
        );

        // Save the user message to database
        const userMessageRecord = await createMessage({
          chatId: threadId,
          role: "trainee",
          parts: { content: userMessage },
          attachments: [],
          isTraining: true,
          messageRating: result.lastMessageRating || null,
          messageSuggestions: result.lastMessageRatingReason || null,
        });

        // Update the user message with rating and suggestions if available
        if (result.lastMessageRating || result.lastMessageRatingReason) {
          const { updateMessageRatingAndSuggestions } = await import(
            "../lib/db/actions/message-actions"
          );
          await updateMessageRatingAndSuggestions(
            userMessageRecord.id,
            result.lastMessageRating || null,
            result.lastMessageRatingReason || null
          );
        }

        // Save the AI response to database if present
        if (result.guestResponse) {
          const responseContent =
            typeof result.guestResponse === "string"
              ? result.guestResponse
              : String(result.guestResponse);

          await createMessage({
            chatId: threadId,
            role: "AI",
            parts: { content: responseContent },
            attachments: [],
            isTraining: true,
            messageRating: null,
            messageSuggestions: null,
          });
        }

        // Update thread status and feedback if training is completed
        if (result.status === "completed") {
          console.log(
            `Training completed for thread ${threadId}, updating database with completion status and feedback`
          );
          await updateThread(threadId, {
            status: "completed",
            completedAt: new Date(),
            feedback: result.feedback || null,
            updatedAt: new Date(),
          } as any);
        } else {
          // Just update the last activity timestamp
          await updateThread(threadId, {
            updatedAt: new Date(),
          } as any);
        }

        // Reload the thread messages from database to ensure consistency
        const { getMessagesByChatId } = await import(
          "../lib/db/actions/message-actions"
        );
        const updatedMessages = await getMessagesByChatId(threadId);
        const sortedMessages = updatedMessages.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        // Update local state with refreshed data
        setState((prevState) => ({
          ...prevState,
          userThreads: prevState.userThreads.map((threadWithMessages) =>
            threadWithMessages.thread.id === threadId
              ? {
                  ...threadWithMessages,
                  thread: {
                    ...threadWithMessages.thread,
                    updatedAt: new Date(),
                    status:
                      result.status === "completed"
                        ? "completed"
                        : threadWithMessages.thread.status,
                    feedback:
                      result.feedback || threadWithMessages.thread.feedback,
                    completedAt:
                      result.status === "completed"
                        ? new Date()
                        : threadWithMessages.thread.completedAt,
                  },
                  messages: sortedMessages,
                }
              : threadWithMessages
          ),
        }));

        console.log(
          "Updated training session:",
          threadId,
          "with status:",
          result.status,
          "and",
          sortedMessages.length,
          "total messages"
        );

        // Check if all threads in the group are completed and trigger group feedback if needed
        if (result.status === "completed") {
          console.log(
            "Thread completed, checking if group feedback should be triggered..."
          );

          // Find the thread to get its groupId
          const currentThread = state.userThreads.find(
            (t) => t.thread.id === threadId
          );

          if (currentThread?.thread.groupId) {
            const groupId = currentThread.thread.groupId;
            console.log(
              `Checking if all threads in group ${groupId} are completed...`
            );

            // Get all threads in the same group from local state
            const groupThreads = state.userThreads.filter((t) => {
              console.log(
                `${t.thread.id} is completed? ${
                  t.thread.status === "completed" ? "YES" : "NOT"
                }`
              );
              return t.thread.groupId === groupId;
            });

            // Check if all threads are completed
            const allCompleted = groupThreads.every((t) => {
              if (t.thread.id === threadId) return true;
              else {
                return t.thread.status === "completed";
              }
            });

            console.log(
              `Group ${groupId} has ${groupThreads.length} threads, all completed: ${allCompleted}`
            );

            if (allCompleted) {
              console.log(
                `All threads in group ${groupId} are completed. Triggering group feedback...`
              );

              // Trigger group feedback generation asynchronously
              (async () => {
                try {
                  const { endBulkTrainingSession } = await import(
                    "../lib/actions/training-actions"
                  );

                  const feedbackResult = await endBulkTrainingSession({
                    groupId,
                  });

                  if (feedbackResult.success) {
                    console.log(
                      "Group feedback generated successfully:",
                      feedbackResult.groupFeedback
                    );

                    // Update the thread group with the feedback
                    await updateThreadGroupData(groupId, {
                      groupFeedback: feedbackResult.groupFeedback,
                    });

                    // Reload thread groups to reflect the updated feedback
                    await loadThreadGroups();

                    console.log(
                      `Successfully updated group ${groupId} with feedback`
                    );
                  } else {
                    console.error(
                      "Failed to generate group feedback:",
                      feedbackResult.error
                    );
                  }
                } catch (err) {
                  console.error("Error in group feedback generation:", err);
                }
              })();
            }
          }
        }
      } catch (error) {
        console.error("Error updating training session:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to update training session";
        setError(errorMessage, "session");
      } finally {
        setLoading(false);
      }
    },
    [
      authState.user,
      setLoading,
      setError,
      state.userThreads,
      updateThreadGroupData,
      loadThreadGroups,
    ]
  );

  const handleEndTraining = useCallback(
    async (
      threadId: string,
      scenario: ScenarioGeneratorSchema,
      persona: PersonaGeneratorSchema,
      conversationHistory: BaseMessage[]
    ) => {
      if (!authState.user?.uid) {
        setError(
          "User must be logged in to end training session",
          "validation"
        );
        return;
      }

      if (!scenario || !persona) {
        setError(
          "Scenario and persona are required to end training session",
          "validation"
        );
        return;
      }

      if (!conversationHistory || conversationHistory.length === 0) {
        setError(
          "Cannot end training session without any conversation history",
          "validation"
        );
        return;
      }

      setLoading(true);
      setError(null, null);

      try {
        // Convert ExtendedHumanMessageImpl instances to HumanMessage
        const processedHistory = conversationHistory.map((message) => {
          if (message instanceof ExtendedHumanMessageImpl) {
            return message.toHumanMessage();
          }
          return message;
        });

        // Call the end training action FIRST
        const result = await endTrainingSession({
          scenario,
          guestPersona: persona,
          messages: processedHistory,
        });

        // Check if AI operation was successful before proceeding with database operations
        if (result.error) {
          throw new Error(result.error);
        }

        // Only proceed with database operations if AI was successful
        console.log(
          "AI training end successful, proceeding with database operations..."
        );

        // Update thread in database with completion status and feedback
        const completedAt = new Date();
        await updateThread(threadId, {
          status: "completed",
          completedAt,
          feedback: result.feedback || null,
          updatedAt: completedAt,
        } as any);

        // Update local state
        setState((prevState) => ({
          ...prevState,
          userThreads: prevState.userThreads.map((threadWithMessages) =>
            threadWithMessages.thread.id === threadId
              ? {
                  ...threadWithMessages,
                  thread: {
                    ...threadWithMessages.thread,
                    status: "completed",
                    completedAt,
                    feedback: result.feedback || null,
                    updatedAt: completedAt,
                  },
                }
              : threadWithMessages
          ),
        }));

        console.log(
          "Ended training session:",
          threadId,
          "with feedback:",
          result.feedback ? "Present" : "Not present"
        );
      } catch (error) {
        console.error("Error ending training session:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to end training session";
        setError(errorMessage, "session");
      } finally {
        setLoading(false);
      }
    },
    [authState.user, setLoading, setError]
  );

  const handleRefineScenario = useCallback(
    async (customScenario: string) => {
      if (!authState.user?.uid) {
        setError("User must be logged in to refine scenario", "validation");
        return;
      }

      if (!customScenario || customScenario.trim().length === 0) {
        setError("Please provide a scenario to refine", "validation");
        return;
      }

      setIsRefiningScenario(true);
      setError(null, null);

      try {
        // Call the refine scenario action FIRST
        const result = await refineScenario({
          scenario: customScenario.trim(),
        });

        // Check if AI operation was successful before proceeding with state updates
        if (result.error) {
          throw new Error(result.error);
        }

        // Only proceed with state updates if AI was successful
        if (result.refinedScenario) {
          console.log("AI scenario refinement successful, updating state...");
          setCustomScenario(result.refinedScenario);
          console.log("Refined scenario successfully");
        } else {
          throw new Error("No refined scenario returned from the service");
        }
      } catch (error) {
        console.error("Error refining scenario:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to refine scenario";
        setError(errorMessage, "agent");
      } finally {
        setIsRefiningScenario(false);
      }
    },
    [authState.user, setIsRefiningScenario, setError, setScenario]
  );

  const handleRefinePersona = useCallback(
    async (customPersona: string) => {
      if (!authState.user?.uid) {
        setError("User must be logged in to refine persona", "validation");
        return;
      }

      if (!customPersona || customPersona.trim().length === 0) {
        setError("Please provide a persona to refine", "validation");
        return;
      }

      setIsRefiningPersona(true);
      setError(null, null);

      try {
        // Call the refine persona action FIRST
        const result = await refinePersona({
          persona: customPersona.trim(),
        });

        // Check if AI operation was successful before proceeding with state updates
        if (result.error) {
          throw new Error(result.error);
        }

        // Only proceed with state updates if AI was successful
        if (result.refinedPersona) {
          console.log("AI persona refinement successful, updating state...");
          setCustomPersona(result.refinedPersona);
          console.log("Refined persona successfully");
        } else {
          throw new Error("No refined persona returned from the service");
        }
      } catch (error) {
        console.error("Error refining persona:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to refine persona";
        setError(errorMessage, "agent");
      } finally {
        setIsRefiningPersona(false);
      }
    },
    [authState.user, setIsRefiningPersona, setError, setPersona]
  );

  const handleStartBulkTraining = useCallback(
    async (groupId: string) => {
      if (!authState.user?.uid) {
        setError(
          "User must be logged in to start bulk training sessions",
          "validation"
        );
        return;
      }

      const { numberOfSessions, sessions } = state.bulkSessionConfig;

      if (numberOfSessions < 1) {
        setError("Number of sessions must be at least 1", "validation");
        return;
      }

      if (sessions.length !== numberOfSessions) {
        setError(
          "Session configuration mismatch. Please reconfigure bulk sessions.",
          "validation"
        );
        return;
      }

      setState((prevState) => ({
        ...prevState,
        isBulkSessionInProgress: true,
        isLoading: true,
      }));
      setError(null, null);

      try {
        console.log(
          `Starting ${numberOfSessions} training sessions in parallel...`
        );

        // Get user's internal ID once
        const { getUserAuthByEmail } = await import(
          "../lib/db/actions/user-auth-actions"
        );
        const userAuth = await getUserAuthByEmail(authState.user.email ?? "");

        if (!userAuth) {
          throw new Error(
            "User not found in database. Please contact support."
          );
        }

        // Create array of promises for parallel execution
        const sessionPromises = sessions.map(async (sessionConfig, index) => {
          try {
            console.log(
              `Initializing session ${index + 1}/${numberOfSessions}...`
            );

            // Determine if we should use custom scenario/persona or generate new ones
            const shouldUseCustomScenario =
              sessionConfig.customScenario &&
              (typeof sessionConfig.customScenario === "string"
                ? sessionConfig.customScenario.trim().length > 0
                : true);
            const shouldUseCustomPersona =
              sessionConfig.customPersona &&
              (typeof sessionConfig.customPersona === "string"
                ? sessionConfig.customPersona.trim().length > 0
                : true);

            // Call the training action to start the session
            const result = await startTrainingSession({
              scenario: shouldUseCustomScenario
                ? typeof sessionConfig.customScenario === "string"
                  ? undefined // If it's a string, let AI refine it
                  : sessionConfig.customScenario || undefined
                : state.scenario,
              guestPersona: shouldUseCustomPersona
                ? typeof sessionConfig.customPersona === "string"
                  ? undefined // If it's a string, let AI refine it
                  : sessionConfig.customPersona || undefined
                : state.persona,
            });

            if (result.error) {
              throw new Error(`Session ${index + 1}: ${result.error}`);
            }

            // Create thread in database
            const threadTitle =
              result.scenario?.scenario_title ||
              `Training Session ${index + 1}`;

            const newThread = await createThread({
              title: threadTitle,
              userId: userAuth.userId,
              visibility: "private",
              scenario: result.scenario || {},
              persona: result.guestPersona || {},
              status: "active",
              score: null,
              feedback: null,
              startedAt: new Date(),
              completedAt: null,
              version: "2",
              deletedAt: null,
              groupId: groupId,
            });

            // Save initial messages if any
            const savedMessages: any[] = [];
            if (result.finalOutput && result.finalOutput.length > 0) {
              const savedMessage = await createMessage({
                chatId: newThread.id,
                role: "AI",
                parts: { content: result.finalOutput },
                attachments: [],
                isTraining: true,
                messageRating: null,
                messageSuggestions: null,
              });
              savedMessages.push(savedMessage);
            }

            console.log(
              `Successfully created session ${index + 1}/${numberOfSessions}: ${
                newThread.id
              }`
            );

            return { thread: newThread, messages: savedMessages };
          } catch (error) {
            console.error(`Error creating session ${index + 1}:`, error);
            throw error;
          }
        });

        // Execute all session creations in parallel
        const results = await Promise.all(sessionPromises);

        // Update state with all new threads
        setState((prevState) => {
          const newThreads = results.map((result) => ({
            thread: result.thread,
            messages: result.messages,
          }));

          // Randomly select one thread as active
          const randomIndex = Math.floor(Math.random() * newThreads.length);
          const activeThreadId = newThreads[randomIndex].thread.id;

          console.log(
            `Randomly selected thread ${activeThreadId} as active (index ${randomIndex})`
          );

          return {
            ...prevState,
            userThreads: [...prevState.userThreads, ...newThreads],
            activeThreadId,
            isBulkSessionInProgress: false,
            isLoading: false,
          };
        });

        // Clear bulk session config after successful creation
        clearBulkSessionConfig();

        console.log(
          `Successfully created ${numberOfSessions} training sessions in parallel`
        );
      } catch (error) {
        console.error("Error starting bulk training sessions:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to start bulk training sessions";
        setError(errorMessage, "session");

        setState((prevState) => ({
          ...prevState,
          isBulkSessionInProgress: false,
          isLoading: false,
        }));
      }
    },
    [
      authState.user,
      state.bulkSessionConfig,
      state.scenario,
      state.persona,
      setError,
      clearBulkSessionConfig,
    ]
  );

  const handleEndBulkTraining = useCallback(
    async (groupId: string) => {
      if (!authState.user?.uid) {
        setError("User must be logged in to end bulk training", "session");
        return;
      }

      if (!groupId) {
        setError("Group ID is required to end bulk training", "validation");
        return;
      }

      setState((prevState) => ({
        ...prevState,
        isLoading: true,
        error: null,
      }));

      try {
        console.log(`Ending bulk training for group: ${groupId}`);

        // Get all active threads in this group
        const groupThreads = state.userThreads.filter(
          (thread) =>
            thread.thread.groupId === groupId &&
            thread.thread.status === "active"
        );

        if (groupThreads.length === 0) {
          console.log("No active threads to end in this group");
          setState((prevState) => ({
            ...prevState,
            isLoading: false,
          }));
          return;
        }

        console.log(
          `Ending ${groupThreads.length} active threads in group ${groupId}...`
        );

        // Import required functions
        const { getMessagesByChatId } = await import(
          "../lib/db/actions/message-actions"
        );

        // End all threads in parallel using handleEndTraining
        const endPromises = groupThreads.map(async (threadWithMessages) => {
          try {
            // Get the scenario and persona from the thread
            const scenario = threadWithMessages.thread.scenario as any;
            const persona = threadWithMessages.thread.persona as any;

            // Fetch messages for this thread if not already loaded
            let messages = threadWithMessages.messages;
            if (!messages) {
              messages = await getMessagesByChatId(
                threadWithMessages.thread.id
              );
            }

            // Convert messages to BaseMessage format for handleEndTraining
            const conversationHistory = messages.map((msg) => {
              if (msg.role === "AI") {
                return new AIMessage(
                  typeof msg.parts === "string"
                    ? msg.parts
                    : (msg.parts as any).content || ""
                );
              } else {
                return new HumanMessage(
                  typeof msg.parts === "string"
                    ? msg.parts
                    : (msg.parts as any).content || ""
                );
              }
            });

            // Call handleEndTraining to properly end the thread with AI feedback
            await handleEndTraining(
              threadWithMessages.thread.id,
              scenario,
              persona,
              conversationHistory
            );

            console.log(
              `Successfully ended thread ${threadWithMessages.thread.id} with AI feedback`
            );
          } catch (error) {
            console.error(
              `Error ending thread ${threadWithMessages.thread.id}:`,
              error
            );
            throw error;
          }
        });

        await Promise.all(endPromises);

        console.log(
          `Successfully ended all ${groupThreads.length} threads in group ${groupId} with AI feedback`
        );

        // Reload threads to reflect the changes
        await loadUserThreads();

        // Call the server action to generate group feedback
        const { endBulkTrainingSession } = await import(
          "../lib/actions/training-actions"
        );

        const result = await endBulkTrainingSession({ groupId });

        if (!result.success) {
          throw new Error(result.error || "Failed to generate group feedback");
        }

        console.log(
          "Group feedback generated successfully:",
          result.groupFeedback
        );

        // Update the thread group with the feedback
        await updateThreadGroupData(groupId, {
          groupFeedback: result.groupFeedback,
        });

        console.log(`Successfully updated group ${groupId} with feedback`);

        // Reload thread groups to reflect the updated feedback
        await loadThreadGroups();

        setState((prevState) => ({
          ...prevState,
          isLoading: false,
        }));
      } catch (error) {
        console.error("Error ending bulk training:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to end bulk training session";
        setError(errorMessage, "session");

        setState((prevState) => ({
          ...prevState,
          isLoading: false,
        }));
      }
    },
    [
      authState.user,
      setError,
      updateThreadGroupData,
      loadThreadGroups,
      state.userThreads,
      handleEndTraining,
      loadUserThreads,
    ]
  );

  const contextValue: CoreAppContextType = {
    state,
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
    // Scenario and Persona methods
    setScenario,
    setPersona,
    setCustomScenario,
    setCustomPersona,
    setIsRefiningScenario,
    setIsRefiningPersona,
    // Utility methods
    setLoading,
    setError,
    setActiveThreadId,
    // New Training Functions
    handleStartTraining,
    handleUpdateTraining,
    handleEndTraining,
    handleRefineScenario,
    handleRefinePersona,
    // Bulk session methods
    setBulkSessionCount,
    updateBulkSessionConfig,
    clearBulkSessionConfig,
    handleStartBulkTraining,
    handleEndBulkTraining,
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
