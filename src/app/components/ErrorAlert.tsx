"use client";

import React from 'react';
import { Alert, AlertDescription, AlertTitle, Button } from './ui';
import { AppError, getErrorVariant, getErrorIcon, isRetryableError } from '../lib/error-handling';

interface ErrorAlertProps {
  error: AppError | string | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
  showDetails?: boolean;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  error,
  onRetry,
  onDismiss,
  className = "",
  showDetails = false
}) => {
  if (!error) return null;

  // Handle string errors
  const appError: AppError = typeof error === 'string' 
    ? {
        type: 'unknown',
        severity: 'medium',
        message: error,
        timestamp: new Date()
      }
    : error;

  const variant = getErrorVariant(appError.severity);
  const icon = getErrorIcon(appError.type);
  const canRetry = isRetryableError(appError) && onRetry;

  return (
    <Alert variant={variant} className={className}>
      <div className="flex items-start gap-3">
        <span className="text-lg flex-shrink-0 mt-0.5">{icon}</span>
        <div className="flex-1 min-w-0">
          <AlertTitle className="mb-1">
            {appError.type === 'network' && 'Connection Error'}
            {appError.type === 'server' && 'Server Error'}
            {appError.type === 'validation' && 'Validation Error'}
            {appError.type === 'authentication' && 'Authentication Error'}
            {appError.type === 'client' && 'Application Error'}
            {appError.type === 'unknown' && 'Error'}
          </AlertTitle>
          <AlertDescription>
            <div className="space-y-2">
              <p>{appError.message}</p>
              
              {showDetails && appError.details && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    Technical Details
                  </summary>
                  <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                    {appError.details}
                  </pre>
                </details>
              )}

              {appError.code && (
                <p className="text-xs text-muted-foreground">
                  Error Code: {appError.code}
                </p>
              )}
            </div>
          </AlertDescription>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          {canRetry && (
            <Button
              onClick={onRetry}
              variant="outline"
              size="sm"
            >
              Retry
            </Button>
          )}
          {onDismiss && (
            <Button
              onClick={onDismiss}
              variant="ghost"
              size="sm"
            >
              ✕
            </Button>
          )}
        </div>
      </div>
    </Alert>
  );
};

// Specialized error alert components
export const NetworkErrorAlert: React.FC<Omit<ErrorAlertProps, 'error'> & { message?: string }> = ({
  message = "Unable to connect to the server. Please check your internet connection.",
  ...props
}) => (
  <ErrorAlert
    error={{
      type: 'network',
      severity: 'high',
      message,
      timestamp: new Date()
    }}
    {...props}
  />
);

export const ValidationErrorAlert: React.FC<Omit<ErrorAlertProps, 'error'> & { message?: string }> = ({
  message = "Please check your input and try again.",
  ...props
}) => (
  <ErrorAlert
    error={{
      type: 'validation',
      severity: 'medium',
      message,
      timestamp: new Date()
    }}
    {...props}
  />
);

export const ServerErrorAlert: React.FC<Omit<ErrorAlertProps, 'error'> & { message?: string }> = ({
  message = "Server is temporarily unavailable. Please try again later.",
  ...props
}) => (
  <ErrorAlert
    error={{
      type: 'server',
      severity: 'high',
      message,
      timestamp: new Date()
    }}
    {...props}
  />
);