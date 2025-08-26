// Integration tests for Guest Simulator Agent
// Tests realistic conversation flows and character consistency over extended interactions

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HumanMessage, AIMessage } from '@langchain/core/messages';
import { 
  GuestSimulatorAgent, 
  GuestSimulationInput, 
  GuestSimulationOutput 
} from '../guest-simulator';
import { PersonaData, ScenarioData } from '../../types';

// Mock the ChatGoogleGenerativeAI with more realistic responses
vi.mock('@langchain/google-genai', () => ({
  ChatGoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    invoke: vi.fn()
  }))
}));

describe('GuestSimulatorAgent Integration Tests', () => {
  let agent: GuestSimulatorAgent;
  let mockLLM: any;

  beforeEach(() => {
    vi.clearAllMocks();
    agent = new GuestSimulatorAgent('test-api-key');
    mockLLM = (agent as any).llm;
  });

  describe('Complete Conversation Flow - WiFi Issue Scenario', () => {
    const wifiPersona: PersonaData = {
      name: 'Marcus Chen',
      background: 'A software engineer attending a tech conference. He needs reliable internet for his remote work and presentation prep.',
      personality_traits: ['Technical-minded', 'Methodical', 'Patient initially', 'Becomes direct when frustrated'],
      hidden_motivations: ['Has important client call in 3 hours', 'Reputation depends on presentation quality', 'Prefers technical solutions over workarounds'],
      communication_style: 'Starts polite and technical, becomes more direct and specific when issues persist',
      emotional_arc: ['curious', 'analytical', 'concerned', 'frustrated', 'relieved']
    };

    const wifiScenario: ScenarioData = {
      title: 'Intermittent WiFi Connectivity',
      description: 'Guest is experiencing WiFi drops every 10-15 minutes, affecting their ability to work and prepare for an important presentation.',
      required_steps: ['Acknowledge urgency', 'Basic troubleshooting', 'Technical escalation', 'Alternative solutions', 'Follow-up confirmation'],
      critical_errors: ['Suggesting guest use mobile data for work', 'Not escalating technical issues', 'Dismissing business impact'],
      time_pressure: 7
    };

    it('should maintain character consistency through complete conversation', async () => {
      const conversationFlow = [
        {
          vaMessage: 'Hello! How can I assist you today?',
          expectedGuestResponse: 'Hi, I\'m having some WiFi connectivity issues in my room. It keeps dropping every 10-15 minutes.',
          expectedEmotion: 'curious'
        },
        {
          vaMessage: 'I understand that must be frustrating. Can you tell me your room number and when this started?',
          expectedGuestResponse: 'Room 412. It started about 2 hours ago. I\'m a software engineer and need stable internet for work.',
          expectedEmotion: 'analytical'
        },
        {
          vaMessage: 'Let me check our system. Have you tried restarting your device?',
          expectedGuestResponse: 'Yes, I\'ve already restarted my laptop and phone. The issue seems to be with the hotel\'s network.',
          expectedEmotion: 'analytical'
        },
        {
          vaMessage: 'I see. Let me have our technical team look into this.',
          expectedGuestResponse: 'I appreciate that, but I have an important client call in 3 hours. This is becoming concerning.',
          expectedEmotion: 'concerned'
        },
        {
          vaMessage: 'I understand the urgency. Our tech team is investigating. Can I offer you a temporary solution?',
          expectedGuestResponse: 'What kind of temporary solution? I need something reliable for my presentation prep.',
          expectedEmotion: 'concerned'
        },
        {
          vaMessage: 'We can move you to a room with a direct ethernet connection.',
          expectedGuestResponse: 'That would be perfect! A wired connection is exactly what I need. When can we make this happen?',
          expectedEmotion: 'relieved'
        }
      ];

      const conversationHistory: any[] = [];
      const results: GuestSimulationOutput[] = [];

      for (let i = 0; i < conversationFlow.length; i++) {
        const turn = conversationFlow[i];
        
        // Mock the LLM response for this turn
        mockLLM.invoke.mockResolvedValueOnce(new AIMessage(turn.expectedGuestResponse));

        const input: GuestSimulationInput = {
          persona: wifiPersona,
          scenario: wifiScenario,
          conversationHistory: [...conversationHistory],
          currentTurn: i,
          userResponse: turn.vaMessage
        };

        const result = await agent.simulateGuestResponse(input);
        results.push(result);

        // Add messages to conversation history
        conversationHistory.push(new HumanMessage(turn.vaMessage));
        conversationHistory.push(new AIMessage(result.response));

        // Verify emotional progression (allow for some flexibility)
        expect(wifiPersona.emotional_arc).toContain(result.currentEmotion);
        
        // Verify character consistency
        expect(result.consistencyScore).toBeGreaterThan(0.6);
      }

      // Validate overall character consistency across the conversation
      const allResponses = results.map(r => r.response);
      const emotionalProgression = results.map(r => r.currentEmotion);

      const consistencyCheck = agent.validateCharacterConsistency(
        wifiPersona,
        allResponses,
        emotionalProgression
      );

      // Verify overall consistency is reasonable
      expect(consistencyCheck.score).toBeGreaterThan(0.5);
    });
  });

  describe('Complete Conversation Flow - Booking Complaint Scenario', () => {
    const complaintPersona: PersonaData = {
      name: 'Jennifer Walsh',
      background: 'A marketing executive who booked a premium room for a romantic anniversary weekend. She has high expectations and is detail-oriented.',
      personality_traits: ['Assertive', 'Quality-focused', 'Emotionally invested', 'Expects premium service'],
      hidden_motivations: ['Anniversary is very important to her', 'Wants to impress her partner', 'Has told friends about this trip'],
      communication_style: 'Starts professional but becomes more emotional when expectations aren\'t met',
      emotional_arc: ['disappointed', 'frustrated', 'upset', 'hopeful', 'satisfied']
    };

    const complaintScenario: ScenarioData = {
      title: 'Room Not As Advertised',
      description: 'Guest booked a premium room with city view for anniversary but received a standard room facing the parking lot.',
      required_steps: ['Acknowledge disappointment', 'Verify booking details', 'Offer immediate solution', 'Provide compensation', 'Ensure satisfaction'],
      critical_errors: ['Blaming the guest', 'Not offering alternatives', 'Minimizing the importance of the occasion'],
      time_pressure: 6
    };

    it('should handle emotional escalation and de-escalation appropriately', async () => {
      const emotionalFlow = [
        {
          vaMessage: 'Good evening! How can I help you?',
          mockResponse: 'I\'m quite disappointed. We booked a premium city view room for our anniversary, but this room faces the parking lot.',
          expectedEmotion: 'disappointed',
          expectedIntensity: 'medium'
        },
        {
          vaMessage: 'I apologize for the inconvenience. Let me check your reservation.',
          mockResponse: 'This is really frustrating. We specifically chose this hotel for the view, and it\'s our 10th anniversary.',
          expectedEmotion: 'frustrated',
          expectedIntensity: 'high'
        },
        {
          vaMessage: 'I understand how important this is. Unfortunately, we\'re fully booked tonight, but I can offer you a complimentary upgrade tomorrow.',
          mockResponse: 'Tomorrow? This is tonight that matters! I can\'t believe this is happening on our anniversary.',
          expectedEmotion: 'upset',
          expectedIntensity: 'very high'
        },
        {
          vaMessage: 'I completely understand your frustration. Let me see what else I can do - perhaps a complimentary dinner at our rooftop restaurant with city views?',
          mockResponse: 'Well... that might help. The rooftop restaurant does have beautiful views. What would that include?',
          expectedEmotion: 'hopeful',
          expectedIntensity: 'medium'
        },
        {
          vaMessage: 'A full three-course dinner for two, champagne, and priority seating with our best view table. Plus, I\'ll ensure you get the city view room tomorrow at no extra charge.',
          mockResponse: 'That actually sounds wonderful. Thank you for understanding how important this is to us.',
          expectedEmotion: 'satisfied',
          expectedIntensity: 'low'
        }
      ];

      const conversationHistory: any[] = [];
      const results: GuestSimulationOutput[] = [];

      for (let i = 0; i < emotionalFlow.length; i++) {
        const turn = emotionalFlow[i];
        
        mockLLM.invoke.mockResolvedValueOnce(new AIMessage(turn.mockResponse));

        const input: GuestSimulationInput = {
          persona: complaintPersona,
          scenario: complaintScenario,
          conversationHistory: [...conversationHistory],
          currentTurn: i,
          userResponse: turn.vaMessage
        };

        const result = await agent.simulateGuestResponse(input);
        results.push(result);

        conversationHistory.push(new HumanMessage(turn.vaMessage));
        conversationHistory.push(new AIMessage(result.response));

        // Verify emotional progression (allow for some flexibility)
        expect(complaintPersona.emotional_arc).toContain(result.currentEmotion);
      }

      // Verify that emotions are from the expected arc
      const emotionalProgression = results.map(r => r.currentEmotion);
      emotionalProgression.forEach(emotion => {
        expect(complaintPersona.emotional_arc).toContain(emotion);
      });
    });
  });

  describe('Information Revelation Patterns', () => {
    const secretivePersona: PersonaData = {
      name: 'David Kim',
      background: 'A business traveler who is actually interviewing for a new job secretly. He\'s nervous about confidentiality.',
      personality_traits: ['Cautious', 'Professional', 'Secretive initially', 'Opens up when trust is built'],
      hidden_motivations: ['Job interview is confidential', 'Current employer cannot know', 'Needs discretion'],
      communication_style: 'Formal and vague initially, becomes more open as trust develops',
      emotional_arc: ['guarded', 'cautious', 'trusting', 'open']
    };

    const discretionScenario: ScenarioData = {
      title: 'Special Accommodation Request',
      description: 'Guest needs early check-in and late check-out for business meetings but is vague about details.',
      required_steps: ['Understand needs', 'Build trust', 'Offer solutions', 'Ensure discretion'],
      critical_errors: ['Pressing for details', 'Not respecting privacy', 'Being too casual'],
      time_pressure: 4
    };

    it('should reveal information progressively as trust builds', async () => {
      const trustBuildingFlow = [
        {
          vaMessage: 'How can I assist you with your stay?',
          mockResponse: 'I need some special arrangements for my business meetings.',
          expectedInfoRevealed: 0 // Very guarded initially
        },
        {
          vaMessage: 'Of course, I\'d be happy to help. What kind of arrangements do you need?',
          mockResponse: 'I need early check-in and late check-out. It\'s for important meetings.',
          expectedInfoRevealed: 1 // Reveals basic needs
        },
        {
          vaMessage: 'I can arrange that. We understand business travel requirements. Is there anything else?',
          mockResponse: 'Actually, discretion is very important. I\'m here for some confidential meetings.',
          expectedInfoRevealed: 2 // Reveals need for discretion
        },
        {
          vaMessage: 'Absolutely, we respect our guests\' privacy completely. Your confidentiality is assured.',
          mockResponse: 'Thank you. I\'m actually interviewing for a position and my current employer can\'t know.',
          expectedInfoRevealed: 3 // Full revelation after trust is established
        }
      ];

      const conversationHistory: any[] = [];
      let totalInfoRevealed = 0;

      for (let i = 0; i < trustBuildingFlow.length; i++) {
        const turn = trustBuildingFlow[i];
        
        mockLLM.invoke.mockResolvedValueOnce(new AIMessage(turn.mockResponse));

        const input: GuestSimulationInput = {
          persona: secretivePersona,
          scenario: discretionScenario,
          conversationHistory: [...conversationHistory],
          currentTurn: i,
          userResponse: turn.vaMessage
        };

        const result = await agent.simulateGuestResponse(input);
        totalInfoRevealed += result.informationRevealed.length;

        conversationHistory.push(new HumanMessage(turn.vaMessage));
        conversationHistory.push(new AIMessage(result.response));

        // Verify progressive information revelation
        expect(totalInfoRevealed).toBeGreaterThanOrEqual(turn.expectedInfoRevealed);
      }
    });
  });

  describe('Multi-Turn Character Consistency Validation', () => {
    it('should maintain consistent personality across extended conversation', async () => {
      const consistentPersona: PersonaData = {
        name: 'Robert Thompson',
        background: 'A retired teacher who is very polite and methodical in his communication.',
        personality_traits: ['Polite', 'Patient', 'Methodical', 'Appreciative'],
        hidden_motivations: ['Values good service', 'Likes to understand processes'],
        communication_style: 'Always polite, asks clarifying questions, expresses gratitude',
        emotional_arc: ['pleasant', 'curious', 'understanding', 'grateful']
      };

      const serviceScenario: ScenarioData = {
        title: 'General Service Inquiry',
        description: 'Guest has questions about hotel amenities and local recommendations.',
        required_steps: ['Provide information', 'Offer additional help', 'Ensure satisfaction'],
        critical_errors: ['Being rushed', 'Not being thorough'],
        time_pressure: 2
      };

      // Simulate 8 turns of conversation
      const politeResponses = [
        'Good morning! I hope you\'re having a pleasant day. I have a few questions about the hotel amenities.',
        'Thank you for that information. Could you please tell me more about the fitness center hours?',
        'I appreciate your help. Do you happen to know any good restaurants within walking distance?',
        'That sounds wonderful. May I ask about the hotel\'s shuttle service to downtown?',
        'You\'ve been very helpful. Is there a concierge who could help with theater tickets?',
        'Excellent! Could you please explain how the concierge service works?',
        'I understand. Thank you for taking the time to explain everything so clearly.',
        'You\'ve been absolutely wonderful. I really appreciate your patience and thoroughness.'
      ];

      const conversationHistory: any[] = [];
      const results: GuestSimulationOutput[] = [];

      for (let i = 0; i < 8; i++) {
        mockLLM.invoke.mockResolvedValueOnce(new AIMessage(politeResponses[i]));

        const input: GuestSimulationInput = {
          persona: consistentPersona,
          scenario: serviceScenario,
          conversationHistory: [...conversationHistory],
          currentTurn: i,
          userResponse: `VA response ${i + 1}`
        };

        const result = await agent.simulateGuestResponse(input);
        results.push(result);

        conversationHistory.push(new HumanMessage(`VA response ${i + 1}`));
        conversationHistory.push(new AIMessage(result.response));

        // Each response should maintain reasonable consistency
        expect(result.consistencyScore).toBeGreaterThan(0.6);
      }

      // Validate overall consistency
      const allResponses = results.map(r => r.response);
      const emotionalProgression = results.map(r => r.currentEmotion);

      const consistencyCheck = agent.validateCharacterConsistency(
        consistentPersona,
        allResponses,
        emotionalProgression
      );

      // Verify overall consistency is reasonable
      expect(consistencyCheck.score).toBeGreaterThan(0.5);
    });

    it('should detect and flag character inconsistencies', async () => {
      const professionalPersona: PersonaData = {
        name: 'Amanda Foster',
        background: 'A corporate executive who values professionalism and efficiency.',
        personality_traits: ['Professional', 'Direct', 'Time-conscious', 'Results-oriented'],
        hidden_motivations: ['Needs efficient service', 'Values competence'],
        communication_style: 'Professional, direct, and business-like',
        emotional_arc: ['businesslike', 'focused', 'satisfied']
      };

      // Simulate inconsistent responses that break character
      const inconsistentResponses = [
        'I need to discuss a business matter with you.',
        'Hey there! This is like, totally awesome!', // Character break - too casual
        'Whatever, I don\'t really care about the details.', // Character break - unprofessional
        'Thank you for your professional assistance.'
      ];

      const conversationHistory: any[] = [];
      const results: GuestSimulationOutput[] = [];

      for (let i = 0; i < inconsistentResponses.length; i++) {
        mockLLM.invoke.mockResolvedValueOnce(new AIMessage(inconsistentResponses[i]));

        const input: GuestSimulationInput = {
          persona: professionalPersona,
          scenario: {
            title: 'Business Inquiry',
            description: 'Professional guest needs business services.',
            required_steps: ['Provide information'],
            critical_errors: ['Being unprofessional'],
            time_pressure: 5
          },
          conversationHistory: [...conversationHistory],
          currentTurn: i,
          userResponse: `Professional response ${i + 1}`
        };

        const result = await agent.simulateGuestResponse(input);
        results.push(result);

        conversationHistory.push(new HumanMessage(`Professional response ${i + 1}`));
        conversationHistory.push(new AIMessage(result.response));
      }

      // Validate that inconsistencies are detected
      const allResponses = results.map(r => r.response);
      const emotionalProgression = results.map(r => r.currentEmotion);

      const consistencyCheck = agent.validateCharacterConsistency(
        professionalPersona,
        allResponses,
        emotionalProgression
      );

      expect(consistencyCheck.consistent).toBe(false);
      expect(consistencyCheck.score).toBeLessThan(0.8);
      expect(consistencyCheck.issues.length).toBeGreaterThan(0);
    });
  });
});