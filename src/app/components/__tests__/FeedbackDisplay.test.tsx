import React from 'react';
import { render, screen } from '@testing-library/react';
import { FeedbackDisplay } from '../FeedbackDisplay';
import { FeedbackOutput } from '../../lib/agents/feedback-generator';

// Mock feedback data for testing
const mockFeedback: FeedbackOutput = {
  overallPerformance: {
    score: 85,
    grade: 'B',
    summary: 'Good performance with strong empathy skills and policy adherence.',
    keyStrengths: [
      'Excellent empathy and understanding',
      'Consistent policy adherence',
      'Professional tone maintained'
    ],
    primaryAreasForImprovement: [
      'Response completeness needs improvement',
      'Time efficiency could be better'
    ],
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
      strengths: ['Applied policies correctly', 'Followed procedures'],
      weaknesses: ['Minor delays in application'],
      specificExamples: {
        positive: ['Correct cancellation policy', 'Appropriate alternatives'],
        negative: ['Could reference policy sooner']
      },
      improvementOpportunities: ['Review policy guides', 'Practice scenarios']
    },
    empathyIndex: {
      score: 90,
      trend: 'improving',
      strengths: ['Acknowledged frustration', 'Empathetic language'],
      weaknesses: ['Could validate emotions more'],
      specificExamples: {
        positive: ['Understanding responses', 'Helpful attitude'],
        negative: ['Rushed to solutions']
      },
      improvementOpportunities: ['Active listening practice', 'Emotion validation']
    },
    completeness: {
      score: 75,
      trend: 'stable',
      strengths: ['Addressed main concerns', 'Clear next steps'],
      weaknesses: ['Missed secondary issues', 'No confirmation'],
      specificExamples: {
        positive: ['Resolved primary issue', 'Clear explanations'],
        negative: ['Missed amenity question', 'Skipped confirmation']
      },
      improvementOpportunities: ['Use checklists', 'Ask follow-ups']
    },
    escalationJudgment: {
      score: 82,
      trend: 'stable',
      strengths: ['Recognized triggers', 'Attempted resolution'],
      weaknesses: ['Could escalate sooner'],
      specificExamples: {
        positive: ['Multiple solutions tried', 'Process explained'],
        negative: ['Too much time on complex issue']
      },
      improvementOpportunities: ['Learn criteria', 'Practice identification']
    },
    timeEfficiency: {
      score: 70,
      trend: 'declining',
      strengths: ['Prompt responses', 'Stayed focused'],
      weaknesses: ['Lengthy responses', 'Repeated information'],
      specificExamples: {
        positive: ['Quick initial response', 'Good flow'],
        negative: ['Overly detailed', 'Redundant confirmations']
      },
      improvementOpportunities: ['Use templates', 'Prioritize information']
    }
  },
  sopCitations: [
    {
      section: 'Booking Modifications',
      content: 'Guests may modify bookings up to 24 hours before check-in without penalty.',
      relevance: 'Directly applicable to guest booking change request',
      applicationExample: 'Should have been referenced when guest requested date change',
      source: 'Guest Services SOP v2.1'
    }
  ],
  actionableRecommendations: [
    {
      category: 'communication',
      priority: 'high',
      recommendation: 'Improve response completeness by addressing all concerns',
      specificActions: [
        'Create checklist of concern categories',
        'Practice follow-up questions',
        'Summarize before concluding'
      ],
      expectedOutcome: 'Increased satisfaction and reduced follow-ups',
      relatedSOPs: ['Communication Standards']
    }
  ],
  resources: [
    {
      type: 'training_material',
      title: 'Complete Guest Interaction Workshop',
      description: 'Training on ensuring all guest needs are addressed',
      relevance: 'Addresses completeness improvement area',
      source: 'Training Department'
    }
  ],
  nextSteps: [
    'Review booking modification policies',
    'Practice communication templates',
    'Complete guest interaction workshop'
  ]
};

describe('FeedbackDisplay', () => {
  const defaultProps = {
    feedback: mockFeedback,
    sessionId: 'test-session-123'
  };

  it('renders overall performance section correctly', () => {
    render(<FeedbackDisplay {...defaultProps} />);
    
    expect(screen.getByText('Overall Performance')).toBeInTheDocument();
    expect(screen.getByText('Grade: B')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText(mockFeedback.overallPerformance.summary)).toBeInTheDocument();
  });

  it('displays key strengths and improvement areas', () => {
    render(<FeedbackDisplay {...defaultProps} />);
    
    expect(screen.getByText('Key Strengths')).toBeInTheDocument();
    expect(screen.getByText('Areas for Improvement')).toBeInTheDocument();
    
    // Check for specific strengths
    expect(screen.getByText('Excellent empathy and understanding')).toBeInTheDocument();
    expect(screen.getByText('Consistent policy adherence')).toBeInTheDocument();
    
    // Check for improvement areas
    expect(screen.getByText('Response completeness needs improvement')).toBeInTheDocument();
    expect(screen.getByText('Time efficiency could be better')).toBeInTheDocument();
  });

  it('shows session completion statistics', () => {
    render(<FeedbackDisplay {...defaultProps} />);
    
    expect(screen.getByText('80%')).toBeInTheDocument(); // Completion rate
    expect(screen.getByText('4/5')).toBeInTheDocument(); // Steps completed
    expect(screen.getByText('0')).toBeInTheDocument(); // Critical errors
    expect(screen.getByText('Completion Rate')).toBeInTheDocument();
    expect(screen.getByText('Steps Completed')).toBeInTheDocument();
    expect(screen.getByText('Critical Errors')).toBeInTheDocument();
  });

  it('renders detailed analysis section with all dimensions', () => {
    render(<FeedbackDisplay {...defaultProps} />);
    
    expect(screen.getByText('Detailed Analysis')).toBeInTheDocument();
    expect(screen.getByText('Policy Adherence')).toBeInTheDocument();
    expect(screen.getByText('Empathy Index')).toBeInTheDocument();
    expect(screen.getByText('Completeness')).toBeInTheDocument();
    expect(screen.getByText('Escalation Judgment')).toBeInTheDocument();
    expect(screen.getByText('Time Efficiency')).toBeInTheDocument();
  });

  it('displays trend indicators correctly', () => {
    render(<FeedbackDisplay {...defaultProps} />);
    
    expect(screen.getByText('↗️ Improving')).toBeInTheDocument(); // Empathy trend
    expect(screen.getAllByText('→ Stable')).toHaveLength(3); // Policy, Completeness, Escalation
    expect(screen.getByText('↘️ Declining')).toBeInTheDocument(); // Time efficiency trend
  });

  it('shows SOP citations when available', () => {
    render(<FeedbackDisplay {...defaultProps} />);
    
    expect(screen.getByText('Relevant Policy Guidelines')).toBeInTheDocument();
    expect(screen.getByText('Booking Modifications')).toBeInTheDocument();
    expect(screen.getByText('Guest Services SOP v2.1')).toBeInTheDocument();
    expect(screen.getByText(/Guests may modify bookings/)).toBeInTheDocument();
  });

  it('displays actionable recommendations with priority levels', () => {
    render(<FeedbackDisplay {...defaultProps} />);
    
    expect(screen.getByText('Actionable Recommendations')).toBeInTheDocument();
    expect(screen.getByText('HIGH PRIORITY')).toBeInTheDocument();
    expect(screen.getByText('Improve response completeness by addressing all concerns')).toBeInTheDocument();
    
    // Check that the communication category is displayed somewhere
    const allHeadings = screen.getAllByRole('heading', { level: 3 });
    const communicationHeading = allHeadings.find(heading => 
      heading.textContent?.toLowerCase().includes('communication')
    );
    expect(communicationHeading).toBeDefined();
  });

  it('shows recommended resources', () => {
    render(<FeedbackDisplay {...defaultProps} />);
    
    expect(screen.getByText('Recommended Resources')).toBeInTheDocument();
    expect(screen.getByText('Complete Guest Interaction Workshop')).toBeInTheDocument();
    expect(screen.getByText('Training Department')).toBeInTheDocument();
  });

  it('displays next steps with numbered list', () => {
    render(<FeedbackDisplay {...defaultProps} />);
    
    expect(screen.getByText('Next Steps')).toBeInTheDocument();
    expect(screen.getByText('Review booking modification policies')).toBeInTheDocument();
    expect(screen.getByText('Practice communication templates')).toBeInTheDocument();
    expect(screen.getByText('Complete guest interaction workshop')).toBeInTheDocument();
    
    // Check for numbered indicators
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('applies custom className when provided', () => {
    const { container } = render(
      <FeedbackDisplay {...defaultProps} className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('handles empty or missing data gracefully', () => {
    const emptyFeedback: FeedbackOutput = {
      ...mockFeedback,
      sopCitations: [],
      actionableRecommendations: [],
      resources: [],
      nextSteps: []
    };

    render(<FeedbackDisplay feedback={emptyFeedback} sessionId="test" />);
    
    // Should still render main sections
    expect(screen.getByText('Overall Performance')).toBeInTheDocument();
    expect(screen.getByText('Detailed Analysis')).toBeInTheDocument();
    
    // Empty sections should not appear
    expect(screen.queryByText('Relevant Policy Guidelines')).not.toBeInTheDocument();
  });

  it('displays correct grade colors', () => {
    const gradeTests = [
      { grade: 'A' as const, expectedClass: 'bg-green-100 text-green-800' },
      { grade: 'B' as const, expectedClass: 'bg-blue-100 text-blue-800' },
      { grade: 'C' as const, expectedClass: 'bg-yellow-100 text-yellow-800' },
      { grade: 'D' as const, expectedClass: 'bg-orange-100 text-orange-800' },
      { grade: 'F' as const, expectedClass: 'bg-red-100 text-red-800' }
    ];

    gradeTests.forEach(({ grade, expectedClass }) => {
      const testFeedback = {
        ...mockFeedback,
        overallPerformance: {
          ...mockFeedback.overallPerformance,
          grade
        }
      };

      const { container } = render(
        <FeedbackDisplay feedback={testFeedback} sessionId="test" />
      );
      
      const gradeElement = screen.getByText(`Grade: ${grade}`);
      expect(gradeElement).toHaveClass(expectedClass);
    });
  });
});