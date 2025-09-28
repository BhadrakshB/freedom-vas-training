"use client";

import React from "react";
import { MessageArea } from "./MessageArea";
import { MessageInput } from "./MessageInput";
import { CompletionFooter, TrainingStatusIndicator } from "./";
import type { BaseMessage } from "@langchain/core/messages";

import type { TrainingStateType } from "../lib/agents/v2/graph_v2";

interface TrainingChatAreaProps {
  messages: BaseMessage[];
  trainingStatus: TrainingStateType;
  isTrainingActive: boolean;
  isSessionCompleted: boolean;
  isSessionError: boolean;
  isLoading: boolean;
  isEndingTraining: boolean;
  onSendMessage: (message: string) => void;
  onEndTraining: () => void;
  onStartNewSession: () => void;
  onRetry?: () => void;
}

export function TrainingChatArea({
  messages,
  trainingStatus,
  isTrainingActive,
  isSessionCompleted,
  isSessionError,
  isLoading,
  isEndingTraining,
  onSendMessage,
  onEndTraining,
  onStartNewSession,
  onRetry,
}: TrainingChatAreaProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Training Status Indicator for ongoing training */}
      {isTrainingActive && (
        <div className="flex justify-center p-2 border-b bg-background/95">
          <TrainingStatusIndicator
            status={trainingStatus}
            onEndTraining={onEndTraining}
            isEndingTraining={isEndingTraining}
          />
        </div>
      )}

      {/* Message Area */}
      <div className="flex-1 overflow-hidden">
        <MessageArea messages={messages} className="h-full" />
      </div>

      {/* Footer - Message Input or Completion Footer */}
      <footer className="shrink-0">
        {isSessionCompleted || isSessionError ? (
          <CompletionFooter
            status={trainingStatus}
            onStartNewSession={onStartNewSession}
            onRetry={isSessionError ? onRetry : undefined}
          />
        ) : (
          <MessageInput
            onSendMessage={onSendMessage}
            placeholder="Type your message to the guest..."
            className="border-t-0"
            disabled={isLoading}
          />
        )}
      </footer>
    </div>
  );
}
