// GET /api/training/feedback - Feedback generation endpoint
import { NextRequest, NextResponse } from "next/server";
import { FeedbackOutput } from "../../../lib/agents/feedback-generator";

// Force Node runtime for consistency
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    // Validate required parameters
    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId query parameter is required" },
        { status: 400 }
      );
    }

    // For now, return mock feedback data
    // In a real implementation, this would:
    // 1. Retrieve the completed session data
    // 2. Use the FeedbackGeneratorAgent to generate comprehensive feedback
    // 3. Return the structured feedback
    
    const mockFeedback: FeedbackOutput = {
      overallPerformance: {
        score: 78,
        grade: 'B',
        summary: 'Good performance overall with strong empathy skills and policy adherence. Areas for improvement include response completeness and time efficiency.',
        keyStrengths: [
          'Demonstrated excellent empathy and understanding of guest concerns',
          'Followed company policies consistently throughout the interaction',
          'Maintained professional tone and helpful attitude'
        ],
        primaryAreasForImprovement: [
          'Response completeness - missed addressing some guest concerns fully',
          'Time efficiency - could streamline responses to resolve issues faster'
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
          score: 85,
          trend: 'stable',
          strengths: ['Correctly applied booking modification policies', 'Followed escalation procedures'],
          weaknesses: ['Minor delay in policy application'],
          specificExamples: {
            positive: ['Applied correct cancellation policy', 'Offered appropriate alternatives'],
            negative: ['Could have referenced policy sooner']
          },
          improvementOpportunities: [
            'Review policy quick reference guides',
            'Practice policy application scenarios',
            'Create personal policy checklists'
          ]
        },
        empathyIndex: {
          score: 88,
          trend: 'improving',
          strengths: ['Acknowledged guest frustration', 'Used empathetic language', 'Showed genuine concern'],
          weaknesses: ['Could have validated emotions more explicitly'],
          specificExamples: {
            positive: ['I understand how frustrating this must be', 'Let me help you resolve this'],
            negative: ['Moved to solutions before fully acknowledging emotions']
          },
          improvementOpportunities: [
            'Practice active listening techniques',
            'Use more emotion validation phrases',
            'Allow more time for emotional processing'
          ]
        },
        completeness: {
          score: 72,
          trend: 'stable',
          strengths: ['Addressed main guest concern', 'Provided clear next steps'],
          weaknesses: ['Missed secondary concerns', 'Did not confirm full understanding'],
          specificExamples: {
            positive: ['Resolved primary booking issue', 'Explained process clearly'],
            negative: ['Did not address guest question about amenities', 'Skipped confirmation step']
          },
          improvementOpportunities: [
            'Use comprehensive checklists',
            'Ask follow-up questions',
            'Summarize all points before closing'
          ]
        },
        escalationJudgment: {
          score: 80,
          trend: 'stable',
          strengths: ['Recognized escalation triggers', 'Attempted resolution first'],
          weaknesses: ['Could have escalated sooner for complex issue'],
          specificExamples: {
            positive: ['Tried multiple solutions before escalating', 'Explained escalation process'],
            negative: ['Spent too much time on issue beyond authority level']
          },
          improvementOpportunities: [
            'Learn escalation criteria better',
            'Practice identifying complex issues',
            'Understand authority limits clearly'
          ]
        },
        timeEfficiency: {
          score: 68,
          trend: 'declining',
          strengths: ['Responded promptly to guest', 'Stayed focused on issue'],
          weaknesses: ['Lengthy responses', 'Repeated information', 'Inefficient problem-solving'],
          specificExamples: {
            positive: ['Quick initial response', 'Maintained conversation flow'],
            negative: ['Overly detailed explanations', 'Redundant confirmations']
          },
          improvementOpportunities: [
            'Use concise communication templates',
            'Prioritize most important information',
            'Streamline problem-solving approach'
          ]
        }
      },
      sopCitations: [
        {
          section: 'Booking Modifications',
          content: 'Guests may modify their booking up to 24 hours before check-in without penalty. Modifications within 24 hours are subject to availability and may incur fees.',
          relevance: 'Directly applicable to the guest\'s request to modify their booking dates',
          applicationExample: 'This policy should have been referenced when the guest requested to change their check-in date',
          source: 'Guest Services SOP v2.1'
        },
        {
          section: 'Guest Communication Standards',
          content: 'All guest communications should acknowledge their concerns, provide clear solutions, and confirm understanding before concluding the interaction.',
          relevance: 'Provides framework for complete and empathetic guest interactions',
          applicationExample: 'Following this standard would have ensured all guest concerns were addressed',
          source: 'Communication Guidelines v1.3'
        }
      ],
      actionableRecommendations: [
        {
          category: 'communication',
          priority: 'high',
          recommendation: 'Improve response completeness by addressing all guest concerns systematically',
          specificActions: [
            'Create a checklist of common guest concern categories',
            'Practice asking follow-up questions to uncover all issues',
            'Summarize all points addressed before concluding interactions'
          ],
          expectedOutcome: 'Increased guest satisfaction and reduced need for follow-up contacts',
          relatedSOPs: ['Guest Communication Standards', 'Issue Resolution Process']
        },
        {
          category: 'efficiency',
          priority: 'medium',
          recommendation: 'Streamline communication to improve response time while maintaining quality',
          specificActions: [
            'Use structured response templates for common scenarios',
            'Prioritize most critical information first',
            'Combine multiple points into single, well-organized responses'
          ],
          expectedOutcome: 'Faster issue resolution and improved productivity',
          relatedSOPs: ['Communication Guidelines', 'Time Management Best Practices']
        },
        {
          category: 'policy',
          priority: 'medium',
          recommendation: 'Strengthen policy knowledge and application speed',
          specificActions: [
            'Review booking modification policies daily',
            'Create quick reference cards for common policies',
            'Practice policy application with scenario exercises'
          ],
          expectedOutcome: 'More confident and faster policy application',
          relatedSOPs: ['Booking Modifications', 'Policy Reference Guide']
        }
      ],
      resources: [
        {
          type: 'training_material',
          title: 'Complete Guest Interaction Workshop',
          description: 'Interactive training on ensuring all guest needs are identified and addressed',
          relevance: 'Directly addresses the completeness improvement area identified in your session',
          source: 'Training Department'
        },
        {
          type: 'sop_section',
          title: 'Booking Modification Policies',
          description: 'Comprehensive guide to all booking change policies and procedures',
          relevance: 'Essential reference for handling booking-related guest requests',
          source: 'Guest Services SOP'
        },
        {
          type: 'script_template',
          title: 'Efficient Communication Templates',
          description: 'Pre-written templates for common guest interactions to improve response time',
          relevance: 'Helps address time efficiency concerns while maintaining quality',
          source: 'Communication Templates Library'
        },
        {
          type: 'best_practice',
          title: 'Empathy in Customer Service',
          description: 'Best practices for demonstrating empathy and emotional intelligence',
          relevance: 'Builds on your existing empathy strengths to achieve even better results',
          source: 'Best Practices Guide'
        }
      ],
      nextSteps: [
        'Review the booking modification policies to strengthen your policy knowledge',
        'Practice using the communication templates to improve response efficiency',
        'Complete the guest interaction workshop to enhance your completeness skills',
        'Schedule a follow-up training session to practice the recommended improvements'
      ]
    };

    return NextResponse.json(mockFeedback, { status: 200 });

  } catch (error: any) {
    console.error('Feedback generation error:', error);
    
    return NextResponse.json(
      { error: "Failed to generate feedback" },
      { status: 500 }
    );
  }
}