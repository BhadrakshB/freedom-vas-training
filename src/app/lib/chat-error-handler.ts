import { AppError, classifyError, isRetryableError, ERROR_MESSAGES } from './error-handling';

export interface ChatErrorHandler {
  handleError: (error: unknown) => AppError;
  retryLastAction: () => Promise<void>;
  clearError: () => void;
  isRetryable: (error: AppError) => boolean;
  getErrorMessage: (error: AppError) => string;
  setLastAction: (action: () => Promise<void>) => void;
  getCurrentError: () => AppError | undefined;
  getRetryInfo: () => { count: number; max: number; canRetry: boolean };
}

export interface ChatErrorState {
  currentError?: AppError;
  lastAction?: () => Promise<void>;
  retryCount: number;
  maxRetries: number;
}

export class ChatErrorHandlerImpl implements ChatErrorHandler {
  private state: ChatErrorState = {
    retryCount: 0,
    maxRetries: 3,
  };

  private onErrorChange?: (error?: AppError) => void;

  constructor(onErrorChange?: (error?: AppError) => void) {
    this.onErrorChange = onErrorChange;
  }

  handleError = (error: unknown): AppError => {
    const appError = this.classifyChatError(error);
    this.state.currentError = appError;
    this.onErrorChange?.(appError);
    
    // Log error for debugging (in development)
    if (process.env.NODE_ENV === 'development') {
      console.error('[ChatErrorHandler]', appError);
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
        message: 'Maximum retry attempts reached. Please try again later.',
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
    // Chat-specific error messages
    switch (error.type) {
      case 'network':
        return ERROR_MESSAGES.NETWORK_ERROR;
      case 'server':
        return ERROR_MESSAGES.SERVER_ERROR;
      case 'validation':
        return ERROR_MESSAGES.VALIDATION_ERROR;
      default:
        return error.message || ERROR_MESSAGES.CHAT_ERROR;
    }
  };

  // Set the last action for retry functionality
  setLastAction = (action: () => Promise<void>): void => {
    this.state.lastAction = action;
    this.state.retryCount = 0; // Reset retry count when setting new action
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

  private classifyChatError = (error: unknown): AppError => {
    const baseError = classifyError(error);
    
    // Add chat-specific context
    return {
      ...baseError,
      context: {
        ...baseError.context,
        source: 'chat',
        component: 'ChatInterface',
      },
    };
  };
}

// Factory function to create chat error handler
export const createChatErrorHandler = (
  onErrorChange?: (error?: AppError) => void
): ChatErrorHandler => {
  return new ChatErrorHandlerImpl(onErrorChange);
};

// Hook-like function for React components
export const useChatErrorHandler = (
  onErrorChange?: (error?: AppError) => void
): ChatErrorHandler => {
  // In a real implementation, this would use useMemo or useRef to maintain instance
  // For now, creating new instance (could be optimized)
  return createChatErrorHandler(onErrorChange);
};