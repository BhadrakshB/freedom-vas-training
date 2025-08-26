// Integration tests for Scenario Creator Agent with Pinecone Service

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ScenarioCreatorAgent, ScenarioCreationInput } from '../scenario-creator';
import { PineconeService } from '../../pinecone-service';
import { Document } from '../../service-interfaces';

// Mock the external dependencies but test the integration
vi.mock('@langchain/google-genai');

const mockInvoke = vi.fn();
vi.mock('@langchain/google-genai', () => ({
  ChatGoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    invoke: mockInvoke
  }))
}));

describe('ScenarioCreatorAgent Integration', () => {
  let pineconeService: PineconeService;
  let agent: ScenarioCreatorAgent;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create real Pinecone service (but with mocked external calls)
    pineconeService = new PineconeService('test-key', 'test-index');
    agent = new ScenarioCreatorAgent(pineconeService, 'test-api-key');
  });

  it('should integrate scenario creation with SOP retrieval workflow', async () => {
    // Mock successful SOP ingestion
    const sampleSOPs: Document[] = [
      {
        id: 'test_sop_1',
        content: 'Always verify guest identity before processing bookings. Check ID and payment method.',
        metadata: {
          type: 'sop',
          category: 'booking',
          difficulty: 'beginner',
          tags: ['verification', 'booking']
        }
      }
    ];

    // Mock Pinecone operations
    vi.spyOn(pineconeService, 'initialize').mockResolvedValue();
    vi.spyOn(pineconeService, 'ingestSOPs').mockResolvedValue();
    vi.spyOn(pineconeService, 'retrieveRelevantSOPs').mockResolvedValue([
      {
        content: sampleSOPs[0].content,
        metadata: sampleSOPs[0].metadata,
        score: 0.92
      }
    ]);

    // Mock LLM response
    mockInvoke.mockResolvedValue({
      content: JSON.stringify({
        title: 'Guest Identity Verification Challenge',
        description: 'A guest is trying to make a booking but their ID information doesn\'t match their payment method. Handle this verification process professionally.',
        required_steps: [
          'Request proper identification',
          'Verify payment method matches ID',
          'Explain verification requirements politely',
          'Process booking once verified'
        ],
        critical_errors: [
          'Processing booking without proper verification',
          'Being rude about verification requirements',
          'Accepting mismatched information'
        ],
        time_pressure: 4
      })
    });

    // Test the full workflow
    const input: ScenarioCreationInput = {
      trainingObjective: 'Practice guest identity verification during booking',
      difficulty: 'beginner',
      category: 'booking'
    };

    const result = await agent.createScenario(input);

    // Verify the integration worked
    expect(pineconeService.retrieveRelevantSOPs).toHaveBeenCalledWith(
      'Practice guest identity verification during booking',
      {
        type: 'sop',
        difficulty: 'beginner',
        category: 'booking'
      }
    );

    expect(result.scenario.title).toBe('Guest Identity Verification Challenge');
    expect(result.scenario.required_steps).toHaveLength(4);
    expect(result.scenario.critical_errors).toHaveLength(3);
    expect(result.confidence).toBeGreaterThan(0.9);
    expect(result.sopReferences).toHaveLength(1);
  });

  it('should handle the complete error recovery workflow', async () => {
    // Mock Pinecone failure
    vi.spyOn(pineconeService, 'retrieveRelevantSOPs').mockRejectedValue(
      new Error('Pinecone connection failed')
    );

    const input: ScenarioCreationInput = {
      trainingObjective: 'Handle booking issues',
      difficulty: 'intermediate',
      category: 'booking'
    };

    // Should fail gracefully and not create scenario
    await expect(agent.createScenario(input)).rejects.toThrow('Scenario creation failed');

    // But fallback should work
    const fallbackResult = await agent.createFallbackScenario(input);
    expect(fallbackResult.scenario.title).toContain('intermediate');
    expect(fallbackResult.scenario.title).toContain('booking');
    expect(fallbackResult.confidence).toBe(0.3);
  });

  it('should properly format prompts with SOP context', async () => {
    const mockSOPs = [
      {
        content: 'SOP 1: Always greet guests warmly and professionally.',
        metadata: { type: 'sop', category: 'general', difficulty: 'beginner', tags: ['greeting'] },
        score: 0.95
      },
      {
        content: 'SOP 2: Verify all booking details before confirmation.',
        metadata: { type: 'sop', category: 'booking', difficulty: 'beginner', tags: ['verification'] },
        score: 0.88
      }
    ];

    vi.spyOn(pineconeService, 'retrieveRelevantSOPs').mockResolvedValue(mockSOPs);

    // Capture the prompt sent to LLM
    let capturedPrompt = '';
    mockInvoke.mockImplementation((messages) => {
      capturedPrompt = messages[0].content;
      return Promise.resolve({
        content: JSON.stringify({
          title: 'Test Scenario',
          description: 'Test description with sufficient length for validation',
          required_steps: ['Step 1'],
          critical_errors: ['Error 1'],
          time_pressure: 5
        })
      });
    });

    const input: ScenarioCreationInput = {
      trainingObjective: 'Test SOP integration',
      difficulty: 'beginner',
      category: 'booking',
      specificSOPs: ['greeting', 'verification']
    };

    await agent.createScenario(input);

    // Verify prompt contains SOP context
    expect(capturedPrompt).toContain('RELEVANT COMPANY SOPs:');
    expect(capturedPrompt).toContain('SOP 1: Always greet guests warmly');
    expect(capturedPrompt).toContain('SOP 2: Verify all booking details');
    expect(capturedPrompt).toContain('TRAINING OBJECTIVE: Test SOP integration');
    expect(capturedPrompt).toContain('DIFFICULTY LEVEL: beginner');
    expect(capturedPrompt).toContain('CATEGORY: booking');
  });

  it('should validate generated scenarios meet quality standards', async () => {
    vi.spyOn(pineconeService, 'retrieveRelevantSOPs').mockResolvedValue([]);

    const input: ScenarioCreationInput = {
      trainingObjective: 'Test validation',
      difficulty: 'beginner'
    };

    // Test with response that fails schema validation (missing required fields)
    mockInvoke.mockResolvedValueOnce({
      content: JSON.stringify({
        title: 'Test',
        description: 'Short'
        // missing required_steps, critical_errors, time_pressure
      })
    });
    
    await expect(agent.createScenario(input)).rejects.toThrow('schema validation failed');

    // Test with response that has invalid description length
    mockInvoke.mockResolvedValueOnce({
      content: JSON.stringify({
        title: 'Valid Title',
        description: 'Too short', // Less than 10 characters
        required_steps: ['Step 1'],
        critical_errors: ['Error 1'],
        time_pressure: 5
      })
    });
    
    await expect(agent.createScenario(input)).rejects.toThrow('schema validation failed');

    // Test with response that has empty arrays
    mockInvoke.mockResolvedValueOnce({
      content: JSON.stringify({
        title: 'Valid Title',
        description: 'This is a valid description with sufficient length',
        required_steps: [], // Empty array should fail
        critical_errors: [], // Empty array should fail
        time_pressure: 5
      })
    });
    
    await expect(agent.createScenario(input)).rejects.toThrow('schema validation failed');

    // Test with valid response
    mockInvoke.mockResolvedValueOnce({
      content: JSON.stringify({
        title: 'Valid Scenario',
        description: 'This is a valid scenario description with sufficient length to pass validation',
        required_steps: ['Step 1', 'Step 2'],
        critical_errors: ['Error 1'],
        time_pressure: 5
      })
    });

    const result = await agent.createScenario(input);
    expect(result.scenario.title).toBe('Valid Scenario');
  });
});