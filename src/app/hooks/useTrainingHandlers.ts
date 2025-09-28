"use client";

import { useContext, useState } from "react";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { trainingContext } from "../contexts/TrainingContext";
import { useAuth } from "../contexts/AuthContext";
import { CoreAppDataContext } from "../contexts/CoreAppDataContext";
import {
    startTrainingSession,
    updateTrainingSession,
    refineScenario,
    refinePersona,
    endTrainingSession,
} from "../lib/actions/training-actions";
import { getOrCreateUserByFirebaseUid } from "../lib/db/actions/user-actions";
import {
    createThread,
    completeTrainingSession,
} from "../lib/db/actions/thread-actions";
import { createMessage } from "../lib/db/actions/message-actions";
import { getMessagesByChatId } from "../lib/actions/message-actions";
import type { UserThread } from "../lib/actions/user-threads-actions";
import {
    ScenarioGeneratorSchema,
    PersonaGeneratorSchema,
} from "../lib/agents/v2/graph_v2";
import { TrainingError, ErrorType, classifyError } from "../lib/error-handling";
import { ExtendedHumanMessageImpl } from "../contexts/TrainingContext";
import type { SessionConfiguration } from "../components/BulkSessionCreation";

// Helper functions for error handling
function isRetryableError(errorType: ErrorType): boolean {
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

export function useTrainingHandlers() {
    const trainingCtx = useContext(trainingContext);
    const authContext = useAuth();
    const authUser = authContext?.state?.user;
    const coreContext = useContext(CoreAppDataContext);
    const coreDispatch = coreContext?.dispatch;

    const [isEndingTraining, setIsEndingTraining] = useState(false);

    // Get active training state
    const activeTrainingState = trainingCtx.getActiveTrainingState();
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
    const setCurrentThreadId = (threadId: string | null) =>
        trainingCtx.setCurrentThreadId(getActiveId(), threadId);
    const resetSession = () => trainingCtx.resetSession(getActiveId());

    // Computed properties for training state
    const isSessionCompleted = trainingStatus === "completed";
    const isSessionError = trainingStatus === "error";
    const isTrainingActive = trainingStarted && trainingStatus === "ongoing";

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
                `${(result.finalOutput as string) ||
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
                            groupId: null,
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
                                messageRating: undefined,
                                messageSuggestions: undefined
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

        const newMessage: HumanMessage = new HumanMessage(content);

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
                // Update feedback in database if thread exists
                if (currentThreadId && authUser?.uid && result.feedback) {
                    try {
                        await completeTrainingSession(
                            currentThreadId,
                            null, // scores will be stored as part of feedback JSON
                            result.feedback
                        );

                        // Update thread in CoreAppDataContext
                        if (coreDispatch) {
                            coreDispatch({
                                type: "UPDATE_USER_THREAD",
                                payload: {
                                    id: currentThreadId,
                                    updates: {
                                        feedback: result.feedback,
                                        updatedAt: new Date(),
                                    },
                                },
                            });
                        }
                    } catch (dbError) {
                        console.error("Error updating feedback in database:", dbError);
                    }
                }

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
                        messageRating: undefined,
                        messageSuggestions: undefined
                    });

                    // Save AI response
                    await createMessage({
                        chatId: currentThreadId,
                        role: "AI",
                        parts: [{ text: (result.guestResponse as string) || "" }],
                        attachments: [],
                        isTraining: true,
                        messageRating: undefined,
                        messageSuggestions: undefined
                    });

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

    const handleStartAllSessions = async (
        sessionConfigurations: SessionConfiguration[]
    ) => {
        if (!authUser?.uid) {
            setError(
                "Please log in to create multiple training sessions.",
                "validation"
            );
            return;
        }

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
                        groupId: null,
                    });

                    if (newThread) {
                        // Save initial AI message to database
                        const initialMessage = `${(result.finalOutput as string) ||
                            "Training session started! You can now begin chatting with the guest."
                            }`;

                        await createMessage({
                            chatId: newThread.id,
                            role: "AI",
                            parts: [{ text: initialMessage }],
                            attachments: [],
                            isTraining: true,
                            messageRating: undefined,
                            messageSuggestions: undefined
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
                // Show success message
                const successMessage =
                    failed > 0
                        ? `Successfully created ${successful} sessions. ${failed} sessions failed to create.`
                        : `Successfully created all ${successful} training sessions!`;

                console.log(successMessage);
                return { success: true, message: successMessage };
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
            return { success: false, error };
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

    return {
        // State
        messages,
        isLoading,
        trainingStarted,
        trainingStatus,
        sessionFeedback,
        scenario,
        persona,
        customScenario,
        customPersona,
        isRefiningScenario,
        isRefiningPersona,
        errorMessage,
        errorType,
        lastFailedMessage,
        currentThreadId,
        isEndingTraining,
        isSessionCompleted,
        isSessionError,
        isTrainingActive,

        // Actions
        setCustomScenario,
        setCustomPersona,
        handleStartTraining,
        handleSendMessage,
        handleEndTraining,
        handleStartNewSession,
        handleThreadSelect,
        handleRetry,
        handleRefineScenario,
        handleRefinePersona,
        handleStartAllSessions,
    };
}