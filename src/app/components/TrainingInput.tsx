"use client";

import React, { useState, useRef, useEffect } from 'react';

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
    <div className={`p-4 border-t border-gray-100 bg-gray-50 ${className}`}>
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Character count and tips */}
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>
            {message.length > 0 && `${message.length} characters`}
          </span>
          <span>
            Press Enter to send, Shift+Enter for new line
          </span>
        </div>

        {/* Input area */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className={`w-full p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
              disabled 
                ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                : 'bg-white'
            }`}
            rows={1}
            style={{ minHeight: '44px', maxHeight: '120px' }}
          />
          
          {/* Send button */}
          <button
            type="submit"
            disabled={isSubmitDisabled}
            className={`absolute right-2 bottom-2 p-2 rounded-md transition-colors ${
              isSubmitDisabled
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-blue-600 hover:bg-blue-50'
            }`}
            title="Send message"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>

        {/* Quick actions */}
        {!disabled && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMessage("I understand. Let me help you with that.")}
              className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
            >
              Acknowledge
            </button>
            <button
              type="button"
              onClick={() => setMessage("Could you please provide more details about your concern?")}
              className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
            >
              Ask for details
            </button>
            <button
              type="button"
              onClick={() => setMessage("Let me check our policy on this and get back to you.")}
              className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
            >
              Check policy
            </button>
          </div>
        )}

        {/* Status messages */}
        {disabled && (
          <div className="text-center text-sm text-gray-500">
            {placeholder}
          </div>
        )}
      </form>
    </div>
  );
};