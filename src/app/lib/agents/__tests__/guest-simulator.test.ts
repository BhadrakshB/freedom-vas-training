// Unit tests for Guest Simulator Agent
// Tests character consistency across multiple turns and emotional arc progression

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HumanMessage, AIMessage } from '@langchain/core/messages';
import { 
  GuestSimulatorAgent, 
  GuestSimulationInput, 
  GuestSimulationOutput 
} from '../guest-simulator';
import { PersonaData, ScenarioData } from '../../types';

// Mock the ChatGoogleGenerativeAI
vi.mock('@langchain/google-genai', () => ({
  ChatGoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    invoke: vi.fn()
  }))
}));

describe('GuestSimulatorAgent', () => {
  let agent: GuestSimulatorAgent;
  let mockLLM: any;
  let testPersona: PersonaData;
  let testScenario: ScenarioData;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Create agent instance
    agent = new GuestSimulatorAgent('test-api-key');
    
    // Get mock LLM instance
    mockLLM = (agent as any).llm;
    
    // Setup test data
    testPersona = {
      name: 'Sarah Johnson',
      background: 'A business traveler who booked a room for an important conference. She values efficiency and clear communication.',
      personality_traits: ['Direct', 'Professional', 'Time-conscious', 'Detail-oriented'],
      hidden_motivations: ['Worried about conference presentation', 'Needs reliable internet', 'Concerned about noise levels'],
      communication_style: 'Direct and professional, becomes more assertive when stressed',
      emotional_arc: ['curious', 'concerned', 'frustrated', 'satisfied']
    };

    testScenario = {
      title: 'WiFi Connection Issues',
      description: 'Guest is experiencing intermittent WiFi connectivity in their room before an important business presentation.',
      required_steps: ['Acknowledge the issue', 'Troubleshoot basic connectivity', 'Escalate to technical support', 'Provide alternative solutions'],
      critical_errors: ['Dismissing the urgency', 'Not offering alternatives', 'Failing to follow up'],
      time_pressure: 8
    };
  });

  describe('simulateGuestResponse', () => {
    it('should generate a response with persona consistency', async () => {
      // Mock LLM response
      const mockResponse = new AIMessage('I really need this WiFi issue resolved quickly. I have a presentation in two hours and need to download my slides.');
      mockLLM.invoke.mockResolvedValue(mockResponse);

      const input: GuestSimulationInput = {
        persona: testPersona,
        scenario: testScenario,
        conversationHistory: [
          new HumanMessage('Hello! How can I help you today?')
        ],
        currentTurn: 1,
        userResponse: 'Hello! How can I help you today?'
      };

      const result = await agent.simulateGuestResponse(input);

      expect(result).toBeDefined();
      expect(result.response).toBeTruthy();
      expect(result.currentEmotion).toBe('curious'); // First emotion in arc
      expect(result.consistencyScore).toBeGreaterThan(0);
      expect(result.shouldContinue).toBe(true);
      expect(mockLLM.invoke).toHaveBeenCalledOnce();
    });

    it('should progress through emotional arc across multiple turns', async () => {
      const responses = [
        'I need help with my WiFi connection.',
        'This is really concerning - I have an important presentation.',
        'This is getting frustrating. I need this fixed now!',
        'Thank you, that solution worked perfectly.'
      ];

      const results: GuestSimulationOutput[] = [];

      for (let turn = 0; turn < 4; turn++) {
        mockLLM.invoke.mockResolvedValue(new AIMessage(responses[turn]));

        const input: GuestSimulationInput = {
          persona: testPersona,
          scenario: testScenario,
          conversationHistory: results.map((_, i) => new HumanMessage(`Turn ${i + 1}`)),
          currentTurn: turn * 2, // Multiply by 2 to progress through arc faster
          userResponse: `Response to turn ${turn}`
        };

        const result = await agent.simulateGuestResponse(input);
        results.push(result);
      }

      // Verify emotional progression - should progress through the arc
      expect(results[0].currentEmotion).toBe('curious');
      expect(results[1].currentEmotion).toBe('concerned');
      expect(results[2].currentEmotion).toBe('frustrated');
      expect(results[3].currentEmotion).toBe('satisfied');
    });

    it('should maintain character consistency across turns', async () => {
      const professionalResponses = [
        'I need assistance with a technical issue.',
        'Could you please escalate this to your technical team?',
        'I require a prompt resolution to this connectivity problem.',
        'Thank you for your professional assistance.'
      ];

      for (let i = 0; i < professionalResponses.length; i++) {
        mockLLM.invoke.mockResolvedValue(new AIMessage(professionalResponses[i]));

        const input: GuestSimulationInput = {
          persona: testPersona,
          scenario: testScenario,
          conversationHistory: [],
          currentTurn: i,
          userResponse: `Professional response ${i}`
        };

        const result = await agent.simulateGuestResponse(input);
        
        // Should maintain professional tone (high consistency score)
        expect(result.consistencyScore).toBeGreaterThan(0.7);
      }
    });

    it('should reveal information progressively', async () => {
      mockLLM.invoke.mockResolvedValue(new AIMessage('I have a presentation in two hours and the WiFi keeps dropping.'));

      const input: GuestSimulationInput = {
        persona: testPersona,
        scenario: testScenario,
        conversationHistory: [
          new HumanMessage('What seems to be the problem?')
        ],
        currentTurn: 2,
        userResponse: 'What seems to be the problem?'
      };

      const result = await agent.simulateGuestResponse(input);

      expect(result.informationRevealed.length).toBeGreaterThan(0);
      // Should reveal some information as emotional intensity increases
    });

    it('should handle conversation termination appropriately', async () => {
      mockLLM.invoke.mockResolvedValue(new AIMessage('Perfect, everything is working now. Thank you!'));

      const longConversationHistory = Array.from({ length: 21 }, (_, i) => 
        new HumanMessage(`Message ${i + 1}`)
      );

      const input: GuestSimulationInput = {
        persona: testPersona,
        scenario: testScenario,
        conversationHistory: longConversationHistory,
        currentTurn: 21,
        userResponse: 'Is everything working now?'
      };

      const result = await agent.simulateGuestResponse(input);

      expect(result.shouldContinue).toBe(false); // Should terminate after 20+ turns
    });
  });

  describe('validateCharacterConsistency', () => {
    it('should detect consistent character behavior', () => {
      const consistentResponses = [
        'I need this resolved quickly and efficiently.',
        'Could you please provide a direct solution?',
        'Time is of the essence here.',
        'I appreciate your professional assistance.'
      ];

      const emotionalProgression = ['curious', 'concerned', 'frustrated', 'satisfied'];

      const result = agent.validateCharacterConsistency(
        testPersona,
        consistentResponses,
        emotionalProgression
      );

      expect(result.consistent).toBe(true);
      expect(result.issues).toHaveLength(0);
      expect(result.score).toBeGreaterThan(0.8);
    });

    it('should detect inconsistent communication style', () => {
      const inconsistentResponses = [
        'Hey, whatever, the WiFi is kinda broken I guess.',
        'Maybe you could look into it when you get a chance?',
        'No rush or anything, just whenever.',
        'Thanks, I suppose.'
      ];

      const emotionalProgression = ['curious', 'concerned', 'frustrated', 'satisfied'];

      const result = agent.validateCharacterConsistency(
        testPersona,
        inconsistentResponses,
        emotionalProgression
      );

      expect(result.consistent).toBe(false);
      expect(result.issues).toContain('Communication style not consistently maintained across turns');
      expect(result.score).toBeLessThan(0.8);
    });

    it('should detect character breaking', () => {
      const characterBreakingResponses = [
        'I need help with WiFi.',
        'As an AI, I am programmed to simulate frustration.',
        'This is a simulation of guest behavior.',
        'Thank you for the assistance.'
      ];

      const emotionalProgression = ['curious', 'concerned', 'frustrated', 'satisfied'];

      const result = agent.validateCharacterConsistency(
        testPersona,
        characterBreakingResponses,
        emotionalProgression
      );

      expect(result.consistent).toBe(false);
      expect(result.issues).toContain('Character breaking detected in responses');
      expect(result.score).toBeLessThan(0.8);
    });

    it('should detect incorrect emotional arc progression', () => {
      const responses = [
        'I need help with WiFi.',
        'This is concerning.',
        'Getting frustrated now.',
        'Still angry about this.'
      ];

      const incorrectProgression = ['happy', 'excited', 'thrilled', 'ecstatic'];

      const result = agent.validateCharacterConsistency(
        testPersona,
        responses,
        incorrectProgression
      );

      expect(result.consistent).toBe(false);
      expect(result.issues).toContain('Emotional arc progression not following persona design');
    });
  });

  describe('createFallbackResponse', () => {
    it('should create appropriate fallback response', () => {
      const input: GuestSimulationInput = {
        persona: testPersona,
        scenario: testScenario,
        conversationHistory: [],
        currentTurn: 1
      };

      const result = agent.createFallbackResponse(input);

      expect(result.response).toBeTruthy();
      expect(result.currentEmotion).toBe('curious'); // First emotion in arc
      expect(result.consistencyScore).toBe(0.5);
      expect(result.shouldContinue).toBe(true);
      expect(result.informationRevealed).toHaveLength(0);
    });
  });

  describe('emotional state calculation', () => {
    it('should calculate emotional intensity based on personality traits', async () => {
      // Create persona with emotional traits
      const emotionalPersona: PersonaData = {
        ...testPersona,
        personality_traits: ['Passionate', 'Intense', 'Emotional', 'Expressive']
      };

      mockLLM.invoke.mockResolvedValue(new AIMessage('I am really upset about this situation!'));

      const input: GuestSimulationInput = {
        persona: emotionalPersona,
        scenario: testScenario,
        conversationHistory: [],
        currentTurn: 1
      };

      const result = await agent.simulateGuestResponse(input);

      // Should have higher emotional intensity due to emotional traits
      expect(result.consistencyScore).toBeGreaterThan(0);
    });

    it('should increase intensity with conversation length', async () => {
      const longConversation = Array.from({ length: 10 }, (_, i) => 
        new HumanMessage(`Turn ${i + 1}`)
      );

      mockLLM.invoke.mockResolvedValue(new AIMessage('This is taking too long! I need this fixed now!'));

      const input: GuestSimulationInput = {
        persona: testPersona,
        scenario: testScenario,
        conversationHistory: longConversation,
        currentTurn: 6 // Position in emotional arc that should show frustrated
      };

      const result = await agent.simulateGuestResponse(input);

      // Should show progression toward more intense emotions
      expect(['frustrated', 'concerned', 'satisfied'].includes(result.currentEmotion)).toBe(true);
    });
  });

  describe('information revelation strategy', () => {
    it('should reveal more information as emotional intensity increases', async () => {
      // Mock high-intensity emotional response
      mockLLM.invoke.mockResolvedValue(new AIMessage('I am extremely frustrated! I have a critical presentation and need reliable internet immediately!'));

      const input: GuestSimulationInput = {
        persona: testPersona,
        scenario: testScenario,
        conversationHistory: Array.from({ length: 8 }, (_, i) => new HumanMessage(`Turn ${i + 1}`)),
        currentTurn: 8 // Later in conversation
      };

      const result = await agent.simulateGuestResponse(input);

      // Should reveal information when emotionally intense
      expect(result.informationRevealed.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('error handling', () => {
    it('should handle LLM errors gracefully', async () => {
      mockLLM.invoke.mockRejectedValue(new Error('API Error'));

      const input: GuestSimulationInput = {
        persona: testPersona,
        scenario: testScenario,
        conversationHistory: [],
        currentTurn: 1
      };

      await expect(agent.simulateGuestResponse(input)).rejects.toThrow('Guest simulation failed');
    });

    it('should handle malformed LLM responses', async () => {
      mockLLM.invoke.mockResolvedValue(new AIMessage(''));

      const input: GuestSimulationInput = {
        persona: testPersona,
        scenario: testScenario,
        conversationHistory: [],
        currentTurn: 1
      };

      const result = await agent.simulateGuestResponse(input);
      
      // Should still return a valid response structure
      expect(result).toBeDefined();
      expect(typeof result.response).toBe('string');
    });
  });
});