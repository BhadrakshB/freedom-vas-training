// Error handling utilities for the AI Training Simulator

export const ERROR_MESSAGES = {
  VALIDATION_ERROR: "Invalid input provided. Please check your data and try again.",
  CHAT_ERROR: "I'm having trouble processing your message right now. Please try again in a moment.",
  UNKNOWN_ERROR: "An unexpected error occurred. Please try again.",
  TRAINING_SESSION_ERROR: "Unable to process training session. Please try again.",
  AGENT_ERROR: "AI agent encountered an error. Please retry your request.",
  NETWORK_ERROR: "Network connection issue. Please check your connection and try again.",
  TIMEOUT_ERROR: "Request timed out. Please try again.",
} as const;

export type ErrorType =
  | 'validation'
  | 'network'
  | 'timeout'
  | 'agent'
  | 'session'
  | 'unknown';

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export class TrainingError extends Error {
  public readonly type: ErrorType;
  public readonly severity: ErrorSeverity;
  public readonly code?: string;
  public readonly details?: Record<string, any>;
  public readonly timestamp: Date;

  constructor(
    message: string,
    type: ErrorType = 'unknown',
    severity: ErrorSeverity = 'medium',
    code?: string,
    details?: Record<string, any>
  ) {
    super(message);
    this.name = 'TrainingError';
    this.type = type;
    this.severity = severity;
    this.code = code;
    this.details = details;
    this.timestamp = new Date();

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TrainingError);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      severity: this.severity,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack,
    };
  }
}

export function isTrainingError(error: unknown): error is TrainingError {
  return error instanceof TrainingError;
}

export function createTrainingError(
  message: string,
  type: ErrorType = 'unknown',
  severity: ErrorSeverity = 'medium',
  code?: string,
  details?: Record<string, any>
): TrainingError {
  return new TrainingError(message, type, severity, code, details);
}

export function handleTrainingError(error: unknown): TrainingError {
  if (isTrainingError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new TrainingError(
      error.message,
      'unknown',
      'medium',
      undefined,
      { originalError: error.name }
    );
  }

  return new TrainingError(
    ERROR_MESSAGES.UNKNOWN_ERROR,
    'unknown',
    'medium',
    'UNKNOWN_ERROR_TYPE'
  );
}

// Alias for backward compatibility
export const AppError = TrainingError;

export function classifyError(error: unknown): ErrorType {
  if (isTrainingError(error)) {
    return error.type;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes('network') || message.includes('fetch')) {
      return 'network';
    }
    if (message.includes('timeout')) {
      return 'timeout';
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return 'validation';
    }
  }

  return 'unknown';
}