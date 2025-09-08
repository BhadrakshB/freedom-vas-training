// Guest Agent - Handles guest simulation and conversation processing

import { TrainingError } from "../error-handling";

interface ProcessConversationInput {
  scenario: {
    title: string;
    description: string;
    objectives: string[];
    context: string;
  };
  guestPersona: {
    name: string;
    background: string;
    personality: string;
    emotionalState: string;
    communicationStyle: string;
  };
  conversationHistory: Array<{
    role: "user" | "guest";
    content: string;
    timestamp?: string;
  }>;
}

interface ConversationResponse {
  guestResponse: string;
  sessionStatus: 'active' | 'completed' | 'paused';
  currentScore?: number;
  feedback?: {
    immediate?: string;
    suggestions?: string[];
  };
}

export class GuestAgent {
  async processConversation(input: ProcessConversationInput): Promise<ConversationResponse> {
    try {
      // Mock implementation for now - in real version, this would use AI agents
      const lastUserMessage = input.conversationHistory
        .filter(msg => msg.role === 'user')
        .pop()?.content || '';

      // Generate contextual response based on persona and conversation
      let guestResponse = this.generateContextualResponse(
        lastUserMessage,
        input.guestPersona,
        input.conversationHistory.length
      );

      // Determine session status
      const sessionStatus = this.determineSessionStatus(input.conversationHistory);

      return {
        guestResponse,
        sessionStatus,
        currentScore: this.calculateCurrentScore(input.conversationHistory),
        feedback: this.generateImmediateFeedback(lastUserMessage)
      };
    } catch (error) {
      throw new TrainingError(
        "Failed to process guest conversation",
        'agent',
        'medium',
        'GUEST_PROCESSING_FAILED',
        { originalError: error }
      );
    }
  }

  private generateContextualResponse(
    userMessage: string,
    persona: ProcessConversationInput['guestPersona'],
    conversationLength: number
  ): string {
    // Mock response generation based on persona
    const responses = [
      `Thank you for that information. As ${persona.name}, I appreciate your help. Could you tell me more about the amenities?`,
      `That sounds good, but I'm still a bit concerned about the location. Is it safe for families?`,
      `Perfect! I think this place would work well for us. What's the next step to confirm the booking?`,
      `I understand. Let me discuss this with my family and get back to you soon.`
    ];

    return responses[Math.min(conversationLength % responses.length, responses.length - 1)];
  }

  private determineSessionStatus(conversationHistory: ProcessConversationInput['conversationHistory']): 'active' | 'completed' | 'paused' {
    // Simple logic: complete after 10+ messages or if booking confirmed
    if (conversationHistory.length >= 10) {
      return 'completed';
    }
    
    const lastMessages = conversationHistory.slice(-3).map(msg => msg.content.toLowerCase());
    const bookingKeywords = ['book', 'confirm', 'reserve', 'proceed'];
    
    if (lastMessages.some(msg => bookingKeywords.some(keyword => msg.includes(keyword)))) {
      return 'completed';
    }

    return 'active';
  }

  private calculateCurrentScore(conversationHistory: ProcessConversationInput['conversationHistory']): number {
    // Mock scoring based on conversation length and content
    const baseScore = 70;
    const lengthBonus = Math.min(conversationHistory.length * 2, 20);
    const randomVariation = Math.random() * 10 - 5; // ±5 points
    
    return Math.max(0, Math.min(100, baseScore + lengthBonus + randomVariation));
  }

  private generateImmediateFeedback(userMessage: string): { immediate?: string; suggestions?: string[] } | undefined {
    // Provide occasional feedback
    if (Math.random() < 0.3) { // 30% chance of feedback
      return {
        immediate: "Good empathetic response!",
        suggestions: ["Consider asking about specific dates", "Mention available amenities"]
      };
    }
    return undefined;
  }
}

export function createGuestAgent(): GuestAgent {
  return new GuestAgent();
}