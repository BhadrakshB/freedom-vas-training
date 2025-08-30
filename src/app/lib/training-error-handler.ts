import { AppError, classifyError, isRetryableError, ERROR_MESSAGES } from './error-handling';

export interface TrainingErrorHandler {
  handleError: (error: unknown) => AppError;
  retryLastAction: () => Promise<void>;
  clearError: () => void;
  isRetryable: (error: AppError) => boolean;
  getErrorMessage: (error: AppError) => string;
  setLastAction: (action: () => Promise<void>) => void;
  setSessionId: (sessionId?: string) => void;
  getCurrentError: () => AppError | undefined;
  getRetryInfo: () => { count: number; max: number; canRetry: boolean };
}

export interface TrainingErrorState {
  currentError?: AppError;
  lastAction?: () => Promise<void>;
  retryCount: number;
  maxRetries: number;
  sessionId?: string;
}

export class TrainingErrorHandlerImpl implements TrainingErrorHandler {
  private state: TrainingErrorState = {
    retryCount: 0,
    maxRetries: 3,
  };

  private onErrorChange?: (error?: AppError) => void;

  constructor(onErrorChange?: (error?: AppError) => void) {
    this.onErrorChange = onErrorChange;
  }

  handleError = (error: unknown): AppError => {
    const appError = this.classifyTrainingError(error);
    this.state.currentError = appError;
    this.onErrorChange?.(appError);
    
    // Log error for debugging (in development)
    if (process.env.NODE_ENV === 'development') {
      console.error('[TrainingErrorHandler]', appError);
    }

    return appError;
  };

  retryLastAction = async (): Promise<void> => {
    if (!this.state.lastAction) {
      throw new Error('No action to retry');
    }

    if (this.state.retryCount >= this.state.maxRetries) {
      const maxRetriesError: AppError = {
        type: 'client',
        severity: 'high',
        message: 'Maximum retry attempts reached. Please restart the training session.',
        timestamp: new Date(),
      };
      this.handleError(maxRetriesError);
      return;
    }

    try {
      this.state.retryCount++;
      await this.state.lastAction();
      // Success - reset retry count and clear error
      this.state.retryCount = 0;
      this.clearError();
    } catch (error) {
      this.handleError(error);
    }
  };

  clearError = (): void => {
    this.state.currentError = undefined;
    this.state.retryCount = 0;
    this.onErrorChange?.(undefined);
  };

  isRetryable = (error: AppError): boolean => {
    return isRetryableError(error) && this.state.retryCount < this.state.maxRetries;
  };

  getErrorMessage = (error: AppError): string => {
    // Training-specific error messages
    switch (error.type) {
      case 'network':
        return 'Unable to connect to training server. Please check your connection.';
      case 'server':
        return 'Training server is temporarily unavailable. Please try again later.';
      case 'validation':
        return 'Invalid training session data. Please restart the session.';
      case 'authentication':
        return 'Training session authentication failed. Please restart the session.';
      default:
        return error.message || ERROR_MESSAGES.SESSION_ERROR;
    }
  };

  // Set the last action for retry functionality
  setLastAction = (action: () => Promise<void>): void => {
    this.state.lastAction = action;
    this.state.retryCount = 0; // Reset retry count when setting new action
  };

  // Set current session ID for context
  setSessionId = (sessionId?: string): void => {
    this.state.sessionId = sessionId;
  };

  // Get current error state
  getCurrentError = (): AppError | undefined => {
    return this.state.currentError;
  };

  // Get retry information
  getRetryInfo = (): { count: number; max: number; canRetry: boolean } => {
    return {
      count: this.state.retryCount,
      max: this.state.maxRetries,
      canRetry: this.state.currentError ? this.isRetryable(this.state.currentError) : false,
    };
  };

  // Training-specific error recovery
  recoverSession = async (): Promise<void> => {
    if (!this.state.sessionId) {
      throw new Error('No session ID available for recovery');
    }

    try {
      // Clear current error state
      this.clearError();
      
      // Attempt to recover the session (this would typically involve
      // checking session status and potentially restarting if needed)
      // For now, we'll just clear the error and let the caller handle recovery
      
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  };

  private classifyTrainingError = (error: unknown): AppError => {
    const baseError = classifyError(error);
    
    // Add training-specific context
    return {
      ...baseError,
      context: {
        ...baseError.context,
        source: 'training',
        component: 'TrainingPanel',
        sessionId: this.state.sessionId,
      },
    };
  };
}

// Factory function to create training error handler
export const createTrainingErrorHandler = (
  onErrorChange?: (error?: AppError) => void
): TrainingErrorHandler => {
  return new TrainingErrorHandlerImpl(onErrorChange);
};

// Hook-like function for React components
export const useTrainingErrorHandler = (
  onErrorChange?: (error?: AppError) => void
): TrainingErrorHandler => {
  // In a real implementation, this would use useMemo or useRef to maintain instance
  // For now, creating new instance (could be optimized)
  return createTrainingErrorHandler(onErrorChange);
};