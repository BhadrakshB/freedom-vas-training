"use client";

import * as React from "react";

import { cn } from "@/app/lib/utils";
import { BaseMessage, HumanMessage } from "@langchain/core/messages";
import { ExtendedHumanMessageImpl } from "../contexts/CoreAppDataContext";

interface MessageAreaProps {
  messages: BaseMessage[];
  className?: string;
}

function MessageArea({ messages, className }: MessageAreaProps) {
  return (
    <div
      className={cn(
        "flex-1 overflow-y-auto scrollbar-hide p-3 sm:p-4 md:p-6",
        className
      )}
    >
      <div className="space-y-3 sm:space-y-4 max-w-4xl mx-auto">
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          <MessageList messages={messages} />
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[300px] sm:min-h-[400px] text-center px-4">
      <div className="space-y-3 sm:space-y-4 max-w-md">
        <div
          className="text-3xl sm:text-4xl mb-2 sm:mb-4"
          role="img"
          aria-label="Chat bubble"
        >
          💬
        </div>
        <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
          Welcome to STR Virtual Assistant Training
        </h2>
        <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
          Start a conversation to begin your training session. Practice handling
          guest interactions in a safe, simulated environment.
        </p>
        <p className="text-sm text-muted-foreground">
          Type your message below to get started
        </p>
      </div>
    </div>
  );
}

function MessageList({ messages }: { messages: BaseMessage[] }) {
  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
    </div>
  );
}

function MessageBubble({ message }: { message: BaseMessage }) {
  const isHuman =
    message instanceof HumanMessage ||
    message instanceof ExtendedHumanMessageImpl;
  const rating =
    message instanceof ExtendedHumanMessageImpl
      ? message.messageRating?.Message_Rating.Rating
      : undefined;
  const listOfSuggestions =
    message instanceof ExtendedHumanMessageImpl
      ? message.messageSuggestions?.Alternative_Suggestions
      : undefined;

  // Rating color for text based on score
  const getRatingTextColor = (rating: number) => {
    if (rating >= 8) return "text-green-600";
    if (rating >= 6) return "text-yellow-600";
    return "text-red-600";
  };

  // Only show feedback indicator if there's rating or suggestions
  const hasFeedback =
    rating !== undefined || (listOfSuggestions && listOfSuggestions.length > 0);

  return (
    <div
      className={cn("flex w-full", isHuman ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "flex flex-col gap-1.5",
          isHuman ? "items-end" : "items-start"
        )}
      >
        {/* Main message bubble */}
        <div
          className={cn(
            "max-w-[85%] sm:max-w-[80%] md:max-w-[70%] rounded-lg px-3 sm:px-4 py-2 text-sm",
            isHuman
              ? "bg-primary text-primary-foreground ml-4 sm:ml-8 md:ml-12"
              : "bg-muted text-muted-foreground mr-4 sm:mr-8 md:mr-12"
          )}
        >
          <div className="whitespace-pre-wrap break-words leading-relaxed">
            {message.content.toString()}
          </div>
        </div>

        {/* Rating and Suggestions - only for human messages */}
        {isHuman &&
          (rating !== undefined ||
            (listOfSuggestions && listOfSuggestions.length > 0)) && (
            <div className="max-w-[85%] sm:max-w-[80%] md:max-w-[70%] space-y-2">
              {/* Rating Badge */}
              {rating !== undefined && (
                <div className="flex justify-end">
                  <div
                    className={cn(
                      "text-xs px-2 py-1 rounded-full border font-medium flex items-center gap-1",
                      rating >= 8
                        ? "bg-green-100 text-green-800 border-green-200"
                        : rating >= 6
                        ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                        : "bg-red-100 text-red-800 border-red-200"
                    )}
                  >
                    <span>{rating}/10</span>
                    <span className="text-yellow-500">⭐</span>
                  </div>
                </div>
              )}

              {/* Suggestions Section */}
              {listOfSuggestions && listOfSuggestions.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg overflow-hidden">
                  {/* Header */}
                  <div className="px-3 py-2 bg-blue-100 border-b border-blue-200">
                    <div className="text-xs font-medium text-blue-700 flex items-center gap-1.5">
                      <span>💡</span>
                      <span>
                        Alternative Responses ({listOfSuggestions.length})
                      </span>
                    </div>
                  </div>

                  {/* Suggestions List */}
                  <div className="p-3 space-y-2">
                    {listOfSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="relative pl-3 py-2 text-xs text-gray-700 leading-relaxed bg-white rounded border border-blue-100"
                      >
                        {/* Blue accent bar */}
                        <div className="absolute left-0 top-2 bottom-2 w-1 bg-blue-400 rounded-full"></div>
                        {suggestion.Response}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
      </div>
    </div>
  );
}

export { MessageArea };
