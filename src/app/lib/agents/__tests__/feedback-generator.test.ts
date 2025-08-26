// Unit tests for Feedback Generator Agent

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { HumanMessage, AIMessage } from '@langchain/core/messages';
import { 
  FeedbackGeneratorAgent, 
  FeedbackInput, 
  FeedbackOutput,
  OverallPerformance,
  DetailedAnalysis,
  SOPCitation,
  ActionableRecommendation,
  ResourceRecommendation
} from '../feedback-generator';
import { PineconeService } from '../../pinecone-service';
import { 
  ScenarioData, 
  PersonaData, 
  ScoringMetrics, 
  RetrievalResult 
} from '../../types';
import { ScoringEvidence } from '../silent-scoring';

// Mock dependencies
vi.mock('@langchain/google-genai');
vi.mock('../../pinecone-service');

describe('FeedbackGeneratorAgent', () => {
  let feedbackAgent: FeedbackGeneratorAgent;
  let mockPineconeService: PineconeService;
  let mockLLM: any;

  const mockScenario: ScenarioData = {
    title: 'Overbooking Crisis Management',
    description: 'Handle a guest who arrives to find their confirmed reservation was overbooked',
    required_steps: [
      'Acknowledge the situation and apologize',
      'Explain the overbooking situation clearly',
      'Offer alternative accommodations',
      'Provide compensation for the inconvenience',
      'Follow up to ensure satisfaction'
    ],
    critical_errors: [
      'Blaming the guest for the situation',
      'Refusing to provide alternative solutions',
      'Offering inadequate compensation'
    ],
    time_pressure: 3
  };

  const mockPersona: PersonaData = {
    name: 'Sarah Mitchell',
    background: 'Business traveler with important morning meeting',
    personality_traits: ['Professional', 'Time-conscious', 'Direct communicator'],
    hidden_motivations: ['Needs to maintain professional image', 'Worried about meeting preparation'],
    communication_style: 'Direct and business-focused, becomes frustrated when not heard',
    emotional_arc: ['Surprised', 'Frustrated', 'Angry', 'Cautiously optimistic', 'Satisfied']
  };

  const mockConversationHistory = [
    new HumanMessage('I have a confirmed reservation but you\'re telling me there\'s no room?'),
    new AIMessage('I sincerely apologize for this situation. Let me check what alternatives we have available.'),
    new HumanMessage('This is completely unacceptable. I have an important meeting tomorrow morning.'),
    new AIMessage('I understand your frustration and I\'m going to make this right. Let me find you a comparable room at a nearby hotel.')
  ];

  const mockScoringMetrics: ScoringMetrics[] = [
    {
      policy_adherence: 85,
      empathy_index: 90,
      completeness: 75,
      escalation_judgment: 80,
      time_efficiency: 70
    },
    {
      policy_adherence: 80,
      empathy_index: 85,
      completeness: 80,
      escalation_judgment: 85,
      time_efficiency: 75
    }
  ];

  const mockScoringEvidence: ScoringEvidence[] = [
    {
      policy_adherence: {
        score: 85,
        evidence: ['Followed overbooking protocol', 'Offered appropriate compensation'],
        violations: []
      },
      empathy_index: {
        score: 90,
        evidence: ['Acknowledged frustration', 'Used empathetic language'],
        missed_opportunities: []
      },
      completeness: {
        score: 75,
        evidence: ['Addressed main concern', 'Offered alternatives'],
        missing_elements: ['Did not ask about specific needs']
      },
      escalation_judgment: {
        score: 80,
        evidence: ['Handled situation appropriately'],
        inappropriate_actions: []
      },
      time_efficiency: {
        score: 70,
        evidence: ['Responded promptly'],
        inefficiencies: ['Could have been more direct']
      }
    },
    {
      policy_adherence: {
        score: 80,
        evidence: ['Applied compensation policy'],
        violations: []
      },
      empathy_index: {
        score: 85,
        evidence: ['Maintained supportive tone'],
        missed_opportunities: []
      },
      completeness: {
        score: 80,
        evidence: ['Provided comprehensive solution'],
        missing_elements: []
      },
      escalation_judgment: {
        score: 85,
        evidence: ['Good judgment on authority level'],
        inappropriate_actions: []
      },
      time_efficiency: {
        score: 75,
        evidence: ['Efficient problem solving'],
        inefficiencies: []
      }
    }
  ];

  const mockRetrievalResults: RetrievalResult[] = [
    {
      content: 'When handling overbooking situations, always acknowledge the guest\'s frustration and provide immediate alternative solutions.',
      metadata: {
        type: 'sop',
        category: 'overbooking',
        difficulty: 'intermediate',
        tags: ['crisis-management', 'compensation']
      },
      score: 0.95
    },
    {
      content: 'Compensation for overbooking should include alternative accommodation plus additional benefits such as meal vouchers or transportation.',
      metadata: {
        type: 'sop',
        category: 'overbooking',
        difficulty: 'intermediate',
        tags: ['compensation', 'policy']
      },
      score: 0.92
    }
  ];

  const mockFeedbackInput: FeedbackInput = {
    sessionId: 'test-session-123',
    scenario: mockScenario,
    persona: mockPersona,
    conversationHistory: mockConversationHistory,
    allScores: mockScoringMetrics,
    allEvidence: mockScoringEvidence,
    criticalErrors: [],
    completedSteps: ['Acknowledge the situation and apologize', 'Explain the overbooking situation clearly', 'Offer alternative accommodations'],
    requiredSteps: mockScenario.required_steps,
    overallScore: 82,
    sessionDuration: 480000 // 8 minutes in milliseconds
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock LLM
    mockLLM = {
      invoke: vi.fn()
    };

    // Mock Pinecone service
    mockPineconeService = {
      retrieveRelevantSOPs: vi.fn().mockResolvedValue(mockRetrievalResults),
      retrieveTrainingContent: vi.fn().mockResolvedValue([]),
      searchPolicyGuidance: vi.fn().mockResolvedValue([])
    } as any;

    // Create agent with mocked dependencies
    feedbackAgent = new FeedbackGeneratorAgent('test-api-key', mockPineconeService);
    (feedbackAgent as any).llm = mockLLM;
  });

  describe('generateFeedback', () => {
    it('should generate comprehensive feedback for a completed session', async () => {
      // Mock LLM response for overall performance
      mockLLM.invoke.mockResolvedValueOnce(new AIMessage(`
        GRADE: B
        SUMMARY: Strong performance with good empathy and policy adherence. Some areas for improvement in completeness and efficiency.
        KEY_STRENGTHS:
        - Excellent empathetic response to guest frustration
        - Proper application of overbooking protocols
        - Professional communication throughout
        PRIMARY_IMPROVEMENT_AREAS:
        - Could have asked more probing questions about guest needs
        - Response time could be improved for efficiency
      `));

      const result = await feedbackAgent.generateFeedback(mockFeedbackInput);

      expect(result).toBeDefined();
      expect(result.overallPerformance).toBeDefined();
      expect(result.detailedAnalysis).toBeDefined();
      expect(result.sopCitations).toBeDefined();
      expect(result.actionableRecommendations).toBeDefined();
      expect(result.resources).toBeDefined();
      expect(result.nextSteps).toBeDefined();

      // Verify Pinecone was called for SOP retrieval
      expect(mockPineconeService.retrieveRelevantSOPs).toHaveBeenCalled();
    });

    it('should handle sessions with critical errors', async () => {
      const inputWithErrors: FeedbackInput = {
        ...mockFeedbackInput,
        criticalErrors: ['Blaming the guest for the situation', 'Refusing to provide alternative solutions'],
        overallScore: 45
      };

      mockLLM.invoke.mockResolvedValueOnce(new AIMessage(`
        GRADE: D
        SUMMARY: Session contained critical errors that significantly impacted guest experience.
        KEY_STRENGTHS:
        - Attempted to engage with the guest
        PRIMARY_IMPROVEMENT_AREAS:
        - Critical policy violations occurred
        - Inappropriate guest interaction approach
      `));

      const result = await feedbackAgent.generateFeedback(inputWithErrors);

      expect(result.overallPerformance.grade).toBe('D');
      expect(result.overallPerformance.sessionCompletion.criticalErrorCount).toBe(2);
      expect(result.actionableRecommendations).toContainEqual(
        expect.objectContaining({
          category: 'policy',
          priority: 'high',
          recommendation: expect.stringContaining('critical errors')
        })
      );
    });

    it('should generate appropriate recommendations for weak dimensions', async () => {
      const inputWithWeakScores: FeedbackInput = {
        ...mockFeedbackInput,
        allScores: [
          {
            policy_adherence: 45, // Weak
            empathy_index: 40,    // Weak
            completeness: 85,
            escalation_judgment: 80,
            time_efficiency: 75
          }
        ],
        overallScore: 65
      };

      mockLLM.invoke.mockResolvedValueOnce(new AIMessage(`
        GRADE: C
        SUMMARY: Mixed performance with significant weaknesses in policy adherence and empathy.
        KEY_STRENGTHS:
        - Good completeness in addressing issues
        PRIMARY_IMPROVEMENT_AREAS:
        - Policy adherence needs immediate attention
        - Empathy and emotional intelligence require development
      `));

      const result = await feedbackAgent.generateFeedback(inputWithWeakScores);

      const policyRec = result.actionableRecommendations.find(rec => rec.category === 'policy');
      const empathyRec = result.actionableRecommendations.find(rec => rec.category === 'empathy');

      expect(policyRec).toBeDefined();
      expect(policyRec?.priority).toBe('high');
      expect(empathyRec).toBeDefined();
      expect(empathyRec?.priority).toBe('high');
    });

    it('should include relevant SOP citations', async () => {
      mockLLM.invoke.mockResolvedValueOnce(new AIMessage(`
        GRADE: B
        SUMMARY: Good performance overall.
        KEY_STRENGTHS:
        - Applied policies correctly
        PRIMARY_IMPROVEMENT_AREAS:
        - Minor efficiency improvements needed
      `));

      const result = await feedbackAgent.generateFeedback(mockFeedbackInput);

      expect(result.sopCitations).toHaveLength(2);
      expect(result.sopCitations[0]).toMatchObject({
        section: 'overbooking',
        content: expect.stringContaining('overbooking situations'),
        relevance: expect.any(String),
        applicationExample: expect.any(String),
        source: 'sop'
      });
    });

    it('should provide appropriate resource recommendations', async () => {
      mockLLM.invoke.mockResolvedValueOnce(new AIMessage(`
        GRADE: C
        SUMMARY: Needs improvement in multiple areas.
        KEY_STRENGTHS:
        - Basic communication skills
        PRIMARY_IMPROVEMENT_AREAS:
        - Policy knowledge gaps
        - Empathy development needed
      `));

      const result = await feedbackAgent.generateFeedback(mockFeedbackInput);

      expect(result.resources.length).toBeGreaterThan(0);
      expect(result.resources).toContainEqual(
        expect.objectContaining({
          type: 'sop_section',
          title: expect.stringContaining('Policy Guidelines'),
          description: expect.any(String),
          relevance: expect.any(String)
        })
      );
    });

    it('should generate meaningful next steps', async () => {
      mockLLM.invoke.mockResolvedValueOnce(new AIMessage(`
        GRADE: B
        SUMMARY: Good performance with room for improvement.
        KEY_STRENGTHS:
        - Strong empathy
        PRIMARY_IMPROVEMENT_AREAS:
        - Policy application
      `));

      const result = await feedbackAgent.generateFeedback(mockFeedbackInput);

      expect(result.nextSteps.length).toBeGreaterThanOrEqual(2);
      expect(result.nextSteps.every(step => step.length > 10)).toBe(true);
    });

    it('should handle LLM failures gracefully', async () => {
      mockLLM.invoke.mockRejectedValue(new Error('LLM API failure'));

      await expect(feedbackAgent.generateFeedback(mockFeedbackInput)).rejects.toThrow('Feedback generation failed');
    });

    it('should handle Pinecone failures gracefully', async () => {
      (mockPineconeService.retrieveRelevantSOPs as Mock).mockRejectedValue(new Error('Pinecone failure'));
      
      mockLLM.invoke.mockResolvedValueOnce(new AIMessage(`
        GRADE: B
        SUMMARY: Good performance overall.
        KEY_STRENGTHS:
        - Applied policies correctly
        PRIMARY_IMPROVEMENT_AREAS:
        - Minor improvements needed
      `));

      const result = await feedbackAgent.generateFeedback(mockFeedbackInput);

      expect(result).toBeDefined();
      expect(result.sopCitations).toHaveLength(0); // No SOPs due to failure
    });
  });

  describe('formatFeedbackForDisplay', () => {
    it('should format feedback output as structured markdown', async () => {
      const mockFeedbackOutput: FeedbackOutput = {
        overallPerformance: {
          score: 82,
          grade: 'B',
          summary: 'Strong performance with good empathy and policy adherence.',
          keyStrengths: ['Excellent empathetic response', 'Proper protocol application'],
          primaryAreasForImprovement: ['Could ask more probing questions', 'Response time improvement'],
          sessionCompletion: {
            stepsCompleted: 3,
            totalSteps: 5,
            completionRate: 60,
            criticalErrorCount: 0
          }
        },
        detailedAnalysis: {
          policyAdherence: {
            score: 82,
            trend: 'stable',
            strengths: ['Followed protocols'],
            weaknesses: [],
            specificExamples: { positive: ['Applied compensation policy'], negative: [] },
            improvementOpportunities: ['Review advanced policies']
          },
          empathyIndex: {
            score: 87,
            trend: 'improving',
            strengths: ['Acknowledged emotions'],
            weaknesses: [],
            specificExamples: { positive: ['Used empathetic language'], negative: [] },
            improvementOpportunities: ['Practice active listening']
          },
          completeness: {
            score: 77,
            trend: 'stable',
            strengths: ['Addressed main concerns'],
            weaknesses: ['Missing follow-up questions'],
            specificExamples: { positive: ['Comprehensive solution'], negative: ['Incomplete needs assessment'] },
            improvementOpportunities: ['Use structured checklists']
          },
          escalationJudgment: {
            score: 82,
            trend: 'stable',
            strengths: ['Good authority assessment'],
            weaknesses: [],
            specificExamples: { positive: ['Appropriate escalation timing'], negative: [] },
            improvementOpportunities: ['Study escalation criteria']
          },
          timeEfficiency: {
            score: 72,
            trend: 'stable',
            strengths: ['Prompt responses'],
            weaknesses: ['Could be more direct'],
            specificExamples: { positive: ['Quick problem identification'], negative: ['Lengthy explanations'] },
            improvementOpportunities: ['Use communication templates']
          }
        },
        sopCitations: [
          {
            section: 'Overbooking Policy',
            content: 'Always acknowledge guest frustration and provide immediate alternatives.',
            relevance: 'Directly applicable to overbooking scenarios',
            applicationExample: 'Should have been applied when handling the guest complaint',
            source: 'SOP Document'
          }
        ],
        actionableRecommendations: [
          {
            category: 'communication',
            priority: 'medium',
            recommendation: 'Improve thoroughness in addressing all guest needs',
            specificActions: ['Use structured checklists', 'Ask probing questions'],
            expectedOutcome: 'More comprehensive problem resolution',
            relatedSOPs: ['overbooking']
          }
        ],
        resources: [
          {
            type: 'training_material',
            title: 'Communication Excellence Workshop',
            description: 'Interactive training on effective guest communication',
            relevance: 'Helps improve communication completeness',
            source: 'Training Department'
          }
        ],
        nextSteps: [
          'Practice completing all required steps in similar scenarios',
          'Focus on communication improvements as the highest priority',
          'Schedule follow-up training sessions to practice weak areas',
          'Review relevant SOP sections before your next shift'
        ]
      };

      const formatted = feedbackAgent.formatFeedbackForDisplay(mockFeedbackOutput);

      expect(formatted).toContain('# Training Session Feedback');
      expect(formatted).toContain('## Overall Performance: B (82/100)');
      expect(formatted).toContain('### Key Strengths');
      expect(formatted).toContain('### Primary Areas for Improvement');
      expect(formatted).toContain('## Detailed Performance Analysis');
      expect(formatted).toContain('### Policy Adherence: 82/100 (stable)');
      expect(formatted).toContain('## Relevant Policy References');
      expect(formatted).toContain('## Actionable Recommendations');
      expect(formatted).toContain('## Recommended Resources');
      expect(formatted).toContain('## Next Steps');
    });

    it('should handle empty sections gracefully', async () => {
      const minimalFeedback: FeedbackOutput = {
        overallPerformance: {
          score: 75,
          grade: 'C',
          summary: 'Basic performance',
          keyStrengths: [],
          primaryAreasForImprovement: [],
          sessionCompletion: {
            stepsCompleted: 2,
            totalSteps: 5,
            completionRate: 40,
            criticalErrorCount: 1
          }
        },
        detailedAnalysis: {
          policyAdherence: {
            score: 75,
            trend: 'stable',
            strengths: [],
            weaknesses: [],
            specificExamples: { positive: [], negative: [] },
            improvementOpportunities: []
          },
          empathyIndex: {
            score: 75,
            trend: 'stable',
            strengths: [],
            weaknesses: [],
            specificExamples: { positive: [], negative: [] },
            improvementOpportunities: []
          },
          completeness: {
            score: 75,
            trend: 'stable',
            strengths: [],
            weaknesses: [],
            specificExamples: { positive: [], negative: [] },
            improvementOpportunities: []
          },
          escalationJudgment: {
            score: 75,
            trend: 'stable',
            strengths: [],
            weaknesses: [],
            specificExamples: { positive: [], negative: [] },
            improvementOpportunities: []
          },
          timeEfficiency: {
            score: 75,
            trend: 'stable',
            strengths: [],
            weaknesses: [],
            specificExamples: { positive: [], negative: [] },
            improvementOpportunities: []
          }
        },
        sopCitations: [],
        actionableRecommendations: [],
        resources: [],
        nextSteps: []
      };

      const formatted = feedbackAgent.formatFeedbackForDisplay(minimalFeedback);

      expect(formatted).toContain('# Training Session Feedback');
      expect(formatted).toContain('Basic performance');
      expect(formatted).not.toContain('### Key Strengths');
      expect(formatted).not.toContain('## Relevant Policy References');
    });
  });

  describe('createFallbackFeedback', () => {
    it('should create fallback feedback when generation fails', () => {
      const fallback = feedbackAgent.createFallbackFeedback(mockFeedbackInput);

      expect(fallback).toBeDefined();
      expect(fallback.overallPerformance.score).toBe(mockFeedbackInput.overallScore);
      expect(fallback.overallPerformance.summary).toContain('unavailable due to system limitations');
      expect(fallback.actionableRecommendations).toHaveLength(1);
      expect(fallback.resources).toHaveLength(1);
      expect(fallback.nextSteps).toHaveLength(3);
    });

    it('should assign appropriate grade based on score', () => {
      const highScoreInput = { ...mockFeedbackInput, overallScore: 85 };
      const lowScoreInput = { ...mockFeedbackInput, overallScore: 65 };

      const highScoreFallback = feedbackAgent.createFallbackFeedback(highScoreInput);
      const lowScoreFallback = feedbackAgent.createFallbackFeedback(lowScoreInput);

      expect(highScoreFallback.overallPerformance.grade).toBe('B');
      expect(lowScoreFallback.overallPerformance.grade).toBe('D');
    });
  });

  describe('SOP Citation Quality', () => {
    it('should generate accurate SOP citations with proper context', async () => {
      mockLLM.invoke.mockResolvedValueOnce(new AIMessage(`
        GRADE: B
        SUMMARY: Good performance with proper policy application.
        KEY_STRENGTHS:
        - Applied overbooking protocols correctly
        PRIMARY_IMPROVEMENT_AREAS:
        - Could improve response timing
      `));

      const result = await feedbackAgent.generateFeedback(mockFeedbackInput);

      expect(result.sopCitations).toHaveLength(2);
      
      const firstCitation = result.sopCitations[0];
      expect(firstCitation.section).toBe('overbooking');
      expect(firstCitation.content).toContain('overbooking situations');
      expect(firstCitation.relevance).toContain('overbooking');
      expect(firstCitation.applicationExample).toContain('when');
      expect(firstCitation.source).toBe('sop');
    });

    it('should provide relevant application examples for SOPs', async () => {
      mockLLM.invoke.mockResolvedValueOnce(new AIMessage(`
        GRADE: B
        SUMMARY: Good performance overall.
        KEY_STRENGTHS:
        - Proper protocol application
        PRIMARY_IMPROVEMENT_AREAS:
        - Minor improvements needed
      `));

      const result = await feedbackAgent.generateFeedback(mockFeedbackInput);

      result.sopCitations.forEach(citation => {
        expect(citation.applicationExample).toBeTruthy();
        expect(citation.applicationExample.length).toBeGreaterThan(10);
        expect(citation.relevance).toBeTruthy();
        expect(citation.relevance.length).toBeGreaterThan(10);
      });
    });
  });

  describe('Recommendation Quality', () => {
    it('should prioritize recommendations based on performance gaps', async () => {
      const inputWithCriticalGaps: FeedbackInput = {
        ...mockFeedbackInput,
        allScores: [
          {
            policy_adherence: 30, // Critical
            empathy_index: 65,    // Moderate
            completeness: 85,     // Good
            escalation_judgment: 40, // Critical
            time_efficiency: 75   // Good
          }
        ],
        criticalErrors: ['Blaming the guest'],
        overallScore: 55
      };

      mockLLM.invoke.mockResolvedValueOnce(new AIMessage(`
        GRADE: D
        SUMMARY: Critical performance issues requiring immediate attention.
        KEY_STRENGTHS:
        - Attempted to help guest
        PRIMARY_IMPROVEMENT_AREAS:
        - Critical policy violations
        - Poor escalation judgment
      `));

      const result = await feedbackAgent.generateFeedback(inputWithCriticalGaps);

      const highPriorityRecs = result.actionableRecommendations.filter(rec => rec.priority === 'high');
      expect(highPriorityRecs.length).toBeGreaterThan(0);

      // Should include critical error recommendation
      const criticalErrorRec = result.actionableRecommendations.find(rec => 
        rec.recommendation.includes('critical errors')
      );
      expect(criticalErrorRec).toBeDefined();
      expect(criticalErrorRec?.priority).toBe('high');
    });

    it('should provide specific actionable steps for each recommendation', async () => {
      mockLLM.invoke.mockResolvedValueOnce(new AIMessage(`
        GRADE: C
        SUMMARY: Moderate performance with improvement opportunities.
        KEY_STRENGTHS:
        - Basic communication skills
        PRIMARY_IMPROVEMENT_AREAS:
        - Policy knowledge gaps
        - Efficiency improvements needed
      `));

      const result = await feedbackAgent.generateFeedback(mockFeedbackInput);

      result.actionableRecommendations.forEach(rec => {
        expect(rec.specificActions).toBeDefined();
        expect(rec.specificActions.length).toBeGreaterThan(0);
        expect(rec.expectedOutcome).toBeTruthy();
        expect(rec.expectedOutcome.length).toBeGreaterThan(10);
        
        rec.specificActions.forEach(action => {
          expect(action).toBeTruthy();
          expect(action.length).toBeGreaterThan(5);
        });
      });
    });
  });
});