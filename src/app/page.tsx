"use client";

import React, { useState } from "react";
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
  FeedbackPanel,
  TrainingStatusIndicator,
} from "./components";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  startTrainingSession,
  updateTrainingSession,
  refineScenario,
  refinePersona,
} from "./lib/actions/training-actions";
import { AIMessage, BaseMessage, HumanMessage } from "@langchain/core/messages";
import {
  ScenarioGeneratorSchema,
  PersonaGeneratorSchema,
  TrainingStateType,
  FeedbackSchema,
} from "./lib/agents/v2/graph_v2";
import { TrainingError, ErrorType, classifyError } from "./lib/error-handling";

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

export default function ChatPage() {
  const [messages, setMessages] = useState<BaseMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [trainingStarted, setTrainingStarted] = useState(false);
  const [trainingStatus, setTrainingStatus] =
    useState<TrainingStateType>("start");
  const [sessionFeedback, setSessionFeedback] = useState<FeedbackSchema | null>(
    null
  );
  const [scenario, setScenario] = useState<ScenarioGeneratorSchema | null>(
    null
  );
  const [persona, setPersona] = useState<PersonaGeneratorSchema | null>(null);
  const [customScenario, setCustomScenario] = useState("");
  const [customPersona, setCustomPersona] = useState("");
  const [isRefiningScenario, setIsRefiningScenario] = useState(false);
  const [isRefiningPersona, setIsRefiningPersona] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<ErrorType | null>(null);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(
    null
  );
  const [isFeedbackPanelCollapsed, setIsFeedbackPanelCollapsed] =
    useState(false);

  // Computed properties for training state
  const isSessionCompleted = trainingStatus === "completed";
  const isSessionError = trainingStatus === "error";
  const isTrainingActive = trainingStarted && trainingStatus === "ongoing";

  const handleStartTraining = async () => {
    setIsLoading(true);

    try {
      const params: { customScenario?: string; customPersona?: string } = {};

      if (customScenario.trim()) {
        params.customScenario = customScenario.trim();
      }

      if (customPersona.trim()) {
        params.customPersona = customPersona.trim();
      }

      const result = await startTrainingSession(params);

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
    } catch (error) {
      console.error("Error starting training session:", error);
      setTrainingStatus("error");

      // Classify and store error information
      const errorType = classifyError(error);
      setErrorType(errorType);

      let errorMessage =
        "Sorry, there was an error starting the training session.";
      if (error instanceof TrainingError) {
        setErrorMessage(error.message);
        errorMessage = error.message;
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
        errorMessage = error.message;
      } else {
        setErrorMessage(
          "An unexpected error occurred while starting the training session."
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
    setErrorMessage(null);
    setErrorType(null);
    setLastFailedMessage(null);

    try {
      const result = await updateTrainingSession({
        scenario,
        guestPersona: persona,
        messages: updatedMessages,
      });

      if (result.error) {
        setTrainingStatus("error");

        // Store error information for retry functionality
        setLastFailedMessage(content);
        const errorType =
          (result.errorType as ErrorType) ||
          classifyError(new Error(result.error));
        setErrorType(errorType);
        setErrorMessage(result.error);

        throw new TrainingError(
          result.error,
          errorType,
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

      setMessages((prev) => [...prev, guestMessage]);
    } catch (error) {
      console.error("Error updating training session:", error);
      setTrainingStatus("error");

      // Store failed message for retry
      setLastFailedMessage(content);

      // Classify and store error information
      let errorType: ErrorType;
      let errorMessage: string;

      if (error instanceof TrainingError) {
        errorType = error.type;
        errorMessage = error.message;
        setErrorType(errorType);
        setErrorMessage(errorMessage);
      } else if (error instanceof Error) {
        errorType = classifyError(error);
        errorMessage = getErrorMessage(errorType, error.message);
        setErrorType(errorType);
        setErrorMessage(errorMessage);
      } else {
        errorType = "unknown";
        errorMessage =
          "An unexpected error occurred while processing your message.";
        setErrorType(errorType);
        setErrorMessage(errorMessage);
      }

      // Add contextual error message to chat based on error type
      const chatErrorMessage: AIMessage = new AIMessage(
        getContextualErrorMessage(errorType, errorMessage)
      );

      setMessages((prev) => [...prev, chatErrorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartNewSession = async () => {
    // Reset all training-related state
    setMessages([]);
    setSessionFeedback(null);
    setScenario(null);
    setPersona(null);
    setCustomScenario("");
    setCustomPersona("");
    setIsRefiningScenario(false);
    setIsRefiningPersona(false);

    // Reset error state
    setErrorMessage(null);
    setErrorType(null);
    setLastFailedMessage(null);

    // Reset feedback panel state
    setIsFeedbackPanelCollapsed(false);

    // Automatically start a new training session
    await handleStartTraining();
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
        setMessages((prev) => prev.slice(0, -1));
      }
    }

    // Reset error state and retry the message
    setTrainingStatus("ongoing");
    setErrorMessage(null);
    setErrorType(null);

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
        // Update the scenario text with the refined version
        const refinedText = formatRefinedScenario(result.refinedScenario);
        setCustomScenario(refinedText);
      }
    } catch (error) {
      console.error("Error refining scenario:", error);

      // Set error state for user feedback
      const errorType = classifyError(error);
      setErrorType(errorType);

      if (error instanceof TrainingError) {
        setErrorMessage(error.message);
      } else if (error instanceof Error) {
        setErrorMessage(getErrorMessage(errorType, error.message));
      } else {
        setErrorMessage("Failed to refine scenario. Please try again.");
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
        // Update the persona text with the refined version
        const refinedText = formatRefinedPersona(result.refinedPersona);
        setCustomPersona(refinedText);
      }
    } catch (error) {
      console.error("Error refining persona:", error);

      // Set error state for user feedback
      const errorType = classifyError(error);
      setErrorType(errorType);

      if (error instanceof TrainingError) {
        setErrorMessage(error.message);
      } else if (error instanceof Error) {
        setErrorMessage(getErrorMessage(errorType, error.message));
      } else {
        setErrorMessage("Failed to refine persona. Please try again.");
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
      formatted += `Personality Traits: ${refinedPersona.personality_traits}\nn`;
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
    <div className="h-screen flex flex-col bg-background relative">
      {/* Header Section */}
      <header className="flex items-center justify-between p-3 sm:p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground truncate pr-2">
          STR Virtual Assistant Training
        </h1>
        <ThemeToggle className="shrink-0" />
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

      {/* Main Content Area with Feedback Panel */}
      <main className="flex-1 overflow-hidden flex">
        {/* Left Feedback Panel - Collapsible */}
        {isSessionCompleted && sessionFeedback && (
          <div
            className={`${
              isFeedbackPanelCollapsed ? "w-12" : "w-96"
            } border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex flex-col transition-all duration-300 ease-in-out`}
          >
            {/* Panel Header with Toggle */}
            <div className="flex items-center justify-between p-3 border-b bg-background/80">
              {!isFeedbackPanelCollapsed && (
                <h3 className="font-semibold text-sm text-foreground">
                  Training Feedback
                </h3>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setIsFeedbackPanelCollapsed(!isFeedbackPanelCollapsed)
                }
                className="h-8 w-8 p-0 hover:bg-muted"
              >
                {isFeedbackPanelCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Panel Content */}
            {!isFeedbackPanelCollapsed && (
              <div className="flex-1 overflow-y-auto p-4">
                <FeedbackPanel
                  feedback={sessionFeedback}
                  onStartNewSession={handleStartNewSession}
                />
              </div>
            )}
          </div>
        )}

        {/* Main Message Area */}
        <div className="flex-1 overflow-hidden">
          {!trainingStarted ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center space-y-4">
                <h2 className="text-xl font-semibold text-foreground">
                  Ready to Start Training?
                </h2>
                <p className="text-muted-foreground max-w-md">
                  Customize your training using the floating panels, or leave
                  them blank for AI-generated content.
                </p>
                <Button
                  onClick={() => {
                    handleStartTraining();
                  }}
                  disabled={isLoading}
                  size="lg"
                >
                  {isLoading
                    ? "Starting Training..."
                    : "Start Training Session"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col">
              {/* Training Status Indicator for ongoing training */}
              {isTrainingActive && (
                <div className="flex justify-center p-2 border-b bg-background/95">
                  <TrainingStatusIndicator status={trainingStatus} />
                </div>
              )}

              {/* Message Area */}
              <div className="flex-1 overflow-hidden">
                <MessageArea messages={messages} className="h-full" />
              </div>
            </div>
          )}
        </div>
      </main>

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

      {/* Floating Collapsible Panels */}
      <div className="absolute right-4 top-20 bottom-4 w-80 flex flex-col gap-4 z-10 overflow-y-auto pointer-events-none">
        <div className="pointer-events-auto space-y-4">
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
              {/* Generated Scenario Display Panel */}
              {scenario && (
                <ScenarioDisplayPanel scenario={scenario} defaultOpen={false} />
              )}

              {/* Generated Persona Display Panel */}
              {persona && (
                <PersonaDisplayPanel persona={persona} defaultOpen={false} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
