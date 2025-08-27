// Centralized error handling utilities

export type ErrorType = 'network' | 'validation' | 'authentication' | 'server' | 'client' | 'unknown';
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface AppError {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  details?: string;
  code?: string;
  timestamp: Date;
  context?: Record<string, unknown>;
}

export class TrainingError extends Error {
  public readonly type: ErrorType;
  public readonly severity: ErrorSeverity;
  public readonly code?: string;
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    type: ErrorType = 'unknown',
    severity: ErrorSeverity = 'medium',
    code?: string,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'TrainingError';
    this.type = type;
    this.severity = severity;
    this.code = code;
    this.context = context;
  }

  toAppError(): AppError {
    return {
      type: this.type,
      severity: this.severity,
      message: this.message,
      details: this.stack,
      code: this.code,
      timestamp: new Date(),
      context: this.context
    };
  }
}

// Error classification helpers
export const classifyError = (error: unknown): AppError => {
  if (error instanceof TrainingError) {
    return error.toAppError();
  }

  if (error instanceof Error) {
    // Network errors
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return {
        type: 'network',
        severity: 'high',
        message: 'Network connection error. Please check your internet connection.',
        details: error.message,
        timestamp: new Date()
      };
    }

    // Server errors
    if (error.message.includes('500') || error.message.includes('server')) {
      return {
        type: 'server',
        severity: 'high',
        message: 'Server error occurred. Please try again later.',
        details: error.message,
        timestamp: new Date()
      };
    }

    // Validation errors
    if (error.message.includes('validation') || error.message.includes('invalid')) {
      return {
        type: 'validation',
        severity: 'medium',
        message: 'Invalid input provided. Please check your data.',
        details: error.message,
        timestamp: new Date()
      };
    }

    // Authentication errors
    if (error.message.includes('auth') || error.message.includes('unauthorized')) {
      return {
        type: 'authentication',
        severity: 'high',
        message: 'Authentication required. Please log in again.',
        details: error.message,
        timestamp: new Date()
      };
    }

    // Generic error
    return {
      type: 'client',
      severity: 'medium',
      message: error.message || 'An unexpected error occurred.',
      details: error.stack,
      timestamp: new Date()
    };
  }

  // Unknown error type
  return {
    type: 'unknown',
    severity: 'medium',
    message: 'An unknown error occurred.',
    details: String(error),
    timestamp: new Date()
  };
};

// Error message helpers
export const getErrorVariant = (severity: ErrorSeverity): 'default' | 'destructive' => {
  return severity === 'high' || severity === 'critical' ? 'destructive' : 'default';
};

export const getErrorIcon = (type: ErrorType): string => {
  switch (type) {
    case 'network':
      return '🌐';
    case 'server':
      return '🔧';
    case 'validation':
      return '📝';
    case 'authentication':
      return '🔐';
    case 'client':
      return '💻';
    default:
      return '⚠️';
  }
};

export const getRetryableErrors = (): ErrorType[] => {
  return ['network', 'server'];
};

export const isRetryableError = (error: AppError): boolean => {
  return getRetryableErrors().includes(error.type);
};

// Common error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Unable to connect to the server. Please check your internet connection.',
  SERVER_ERROR: 'Server is temporarily unavailable. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SESSION_ERROR: 'Training session error occurred. Please restart the session.',
  CHAT_ERROR: 'Unable to process your message. Please try again.',
  FEEDBACK_ERROR: 'Unable to generate feedback. Please try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.'
} as const;