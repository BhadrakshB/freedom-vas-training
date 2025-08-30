/**
 * Manual verification test for isolated error handlers
 * This file provides functions to manually test error handling isolation
 */

import { createChatErrorHandler } from './chat-error-handler';
import { createTrainingErrorHandler } from './training-error-handler';
import { AppError } from './error-handling';

// Test function to verify chat error handler isolation
export const testChatErrorHandler = () => {
  console.log('=== Testing Chat Error Handler ===');
  
  let capturedError: AppError | undefined;
  const chatErrorHandler = createChatErrorHandler((error) => {
    capturedError = error;
    console.log('Chat error captured:', error?.message);
  });

  // Test error handling
  const testError = new Error('Test chat network error');
  const appError = chatErrorHandler.handleError(testError);
  
  console.log('Chat error handled:', appError);
  console.log('Chat error context:', appError.context);
  console.log('Captured error matches:', capturedError?.message === appError.message);
  
  // Test retry functionality
  let retryCount = 0;
  chatErrorHandler.setLastAction(async () => {
    retryCount++;
    console.log(`Chat retry attempt ${retryCount}`);
    if (retryCount < 2) {
      throw new Error('Retry failed');
    }
    console.log('Chat retry succeeded');
  });

  console.log('Chat retry info:', chatErrorHandler.getRetryInfo());
  
  return {
    errorHandler: chatErrorHandler,
    appError,
    capturedError
  };
};

// Test function to verify training error handler isolation
export const testTrainingErrorHandler = () => {
  console.log('=== Testing Training Error Handler ===');
  
  let capturedError: AppError | undefined;
  const trainingErrorHandler = createTrainingErrorHandler((error) => {
    capturedError = error;
    console.log('Training error captured:', error?.message);
  });

  // Set session ID for context
  trainingErrorHandler.setSessionId('test-session-123');

  // Test error handling
  const testError = new Error('Test training session error');
  const appError = trainingErrorHandler.handleError(testError);
  
  console.log('Training error handled:', appError);
  console.log('Training error context:', appError.context);
  console.log('Session ID in context:', appError.context?.sessionId);
  console.log('Captured error matches:', capturedError?.message === appError.message);
  
  // Test retry functionality
  let retryCount = 0;
  trainingErrorHandler.setLastAction(async () => {
    retryCount++;
    console.log(`Training retry attempt ${retryCount}`);
    if (retryCount < 2) {
      throw new Error('Training retry failed');
    }
    console.log('Training retry succeeded');
  });

  console.log('Training retry info:', trainingErrorHandler.getRetryInfo());
  
  return {
    errorHandler: trainingErrorHandler,
    appError,
    capturedError
  };
};

// Test function to verify error handler isolation
export const testErrorHandlerIsolation = () => {
  console.log('=== Testing Error Handler Isolation ===');
  
  const chatResult = testChatErrorHandler();
  const trainingResult = testTrainingErrorHandler();
  
  // Verify isolation
  const chatContext = chatResult.appError.context;
  const trainingContext = trainingResult.appError.context;
  
  console.log('Chat error source:', chatContext?.source);
  console.log('Training error source:', trainingContext?.source);
  console.log('Chat error component:', chatContext?.component);
  console.log('Training error component:', trainingContext?.component);
  
  const isIsolated = 
    chatContext?.source === 'chat' &&
    trainingContext?.source === 'training' &&
    chatContext?.component === 'ChatInterface' &&
    trainingContext?.component === 'TrainingPanel' &&
    !chatContext?.sessionId &&
    trainingContext?.sessionId === 'test-session-123';
  
  console.log('Error handlers are properly isolated:', isIsolated);
  
  return {
    isIsolated,
    chatResult,
    trainingResult
  };
};

// Manual test runner (call this in browser console)
export const runErrorHandlerTests = () => {
  console.log('Starting error handler isolation tests...');
  
  try {
    const result = testErrorHandlerIsolation();
    console.log('Test completed successfully:', result.isIsolated);
    return result;
  } catch (error) {
    console.error('Test failed:', error);
    return { error };
  }
};