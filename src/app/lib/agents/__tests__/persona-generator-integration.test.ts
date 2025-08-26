// Integration tests for Persona Generator Agent

import { describe, it, expect, beforeEach } from 'vitest';
import { PersonaGeneratorAgent, PersonaGenerationInput } from '../persona-generator';
import { ScenarioData } from '../../types';

// These tests require actual API keys and should be run with --run flag
// They test the actual integration with Gemini API

describe('PersonaGeneratorAgent Integration Tests', () => {
  let agent: PersonaGeneratorAgent;

  // Test scenarios for different complexity levels
  const scenarios: Record<string, ScenarioData> = {
    simple: {
      title: 'Check-in Question',
      description: 'A guest is asking about the check-in process for their upcoming stay',
      required_steps: ['Greet guest', 'Confirm reservation', 'Explain check-in process'],
      critical_errors: ['Being rude', 'Providing wrong information'],
      time_pressure: 3
    },
    complex: {
      title: 'Multiple Booking Conflicts',
      description: 'A guest discovers their reservation conflicts with another booking and they need immediate resolution for their business trip',
      required_steps: [
        'Acknowledge the urgency',
        'Investigate the conflict',
        'Offer alternative solutions',
        'Escalate if necessary',
        'Follow up with confirmation'
      ],
      critical_errors: [
        'Dismissing the urgency',
        'Not investigating thoroughly',
        'Offering unrealistic solutions',
        'Failing to escalate when needed'
      ],
      time_pressure: 9
    },
    emotional: {
      title: 'Complaint About Cleanliness',
      description: 'A guest is upset about the cleanliness of their room and is considering leaving negative reviews',
      required_steps: [
        'Listen empathetically',
        'Apologize sincerely',
        'Assess the situation',
        'Offer immediate solutions',
        'Follow up to ensure satisfaction'
      ],
      critical_errors: [
        'Being defensive',
        'Minimizing their concerns',
        'Not offering adequate solutions',
        'Failing to follow up'
      ],
      time_pressure: 7
    }
  };

  beforeEach(() => {
    // Skip integration tests if no API key is available
    if (!process.env.GOOGLE_API_KEY) {
      console.log('Skipping integration tests - no GOOGLE_API_KEY found');
      return;
    }
    
    agent = new PersonaGeneratorAgent();
  });

  describe('Real API Integration', () => {
    it.skipIf(!process.env.GOOGLE_API_KEY)('should generate persona for simple scenario', async () => {
      const input: PersonaGenerationInput = {
        scenario: scenarios.simple,
        trainingLevel: 'beginner',
        personalityType: 'cooperative'
      };

      const result = await agent.generatePersona(input);

      // Validate structure
      expect(result.persona).toBeDefined();
      expect(result.persona.name).toBeTruthy();
      expect(result.persona.background).toBeTruthy();
      expect(result.persona.personality_traits).toBeInstanceOf(Array);
      expect(result.persona.personality_traits.length).toBeGreaterThan(0);
      expect(result.persona.hidden_motivations).toBeInstanceOf(Array);
      expect(result.persona.communication_style).toBeTruthy();
      expect(result.persona.emotional_arc).toBeInstanceOf(Array);
      expect(result.persona.emotional_arc.length).toBeGreaterThan(1);

      // Validate psychological profile
      expect(result.psychologicalProfile).toBeDefined();
      expect(result.psychologicalProfile.primaryMotivation).toBeTruthy();
      expect(result.psychologicalProfile.stressResponse).toBeTruthy();
      expect(result.psychologicalProfile.communicationPattern).toBeTruthy();
      expect(result.psychologicalProfile.emotionalTriggers).toBeInstanceOf(Array);
      expect(result.psychologicalProfile.resolutionStyle).toBeTruthy();

      // Validate consistency score
      expect(result.consistency).toBeGreaterThan(0);
      expect(result.consistency).toBeLessThanOrEqual(1);

      console.log('Generated persona for simple scenario:', {
        name: result.persona.name,
        traits: result.persona.personality_traits,
        consistency: result.consistency
      });
    }, 30000);

    it.skipIf(!process.env.GOOGLE_API_KEY)('should generate persona for complex scenario', async () => {
      const input: PersonaGenerationInput = {
        scenario: scenarios.complex,
        trainingLevel: 'advanced',
        personalityType: 'difficult',
        specificChallenges: ['Time pressure', 'Multiple stakeholders']
      };

      const result = await agent.generatePersona(input);

      // Should handle complexity appropriately
      expect(result.persona.personality_traits.length).toBeGreaterThan(2);
      expect(result.persona.hidden_motivations.length).toBeGreaterThan(1);
      expect(result.persona.emotional_arc.length).toBeGreaterThan(2);

      // Should reflect the difficulty level
      expect(result.persona.background.toLowerCase()).toMatch(/business|urgent|conflict|pressure/);

      console.log('Generated persona for complex scenario:', {
        name: result.persona.name,
        background: result.persona.background.substring(0, 100) + '...',
        traits: result.persona.personality_traits,
        motivations: result.persona.hidden_motivations
      });
    }, 30000);

    it.skipIf(!process.env.GOOGLE_API_KEY)('should generate persona for emotional scenario', async () => {
      const input: PersonaGenerationInput = {
        scenario: scenarios.emotional,
        trainingLevel: 'intermediate',
        personalityType: 'emotional'
      };

      const result = await agent.generatePersona(input);

      // Should reflect emotional nature
      expect(result.persona.emotional_arc).toContain('upset');
      expect(result.persona.communication_style.toLowerCase()).toMatch(/emotional|frustrated|upset|angry/);

      // Should have appropriate psychological triggers
      expect(result.psychologicalProfile.emotionalTriggers.length).toBeGreaterThan(0);

      console.log('Generated persona for emotional scenario:', {
        name: result.persona.name,
        emotionalArc: result.persona.emotional_arc,
        triggers: result.psychologicalProfile.emotionalTriggers
      });
    }, 30000);

    it.skipIf(!process.env.GOOGLE_API_KEY)('should generate different personas for same scenario', async () => {
      const input: PersonaGenerationInput = {
        scenario: scenarios.simple,
        trainingLevel: 'intermediate'
      };

      // Generate two personas for the same scenario
      const [result1, result2] = await Promise.all([
        agent.generatePersona(input),
        agent.generatePersona(input)
      ]);

      // Should be different personas
      expect(result1.persona.name).not.toBe(result2.persona.name);
      expect(result1.persona.background).not.toBe(result2.persona.background);

      // But should both be valid
      expect(result1.persona.personality_traits.length).toBeGreaterThan(0);
      expect(result2.persona.personality_traits.length).toBeGreaterThan(0);

      console.log('Generated two different personas:', {
        persona1: result1.persona.name,
        persona2: result2.persona.name,
        consistency1: result1.consistency,
        consistency2: result2.consistency
      });
    }, 45000);

    it.skipIf(!process.env.GOOGLE_API_KEY)('should adapt to different training levels', async () => {
      const baseInput = {
        scenario: scenarios.complex,
        personalityType: 'neutral' as const
      };

      const [beginnerResult, advancedResult] = await Promise.all([
        agent.generatePersona({ ...baseInput, trainingLevel: 'beginner' }),
        agent.generatePersona({ ...baseInput, trainingLevel: 'advanced' })
      ]);

      // Advanced should be more complex
      expect(advancedResult.persona.hidden_motivations.length)
        .toBeGreaterThanOrEqual(beginnerResult.persona.hidden_motivations.length);
      
      expect(advancedResult.persona.personality_traits.length)
        .toBeGreaterThanOrEqual(beginnerResult.persona.personality_traits.length);

      console.log('Training level adaptation:', {
        beginner: {
          traits: beginnerResult.persona.personality_traits.length,
          motivations: beginnerResult.persona.hidden_motivations.length
        },
        advanced: {
          traits: advancedResult.persona.personality_traits.length,
          motivations: advancedResult.persona.hidden_motivations.length
        }
      });
    }, 45000);
  });

  describe('Persona Consistency Validation', () => {
    it.skipIf(!process.env.GOOGLE_API_KEY)('should validate consistency of generated persona', async () => {
      const input: PersonaGenerationInput = {
        scenario: scenarios.simple,
        trainingLevel: 'intermediate',
        personalityType: 'cooperative'
      };

      const result = await agent.generatePersona(input);

      // Create mock conversation that should be consistent
      const consistentConversation = [
        `Hi, I'm ${result.persona.name} and I have a question about check-in.`,
        'I want to make sure I understand the process correctly.',
        'Thank you for your help, I appreciate the clear information.'
      ];

      const consistencyCheck = agent.validatePersonaConsistency(
        result.persona,
        consistentConversation
      );

      expect(consistencyCheck.consistent).toBe(true);
      expect(consistencyCheck.issues).toHaveLength(0);

      console.log('Consistency validation passed for:', result.persona.name);
    }, 30000);

    it.skipIf(!process.env.GOOGLE_API_KEY)('should detect inconsistent behavior', async () => {
      const input: PersonaGenerationInput = {
        scenario: scenarios.emotional,
        trainingLevel: 'intermediate',
        personalityType: 'difficult'
      };

      const result = await agent.generatePersona(input);

      // Create conversation that contradicts the persona
      const inconsistentConversation = [
        'Oh hi there! Everything is absolutely perfect!',
        'I love everything about this place, no complaints at all!',
        'You guys are doing such an amazing job, keep it up!',
        'I\'m so happy and relaxed, this is the best experience ever!'
      ];

      const consistencyCheck = agent.validatePersonaConsistency(
        result.persona,
        inconsistentConversation
      );

      // Should detect inconsistency for an emotional/difficult persona
      expect(consistencyCheck.consistent).toBe(false);
      expect(consistencyCheck.issues.length).toBeGreaterThan(0);

      console.log('Detected inconsistency for:', result.persona.name, 'Issues:', consistencyCheck.issues);
    }, 30000);
  });

  describe('Fallback Behavior', () => {
    it('should create valid fallback persona', () => {
      // Create agent for fallback test with dummy API key
      const testAgent = new PersonaGeneratorAgent('dummy-key-for-fallback-test');
      
      const input: PersonaGenerationInput = {
        scenario: scenarios.simple,
        trainingLevel: 'intermediate'
      };

      const result = testAgent.createFallbackPersona(input);

      expect(result.persona.name).toBe('Alex');
      expect(result.persona.background).toContain('intermediate');
      expect(result.persona.background).toContain(scenarios.simple.title);
      expect(result.consistency).toBe(0.7);
      expect(result.psychologicalProfile).toBeDefined();
    });

    it('should adapt fallback to different scenarios', () => {
      // Create agent for fallback test with dummy API key
      const testAgent = new PersonaGeneratorAgent('dummy-key-for-fallback-test');
      
      const inputs = [
        { scenario: scenarios.simple, trainingLevel: 'beginner' as const },
        { scenario: scenarios.complex, trainingLevel: 'advanced' as const },
        { scenario: scenarios.emotional, trainingLevel: 'intermediate' as const }
      ];

      const results = inputs.map(input => testAgent.createFallbackPersona(input));

      // Each should reference its specific scenario and training level
      results.forEach((result, index) => {
        expect(result.persona.background).toContain(inputs[index].trainingLevel);
        expect(result.persona.background).toContain(inputs[index].scenario.title);
      });

      // All should be valid
      results.forEach(result => {
        expect(result.persona.personality_traits.length).toBeGreaterThan(0);
        expect(result.persona.emotional_arc.length).toBeGreaterThan(0);
        expect(result.psychologicalProfile).toBeDefined();
      });
    });
  });
});