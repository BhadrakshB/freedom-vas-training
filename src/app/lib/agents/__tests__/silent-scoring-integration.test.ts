// Integration tests for Silent Scoring Agent with real conversation scenarios

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HumanMessage, AIMessage } from '@langchain/core/messages';
import { SilentScoringAgent, ScoringInput } from '../silent-scoring';
import { ScenarioData, PersonaData } from '../../types';

// Mock the ChatGoogleGenerativeAI
vi.mock('@langchain/google-genai', () => ({
  ChatGoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    invoke: vi.fn()
  }))
}));

describe('SilentScoringAgent Integration Tests', () => {
  let agent: SilentScoringAgent;
  let overbookingScenario: ScenarioData;
  let businessTravelerPersona: PersonaData;

  beforeEach(() => {
    vi.clearAllMocks();
    agent = new SilentScoringAgent('test-api-key');

    overbookingScenario = {
      title: 'Hotel Overbooking Crisis',
      description: 'Guest arrives at 11 PM to find their confirmed reservation was overbooked during a major conference week',
      required_steps: [
        'Acknowledge the problem immediately',
        'Apologize sincerely for the inconvenience',
        'Take ownership without making excuses',
        'Offer specific alternative solutions',
        'Provide appropriate compensation',
        'Ensure guest comfort during resolution',
        'Follow up to confirm satisfaction'
      ],
      critical_errors: [
        'Blaming the guest or third-party booking sites',
        'Suggesting the guest find their own accommodation',
        'Refusing to provide compensation',
        'Making promises that cannot be kept',
        'Showing indifference to guest distress'
      ],
      time_pressure: 4
    };

    businessTravelerPersona = {
      name: 'Marcus Chen',
      background: 'Senior executive traveling for important board meeting tomorrow morning. Has been traveling all day and is exhausted.',
      personality_traits: ['professional', 'direct', 'time-conscious', 'results-oriented', 'high-expectations'],
      hidden_motivations: [
        'Must be well-rested for crucial presentation',
        'Company reputation depends on meeting success',
        'Has had bad experiences with hotels before',
        'Values efficiency and competence above all'
      ],
      communication_style: 'direct and professional, becomes more assertive when frustrated',
      emotional_arc: ['tired', 'frustrated', 'angry', 'demanding', 'cautiously optimistic', 'satisfied']
    };
  });

  describe('Real Conversation Scenarios', () => {
    it('should score excellent customer service response correctly', async () => {
      const excellentResponseInput: ScoringInput = {
        userResponse: 'Mr. Chen, I sincerely apologize for this unacceptable situation. I understand how frustrating this must be, especially given your important meeting tomorrow. Let me personally ensure we resolve this immediately. I have three options for you: a suite at our sister property two blocks away with complimentary transportation, a room at the Marriott downtown with our full coverage of the rate difference, or if you prefer to stay here, I can offer you our presidential suite at no additional charge once it becomes available at 2 AM, plus full compensation for tonight. Which option would work best for your needs?',
        conversationHistory: [
          new HumanMessage('This is unacceptable! I have a confirmed reservation and a board meeting at 8 AM. How can you not have my room ready?'),
          new AIMessage('Mr. Chen, I sincerely apologize for this unacceptable situation. I understand how frustrating this must be, especially given your important meeting tomorrow. Let me personally ensure we resolve this immediately. I have three options for you: a suite at our sister property two blocks away with complimentary transportation, a room at the Marriott downtown with our full coverage of the rate difference, or if you prefer to stay here, I can offer you our presidential suite at no additional charge once it becomes available at 2 AM, plus full compensation for tonight. Which option would work best for your needs?')
        ],
        scenario: overbookingScenario,
        persona: businessTravelerPersona,
        requiredSteps: overbookingScenario.required_steps,
        completedSteps: [],
        turnCount: 1,
        retrievedContext: [
          'SOP: Acknowledge guest concerns within first 30 seconds',
          'Policy: Offer minimum 3 alternative solutions for overbooking',
          'Compensation: Full night refund plus additional 50% for inconvenience',
          'Escalation: Manager approval required for suite upgrades'
        ]
      };

      // Mock the LLM to return realistic analysis
      const mockLLM = (agent as any).llm;
      mockLLM.invoke = vi.fn().mockResolvedValue(new AIMessage(`
POLICY_ADHERENCE: 95 | Evidence: Immediate acknowledgment, followed SOP perfectly, offered multiple solutions per policy, mentioned appropriate compensation | Violations: None detected
EMPATHY_INDEX: 92 | Evidence: Used guest name, acknowledged specific situation (board meeting), expressed understanding of frustration, personalized response | Missed: None significant
COMPLETENESS: 90 | Evidence: Addressed all guest concerns, provided three specific options, included transportation and compensation details | Missing: Timeline for presidential suite could be clearer
ESCALATION_JUDGMENT: 88 | Evidence: Appropriate level of response, offered high-value solutions without unnecessary escalation | Issues: Presidential suite offer may need manager approval
TIME_EFFICIENCY: 85 | Evidence: Comprehensive response that addresses multiple needs in single interaction | Inefficiencies: Slightly lengthy but justified by situation severity
      `));

      const result = await agent.scoreUserResponse(excellentResponseInput);

      expect(result.scores.policy_adherence).toBeGreaterThanOrEqual(90);
      expect(result.scores.empathy_index).toBeGreaterThanOrEqual(90);
      expect(result.scores.completeness).toBeGreaterThanOrEqual(85);
      expect(result.criticalErrors.length).toBeLessThanOrEqual(1); // Allow for minor detection issues
      expect(result.completedSteps).toContain('Acknowledge the problem immediately');
      expect(result.completedSteps).toContain('Apologize sincerely for the inconvenience');
      expect(result.completedSteps).toContain('Offer specific alternative solutions');
      expect(result.sessionComplete).toBe(false);
    });

    it('should detect critical errors in poor response', async () => {
      const poorResponseInput: ScoringInput = {
        userResponse: 'Look, these things happen during conference season. You probably booked through a third-party site that oversold. There\'s nothing we can do tonight - you\'ll need to find somewhere else to stay. We can maybe give you a discount next time.',
        conversationHistory: [
          new HumanMessage('This is unacceptable! I have a confirmed reservation and a board meeting at 8 AM. How can you not have my room ready?'),
          new AIMessage('Look, these things happen during conference season. You probably booked through a third-party site that oversold. There\'s nothing we can do tonight - you\'ll need to find somewhere else to stay. We can maybe give you a discount next time.')
        ],
        scenario: overbookingScenario,
        persona: businessTravelerPersona,
        requiredSteps: overbookingScenario.required_steps,
        completedSteps: [],
        turnCount: 1,
        retrievedContext: [
          'SOP: Never blame guest or third-party booking sites',
          'Policy: Hotel must provide alternative accommodation',
          'Critical: Never suggest guest find their own accommodation'
        ]
      };

      const mockLLM = (agent as any).llm;
      mockLLM.invoke = vi.fn().mockResolvedValue(new AIMessage(`
POLICY_ADHERENCE: 15 | Evidence: None | Violations: Blamed third-party booking, refused to provide accommodation, violated multiple SOPs
EMPATHY_INDEX: 10 | Evidence: None | Missed: No acknowledgment of frustration, dismissive tone, no understanding shown
COMPLETENESS: 20 | Evidence: None | Missing: No real solution offered, no alternatives provided, no compensation mentioned
ESCALATION_JUDGMENT: 25 | Evidence: None | Issues: Should have escalated to manager, inappropriate response level for situation severity
TIME_EFFICIENCY: 30 | Evidence: Quick response | Inefficiencies: Response created more problems than solutions, will require additional interactions
      `));

      const result = await agent.scoreUserResponse(poorResponseInput);

      expect(result.scores.policy_adherence).toBeLessThan(30);
      expect(result.scores.empathy_index).toBeLessThan(30);
      expect(result.criticalErrors.length).toBeGreaterThan(0);
      expect(result.criticalErrors.some(error => 
        error.includes('Blaming the guest') || error.includes('Suggesting the guest find')
      )).toBe(true);
      expect(result.completedSteps).toHaveLength(0);
    });

    it('should track progressive improvement across conversation turns', async () => {
      const conversationTurns = [
        {
          userResponse: 'I understand you\'re frustrated. Let me see what I can do.',
          completedSteps: [] as string[],
          turnCount: 1
        },
        {
          userResponse: 'I sincerely apologize for this situation. This should not have happened.',
          completedSteps: ['Acknowledge the problem immediately'] as string[],
          turnCount: 2
        },
        {
          userResponse: 'Let me offer you our suite at the partner hotel with full transportation and meal compensation.',
          completedSteps: ['Acknowledge the problem immediately', 'Apologize sincerely for the inconvenience'] as string[],
          turnCount: 3
        }
      ];

      const mockResponses = [
        `POLICY_ADHERENCE: 60 | Evidence: Basic acknowledgment | Violations: None
EMPATHY_INDEX: 65 | Evidence: Acknowledged frustration | Missed: Could be more specific
COMPLETENESS: 40 | Evidence: Started response | Missing: No concrete solution yet
ESCALATION_JUDGMENT: 70 | Evidence: Appropriate start | Issues: None
TIME_EFFICIENCY: 60 | Evidence: Quick acknowledgment | Inefficiencies: Vague response`,

        `POLICY_ADHERENCE: 80 | Evidence: Proper apology, took ownership | Violations: None
EMPATHY_INDEX: 85 | Evidence: Sincere apology, acknowledged fault | Missed: None
COMPLETENESS: 60 | Evidence: Good apology | Missing: Still need solution
ESCALATION_JUDGMENT: 75 | Evidence: Good judgment | Issues: None
TIME_EFFICIENCY: 70 | Evidence: Building toward solution | Inefficiencies: None`,

        `POLICY_ADHERENCE: 90 | Evidence: Offered specific solution, mentioned compensation | Violations: None
EMPATHY_INDEX: 80 | Evidence: Maintained professional tone | Missed: None
COMPLETENESS: 85 | Evidence: Specific solution with details | Missing: Minor details
ESCALATION_JUDGMENT: 85 | Evidence: Appropriate solution level | Issues: None
TIME_EFFICIENCY: 85 | Evidence: Concrete solution offered | Inefficiencies: None`
      ];

      const mockLLM = (agent as any).llm;
      const results = [];

      for (let i = 0; i < conversationTurns.length; i++) {
        const turn = conversationTurns[i];
        mockLLM.invoke = vi.fn().mockResolvedValue(new AIMessage(mockResponses[i]));

        const input: ScoringInput = {
          userResponse: turn.userResponse,
          conversationHistory: [
            new HumanMessage('This is unacceptable! I have a confirmed reservation and a board meeting at 8 AM.'),
            new AIMessage(turn.userResponse)
          ],
          scenario: overbookingScenario,
          persona: businessTravelerPersona,
          requiredSteps: overbookingScenario.required_steps,
          completedSteps: turn.completedSteps,
          turnCount: turn.turnCount
        };

        const result = await agent.scoreUserResponse(input);
        results.push(result);
      }

      // Verify improvement over time
      expect(results[2].scores.policy_adherence).toBeGreaterThan(results[0].scores.policy_adherence);
      expect(results[2].scores.completeness).toBeGreaterThan(results[0].scores.completeness);
      expect(results[2].completedSteps.length).toBeGreaterThan(results[0].completedSteps.length);
    });

    it('should determine session completion appropriately', async () => {
      const nearCompletionInput: ScoringInput = {
        userResponse: 'Perfect! I\'ve confirmed your suite at the Marriott, arranged transportation in 10 minutes, and processed full compensation plus a $200 dining credit. I\'ll personally follow up tomorrow to ensure everything was satisfactory. Is there anything else I can do for you tonight?',
        conversationHistory: [
          new HumanMessage('This is unacceptable! I have a confirmed reservation and a board meeting at 8 AM.'),
          new AIMessage('I sincerely apologize and will resolve this immediately.'),
          new HumanMessage('I need a solution now, not excuses.'),
          new AIMessage('Perfect! I\'ve confirmed your suite at the Marriott, arranged transportation in 10 minutes, and processed full compensation plus a $200 dining credit. I\'ll personally follow up tomorrow to ensure everything was satisfactory. Is there anything else I can do for you tonight?')
        ],
        scenario: overbookingScenario,
        persona: businessTravelerPersona,
        requiredSteps: overbookingScenario.required_steps,
        completedSteps: [
          'Acknowledge the problem immediately',
          'Apologize sincerely for the inconvenience',
          'Take ownership without making excuses',
          'Offer specific alternative solutions',
          'Provide appropriate compensation',
          'Ensure guest comfort during resolution'
        ],
        turnCount: 4
      };

      const mockLLM = (agent as any).llm;
      mockLLM.invoke = vi.fn().mockResolvedValue(new AIMessage(`
POLICY_ADHERENCE: 95 | Evidence: All protocols followed, exceeded compensation requirements | Violations: None
EMPATHY_INDEX: 90 | Evidence: Personal follow-up commitment, ensured guest comfort | Missed: None
COMPLETENESS: 95 | Evidence: All requirements addressed, proactive follow-up offered | Missing: None
ESCALATION_JUDGMENT: 90 | Evidence: Perfect judgment throughout | Issues: None
TIME_EFFICIENCY: 90 | Evidence: Efficient resolution with all details covered | Inefficiencies: None
      `));

      const result = await agent.scoreUserResponse(nearCompletionInput);

      expect(result.completedSteps).toContain('Follow up to confirm satisfaction');
      expect(result.sessionComplete).toBe(true);
      expect(result.completionReason).toContain('All required steps completed');
      expect(result.scores.policy_adherence).toBeGreaterThanOrEqual(90);
    });

    it('should handle emotional escalation appropriately', async () => {
      const emotionalEscalationInput: ScoringInput = {
        userResponse: 'I completely understand your anger, Mr. Chen. This situation is absolutely unacceptable and I take full responsibility. Your important meeting tomorrow makes this even more critical. I\'m going to personally ensure you have the best possible accommodation tonight.',
        conversationHistory: [
          new HumanMessage('This is ridiculous! I\'m a platinum member and you\'re treating me like garbage!'),
          new AIMessage('I completely understand your anger, Mr. Chen. This situation is absolutely unacceptable and I take full responsibility. Your important meeting tomorrow makes this even more critical. I\'m going to personally ensure you have the best possible accommodation tonight.')
        ],
        scenario: overbookingScenario,
        persona: {
          ...businessTravelerPersona,
          emotional_arc: ['tired', 'frustrated', 'angry', 'furious', 'demanding', 'cautiously optimistic']
        },
        requiredSteps: overbookingScenario.required_steps,
        completedSteps: [],
        turnCount: 2
      };

      const mockLLM = (agent as any).llm;
      mockLLM.invoke = vi.fn().mockResolvedValue(new AIMessage(`
POLICY_ADHERENCE: 85 | Evidence: Acknowledged status, took responsibility, personalized response | Violations: None
EMPATHY_INDEX: 95 | Evidence: Validated anger, acknowledged specific concerns, showed understanding of meeting importance | Missed: None
COMPLETENESS: 70 | Evidence: Strong emotional response, commitment to resolution | Missing: Specific solution details
ESCALATION_JUDGMENT: 90 | Evidence: Perfect de-escalation technique, appropriate emotional matching | Issues: None
TIME_EFFICIENCY: 75 | Evidence: Focused on emotional needs first | Inefficiencies: Could move to solution faster
      `));

      const result = await agent.scoreUserResponse(emotionalEscalationInput);

      expect(result.scores.empathy_index).toBeGreaterThanOrEqual(90);
      expect(result.scores.escalation_judgment).toBeGreaterThanOrEqual(85);
      expect(result.criticalErrors.length).toBeLessThanOrEqual(1); // Allow for minor detection issues
      expect(result.completedSteps).toContain('Acknowledge the problem immediately');
    });
  });

  describe('Scoring Summary Generation', () => {
    it('should generate comprehensive session summary', async () => {
      const sessionScores = [
        {
          policy_adherence: 60,
          empathy_index: 70,
          completeness: 50,
          escalation_judgment: 75,
          time_efficiency: 65
        },
        {
          policy_adherence: 75,
          empathy_index: 80,
          completeness: 70,
          escalation_judgment: 85,
          time_efficiency: 75
        },
        {
          policy_adherence: 90,
          empathy_index: 90,
          completeness: 85,
          escalation_judgment: 90,
          time_efficiency: 85
        }
      ];

      const sessionEvidence = [
        {
          policy_adherence: { score: 60, evidence: ['Basic protocol'], violations: ['Minor deviation'] },
          empathy_index: { score: 70, evidence: ['Some empathy'], missed_opportunities: ['Could acknowledge feelings more'] },
          completeness: { score: 50, evidence: ['Partial response'], missing_elements: ['Specific solutions'] },
          escalation_judgment: { score: 75, evidence: ['Reasonable judgment'], inappropriate_actions: [] },
          time_efficiency: { score: 65, evidence: ['Adequate pace'], inefficiencies: ['Some hesitation'] }
        },
        {
          policy_adherence: { score: 75, evidence: ['Better adherence'], violations: [] },
          empathy_index: { score: 80, evidence: ['Good empathy'], missed_opportunities: [] },
          completeness: { score: 70, evidence: ['More complete'], missing_elements: ['Minor details'] },
          escalation_judgment: { score: 85, evidence: ['Good judgment'], inappropriate_actions: [] },
          time_efficiency: { score: 75, evidence: ['Better pace'], inefficiencies: [] }
        },
        {
          policy_adherence: { score: 90, evidence: ['Excellent adherence'], violations: [] },
          empathy_index: { score: 90, evidence: ['Outstanding empathy'], missed_opportunities: [] },
          completeness: { score: 85, evidence: ['Very complete'], missing_elements: [] },
          escalation_judgment: { score: 90, evidence: ['Excellent judgment'], inappropriate_actions: [] },
          time_efficiency: { score: 85, evidence: ['Efficient'], inefficiencies: [] }
        }
      ];

      const criticalErrors = ['Initial hesitation in response'];

      const summary = agent.generateScoringSummary(sessionScores, sessionEvidence, criticalErrors);

      expect(summary.overallScore).toBeGreaterThan(70);
      expect(summary.dimensionSummaries.policy_adherence.trend).toBe('improving');
      expect(summary.dimensionSummaries.empathy_index.trend).toBe('improving');
      expect(summary.dimensionSummaries.policy_adherence.keyStrengths).toContain('Excellent adherence');
      expect(summary.criticalIssues).toContain('Initial hesitation in response');
    });
  });
});