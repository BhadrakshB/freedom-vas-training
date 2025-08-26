// End-to-End Integration Tests for Training Session API Flow
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

describe('Training Session API Integration Flow', () => {
  const mockSessionId = 'session_integration_test';
  const mockScenario = {
    title: 'Integration Test Scenario',
    description: 'Test scenario for integration testing',
    required_steps: ['Step 1', 'Step 2', 'Step 3'],
    critical_errors: ['Critical error'],
    time_pressure: 5
  };
  const mockPersona = {
    name: 'Test Persona',
    background: 'Test background',
    personality_traits: ['friendly'],
    hidden_motivations: ['test motivation'],
    communication_style: 'professional',
    emotional_arc: ['neutral', 'satisfied']
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should handle complete training session workflow', async () => {
    // Step 1: Start a new session
    (sessionManager.createSession as Mock).mockResolvedValue(mockSessionId);
    (sessionManager.updateSession as Mock).mockResolvedValue(undefined);

    const mockTrainingGraph = {
      startSession: vi.fn().mockResolvedValue({
        sessionId: mockSessionId,
        sessionStatus: 'active',
        scenario: mockScenario,
        persona: mockPersona,
        messages: [],
        turnCount: 0,
        requiredSteps: mockScenario.required_steps,
        completedSteps: [],
        criticalErrors: [],
        retrievedContext: []
      }),
      continueSession: vi.fn()
    };
    (createTrainingSimulatorGraph as Mock).mockReturnValue(mockTrainingGraph);

    const startRequest = new NextRequest('http://localhost/api/training/start', {
      method: 'POST',
      body: JSON.stringify({
        trainingObjective: 'Integration test training',
        difficulty: 'beginner',
        category: 'general'
      })
    });

    const startResponse = await startSession(startRequest);
    const startData = await startResponse.json();

    expect(startResponse.status).toBe(201);
    expect(startData.sessionId).toBe(mockSessionId);
    expect(startData.status).toBe('ready');

    // Step 2: Check initial session status
    const mockSessionState = {
      sessionId: mockSessionId,
      sessionStatus: 'active' as const,
      scenario: mockScenario,
      persona: mockPersona,
      messages: [],
      turnCount: 0,
      requiredSteps: mockScenario.required_steps,
      completedSteps: [],
      criticalErrors: [],
      retrievedContext: []
    };

    (sessionManager.getSession as Mock).mockResolvedValue(mockSessionState);
    (sessionManager as any).activeSessions = {
      [mockSessionId]: {
        startTime: new Date('2024-01-01T10:00:00Z'),
        lastActivity: new Date('2024-01-01T10:00:30Z'),
        isActive: true
      }
    };

    const statusRequest1 = new NextRequest(`http://localhost/api/training/status?sessionId=${mockSessionId}`);
    const statusResponse1 = await getSessionStatus(statusRequest1);
    const statusData1 = await statusResponse1.json();

    expect(statusResponse1.status).toBe(200);
    expect(statusData1.sessionStatus).toBe('active');
    expect(statusData1.progress.completionPercentage).toBe(0);

    // Step 3: Send first user response
    const updatedSessionState = {
      ...mockSessionState,
      turnCount: 1,
      completedSteps: ['Step 1'],
      messages: [
        { _getType: () => 'human', content: 'Hello, I need help with booking' },
        { _getType: () => 'ai', content: 'Hello! I\'d be happy to help you with your booking.' }
      ]
    };

    mockTrainingGraph.continueSession.mockResolvedValue(updatedSessionState);
    (sessionManager.getSession as Mock).mockResolvedValue(updatedSessionState);

    const respondRequest1 = new NextRequest('http://localhost/api/training/respond', {
      method: 'POST',
      body: JSON.stringify({
        sessionId: mockSessionId,
        userResponse: 'Hello, I need help with booking'
      })
    });

    const respondResponse1 = await respondToSession(respondRequest1);
    const respondData1 = await respondResponse1.json();

    expect(respondResponse1.status).toBe(200);
    expect(respondData1.sessionStatus).toBe('active');
    expect(respondData1.guestResponse).toBe('Hello! I\'d be happy to help you with your booking.');

    // Step 4: Check updated session status
    (sessionManager as any).activeSessions[mockSessionId].lastActivity = new Date('2024-01-01T10:01:00Z');

    const statusRequest2 = new NextRequest(`http://localhost/api/training/status?sessionId=${mockSessionId}`);
    const statusResponse2 = await getSessionStatus(statusRequest2);
    const statusData2 = await statusResponse2.json();

    expect(statusResponse2.status).toBe(200);
    expect(statusData2.progress.completionPercentage).toBe(33); // 1 of 3 steps completed
    expect(statusData2.progress.currentTurn).toBe(1);

    // Step 5: Complete the session
    const completedSessionState = {
      ...updatedSessionState,
      sessionStatus: 'complete' as const,
      turnCount: 3,
      completedSteps: mockScenario.required_steps,
      scores: {
        policy_adherence: 85,
        empathy_index: 90,
        completeness: 80,
        escalation_judgment: 75,
        time_efficiency: 85
      },
      messages: [
        ...updatedSessionState.messages,
        { _getType: () => 'human', content: 'Thank you for your help!' },
        { _getType: () => 'ai', content: 'Training Session Complete - Excellent work!' }
      ]
    };

    mockTrainingGraph.continueSession.mockResolvedValue(completedSessionState);
    (sessionManager.getSession as Mock).mockResolvedValue(updatedSessionState); // Use the previous state for getSession
    (sessionManager.completeSession as Mock).mockResolvedValue({
      id: mockSessionId,
      scenario: mockScenario,
      persona: mockPersona,
      finalScores: completedSessionState.scores
    });

    const respondRequest2 = new NextRequest('http://localhost/api/training/respond', {
      method: 'POST',
      body: JSON.stringify({
        sessionId: mockSessionId,
        userResponse: 'Thank you for your help!'
      })
    });

    const respondResponse2 = await respondToSession(respondRequest2);
    const respondData2 = await respondResponse2.json();

    expect(respondResponse2.status).toBe(200);
    expect(respondData2.sessionStatus).toBe('complete');
    expect(respondData2.feedback).toBeDefined();
    expect(respondData2.feedback.overallScore).toBe(83);

    // Step 6: Check final session status (completed session)
    (sessionManager.getSession as Mock).mockResolvedValue(null);
    (sessionManager.getCompletedSession as Mock).mockResolvedValue({
      id: mockSessionId,
      userId: 'anonymous',
      scenario: mockScenario,
      persona: mockPersona,
      transcript: completedSessionState.messages,
      finalScores: completedSessionState.scores,
      feedback: 'Training completed successfully',
      duration: 180000, // 3 minutes
      completedAt: new Date('2024-01-01T10:03:00Z')
    });

    const statusRequest3 = new NextRequest(`http://localhost/api/training/status?sessionId=${mockSessionId}`);
    const statusResponse3 = await getSessionStatus(statusRequest3);
    const statusData3 = await statusResponse3.json();

    expect(statusResponse3.status).toBe(200);
    expect(statusData3.sessionStatus).toBe('complete');
    expect(statusData3.progress.completionPercentage).toBe(100);
    expect(statusData3.scores.overall).toBe(83);

    // Verify all expected calls were made
    expect(sessionManager.createSession).toHaveBeenCalledWith('anonymous');
    expect(mockTrainingGraph.startSession).toHaveBeenCalledWith({
      trainingObjective: 'Integration test training',
      difficulty: 'beginner',
      category: 'general',
      userId: undefined
    });
    expect(mockTrainingGraph.continueSession).toHaveBeenCalledTimes(2);
    expect(sessionManager.completeSession).toHaveBeenCalledWith(mockSessionId);
  });

  it('should handle session errors gracefully throughout the workflow', async () => {
    // Test error handling during session start
    (sessionManager.createSession as Mock).mockRejectedValue(new Error('Session creation failed'));

    const startRequest = new NextRequest('http://localhost/api/training/start', {
      method: 'POST',
      body: JSON.stringify({
        trainingObjective: 'Error test training'
      })
    });

    const startResponse = await startSession(startRequest);
    expect(startResponse.status).toBe(500);

    // Test error handling during response processing
    (sessionManager.getSession as Mock).mockResolvedValue({
      sessionId: 'error-session',
      sessionStatus: 'active',
      scenario: mockScenario,
      persona: mockPersona,
      messages: [],
      turnCount: 0,
      requiredSteps: [],
      completedSteps: [],
      criticalErrors: [],
      retrievedContext: []
    });

    const mockTrainingGraph = {
      continueSession: vi.fn().mockRejectedValue(new Error('AI service unavailable'))
    };
    (createTrainingSimulatorGraph as Mock).mockReturnValue(mockTrainingGraph);

    const respondRequest = new NextRequest('http://localhost/api/training/respond', {
      method: 'POST',
      body: JSON.stringify({
        sessionId: 'error-session',
        userResponse: 'Test response'
      })
    });

    const respondResponse = await respondToSession(respondRequest);
    expect(respondResponse.status).toBe(500);

    // Test error handling during status retrieval
    (sessionManager.getSession as Mock).mockRejectedValue(new Error('Database error'));

    const statusRequest = new NextRequest('http://localhost/api/training/status?sessionId=error-session');
    const statusResponse = await getSessionStatus(statusRequest);
    expect(statusResponse.status).toBe(500);
  });

  it('should validate request parameters across all endpoints', async () => {
    // Test start endpoint validation
    const invalidStartRequest = new NextRequest('http://localhost/api/training/start', {
      method: 'POST',
      body: JSON.stringify({
        difficulty: 'invalid-difficulty'
      })
    });

    const startResponse = await startSession(invalidStartRequest);
    expect(startResponse.status).toBe(400);

    // Test respond endpoint validation
    const invalidRespondRequest = new NextRequest('http://localhost/api/training/respond', {
      method: 'POST',
      body: JSON.stringify({
        sessionId: '',
        userResponse: 'a'.repeat(2001) // Too long
      })
    });

    const respondResponse = await respondToSession(invalidRespondRequest);
    expect(respondResponse.status).toBe(400);

    // Test status endpoint validation
    const invalidStatusRequest = new NextRequest('http://localhost/api/training/status');
    const statusResponse = await getSessionStatus(invalidStatusRequest);
    expect(statusResponse.status).toBe(400);
  });
});