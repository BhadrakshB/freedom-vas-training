"use client";

import React from 'react';
import { MessageCircleIcon, SendIcon } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { useChatLoading, type ChatLoadingType } from '@/app/contexts/ChatLoadingContext';

interface ChatLoadingIndicatorProps {
  className?: string;
}

const ChatLoadingIndicator: React.FC<ChatLoadingIndicatorProps> = ({ className }) => {
  const { isLoading, loadingMessage, state } = useChatLoading();

  if (!isLoading) return null;

  const getLoadingIcon = (type?: ChatLoadingType) => {
    switch (type) {
      case 'message-send':
        return <SendIcon className="h-4 w-4" />;
      case 'conversation-load':
        return <MessageCircleIcon className="h-4 w-4" />;
      default:
        return <MessageCircleIcon className="h-4 w-4" />;
    }
  };

  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800",
      className
    )}>
      {/* Animated icon */}
      <div className="flex-shrink-0">
        <div className="relative">
          {/* Pulsing background circle */}
          <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping" />
          {/* Icon container */}
          <div className="relative bg-blue-500 text-white rounded-full p-2 animate-pulse">
            {getLoadingIcon(state.type)}
          </div>
        </div>
      </div>

      {/* Loading content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
            {loadingMessage}
          </span>
          {/* Animated dots */}
          <div className="flex gap-1">
            <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
        
        {/* Loading bar animation */}
        <div className="mt-2 w-full bg-blue-200 dark:bg-blue-800 rounded-full h-1 overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{
            width: '60%',
            animation: 'loading-slide 2s ease-in-out infinite'
          }} />
        </div>
      </div>

      <style jsx>{`
        @keyframes loading-slide {
          0% { transform: translateX(-100%); width: 30%; }
          50% { transform: translateX(0%); width: 60%; }
          100% { transform: translateX(100%); width: 30%; }
        }
      `}</style>
    </div>
  );
};

export { ChatLoadingIndicator };