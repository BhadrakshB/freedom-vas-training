// Unit tests for Silent Scoring Agent

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { HumanMessage, AIMessage } from '@langchain/core/messages';
import { 
  SilentScoringAgent, 
  ScoringInput, 
  ScoringOutput, 
  ScoringEvidence 
} from '../silent-scoring';
import { ScenarioData, PersonaData, ScoringMetrics } from '../../types';

// Mock the ChatGoogleGenerativeAI
vi.mock('@langchain/google-genai', () => ({
  ChatGoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    invoke: vi.fn()
  }))
}));

describe('SilentScoringAgent', () => {
  let agent: SilentScoringAgent;
  let mockLLM: { invoke: Mock };
  let sampleScenario: ScenarioData;
  let samplePersona: PersonaData;
  let sampleInput: ScoringInput;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Create agent instance
    agent = new SilentScoringAgent('test-api-key');
    mockLLM = (agent as any).llm;

    // Sample test data
    sampleScenario = {
      title: 'Overbooking Situation',
      description: 'Guest arrives to find their reservation was overbooked',
      required_steps: [
        'Acknowledge the problem',
        'Apologize sincerely',
        'Offer alternative solutions',
        'Provide compensation',
        'Follow up'
      ],
      critical_errors: [
        'Blaming the guest',
        'Refusing to help',
        'Providing incorrect information'
      ],
      time_pressure: 3
    };

    samplePersona = {
      name: 'Sarah Johnson',
      background: 'Business traveler with important meeting tomorrow',
      personality_traits: ['professional', 'direct', 'time-conscious'],
      hidden_motivations: ['needs room tonight', 'worried about meeting'],
      communication_style: 'direct and professional',
      emotional_arc: ['frustrated', 'angry', 'hopeful', 'satisfied']
    };

    sampleInput = {
      userResponse: 'I understand this is frustrating. Let me find you alternative accommodation right away.',
      conversationHistory: [
        new HumanMessage('My reservation was cancelled and I need a room tonight!'),
        new AIMessage('I understand this is frustrating. Let me find you alternative accommodation right away.')
      ],
      scenario: sampleScenario,
      persona: samplePersona,
      requiredSteps: sampleScenario.required_steps,
      completedSteps: [],
      turnCount: 1,
      retrievedContext: ['SOP: Always acknowledge guest concerns first', 'Policy: Offer alternatives within 5 minutes']
    };
  });

  describe('scoreUserResponse', () => {
    it('should score a high-quality response correctly', async () => {
      // Mock LLM response with high scores
      const mockAnalysis = `POLICY_ADHERENCE: 85 | Evidence: Followed SOP for acknowledgment, offered alternatives | Violations: None
EMPATHY_INDEX: 90 | Evidence: Acknowledged frustration, used empathetic language | Missed: None
COMPLETENESS: 80 | Evidence: Addressed main concern, offered solution | Missing: Specific timeline
ESCALATION_JUDGMENT: 85 | Evidence: Appropriate response level, no premature escalation | Issues: None
TIME_EFFICIENCY: 85 | Evidence: Direct response, moved toward solution | Inefficiencies: None`;

      mockLLM.invoke.mockResolvedValue(new AIMessage(mockAnalysis));

      const result = await agent.scoreUserResponse(sampleInput);

      expect(result.scores.policy_adherence).toBe(85);
      expect(result.scores.empathy_index).toBe(90);
      expect(result.scores.completeness).toBe(80);
      expect(result.scores.escalation_judgment).toBe(85);
      expect(result.scores.time_efficiency).toBe(85);
      expect(result.criticalErrors).toHaveLength(0);
      expect(result.sessionComplete).toBe(false);
    });

    it('should detect critical errors in poor responses', async () => {
      const poorInput = {
        ...sampleInput,
        userResponse: 'This is your fault for not reading the terms and conditions properly.'
      };

      const mockAnalysis = `POLICY_ADHERENCE: 15 | Evidence: None | Violations: Blamed guest, violated empathy policy
EMPATHY_INDEX: 10 | Evidence: None | Missed: Failed to acknowledge feelings, blamed guest
COMPLETENESS: 20 | Evidence: None | Missing: No solution offered, no alternatives
ESCALATION_JUDGMENT: 30 | Evidence: None | Issues: Should have de-escalated instead
TIME_EFFICIENCY: 40 | Evidence: None | Inefficiencies: Created more conflict`;

      mockLLM.invoke.mockResolvedValue(new AIMessage(mockAnalysis));

      const result = await agent.scoreUserResponse(poorInput);

      expect(result.scores.policy_adherence).toBe(15);
      expect(result.scores.empathy_index).toBe(10);
      expect(result.criticalErrors.length).toBeGreaterThan(0);
      expect(result.criticalErrors[0]).toContain('Critical error detected');
    });

    it('should track completed steps correctly', async () => {
      const inputWithAcknowledgment = {
        ...sampleInput,
        userResponse: 'I sincerely apologize for this inconvenience. I understand how frustrating this must be.'
      };

      const mockAnalysis = `POLICY_ADHERENCE: 80 | Evidence: Proper apology, acknowledged issue | Violations: None
EMPATHY_INDEX: 85 | Evidence: Sincere apology, acknowledged feelings | Missed: None
COMPLETENESS: 70 | Evidence: Addressed concern | Missing: Solution not yet offered
ESCALATION_JUDGMENT: 80 | Evidence: Appropriate response | Issues: None
TIME_EFFICIENCY: 75 | Evidence: Direct acknowledgment | Inefficiencies: None`;

      mockLLM.invoke.mockResolvedValue(new AIMessage(mockAnalysis));

      const result = await agent.scoreUserResponse(inputWithAcknowledgment);

      expect(result.completedSteps).toContain('Apologize sincerely');
    });

    it('should determine session completion correctly', async () => {
      const completionInput = {
        ...sampleInput,
        completedSteps: ['Acknowledge the problem', 'Apologize sincerely', 'Offer alternative solutions', 'Provide compensation'],
        turnCount: 8
      };

      const mockAnalysis = `POLICY_ADHERENCE: 90 | Evidence: All steps followed | Violations: None
EMPATHY_INDEX: 85 | Evidence: Maintained empathy throughout | Missed: None
COMPLETENESS: 95 | Evidence: All requirements met | Missing: None
ESCALATION_JUDGMENT: 90 | Evidence: Perfect judgment | Issues: None
TIME_EFFICIENCY: 85 | Evidence: Efficient resolution | Inefficiencies: None`;

      mockLLM.invoke.mockResolvedValue(new AIMessage(mockAnalysis));

      const result = await agent.scoreUserResponse(completionInput);

      expect(result.completedSteps.length).toBeGreaterThanOrEqual(4);
      expect(result.sessionComplete).toBe(true);
      expect(result.completionReason).toMatch(/All required steps completed|Natural conclusion reached/);
    });

    it('should handle maximum turns reached', async () => {
      const maxTurnsInput = {
        ...sampleInput,
        turnCount: 20
      };

      const mockAnalysis = `POLICY_ADHERENCE: 70 | Evidence: Some adherence | Violations: None
EMPATHY_INDEX: 65 | Evidence: Some empathy shown | Missed: Could be better
COMPLETENESS: 60 | Evidence: Partial completion | Missing: Some elements
ESCALATION_JUDGMENT: 70 | Evidence: Reasonable judgment | Issues: None
TIME_EFFICIENCY: 50 | Evidence: Took too long | Inefficiencies: Extended conversation`;

      mockLLM.invoke.mockResolvedValue(new AIMessage(mockAnalysis));

      const result = await agent.scoreUserResponse(maxTurnsInput);

      expect(result.sessionComplete).toBe(true);
      expect(result.completionReason).toContain('Maximum conversation turns reached');
    });

    it('should handle LLM failures gracefully', async () => {
      mockLLM.invoke.mockRejectedValue(new Error('API Error'));

      await expect(agent.scoreUserResponse(sampleInput)).rejects.toThrow('Silent scoring failed');
    });
  });

  describe('calculateOverallScore', () => {
    it('should calculate weighted average correctly', () => {
      const scores: ScoringMetrics[] = [
        {
          policy_adherence: 80,
          empathy_index: 90,
          completeness: 70,
          escalation_judgment: 85,
          time_efficiency: 75
        },
        {
          policy_adherence: 85,
          empathy_index: 85,
          completeness: 80,
          escalation_judgment: 90,
          time_efficiency: 80
        }
      ];

      const overallScore = agent.calculateOverallScore(scores);

      // Expected: (80*0.25 + 90*0.20 + 70*0.25 + 85*0.15 + 75*0.15 + 85*0.25 + 85*0.20 + 80*0.25 + 90*0.15 + 80*0.15) / 2
      expect(overallScore).toBeGreaterThan(75);
      expect(overallScore).toBeLessThan(85);
    });

    it('should return 0 for empty scores array', () => {
      const overallScore = agent.calculateOverallScore([]);
      expect(overallScore).toBe(0);
    });
  });

  describe('generateScoringSummary', () => {
    it('should generate comprehensive scoring summary', () => {
      const allScores: ScoringMetrics[] = [
        {
          policy_adherence: 70,
          empathy_index: 80,
          completeness: 60,
          escalation_judgment: 85,
          time_efficiency: 75
        },
        {
          policy_adherence: 80,
          empathy_index: 85,
          completeness: 75,
          escalation_judgment: 90,
          time_efficiency: 80
        },
        {
          policy_adherence: 85,
          empathy_index: 90,
          completeness: 80,
          escalation_judgment: 85,
          time_efficiency: 85
        }
      ];

      const allEvidence: ScoringEvidence[] = [
        {
          policy_adherence: { score: 70, evidence: ['Followed basic protocol'], violations: ['Minor deviation'] },
          empathy_index: { score: 80, evidence: ['Showed understanding'], missed_opportunities: [] },
          completeness: { score: 60, evidence: ['Partial solution'], missing_elements: ['Follow-up'] },
          escalation_judgment: { score: 85, evidence: ['Good judgment'], inappropriate_actions: [] },
          time_efficiency: { score: 75, evidence: ['Reasonable pace'], inefficiencies: ['Some delays'] }
        },
        {
          policy_adherence: { score: 80, evidence: ['Better adherence'], violations: [] },
          empathy_index: { score: 85, evidence: ['Strong empathy'], missed_opportunities: [] },
          completeness: { score: 75, evidence: ['More complete'], missing_elements: [] },
          escalation_judgment: { score: 90, evidence: ['Excellent judgment'], inappropriate_actions: [] },
          time_efficiency: { score: 80, evidence: ['Good pace'], inefficiencies: [] }
        },
        {
          policy_adherence: { score: 85, evidence: ['Excellent adherence'], violations: [] },
          empathy_index: { score: 90, evidence: ['Outstanding empathy'], missed_opportunities: [] },
          completeness: { score: 80, evidence: ['Complete solution'], missing_elements: [] },
          escalation_judgment: { score: 85, evidence: ['Solid judgment'], inappropriate_actions: [] },
          time_efficiency: { score: 85, evidence: ['Efficient'], inefficiencies: [] }
        }
      ];

      const criticalErrors = ['Initial policy violation'];

      const summary = agent.generateScoringSummary(allScores, allEvidence, criticalErrors);

      expect(summary.overallScore).toBeGreaterThan(70);
      expect(summary.dimensionSummaries.policy_adherence.trend).toBe('improving');
      expect(summary.dimensionSummaries.empathy_index.averageScore).toBeGreaterThan(80);
      expect(summary.criticalIssues).toContain('Initial policy violation');
    });
  });

  describe('createFallbackScoring', () => {
    it('should create fallback scoring when analysis fails', () => {
      const fallback = agent.createFallbackScoring(sampleInput);

      expect(fallback.scores.policy_adherence).toBe(50);
      expect(fallback.scores.empathy_index).toBe(50);
      expect(fallback.scores.completeness).toBe(50);
      expect(fallback.scores.escalation_judgment).toBe(50);
      expect(fallback.scores.time_efficiency).toBe(50);
      expect(fallback.evidence.policy_adherence.evidence).toContain('Analysis unavailable');
      expect(fallback.completionReason).toContain('Fallback scoring applied');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty conversation history', async () => {
      const emptyHistoryInput = {
        ...sampleInput,
        conversationHistory: []
      };

      const mockAnalysis = `POLICY_ADHERENCE: 60 | Evidence: Basic response | Violations: None
EMPATHY_INDEX: 55 | Evidence: Some empathy | Missed: Limited context
COMPLETENESS: 50 | Evidence: Basic completion | Missing: More detail needed
ESCALATION_JUDGMENT: 60 | Evidence: Reasonable | Issues: None
TIME_EFFICIENCY: 65 | Evidence: Direct | Inefficiencies: None`;

      mockLLM.invoke.mockResolvedValue(new AIMessage(mockAnalysis));

      const result = await agent.scoreUserResponse(emptyHistoryInput);

      expect(result.scores.policy_adherence).toBe(60);
      expect(result.sessionComplete).toBe(false);
    });

    it('should handle malformed LLM response', async () => {
      const malformedResponse = 'This is not a properly formatted response';
      mockLLM.invoke.mockResolvedValue(new AIMessage(malformedResponse));

      const result = await agent.scoreUserResponse(sampleInput);

      // Should use default scores when parsing fails
      expect(result.scores.policy_adherence).toBe(50);
      expect(result.scores.empathy_index).toBe(50);
    });

    it('should handle extreme scores correctly', async () => {
      const extremeAnalysis = `POLICY_ADHERENCE: 150 | Evidence: Perfect | Violations: None
EMPATHY_INDEX: -10 | Evidence: None | Missed: Everything
COMPLETENESS: 0 | Evidence: None | Missing: Everything
ESCALATION_JUDGMENT: 100 | Evidence: Perfect | Issues: None
TIME_EFFICIENCY: 200 | Evidence: Super fast | Inefficiencies: None`;

      mockLLM.invoke.mockResolvedValue(new AIMessage(extremeAnalysis));

      const result = await agent.scoreUserResponse(sampleInput);

      // Scores should be clamped to 0-100 range
      expect(result.scores.policy_adherence).toBeLessThanOrEqual(100);
      expect(result.scores.empathy_index).toBeGreaterThanOrEqual(0);
      expect(result.scores.time_efficiency).toBeLessThanOrEqual(100);
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete training session scoring', async () => {
      const sessionInputs = [
        {
          ...sampleInput,
          userResponse: 'I understand your frustration. Let me help you right away.',
          turnCount: 1
        },
        {
          ...sampleInput,
          userResponse: 'I sincerely apologize for this overbooking situation.',
          turnCount: 2,
          completedSteps: ['Acknowledge the problem']
        },
        {
          ...sampleInput,
          userResponse: 'Let me find you alternative accommodation and provide compensation.',
          turnCount: 3,
          completedSteps: ['Acknowledge the problem', 'Apologize sincerely']
        }
      ];

      const mockResponses = [
        `POLICY_ADHERENCE: 75 | Evidence: Good start | Violations: None
EMPATHY_INDEX: 80 | Evidence: Acknowledged frustration | Missed: None
COMPLETENESS: 60 | Evidence: Started well | Missing: Solution details
ESCALATION_JUDGMENT: 75 | Evidence: Appropriate | Issues: None
TIME_EFFICIENCY: 80 | Evidence: Quick response | Inefficiencies: None`,
        
        `POLICY_ADHERENCE: 85 | Evidence: Proper apology | Violations: None
EMPATHY_INDEX: 90 | Evidence: Sincere apology | Missed: None
COMPLETENESS: 70 | Evidence: Building solution | Missing: Specifics
ESCALATION_JUDGMENT: 80 | Evidence: Good judgment | Issues: None
TIME_EFFICIENCY: 85 | Evidence: Efficient | Inefficiencies: None`,
        
        `POLICY_ADHERENCE: 90 | Evidence: Complete solution | Violations: None
EMPATHY_INDEX: 85 | Evidence: Maintained empathy | Missed: None
COMPLETENESS: 95 | Evidence: Full solution offered | Missing: None
ESCALATION_JUDGMENT: 90 | Evidence: Excellent judgment | Issues: None
TIME_EFFICIENCY: 90 | Evidence: Very efficient | Inefficiencies: None`
      ];

      const results = [];
      for (let i = 0; i < sessionInputs.length; i++) {
        mockLLM.invoke.mockResolvedValueOnce(new AIMessage(mockResponses[i]));
        const result = await agent.scoreUserResponse(sessionInputs[i]);
        results.push(result);
      }

      // Verify progression
      expect(results[0].scores.policy_adherence).toBeLessThan(results[2].scores.policy_adherence);
      expect(results[0].scores.completeness).toBeLessThan(results[2].scores.completeness);
      expect(results[2].completedSteps.length).toBeGreaterThan(results[0].completedSteps.length);
    });
  });
});