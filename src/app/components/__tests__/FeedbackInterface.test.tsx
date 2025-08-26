import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FeedbackInterface } from '../FeedbackInterface';
import { FeedbackOutput } from '../../lib/agents/feedback-generator';

import { vi } from 'vitest';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';

// Mock the fetch function
global.fetch = vi.fn();

// Mock feedback data
const mockFeedback: FeedbackOutput = {
  overallPerformance: {
    score: 85,
    grade: 'B',
    summary: 'Good performance overall',
    keyStrengths: ['Strong empathy', 'Good policy adherence'],
    primaryAreasForImprovement: ['Response completeness', 'Time efficiency'],
    sessionCompletion: {
      stepsCompleted: 4,
      totalSteps: 5,
      completionRate: 80,
      criticalErrorCount: 0
    }
  },
  detailedAnalysis: {
    policyAdherence: {
      score: 88,
      trend: 'stable',
      strengths: ['Applied policies correctly'],
      weaknesses: ['Minor delays'],
      specificExamples: { positive: ['Good application'], negative: ['Could be faster'] },
      improvementOpportunities: ['Review guides']
    },
    empathyIndex: {
      score: 90,
      trend: 'improving',
      strengths: ['Great empathy'],
      weaknesses: ['Could validate more'],
      specificExamples: { positive: ['Understanding'], negative: ['Rushed'] },
      improvementOpportunities: ['Practice listening']
    },
    completeness: {
      score: 75,
      trend: 'stable',
      strengths: ['Addressed main concerns'],
      weaknesses: ['Missed secondary issues'],
      specificExamples: { positive: ['Resolved primary'], negative: ['Missed details'] },
      improvementOpportunities: ['Use checklists']
    },
    escalationJudgment: {
      score: 82,
      trend: 'stable',
      strengths: ['Recognized triggers'],
      weaknesses: ['Could escalate sooner'],
      specificExamples: { positive: ['Good recognition'], negative: ['Too much time'] },
      improvementOpportunities: ['Learn criteria']
    },
    timeEfficiency: {
      score: 70,
      trend: 'declining',
      strengths: ['Prompt responses'],
      weaknesses: ['Lengthy responses'],
      specificExamples: { positive: ['Quick start'], negative: ['Too detailed'] },
      improvementOpportunities: ['Use templates']
    }
  },
  sopCitations: [],
  actionableRecommendations: [],
  resources: [],
  nextSteps: []
};

describe('FeedbackInterface', () => {
  const defaultProps = {
    sessionId: 'test-session-123'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', () => {
    (fetch as any).mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(<FeedbackInterface {...defaultProps} />);
    
    expect(screen.getByText('Generating Your Feedback')).toBeInTheDocument();
    expect(screen.getByText(/Our AI is analyzing your training session/)).toBeInTheDocument();
  });

  it('displays feedback when loaded successfully', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockFeedback
    });

    render(<FeedbackInterface {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Training Session Feedback')).toBeInTheDocument();
    });

    expect(screen.getByText(`Session ID: ${defaultProps.sessionId}`)).toBeInTheDocument();
    expect(screen.getByText('Overall Performance')).toBeInTheDocument();
  });

  it('shows error state when feedback loading fails', async () => {
    (fetch as any).mockRejectedValueOnce(new Error('Network error'));

    render(<FeedbackInterface {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Feedback Generation Failed')).toBeInTheDocument();
    });

    expect(screen.getByText('Network error')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('shows error state when API returns error response', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: false,
      statusText: 'Internal Server Error'
    });

    render(<FeedbackInterface {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Feedback Generation Failed')).toBeInTheDocument();
    });

    expect(screen.getByText('Failed to fetch feedback: Internal Server Error')).toBeInTheDocument();
  });

  it('retries feedback loading when try again button is clicked', async () => {
    // First call fails
    (fetch as any).mockRejectedValueOnce(new Error('Network error'));
    
    render(<FeedbackInterface {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    // Second call succeeds
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockFeedback
    });

    fireEvent.click(screen.getByText('Try Again'));

    await waitFor(() => {
      expect(screen.getByText('Training Session Feedback')).toBeInTheDocument();
    });
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockFeedback
    });

    render(<FeedbackInterface {...defaultProps} onClose={onClose} />);

    await waitFor(() => {
      expect(screen.getByText('Close')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not show close button when onClose is not provided', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockFeedback
    });

    render(<FeedbackInterface {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Training Session Feedback')).toBeInTheDocument();
    });

    expect(screen.queryByText('Close')).not.toBeInTheDocument();
  });

  it('handles export session button click', async () => {
    (fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockFeedback
      })
      .mockResolvedValueOnce({
        ok: true,
        blob: async () => new Blob(['session data'], { type: 'application/json' })
      });

    // Mock URL.createObjectURL and related DOM methods
    const mockCreateObjectURL = vi.fn(() => 'mock-url');
    const mockRevokeObjectURL = vi.fn();
    const mockClick = vi.fn();
    const mockAppendChild = vi.fn();
    const mockRemoveChild = vi.fn();

    Object.defineProperty(window, 'URL', {
      value: {
        createObjectURL: mockCreateObjectURL,
        revokeObjectURL: mockRevokeObjectURL
      }
    });

    const mockAnchor = {
      href: '',
      download: '',
      click: mockClick
    };

    vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any);
    vi.spyOn(document.body, 'appendChild').mockImplementation(mockAppendChild);
    vi.spyOn(document.body, 'removeChild').mockImplementation(mockRemoveChild);

    render(<FeedbackInterface {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Export Session')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Export Session'));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        `/api/training/export?sessionId=${defaultProps.sessionId}&type=session`
      );
    });

    expect(mockCreateObjectURL).toHaveBeenCalled();
    expect(mockClick).toHaveBeenCalled();
    expect(mockRevokeObjectURL).toHaveBeenCalled();
  });

  it('handles export feedback button click', async () => {
    (fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockFeedback
      })
      .mockResolvedValueOnce({
        ok: true,
        blob: async () => new Blob(['feedback data'], { type: 'application/pdf' })
      });

    // Mock URL.createObjectURL and related DOM methods
    const mockCreateObjectURL = vi.fn(() => 'mock-url');
    const mockRevokeObjectURL = vi.fn();
    const mockClick = vi.fn();
    const mockAppendChild = vi.fn();
    const mockRemoveChild = vi.fn();

    Object.defineProperty(window, 'URL', {
      value: {
        createObjectURL: mockCreateObjectURL,
        revokeObjectURL: mockRevokeObjectURL
      }
    });

    const mockAnchor = {
      href: '',
      download: '',
      click: mockClick
    };

    vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any);
    vi.spyOn(document.body, 'appendChild').mockImplementation(mockAppendChild);
    vi.spyOn(document.body, 'removeChild').mockImplementation(mockRemoveChild);

    render(<FeedbackInterface {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Export Feedback')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Export Feedback'));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        `/api/training/export?sessionId=${defaultProps.sessionId}&type=feedback`
      );
    });

    expect(mockCreateObjectURL).toHaveBeenCalled();
    expect(mockClick).toHaveBeenCalled();
    expect(mockRevokeObjectURL).toHaveBeenCalled();
  });

  it('handles start new session button click', async () => {
    // Mock window.location.reload
    const mockReload = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: mockReload },
      writable: true
    });

    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockFeedback
    });

    render(<FeedbackInterface {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Start New Session')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Start New Session'));
    expect(mockReload).toHaveBeenCalledTimes(1);
  });

  it('applies custom className when provided', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockFeedback
    });

    const { container } = render(
      <FeedbackInterface {...defaultProps} className="custom-class" />
    );

    await waitFor(() => {
      expect(screen.getByText('Training Session Feedback')).toBeInTheDocument();
    });

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('shows no feedback available state when feedback is null', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => null
    });

    render(<FeedbackInterface {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('No Feedback Available')).toBeInTheDocument();
    });

    expect(screen.getByText(/Feedback could not be generated/)).toBeInTheDocument();
  });

  it('makes correct API call with session ID', () => {
    render(<FeedbackInterface {...defaultProps} />);

    expect(fetch).toHaveBeenCalledWith(
      `/api/training/feedback?sessionId=${defaultProps.sessionId}`
    );
  });
});