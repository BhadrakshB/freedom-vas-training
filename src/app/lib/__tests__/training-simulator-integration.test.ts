// Integration tests for complete Training Simulator workflow
// Tests end-to-end scenarios and complex interactions

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HumanMessage, AIMessage } from '@langchain/core/messages';
import { TrainingSimulatorGraph } from '../training-simulator-graph';
import { PineconeService } from '../pinecone-service';
import { sessionManager } from '../session-manager';

// Mock external dependencies
vi.mock('../pinecone-service');

describe('Training Simulator Integration Tests', () => {
  let graph: TrainingSimulatorGraph;
  let mockPineconeService: PineconeService;

  beforeEach(() => {
    mockPineconeService = {
      retrieveRelevantSOPs: vi.fn().mockResolvedValue([
        {
          content: 'When handling booking complaints, always acknowledge the guest concern first and apologize for any inconvenience.',
          metadata: { category: 'booking', type: 'sop', difficulty: 'beginner' },
          score: 0.95
        },
        {
          content: 'For overbooking situations, offer alternative accommodations and compensation according to policy guidelines.',
          metadata: { category: 'overbooking', type: 'sop', difficulty: 'intermediate' },
          score: 0.88
        }
      ]),
      retrieveTrainingContent: vi.fn().mockResolvedValue([]),
      searchPolicyGuidance: vi.fn().mockResolvedValue([]),
      ingestSOPs: vi.fn().mockResolvedValue(undefined),
      ingestTrainingMaterials: vi.fn().mockResolvedValue(undefined),
      tagDocument: vi.fn().mockResolvedValue(undefined)
    } as any;

    graph = new TrainingSimulatorGraph({
      pineconeService: mockPineconeService,
      apiKey: 'test-api-key'
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Complete Workflow Scenarios', () => {
    it('should handle a successful booking complaint scenario', async () => {
      const input = {
        trainingObjective: 'Handle a guest complaint about a booking issue professionally',
        difficulty: 'intermediate' as const,
        category: 'booking' as const,
        userId: 'trainee-001'
      };

      // Start the session
      const session = await graph.startSession(input);
      
      expect(session.sessionId).toBeDefined();
      expect(session.scenario).toBeDefined();
      expect(session.persona).toBeDefined();
      expect(session.sessionStatus).toBe('creating');

      // Simulate a complete conversation
      const conversation = [
        "Hello! I understand you have a concern about your booking. How can I help you today?",
        "I apologize for the inconvenience with your reservation. Let me look into this right away.",
        "I can see the issue with your booking. I'd like to offer you a full refund and help you find alternative accommodation.",
        "Thank you for your patience. I've processed the refund and found you a comparable room at a partner hotel. Is this acceptable?",
        "Perfect! I've sent you the confirmation details. Is there anything else I can help you with today?"
      ];

      let currentState = session;
      
      for (let i = 0; i < conversation.length; i++) {
        currentState = await graph.continueSession(currentState, conversation[i]);
        
        // Verify state progression
        expect(currentState.sessionId).toBe(session.sessionId);
        expect(currentState.turnCount).toBeGreaterThan(i);
        
        // Should have guest responses (except possibly the last one if session completes)
        if (currentState.sessionStatus !== 'complete') {
          const lastMessage = currentState.messages[currentState.messages.length - 1];
          expect(lastMessage).toBeInstanceOf(AIMessage);
        }
      }

      // Session should complete successfully
      expect(currentState.sessionStatus).toBe('complete');
      expect(currentState.scores).toBeDefined();
      expect(currentState.completedSteps.length).toBeGreaterThan(0);
    });

    it('should handle an overbooking scenario with escalation', async () => {
      const input = {
        trainingObjective: 'Manage an overbooking situation requiring escalation',
        difficulty: 'advanced' as const,
        category: 'overbooking' as const
      };

      const session = await graph.startSession(input);
      
      // Simulate escalation scenario
      const escalationConversation = [
        "I'm sorry to hear about this situation. Let me understand what happened with your reservation.",
        "This is clearly an overbooking situation. I apologize for this serious error on our part.",
        "I need to escalate this to my manager to ensure we provide you with the best possible solution.",
        "My manager has authorized me to offer you a suite at our sister property plus full compensation.",
        "I understand your frustration. Let me personally ensure this is resolved to your satisfaction."
      ];

      let currentState = session;
      
      for (const response of escalationConversation) {
        currentState = await graph.continueSession(currentState, response);
      }

      // Should have appropriate escalation scoring
      expect(currentState.scores?.escalation_judgment).toBeDefined();
      expect(currentState.sessionStatus).toBe('complete');
    });

    it('should handle a scenario with critical errors', async () => {
      const input = {
        trainingObjective: 'Test critical error detection and handling',
        difficulty: 'beginner' as const,
        category: 'complaint' as const
      };

      const session = await graph.startSession(input);
      
      // Simulate responses that would trigger critical errors
      const problematicConversation = [
        "That's not our problem, you should have read the terms and conditions.",
        "There's nothing we can do about it. You'll have to deal with it.",
        "I don't have time for this. Figure it out yourself."
      ];

      let currentState = session;
      
      for (const response of problematicConversation) {
        currentState = await graph.continueSession(currentState, response);
        
        // Should accumulate critical errors
        expect(currentState.criticalErrors.length).toBeGreaterThan(0);
      }

      // Session should complete due to critical errors
      expect(currentState.sessionStatus).toBe('complete');
      expect(currentState.criticalErrors.length).toBeGreaterThanOrEqual(3);
    });

    it('should handle maximum turn limit', async () => {
      const input = {
        trainingObjective: 'Test maximum turn handling',
        difficulty: 'intermediate' as const
      };

      const session = await graph.startSession(input);
      let currentState = session;
      
      // Simulate a very long conversation
      for (let i = 0; i < 25; i++) {
        if (currentState.sessionStatus === 'complete') break;
        
        currentState = await graph.continueSession(
          currentState, 
          `Response number ${i + 1}: I'm still working on your issue.`
        );
      }

      // Should complete due to turn limit
      expect(currentState.sessionStatus).toBe('complete');
      expect(currentState.turnCount).toBeGreaterThanOrEqual(20);
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should recover from agent failures and continue workflow', async () => {
      // Mock one agent to fail initially then succeed
      let failCount = 0;
      const mockGuestSimulator = {
        simulateGuestResponse: vi.fn().mockImplementation(() => {
          failCount++;
          if (failCount <= 2) {
            throw new Error('Temporary failure');
          }
          return Promise.resolve({
            response: 'I understand your concern. Let me help you.',
            currentEmotion: 'concerned',
            informationRevealed: [],
            consistencyScore: 0.8,
            shouldContinue: true
          });
        }),
        createFallbackResponse: vi.fn().mockReturnValue({
          response: 'Could you please clarify your concern?',
          currentEmotion: 'neutral',
          informationRevealed: [],
          consistencyScore: 0.5,
          shouldContinue: true
        })
      };

      (graph as any).guestSimulator = mockGuestSimulator;

      const input = {
        trainingObjective: 'Test error recovery',
        difficulty: 'beginner' as const
      };

      const session = await graph.startSession(input);
      
      // Should use fallback responses for failed attempts
      const result1 = await graph.continueSession(session, "First response");
      expect(mockGuestSimulator.createFallbackResponse).toHaveBeenCalled();
      
      const result2 = await graph.continueSession(result1, "Second response");
      expect(mockGuestSimulator.createFallbackResponse).toHaveBeenCalledTimes(2);
      
      // Third attempt should succeed
      const result3 = await graph.continueSession(result2, "Third response");
      expect(result3.messages).toBeDefined();
    });

    it('should handle Pinecone service unavailability', async () => {
      // Mock Pinecone to fail
      mockPineconeService.retrieveRelevantSOPs = vi.fn().mockRejectedValue(new Error('Pinecone unavailable'));

      const input = {
        trainingObjective: 'Test Pinecone failure handling',
        difficulty: 'intermediate' as const
      };

      // Should still create session with fallback scenario
      const session = await graph.startSession(input);
      
      expect(session.sessionId).toBeDefined();
      expect(session.scenario).toBeDefined();
      // Should have empty or minimal context due to Pinecone failure
      expect(session.retrievedContext).toBeDefined();
    });

    it('should handle malformed input gracefully', async () => {
      const malformedInputs = [
        { trainingObjective: '', difficulty: 'beginner' as const },
        { trainingObjective: null as any, difficulty: 'intermediate' as const },
        { trainingObjective: 'Valid objective', difficulty: 'invalid' as any },
        {} as any
      ];

      for (const input of malformedInputs) {
        const session = await graph.startSession(input);
        
        expect(session.sessionId).toBeDefined();
        expect(session.scenario).toBeDefined();
        expect(session.persona).toBeDefined();
      }
    });
  });

  describe('Performance and Concurrency', () => {
    it('should handle multiple concurrent sessions', async () => {
      const sessionPromises = [];
      
      for (let i = 0; i < 5; i++) {
        const input = {
          trainingObjective: `Concurrent session ${i}`,
          difficulty: 'beginner' as const,
          userId: `user-${i}`
        };
        
        sessionPromises.push(graph.startSession(input));
      }

      const sessions = await Promise.all(sessionPromises);
      
      // All sessions should be created successfully
      expect(sessions).toHaveLength(5);
      sessions.forEach((session, index) => {
        expect(session.sessionId).toBeDefined();
        expect(session.sessionId).toContain('session_');
        
        // Each session should have unique ID
        const otherSessions = sessions.filter((_, i) => i !== index);
        otherSessions.forEach(otherSession => {
          expect(session.sessionId).not.toBe(otherSession.sessionId);
        });
      });
    });

    it('should maintain session isolation', async () => {
      const session1 = await graph.startSession({
        trainingObjective: 'Session 1 objective',
        difficulty: 'beginner' as const
      });

      const session2 = await graph.startSession({
        trainingObjective: 'Session 2 objective',
        difficulty: 'advanced' as const
      });

      // Continue both sessions independently
      const result1 = await graph.continueSession(session1, "Session 1 response");
      const result2 = await graph.continueSession(session2, "Session 2 response");

      // Sessions should remain isolated
      expect(result1.sessionId).toBe(session1.sessionId);
      expect(result2.sessionId).toBe(session2.sessionId);
      expect(result1.sessionId).not.toBe(result2.sessionId);
      
      // Turn counts should be independent
      expect(result1.turnCount).not.toBe(result2.turnCount);
    });
  });

  describe('Data Consistency and Validation', () => {
    it('should maintain data consistency throughout workflow', async () => {
      const input = {
        trainingObjective: 'Test data consistency',
        difficulty: 'intermediate' as const,
        category: 'booking' as const
      };

      const session = await graph.startSession(input);
      
      // Verify initial state consistency
      expect(session.sessionId).toBeDefined();
      expect(session.scenario).toBeDefined();
      expect(session.persona).toBeDefined();
      expect(session.requiredSteps).toBeDefined();
      expect(Array.isArray(session.requiredSteps)).toBe(true);
      expect(Array.isArray(session.completedSteps)).toBe(true);
      expect(Array.isArray(session.criticalErrors)).toBe(true);

      // Continue session and verify consistency
      const result = await graph.continueSession(session, "Test response");
      
      expect(result.sessionId).toBe(session.sessionId);
      expect(result.scenario).toEqual(session.scenario);
      expect(result.persona).toEqual(session.persona);
      expect(result.turnCount).toBeGreaterThan(session.turnCount);
    });

    it('should validate scenario data structure', async () => {
      const input = {
        trainingObjective: 'Test scenario validation',
        difficulty: 'beginner' as const
      };

      const session = await graph.startSession(input);
      const scenario = session.scenario;

      expect(scenario).toBeDefined();
      expect(typeof scenario.title).toBe('string');
      expect(typeof scenario.description).toBe('string');
      expect(Array.isArray(scenario.required_steps)).toBe(true);
      expect(Array.isArray(scenario.critical_errors)).toBe(true);
      expect(typeof scenario.time_pressure).toBe('number');
      expect(scenario.time_pressure).toBeGreaterThanOrEqual(1);
      expect(scenario.time_pressure).toBeLessThanOrEqual(10);
    });

    it('should validate persona data structure', async () => {
      const input = {
        trainingObjective: 'Test persona validation',
        difficulty: 'intermediate' as const
      };

      const session = await graph.startSession(input);
      const persona = session.persona;

      expect(persona).toBeDefined();
      expect(typeof persona.name).toBe('string');
      expect(typeof persona.background).toBe('string');
      expect(Array.isArray(persona.personality_traits)).toBe(true);
      expect(Array.isArray(persona.hidden_motivations)).toBe(true);
      expect(typeof persona.communication_style).toBe('string');
      expect(Array.isArray(persona.emotional_arc)).toBe(true);
      expect(persona.emotional_arc.length).toBeGreaterThan(0);
    });

    it('should validate scoring metrics structure', async () => {
      const input = {
        trainingObjective: 'Test scoring validation',
        difficulty: 'beginner' as const
      };

      const session = await graph.startSession(input);
      const result = await graph.continueSession(session, "Test response for scoring");

      if (result.scores) {
        expect(typeof result.scores.policy_adherence).toBe('number');
        expect(typeof result.scores.empathy_index).toBe('number');
        expect(typeof result.scores.completeness).toBe('number');
        expect(typeof result.scores.escalation_judgment).toBe('number');
        expect(typeof result.scores.time_efficiency).toBe('number');

        // All scores should be between 0 and 100
        Object.values(result.scores).forEach(score => {
          expect(score).toBeGreaterThanOrEqual(0);
          expect(score).toBeLessThanOrEqual(100);
        });
      }
    });
  });

  describe('Feedback Generation', () => {
    it('should generate comprehensive feedback for completed session', async () => {
      const input = {
        trainingObjective: 'Test comprehensive feedback',
        difficulty: 'intermediate' as const,
        category: 'complaint' as const
      };

      const session = await graph.startSession(input);
      
      // Complete a full conversation
      let currentState = session;
      const responses = [
        "I understand your concern and I'm here to help.",
        "Let me apologize for the inconvenience you've experienced.",
        "I've reviewed your case and I can offer you a full refund.",
        "Thank you for your patience. Is there anything else I can help with?"
      ];

      for (const response of responses) {
        currentState = await graph.continueSession(currentState, response);
        if (currentState.sessionStatus === 'complete') break;
      }

      // Should have comprehensive feedback
      expect(currentState.sessionStatus).toBe('complete');
      const lastMessage = currentState.messages[currentState.messages.length - 1];
      expect(lastMessage).toBeInstanceOf(AIMessage);
      
      const feedbackContent = lastMessage.content as string;
      expect(feedbackContent).toContain('Training Session Complete');
      expect(feedbackContent).toContain('Overall Score');
      expect(feedbackContent).toContain('Grade:');
    });

    it('should provide specific feedback for different performance levels', async () => {
      const scenarios = [
        { difficulty: 'beginner' as const, expectedGrade: /[ABC]/ },
        { difficulty: 'intermediate' as const, expectedGrade: /[ABCD]/ },
        { difficulty: 'advanced' as const, expectedGrade: /[ABCDF]/ }
      ];

      for (const scenario of scenarios) {
        const input = {
          trainingObjective: `Test ${scenario.difficulty} feedback`,
          difficulty: scenario.difficulty
        };

        const session = await graph.startSession(input);
        
        // Force completion with some basic responses
        let currentState = session;
        currentState = await graph.continueSession(currentState, "I'll help you with that.");
        
        // Force session completion by setting required state
        const completedState = {
          ...currentState,
          sessionStatus: 'complete' as const,
          completedSteps: currentState.requiredSteps,
          scores: {
            policy_adherence: 75,
            empathy_index: 80,
            completeness: 70,
            escalation_judgment: 85,
            time_efficiency: 90
          }
        };

        const finalResult = await graph.getGraph().invoke(completedState);
        
        expect(finalResult.sessionStatus).toBe('complete');
        const feedbackMessage = finalResult.messages[finalResult.messages.length - 1];
        expect(feedbackMessage.content).toMatch(scenario.expectedGrade);
      }
    });
  });
});