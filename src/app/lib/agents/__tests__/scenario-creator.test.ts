// Unit tests for Scenario Creator Agent

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { ScenarioCreatorAgent, ScenarioCreationInput } from '../scenario-creator';
import { PineconeService } from '../../pinecone-service';
import { RetrievalResult, ScenarioData } from '../../types';
import { validateScenarioData, validateScenarioAgainstSchema } from '../../validation';

// Mock the dependencies
vi.mock('../../pinecone-service');
vi.mock('@langchain/google-genai');

// Mock ChatGoogleGenerativeAI
const mockInvoke = vi.fn();
vi.mock('@langchain/google-genai', () => ({
  ChatGoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    invoke: mockInvoke
  }))
}));

describe('ScenarioCreatorAgent', () => {
  let agent: ScenarioCreatorAgent;
  let mockPineconeService: PineconeService;
  let mockSOPReferences: RetrievalResult[];

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Create mock Pinecone service
    mockPineconeService = {
      retrieveRelevantSOPs: vi.fn(),
      retrieveTrainingContent: vi.fn(),
      searchPolicyGuidance: vi.fn(),
      ingestSOPs: vi.fn(),
      ingestTrainingMaterials: vi.fn(),
      tagDocument: vi.fn(),
    } as any;

    // Create mock SOP references
    mockSOPReferences = [
      {
        content: 'When handling booking inquiries, always verify guest identity and payment information before confirming reservations.',
        metadata: {
          type: 'sop',
          category: 'booking',
          difficulty: 'beginner',
          tags: ['booking', 'verification']
        },
        score: 0.95
      },
      {
        content: 'For overbooking situations, immediately offer alternative accommodations and provide compensation according to policy.',
        metadata: {
          type: 'sop',
          category: 'overbooking',
          difficulty: 'intermediate',
          tags: ['overbooking', 'compensation']
        },
        score: 0.88
      }
    ];

    // Setup mock Pinecone service responses
    (mockPineconeService.retrieveRelevantSOPs as Mock).mockResolvedValue(mockSOPReferences);

    // Create agent instance
    agent = new ScenarioCreatorAgent(mockPineconeService, 'test-api-key');
  });

  describe('createScenario', () => {
    it('should create a valid scenario with SOP grounding', async () => {
      // Mock LLM response with valid JSON
      const mockLLMResponse = {
        content: JSON.stringify({
          title: 'Booking Verification Challenge',
          description: 'A guest is trying to make a last-minute booking but their payment method is being declined. Handle this situation professionally while following verification procedures.',
          required_steps: [
            'Acknowledge the booking request promptly',
            'Verify guest identity',
            'Assist with payment method resolution',
            'Confirm booking details'
          ],
          critical_errors: [
            'Proceeding without proper identity verification',
            'Accepting invalid payment methods',
            'Being unprofessional with frustrated guests'
          ],
          time_pressure: 6
        })
      };

      mockInvoke.mockResolvedValue(mockLLMResponse);

      const input: ScenarioCreationInput = {
        trainingObjective: 'Practice booking verification procedures',
        difficulty: 'intermediate',
        category: 'booking'
      };

      const result = await agent.createScenario(input);

      // Verify SOP retrieval was called correctly
      expect(mockPineconeService.retrieveRelevantSOPs).toHaveBeenCalledWith(
        'Practice booking verification procedures',
        {
          type: 'sop',
          difficulty: 'intermediate',
          category: 'booking'
        }
      );

      // Verify scenario structure
      expect(result.scenario).toBeDefined();
      expect(result.scenario.title).toBe('Booking Verification Challenge');
      expect(result.scenario.required_steps).toHaveLength(4);
      expect(result.scenario.critical_errors).toHaveLength(3);
      expect(result.scenario.time_pressure).toBe(6);

      // Verify SOP references are included
      expect(result.sopReferences).toEqual(mockSOPReferences);

      // Verify confidence calculation
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should handle specific SOPs in input', async () => {
      const mockLLMResponse = {
        content: JSON.stringify({
          title: 'Test Scenario',
          description: 'Test description',
          required_steps: ['Step 1'],
          critical_errors: ['Error 1'],
          time_pressure: 5
        })
      };

      mockInvoke.mockResolvedValue(mockLLMResponse);

      const input: ScenarioCreationInput = {
        trainingObjective: 'Test objective',
        difficulty: 'beginner',
        specificSOPs: ['payment verification', 'guest communication']
      };

      await agent.createScenario(input);

      // Verify search query includes specific SOPs
      expect(mockPineconeService.retrieveRelevantSOPs).toHaveBeenCalledWith(
        'Test objective payment verification guest communication',
        {
          type: 'sop',
          difficulty: 'beginner'
        }
      );
    });

    it('should validate scenario against JSON schema', async () => {
      // Mock LLM response with invalid JSON (missing required field)
      const mockLLMResponse = {
        content: JSON.stringify({
          title: 'Test Scenario',
          description: 'Test description',
          required_steps: ['Step 1'],
          // missing critical_errors
          time_pressure: 5
        })
      };

      mockInvoke.mockResolvedValue(mockLLMResponse);

      const input: ScenarioCreationInput = {
        trainingObjective: 'Test objective',
        difficulty: 'beginner'
      };

      await expect(agent.createScenario(input)).rejects.toThrow('schema validation failed');
    });

    it('should handle malformed JSON responses', async () => {
      // Mock LLM response with invalid JSON
      const mockLLMResponse = {
        content: 'This is not valid JSON { incomplete'
      };

      mockInvoke.mockResolvedValue(mockLLMResponse);

      const input: ScenarioCreationInput = {
        trainingObjective: 'Test objective',
        difficulty: 'beginner'
      };

      await expect(agent.createScenario(input)).rejects.toThrow('Failed to parse scenario JSON');
    });

    it('should handle Pinecone service failures gracefully', async () => {
      // Mock Pinecone service to throw error
      (mockPineconeService.retrieveRelevantSOPs as Mock).mockRejectedValue(
        new Error('Pinecone connection failed')
      );

      const input: ScenarioCreationInput = {
        trainingObjective: 'Test objective',
        difficulty: 'beginner'
      };

      await expect(agent.createScenario(input)).rejects.toThrow('Scenario creation failed');
    });

    it('should calculate confidence based on SOP quality', async () => {
      const mockLLMResponse = {
        content: JSON.stringify({
          title: 'Test Scenario',
          description: 'Test description with sufficient length',
          required_steps: ['Step 1'],
          critical_errors: ['Error 1'],
          time_pressure: 5
        })
      };

      mockInvoke.mockResolvedValue(mockLLMResponse);

      // Test with high-quality SOPs
      const highQualitySOPs = [
        { ...mockSOPReferences[0], score: 0.95 },
        { ...mockSOPReferences[1], score: 0.90 }
      ];
      (mockPineconeService.retrieveRelevantSOPs as Mock).mockResolvedValue(highQualitySOPs);

      const input: ScenarioCreationInput = {
        trainingObjective: 'Test objective',
        difficulty: 'beginner'
      };

      const result = await agent.createScenario(input);
      expect(result.confidence).toBeGreaterThan(0.9);

      // Test with low-quality SOPs
      const lowQualitySOPs = [
        { ...mockSOPReferences[0], score: 0.3 },
        { ...mockSOPReferences[1], score: 0.2 }
      ];
      (mockPineconeService.retrieveRelevantSOPs as Mock).mockResolvedValue(lowQualitySOPs);

      const result2 = await agent.createScenario(input);
      expect(result2.confidence).toBeLessThan(0.5);
    });

    it('should handle empty SOP results', async () => {
      const mockLLMResponse = {
        content: JSON.stringify({
          title: 'Test Scenario',
          description: 'Test description with sufficient length',
          required_steps: ['Step 1'],
          critical_errors: ['Error 1'],
          time_pressure: 5
        })
      };

      mockInvoke.mockResolvedValue(mockLLMResponse);

      // Mock empty SOP results
      (mockPineconeService.retrieveRelevantSOPs as Mock).mockResolvedValue([]);

      const input: ScenarioCreationInput = {
        trainingObjective: 'Test objective',
        difficulty: 'beginner'
      };

      const result = await agent.createScenario(input);
      expect(result.confidence).toBe(0.3); // Low confidence without SOPs
      expect(result.sopReferences).toHaveLength(0);
    });
  });

  describe('createFallbackScenario', () => {
    it('should create a fallback scenario when SOP retrieval fails', async () => {
      const input: ScenarioCreationInput = {
        trainingObjective: 'Handle guest complaints',
        difficulty: 'advanced',
        category: 'complaint'
      };

      const result = await agent.createFallbackScenario(input);

      expect(result.scenario.title).toContain('advanced');
      expect(result.scenario.title).toContain('complaint');
      expect(result.scenario.description).toContain('Handle guest complaints');
      expect(result.scenario.time_pressure).toBe(8); // Advanced difficulty
      expect(result.confidence).toBe(0.3);
      expect(result.sopReferences).toHaveLength(0);
    });

    it('should adjust time pressure based on difficulty', async () => {
      const beginnerInput: ScenarioCreationInput = {
        trainingObjective: 'Basic booking',
        difficulty: 'beginner'
      };

      const intermediateInput: ScenarioCreationInput = {
        trainingObjective: 'Complex booking',
        difficulty: 'intermediate'
      };

      const advancedInput: ScenarioCreationInput = {
        trainingObjective: 'Crisis management',
        difficulty: 'advanced'
      };

      const beginnerResult = await agent.createFallbackScenario(beginnerInput);
      const intermediateResult = await agent.createFallbackScenario(intermediateInput);
      const advancedResult = await agent.createFallbackScenario(advancedInput);

      expect(beginnerResult.scenario.time_pressure).toBe(3);
      expect(intermediateResult.scenario.time_pressure).toBe(6);
      expect(advancedResult.scenario.time_pressure).toBe(8);
    });
  });

  describe('JSON parsing and validation', () => {
    it('should extract JSON from mixed content responses', async () => {
      const mockLLMResponse = {
        content: `Here's the scenario you requested:

        {
          "title": "Mixed Content Test",
          "description": "This tests JSON extraction from mixed content responses",
          "required_steps": ["Step 1", "Step 2"],
          "critical_errors": ["Error 1"],
          "time_pressure": 4
        }

        This scenario should work well for training.`
      };

      mockInvoke.mockResolvedValue(mockLLMResponse);

      const input: ScenarioCreationInput = {
        trainingObjective: 'Test JSON extraction',
        difficulty: 'beginner'
      };

      const result = await agent.createScenario(input);
      expect(result.scenario.title).toBe('Mixed Content Test');
    });

    it('should handle array content in LLM responses', async () => {
      const mockLLMResponse = {
        content: [
          { text: 'Here is your scenario: ' },
          { 
            text: JSON.stringify({
              title: 'Array Content Test',
              description: 'Testing array content handling in responses',
              required_steps: ['Step 1'],
              critical_errors: ['Error 1'],
              time_pressure: 3
            })
          }
        ]
      };

      mockInvoke.mockResolvedValue(mockLLMResponse);

      const input: ScenarioCreationInput = {
        trainingObjective: 'Test array content',
        difficulty: 'beginner'
      };

      const result = await agent.createScenario(input);
      expect(result.scenario.title).toBe('Array Content Test');
    });

    it('should apply defaults for missing optional fields', async () => {
      const mockLLMResponse = {
        content: JSON.stringify({
          // Missing title - should get default
          description: 'Test description with sufficient length',
          required_steps: ['Step 1'],
          critical_errors: ['Error 1'],
          time_pressure: 15 // Out of range - should be clamped
        })
      };

      mockInvoke.mockResolvedValue(mockLLMResponse);

      const input: ScenarioCreationInput = {
        trainingObjective: 'Test defaults',
        difficulty: 'beginner'
      };

      const result = await agent.createScenario(input);
      expect(result.scenario.title).toBe('Untitled Scenario');
      expect(result.scenario.time_pressure).toBe(10); // Clamped to max
    });
  });
});

// Test the validation functions separately
describe('Scenario Validation', () => {
  describe('validateScenarioAgainstSchema', () => {
    it('should validate correct scenario data', () => {
      const validScenario = {
        title: 'Valid Scenario',
        description: 'This is a valid scenario description with sufficient length',
        required_steps: ['Step 1', 'Step 2'],
        critical_errors: ['Error 1'],
        time_pressure: 5
      };

      const result = validateScenarioAgainstSchema(validScenario);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should catch missing required fields', () => {
      const invalidScenario = {
        title: 'Invalid Scenario',
        // missing description, required_steps, critical_errors, time_pressure
      };

      const result = validateScenarioAgainstSchema(invalidScenario);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: description');
      expect(result.errors).toContain('Missing required field: required_steps');
      expect(result.errors).toContain('Missing required field: critical_errors');
      expect(result.errors).toContain('Missing required field: time_pressure');
    });

    it('should validate field constraints', () => {
      const invalidScenario = {
        title: '', // Too short
        description: 'Short', // Too short
        required_steps: [], // Empty array
        critical_errors: [], // Empty array
        time_pressure: 15 // Out of range
      };

      const result = validateScenarioAgainstSchema(invalidScenario);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate array item types', () => {
      const invalidScenario = {
        title: 'Test Scenario',
        description: 'Valid description with sufficient length',
        required_steps: ['Valid step', '', 123], // Contains empty string and number
        critical_errors: ['Valid error', null], // Contains null
        time_pressure: 5
      };

      const result = validateScenarioAgainstSchema(invalidScenario);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('All required steps must be non-empty strings');
      expect(result.errors).toContain('All critical errors must be non-empty strings');
    });
  });
});