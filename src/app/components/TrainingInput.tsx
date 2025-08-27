"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Skeleton } from './ui/skeleton';

interface TrainingInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  loading?: boolean;
  placeholder?: string;
  className?: string;
}

export const TrainingInput: React.FC<TrainingInputProps> = ({
  onSendMessage,
  disabled = false,
  loading = false,
  placeholder = "Type your response...",
  className = ""
}) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || disabled || loading) return;
    
    onSendMessage(message.trim());
    setMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const isSubmitDisabled = !message.trim() || disabled || loading;

  return (
    <div className={`p-4 border-t bg-background ${className}`}>
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Character count and tips */}
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <span>
            {message.length > 0 && `${message.length} characters`}
          </span>
          <span>
            Press Enter to send, Shift+Enter for new line
          </span>
        </div>

        {/* Input area */}
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="resize-none pr-12"
            rows={1}
            style={{ minHeight: '44px', maxHeight: '120px' }}
          />
          
          {/* Send button */}
          <Button
            type="submit"
            disabled={isSubmitDisabled}
            variant="ghost"
            size="icon"
            className="absolute right-2 bottom-2 h-8 w-8"
            title={loading ? "Sending..." : "Send message"}
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </Button>
        </div>

        {/* Quick actions */}
        {!disabled && !loading && (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setMessage("I understand. Let me help you with that.")}
              className="text-xs"
              disabled={loading}
            >
              Acknowledge
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setMessage("Could you please provide more details about your concern?")}
              className="text-xs"
              disabled={loading}
            >
              Ask for details
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setMessage("Let me check our policy on this and get back to you.")}
              className="text-xs"
              disabled={loading}
            >
              Check policy
            </Button>
          </div>
        )}

        {/* Loading state for quick actions */}
        {loading && (
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-20" />
          </div>
        )}

        {/* Status messages */}
        {disabled && (
          <div className="text-center text-sm text-muted-foreground">
            {placeholder}
          </div>
        )}
      </form>
    </div>
  );
};