"use client";

import * as React from "react";
import { Send, Sparkles } from "lucide-react";
import { Button, Textarea } from "./ui";
import { cn } from "@/app/lib/utils";

interface MessageInputProps {
  onSendMessage?: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

function ThinkingAnimation() {
  return (
    <div className="flex items-center justify-center gap-3 px-4 py-3 bg-muted/50 rounded-lg border border-border/50 w-full">
      <Sparkles className="h-5 w-5 text-primary animate-pulse" />
      <div className="flex items-center gap-1.5">
        <span className="text-sm text-muted-foreground">AI is thinking</span>
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0ms]" />
          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:150ms]" />
          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

export function MessageInput({
  onSendMessage,
  disabled = false,
  placeholder = "Type your message...",
  className,
}: MessageInputProps) {
  const [message, setMessage] = React.useState("");
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on content
  const adjustTextareaHeight = React.useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, []);

  React.useEffect(() => {
    adjustTextareaHeight();
  }, [message, adjustTextareaHeight]);

  const handleSendMessage = React.useCallback(() => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && onSendMessage && !disabled) {
      onSendMessage(trimmedMessage);
      setMessage("");
    }
  }, [message, onSendMessage, disabled]);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage]
  );

  const handleInputChange = React.useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setMessage(e.target.value);
    },
    []
  );

  const isMessageEmpty = message.trim().length === 0;

  return (
    <div
      className={cn(
        "flex items-end gap-2 sm:gap-3 p-3 sm:p-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className
      )}
    >
      <div className="flex-1 relative max-w-4xl mx-auto w-full flex items-end gap-2 sm:gap-3">
        {disabled ? (
          <ThinkingAnimation />
        ) : (
          <>
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={message}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled}
                className="min-h-[44px] max-h-[120px] sm:max-h-[200px] resize-none text-sm sm:text-base"
                rows={1}
                aria-label="Message input"
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={disabled || isMessageEmpty}
              size="icon"
              className="h-[44px] w-[44px] shrink-0"
              aria-label="Send message"
              title="Send message (Enter)"
            >
              <Send className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
