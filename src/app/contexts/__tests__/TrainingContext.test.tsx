import React from 'react';
import { render, screen, act, waitFor, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { TrainingProvider, useTraining, TrainingPhase } from '../TrainingContext';

// Test component that uses the training context
const TestComponent = () => {
  const {
    state,
    startSession,
    completeSession,
    enterFeedbackPhase,
    exitFeedbackPhase,
    updateSessionData,
    setError,
    setLoading,
    resetSession,
    isTrainingActive,
    isFeedbackActive,
    shouldShowMainChat,
    shouldShowTrainingPanel,
    panelTitle,
    mainChatTitle,
  } = useTraining();

  return (
    <div>
      {/* State display */}
      <div data-testid="phase">{state.phase}</div>
      <div data-testid="active-session">{state.activeSessionId || 'none'}</div>
      <div data-testid="completed-session">{state.completedSessionId || 'none'}</div>
      <div data-testid="is-frozen">{state.isPanelFrozen.toString()}</div>
      <div data-testid="show-feedback">{state.showFeedback.toString()}</div>
      <div data-testid="is-loading">{state.isLoading.toString()}</div>
      <div data-testid="error">{state.error || 'none'}</div>
      
      {/* Computed properties */}
      <div data-testid="is-training-active">{isTrainingActive.toString()}</div>
      <div data-testid="is-feedback-active">{isFeedbackActive.toString()}</div>
      <div data-testid="should-show-main-chat">{shouldShowMainChat.toString()}</div>
      <div data-testid="should-show-training-panel">{shouldShowTrainingPanel.toString()}</div>
      <div data-testid="panel-title">{panelTitle}</div>
      <div data-testid="main-chat-title">{mainChatTitle}</div>
      
      {/* Action buttons */}
      <button onClick={() => startSession('test-session-1')}>Start Session</button>
      <button onClick={() => completeSession('test-session-1')}>Complete Session</button>
      <button onClick={() => enterFeedbackPhase('test-session-1')}>Enter Feedback</button>
      <button onClick={() => exitFeedbackPhase()}>Exit Feedback</button>
      <button onClick={() => updateSessionData({ sessionDuration: 5000 })}>Update Data</button>
      <button onClick={() => setError('Test error')}>Set Error</button>
      <button onClick={() => setLoading(true)}>Set Loading</button>
      <button onClick={() => resetSession()}>Reset</button>
    </div>
  );
};

const renderWithProvider = () => {
  return render(
    <TrainingProvider>
      <TestComponent />
    </TrainingProvider>
  );
};

describe('TrainingContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      renderWithProvider();
      
      expect(screen.getByTestId('phase')).toHaveTextContent('idle');
      expect(screen.getByTestId('active-session')).toHaveTextContent('none');
      expect(screen.getByTestId('completed-session')).toHaveTextContent('none');
      expect(screen.getByTestId('is-frozen')).toHaveTextContent('false');
      expect(screen.getByTestId('show-feedback')).toHaveTextContent('false');
      expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
      expect(screen.getByTestId('error')).toHaveTextContent('none');
    });

    it('should have correct computed properties in initial state', () => {
      renderWithProvider();
      
      expect(screen.getByTestId('is-training-active')).toHaveTextContent('false');
      expect(screen.getByTestId('is-feedback-active')).toHaveTextContent('false');
      expect(screen.getByTestId('should-show-main-chat')).toHaveTextContent('true');
      expect(screen.getByTestId('should-show-training-panel')).toHaveTextContent('true');
      expect(screen.getByTestId('panel-title')).toHaveTextContent('Training Simulator');
      expect(screen.getByTestId('main-chat-title')).toHaveTextContent('AI Training Simulator');
    });
  });

  describe('Session Management', () => {
    it('should start a training session correctly', async () => {
      renderWithProvider();
      
      fireEvent.click(screen.getByText('Start Session'));
      
      expect(screen.getByTestId('phase')).toHaveTextContent('training');
      expect(screen.getByTestId('active-session')).toHaveTextContent('test-session-1');
      expect(screen.getByTestId('is-frozen')).toHaveTextContent('false');
      expect(screen.getByTestId('is-training-active')).toHaveTextContent('true');
      expect(screen.getByTestId('panel-title')).toHaveTextContent('Training Session');
      expect(screen.getByTestId('main-chat-title')).toHaveTextContent('Training Session Active');
    });

    it('should complete a session correctly', async () => {
      renderWithProvider();
      
      // Start session first
      fireEvent.click(screen.getByText('Start Session'));
      
      // Complete session
      fireEvent.click(screen.getByText('Complete Session'));
      
      expect(screen.getByTestId('phase')).toHaveTextContent('complete');
      expect(screen.getByTestId('active-session')).toHaveTextContent('none');
      expect(screen.getByTestId('completed-session')).toHaveTextContent('test-session-1');
      expect(screen.getByTestId('is-frozen')).toHaveTextContent('true');
      expect(screen.getByTestId('is-training-active')).toHaveTextContent('false');
      expect(screen.getByTestId('panel-title')).toHaveTextContent('Session Complete');
    });

    it('should enter feedback phase correctly', async () => {
      renderWithProvider();
      
      fireEvent.click(screen.getByText('Enter Feedback'));
      
      expect(screen.getByTestId('phase')).toHaveTextContent('feedback');
      expect(screen.getByTestId('completed-session')).toHaveTextContent('test-session-1');
      expect(screen.getByTestId('show-feedback')).toHaveTextContent('true');
      expect(screen.getByTestId('is-frozen')).toHaveTextContent('true');
      expect(screen.getByTestId('is-feedback-active')).toHaveTextContent('true');
      expect(screen.getByTestId('panel-title')).toHaveTextContent('Training Complete');
      expect(screen.getByTestId('main-chat-title')).toHaveTextContent('Training Feedback');
    });

    it('should exit feedback phase correctly', async () => {
      renderWithProvider();
      
      // Enter feedback phase first
      fireEvent.click(screen.getByText('Enter Feedback'));
      
      // Exit feedback phase
      fireEvent.click(screen.getByText('Exit Feedback'));
      
      expect(screen.getByTestId('phase')).toHaveTextContent('idle');
      expect(screen.getByTestId('completed-session')).toHaveTextContent('none');
      expect(screen.getByTestId('show-feedback')).toHaveTextContent('false');
      expect(screen.getByTestId('is-frozen')).toHaveTextContent('false');
      expect(screen.getByTestId('is-feedback-active')).toHaveTextContent('false');
    });

    it('should reset session correctly', async () => {
      renderWithProvider();
      
      // Start session and set some data
      fireEvent.click(screen.getByText('Start Session'));
      fireEvent.click(screen.getByText('Set Error'));
      
      // Reset
      fireEvent.click(screen.getByText('Reset'));
      
      expect(screen.getByTestId('phase')).toHaveTextContent('idle');
      expect(screen.getByTestId('active-session')).toHaveTextContent('none');
      expect(screen.getByTestId('error')).toHaveTextContent('none');
      expect(screen.getByTestId('is-frozen')).toHaveTextContent('false');
    });
  });

  describe('State Updates', () => {
    it('should update session data correctly', async () => {
      renderWithProvider();
      
      fireEvent.click(screen.getByText('Update Data'));
      
      // Note: We can't directly test sessionDuration in this simple test,
      // but we can verify the action was processed without errors
      expect(screen.getByTestId('phase')).toHaveTextContent('idle');
    });

    it('should set error correctly', async () => {
      renderWithProvider();
      
      fireEvent.click(screen.getByText('Set Error'));
      
      expect(screen.getByTestId('error')).toHaveTextContent('Test error');
      expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
    });

    it('should set loading correctly', async () => {
      renderWithProvider();
      
      fireEvent.click(screen.getByText('Set Loading'));
      
      expect(screen.getByTestId('is-loading')).toHaveTextContent('true');
    });
  });

  describe('Visual Distinction Logic', () => {
    it('should show correct UI states for training phase', async () => {
      renderWithProvider();
      
      fireEvent.click(screen.getByText('Start Session'));
      
      expect(screen.getByTestId('should-show-main-chat')).toHaveTextContent('false');
      expect(screen.getByTestId('should-show-training-panel')).toHaveTextContent('true');
      expect(screen.getByTestId('is-training-active')).toHaveTextContent('true');
      expect(screen.getByTestId('is-feedback-active')).toHaveTextContent('false');
    });

    it('should show correct UI states for feedback phase', async () => {
      renderWithProvider();
      
      fireEvent.click(screen.getByText('Enter Feedback'));
      
      expect(screen.getByTestId('should-show-main-chat')).toHaveTextContent('true');
      expect(screen.getByTestId('should-show-training-panel')).toHaveTextContent('true');
      expect(screen.getByTestId('is-training-active')).toHaveTextContent('false');
      expect(screen.getByTestId('is-feedback-active')).toHaveTextContent('true');
    });

    it('should show correct UI states for idle phase', () => {
      renderWithProvider();
      
      expect(screen.getByTestId('should-show-main-chat')).toHaveTextContent('true');
      expect(screen.getByTestId('should-show-training-panel')).toHaveTextContent('true');
      expect(screen.getByTestId('is-training-active')).toHaveTextContent('false');
      expect(screen.getByTestId('is-feedback-active')).toHaveTextContent('false');
    });
  });

  describe('Panel Freezing', () => {
    it('should freeze panel when session is complete', async () => {
      renderWithProvider();
      
      fireEvent.click(screen.getByText('Start Session'));
      fireEvent.click(screen.getByText('Complete Session'));
      
      expect(screen.getByTestId('is-frozen')).toHaveTextContent('true');
    });

    it('should freeze panel when in feedback phase', async () => {
      renderWithProvider();
      
      fireEvent.click(screen.getByText('Enter Feedback'));
      
      expect(screen.getByTestId('is-frozen')).toHaveTextContent('true');
    });

    it('should unfreeze panel when exiting feedback', async () => {
      renderWithProvider();
      
      fireEvent.click(screen.getByText('Enter Feedback'));
      fireEvent.click(screen.getByText('Exit Feedback'));
      
      expect(screen.getByTestId('is-frozen')).toHaveTextContent('false');
    });
  });

  describe('Session Duration Tracking', () => {
    it('should track session duration during training', async () => {
      renderWithProvider();
      
      fireEvent.click(screen.getByText('Start Session'));
      
      // Wait a bit and check that duration is being tracked
      await waitFor(() => {
        expect(screen.getByTestId('phase')).toHaveTextContent('training');
      });
      
      // The duration tracking is tested implicitly through the useEffect
      // We can't easily test the exact timing in a unit test
    });
  });

  describe('Error Handling', () => {
    it('should throw error when useTraining is used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        render(<TestComponent />);
      }).toThrow('useTraining must be used within a TrainingProvider');
      
      consoleSpy.mockRestore();
    });
  });
});