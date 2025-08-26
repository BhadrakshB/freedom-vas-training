// Unit tests for Persona Generator Agent

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PersonaGeneratorAgent, PersonaGenerationInput } from '../persona-generator';
import { ScenarioData, PersonaData } from '../../types';
import { validatePersonaData, validatePersonaAgainstSchema } from '../../validation';

// Mock the ChatGoogleGenerativeAI
const mockInvoke = vi.fn();
vi.mock('@langchain/google-genai', () => ({
  ChatGoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    invoke: mockInvoke
  }))
}));

// Mock the validation functions
vi.mock('../../validation', () => ({
  validatePersonaData: vi.fn(),
  validatePersonaAgainstSchema: vi.fn()
}));

describe('PersonaGeneratorAgent', () => {
  let agent: PersonaGeneratorAgent;

  const mockScenario: ScenarioData = {
    title: 'Booking Cancellation Request',
    description: 'A guest needs to cancel their upcoming reservation due to unexpected circumstances',
    required_steps: ['Acknowledge request', 'Check cancellation policy', 'Process cancellation'],
    critical_errors: ['Refusing to help', 'Providing incorrect policy information'],
    time_pressure: 6
  };

  const mockPersonaResponse = {
    content: JSON.stringify({
      name: 'Sarah',
      background: 'A business traveler who booked a weekend getaway but had a family emergency',
      personality_traits: ['Direct communicator', 'Time-conscious', 'Appreciates efficiency'],
      hidden_motivations: ['Worried about cancellation fees', 'Needs quick resolution'],
      communication_style: 'Professional but stressed, gets straight to the point',
      emotional_arc: ['anxious', 'hopeful', 'relieved']
    })
  };

  const mockPsychologicalProfileResponse = {
    content: JSON.stringify({
      primaryMotivation: 'Minimize financial loss from cancellation',
      stressResponse: 'Becomes more direct and asks specific questions',
      communicationPattern: 'Clear and factual',
      emotionalTriggers: ['Unexpected fees', 'Unclear policies'],
      resolutionStyle: 'Wants step-by-step guidance'
    })
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup validation mocks
    vi.mocked(validatePersonaData).mockReturnValue(true);
    vi.mocked(validatePersonaAgainstSchema).mockReturnValue({ valid: true, errors: [] });

    agent = new PersonaGeneratorAgent('test-api-key');
  });

  describe('generatePersona', () => {
    it('should generate a valid persona with psychological depth', async () => {
      // Setup mock responses
      mockInvoke
        .mockResolvedValueOnce(mockPsychologicalProfileResponse) // First call for psychological profile
        .mockResolvedValueOnce(mockPersonaResponse); // Second call for persona

      const input: PersonaGenerationInput = {
        scenario: mockScenario,
        trainingLevel: 'intermediate',
        personalityType: 'neutral'
      };

      const result = await agent.generatePersona(input);

      expect(result.persona).toBeDefined();
      expect(result.persona.name).toBe('Sarah');
      expect(result.persona.personality_traits).toHaveLength(3);
      expect(result.persona.emotional_arc).toHaveLength(3);
      expect(result.consistency).toBeGreaterThan(0);
      expect(result.psychologicalProfile).toBeDefined();
      expect(mockInvoke).toHaveBeenCalledTimes(2);
    });

    it('should handle different training levels appropriately', async () => {
      mockInvoke
        .mockResolvedValueOnce(mockPsychologicalProfileResponse)
        .mockResolvedValueOnce(mockPersonaResponse);

      const beginnerInput: PersonaGenerationInput = {
        scenario: mockScenario,
        trainingLevel: 'beginner'
      };

      const result = await agent.generatePersona(beginnerInput);

      expect(result.persona).toBeDefined();
      expect(mockInvoke).toHaveBeenCalledTimes(2);
      
      // Check that the prompt includes the training level
      const firstCall = mockInvoke.mock.calls[0][0][0];
      expect(firstCall.content).toContain('beginner');
    });

    it('should incorporate specific challenges when provided', async () => {
      mockInvoke
        .mockResolvedValueOnce(mockPsychologicalProfileResponse)
        .mockResolvedValueOnce(mockPersonaResponse);

      const inputWithChallenges: PersonaGenerationInput = {
        scenario: mockScenario,
        trainingLevel: 'advanced',
        specificChallenges: ['Language barrier', 'Multiple booking conflicts']
      };

      await agent.generatePersona(inputWithChallenges);

      // Check that challenges are included in the psychological profile prompt
      const firstCall = mockInvoke.mock.calls[0][0][0];
      expect(firstCall.content).toContain('Language barrier');
      expect(firstCall.content).toContain('Multiple booking conflicts');
    });

    it('should handle different personality types', async () => {
      mockInvoke
        .mockResolvedValueOnce(mockPsychologicalProfileResponse)
        .mockResolvedValueOnce(mockPersonaResponse);

      const difficultPersonaInput: PersonaGenerationInput = {
        scenario: mockScenario,
        trainingLevel: 'intermediate',
        personalityType: 'difficult'
      };

      await agent.generatePersona(difficultPersonaInput);

      const firstCall = mockInvoke.mock.calls[0][0][0];
      expect(firstCall.content).toContain('difficult');
    });

    it('should throw error when schema validation fails', async () => {
      mockInvoke
        .mockResolvedValueOnce(mockPsychologicalProfileResponse)
        .mockResolvedValueOnce(mockPersonaResponse);

      vi.mocked(validatePersonaAgainstSchema).mockReturnValue({
        valid: false,
        errors: ['Missing required field: name']
      });

      const input: PersonaGenerationInput = {
        scenario: mockScenario,
        trainingLevel: 'intermediate'
      };

      await expect(agent.generatePersona(input)).rejects.toThrow('Persona schema validation failed');
    });

    it('should throw error when type validation fails', async () => {
      mockInvoke
        .mockResolvedValueOnce(mockPsychologicalProfileResponse)
        .mockResolvedValueOnce(mockPersonaResponse);

      vi.mocked(validatePersonaData).mockReturnValue(false);

      const input: PersonaGenerationInput = {
        scenario: mockScenario,
        trainingLevel: 'intermediate'
      };

      await expect(agent.generatePersona(input)).rejects.toThrow('Generated persona failed type validation');
    });

    it('should handle malformed JSON responses gracefully', async () => {
      mockInvoke
        .mockResolvedValueOnce({ content: 'Invalid JSON response' })
        .mockResolvedValueOnce(mockPersonaResponse);

      const input: PersonaGenerationInput = {
        scenario: mockScenario,
        trainingLevel: 'intermediate'
      };

      await expect(agent.generatePersona(input)).rejects.toThrow('Failed to parse psychological profile');
    });
  });

  describe('validatePersonaConsistency', () => {
    const mockPersona: PersonaData = {
      name: 'Sarah',
      background: 'Business traveler with family emergency',
      personality_traits: ['Direct', 'Professional', 'Time-conscious'],
      hidden_motivations: ['Avoid cancellation fees', 'Quick resolution'],
      communication_style: 'Direct and professional, gets straight to the point',
      emotional_arc: ['anxious', 'hopeful', 'relieved']
    };

    it('should validate consistent persona behavior', () => {
      const conversationHistory = [
        'Hi, I need to cancel my reservation urgently due to a family emergency.',
        'Can you please tell me what the cancellation policy is?',
        'I understand there might be fees, but I need to know the exact amount.'
      ];

      const result = agent.validatePersonaConsistency(mockPersona, conversationHistory);

      expect(result.consistent).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should detect inconsistent communication style', () => {
      const conversationHistory = [
        'Hey there! How are you doing today?',
        'I was wondering if maybe you could help me with something?',
        'No rush at all, whenever you have time!',
        'Just let me know when you get a chance!'
      ];

      const result = agent.validatePersonaConsistency(mockPersona, conversationHistory);

      expect(result.consistent).toBe(false);
      expect(result.issues).toContain('Communication style not consistently maintained');
    });

    it('should detect missing personality traits in conversation', () => {
      const conversationHistory = [
        'Hello',
        'Yes',
        'Okay',
        'Thank you'
      ];

      const result = agent.validatePersonaConsistency(mockPersona, conversationHistory);

      expect(result.consistent).toBe(false);
      expect(result.issues).toContain('Personality traits not reflected in conversation');
    });

    it('should handle short conversations appropriately', () => {
      const shortConversation = ['Hi, I need help'];

      const result = agent.validatePersonaConsistency(mockPersona, shortConversation);

      // Should not flag issues for very short conversations
      expect(result.consistent).toBe(true);
    });
  });

  describe('createFallbackPersona', () => {
    it('should create a valid fallback persona', () => {
      const input: PersonaGenerationInput = {
        scenario: mockScenario,
        trainingLevel: 'intermediate'
      };

      const result = agent.createFallbackPersona(input);

      expect(result.persona).toBeDefined();
      expect(result.persona.name).toBe('Alex');
      expect(result.persona.personality_traits).toHaveLength(3);
      expect(result.persona.emotional_arc).toHaveLength(3);
      expect(result.consistency).toBe(0.7);
      expect(result.psychologicalProfile).toBeDefined();
    });

    it('should include scenario context in fallback persona', () => {
      const input: PersonaGenerationInput = {
        scenario: mockScenario,
        trainingLevel: 'beginner'
      };

      const result = agent.createFallbackPersona(input);

      expect(result.persona.background).toContain(mockScenario.title);
      expect(result.persona.background).toContain('beginner');
    });
  });

  describe('consistency scoring', () => {
    it('should calculate consistency score for personas', async () => {
      const wellAlignedResponse = {
        content: JSON.stringify({
          name: 'Professional Sarah',
          background: 'A direct business professional who values efficiency and clear communication in all interactions',
          personality_traits: ['Direct', 'Efficient', 'Professional'],
          hidden_motivations: ['Wants quick resolution', 'Values clear information'],
          communication_style: 'Direct and professional communication style',
          emotional_arc: ['concerned', 'focused', 'satisfied']
        })
      };

      const alignedProfileResponse = {
        content: JSON.stringify({
          primaryMotivation: 'Seeking efficient resolution',
          stressResponse: 'Becomes more direct',
          communicationPattern: 'Direct and clear',
          emotionalTriggers: ['Delays', 'Unclear information'],
          resolutionStyle: 'Prefers step-by-step solutions'
        })
      };

      mockInvoke
        .mockResolvedValueOnce(alignedProfileResponse)
        .mockResolvedValueOnce(wellAlignedResponse);

      const input: PersonaGenerationInput = {
        scenario: mockScenario,
        trainingLevel: 'intermediate'
      };

      const result = await agent.generatePersona(input);

      expect(result.consistency).toBeGreaterThanOrEqual(0);
      expect(result.consistency).toBeLessThanOrEqual(1);
    });

    it('should calculate lower consistency for poorly aligned personas', async () => {
      const poorlyAlignedResponse = {
        content: JSON.stringify({
          name: 'Casual Joe',
          background: 'A laid-back person',
          personality_traits: ['Relaxed', 'Easygoing'],
          hidden_motivations: ['No rush'],
          communication_style: 'Very casual and relaxed',
          emotional_arc: ['happy', 'content']
        })
      };

      const strictProfileResponse = {
        content: JSON.stringify({
          primaryMotivation: 'Demanding immediate action',
          stressResponse: 'Becomes aggressive',
          communicationPattern: 'Formal and demanding',
          emotionalTriggers: ['Any delay'],
          resolutionStyle: 'Wants instant solutions'
        })
      };

      mockInvoke
        .mockResolvedValueOnce(strictProfileResponse)
        .mockResolvedValueOnce(poorlyAlignedResponse);

      const input: PersonaGenerationInput = {
        scenario: mockScenario,
        trainingLevel: 'intermediate'
      };

      const result = await agent.generatePersona(input);

      expect(result.consistency).toBeLessThan(0.8);
    });
  });

  describe('error handling', () => {
    it('should handle LLM API failures gracefully', async () => {
      mockInvoke.mockRejectedValue(new Error('API Error'));

      const input: PersonaGenerationInput = {
        scenario: mockScenario,
        trainingLevel: 'intermediate'
      };

      await expect(agent.generatePersona(input)).rejects.toThrow('Persona generation failed');
    });

    it('should handle empty responses from LLM', async () => {
      mockInvoke
        .mockResolvedValueOnce({ content: '' })
        .mockResolvedValueOnce(mockPersonaResponse);

      const input: PersonaGenerationInput = {
        scenario: mockScenario,
        trainingLevel: 'intermediate'
      };

      await expect(agent.generatePersona(input)).rejects.toThrow('No JSON object found in response');
    });

    it('should handle array content responses from LLM', async () => {
      const arrayContentResponse = {
        content: [
          { text: JSON.stringify({
            primaryMotivation: 'Test motivation',
            stressResponse: 'Test response',
            communicationPattern: 'Test pattern',
            emotionalTriggers: ['Test trigger'],
            resolutionStyle: 'Test style'
          }) }
        ]
      };

      mockInvoke
        .mockResolvedValueOnce(arrayContentResponse)
        .mockResolvedValueOnce(mockPersonaResponse);

      const input: PersonaGenerationInput = {
        scenario: mockScenario,
        trainingLevel: 'intermediate'
      };

      const result = await agent.generatePersona(input);

      expect(result.persona).toBeDefined();
      expect(result.psychologicalProfile).toBeDefined();
      // Just verify that the response was processed without error
      expect(typeof result.psychologicalProfile.primaryMotivation).toBe('string');
    });
  });
});