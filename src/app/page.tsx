"use client";

import React, { useCallback, useRef, useContext, useState } from "react";
import { ThemeToggle } from "./components/ThemeToggle";

import { MessageArea } from "./components/MessageArea";
import { MessageInput } from "./components/MessageInput";
import { Button } from "./components/ui/button";
import {
  CustomScenarioPanel,
  CustomPersonaPanel,
  ScenarioDisplayPanel,
  PersonaDisplayPanel,
  CompletionFooter,
  FeedbackDisplayPanel,
  TrainingStatusIndicator,
} from "./components";
import { LeftSidebar } from "./components/LeftSidebar";
import {
  startTrainingSession,
  updateTrainingSession,
  refineScenario,
  refinePersona,
  endTrainingSession,
} from "./lib/actions/training-actions";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import {
  ScenarioGeneratorSchema,
  PersonaGeneratorSchema,
} from "./lib/agents/v2/graph_v2";
import { TrainingError, ErrorType, classifyError } from "./lib/error-handling";
import {
  ExtendedHumanMessageImpl,
  TrainingProvider,
  trainingContext,
} from "./contexts/TrainingContext";
import { useAuth } from "./contexts/AuthContext";
import { CoreAppDataContext } from "./contexts/CoreAppDataContext";
import { getOrCreateUserByFirebaseUid } from "./lib/db/actions/user-actions";
import {
  createThread,
  completeTrainingSession,
} from "./lib/db/actions/thread-actions";
import { createMessage } from "./lib/db/actions/message-actions";
import { getMessagesByChatId } from "./lib/actions/message-actions";
import type { UserThread } from "./lib/actions/user-threads-actions";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Trash2, Plus } from "lucide-react";

// Helper functions for error handling
function isRetryableError(errorType: ErrorType): boolean {
  // Network, timeout, and unknown errors are retryable
  // Validation and agent errors typically require user intervention
  return ["network", "timeout", "unknown"].includes(errorType);
}

function getErrorMessage(
  errorType: ErrorType,
  originalMessage: string
): string {
  switch (errorType) {
    case "network":
      return "Network connection issue. Please check your connection and try again.";
    case "timeout":
      return "Request timed out. Please try again.";
    case "validation":
      return "Invalid input provided. Please check your message and try again.";
    case "agent":
      return "AI agent encountered an error. Please retry your request.";
    case "session":
      return "Training session error occurred. Please try again.";
    default:
      return (
        originalMessage || "An unexpected error occurred. Please try again."
      );
  }
}

function getContextualErrorMessage(
  errorType: ErrorType,
  errorMessage: string
): string {
  const baseMessage = getErrorMessage(errorType, errorMessage);

  switch (errorType) {
    case "network":
    case "timeout":
      return `${baseMessage} If the problem persists, you can start a new training session.`;
    case "validation":
      return `${baseMessage} Please rephrase your message or start a new session.`;
    case "agent":
    case "session":
      return `${baseMessage} You can retry or start a new training session.`;
    default:
      return `${baseMessage} You can retry or start a new training session if the issue continues.`;
  }
}

interface SessionConfiguration {
  id: string;
  title: string;
  scenario?: string;
  persona?: string;
}

function ChatPage() {
  const trainingCtx = useContext(trainingContext);

  // Get or create active training session
  const activeTrainingState = trainingCtx.getActiveTrainingState();

  // If no active session, create one
  React.useEffect(() => {
    if (!trainingCtx.activeTrainingId) {
      const newId = trainingCtx.createTrainingState();
      trainingCtx.setActiveTrainingId(newId);
    }
  }, [trainingCtx]);

  // Helper functions to work with active session
  const getActiveId = () => trainingCtx.activeTrainingId!;

  // State getters (with fallbacks)
  const messages = activeTrainingState?.messages || [];
  const isLoading = activeTrainingState?.isLoading || false;
  const trainingStarted = activeTrainingState?.trainingStarted || false;
  const trainingStatus = activeTrainingState?.trainingStatus || "start";
  const sessionFeedback = activeTrainingState?.sessionFeedback || null;
  const scenario = activeTrainingState?.scenario || null;
  const persona = activeTrainingState?.persona || null;
  const customScenario = activeTrainingState?.customScenario || "";
  const customPersona = activeTrainingState?.customPersona || "";
  const isRefiningScenario = activeTrainingState?.isRefiningScenario || false;
  const isRefiningPersona = activeTrainingState?.isRefiningPersona || false;
  const errorMessage = activeTrainingState?.errorMessage || null;
  const errorType = activeTrainingState?.errorType || null;
  const lastFailedMessage = activeTrainingState?.lastFailedMessage || null;
  const currentThreadId = activeTrainingState?.currentThreadId || null;
  const panelWidth = trainingCtx.panelWidth;
  const isResizing = trainingCtx.isResizing;

  // Action wrappers
  const setMessages = (messages: any[]) =>
    trainingCtx.setMessages(getActiveId(), messages);
  const setIsLoading = (loading: boolean) =>
    trainingCtx.setIsLoading(getActiveId(), loading);
  const setTrainingStarted = (started: boolean) =>
    trainingCtx.setTrainingStarted(getActiveId(), started);
  const setTrainingStatus = (status: any) =>
    trainingCtx.setTrainingStatus(getActiveId(), status);
  const setSessionFeedback = (feedback: any) =>
    trainingCtx.setSessionFeedback(getActiveId(), feedback);
  const setScenario = (scenario: any) =>
    trainingCtx.setScenario(getActiveId(), scenario);
  const setPersona = (persona: any) =>
    trainingCtx.setPersona(getActiveId(), persona);
  const setCustomScenario = (scenario: string) =>
    trainingCtx.setCustomScenario(getActiveId(), scenario);
  const setCustomPersona = (persona: string) =>
    trainingCtx.setCustomPersona(getActiveId(), persona);
  const setIsRefiningScenario = (refining: boolean) =>
    trainingCtx.setIsRefiningScenario(getActiveId(), refining);
  const setIsRefiningPersona = (refining: boolean) =>
    trainingCtx.setIsRefiningPersona(getActiveId(), refining);
  const setError = (message: string | null, type: any) =>
    trainingCtx.setError(getActiveId(), message, type);
  const clearError = () => trainingCtx.clearError(getActiveId());
  const setLastFailedMessage = (message: string | null) =>
    trainingCtx.setLastFailedMessage(getActiveId(), message);
  const setPanelWidth = trainingCtx.setPanelWidth;
  const setIsResizing = trainingCtx.setIsResizing;
  const setCurrentThreadId = (threadId: string | null) =>
    trainingCtx.setCurrentThreadId(getActiveId(), threadId);
  const resetSession = () => trainingCtx.resetSession(getActiveId());

  // Get auth context for user information
  const authContext = useAuth();
  const authUser = authContext?.state?.user;

  // Get core app data context for thread management
  const coreContext = useContext(CoreAppDataContext);
  const coreDispatch = coreContext?.dispatch;

  const resizeRef = useRef<HTMLDivElement>(null);

  // Computed properties for training state
  const isSessionCompleted = trainingStatus === "completed";
  const isSessionError = trainingStatus === "error";
  const isTrainingActive = trainingStarted && trainingStatus === "ongoing";
  const [isEndingTraining, setIsEndingTraining] = useState(false);

  // Bulk session creation state
  const [showBulkCreation, setShowBulkCreation] = useState(false);
  const [sessionCount, setSessionCount] = useState(1);
  const [sessionConfigurations, setSessionConfigurations] = useState<
    SessionConfiguration[]
  >([{ id: "1", title: "Session 1", scenario: "", persona: "" }]);
  const [isCreatingBulkSessions, setIsCreatingBulkSessions] = useState(false);

  // Resize handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsResizing(true);
    },
    [setIsResizing]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;

      const containerRect =
        resizeRef.current?.parentElement?.getBoundingClientRect();
      if (!containerRect) return;

      const newWidth = containerRect.right - e.clientX;
      const minWidth = 280; // Minimum panel width
      const maxWidth = Math.min(600, containerRect.width * 0.6); // Maximum 60% of container width

      setPanelWidth(Math.max(minWidth, Math.min(maxWidth, newWidth)));
    },
    [isResizing, setPanelWidth]
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, [setIsResizing]);

  // Add global mouse event listeners for resizing
  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // Bulk session creation handlers
  const handleSessionCountChange = (count: number) => {
    setSessionCount(count);
    const newConfigurations: SessionConfiguration[] = [];

    for (let i = 1; i <= count; i++) {
      const existingConfig = sessionConfigurations.find(
        (config) => config.id === i.toString()
      );
      newConfigurations.push({
        id: i.toString(),
        title: existingConfig?.title || `Session ${i}`,
        scenario: existingConfig?.scenario || "",
        persona: existingConfig?.persona || "",
      });
    }

    setSessionConfigurations(newConfigurations);
  };

  const handleConfigurationChange = (
    id: string,
    field: keyof SessionConfiguration,
    value: string
  ) => {
    setSessionConfigurations((prev) =>
      prev.map((config) =>
        config.id === id ? { ...config, [field]: value } : config
      )
    );
  };

  const handleRemoveConfiguration = (id: string) => {
    if (sessionConfigurations.length > 1) {
      const newConfigs = sessionConfigurations.filter(
        (config) => config.id !== id
      );
      setSessionConfigurations(newConfigs);
      setSessionCount(newConfigs.length);
    }
  };

  const handleAddConfiguration = () => {
    const newId = (sessionConfigurations.length + 1).toString();
    const newConfig: SessionConfiguration = {
      id: newId,
      title: `Session ${sessionConfigurations.length + 1}`,
      scenario: "",
      persona: "",
    };
    setSessionConfigurations((prev) => [...prev, newConfig]);
    setSessionCount(sessionConfigurations.length + 1);
  };

  const handleStartAllSessions = async () => {
    if (!authUser?.uid) {
      setError(
        "Please log in to create multiple training sessions.",
        "validation"
      );
      return;
    }

    setIsCreatingBulkSessions(true);
    try {
      // Get or create database user
      const dbUserResult = await getOrCreateUserByFirebaseUid(
        authUser.uid,
        authUser.email
      );

      if (!dbUserResult) {
        throw new Error("Failed to create or retrieve user");
      }

      const createdThreads: UserThread[] = [];

      // Create all sessions simultaneously
      const sessionPromises = sessionConfigurations.map(async (config) => {
        try {
          const requestData: {
            scenario?: ScenarioGeneratorSchema;
            guestPersona?: PersonaGeneratorSchema;
          } = {};

          // Parse scenario if provided
          if (config.scenario?.trim()) {
            // Try to parse as JSON first, otherwise treat as plain text
            try {
              requestData.scenario = JSON.parse(config.scenario);
            } catch {
              // If not valid JSON, create a basic scenario object
              requestData.scenario = {
                scenario_title: config.title,
                guest_situation: config.scenario,
                difficulty_level: "Medium",
                business_context: "",
                constraints_and_policies: [],
                expected_va_challenges: [],
                success_criteria: [],
              };
            }
          }

          // Parse persona if provided
          if (config.persona?.trim()) {
            // Try to parse as JSON first, otherwise treat as plain text
            try {
              requestData.guestPersona = JSON.parse(config.persona);
            } catch {
              // If not valid JSON, create a basic persona object
              requestData.guestPersona = {
                name: "Guest",
                demographics: config.persona,
                personality_traits: [],
                emotional_tone: "neutral",
                communication_style: "professional",
                expectations: [],
                escalation_behavior: [],
              };
            }
          }

          // Start the training session
          const result = await startTrainingSession(requestData);

          if (result.error) {
            throw new Error(result.error);
          }

          // Create thread in database
          const newThread = await createThread({
            title: config.title,
            userId: dbUserResult.user.id,
            visibility: "private",
            scenario: result.scenario || {},
            persona: result.guestPersona || {},
            status: "active",
            startedAt: new Date(),
            version: "1",
            score: null,
            feedback: null,
            completedAt: null,
            deletedAt: null,
          });

          if (newThread) {
            // Save initial AI message to database
            const initialMessage = `${
              (result.finalOutput as string) ||
              "Training session started! You can now begin chatting with the guest."
            }`;

            await createMessage({
              chatId: newThread.id,
              role: "AI",
              parts: [{ text: initialMessage }],
              attachments: [],
              isTraining: true,
            });

            // Create UserThread object for context
            const userThread: UserThread = {
              ...newThread,
              isActive: true,
              lastActivity: new Date(),
            };

            createdThreads.push(userThread);
          }

          return { success: true, thread: newThread, config };
        } catch (error) {
          console.error(`Error creating session "${config.title}":`, error);
          return { success: false, error, config };
        }
      });

      // Wait for all sessions to complete
      const results = await Promise.all(sessionPromises);

      // Update CoreAppDataContext with new threads
      if (coreDispatch && createdThreads.length > 0) {
        createdThreads.forEach((thread) => {
          coreDispatch({ type: "ADD_USER_THREAD", payload: thread });
        });
      }

      // Count successful and failed sessions
      const successful = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;

      if (successful > 0) {
        // Reset bulk creation state
        setShowBulkCreation(false);
        setSessionCount(1);
        setSessionConfigurations([
          { id: "1", title: "Session 1", scenario: "", persona: "" },
        ]);

        // Show success message
        const successMessage =
          failed > 0
            ? `Successfully created ${successful} sessions. ${failed} sessions failed to create.`
            : `Successfully created all ${successful} training sessions!`;

        // You might want to show this in a toast or notification
        console.log(successMessage);
      } else {
        throw new Error("Failed to create any training sessions");
      }
    } catch (error) {
      console.error("Error creating bulk sessions:", error);
      const errorTypeClassified = classifyError(error);

      if (error instanceof TrainingError) {
        setError(error.message, errorTypeClassified);
      } else if (error instanceof Error) {
        setError(error.message, errorTypeClassified);
      } else {
        setError(
          "Failed to create training sessions. Please try again.",
          errorTypeClassified
        );
      }
    } finally {
      setIsCreatingBulkSessions(false);
    }
  };

  const handleStartTraining = async () => {
    setIsLoading(true);

    try {
      const requestData: {
        scenario?: ScenarioGeneratorSchema;
        guestPersona?: PersonaGeneratorSchema;
      } = {};
      if (scenario !== null) {
        requestData.scenario = scenario;
      }
      if (persona !== null) {
        requestData.guestPersona = persona;
      }

      const result = await startTrainingSession(requestData);

      if (result.error) {
        throw new Error(result.error);
      }

      // Store scenario and persona for future message updates
      setScenario(result.scenario ?? null);
      setPersona(result.guestPersona ?? null);
      setTrainingStarted(true);
      setTrainingStatus("ongoing");

      // Add initial training message
      const initialMessage: AIMessage = new AIMessage(
        `${
          (result.finalOutput as string) ||
          "Training session started! You can now begin chatting with the guest."
        }`
      );

      setMessages([initialMessage]);

      // Create database thread for authenticated users
      if (authUser?.uid) {
        try {
          // Get or create database user
          const dbUserResult = await getOrCreateUserByFirebaseUid(
            authUser.uid,
            authUser.email
          );

          if (dbUserResult) {
            // Create thread in database
            const newThread = await createThread({
              title: result.scenario?.scenario_title || "Training Session",
              userId: dbUserResult.user.id,
              visibility: "private",
              scenario: result.scenario || {},
              persona: result.guestPersona || {},
              status: "active",
              startedAt: new Date(),
              version: "1",
              score: null,
              feedback: null,
              completedAt: null,
              deletedAt: null,
            });

            if (newThread) {
              // Store thread ID in context
              setCurrentThreadId(newThread.id);

              // Save initial AI message to database
              await createMessage({
                chatId: newThread.id,
                role: "AI",
                parts: [{ text: initialMessage.content as string }],
                attachments: [],
                isTraining: true,
              });

              // Update CoreAppDataContext with new thread
              const userThread = {
                ...newThread,
                isActive: true,
                lastActivity: new Date(),
              };
              if (coreDispatch) {
                coreDispatch({ type: "ADD_USER_THREAD", payload: userThread });
              }
            }
          }
        } catch (dbError) {
          // Log database error but don't fail the training session
          console.error("Error creating database thread:", dbError);
          // Training can continue without database persistence
        }
      }
    } catch (error) {
      console.error("Error starting training session:", error);
      setTrainingStatus("error");
      // Classify and store error information
      const errorTypeClassified = classifyError(error);

      let errorMessage =
        "Sorry, there was an error starting the training session.";
      if (error instanceof TrainingError) {
        setError(error.message, errorTypeClassified);
        errorMessage = error.message;
      } else if (error instanceof Error) {
        setError(error.message, errorTypeClassified);
        errorMessage = error.message;
      } else {
        setError(
          "An unexpected error occurred while starting the training session.",
          errorTypeClassified
        );
      }

      // Add error message to chat
      const chatErrorMessage: AIMessage = new AIMessage(errorMessage);
      setMessages([chatErrorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!trainingStarted || !scenario || !persona) {
      return;
    }

    var newMessage: HumanMessage = new HumanMessage(content);

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    // Clear previous error state when attempting new message
    clearError();
    setLastFailedMessage(null);

    try {
      const result = await updateTrainingSession({
        scenario,
        guestPersona: persona,
        messages: updatedMessages.map((msg) =>
          msg instanceof ExtendedHumanMessageImpl ? msg.toHumanMessage() : msg
        ),
      });

      if (result.error) {
        setTrainingStatus("error");

        // Store error information for retry functionality
        setLastFailedMessage(content);
        const errorTypeClassified =
          (result.errorType as ErrorType) ||
          classifyError(new Error(result.error));
        setError(result.error, errorTypeClassified);

        throw new TrainingError(
          result.error,
          errorTypeClassified,
          "medium",
          result.errorCode
        );
      }

      // Update training status based on response
      setTrainingStatus(result.status);

      // Store feedback if available
      if (result.feedback) {
        setSessionFeedback(result.feedback);
      }

      // Add the guest response
      const guestMessage: AIMessage = new AIMessage(
        `${(result.guestResponse as string) || "No response received."}`
      );

      const newUpdatedMessage = new ExtendedHumanMessageImpl(
        content,
        result.lastMessageRating,
        result.lastMessageRatingReason
      );

      console.log("New message created:", {
        content: newUpdatedMessage.content,
        type: newUpdatedMessage.getType(),
        rating: newUpdatedMessage.messageRating,
        ratingReason: newUpdatedMessage.messageRating,
        timestamp: new Date().toISOString(),
      });

      setMessages([...messages, newUpdatedMessage, guestMessage]);

      // Save messages to database if thread exists
      if (currentThreadId && authUser?.uid) {
        try {
          // Save human message
          await createMessage({
            chatId: currentThreadId,
            role: "trainee",
            parts: [{ text: content }],
            attachments: [],
            isTraining: true,
          });

          // Save AI response
          await createMessage({
            chatId: currentThreadId,
            role: "AI",
            parts: [{ text: (result.guestResponse as string) || "" }],
            attachments: [],
            isTraining: true,
          });

          // Update thread's updatedAt timestamp is handled internally by updateThread

          // Update thread in CoreAppDataContext
          if (coreDispatch) {
            coreDispatch({
              type: "UPDATE_USER_THREAD",
              payload: {
                id: currentThreadId,
                updates: { updatedAt: new Date() },
              },
            });
          }
        } catch (dbError) {
          // Log database error but don't fail the message send
          console.error("Error saving messages to database:", dbError);
        }
      }
    } catch (error) {
      console.error("Error updating training session:", error);
      setTrainingStatus("error");

      // Store failed message for retry
      setLastFailedMessage(content);

      // Classify and store error information
      let errorTypeClassified: ErrorType;
      let errorMessageText: string;

      if (error instanceof TrainingError) {
        errorTypeClassified = error.type;
        errorMessageText = error.message;
        setError(errorMessageText, errorTypeClassified);
      } else if (error instanceof Error) {
        errorTypeClassified = classifyError(error);
        errorMessageText = getErrorMessage(errorTypeClassified, error.message);
        setError(errorMessageText, errorTypeClassified);
      } else {
        errorTypeClassified = "unknown";
        errorMessageText =
          "An unexpected error occurred while processing your message.";
        setError(errorMessageText, errorTypeClassified);
      }

      // Add contextual error message to chat based on error type
      const chatErrorMessage: AIMessage = new AIMessage(
        getContextualErrorMessage(errorTypeClassified, errorMessageText)
      );

      setMessages([...messages, chatErrorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndTraining = async () => {
    if (!trainingStarted || !scenario || !persona) {
      return;
    }

    setIsEndingTraining(true);

    try {
      const result = await endTrainingSession({
        scenario,
        guestPersona: persona,
        messages,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      // Update training status and feedback
      setTrainingStatus("completed");
      if (result.feedback) {
        setSessionFeedback(result.feedback);
      }

      // Update database thread if exists
      if (currentThreadId && authUser?.uid) {
        try {
          const completedThread = await completeTrainingSession(
            currentThreadId,
            null, // scores will be stored as part of feedback JSON
            result.feedback || null
          );

          if (completedThread) {
            // Update thread in CoreAppDataContext
            if (coreDispatch) {
              coreDispatch({
                type: "UPDATE_USER_THREAD",
                payload: {
                  id: currentThreadId,
                  updates: {
                    status: "completed",
                    completedAt: new Date(),
                    score: null,
                    feedback: result.feedback || null,
                  },
                },
              });
            }
          }
        } catch (dbError) {
          console.error(
            "Error updating thread completion in database:",
            dbError
          );
        }
      }
    } catch (error) {
      console.error("Error ending training session:", error);
      setTrainingStatus("error");

      // Classify and store error information
      const errorTypeClassified = classifyError(error);

      if (error instanceof TrainingError) {
        setError(error.message, errorTypeClassified);
      } else if (error instanceof Error) {
        setError(
          getErrorMessage(errorTypeClassified, error.message),
          errorTypeClassified
        );
      } else {
        setError(
          "Failed to end training session. Please try again.",
          errorTypeClassified
        );
      }
    } finally {
      setIsEndingTraining(false);
    }
  };

  const handleStartNewSession = async () => {
    // Reset all training-related state using context
    resetSession();

    // Automatically start a new training session
    await handleStartTraining();
  };

  const handleThreadSelect = async (thread: UserThread) => {
    try {
      setIsLoading(true);

      // Reset current session state
      resetSession();

      // Load messages from the selected thread
      const messagesResult = await getMessagesByChatId(thread.id);

      if (messagesResult.success && messagesResult.messages) {
        // Convert database messages to LangChain message format
        const langchainMessages = messagesResult.messages.map((dbMessage) => {
          let content = "";

          // Handle different parts structures
          if (Array.isArray(dbMessage.parts) && dbMessage.parts.length > 0) {
            content = dbMessage.parts
              .map((part: any) => part?.text || "")
              .join("\n");
          } else if (typeof dbMessage.parts === "string") {
            content = dbMessage.parts;
          } else if (
            dbMessage.parts &&
            typeof dbMessage.parts === "object" &&
            "text" in dbMessage.parts
          ) {
            content = (dbMessage.parts as any).text || "";
          }

          if (dbMessage.role === "AI") {
            return new AIMessage(content);
          } else {
            return new HumanMessage(content);
          }
        });

        // Set the loaded messages
        setMessages(langchainMessages);

        // Set thread context
        setCurrentThreadId(thread.id);

        // Set scenario and persona if available
        if (thread.scenario) {
          setScenario(thread.scenario as any);
        }
        if (thread.persona) {
          setPersona(thread.persona as any);
        }

        // Set training state based on thread status
        setTrainingStarted(true);

        if (thread.status === "completed") {
          setTrainingStatus("completed");
          if (thread.feedback) {
            setSessionFeedback(thread.feedback as any);
          }
        } else if (thread.status === "active") {
          setTrainingStatus("ongoing");
        } else {
          setTrainingStatus("paused");
        }
      } else {
        console.error("Failed to load thread messages:", messagesResult.error);
        setError(
          "Failed to load thread messages. Please try again.",
          "unknown"
        );
      }
    } catch (error) {
      console.error("Error loading thread:", error);
      setError("Failed to load training session. Please try again.", "unknown");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = async () => {
    // Use the stored failed message if available, otherwise find the last human message
    let messageToRetry = lastFailedMessage;

    if (!messageToRetry && messages.length > 0) {
      // Find the last human message to retry (using getType() instead of deprecated _getType())
      const lastHumanMessage = [...messages]
        .reverse()
        .find((msg) => msg.getType() === "human");
      messageToRetry = lastHumanMessage?.content as string;
    }

    if (!messageToRetry) {
      console.warn("No message to retry");
      return;
    }

    // Check if error is retryable based on error type
    if (errorType && !isRetryableError(errorType)) {
      console.warn(
        `Error type '${errorType}' is not retryable, starting new session instead`
      );
      handleStartNewSession();
      return;
    }

    // Remove the last error message from chat before retrying
    if (
      messages.length > 0 &&
      messages[messages.length - 1].getType() === "ai"
    ) {
      const lastMessage = messages[messages.length - 1];
      const isErrorMessage =
        (lastMessage.content as string).toLowerCase().includes("error") ||
        (lastMessage.content as string).toLowerCase().includes("sorry");

      if (isErrorMessage) {
        setMessages(messages.slice(0, -1));
      }
    }

    // Reset error state and retry the message
    setTrainingStatus("ongoing");
    clearError();

    await handleSendMessage(messageToRetry);
  };

  const handleRefineScenario = async () => {
    if (!customScenario.trim()) return;

    setIsRefiningScenario(true);
    try {
      const result = await refineScenario({ scenario: customScenario });

      if (result.error) {
        throw new Error(result.error);
      }

      if (result.refinedScenario) {
        setScenario(result.refinedScenario);
        // Update the scenario text with the refined version
        const refinedText = formatRefinedScenario(result.refinedScenario);
        setCustomScenario(refinedText);
      }
    } catch (error) {
      console.error("Error refining scenario:", error);

      // Set error state for user feedback
      const errorTypeClassified = classifyError(error);

      if (error instanceof TrainingError) {
        setError(error.message, errorTypeClassified);
      } else if (error instanceof Error) {
        setError(
          getErrorMessage(errorTypeClassified, error.message),
          errorTypeClassified
        );
      } else {
        setError(
          "Failed to refine scenario. Please try again.",
          errorTypeClassified
        );
      }
    } finally {
      setIsRefiningScenario(false);
    }
  };

  const handleRefinePersona = async () => {
    if (!customPersona.trim()) return;

    setIsRefiningPersona(true);
    try {
      const result = await refinePersona({ persona: customPersona });

      if (result.error) {
        throw new Error(result.error);
      }

      if (result.refinedPersona) {
        setPersona(result.refinedPersona);
        // Update the persona text with the refined version
        const refinedText = formatRefinedPersona(result.refinedPersona);
        setCustomPersona(refinedText);
      }
    } catch (error) {
      console.error("Error refining persona:", error);

      // Set error state for user feedback
      const errorTypeClassified = classifyError(error);

      if (error instanceof TrainingError) {
        setError(error.message, errorTypeClassified);
      } else if (error instanceof Error) {
        setError(
          getErrorMessage(errorTypeClassified, error.message),
          errorTypeClassified
        );
      } else {
        setError(
          "Failed to refine persona. Please try again.",
          errorTypeClassified
        );
      }
    } finally {
      setIsRefiningPersona(false);
    }
  };

  const formatRefinedScenario = (
    refinedScenario: ScenarioGeneratorSchema
  ): string => {
    if (typeof refinedScenario === "string") {
      return refinedScenario;
    }

    let formatted = "";
    if (refinedScenario.scenario_title) {
      formatted += `${refinedScenario.scenario_title}\n\n`;
    }
    if (refinedScenario.guest_situation) {
      formatted += `Situation: ${refinedScenario.guest_situation}\n\n`;
    }
    if (refinedScenario.difficulty_level) {
      formatted += `Difficulty Level: ${refinedScenario.difficulty_level}\n\n`;
    }
    if (refinedScenario.business_context) {
      formatted += `Context: ${refinedScenario.business_context}\n\n`;
    }
    if (refinedScenario.expected_va_challenges) {
      formatted += `Expected Challenges: ${refinedScenario.expected_va_challenges}`;
    }

    return formatted.trim() || JSON.stringify(refinedScenario, null, 2);
  };

  const formatRefinedPersona = (
    refinedPersona: PersonaGeneratorSchema
  ): string => {
    if (typeof refinedPersona === "string") {
      return refinedPersona;
    }

    let formatted = "";
    if (refinedPersona.name) {
      formatted += `${refinedPersona.name}\n\n`;
    }
    if (refinedPersona.demographics) {
      formatted += `Demographics: ${refinedPersona.demographics}\n\n`;
    }

    if (refinedPersona.personality_traits) {
      formatted += `Personality Traits: ${refinedPersona.personality_traits}\n\n`;
    }
    if (refinedPersona.emotional_tone) {
      formatted += `Emotional Tone: ${refinedPersona.emotional_tone}\n\n`;
    }
    if (refinedPersona.communication_style) {
      formatted += `Communication Style: ${refinedPersona.communication_style}`;
    }

    return formatted.trim() || JSON.stringify(refinedPersona, null, 2);
  };

  return (
    <div className="h-screen flex bg-background">
      {/* Left Sidebar */}
      <LeftSidebar
        onThreadSelect={handleThreadSelect}
        selectedThreadId={currentThreadId}
      />

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col bg-background relative ${
          isResizing ? "select-none" : ""
        }`}
      >
        {/* Header Section */}
        <header className="flex items-center justify-between p-3 sm:p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground truncate pr-2">
            STR Virtual Assistant Training
          </h1>
          <div className="flex items-center gap-2 shrink-0">
            <ThemeToggle />
          </div>
        </header>

        {/* Error Display */}
        {errorMessage && errorType && (
          <div className="px-3 sm:px-4 py-2 bg-red-50 dark:bg-red-950/20 border-b border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-red-600 dark:text-red-400 font-medium">
                {errorType === "network" && "🌐"}
                {errorType === "timeout" && "⏱️"}
                {errorType === "validation" && "⚠️"}
                {errorType === "agent" && "🤖"}
                {errorType === "session" && "📋"}
                {errorType === "unknown" && "❌"}{" "}
                {errorType.charAt(0).toUpperCase() + errorType.slice(1)} Error
              </span>
              <span className="text-red-700 dark:text-red-300">
                {errorMessage}
              </span>
              {isRetryableError(errorType) && (
                <span className="text-red-600 dark:text-red-400 text-xs ml-auto">
                  Retryable
                </span>
              )}
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden flex">
          {/* Left Side - Chat Area */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {!trainingStarted ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-4">
                  <h2 className="text-xl font-semibold text-foreground">
                    Ready to Start Training?
                  </h2>
                  <p className="text-muted-foreground max-w-md">
                    Customize your training using the panels on the right, or
                    leave them blank for AI-generated content.
                  </p>
                  <div className="flex flex-col gap-3">
                    <Button
                      onClick={() => {
                        handleStartTraining();
                      }}
                      disabled={isLoading}
                      size="lg"
                    >
                      {isLoading
                        ? "Starting Training..."
                        : "Start Single Training Session"}
                    </Button>
                    <Button
                      onClick={() => setShowBulkCreation(true)}
                      disabled={isLoading}
                      variant="outline"
                      size="lg"
                    >
                      Create Multiple Sessions
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col">
                {/* Training Status Indicator for ongoing training */}
                {isTrainingActive && (
                  <div className="flex justify-center p-2 border-b bg-background/95">
                    <TrainingStatusIndicator
                      status={trainingStatus}
                      onEndTraining={handleEndTraining}
                      isEndingTraining={isEndingTraining}
                    />
                  </div>
                )}

                {/* Message Area */}
                <div className="flex-1 overflow-hidden">
                  <MessageArea messages={messages} className="h-full" />
                </div>
                {/* Footer - Message Input or Completion Footer */}
                {trainingStarted && (
                  <footer className="shrink-0">
                    {isSessionCompleted || isSessionError ? (
                      <CompletionFooter
                        status={trainingStatus}
                        onStartNewSession={handleStartNewSession}
                        onRetry={isSessionError ? handleRetry : undefined}
                      />
                    ) : (
                      <MessageInput
                        onSendMessage={(message) => {
                          handleSendMessage(message);
                        }}
                        placeholder="Type your message to the guest..."
                        className="border-t-0"
                        disabled={isLoading}
                      />
                    )}
                  </footer>
                )}
              </div>
            )}
          </div>

          {/* Bulk Session Creation Modal */}
          {showBulkCreation && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-background rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">
                      Create Multiple Training Sessions
                    </h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowBulkCreation(false)}
                      disabled={isCreatingBulkSessions}
                    >
                      ✕
                    </Button>
                  </div>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                  <div className="space-y-6">
                    {/* Session Count Input */}
                    <div className="space-y-2">
                      <Label htmlFor="sessionCount">Number of Sessions</Label>
                      <Input
                        id="sessionCount"
                        type="number"
                        min="1"
                        max="20"
                        value={sessionCount}
                        onChange={(e) =>
                          handleSessionCountChange(
                            parseInt(e.target.value) || 1
                          )
                        }
                        disabled={isCreatingBulkSessions}
                      />
                    </div>

                    {/* Session Configurations */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">
                          Session Configurations
                        </h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleAddConfiguration}
                          disabled={isCreatingBulkSessions}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Session
                        </Button>
                      </div>

                      <div className="grid gap-4">
                        {sessionConfigurations.map((config, index) => (
                          <Card key={config.id}>
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-base">
                                  Session {index + 1}
                                </CardTitle>
                                {sessionConfigurations.length > 1 && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleRemoveConfiguration(config.id)
                                    }
                                    disabled={isCreatingBulkSessions}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor={`title-${config.id}`}>
                                  Session Title
                                </Label>
                                <Input
                                  id={`title-${config.id}`}
                                  value={config.title}
                                  onChange={(e) =>
                                    handleConfigurationChange(
                                      config.id,
                                      "title",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Enter session title"
                                  disabled={isCreatingBulkSessions}
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor={`scenario-${config.id}`}>
                                  Custom Scenario (Optional)
                                </Label>
                                <textarea
                                  id={`scenario-${config.id}`}
                                  className="w-full min-h-[80px] p-3 border border-input bg-background rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                  value={config.scenario}
                                  onChange={(e) =>
                                    handleConfigurationChange(
                                      config.id,
                                      "scenario",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Leave blank for AI-generated scenario or enter custom scenario details..."
                                  disabled={isCreatingBulkSessions}
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor={`persona-${config.id}`}>
                                  Custom Persona (Optional)
                                </Label>
                                <textarea
                                  id={`persona-${config.id}`}
                                  className="w-full min-h-[80px] p-3 border border-input bg-background rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                  value={config.persona}
                                  onChange={(e) =>
                                    handleConfigurationChange(
                                      config.id,
                                      "persona",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Leave blank for AI-generated persona or enter custom persona details..."
                                  disabled={isCreatingBulkSessions}
                                />
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t bg-muted/50">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {sessionConfigurations.length} session
                      {sessionConfigurations.length !== 1 ? "s" : ""} will be
                      created
                    </p>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setShowBulkCreation(false)}
                        disabled={isCreatingBulkSessions}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleStartAllSessions}
                        disabled={
                          isCreatingBulkSessions ||
                          sessionConfigurations.length === 0
                        }
                      >
                        {isCreatingBulkSessions
                          ? "Creating Sessions..."
                          : `Create All ${sessionConfigurations.length} Sessions`}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Resize Handle */}
          <div
            className={`w-1 cursor-col-resize transition-all relative group ${
              isResizing ? "bg-primary w-2" : "bg-border hover:bg-primary/50"
            }`}
            onMouseDown={handleMouseDown}
            ref={resizeRef}
          >
            <div
              className={`absolute inset-y-0 -left-2 -right-2 transition-colors ${
                isResizing ? "bg-primary/30" : "group-hover:bg-primary/10"
              }`}
            />

            {/* Visual grip dots */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex flex-col gap-1">
                <div className="w-0.5 h-0.5 bg-muted-foreground rounded-full"></div>
                <div className="w-0.5 h-0.5 bg-muted-foreground rounded-full"></div>
                <div className="w-0.5 h-0.5 bg-muted-foreground rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Right Side - Panels Section */}
          <div
            className="border-l bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex flex-col"
            style={{ width: `${panelWidth}px` }}
          >
            <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-4">
              {!trainingStarted ? (
                <>
                  {/* Custom Scenario Input Panel */}
                  <CustomScenarioPanel
                    value={customScenario}
                    onChange={setCustomScenario}
                    onRefine={handleRefineScenario}
                    isRefining={isRefiningScenario}
                    disabled={isLoading}
                    defaultOpen={false}
                  />

                  {/* Custom Persona Input Panel */}
                  <CustomPersonaPanel
                    value={customPersona}
                    onChange={setCustomPersona}
                    onRefine={handleRefinePersona}
                    isRefining={isRefiningPersona}
                    disabled={isLoading}
                    defaultOpen={false}
                  />
                </>
              ) : (
                <>
                  {/* Feedback Display Panel - shown when session is completed */}
                  {isSessionCompleted && sessionFeedback && (
                    <FeedbackDisplayPanel
                      feedback={sessionFeedback}
                      onStartNewSession={handleStartNewSession}
                      defaultOpen={true}
                    />
                  )}
                  {/* Generated Scenario Display Panel */}
                  {scenario && (
                    <ScenarioDisplayPanel
                      scenario={scenario}
                      defaultOpen={true}
                    />
                  )}

                  {/* Generated Persona Display Panel */}
                  {persona && (
                    <PersonaDisplayPanel persona={persona} defaultOpen={true} />
                  )}
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function RootLayout() {
  return (
    <TrainingProvider>
      <div className="min-h-screen">
        <ChatPage />
      </div>
    </TrainingProvider>
  );
}
