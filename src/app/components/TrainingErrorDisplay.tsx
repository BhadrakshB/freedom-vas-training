"use client";

import React from 'react';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { AppError } from '@/lib/error-handling';
import { TrainingErrorHandler } from '@/lib/training-error-handler';
import { AlertTriangle, RefreshCw, X, RotateCcw } from 'lucide-react';

interface TrainingErrorDisplayProps {
  error?: AppError;
  errorHandler: TrainingErrorHandler;
  onSessionRestart?: () => void;
  className?: string;
}

export const TrainingErrorDisplay: React.FC<TrainingErrorDisplayProps> = ({
  error,
  errorHandler,
  onSessionRestart,
  className = '',
}) => {
  if (!error) {
    return null;
  }

  const retryInfo = errorHandler.getRetryInfo();
  const errorMessage = errorHandler.getErrorMessage(error);

  const handleRetry = async () => {
    try {
      await errorHandler.retryLastAction();
    } catch (retryError) {
      // Error is already handled by the error handler
      console.error('Training retry failed:', retryError);
    }
  };

  const handleDismiss = () => {
    errorHandler.clearError();
  };

  const handleSessionRestart = () => {
    errorHandler.clearError();
    onSessionRestart?.();
  };

  // Show session restart option for critical errors or when retries are exhausted
  const showSessionRestart = (error.severity === 'critical' || !retryInfo.canRetry) && onSessionRestart;

  return (
    <Alert 
      variant={error.severity === 'high' || error.severity === 'critical' ? 'destructive' : 'default'}
      className={`training-error-display ${className}`}
    >
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex-1">
          <p className="font-medium">Training Session Error</p>
          <p className="text-sm">{errorMessage}</p>
          {retryInfo.count > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Retry attempt {retryInfo.count} of {retryInfo.max}
            </p>
          )}
          {error.context?.sessionId && typeof error.context.sessionId === 'string' ? (
            <p className="text-xs text-muted-foreground mt-1">
              Session: {error.context.sessionId}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-2 ml-4">
          {retryInfo.canRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              className="h-8 px-2"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          )}
          {showSessionRestart && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSessionRestart}
              className="h-8 px-2"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Restart Session
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-8 w-8 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default TrainingErrorDisplay;