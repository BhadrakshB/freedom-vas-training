import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FeedbackPanel } from '../FeedbackPanel';
import { FeedbackSchema } from '@/lib/agents/v2/graph_v2';

const mockFeedback: FeedbackSchema = {
  Overall_Feedback: "Great job handling the guest complaint! You showed excellent empathy and followed proper escalation procedures.",
  Critical_Messages: [
    {
      index: 3,
      Content: "I understand your frustration with the booking issue. Let me check our system and find a solution for you right away.",
      Positive_Notes: [
        "Acknowledged the guest's emotions",
        "Took immediate action to resolve the issue"
      ],
      Constructive_Criticism: [
        "Could have offered a specific timeline for resolution",
        "Consider mentioning compensation options earlier"
      ]
    }
  ],
  Strengths: [
    "Excellent empathy and active listening",
    "Professional tone throughout the conversation",
    "Quick problem identification"
  ],
  Areas_For_Improvement: [
    "Response time could be faster",
    "More proactive communication about next steps"
  ],
  General_Suggestions: [
    "Review SOP section 4.2 for complaint handling best practices",
    "Practice using empathy statements in difficult situations"
  ]
};

describe('FeedbackPanel', () => {
  it('renders feedback data correctly', () => {
    const mockOnStartNewSession = vi.fn();
    
    render(
      <FeedbackPanel 
        feedback={mockFeedback} 
        onStartNewSession={mockOnStartNewSession} 
      />
    );

    // Check overall feedback
    expect(screen.getByText('Training Session Complete')).toBeInTheDocument();
    expect(screen.getByText(mockFeedback.Overall_Feedback)).toBeInTheDocument();

    // Check critical messages
    expect(screen.getByText('Message Analysis')).toBeInTheDocument();
    expect(screen.getByText('Message #3')).toBeInTheDocument();
    expect(screen.getByText(mockFeedback.Critical_Messages[0].Content)).toBeInTheDocument();

    // Check strengths
    expect(screen.getByText('Strengths')).toBeInTheDocument();
    expect(screen.getByText('Excellent empathy and active listening')).toBeInTheDocument();

    // Check areas for improvement
    expect(screen.getByText('Areas for Improvement')).toBeInTheDocument();
    expect(screen.getByText('Response time could be faster')).toBeInTheDocument();

    // Check general suggestions
    expect(screen.getByText('General Suggestions')).toBeInTheDocument();
    expect(screen.getByText(/Review SOP section 4.2/)).toBeInTheDocument();

    // Check CTA button
    expect(screen.getByText('Start New Training Session')).toBeInTheDocument();
  });

  it('handles missing feedback gracefully', () => {
    const mockOnStartNewSession = vi.fn();
    
    render(
      <FeedbackPanel 
        feedback={null as any} 
        onStartNewSession={mockOnStartNewSession} 
      />
    );

    expect(screen.getByText('Feedback Unavailable')).toBeInTheDocument();
    expect(screen.getByText('Training feedback could not be loaded. Please try starting a new session.')).toBeInTheDocument();
    expect(screen.getByText('Start New Training Session')).toBeInTheDocument();
  });

  it('calls onStartNewSession when CTA button is clicked', () => {
    const mockOnStartNewSession = vi.fn();
    
    render(
      <FeedbackPanel 
        feedback={mockFeedback} 
        onStartNewSession={mockOnStartNewSession} 
      />
    );

    const ctaButton = screen.getByRole('button', { name: 'Start New Training Session' });
    fireEvent.click(ctaButton);

    expect(mockOnStartNewSession).toHaveBeenCalledTimes(1);
  });

  it('handles empty arrays in feedback data', () => {
    const emptyFeedback: FeedbackSchema = {
      Overall_Feedback: "Session completed",
      Critical_Messages: [],
      Strengths: [],
      Areas_For_Improvement: [],
      General_Suggestions: []
    };

    const mockOnStartNewSession = vi.fn();
    
    render(
      <FeedbackPanel 
        feedback={emptyFeedback} 
        onStartNewSession={mockOnStartNewSession} 
      />
    );

    // Should still render overall feedback and CTA
    expect(screen.getByText('Training Session Complete')).toBeInTheDocument();
    expect(screen.getByText('Session completed')).toBeInTheDocument();
    expect(screen.getByText('Start New Training Session')).toBeInTheDocument();

    // Should not render empty sections
    expect(screen.queryByText('Message Analysis')).not.toBeInTheDocument();
    expect(screen.queryByText('Strengths')).not.toBeInTheDocument();
    expect(screen.queryByText('Areas for Improvement')).not.toBeInTheDocument();
    expect(screen.queryByText('General Suggestions')).not.toBeInTheDocument();
  });

  it('renders positive notes and constructive criticism correctly', () => {
    const mockOnStartNewSession = vi.fn();
    
    render(
      <FeedbackPanel 
        feedback={mockFeedback} 
        onStartNewSession={mockOnStartNewSession} 
      />
    );

    // Check positive notes
    expect(screen.getByText('What went well:')).toBeInTheDocument();
    expect(screen.getByText('Acknowledged the guest\'s emotions')).toBeInTheDocument();
    expect(screen.getByText('Took immediate action to resolve the issue')).toBeInTheDocument();

    // Check constructive criticism
    expect(screen.getByText('Areas for improvement:')).toBeInTheDocument();
    expect(screen.getByText('Could have offered a specific timeline for resolution')).toBeInTheDocument();
    expect(screen.getByText('Consider mentioning compensation options earlier')).toBeInTheDocument();
  });
});