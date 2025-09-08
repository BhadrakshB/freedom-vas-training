"use client";

import * as React from "react";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { cn } from "@/app/lib/utils";
import { BaseMessage, HumanMessage } from "@langchain/core/messages";

interface MessageAreaProps {
  messages: BaseMessage[];
  className?: string;
}

function MessageArea({ messages, className }: MessageAreaProps) {
  return (
    <ScrollArea className={cn("flex-1 p-3 sm:p-4 md:p-6", className)}>
      <div className="space-y-3 sm:space-y-4 max-w-4xl mx-auto">
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          <MessageList messages={messages} />
        )}
      </div>
    </ScrollArea>
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
  const isHuman = message instanceof HumanMessage;
  return (
    <div
      className={cn("flex w-full", isHuman ? "justify-end" : "justify-start")}
    >
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
        {/* <div className={cn(
          "text-xs mt-1 opacity-70",
          isHuman ? "text-primary-foreground/70" : "text-muted-foreground/70"
        )}>
          {message..toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div> */}
      </div>
    </div>
  );
}

export { MessageArea };
