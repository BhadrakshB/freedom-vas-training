"use client";

import * as React from "react";

import { cn } from "@/app/lib/utils";
import { BaseMessage, HumanMessage } from "@langchain/core/messages";
import { ExtendedHumanMessageImpl } from "../contexts/TrainingContext";

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
  const [showSuggestions, setShowSuggestions] = React.useState(false);

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

  // Rating color based on score
  const getRatingColor = (rating: number) => {
    if (rating >= 8) return "bg-green-100 text-green-800 border-green-200";
    if (rating >= 6) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-red-100 text-red-800 border-red-200";
  };

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

        {/* Rating and Suggestions Toggle - only for human messages */}
        {isHuman &&
          (rating || (listOfSuggestions && listOfSuggestions.length > 0)) && (
            <div className="flex items-center gap-2">
              {/* Rating display */}
              {rating && (
                <div
                  className={cn(
                    "text-xs px-2 py-1 rounded-full border font-medium flex items-center gap-1",
                    getRatingColor(rating)
                  )}
                >
                  <span className="text-xs">⭐</span>
                  <span>{rating}/10</span>
                </div>
              )}

              {/* Suggestions toggle button */}
              {listOfSuggestions && listOfSuggestions.length > 0 && (
                <button
                  onClick={() => setShowSuggestions(!showSuggestions)}
                  className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-200 transition-colors flex items-center gap-1 font-medium"
                >
                  <span>💡</span>
                  <span>{listOfSuggestions.length} suggestions</span>
                  <span
                    className={cn(
                      "transition-transform",
                      showSuggestions ? "rotate-180" : ""
                    )}
                  >
                    ▼
                  </span>
                </button>
              )}
            </div>
          )}

        {/* Collapsible Suggestions */}
        {isHuman &&
          showSuggestions &&
          listOfSuggestions &&
          listOfSuggestions.length > 0 && (
            <div className="w-full max-w-[85%] sm:max-w-[80%] md:max-w-[70%] animate-in slide-in-from-top-2 duration-200">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
                <div className="text-xs font-medium text-blue-900 mb-2">
                  Alternative responses:
                </div>
                <div className="space-y-2">
                  {listOfSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="text-xs p-2 rounded bg-white border border-blue-100 text-blue-900 leading-relaxed hover:border-blue-300 transition-colors cursor-pointer"
                    >
                      {suggestion.Response}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}

export { MessageArea };
