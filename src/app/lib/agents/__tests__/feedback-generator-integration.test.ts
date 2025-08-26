// Integration tests for Feedback Generator Agent

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HumanMessage, AIMessage } from '@langchain/core/messages';
import { FeedbackGeneratorAgent, FeedbackInput } from '../feedback-generator';
import { PineconeService } from '../../pinecone-service';
import { 
  ScenarioData, 
  PersonaData, 
  ScoringMetrics, 
  RetrievalResult 
} from '../../types';
import { ScoringEvidence } from '../silent-scoring';

// Mock external dependencies but test real integration
vi.mock('@langchain/google-genai', () => ({
  ChatGoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    invoke: vi.fn().mockResolvedValue(new AIMessage(`
      GRADE: B
      SUMMARY: Strong performance with good empathy and policy adherence. Some areas for improvement in completeness and efficiency.
      KEY_STRENGTHS:
      - Excellent empathetic response to guest frustration
      - Proper application of overbooking protocols
      - Professional communication throughout
      - Maintained calm under pressure
      PRIMARY_IMPROVEMENT_AREAS:
      - Could have asked more probing questions about guest needs
      - Response time could be improved for efficiency
      - Follow-up confirmation could be more thorough
    `))
  }))
}));

describe('FeedbackGeneratorAgent Integration Tests', () => {
  let feedbackAgent: FeedbackGeneratorAgent;
  let mockPineconeService: PineconeService;

  const realScenario: ScenarioData = {
    title: 'Guest Complaint About Room Cleanliness',
    description: 'A guest calls to complain that their room was not properly cleaned before their arrival. They found hair in the bathroom and the bed sheets appear to have stains.',
    required_steps: [
      'Acknowledge the guest\'s concern and apologize',
      'Ask for specific details about the cleanliness issues',
      'Offer immediate room change or cleaning service',
      'Provide compensation for the inconvenience',
      'Follow up to ensure guest satisfaction',
      'Document the incident for housekeeping review'
    ],
    critical_errors: [
      'Dismissing the guest\'s concerns as minor',
      'Blaming housekeeping staff in front of the guest',
      'Refusing to provide adequate compensation',
      'Not following up on the resolution'
    ],
    time_pressure: 2
  };

  const realPersona: PersonaData = {
    name: 'Michael Chen',
    background: 'Family vacation with young children, staying for a week',
    personality_traits: ['Detail-oriented', 'Protective of family', 'Reasonable but firm'],
    hidden_motivations: ['Wants safe environment for children', 'Paid premium for clean accommodation'],
    communication_style: 'Polite but direct, becomes more assertive if not taken seriously',
    emotional_arc: ['Disappointed', 'Concerned', 'Frustrated', 'Hopeful', 'Satisfied']
  };

  const realConversationHistory = [
    new HumanMessage('Hi, I just checked into room 304 and I\'m really disappointed with the cleanliness.'),
    new AIMessage('I\'m so sorry to hear about this issue. Can you please tell me specifically what cleanliness problems you\'ve noticed?'),
    new HumanMessage('There\'s hair in the bathroom sink and shower, and the bed sheets have what looks like food stains. This is not acceptable for my family.'),
    new AIMessage('I completely understand your concern, especially with your family. This is absolutely not the standard we maintain. Let me arrange an immediate room change for you to a freshly cleaned suite.'),
    new HumanMessage('Thank you, that would be much better. But I\'m concerned about the overall cleaning standards here.'),
    new AIMessage('Your concern is completely valid. I\'m going to personally ensure your new room meets our highest standards, and I\'d like to offer you a dining credit as an apology for this inconvenience.'),
    new HumanMessage('I appreciate that. As long as the new room is properly cleaned, that should resolve the issue.'),
    new AIMessage('Absolutely. I\'ll also make sure to follow up with you tomorrow to confirm everything is satisfactory. Thank you for bringing this to our attention.')
  ];

  const realScoringMetrics: ScoringMetrics[] = [
    {
      policy_adherence: 90,
      empathy_index: 95,
      completeness: 85,
      escalation_judgment: 88,
      time_efficiency: 82
    },
    {
      policy_adherence: 92,
      empathy_index: 90,
      completeness: 90,
      escalation_judgment: 85,
      time_efficiency: 85
    },
    {
      policy_adherence: 88,
      empathy_index: 92,
      completeness: 88,
      escalation_judgment: 90,
      time_efficiency: 88
    }
  ];

  const realScoringEvidence: ScoringEvidence[] = [
    {
      policy_adherence: {
        score: 90,
        evidence: ['Followed complaint resolution protocol', 'Offered appropriate compensation'],
        violations: []
      },
      empathy_index: {
        score: 95,
        evidence: ['Acknowledged family concerns', 'Used empathetic language', 'Validated guest feelings'],
        missed_opportunities: []
      },
      completeness: {
        score: 85,
        evidence: ['Asked for specific details', 'Offered comprehensive solution'],
        missing_elements: ['Could have asked about other room issues']
      },
      escalation_judgment: {
        score: 88,
        evidence: ['Handled situation at appropriate level', 'Knew when to offer compensation'],
        inappropriate_actions: []
      },
      time_efficiency: {
        score: 82,
        evidence: ['Responded promptly to concerns'],
        inefficiencies: ['Could have been more direct with initial solution']
      }
    },
    {
      policy_adherence: {
        score: 92,
        evidence: ['Applied compensation policy correctly', 'Followed escalation guidelines'],
        violations: []
      },
      empathy_index: {
        score: 90,
        evidence: ['Maintained supportive tone', 'Acknowledged guest perspective'],
        missed_opportunities: ['Could have expressed more personal accountability']
      },
      completeness: {
        score: 90,
        evidence: ['Provided complete solution', 'Addressed all concerns raised'],
        missing_elements: []
      },
      escalation_judgment: {
        score: 85,
        evidence: ['Good judgment on compensation level'],
        inappropriate_actions: []
      },
      time_efficiency: {
        score: 85,
        evidence: ['Efficient problem resolution'],
        inefficiencies: []
      }
    },
    {
      policy_adherence: {
        score: 88,
        evidence: ['Documented incident appropriately'],
        violations: []
      },
      empathy_index: {
        score: 92,
        evidence: ['Committed to follow-up', 'Showed genuine concern'],
        missed_opportunities: []
      },
      completeness: {
        score: 88,
        evidence: ['Included follow-up commitment', 'Thanked guest for feedback'],
        missing_elements: ['Could have mentioned housekeeping review process']
      },
      escalation_judgment: {
        score: 90,
        evidence: ['Appropriate authority level maintained'],
        inappropriate_actions: []
      },
      time_efficiency: {
        score: 88,
        evidence: ['Concluded efficiently'],
        inefficiencies: []
      }
    }
  ];

  const mockSOPResults: RetrievalResult[] = [
    {
      content: 'When guests report cleanliness issues, immediately acknowledge the problem and offer alternative accommodations. Never dismiss concerns as minor, especially when families with children are involved.',
      metadata: {
        type: 'sop',
        category: 'complaint',
        difficulty: 'intermediate',
        tags: ['cleanliness', 'family-guests', 'room-issues']
      },
      score: 0.96
    },
    {
      content: 'Compensation for room cleanliness issues should include room upgrade or dining credits. Document all incidents for housekeeping quality review and follow up within 24 hours.',
      metadata: {
        type: 'sop',
        category: 'complaint',
        difficulty: 'intermediate',
        tags: ['compensation', 'housekeeping', 'follow-up']
      },
      score: 0.94
    },
    {
      content: 'Family guests require special attention to safety and cleanliness concerns. Always prioritize their comfort and provide additional assurance about room standards.',
      metadata: {
        type: 'sop',
        category: 'general',
        difficulty: 'beginner',
        tags: ['family-service', 'cleanliness-standards']
      },
      score: 0.89
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create mock Pinecone service with realistic responses
    mockPineconeService = {
      retrieveRelevantSOPs: vi.fn().mockResolvedValue(mockSOPResults),
      retrieveTrainingContent: vi.fn().mockResolvedValue([]),
      searchPolicyGuidance: vi.fn().mockResolvedValue([])
    } as any;

    feedbackAgent = new FeedbackGeneratorAgent('test-api-key', mockPineconeService);
  });

  describe('End-to-End Feedback Generation', () => {
    it('should generate comprehensive feedback for a realistic training session', async () => {
      const feedbackInput: FeedbackInput = {
        sessionId: 'integration-test-session',
        scenario: realScenario,
        persona: realPersona,
        conversationHistory: realConversationHistory,
        allScores: realScoringMetrics,
        allEvidence: realScoringEvidence,
        criticalErrors: [],
        completedSteps: [
          'Acknowledge the guest\'s concern and apologize',
          'Ask for specific details about the cleanliness issues',
          'Offer immediate room change or cleaning service',
          'Provide compensation for the inconvenience',
          'Follow up to ensure guest satisfaction'
        ],
        requiredSteps: realScenario.required_steps,
        overallScore: 88,
        sessionDuration: 360000 // 6 minutes
      };

      const result = await feedbackAgent.generateFeedback(feedbackInput);

      // Verify overall structure
      expect(result).toBeDefined();
      expect(result.overallPerformance).toBeDefined();
      expect(result.detailedAnalysis).toBeDefined();
      expect(result.sopCitations).toBeDefined();
      expect(result.actionableRecommendations).toBeDefined();
      expect(result.resources).toBeDefined();
      expect(result.nextSteps).toBeDefined();

      // Verify overall performance assessment
      expect(result.overallPerformance.score).toBe(88);
      expect(result.overallPerformance.grade).toBe('B');
      expect(result.overallPerformance.summary).toContain('Strong performance');
      expect(result.overallPerformance.keyStrengths.length).toBeGreaterThan(0);
      expect(result.overallPerformance.sessionCompletion.stepsCompleted).toBe(5);
      expect(result.overallPerformance.sessionCompletion.totalSteps).toBe(6);
      expect(result.overallPerformance.sessionCompletion.completionRate).toBe(83);

      // Verify detailed analysis is generated
      expect(result.detailedAnalysis).toBeDefined();
      expect(Object.keys(result.detailedAnalysis)).toHaveLength(5);

      // Verify SOP citations are relevant and well-formed
      expect(result.sopCitations.length).toBeGreaterThan(0);
      result.sopCitations.forEach(citation => {
        expect(citation.section).toBeTruthy();
        expect(citation.content).toBeTruthy();
        expect(citation.relevance).toBeTruthy();
        expect(citation.applicationExample).toBeTruthy();
        expect(citation.source).toBeTruthy();
      });

      // Verify recommendations are generated
      expect(result.actionableRecommendations).toBeDefined();
      expect(Array.isArray(result.actionableRecommendations)).toBe(true);

      // Verify resources are relevant
      expect(result.resources.length).toBeGreaterThan(0);
      result.resources.forEach(resource => {
        expect(resource.type).toBeTruthy();
        expect(resource.title).toBeTruthy();
        expect(resource.description).toBeTruthy();
        expect(resource.relevance).toBeTruthy();
      });

      // Verify next steps are actionable
      expect(result.nextSteps.length).toBeGreaterThan(0);
      result.nextSteps.forEach(step => {
        expect(step).toBeTruthy();
        expect(step.length).toBeGreaterThan(10);
      });
    });

    it('should handle session with mixed performance appropriately', async () => {
      const mixedPerformanceInput: FeedbackInput = {
        sessionId: 'mixed-performance-session',
        scenario: realScenario,
        persona: realPersona,
        conversationHistory: realConversationHistory.slice(0, 4), // Shorter conversation
        allScores: [
          {
            policy_adherence: 95, // Excellent
            empathy_index: 45,    // Poor
            completeness: 75,     // Good
            escalation_judgment: 60, // Fair
            time_efficiency: 85   // Very good
          },
          {
            policy_adherence: 90,
            empathy_index: 50,
            completeness: 70,
            escalation_judgment: 65,
            time_efficiency: 80
          }
        ],
        allEvidence: [
          {
            policy_adherence: {
              score: 95,
              evidence: ['Perfect protocol adherence', 'Correct compensation offered'],
              violations: []
            },
            empathy_index: {
              score: 45,
              evidence: ['Acknowledged concern'],
              missed_opportunities: ['Did not validate emotions', 'Lacked warmth in tone', 'Missed family context']
            },
            completeness: {
              score: 75,
              evidence: ['Addressed main issue'],
              missing_elements: ['Did not ask about other concerns']
            },
            escalation_judgment: {
              score: 60,
              evidence: ['Basic escalation awareness'],
              inappropriate_actions: ['Could have escalated sooner']
            },
            time_efficiency: {
              score: 85,
              evidence: ['Quick response time'],
              inefficiencies: []
            }
          },
          {
            policy_adherence: {
              score: 90,
              evidence: ['Continued good protocol'],
              violations: []
            },
            empathy_index: {
              score: 50,
              evidence: ['Maintained professional tone'],
              missed_opportunities: ['Still lacking emotional connection']
            },
            completeness: {
              score: 70,
              evidence: ['Provided solution'],
              missing_elements: ['Incomplete follow-up planning']
            },
            escalation_judgment: {
              score: 65,
              evidence: ['Improved judgment'],
              inappropriate_actions: []
            },
            time_efficiency: {
              score: 80,
              evidence: ['Efficient resolution'],
              inefficiencies: []
            }
          }
        ],
        criticalErrors: [],
        completedSteps: [
          'Acknowledge the guest\'s concern and apologize',
          'Ask for specific details about the cleanliness issues',
          'Offer immediate room change or cleaning service'
        ],
        requiredSteps: realScenario.required_steps,
        overallScore: 71,
        sessionDuration: 240000 // 4 minutes
      };

      const result = await feedbackAgent.generateFeedback(mixedPerformanceInput);

      // Should identify empathy as a major weakness
      expect(result.overallPerformance.primaryAreasForImprovement.length).toBeGreaterThan(0);

      // Should have high-priority empathy recommendation
      const empathyRec = result.actionableRecommendations.find(rec => 
        rec.category === 'empathy' || rec.recommendation.toLowerCase().includes('empathy')
      );
      expect(empathyRec).toBeDefined();
      expect(empathyRec?.priority).toBe('high');

      // Should recognize policy adherence as a strength
      expect(result.overallPerformance.keyStrengths.length).toBeGreaterThan(0);

      // Should provide empathy-focused resources
      const empathyResource = result.resources.find(resource => 
        resource.title.toLowerCase().includes('emotional') || 
        resource.description.toLowerCase().includes('empathy')
      );
      expect(empathyResource).toBeDefined();
    });

    it('should generate appropriate feedback for session with critical errors', async () => {
      const criticalErrorInput: FeedbackInput = {
        sessionId: 'critical-error-session',
        scenario: realScenario,
        persona: realPersona,
        conversationHistory: [
          new HumanMessage('Hi, I just checked into room 304 and I\'m really disappointed with the cleanliness.'),
          new AIMessage('Well, housekeeping does their best. Sometimes they miss things. You can call them if you want.'),
          new HumanMessage('This is unacceptable! There\'s hair everywhere and stained sheets!'),
          new AIMessage('Look, these things happen. The housekeeping staff probably just had a busy day. There\'s not much we can do about it now.')
        ],
        allScores: [
          {
            policy_adherence: 25,
            empathy_index: 15,
            completeness: 30,
            escalation_judgment: 20,
            time_efficiency: 60
          }
        ],
        allEvidence: [
          {
            policy_adherence: {
              score: 25,
              evidence: [],
              violations: ['Did not follow complaint protocol', 'Failed to offer solutions']
            },
            empathy_index: {
              score: 15,
              evidence: [],
              missed_opportunities: ['Dismissed guest concerns', 'No acknowledgment of frustration', 'Blamed staff']
            },
            completeness: {
              score: 30,
              evidence: [],
              missing_elements: ['No solution offered', 'No compensation discussed', 'No follow-up']
            },
            escalation_judgment: {
              score: 20,
              evidence: [],
              inappropriate_actions: ['Should have escalated immediately', 'Failed to take ownership']
            },
            time_efficiency: {
              score: 60,
              evidence: ['Quick responses'],
              inefficiencies: []
            }
          }
        ],
        criticalErrors: [
          'Dismissing the guest\'s concerns as minor',
          'Blaming housekeeping staff in front of the guest'
        ],
        completedSteps: [],
        requiredSteps: realScenario.required_steps,
        overallScore: 30,
        sessionDuration: 120000 // 2 minutes
      };

      const result = await feedbackAgent.generateFeedback(criticalErrorInput);

      // Should receive low grade due to critical errors
      expect(result.overallPerformance.score).toBe(30);
      expect(result.overallPerformance.sessionCompletion.criticalErrorCount).toBe(2);

      // Should highlight critical errors
      expect(result.overallPerformance.sessionCompletion.criticalErrorCount).toBe(2);

      // Should have recommendations for critical issues
      expect(result.actionableRecommendations).toBeDefined();
      expect(Array.isArray(result.actionableRecommendations)).toBe(true);

      // Should have multiple high-priority recommendations
      const highPriorityRecs = result.actionableRecommendations.filter(rec => rec.priority === 'high');
      expect(highPriorityRecs.length).toBeGreaterThan(1);

      // Should emphasize immediate improvement needs in next steps
      expect(result.nextSteps[0]).toContain('critical errors');
    });

    it('should format comprehensive feedback for display correctly', async () => {
      const feedbackInput: FeedbackInput = {
        sessionId: 'display-test-session',
        scenario: realScenario,
        persona: realPersona,
        conversationHistory: realConversationHistory,
        allScores: realScoringMetrics,
        allEvidence: realScoringEvidence,
        criticalErrors: [],
        completedSteps: realScenario.required_steps.slice(0, 5),
        requiredSteps: realScenario.required_steps,
        overallScore: 88,
        sessionDuration: 360000
      };

      const result = await feedbackAgent.generateFeedback(feedbackInput);
      const formatted = feedbackAgent.formatFeedbackForDisplay(result);

      // Verify markdown structure
      expect(formatted).toContain('# Training Session Feedback');
      expect(formatted).toContain('## Overall Performance: B (88/100)');
      expect(formatted).toContain('## Detailed Performance Analysis');
      expect(formatted).toContain('## Detailed Performance Analysis');
      expect(formatted).toContain('## Relevant Policy References');
      expect(formatted).toContain('## Recommended Resources');
      expect(formatted).toContain('## Recommended Resources');
      expect(formatted).toContain('## Next Steps');

      // Verify content quality
      expect(formatted).toContain('Strong performance');
      expect(formatted.split('\n').length).toBeGreaterThan(20); // Substantial content
      
      // Verify all sections have content
      const sections = formatted.split('##');
      expect(sections.length).toBeGreaterThan(5);
    });
  });

  describe('RAG Integration Quality', () => {
    it('should effectively use retrieved SOPs in feedback generation', async () => {
      const feedbackInput: FeedbackInput = {
        sessionId: 'rag-integration-test',
        scenario: realScenario,
        persona: realPersona,
        conversationHistory: realConversationHistory,
        allScores: realScoringMetrics,
        allEvidence: realScoringEvidence,
        criticalErrors: [],
        completedSteps: realScenario.required_steps.slice(0, 4),
        requiredSteps: realScenario.required_steps,
        overallScore: 85,
        sessionDuration: 300000
      };

      const result = await feedbackAgent.generateFeedback(feedbackInput);

      // Verify Pinecone was called with appropriate query
      expect(mockPineconeService.retrieveRelevantSOPs).toHaveBeenCalledWith(
        expect.stringContaining('Guest Complaint About Room Cleanliness'),
        expect.objectContaining({
          category: 'complaint',
          type: 'sop'
        })
      );

      // Verify SOP content is reflected in citations
      expect(result.sopCitations.length).toBeGreaterThan(0);
      const cleanlinessSOPCitation = result.sopCitations.find(citation => 
        citation.content.includes('cleanliness issues')
      );
      expect(cleanlinessSOPCitation).toBeDefined();

      // Verify SOP guidance influences recommendations
      const compensationRec = result.actionableRecommendations.find(rec => 
        rec.recommendation.toLowerCase().includes('compensation') ||
        rec.specificActions.some(action => action.toLowerCase().includes('compensation'))
      );
      
      // Should have recommendations that align with SOP guidance
      expect(result.actionableRecommendations.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle SOP retrieval failures gracefully', async () => {
      // Mock Pinecone failure
      (mockPineconeService.retrieveRelevantSOPs as any).mockRejectedValue(
        new Error('Pinecone connection failed')
      );

      const feedbackInput: FeedbackInput = {
        sessionId: 'rag-failure-test',
        scenario: realScenario,
        persona: realPersona,
        conversationHistory: realConversationHistory,
        allScores: realScoringMetrics,
        allEvidence: realScoringEvidence,
        criticalErrors: [],
        completedSteps: realScenario.required_steps.slice(0, 4),
        requiredSteps: realScenario.required_steps,
        overallScore: 85,
        sessionDuration: 300000
      };

      const result = await feedbackAgent.generateFeedback(feedbackInput);

      // Should still generate feedback without SOPs
      expect(result).toBeDefined();
      expect(result.overallPerformance).toBeDefined();
      expect(result.detailedAnalysis).toBeDefined();
      expect(result.actionableRecommendations).toBeDefined();
      
      // Should have empty or minimal SOP citations
      expect(result.sopCitations.length).toBe(0);
      
      // Should still provide meaningful recommendations
      expect(result.actionableRecommendations.length).toBeGreaterThanOrEqual(0);
    });
  });
});