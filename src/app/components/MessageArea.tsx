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
  const [showTooltip, setShowTooltip] = React.useState(false);

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
            <div className="flex items-center gap-2">
              {/* Always visible rating */}
              {rating !== undefined && (
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
              )}

              {/* Suggestions Hover Indicator */}
              {listOfSuggestions && listOfSuggestions.length > 0 && (
                <div
                  className="relative"
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                >
                  <div className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-200 transition-colors cursor-pointer flex items-center gap-1 font-medium">
                    <span>💡</span>
                    <span>{listOfSuggestions.length} suggestions</span>
                  </div>

                  {/* Hover Tooltip */}
                  {showTooltip && (
                    <div className="absolute top-full right-0 mt-2 w-96 max-w-[90vw] z-50 animate-in fade-in-0 zoom-in-95 duration-200">
                      <div className="bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                        {/* Blue Header */}
                        <div className="px-4 py-3 bg-blue-100 border-b border-blue-200">
                          <div className="text-sm font-medium text-blue-700 flex items-center gap-2">
                            <span className="text-blue-600">💡</span>
                            <span>Alternate Responses</span>
                          </div>
                        </div>

                        {/* Suggestions List */}
                        <div className="p-4 space-y-3">
                          {listOfSuggestions.map((suggestion, index) => (
                            <div
                              key={index}
                              className="relative pl-4 py-2 text-sm text-gray-700 leading-relaxed bg-gray-50 rounded border border-gray-100"
                            >
                              {/* Blue accent bar */}
                              <div className="absolute left-0 top-2 bottom-2 w-1 bg-blue-400 rounded-full"></div>
                              {suggestion.Response}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Tooltip Arrow */}
                      <div className="absolute bottom-full right-4 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[6px] border-l-transparent border-r-transparent border-b-gray-200"></div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
      </div>
    </div>
  );
}

export { MessageArea };
