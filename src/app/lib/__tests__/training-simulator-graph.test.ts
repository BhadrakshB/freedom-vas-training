// Integration tests for Training Simulator Graph
// Tests complete workflow execution and error handling

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HumanMessage, AIMessage } from '@langchain/core/messages';
import { TrainingSimulatorGraph, createTrainingSimulatorGraph } from '../training-simulator-graph';
import { PineconeService } from '../pinecone-service';
import { sessionManager } from '../session-manager';

// Mock the PineconeService
vi.mock('../pinecone-service');

// Mock the agent classes
vi.mock('../agents/scenario-creator', () => ({
  ScenarioCreatorAgent: vi.fn().mockImplementation(() => ({
    createScenario: vi.fn().mockResolvedValue({
      scenario: {
        title: 'Test Scenario',
        description: 'A test training scenario',
        required_steps: ['step1', 'step2', 'step3'],
        critical_errors: ['error1', 'error2'],
        time_pressure: 5
      },
      sopReferences: [
        { content: 'Mock SOP content', metadata: { category: 'test' }, score: 0.9 }
      ],
      confidence: 0.8
    }),
    createFallbackScenario: vi.fn().mockResolvedValue({
      scenario: {
        title: 'Fallback Scenario',
        description: 'A fallback training scenario',
        required_steps: ['step1', 'step2'],
        critical_errors: ['error1'],
        time_pressure: 3
      },
      sopReferences: [],
      confidence: 0.3
    })
  }))
}));

vi.mock('../agents/persona-generator', () => ({
  PersonaGeneratorAgent: vi.fn().mockImplementation(() => ({
    generatePersona: vi.fn().mockResolvedValue({
      persona: {
        name: 'Test Guest',
        background: 'A test guest persona',
        personality_traits: ['friendly', 'direct'],
        hidden_motivations: ['wants help'],
        communication_style: 'straightforward',
        emotional_arc: ['neutral', 'concerned', 'satisfied']
      },
      consistency: 0.8,
      psychologicalProfile: {}
    }),
    createFallbackPersona: vi.fn().mockReturnValue({
      persona: {
        name: 'Fallback Guest',
        background: 'A fallback guest persona',
        personality_traits: ['direct'],
        hidden_motivations: ['wants help'],
        communication_style: 'straightforward',
        emotional_arc: ['neutral', 'satisfied']
      },
      consistency: 0.7,
      psychologicalProfile: {}
    })
  }))
}));

vi.mock('../agents/guest-simulator', () => ({
  GuestSimulatorAgent: vi.fn().mockImplementation(() => ({
    simulateGuestResponse: vi.fn().mockResolvedValue({
      response: 'Hello, I need help with my booking.',
      currentEmotion: 'concerned',
      informationRevealed: [],
      consistencyScore: 0.8,
      shouldContinue: true
    }),
    createFallbackResponse: vi.fn().mockReturnValue({
      response: 'I need some help with my situation.',
      currentEmotion: 'neutral',
      informationRevealed: [],
      consistencyScore: 0.5,
      shouldContinue: true
    })
  }))
}));

vi.mock('../agents/silent-scoring', () => ({
  SilentScoringAgent: vi.fn().mockImplementation(() => ({
    scoreUserResponse: vi.fn().mockResolvedValue({
      scores: {
        policy_adherence: 75,
        empathy_index: 80,
        completeness: 70,
        escalation_judgment: 85,
        time_efficiency: 90
      },
      evidence: {},
      criticalErrors: [],
      completedSteps: ['step1'],
      sessionComplete: false,
      completionReason: ''
    }),
    createFallbackScoring: vi.fn().mockReturnValue({
      scores: {
        policy_adherence: 50,
        empathy_index: 50,
        completeness: 50,
        escalation_judgment: 50,
        time_efficiency: 50
      },
      evidence: {},
      criticalErrors: [],
      completedSteps: [],
      sessionComplete: false,
      completionReason: 'Fallback scoring applied'
    })
  }))
}));

vi.mock('../agents/feedback-generator', () => ({
  FeedbackGeneratorAgent: vi.fn().mockImplementation(() => ({
    generateFeedback: vi.fn().mockResolvedValue({
      overallPerformance: {
        score: 75,
        grade: 'B',
        summary: 'Good performance overall',
        keyStrengths: ['Good empathy', 'Clear communication'],
        primaryAreasForImprovement: ['Policy knowledge'],
        sessionCompletion: {
          stepsCompleted: 2,
          totalSteps: 3,
          completionRate: 67,
          criticalErrorCount: 0
        }
      },
      detailedAnalysis: {},
      sopCitations: [],
      actionableRecommendations: [
        {
          category: 'policy',
          priority: 'medium',
          recommendation: 'Review company policies',
          specificActions: ['Study SOP documents'],
          expectedOutcome: 'Better policy compliance',
          relatedSOPs: []
        }
      ],
      resources: [],
      nextSteps: []
    })
  }))
}));

describe('TrainingSimulatorGraph', () => {
  let graph: TrainingSimulatorGraph;
  let mockPineconeService: PineconeService;

  beforeEach(() => {
    // Create mock Pinecone service
    mockPineconeService = {
      retrieveRelevantSOPs: vi.fn().mockResolvedValue([
        {
          content: 'Mock SOP content for testing',
          metadata: { category: 'booking', type: 'sop' },
          score: 0.9
        }
      ]),
      retrieveTrainingContent: vi.fn().mockResolvedValue([]),
      searchPolicyGuidance: vi.fn().mockResolvedValue([]),
      ingestSOPs: vi.fn().mockResolvedValue(undefined),
      ingestTrainingMaterials: vi.fn().mockResolvedValue(undefined),
      tagDocument: vi.fn().mockResolvedValue(undefined)
    } as any;

    // Create graph instance
    graph = createTrainingSimulatorGraph({
      pineconeService: mockPineconeService,
      apiKey: 'test-api-key'
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Session Initialization', () => {
    it('should create a new training session with valid input', async () => {
      const input = {
        trainingObjective: 'Handle booking complaints effectively',
        difficulty: 'intermediate' as const,
        category: 'booking' as const,
        userId: 'test-user'
      };

      const result = await graph.startSession(input);

      expect(result).toBeDefined();
      expect(result.sessionId).toBeDefined();
      expect(result.sessionStatus).toBe('active');
    });

    it('should handle missing input gracefully', async () => {
      const input = {
        trainingObjective: '',
        difficulty: 'beginner' as const
      };

      const result = await graph.startSession(input);

      expect(result).toBeDefined();
      expect(result.sessionId).toBeDefined();
    });
  });

  describe('Workflow Execution', () => {
    it('should execute complete workflow from start to feedback', async () => {
      const input = {
        trainingObjective: 'Handle guest complaints professionally',
        difficulty: 'beginner' as const,
        category: 'complaint' as const
      };

      // Start session
      const initialResult = await graph.startSession(input);
      expect(initialResult.scenario).toBeDefined();
      expect(initialResult.persona).toBeDefined();

      // Simulate user interaction
      let currentState = initialResult;
      const userResponses = [
        "Hello, I understand you have a concern. How can I help you today?",
        "I apologize for the inconvenience. Let me look into this for you.",
        "I've found a solution. Would you like me to proceed with the refund?"
      ];

      for (const response of userResponses) {
        currentState = await graph.continueSession(currentState, response);
        expect(currentState).toBeDefined();
        
        // Should have guest response
        const lastMessage = currentState.messages[currentState.messages.length - 1];
        expect(lastMessage).toBeInstanceOf(AIMessage);
      }

      // Session should eventually complete or remain active
      expect(['active', 'complete']).toContain(currentState.sessionStatus);
    });

    it('should handle session completion with all steps completed', async () => {
      const input = {
        trainingObjective: 'Complete all required steps',
        difficulty: 'beginner' as const
      };

      const result = await graph.startSession(input);
      
      // Mock a state where all steps are completed
      const completedState = {
        ...result,
        requiredSteps: ['step1', 'step2', 'step3'],
        completedSteps: ['step1', 'step2', 'step3'],
        turnCount: 5
      };

      const finalResult = await graph.continueSession(completedState, "Thank you for your help!");
      
      expect(finalResult.sessionStatus).toBe('complete');
    });

    it('should handle session completion with critical errors', async () => {
      const input = {
        trainingObjective: 'Test critical error handling',
        difficulty: 'intermediate' as const
      };

      const result = await graph.startSession(input);
      
      // Mock a state with critical errors
      const errorState = {
        ...result,
        criticalErrors: ['Error 1', 'Error 2', 'Error 3'],
        turnCount: 3
      };

      const finalResult = await graph.continueSession(errorState, "I don't know what to do");
      
      expect(finalResult.sessionStatus).toBe('complete');
    });

    it('should handle maximum turns reached', async () => {
      const input = {
        trainingObjective: 'Test turn limit',
        difficulty: 'advanced' as const
      };

      const result = await graph.startSession(input);
      
      // Mock a state with maximum turns
      const maxTurnsState = {
        ...result,
        turnCount: 20,
        completedSteps: ['step1']
      };

      const finalResult = await graph.continueSession(maxTurnsState, "Still working on this");
      
      expect(finalResult.sessionStatus).toBe('complete');
    });
  });

  describe('Error Handling', () => {
    it('should use fallback scenario when scenario creation fails', async () => {
      // Mock scenario creator to throw error
      const mockScenarioCreator = {
        createScenario: vi.fn().mockRejectedValue(new Error('Scenario creation failed')),
        createFallbackScenario: vi.fn().mockResolvedValue({
          scenario: {
            title: 'Fallback Scenario',
            description: 'A basic training scenario',
            required_steps: ['step1', 'step2'],
            critical_errors: ['error1'],
            time_pressure: 5
          },
          sopReferences: [],
          confidence: 0.3
        })
      };

      // Replace the scenario creator in the graph
      (graph as any).scenarioCreator = mockScenarioCreator;

      const input = {
        trainingObjective: 'Test fallback scenario',
        difficulty: 'beginner' as const
      };

      const result = await graph.startSession(input);

      expect(result.scenario.title).toBe('Fallback Scenario');
      expect(mockScenarioCreator.createFallbackScenario).toHaveBeenCalled();
    });

    it('should use fallback persona when persona generation fails', async () => {
      const mockPersonaGenerator = {
        generatePersona: vi.fn().mockRejectedValue(new Error('Persona generation failed')),
        createFallbackPersona: vi.fn().mockReturnValue({
          persona: {
            name: 'Fallback Guest',
            background: 'A basic guest persona',
            personality_traits: ['direct'],
            hidden_motivations: ['wants help'],
            communication_style: 'straightforward',
            emotional_arc: ['neutral', 'satisfied']
          },
          consistency: 0.7,
          psychologicalProfile: {}
        })
      };

      (graph as any).personaGenerator = mockPersonaGenerator;

      const input = {
        trainingObjective: 'Test fallback persona',
        difficulty: 'beginner' as const
      };

      const result = await graph.startSession(input);

      expect(result.persona.name).toBe('Fallback Guest');
      expect(mockPersonaGenerator.createFallbackPersona).toHaveBeenCalled();
    });

    it('should handle guest simulation failures gracefully', async () => {
      const mockGuestSimulator = {
        simulateGuestResponse: vi.fn().mockRejectedValue(new Error('Simulation failed')),
        createFallbackResponse: vi.fn().mockReturnValue({
          response: 'I need some help with my situation.',
          currentEmotion: 'neutral',
          informationRevealed: [],
          consistencyScore: 0.5,
          shouldContinue: true
        })
      };

      (graph as any).guestSimulator = mockGuestSimulator;

      const input = {
        trainingObjective: 'Test simulation fallback',
        difficulty: 'beginner' as const
      };

      const initialResult = await graph.startSession(input);
      const result = await graph.continueSession(initialResult, "Hello, how can I help?");

      expect(mockGuestSimulator.createFallbackResponse).toHaveBeenCalled();
      expect(result.messages).toBeDefined();
    });

    it('should handle scoring failures with fallback scoring', async () => {
      const mockSilentScoring = {
        scoreUserResponse: vi.fn().mockRejectedValue(new Error('Scoring failed')),
        createFallbackScoring: vi.fn().mockReturnValue({
          scores: {
            policy_adherence: 50,
            empathy_index: 50,
            completeness: 50,
            escalation_judgment: 50,
            time_efficiency: 50
          },
          evidence: {},
          criticalErrors: [],
          completedSteps: [],
          sessionComplete: false,
          completionReason: 'Fallback scoring applied'
        })
      };

      (graph as any).silentScoring = mockSilentScoring;

      const input = {
        trainingObjective: 'Test scoring fallback',
        difficulty: 'beginner' as const
      };

      const initialResult = await graph.startSession(input);
      const result = await graph.continueSession(initialResult, "I'll help you with that.");

      expect(mockSilentScoring.createFallbackScoring).toHaveBeenCalled();
      expect(result.scores).toBeDefined();
    });

    it('should handle feedback generation failures', async () => {
      const mockFeedbackGenerator = {
        generateFeedback: vi.fn().mockRejectedValue(new Error('Feedback generation failed'))
      };

      (graph as any).feedbackGenerator = mockFeedbackGenerator;

      const input = {
        trainingObjective: 'Test feedback fallback',
        difficulty: 'beginner' as const
      };

      // Create a completed session state
      const completedState = {
        sessionId: 'test-session',
        sessionStatus: 'complete' as const,
        scenario: {
          title: 'Test Scenario',
          description: 'Test description',
          required_steps: ['step1'],
          critical_errors: [],
          time_pressure: 5
        },
        persona: {
          name: 'Test Guest',
          background: 'Test background',
          personality_traits: ['friendly'],
          hidden_motivations: ['wants help'],
          communication_style: 'direct',
          emotional_arc: ['neutral']
        },
        scores: {
          policy_adherence: 80,
          empathy_index: 75,
          completeness: 85,
          escalation_judgment: 70,
          time_efficiency: 90
        },
        requiredSteps: ['step1'],
        completedSteps: ['step1'],
        criticalErrors: [],
        retrievedContext: [],
        turnCount: 5,
        messages: [new HumanMessage('Test message')]
      };

      const result = await graph.getGraph().invoke(completedState);

      expect(result.sessionStatus).toBe('complete');
      expect(result.messages).toBeDefined();
      // Should have a fallback feedback message
      const lastMessage = result.messages[result.messages.length - 1];
      expect(lastMessage.content).toContain('Training session completed');
    });
  });

  describe('State Management', () => {
    it('should properly track turn count', async () => {
      const input = {
        trainingObjective: 'Test turn tracking',
        difficulty: 'beginner' as const
      };

      const initialResult = await graph.startSession(input);
      expect(initialResult.turnCount).toBe(0);

      const afterFirstTurn = await graph.continueSession(initialResult, "First response");
      expect(afterFirstTurn.turnCount).toBeGreaterThanOrEqual(1);

      const afterSecondTurn = await graph.continueSession(afterFirstTurn, "Second response");
      expect(afterSecondTurn.turnCount).toBeGreaterThanOrEqual(afterFirstTurn.turnCount);
    });

    it('should accumulate completed steps', async () => {
      const input = {
        trainingObjective: 'Test step completion',
        difficulty: 'beginner' as const
      };

      const result = await graph.startSession(input);
      expect(result.completedSteps).toBeDefined();
      expect(Array.isArray(result.completedSteps)).toBe(true);
    });

    it('should track critical errors', async () => {
      const input = {
        trainingObjective: 'Test error tracking',
        difficulty: 'beginner' as const
      };

      const result = await graph.startSession(input);
      expect(result.criticalErrors).toBeDefined();
      expect(Array.isArray(result.criticalErrors)).toBe(true);
    });

    it('should maintain conversation history', async () => {
      const input = {
        trainingObjective: 'Test conversation history',
        difficulty: 'beginner' as const
      };

      const initialResult = await graph.startSession(input);
      const initialMessageCount = initialResult.messages.length;

      const afterResponse = await graph.continueSession(initialResult, "Test response");
      expect(afterResponse.messages.length).toBeGreaterThan(initialMessageCount);
    });
  });

  describe('Session ID Generation', () => {
    it('should generate unique session IDs', async () => {
      const input = {
        trainingObjective: 'Test unique IDs',
        difficulty: 'beginner' as const
      };

      const result1 = await graph.startSession(input);
      const result2 = await graph.startSession(input);

      expect(result1.sessionId).toBeDefined();
      expect(result2.sessionId).toBeDefined();
      expect(result1.sessionId).not.toBe(result2.sessionId);
    });

    it('should generate session IDs with correct format', async () => {
      const input = {
        trainingObjective: 'Test ID format',
        difficulty: 'beginner' as const
      };

      const result = await graph.startSession(input);
      
      expect(result.sessionId).toMatch(/^session_[a-z0-9]+_[a-z0-9]+$/);
    });
  });
});

describe('Session Manager Integration', () => {
  beforeEach(async () => {
    // Clean up any existing sessions
    const activeSessions = await sessionManager.getActiveSessions();
    for (const sessionId of activeSessions) {
      await sessionManager.forceCompleteSession(sessionId);
    }
  });

  it('should integrate with session manager for session lifecycle', async () => {
    const sessionId = await sessionManager.createSession('test-user');
    expect(sessionId).toBeDefined();

    const session = await sessionManager.getSession(sessionId);
    expect(session).toBeDefined();
    expect(session?.sessionId).toBe(sessionId);

    await sessionManager.completeSession(sessionId);
    const completedSession = await sessionManager.getCompletedSession(sessionId);
    expect(completedSession).toBeDefined();
  });

  it('should handle session cleanup', async () => {
    const sessionId = await sessionManager.createSession('test-user');
    
    // Pause the session
    await sessionManager.pauseSession(sessionId);
    
    // Should be able to resume
    const resumed = await sessionManager.resumeSession(sessionId);
    expect(resumed).toBe(true);
  });

  it('should export session data correctly', async () => {
    const sessionId = await sessionManager.createSession('test-user');
    
    // Update session with some data
    await sessionManager.updateSession(sessionId, {
      scenario: {
        title: 'Test Scenario',
        description: 'Test description',
        required_steps: ['step1'],
        critical_errors: [],
        time_pressure: 5
      },
      turnCount: 3
    });

    const exportedData = await sessionManager.exportSessionData(sessionId);
    expect(exportedData).toBeDefined();
    expect(exportedData?.scenario.title).toBe('Test Scenario');
  });

  it('should generate session transcripts', async () => {
    const sessionId = await sessionManager.createSession('test-user');
    
    // Add some conversation data
    await sessionManager.updateSession(sessionId, {
      scenario: {
        title: 'Test Scenario',
        description: 'Test description',
        required_steps: ['step1'],
        critical_errors: [],
        time_pressure: 5
      },
      persona: {
        name: 'Test Guest',
        background: 'Test background',
        personality_traits: ['friendly'],
        hidden_motivations: ['wants help'],
        communication_style: 'direct',
        emotional_arc: ['neutral']
      },
      messages: [
        new HumanMessage('Hello, how can I help?'),
        new AIMessage('I have a problem with my booking.')
      ]
    });

    const transcript = await sessionManager.getSessionTranscript(sessionId);
    expect(transcript).toBeDefined();
    expect(transcript).toContain('Training Session Transcript');
    expect(transcript).toContain('Test Scenario');
    expect(transcript).toContain('Test Guest');
  });
});