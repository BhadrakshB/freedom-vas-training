// API Integration Tests for Training Session Endpoints
import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as startSession } from '../start/route';
import { POST as respondToSession } from '../respond/route';
import { GET as getSessionStatus } from '../status/route';
import { sessionManager } from '../../../lib/session-manager';
import { createTrainingSimulatorGraph } from '../../../lib/training-simulator-graph';

// Mock dependencies
vi.mock('../../../lib/session-manager');
vi.mock('../../../lib/training-simulator-graph');
vi.mock('../../../lib/pinecone-service');

// Mock environment variables
process.env.PINECONE_API_KEY = 'test-pinecone-key';
process.env.PINECONE_INDEX_NAME = 'test-index';
process.env.PINECONE_ENVIRONMENT = 'test-env';
process.env.GEMINI_API_KEY = 'test-gemini-key';

describe('Training Session API Endpoints', () => {
  const mockSessionId = 'session_test_123';
  const mockScenario = {
    title: 'Test Booking Scenario',
    description: 'Handle a booking inquiry',
    required_steps: ['Greet customer', 'Gather information', 'Process booking'],
    critical_errors: ['Being rude', 'Incorrect information'],
    time_pressure: 5
  };
  const mockPersona = {
    name: 'John Doe',
    background: 'Business traveler',
    personality_traits: ['professional', 'direct'],
    hidden_motivations: ['wants quick service'],
    communication_style: 'straightforward',
    emotional_arc: ['neutral', 'satisfied']
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/training/start', () => {
    it('should successfully start a new training session', async () => {
      // Mock session manager
      (sessionManager.createSession as Mock).mockResolvedValue(mockSessionId);
      (sessionManager.updateSession as Mock).mockResolvedValue(undefined);

      // Mock training graph
      const mockTrainingGraph = {
        startSession: vi.fn().mockResolvedValue({
          sessionId: mockSessionId,
          sessionStatus: 'active',
          scenario: mockScenario,
          persona: mockPersona,
          messages: []
        })
      };
      (createTrainingSimulatorGraph as Mock).mockReturnValue(mockTrainingGraph);

      const request = new NextRequest('http://localhost/api/training/start', {
        method: 'POST',
        body: JSON.stringify({
          trainingObjective: 'Practice booking handling',
          difficulty: 'beginner',
          category: 'booking'
        })
      });

      const response = await startSession(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual({
        sessionId: mockSessionId,
        scenario: {
          title: mockScenario.title,
          description: mockScenario.description,
          required_steps: mockScenario.required_steps
        },
        persona: {
          name: mockPersona.name,
          background: mockPersona.background,
          communication_style: mockPersona.communication_style
        },
        status: 'ready',
        message: expect.stringContaining('Training session started')
      });

      expect(sessionManager.createSession).toHaveBeenCalledWith('anonymous');
      expect(mockTrainingGraph.startSession).toHaveBeenCalledWith({
        trainingObjective: 'Practice booking handling',
        difficulty: 'beginner',
        category: 'booking',
        userId: undefined
      });
    });

    it('should return 400 for missing trainingObjective', async () => {
      const request = new NextRequest('http://localhost/api/training/start', {
        method: 'POST',
        body: JSON.stringify({
          difficulty: 'beginner'
        })
      });

      const response = await startSession(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('trainingObjective is required and must be a string');
    });

    it('should return 400 for invalid difficulty', async () => {
      const request = new NextRequest('http://localhost/api/training/start', {
        method: 'POST',
        body: JSON.stringify({
          trainingObjective: 'Test objective',
          difficulty: 'invalid'
        })
      });

      const response = await startSession(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('difficulty must be one of: beginner, intermediate, advanced');
    });

    it('should handle Pinecone service errors', async () => {
      (sessionManager.createSession as Mock).mockResolvedValue(mockSessionId);
      
      const mockTrainingGraph = {
        startSession: vi.fn().mockRejectedValue(new Error('Pinecone connection failed'))
      };
      (createTrainingSimulatorGraph as Mock).mockReturnValue(mockTrainingGraph);

      const request = new NextRequest('http://localhost/api/training/start', {
        method: 'POST',
        body: JSON.stringify({
          trainingObjective: 'Test objective'
        })
      });

      const response = await startSession(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.error).toBe('Knowledge base temporarily unavailable. Please try again later.');
    });

    it('should handle missing scenario/persona creation', async () => {
      (sessionManager.createSession as Mock).mockResolvedValue(mockSessionId);
      (sessionManager.updateSession as Mock).mockResolvedValue(undefined);

      const mockTrainingGraph = {
        startSession: vi.fn().mockResolvedValue({
          sessionId: mockSessionId,
          sessionStatus: 'active',
          scenario: null,
          persona: null,
          messages: []
        })
      };
      (createTrainingSimulatorGraph as Mock).mockReturnValue(mockTrainingGraph);

      const request = new NextRequest('http://localhost/api/training/start', {
        method: 'POST',
        body: JSON.stringify({
          trainingObjective: 'Test objective'
        })
      });

      const response = await startSession(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create scenario and persona');
    });
  });

  describe('POST /api/training/respond', () => {
    const mockSessionState = {
      sessionId: mockSessionId,
      sessionStatus: 'active' as const,
      scenario: mockScenario,
      persona: mockPersona,
      messages: [],
      turnCount: 1,
      requiredSteps: mockScenario.required_steps,
      completedSteps: [],
      criticalErrors: [],
      retrievedContext: []
    };

    it('should successfully process user response', async () => {
      (sessionManager.getSession as Mock).mockResolvedValue(mockSessionState);
      (sessionManager.updateSession as Mock).mockResolvedValue(undefined);

      const mockTrainingGraph = {
        continueSession: vi.fn().mockResolvedValue({
          ...mockSessionState,
          sessionStatus: 'active',
          turnCount: 2,
          messages: [
            { _getType: () => 'ai', content: 'Thank you for your response. How can I help you today?' }
          ]
        })
      };
      (createTrainingSimulatorGraph as Mock).mockReturnValue(mockTrainingGraph);

      const request = new NextRequest('http://localhost/api/training/respond', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: mockSessionId,
          userResponse: 'Hello, I would like to make a booking.'
        })
      });

      const response = await respondToSession(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        sessionId: mockSessionId,
        guestResponse: 'Thank you for your response. How can I help you today?',
        sessionStatus: 'active',
        currentTurn: 2
      });

      expect(sessionManager.getSession).toHaveBeenCalledWith(mockSessionId);
      expect(mockTrainingGraph.continueSession).toHaveBeenCalledWith(
        mockSessionState,
        'Hello, I would like to make a booking.'
      );
    });

    it('should handle session completion with feedback', async () => {
      (sessionManager.getSession as Mock).mockResolvedValue(mockSessionState);
      (sessionManager.updateSession as Mock).mockResolvedValue(undefined);
      (sessionManager.completeSession as Mock).mockResolvedValue({
        id: mockSessionId,
        scenario: mockScenario,
        persona: mockPersona
      });

      const mockScores = {
        policy_adherence: 85,
        empathy_index: 90,
        completeness: 80,
        escalation_judgment: 75,
        time_efficiency: 85
      };

      const mockTrainingGraph = {
        continueSession: vi.fn().mockResolvedValue({
          ...mockSessionState,
          sessionStatus: 'complete',
          turnCount: 1,
          scores: mockScores,
          messages: [
            { _getType: () => 'ai', content: 'Training Session Complete - Great job!' }
          ]
        })
      };
      (createTrainingSimulatorGraph as Mock).mockReturnValue(mockTrainingGraph);

      const request = new NextRequest('http://localhost/api/training/respond', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: mockSessionId,
          userResponse: 'Thank you for your help.'
        })
      });

      const response = await respondToSession(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        sessionId: mockSessionId,
        sessionStatus: 'complete',
        currentTurn: 1,
        feedback: {
          overallScore: 83, // Average of scores
          summary: 'Training session completed successfully.',
          recommendations: ['Review the feedback provided', 'Practice identified areas for improvement']
        }
      });

      expect(sessionManager.completeSession).toHaveBeenCalledWith(mockSessionId);
    });

    it('should return 400 for missing sessionId', async () => {
      const request = new NextRequest('http://localhost/api/training/respond', {
        method: 'POST',
        body: JSON.stringify({
          userResponse: 'Hello'
        })
      });

      const response = await respondToSession(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('sessionId is required and must be a string');
    });

    it('should return 400 for empty userResponse', async () => {
      const request = new NextRequest('http://localhost/api/training/respond', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: mockSessionId,
          userResponse: '   '
        })
      });

      const response = await respondToSession(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('userResponse cannot be empty');
    });

    it('should return 400 for too long userResponse', async () => {
      const longResponse = 'a'.repeat(2001);
      const request = new NextRequest('http://localhost/api/training/respond', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: mockSessionId,
          userResponse: longResponse
        })
      });

      const response = await respondToSession(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('userResponse is too long (maximum 2000 characters)');
    });

    it('should return 404 for non-existent session', async () => {
      (sessionManager.getSession as Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/training/respond', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: 'non-existent',
          userResponse: 'Hello'
        })
      });

      const response = await respondToSession(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Session not found or expired');
    });

    it('should return 400 for completed session', async () => {
      (sessionManager.getSession as Mock).mockResolvedValue({
        ...mockSessionState,
        sessionStatus: 'complete'
      });

      const request = new NextRequest('http://localhost/api/training/respond', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: mockSessionId,
          userResponse: 'Hello'
        })
      });

      const response = await respondToSession(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Session is already complete');
    });
  });

  describe('GET /api/training/status', () => {
    const mockSessionState = {
      sessionId: mockSessionId,
      sessionStatus: 'active' as const,
      scenario: mockScenario,
      persona: mockPersona,
      messages: [],
      turnCount: 3,
      requiredSteps: mockScenario.required_steps,
      completedSteps: ['Greet customer'],
      criticalErrors: [],
      retrievedContext: [],
      scores: {
        policy_adherence: 85,
        empathy_index: 90,
        completeness: 80,
        escalation_judgment: 75,
        time_efficiency: 85
      }
    };

    it('should successfully retrieve active session status', async () => {
      (sessionManager.getSession as Mock).mockResolvedValue(mockSessionState);
      
      // Mock session metadata
      const mockSessionMetadata = {
        startTime: new Date('2024-01-01T10:00:00Z'),
        lastActivity: new Date('2024-01-01T10:05:00Z'),
        isActive: true
      };
      
      // Mock the private activeSessions property
      (sessionManager as any).activeSessions = {
        [mockSessionId]: mockSessionMetadata
      };

      const request = new NextRequest(`http://localhost/api/training/status?sessionId=${mockSessionId}`);
      const response = await getSessionStatus(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        sessionId: mockSessionId,
        sessionStatus: 'active',
        scenario: {
          title: mockScenario.title,
          description: mockScenario.description,
          required_steps: mockScenario.required_steps
        },
        persona: {
          name: mockPersona.name,
          background: mockPersona.background,
          communication_style: mockPersona.communication_style
        },
        progress: {
          currentTurn: 3,
          completedSteps: ['Greet customer'],
          requiredSteps: mockScenario.required_steps,
          completionPercentage: 33 // 1 of 3 steps completed
        },
        scores: {
          policy_adherence: 85,
          empathy_index: 90,
          completeness: 80,
          escalation_judgment: 75,
          time_efficiency: 85,
          overall: 83
        },
        sessionDuration: expect.any(Number),
        lastActivity: '2024-01-01T10:05:00.000Z',
        criticalErrors: []
      });
    });

    it('should retrieve completed session status', async () => {
      (sessionManager.getSession as Mock).mockResolvedValue(null);
      
      const mockCompletedSession = {
        id: mockSessionId,
        userId: 'test-user',
        scenario: mockScenario,
        persona: mockPersona,
        transcript: [
          { _getType: () => 'human', content: 'Hello' },
          { _getType: () => 'ai', content: 'Hi there!' }
        ],
        finalScores: {
          policy_adherence: 85,
          empathy_index: 90,
          completeness: 80,
          escalation_judgment: 75,
          time_efficiency: 85
        },
        feedback: 'Great job!',
        duration: 300000, // 5 minutes
        completedAt: new Date('2024-01-01T10:05:00Z')
      };
      
      (sessionManager.getCompletedSession as Mock).mockResolvedValue(mockCompletedSession);

      const request = new NextRequest(`http://localhost/api/training/status?sessionId=${mockSessionId}`);
      const response = await getSessionStatus(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        sessionId: mockSessionId,
        sessionStatus: 'complete',
        scenario: {
          title: mockScenario.title,
          description: mockScenario.description,
          required_steps: mockScenario.required_steps
        },
        persona: {
          name: mockPersona.name,
          background: mockPersona.background,
          communication_style: mockPersona.communication_style
        },
        progress: {
          currentTurn: 2,
          completedSteps: mockScenario.required_steps,
          requiredSteps: mockScenario.required_steps,
          completionPercentage: 100
        },
        scores: {
          policy_adherence: 85,
          empathy_index: 90,
          completeness: 80,
          escalation_judgment: 75,
          time_efficiency: 85,
          overall: 83
        },
        sessionDuration: 300000,
        lastActivity: '2024-01-01T10:05:00.000Z',
        criticalErrors: []
      });
    });

    it('should return 400 for missing sessionId', async () => {
      const request = new NextRequest('http://localhost/api/training/status');
      const response = await getSessionStatus(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('sessionId query parameter is required');
    });

    it('should return 404 for non-existent session', async () => {
      (sessionManager.getSession as Mock).mockResolvedValue(null);
      (sessionManager.getCompletedSession as Mock).mockResolvedValue(null);

      const request = new NextRequest(`http://localhost/api/training/status?sessionId=non-existent`);
      const response = await getSessionStatus(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Session not found');
    });

    it('should handle session without scenario/persona', async () => {
      const minimalSessionState = {
        sessionId: mockSessionId,
        sessionStatus: 'creating' as const,
        messages: [],
        turnCount: 0,
        requiredSteps: [],
        completedSteps: [],
        criticalErrors: [],
        retrievedContext: []
      };

      (sessionManager.getSession as Mock).mockResolvedValue(minimalSessionState);
      
      const mockSessionMetadata = {
        startTime: new Date('2024-01-01T10:00:00Z'),
        lastActivity: new Date('2024-01-01T10:00:30Z'),
        isActive: true
      };
      
      (sessionManager as any).activeSessions = {
        [mockSessionId]: mockSessionMetadata
      };

      const request = new NextRequest(`http://localhost/api/training/status?sessionId=${mockSessionId}`);
      const response = await getSessionStatus(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.sessionStatus).toBe('creating');
      expect(data.scenario).toBeUndefined();
      expect(data.persona).toBeUndefined();
      expect(data.scores).toBeUndefined();
      expect(data.progress.completionPercentage).toBe(0);
    });
  });
});