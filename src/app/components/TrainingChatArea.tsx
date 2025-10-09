"use client";

import React, { useMemo, useState, useCallback } from "react";
import { MessageArea } from "./MessageArea";
import { MessageInput } from "./MessageInput";
import {
  CompletionFooter,
  TrainingStatusIndicator,
  GroupFeedbackDisplay,
} from "./";
import { Button } from "./ui/button";
import { MessageSquare, Trophy } from "lucide-react";
import {
  ExtendedHumanMessageImpl,
  useCoreAppData,
} from "../contexts/CoreAppDataContext";
import { BaseMessage, AIMessage } from "@langchain/core/messages";

interface GroupFeedback {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  scores: {
    communication: number;
    empathy: number;
    accuracy: number;
    overall: number;
  };
  guest_prioritization?: {
    analysis: string;
    behavior_pattern: string;
    suggestions: string[];
    score: number;
  };
  responsiveness?: {
    analysis: string;
    avg_response_time_sec: number;
    variability: string;
    suggestions: string[];
    score: number;
  };
  session_breakdown?: Array<{
    thread_title: string;
    key_observations: string[];
    score: number;
    response_time_sec?: number;
    prioritization_note?: string;
  }>;
}

export function TrainingChatArea() {
  const {
    state,
    handleUpdateTraining,
    handleEndTraining,
    handleStartTraining,
    setActiveThreadId,
  } = useCoreAppData();
  const [isEndingTraining, setIsEndingTraining] = useState(false);
  const [showGroupFeedback, setShowGroupFeedback] = useState(false);

  // Get the active thread from userThreads using activeThreadId
  const activeThread = useMemo(() => {
    if (!state.activeThreadId) return null;
    return state.userThreads.find(
      (threadWithMessages) =>
        threadWithMessages.thread.id === state.activeThreadId
    );
  }, [state.activeThreadId, state.userThreads]);

  // Reset showGroupFeedback when thread changes
  React.useEffect(() => {
    setShowGroupFeedback(false);
  }, [state.activeThreadId]);

  // Convert database messages to BaseMessage format
  const messages = useMemo<BaseMessage[]>(() => {
    if (!activeThread?.messages) return [];

    return activeThread.messages.map((dbMessage) => {
      const content =
        typeof dbMessage.parts === "string"
          ? dbMessage.parts
          : (dbMessage.parts as any)?.content || "";

      if (dbMessage.role === "trainee") {
        // Parse message rating and suggestions into objects
        const messageRating =
          typeof dbMessage.messageRating === "string"
            ? JSON.parse(dbMessage.messageRating)
            : dbMessage.messageRating;

        const messageSuggestions =
          typeof dbMessage.messageSuggestions === "string"
            ? JSON.parse(dbMessage.messageSuggestions)
            : dbMessage.messageSuggestions;

        return new ExtendedHumanMessageImpl(
          content,
          messageRating,
          messageSuggestions
        );
      } else {
        return new AIMessage(content);
      }
    });
  }, [activeThread?.messages]);

  // Determine training status - map Thread status to TrainingStateType
  const trainingStatus = useMemo<
    "start" | "ongoing" | "completed" | "error" | "paused"
  >(() => {
    if (!activeThread) return "start";

    const status = activeThread.thread.status;
    if (status === "completed") return "completed";
    if (status === "active") return "ongoing";
    if (status === "paused") return "paused";
    return "start";
  }, [activeThread?.thread.status]);

  const isTrainingActive = trainingStatus === "ongoing";
  const isSessionCompleted = trainingStatus === "completed";
  const isSessionError = state.errorType === "session";
  const isLoading = state.isLoading;

  // Get group feedback if thread is part of a group
  const threadGroup = useMemo(() => {
    if (!activeThread?.thread.groupId) return null;
    return state.threadGroups.find(
      (g) => g.threadGroup.id === activeThread.thread.groupId
    );
  }, [activeThread, state.threadGroups]);

  const groupFeedback = threadGroup?.threadGroup.groupFeedback as
    | GroupFeedback
    | undefined;

  // Check if group feedback should be shown
  const shouldShowGroupFeedbackToggle =
    isSessionCompleted &&
    groupFeedback &&
    Object.keys(groupFeedback).length > 0;

  // Handle sending a message
  const handleSendMessage = useCallback(
    async (message: string) => {
      if (!activeThread || !message.trim()) return;

      const scenario = activeThread.thread.scenario as any;
      const persona = activeThread.thread.persona as any;

      if (!scenario || !persona) {
        console.error("Cannot send message: missing scenario or persona");
        return;
      }

      await handleUpdateTraining(
        activeThread.thread.id,
        message.trim(),
        scenario,
        persona,
        messages
      );
    },
    [activeThread, messages, handleUpdateTraining]
  );

  // Handle ending training
  const handleEndTrainingClick = useCallback(async () => {
    if (!activeThread) return;

    const scenario = activeThread.thread.scenario as any;
    const persona = activeThread.thread.persona as any;

    if (!scenario || !persona) {
      console.error("Cannot end training: missing scenario or persona");
      return;
    }

    setIsEndingTraining(true);
    try {
      await handleEndTraining(
        activeThread.thread.id,
        scenario,
        persona,
        messages
      );
    } finally {
      setIsEndingTraining(false);
    }
  }, [activeThread, messages, handleEndTraining]);

  // Handle starting a new session
  const handleStartNewSession = useCallback(() => {
    setActiveThreadId(null);
  }, [setActiveThreadId]);

  // Handle retry on error
  const handleRetry = useCallback(() => {
    // Clear error and allow user to try again
    if (activeThread) {
      handleStartTraining();
    }
  }, [activeThread, handleStartTraining]);

  if (!activeThread) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        No active training session
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Training Status Indicator for ongoing training */}
      {isTrainingActive && (
        <div className="flex justify-center p-2 border-b bg-background/95">
          <TrainingStatusIndicator
            status={trainingStatus}
            onEndTraining={handleEndTrainingClick}
            isEndingTraining={isEndingTraining}
          />
        </div>
      )}

      {/* Toggle Button for Group Feedback */}
      {shouldShowGroupFeedbackToggle && (
        <div className="flex justify-center p-2 border-b bg-background/95">
          <div className="flex gap-2">
            <Button
              variant={!showGroupFeedback ? "default" : "outline"}
              size="sm"
              onClick={() => setShowGroupFeedback(false)}
              className="gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              Messages
            </Button>
            <Button
              variant={showGroupFeedback ? "default" : "outline"}
              size="sm"
              onClick={() => setShowGroupFeedback(true)}
              className="gap-2"
            >
              <Trophy className="h-4 w-4" />
              Session Feedback
            </Button>
          </div>
        </div>
      )}

      {/* Message Area or Group Feedback Display */}
      <div className="flex-1 overflow-hidden">
        {showGroupFeedback && shouldShowGroupFeedbackToggle ? (
          <div className="h-full overflow-y-auto p-4">
            <GroupFeedbackDisplay groupFeedback={groupFeedback!} />
          </div>
        ) : (
          <MessageArea messages={messages} className="h-full" />
        )}
      </div>

      {/* Footer - Message Input or Completion Footer */}
      <footer className="shrink-0">
        {isSessionCompleted || isSessionError ? (
          <CompletionFooter
            status={trainingStatus}
            onStartNewSession={handleStartNewSession}
            onRetry={isSessionError ? handleRetry : undefined}
          />
        ) : (
          <MessageInput
            onSendMessage={handleSendMessage}
            placeholder="Type your message to the guest..."
            className="border-t-0"
            disabled={isLoading}
          />
        )}
      </footer>
    </div>
  );
}
