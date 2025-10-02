// import { BaseMessage } from "@langchain/core/messages";
// import {
//   createContext,
//   useState,
//   useCallback,
//   useMemo,
//   useContext,
// } from "react";
// import {
//   FeedbackSchema,
//   PersonaGeneratorSchema,
//   ScenarioGeneratorSchema,
//   TrainingStateType,
//   MessageRatingSchema,
//   AlternativeSuggestionsSchema,
// } from "../lib/agents/v2/graph_v2";
// import { ErrorType } from "../lib/error-handling";
// import {
//   saveMessageWithFeedback,
//   updateMessageFeedback,
// } from "../lib/actions/training-actions";

// import { HumanMessage } from "@langchain/core/messages";

// export interface TrainingContextState {
//   trainingStates: Map<string, ThreadState>;
//   activeTrainingId: string | null;
//   panelWidth: number;
//   isResizing: boolean;
//   maxConcurrentSessions: number;
// }

// export interface TrainingActions {
//   // Session Management
//   createTrainingState: (name?: string) => string;
//   duplicateTrainingState: (id: string, newName?: string) => string;
//   setActiveTrainingId: (id: string | null) => void;
//   removeTrainingState: (id: string) => void;
//   archiveTrainingState: (id: string) => void;
//   restoreTrainingState: (id: string) => void;
//   renameTrainingState: (id: string, name: string) => void;

//   // Message Management
//   setMessages: (id: string, messages: BaseMessage[]) => void;
//   addMessage: (id: string, message: BaseMessage) => void;
//   updateMessage: (
//     id: string,
//     messageIndex: number,
//     message: BaseMessage
//   ) => void;
//   removeMessage: (id: string, messageIndex: number) => void;
//   updateMessageWithFeedback: (
//     id: string,
//     messageIndex: number,
//     messageRating: MessageRatingSchema | null,
//     messageSuggestions: AlternativeSuggestionsSchema | null
//   ) => void;
//   saveMessageWithFeedbackToDb: (
//     id: string,
//     message: BaseMessage,
//     messageRating?: MessageRatingSchema | null,
//     messageSuggestions?: AlternativeSuggestionsSchema | null
//   ) => Promise<{ success: boolean; messageId?: string; error?: string }>;

//   // Scenario & Persona Management
//   setScenario: (id: string, scenario: ScenarioGeneratorSchema | null) => void;
//   setPersona: (id: string, persona: PersonaGeneratorSchema | null) => void;
//   setCustomScenario: (id: string, scenario: string) => void;
//   setCustomPersona: (id: string, persona: string) => void;
//   setIsRefiningScenario: (id: string, isRefining: boolean) => void;
//   setIsRefiningPersona: (id: string, isRefining: boolean) => void;

//   // Error Management
//   setError: (
//     id: string,
//     message: string | null,
//     type: ErrorType | null
//   ) => void;
//   clearError: (id: string) => void;
//   clearAllErrors: () => void;

//   // Session State Management
//   setSessionFeedback: (id: string, feedback: FeedbackSchema | null) => void;
//   setIsLoading: (id: string, loading: boolean) => void;
//   setTrainingStarted: (id: string, started: boolean) => void;
//   setTrainingStatus: (id: string, status: TrainingStateType) => void;
//   setLastFailedMessage: (id: string, message: string | null) => void;
//   setCurrentThreadId: (id: string, threadId: string | null) => void;
//   resetSession: (id: string) => void;

//   // UI State Management
//   setPanelWidth: (width: number) => void;
//   setIsResizing: (resizing: boolean) => void;

//   // Getters
//   getTrainingState: (id: string) => ThreadState | undefined;
//   getActiveTrainingState: () => ThreadState | undefined;
//   getAllTrainingStates: () => ThreadState[];
//   getActiveTrainingStates: () => ThreadState[];
//   getArchivedTrainingStates: () => ThreadState[];

//   // Bulk Operations
//   archiveAllCompletedSessions: () => void;
//   removeAllArchivedSessions: () => void;

//   // Session Limits
//   canCreateNewSession: () => boolean;
//   getSessionCount: () => number;
// }

// export interface TrainingContextType
//   extends TrainingContextState,
//     TrainingActions {}

// const createInitialTrainingState = (id: string, name?: string): ThreadState => {
//   const now = new Date();
//   return {
//     id,
//     name: name || `Training Session ${now.toLocaleTimeString()}`,
//     messages: [],
//     scenario: null,
//     persona: null,
//     customScenario: "",
//     customPersona: "",
//     isRefiningScenario: false,
//     isRefiningPersona: false,
//     errorMessage: null,
//     errorType: null,
//     sessionFeedback: null,
//     isLoading: false,
//     trainingStarted: false,
//     trainingStatus: "start",
//     lastFailedMessage: null,
//     currentThreadId: null,
//     createdAt: now,
//     lastActivity: now,
//     isArchived: false,
//   };
// };

// export const trainingContext = createContext<TrainingContextType>({
//   // State
//   trainingStates: new Map(),
//   activeTrainingId: null,
//   panelWidth: 320,
//   isResizing: false,
//   maxConcurrentSessions: 5,
//   // Actions - Session Management
//   createTrainingState: () => "",
//   duplicateTrainingState: () => "",
//   setActiveTrainingId: () => {},
//   removeTrainingState: () => {},
//   archiveTrainingState: () => {},
//   restoreTrainingState: () => {},
//   renameTrainingState: () => {},
//   // Message Management
//   setMessages: () => {},
//   addMessage: () => {},
//   updateMessage: () => {},
//   removeMessage: () => {},
//   updateMessageWithFeedback: () => {},
//   saveMessageWithFeedbackToDb: async () => ({ success: false }),
//   // Scenario & Persona Management
//   setScenario: () => {},
//   setPersona: () => {},
//   setCustomScenario: () => {},
//   setCustomPersona: () => {},
//   setIsRefiningScenario: () => {},
//   setIsRefiningPersona: () => {},
//   // Error Management
//   setError: () => {},
//   clearError: () => {},
//   clearAllErrors: () => {},
//   // Session State Management
//   setSessionFeedback: () => {},
//   setIsLoading: () => {},
//   setTrainingStarted: () => {},
//   setTrainingStatus: () => {},
//   setLastFailedMessage: () => {},
//   setCurrentThreadId: () => {},
//   resetSession: () => {},
//   // UI State Management
//   setPanelWidth: () => {},
//   setIsResizing: () => {},
//   // Getters
//   getTrainingState: () => undefined,
//   getActiveTrainingState: () => undefined,
//   getAllTrainingStates: () => [],
//   getActiveTrainingStates: () => [],
//   getArchivedTrainingStates: () => [],
//   // Bulk Operations
//   archiveAllCompletedSessions: () => {},
//   removeAllArchivedSessions: () => {},
//   // Session Limits
//   canCreateNewSession: () => true,
//   getSessionCount: () => 0,
// });

// export function TrainingProvider({ children }: { children: React.ReactNode }) {
//   const [trainingStates, setTrainingStates] = useState<
//     Map<string, ThreadState>
//   >(new Map());
//   const [activeTrainingId, setActiveTrainingIdState] = useState<string | null>(
//     null
//   );
//   const [panelWidth, setPanelWidth] = useState(320);
//   const [isResizing, setIsResizing] = useState(false);
//   const maxConcurrentSessions = 5;

//   // Helper function to update a specific training state
//   const updateTrainingState = useCallback(
//     (id: string, updater: (state: ThreadState) => ThreadState) => {
//       setTrainingStates((prev) => {
//         const current = prev.get(id);
//         if (!current) return prev;

//         const updated = updater({ ...current, lastActivity: new Date() });
//         const newMap = new Map(prev);
//         newMap.set(id, updated);
//         return newMap;
//       });
//     },
//     []
//   );

//   // Session Management
//   const createTrainingState = useCallback((name?: string): string => {
//     const id = `training-${Date.now()}-${Math.random()
//       .toString(36)
//       .substring(2, 11)}`;
//     const newState = createInitialTrainingState(id, name);

//     setTrainingStates((prev) => {
//       const newMap = new Map(prev);
//       newMap.set(id, newState);
//       return newMap;
//     });

//     return id;
//   }, []);

//   const duplicateTrainingState = useCallback(
//     (id: string, newName?: string): string => {
//       const existingState = trainingStates.get(id);
//       if (!existingState) return "";

//       const newId = `training-${Date.now()}-${Math.random()
//         .toString(36)
//         .substring(2, 11)}`;
//       const duplicatedState = createInitialTrainingState(
//         newId,
//         newName || `${existingState.name} (Copy)`
//       );

//       // Copy relevant data from existing state
//       duplicatedState.scenario = existingState.scenario;
//       duplicatedState.persona = existingState.persona;
//       duplicatedState.customScenario = existingState.customScenario;
//       duplicatedState.customPersona = existingState.customPersona;

//       setTrainingStates((prev) => {
//         const newMap = new Map(prev);
//         newMap.set(newId, duplicatedState);
//         return newMap;
//       });

//       return newId;
//     },
//     [trainingStates]
//   );

//   const setActiveTrainingId = useCallback(
//     (id: string | null) => {
//       setActiveTrainingIdState(id);
//       if (id) {
//         updateTrainingState(id, (state) => ({
//           ...state,
//           lastActivity: new Date(),
//         }));
//       }
//     },
//     [updateTrainingState]
//   );

//   const removeTrainingState = useCallback(
//     (id: string) => {
//       setTrainingStates((prev) => {
//         const newMap = new Map(prev);
//         newMap.delete(id);
//         return newMap;
//       });

//       if (activeTrainingId === id) {
//         setActiveTrainingIdState(null);
//       }
//     },
//     [activeTrainingId]
//   );

//   const archiveTrainingState = useCallback(
//     (id: string) => {
//       updateTrainingState(id, (state) => ({ ...state, isArchived: true }));
//       if (activeTrainingId === id) {
//         setActiveTrainingIdState(null);
//       }
//     },
//     [activeTrainingId, updateTrainingState]
//   );

//   const restoreTrainingState = useCallback(
//     (id: string) => {
//       updateTrainingState(id, (state) => ({ ...state, isArchived: false }));
//     },
//     [updateTrainingState]
//   );

//   const renameTrainingState = useCallback(
//     (id: string, name: string) => {
//       updateTrainingState(id, (state) => ({ ...state, name }));
//     },
//     [updateTrainingState]
//   );

//   // Message Management
//   const setMessages = useCallback(
//     (id: string, messages: BaseMessage[]) => {
//       updateTrainingState(id, (state) => ({ ...state, messages }));
//     },
//     [updateTrainingState]
//   );

//   const addMessage = useCallback(
//     (id: string, message: BaseMessage) => {
//       updateTrainingState(id, (state) => ({
//         ...state,
//         messages: [...state.messages, message],
//       }));
//     },
//     [updateTrainingState]
//   );

//   const updateMessage = useCallback(
//     (id: string, messageIndex: number, message: BaseMessage) => {
//       updateTrainingState(id, (state) => ({
//         ...state,
//         messages: state.messages.map((msg, index) =>
//           index === messageIndex ? message : msg
//         ),
//       }));
//     },
//     [updateTrainingState]
//   );

//   const removeMessage = useCallback(
//     (id: string, messageIndex: number) => {
//       updateTrainingState(id, (state) => ({
//         ...state,
//         messages: state.messages.filter((_, index) => index !== messageIndex),
//       }));
//     },
//     [updateTrainingState]
//   );

//   const updateMessageWithFeedback = useCallback(
//     (
//       id: string,
//       messageIndex: number,
//       messageRating: MessageRatingSchema | null,
//       messageSuggestions: AlternativeSuggestionsSchema | null
//     ) => {
//       updateTrainingState(id, (state) => ({
//         ...state,
//         messages: state.messages.map((msg, index) => {
//           if (
//             index === messageIndex &&
//             msg instanceof ExtendedHumanMessageImpl
//           ) {
//             // Update the ExtendedHumanMessage with new rating and suggestions
//             const updatedMessage = new ExtendedHumanMessageImpl(
//               msg.content,
//               messageRating,
//               messageSuggestions
//             );
//             // Preserve other properties
//             updatedMessage.id = msg.id;
//             updatedMessage.additional_kwargs = msg.additional_kwargs;
//             updatedMessage.response_metadata = msg.response_metadata;
//             return updatedMessage;
//           }
//           return msg;
//         }),
//       }));
//     },
//     [updateTrainingState]
//   );

//   const saveMessageWithFeedbackToDb = useCallback(
//     async (
//       id: string,
//       message: BaseMessage,
//       messageRating?: MessageRatingSchema | null,
//       messageSuggestions?: AlternativeSuggestionsSchema | null
//     ): Promise<{ success: boolean; messageId?: string; error?: string }> => {
//       const trainingState = trainingStates.get(id);
//       if (!trainingState?.currentThreadId) {
//         return { success: false, error: "No active thread ID found" };
//       }

//       try {
//         // Determine role based on message type
//         const role = message.getType() === "human" ? "trainee" : "AI";

//         // Save message to database with feedback
//         const result = await saveMessageWithFeedback({
//           chatId: trainingState.currentThreadId,
//           role,
//           parts: message.content,
//           attachments: [],
//           isTraining: true,
//           messageRating: messageRating || undefined,
//           messageSuggestions: messageSuggestions || undefined,
//         });

//         if (result.success) {
//           console.log(`Message saved to database with ID: ${result.messageId}`);
//           return { success: true, messageId: result.messageId };
//         } else {
//           console.error("Failed to save message to database:", result.error);
//           return { success: false, error: result.error };
//         }
//       } catch (error) {
//         console.error("Error saving message to database:", error);
//         return {
//           success: false,
//           error: error instanceof Error ? error.message : "Unknown error",
//         };
//       }
//     },
//     [trainingStates]
//   );

//   // Scenario & Persona Management
//   const setScenario = useCallback(
//     (id: string, scenario: ScenarioGeneratorSchema | null) => {
//       updateTrainingState(id, (state) => ({ ...state, scenario }));
//     },
//     [updateTrainingState]
//   );

//   const setPersona = useCallback(
//     (id: string, persona: PersonaGeneratorSchema | null) => {
//       updateTrainingState(id, (state) => ({ ...state, persona }));
//     },
//     [updateTrainingState]
//   );

//   const setCustomScenario = useCallback(
//     (id: string, customScenario: string) => {
//       updateTrainingState(id, (state) => ({ ...state, customScenario }));
//     },
//     [updateTrainingState]
//   );

//   const setCustomPersona = useCallback(
//     (id: string, customPersona: string) => {
//       updateTrainingState(id, (state) => ({ ...state, customPersona }));
//     },
//     [updateTrainingState]
//   );

//   const setIsRefiningScenario = useCallback(
//     (id: string, isRefiningScenario: boolean) => {
//       updateTrainingState(id, (state) => ({ ...state, isRefiningScenario }));
//     },
//     [updateTrainingState]
//   );

//   const setIsRefiningPersona = useCallback(
//     (id: string, isRefiningPersona: boolean) => {
//       updateTrainingState(id, (state) => ({ ...state, isRefiningPersona }));
//     },
//     [updateTrainingState]
//   );

//   // Error Management
//   const setError = useCallback(
//     (id: string, errorMessage: string | null, errorType: ErrorType | null) => {
//       updateTrainingState(id, (state) => ({
//         ...state,
//         errorMessage,
//         errorType,
//       }));
//     },
//     [updateTrainingState]
//   );

//   const clearError = useCallback(
//     (id: string) => {
//       updateTrainingState(id, (state) => ({
//         ...state,
//         errorMessage: null,
//         errorType: null,
//       }));
//     },
//     [updateTrainingState]
//   );

//   const clearAllErrors = useCallback(() => {
//     setTrainingStates((prev) => {
//       const newMap = new Map();
//       prev.forEach((state, id) => {
//         newMap.set(id, {
//           ...state,
//           errorMessage: null,
//           errorType: null,
//           lastActivity: new Date(),
//         });
//       });
//       return newMap;
//     });
//   }, []);

//   // Session State Management
//   const setSessionFeedback = useCallback(
//     (id: string, sessionFeedback: FeedbackSchema | null) => {
//       updateTrainingState(id, (state) => ({ ...state, sessionFeedback }));
//     },
//     [updateTrainingState]
//   );

//   const setIsLoading = useCallback(
//     (id: string, isLoading: boolean) => {
//       updateTrainingState(id, (state) => ({ ...state, isLoading }));
//     },
//     [updateTrainingState]
//   );

//   const setTrainingStarted = useCallback(
//     (id: string, trainingStarted: boolean) => {
//       updateTrainingState(id, (state) => ({ ...state, trainingStarted }));
//     },
//     [updateTrainingState]
//   );

//   const setTrainingStatus = useCallback(
//     (id: string, trainingStatus: TrainingStateType) => {
//       updateTrainingState(id, (state) => ({ ...state, trainingStatus }));
//     },
//     [updateTrainingState]
//   );

//   const setLastFailedMessage = useCallback(
//     (id: string, lastFailedMessage: string | null) => {
//       updateTrainingState(id, (state) => ({ ...state, lastFailedMessage }));
//     },
//     [updateTrainingState]
//   );

//   const setCurrentThreadId = useCallback(
//     (id: string, currentThreadId: string | null) => {
//       updateTrainingState(id, (state) => ({ ...state, currentThreadId }));
//     },
//     [updateTrainingState]
//   );

//   const resetSession = useCallback(
//     (id: string) => {
//       updateTrainingState(id, (state) => ({
//         ...state,
//         messages: [],
//         scenario: null,
//         persona: null,
//         customScenario: "",
//         customPersona: "",
//         isRefiningScenario: false,
//         isRefiningPersona: false,
//         sessionFeedback: null,
//         trainingStarted: false,
//         trainingStatus: "start",
//         lastFailedMessage: null,
//         currentThreadId: null,
//         errorMessage: null,
//         errorType: null,
//       }));
//     },
//     [updateTrainingState]
//   );

//   // Getters
//   const getTrainingState = useCallback(
//     (id: string): ThreadState | undefined => {
//       return trainingStates.get(id);
//     },
//     [trainingStates]
//   );

//   const getActiveTrainingState = useCallback((): ThreadState | undefined => {
//     return activeTrainingId ? trainingStates.get(activeTrainingId) : undefined;
//   }, [activeTrainingId, trainingStates]);

//   const getAllTrainingStates = useCallback((): ThreadState[] => {
//     return Array.from(trainingStates.values()).sort(
//       (a, b) => b.lastActivity.getTime() - a.lastActivity.getTime()
//     );
//   }, [trainingStates]);

//   const getActiveTrainingStates = useCallback((): ThreadState[] => {
//     return Array.from(trainingStates.values())
//       .filter((state) => !state.isArchived)
//       .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
//   }, [trainingStates]);

//   const getArchivedTrainingStates = useCallback((): ThreadState[] => {
//     return Array.from(trainingStates.values())
//       .filter((state) => state.isArchived)
//       .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
//   }, [trainingStates]);

//   // Bulk Operations
//   const archiveAllCompletedSessions = useCallback(() => {
//     setTrainingStates((prev) => {
//       const newMap = new Map();
//       prev.forEach((state, id) => {
//         const shouldArchive =
//           state.trainingStatus === "completed" && !state.isArchived;
//         newMap.set(id, {
//           ...state,
//           isArchived: shouldArchive || state.isArchived,
//           lastActivity: shouldArchive ? new Date() : state.lastActivity,
//         });
//       });
//       return newMap;
//     });
//   }, []);

//   const removeAllArchivedSessions = useCallback(() => {
//     setTrainingStates((prev) => {
//       const newMap = new Map();
//       prev.forEach((state, id) => {
//         if (!state.isArchived) {
//           newMap.set(id, state);
//         }
//       });
//       return newMap;
//     });

//     // Clear active training if it was archived
//     if (activeTrainingId && trainingStates.get(activeTrainingId)?.isArchived) {
//       setActiveTrainingIdState(null);
//     }
//   }, [activeTrainingId, trainingStates]);

//   // Session Limits
//   const canCreateNewSession = useCallback((): boolean => {
//     const activeCount = getActiveTrainingStates().length;
//     return activeCount < maxConcurrentSessions;
//   }, [getActiveTrainingStates, maxConcurrentSessions]);

//   const getSessionCount = useCallback((): number => {
//     return trainingStates.size;
//   }, [trainingStates]);

//   // Memoize context value to prevent unnecessary re-renders
//   const contextValue: TrainingContextType = useMemo(
//     () => ({
//       // State
//       trainingStates,
//       activeTrainingId,
//       panelWidth,
//       isResizing,
//       maxConcurrentSessions,
//       // Session Management
//       createTrainingState,
//       duplicateTrainingState,
//       setActiveTrainingId,
//       removeTrainingState,
//       archiveTrainingState,
//       restoreTrainingState,
//       renameTrainingState,
//       // Message Management
//       setMessages,
//       addMessage,
//       updateMessage,
//       removeMessage,
//       updateMessageWithFeedback,
//       saveMessageWithFeedbackToDb,
//       // Scenario & Persona Management
//       setScenario,
//       setPersona,
//       setCustomScenario,
//       setCustomPersona,
//       setIsRefiningScenario,
//       setIsRefiningPersona,
//       // Error Management
//       setError,
//       clearError,
//       clearAllErrors,
//       // Session State Management
//       setSessionFeedback,
//       setIsLoading,
//       setTrainingStarted,
//       setTrainingStatus,
//       setLastFailedMessage,
//       setCurrentThreadId,
//       resetSession,
//       // UI State Management
//       setPanelWidth,
//       setIsResizing,
//       // Getters
//       getTrainingState,
//       getActiveTrainingState,
//       getAllTrainingStates,
//       getActiveTrainingStates,
//       getArchivedTrainingStates,
//       // Bulk Operations
//       archiveAllCompletedSessions,
//       removeAllArchivedSessions,
//       // Session Limits
//       canCreateNewSession,
//       getSessionCount,
//     }),
//     [
//       trainingStates,
//       activeTrainingId,
//       panelWidth,
//       isResizing,
//       maxConcurrentSessions,
//       createTrainingState,
//       duplicateTrainingState,
//       setActiveTrainingId,
//       removeTrainingState,
//       archiveTrainingState,
//       restoreTrainingState,
//       renameTrainingState,
//       setMessages,
//       addMessage,
//       updateMessage,
//       removeMessage,
//       updateMessageWithFeedback,
//       saveMessageWithFeedbackToDb,
//       setScenario,
//       setPersona,
//       setCustomScenario,
//       setCustomPersona,
//       setIsRefiningScenario,
//       setIsRefiningPersona,
//       setError,
//       clearError,
//       clearAllErrors,
//       setSessionFeedback,
//       setIsLoading,
//       setTrainingStarted,
//       setTrainingStatus,
//       setLastFailedMessage,
//       setCurrentThreadId,
//       resetSession,
//       getTrainingState,
//       getActiveTrainingState,
//       getAllTrainingStates,
//       getActiveTrainingStates,
//       getArchivedTrainingStates,
//       archiveAllCompletedSessions,
//       removeAllArchivedSessions,
//       canCreateNewSession,
//       getSessionCount,
//     ]
//   );

//   return (
//     <trainingContext.Provider value={contextValue}>
//       {children}
//     </trainingContext.Provider>
//   );
// }

// // Custom hook for using the training context
// export function useTraining() {
//   const context = useContext(trainingContext);
//   if (!context) {
//     throw new Error("useTraining must be used within a TrainingProvider");
//   }
//   return context;
// }

// // Specialized hooks for common use cases
// export function useActiveTraining() {
//   const { getActiveTrainingState, activeTrainingId } = useTraining();
//   return useMemo(
//     () => ({
//       activeTraining: getActiveTrainingState(),
//       activeTrainingId,
//     }),
//     [getActiveTrainingState, activeTrainingId]
//   );
// }

// export function useTrainingSession(id: string | null) {
//   const { getTrainingState } = useTraining();
//   return useMemo(
//     () => (id ? getTrainingState(id) : undefined),
//     [getTrainingState, id]
//   );
// }

// export function useTrainingActions(id: string | null) {
//   const context = useTraining();

//   return useMemo(() => {
//     if (!id) return null;

//     return {
//       setMessages: (messages: BaseMessage[]) =>
//         context.setMessages(id, messages),
//       addMessage: (message: BaseMessage) => context.addMessage(id, message),
//       updateMessage: (index: number, message: BaseMessage) =>
//         context.updateMessage(id, index, message),
//       removeMessage: (index: number) => context.removeMessage(id, index),
//       updateMessageWithFeedback: (
//         index: number,
//         messageRating: MessageRatingSchema | null,
//         messageSuggestions: AlternativeSuggestionsSchema | null
//       ) =>
//         context.updateMessageWithFeedback(
//           id,
//           index,
//           messageRating,
//           messageSuggestions
//         ),
//       saveMessageWithFeedbackToDb: (
//         message: BaseMessage,
//         messageRating?: MessageRatingSchema | null,
//         messageSuggestions?: AlternativeSuggestionsSchema | null
//       ) =>
//         context.saveMessageWithFeedbackToDb(
//           id,
//           message,
//           messageRating,
//           messageSuggestions
//         ),
//       setScenario: (scenario: ScenarioGeneratorSchema | null) =>
//         context.setScenario(id, scenario),
//       setPersona: (persona: PersonaGeneratorSchema | null) =>
//         context.setPersona(id, persona),
//       setCustomScenario: (scenario: string) =>
//         context.setCustomScenario(id, scenario),
//       setCustomPersona: (persona: string) =>
//         context.setCustomPersona(id, persona),
//       setIsRefiningScenario: (isRefining: boolean) =>
//         context.setIsRefiningScenario(id, isRefining),
//       setIsRefiningPersona: (isRefining: boolean) =>
//         context.setIsRefiningPersona(id, isRefining),
//       setError: (message: string | null, type: ErrorType | null) =>
//         context.setError(id, message, type),
//       clearError: () => context.clearError(id),
//       setSessionFeedback: (feedback: FeedbackSchema | null) =>
//         context.setSessionFeedback(id, feedback),
//       setIsLoading: (loading: boolean) => context.setIsLoading(id, loading),
//       setTrainingStarted: (started: boolean) =>
//         context.setTrainingStarted(id, started),
//       setTrainingStatus: (status: TrainingStateType) =>
//         context.setTrainingStatus(id, status),
//       setLastFailedMessage: (message: string | null) =>
//         context.setLastFailedMessage(id, message),
//       setCurrentThreadId: (threadId: string | null) =>
//         context.setCurrentThreadId(id, threadId),
//       resetSession: () => context.resetSession(id),
//       archiveSession: () => context.archiveTrainingState(id),
//       restoreSession: () => context.restoreTrainingState(id),
//       renameSession: (name: string) => context.renameTrainingState(id, name),
//       removeSession: () => context.removeTrainingState(id),
//       duplicateSession: (newName?: string) =>
//         context.duplicateTrainingState(id, newName),
//     };
//   }, [context, id]);
// }
