'use client';

import * as React from 'react';
import { RefreshCw, Play, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from './ui';
import { cn } from '../lib/utils';
import { TrainingStateType } from '../lib/agents/v2/graph_v2';

interface CompletionFooterProps {
  status: TrainingStateType;
  onStartNewSession: () => void;
  onRetry?: () => void;
  className?: string;
}

export function CompletionFooter({
  status,
  onStartNewSession,
  onRetry,
  className
}: CompletionFooterProps) {
  const isCompleted = status === 'completed';
  const isError = status === 'error';

  if (!isCompleted && !isError) {
    return null;
  }

  return (
    <div className={cn(
      "flex items-center justify-center gap-3 p-4 sm:p-6 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      className
    )}>
      <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 max-w-2xl w-full">
        {/* Status Icon and Message */}
        <div className="flex items-center gap-2 text-center sm:text-left">
          {isCompleted && (
            <>
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
              <span className="text-sm font-medium text-green-700 dark:text-green-300">
                Training session completed successfully!
              </span>
            </>
          )}
          {isError && (
            <>
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
              <span className="text-sm font-medium text-red-700 dark:text-red-300">
                Training session encountered an error
              </span>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:ml-auto">
          {isError && onRetry && (
            <Button
              onClick={onRetry}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          )}
          
          <Button
            onClick={onStartNewSession}
            variant={isCompleted ? "default" : "secondary"}
            size="sm"
            className="gap-2"
          >
            <Play className="h-4 w-4" />
            Start New Training Session
          </Button>
        </div>
      </div>
    </div>
  );
}