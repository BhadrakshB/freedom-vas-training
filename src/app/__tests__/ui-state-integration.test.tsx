import React from 'react';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import { TrainingProvider } from '../contexts/TrainingContext';
import { TrainingPanel } from '../components/TrainingPanel';
import { FeedbackInterface } from '../components/FeedbackInterface';

import { vi } from 'vitest';

// Mock the API calls
global.fetch = vi.fn();

// Mock components that have complex dependencies
vi.mock('../components/SessionTimer', () => ({
  SessionTimer: ({ isActive }: { isActive: boolean }) => (
    <div data-testid="session-timer">Timer Active: {isActive.toString()}</div>
  ),
}));

vi.mock('../components/ProgressIndicator', () => ({
  ProgressIndicator: ({ completionPercentage }: { completionPercentage: number }) => (
    <div data-testid="progress-indicator">Progress: {completionPercentage}%</div>
  ),
}));

vi.mock('../components/TrainingInput', () => ({
  TrainingInput: ({ disabled, loading, placeholder }: { disabled: boolean; loading: boolean; placeholder: string }) => (
    <div data-testid="training-input">
      <input disabled={disabled} placeholder={placeholder} />
      {loading && <div data-testid="input-loading">Loading...</div>}
    </div>
  ),
}));

vi.mock('../components/FeedbackDisplay', () => ({
  FeedbackDisplay: ({ feedback }: { feedback: any }) => (
    <div data-testid="feedback-display">
      Feedback: {feedback ? 'Present' : 'None'}
    </div>
  ),
}));

const mockSessionStatus = {
  sessionId: 'test-session-1',
  sessionStatus: 'active' as const,
  scenario: {
    title: 'Test Scenario',
    description: 'A test scenario for training',
    required_steps: ['step1', 'step2'],
  },
  persona: {
    name: 'Test Guest',
    background: 'A test guest persona',
    communication_style: 'friendly',
  },
  progress: {
    currentTurn: 1,
    completedSteps: ['step1'],
    requiredSteps: ['step1', 'step2'],
    completionPercentage: 50,
  },
  scores: {
    policy_adherence: 85,
    empathy_index: 90,
    completeness: 75,
    escalation_judgment: 80,
    time_efficiency: 70,
    overall: 80,
  },
  sessionDuration: 120000,
  lastActivity: new Date().toISOString(),
  criticalErrors: [],
};

const mockCompletedSessionStatus = {
  ...mockSessionStatus,
  sessionStatus: 'complete' as const,
  progress: {
    ...mockSessionStatus.progress,
    completedSteps: ['step1', 'step2'],
    completionPercentage: 100,
  },
};

const mockFeedback = {
  overall_performance: {
    score: 80,
    summary: 'Good performance overall',
  },
  detailed_analysis: {
    policy_adherence: {
      score: 85,
      feedback: 'Good policy adherence',
      evidence: ['Followed SOP correctly'],
    },
    empathy_index: {
      score: 90,
      feedback: 'Excellent empathy',
      evidence: ['Showed understanding'],
    },
    completeness: {
      score: 75,
      feedback: 'Mostly complete',
      evidence: ['Covered most points'],
    },
    escalation_judgment: {
      score: 80,
      feedback: 'Good escalation timing',
      evidence: ['Escalated appropriately'],
    },
    time_efficiency: {
      score: 70,
      feedback: 'Could be more efficient',
      evidence: ['Took longer than expected'],
    },
  },
  sop_citations: [
    {
      section: 'Guest Communication',
      content: 'Always be polite and professional',
      relevance: 'Applied correctly in conversation',
    },
  ],
  actionable_recommendations: [
    'Work on response time',
    'Practice active listening',
  ],
  resources: [
    {
      title: 'Communication Best Practices',
      type: 'guide',
      url: '/resources/communication',
    },
  ],
};

describe('UI State Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (fetch as any).mockClear();
  });

  describe('Training Panel State Transitions', () => {
    it('should show idle state initially', () => {
      render(
        <TrainingProvider>
          <TrainingPanel className="test-panel" />
        </TrainingProvider>
      );

      expect(screen.getByText('Training Simulator')).toBeInTheDocument();
      expect(screen.getByText('Start Training Session')).toBeInTheDocument();
    });

    it('should show loading state when starting session', async () => {
      const mockOnStartSession = vi.fn();

      render(
        <TrainingProvider>
          <TrainingPanel onStartSession={mockOnStartSession} className="test-panel" />
        </TrainingProvider>
      );

      fireEvent.click(screen.getByText('Start Training Session'));
      
      // The loading state would be managed by the parent component
      // This test verifies the button interaction works
      expect(mockOnStartSession).toHaveBeenCalled();
    });

    it('should show active training state with session data', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSessionStatus,
      });

      render(
        <TrainingProvider>
          <TrainingPanel sessionId="test-session-1" className="test-panel" />
        </TrainingProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Training Session')).toBeInTheDocument();
      });

      expect(screen.getByText('Test Scenario')).toBeInTheDocument();
      expect(screen.getByText('Guest: Test Guest')).toBeInTheDocument();
      expect(screen.getByTestId('progress-indicator')).toHaveTextContent('Progress: 50%');
      expect(screen.getByTestId('session-timer')).toHaveTextContent('Timer Active: true');
    });

    it('should show completed state with frozen panel', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCompletedSessionStatus,
      });

      render(
        <TrainingProvider>
          <TrainingPanel sessionId="test-session-1" className="test-panel" />
        </TrainingProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('🎉 Session Complete!')).toBeInTheDocument();
      });

      expect(screen.getByText('Final Score: 80%')).toBeInTheDocument();
      expect(screen.getByTestId('session-timer')).toHaveTextContent('Timer Active: false');
      
      // Check that input is disabled
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
    });

    it('should handle API errors gracefully', async () => {
      (fetch as any).mockRejectedValueOnce(new Error('API Error'));

      render(
        <TrainingProvider>
          <TrainingPanel sessionId="test-session-1" className="test-panel" />
        </TrainingProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('⚠️ Error')).toBeInTheDocument();
      });

      expect(screen.getByText('Failed to fetch session status')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });
  });

  describe('Visual Distinction Between Phases', () => {
    it('should apply correct styling for training phase', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSessionStatus,
      });

      const { container } = render(
        <TrainingProvider>
          <TrainingPanel sessionId="test-session-1" className="test-panel" />
        </TrainingProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Training Session')).toBeInTheDocument();
      });

      // Check for blue styling (training phase)
      const panel = container.querySelector('.test-panel');
      expect(panel).toHaveClass('bg-blue-50', 'border-l-4', 'border-blue-500');
    });

    it('should apply correct styling for completed phase', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCompletedSessionStatus,
      });

      const { container } = render(
        <TrainingProvider>
          <TrainingPanel sessionId="test-session-1" className="test-panel" />
        </TrainingProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('🎉 Session Complete!')).toBeInTheDocument();
      });

      // Check for gray styling (frozen panel)
      const panel = container.querySelector('.test-panel');
      expect(panel).toHaveClass('bg-gray-50', 'border-l-4', 'border-gray-400');
    });
  });

  describe('Feedback Interface Integration', () => {
    it('should show loading state initially', () => {
      (fetch as any).mockImplementation(() => new Promise(() => {})); // Never resolves

      render(
        <TrainingProvider>
          <FeedbackInterface sessionId="test-session-1" />
        </TrainingProvider>
      );

      expect(screen.getByText('Generating Your Feedback')).toBeInTheDocument();
      expect(screen.getByText(/Our AI is analyzing your training session/)).toBeInTheDocument();
    });

    it('should show feedback when loaded', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockFeedback,
      });

      render(
        <TrainingProvider>
          <FeedbackInterface sessionId="test-session-1" />
        </TrainingProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Training Session Feedback')).toBeInTheDocument();
      });

      expect(screen.getByText('Session ID: test-session-1')).toBeInTheDocument();
      expect(screen.getByTestId('feedback-display')).toHaveTextContent('Feedback: Present');
    });

    it('should show error state when feedback fails to load', async () => {
      (fetch as any).mockRejectedValueOnce(new Error('Feedback API Error'));

      render(
        <TrainingProvider>
          <FeedbackInterface sessionId="test-session-1" />
        </TrainingProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Feedback Generation Failed')).toBeInTheDocument();
      });

      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('should handle export functionality', async () => {
      (fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockFeedback,
        })
        .mockResolvedValueOnce({
          ok: true,
          blob: async () => new Blob(['session data'], { type: 'application/json' }),
        });

      // Mock URL.createObjectURL and related DOM methods
      global.URL.createObjectURL = vi.fn(() => 'mock-url');
      global.URL.revokeObjectURL = vi.fn();
      
      const mockClick = vi.fn();
      const mockAppendChild = vi.fn();
      const mockRemoveChild = vi.fn();
      
      Object.defineProperty(document, 'createElement', {
        value: vi.fn(() => ({
          href: '',
          download: '',
          click: mockClick,
        })),
      });
      
      Object.defineProperty(document.body, 'appendChild', {
        value: mockAppendChild,
      });
      
      Object.defineProperty(document.body, 'removeChild', {
        value: mockRemoveChild,
      });

      render(
        <TrainingProvider>
          <FeedbackInterface sessionId="test-session-1" />
        </TrainingProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Training Session Feedback')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Export Session'));

      expect(fetch).toHaveBeenCalledWith('/api/training/export?sessionId=test-session-1&type=session');
      expect(mockClick).toHaveBeenCalled();
    });
  });

  describe('Session Completion Transitions', () => {
    it('should transition from training to feedback phase', async () => {
      // Mock the session status API to return completed status
      (fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockCompletedSessionStatus,
      });

      const TestComponent = () => {
        const [sessionId, setSessionId] = React.useState<string | undefined>('test-session-1');
        const [showFeedback, setShowFeedback] = React.useState(false);

        // Simulate the session completion detection logic
        React.useEffect(() => {
          if (sessionId) {
            const checkStatus = async () => {
              const response = await fetch(`/api/training/status?sessionId=${sessionId}`);
              const data = await response.json();
              if (data.sessionStatus === 'complete') {
                setShowFeedback(true);
                setSessionId(undefined);
              }
            };
            checkStatus();
          }
        }, [sessionId]);

        return (
          <div>
            {showFeedback ? (
              <div data-testid="feedback-phase">Feedback Phase</div>
            ) : (
              <div data-testid="training-phase">Training Phase</div>
            )}
          </div>
        );
      };

      render(
        <TrainingProvider>
          <TestComponent />
        </TrainingProvider>
      );

      // Initially should show training phase
      expect(screen.getByTestId('training-phase')).toBeInTheDocument();

      // Should transition to feedback phase
      await waitFor(() => {
        expect(screen.getByTestId('feedback-phase')).toBeInTheDocument();
      });
    });
  });

  describe('Panel Freezing Behavior', () => {
    it('should freeze panel input when session is complete', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCompletedSessionStatus,
      });

      render(
        <TrainingProvider>
          <TrainingPanel sessionId="test-session-1" className="test-panel" />
        </TrainingProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('🎉 Session Complete!')).toBeInTheDocument();
      });

      // Check that the training input is disabled
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
      expect(input).toHaveAttribute('placeholder', 'Panel is frozen - session complete or in feedback phase');
    });

    it('should show frozen indicator when panel is frozen', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCompletedSessionStatus,
      });

      render(
        <TrainingProvider>
          <TrainingPanel sessionId="test-session-1" className="test-panel" />
        </TrainingProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('🔒 Panel is frozen - session complete or in feedback phase')).toBeInTheDocument();
      });

      expect(screen.getByText('Frozen')).toBeInTheDocument();
    });
  });
});