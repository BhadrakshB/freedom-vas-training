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
  BaseMessage,
  HumanMessage,
  isAIMessage,
} from "@langchain/core/messages";
import {
  AlternativeSuggestionsSchema,
  FeedbackSchema,
  MessageRatingSchema,
  PersonaGeneratorSchema,
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

export interface ThreadState {
  id: string;
  name: string; // User-friendly name for the session
  messages: BaseMessage[];
  scenario: ScenarioGeneratorSchema | null;
  persona: PersonaGeneratorSchema | null;
  customScenario: string;
  customPersona: string;
  isRefiningScenario: boolean;
  isRefiningPersona: boolean;
  errorMessage: string | null;
  errorType: ErrorType | null;
  sessionFeedback: FeedbackSchema | null;
  isLoading: boolean;
  trainingStarted: boolean;
  trainingStatus: TrainingStateType;
  lastFailedMessage: string | null;
  currentThreadId: string | null;
  createdAt: Date;
  lastActivity: Date;
  isArchived: boolean;
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
  customScenario: string | null;
  customPersona: string | null;
  isRefiningScenario: boolean;
  isRefiningPersona: boolean;

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
  selectUserThread: (thread: ThreadWithMessages) => void;

  // Thread actions (UI state)
  addThread: (thread: Thread) => void;
  updateThread: (id: string, updates: Partial<Thread>) => void;
  deleteThread: (id: string) => void;
  setActiveThread: (thread: Thread | null) => void;

  // Scenario and Persona actions
  setScenario: (scenario: ScenarioGeneratorSchema | null) => void;
  setPersona: (persona: PersonaGeneratorSchema | null) => void;
  setCustomScenario: (customScenario: string | null) => void;
  setCustomPersona: (customPersona: string | null) => void;
  setIsRefiningScenario: (isRefining: boolean) => void;
  setIsRefiningPersona: (isRefining: boolean) => void;

  // Utility actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null, errorType: ErrorType | null) => void;
  setActiveThreadId: (id: string | null) => void;

  // Computed properties
  activeTrainingThreads: ThreadWithMessages[];
  recentThreads: ThreadWithMessages[];
  ungroupedThreads: ThreadWithMessages[];
  groupedThreads: ThreadGroupWithThreads[];

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
        setState((prevState) => ({
          ...prevState,
          userThreads: result.threads.map((thread) => ({
            thread,
            messages: null,
          })),
          threadStats: {
            total: result.totalCount,
            active: result.activeCount,
            completed: result.completedCount,
            paused:
              result.totalCount - result.activeCount - result.completedCount,
          },
        }));
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
      const groups = await getThreadGroupsWithCounts();
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
  }, [authState.user?.uid]);

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
        const newGroup = await createThreadGroup({
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
  const selectUserThread = useCallback(async (thread: ThreadWithMessages) => {
    try {
      // Set the active thread ID
      setState((prevState) => ({
        ...prevState,
        isLoading: true,
        activeThreadId: thread.thread.id,
      }));

      // Fetch messages for this thread
      const { getMessagesByChatId } = await import(
        "../lib/db/actions/message-actions"
      );
      const messages = await getMessagesByChatId(thread.thread.id);

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
        "Selected thread:",
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
  }, []);

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

  const addThread = useCallback((thread: Thread) => {
    // This function is not implemented as we're using database-backed threads
    console.log("addThread called but not implemented");
  }, []);

  const updateThread = useCallback((id: string, updates: Partial<Thread>) => {
    // This function is not implemented as we're using database-backed threads
    console.log("updateThread called but not implemented");
  }, []);

  const deleteThread = useCallback((id: string) => {
    // This function is not implemented as we're using database-backed threads
    console.log("deleteThread called but not implemented");
  }, []);

  const setActiveThread = useCallback((thread: Thread | null) => {
    setState((prevState) => ({
      ...prevState,
      activeThreadId: thread?.id || null,
    }));
  }, []);

  const addMessageToThread = useCallback((threadId: string, message: any) => {
    // This function is not implemented as we're using database-backed messages
    console.log("addMessageToThread called but not implemented");
  }, []);

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

  const setCustomScenario = useCallback((customScenario: string | null) => {
    setState((prevState) => ({
      ...prevState,
      customScenario,
    }));
  }, []);

  const setCustomPersona = useCallback((customPersona: string | null) => {
    setState((prevState) => ({
      ...prevState,
      customPersona,
    }));
  }, []);

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

  // Computed properties
  const activeTrainingThreads = React.useMemo(() => {
    return state.userThreads
      .filter(
        (threadWithMessages) => threadWithMessages.thread.status === "active"
      )
      .map((threadWithMessages) => threadWithMessages);
  }, [state.userThreads]);

  const completedTrainings = React.useMemo(() => {
    return state.userThreads
      .filter(
        (threadWithMessages) => threadWithMessages.thread.status === "completed"
      )
      .map((threadWithMessages) => ({
        id: threadWithMessages.thread.id,
        title: threadWithMessages.thread.title,
        status: threadWithMessages.thread.status as "completed",
        scenario: threadWithMessages.thread.scenario,
        persona: threadWithMessages.thread.persona,
        createdAt: threadWithMessages.thread.createdAt,
        updatedAt: threadWithMessages.thread.updatedAt,
        completedAt: threadWithMessages.thread.completedAt || undefined,
        score: threadWithMessages.thread.score,
        feedback: threadWithMessages.thread.feedback,
      }));
  }, [state.userThreads]);

  const recentThreads = React.useMemo(() => {
    return state.userThreads
      .map((threadWithMessages) => threadWithMessages)
      .sort(
        (a, b) => b.thread.updatedAt.getTime() - a.thread.updatedAt.getTime()
      )
      .slice(0, 10);
  }, [state.userThreads]);

  // Get threads that are not assigned to any group
  const ungroupedThreads = React.useMemo(() => {
    return state.userThreads
      .filter((threadWithMessages) => !threadWithMessages.thread.groupId)
      .map((threadWithMessages) => threadWithMessages);
  }, [state.userThreads]);

  // Get grouped threads with their group information
  const groupedThreads = React.useMemo(() => {
    return state.threadGroups;
  }, [state.threadGroups]);

  // Memoize expensive thread statistics calculation
  const threadStatistics = React.useMemo(() => {
    return state.userThreads.reduce(
      (acc, threadWithMessages) => {
        acc.total++;
        if (threadWithMessages.thread.status === "active") acc.active++;
        else if (threadWithMessages.thread.status === "completed")
          acc.completed++;
        else if (threadWithMessages.thread.status === "paused") acc.paused++;
        return acc;
      },
      { total: 0, active: 0, completed: 0, paused: 0 }
    );
  }, [state.userThreads]);

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

    // Validate that we have either generated scenario/persona or custom ones
    if (!state.scenario && !state.customScenario) {
      setError(
        "Please generate or provide a scenario before starting training",
        "validation"
      );
      return;
    }

    if (!state.persona && !state.customPersona) {
      setError(
        "Please generate or provide a persona before starting training",
        "validation"
      );
      return;
    }

    setLoading(true);
    setError(null, null);

    try {
      // First get the user's internal ID from the database
      const { getUserAuthByProvider } = await import(
        "../lib/db/actions/user-auth-actions"
      );
      const userAuth = await getUserAuthByProvider(
        "firebase",
        authState.user.uid
      );

      if (!userAuth) {
        throw new Error("User not found in database. Please contact support.");
      }

      // Call the training action with the current scenario and persona FIRST
      const result = await startTrainingSession({
        scenario: state.scenario,
        guestPersona: state.persona,
      });

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
        scenario: result.scenario || state.scenario || {},
        persona: result.guestPersona || state.persona || {},
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
      if (result.messages && result.messages.length > 0) {
        for (const message of result.messages) {
          const savedMessage = await createMessage({
            chatId: newThread.id,
            role: !isAIMessage(message) ? "trainee" : "AI",
            parts: { content: message.content },
            attachments: [],
            isTraining: true,
            messageRating: null,
            messageSuggestions: null,
          });
          savedMessages.push(savedMessage);
        }
      }

      // Update the state with the new thread
      setState((prevState) => ({
        ...prevState,
        userThreads: [
          ...prevState.userThreads,
          { thread: newThread, messages: savedMessages },
        ],
        activeThreadId: newThread.id,
        // Update scenario and persona with the results from the workflow
        scenario: result.scenario || prevState.scenario,
        persona: result.guestPersona || prevState.persona,
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
        const updatedHistory = [
          ...conversationHistory,
          new HumanMessage(userMessage),
        ];

        // Call the update training action with updated conversation history FIRST
        const result = await updateTrainingSession({
          scenario,
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
          await updateThread(threadId, {
            status: "completed",
            completedAt: new Date(),
            feedback: result.feedback || null,
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
    [authState.user, setLoading, setError]
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
        // Call the end training action FIRST
        const result = await endTrainingSession({
          scenario,
          guestPersona: persona,
          messages: conversationHistory,
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
          setScenario(result.refinedScenario);
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
          setPersona(result.refinedPersona);
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
    // Thread methods
    addThread,
    updateThread,
    deleteThread,
    setActiveThread,
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
    // Computed properties
    activeTrainingThreads,
    recentThreads,
    ungroupedThreads,
    groupedThreads,
    // New Training Functions
    handleStartTraining,
    handleUpdateTraining,
    handleEndTraining,
    handleRefineScenario,
    handleRefinePersona,
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
