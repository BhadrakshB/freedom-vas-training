// Guest Simulator Agent for AI Training Simulator
// Implements guest response generation with persona consistency and emotional arc progression

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, AIMessage, BaseMessage } from "@langchain/core/messages";
import { PersonaData, ScenarioData } from "../types";
import { AGENT_CONFIGS } from "../service-interfaces";

export interface GuestSimulationInput {
  persona: PersonaData;
  scenario: ScenarioData;
  conversationHistory: BaseMessage[];
  currentTurn: number;
  userResponse?: string;
}

export interface GuestSimulationOutput {
  response: string;
  currentEmotion: string;
  informationRevealed: string[];
  consistencyScore: number;
  shouldContinue: boolean;
}

export interface EmotionalState {
  currentEmotion: string;
  intensity: number;
  triggers: string[];
  nextEmotion?: string;
}

export interface InformationRevealStrategy {
  totalInformation: string[];
  revealedSoFar: string[];
  nextToReveal: string[];
  revealTriggers: string[];
}

export class GuestSimulatorAgent {
  private llm: ChatGoogleGenerativeAI;

  constructor(apiKey?: string) {
    const config = AGENT_CONFIGS.guestSimulator;
    this.llm = new ChatGoogleGenerativeAI({
      model: config.model,
      apiKey: apiKey || process.env.GOOGLE_API_KEY!,
      temperature: config.temperature,
      maxOutputTokens: config.maxTokens,
    });
  }

  /**
   * Generate guest response maintaining persona consistency and emotional progression
   */
  async simulateGuestResponse(input: GuestSimulationInput): Promise<GuestSimulationOutput> {
    try {
      // Step 1: Determine current emotional state based on conversation progress
      const emotionalState = this.calculateEmotionalState(input);

      // Step 2: Plan information revelation strategy
      const infoStrategy = this.planInformationRevelation(input, emotionalState);

      // Step 3: Generate response with persona consistency
      const response = await this.generatePersonaConsistentResponse(input, emotionalState, infoStrategy);

      // Step 4: Calculate consistency score
      const consistencyScore = this.calculateConsistencyScore(input, response, emotionalState);

      // Step 5: Determine if conversation should continue
      const shouldContinue = this.shouldContinueConversation(input, emotionalState);

      return {
        response,
        currentEmotion: emotionalState.currentEmotion,
        informationRevealed: infoStrategy.nextToReveal,
        consistencyScore,
        shouldContinue
      };
    } catch (error) {
      throw new Error(`Guest simulation failed: ${error}`);
    }
  }

  /**
   * Calculate current emotional state based on persona's emotional arc and conversation progress
   */
  private calculateEmotionalState(input: GuestSimulationInput): EmotionalState {
    const { persona, conversationHistory, currentTurn } = input;
    
    // Determine position in emotional arc based on current turn
    const arcLength = persona.emotional_arc.length;
    const maxTurns = 8; // Expected conversation length for full emotional arc
    const arcPosition = Math.min(
      Math.floor((currentTurn / maxTurns) * arcLength),
      arcLength - 1
    );

    const currentEmotion = persona.emotional_arc[arcPosition] || persona.emotional_arc[0];
    const nextEmotion = arcPosition < arcLength - 1 ? persona.emotional_arc[arcPosition + 1] : undefined;

    // Calculate intensity based on personality traits and conversation context
    let intensity = 0.5; // Base intensity
    
    // Increase intensity for emotional personality traits
    const emotionalTraits = ['passionate', 'intense', 'emotional', 'dramatic', 'expressive'];
    const hasEmotionalTraits = persona.personality_traits.some(trait =>
      emotionalTraits.some(eTrait => trait.toLowerCase().includes(eTrait))
    );
    if (hasEmotionalTraits) {
      intensity += 0.2;
    }

    // Adjust intensity based on conversation length (frustration builds)
    const totalTurns = conversationHistory.length;
    if (totalTurns > 5) {
      intensity += Math.min(0.3, (totalTurns - 5) * 0.05);
    }

    // Extract triggers from hidden motivations
    const triggers = persona.hidden_motivations.map(motivation => 
      motivation.toLowerCase().replace(/[^a-z\s]/g, '').trim()
    );

    return {
      currentEmotion,
      intensity: Math.min(1.0, intensity),
      triggers,
      nextEmotion
    };
  }

  /**
   * Plan what information to reveal based on conversation flow and emotional state
   */
  private planInformationRevelation(
    input: GuestSimulationInput,
    emotionalState: EmotionalState
  ): InformationRevealStrategy {
    const { persona, scenario, conversationHistory, currentTurn } = input;

    // Extract total information from persona background and hidden motivations
    const totalInformation = [
      ...persona.hidden_motivations,
      ...this.extractBackgroundDetails(persona.background),
      ...this.extractScenarioSpecificInfo(scenario)
    ];

    // Determine what's already been revealed by analyzing conversation history
    const revealedSoFar = this.analyzeRevealedInformation(conversationHistory, totalInformation);

    // Plan next information to reveal based on emotional state and conversation flow
    const nextToReveal = this.selectNextInformationToReveal(
      totalInformation,
      revealedSoFar,
      emotionalState,
      currentTurn
    );

    // Define triggers that would cause information revelation
    const revealTriggers = [
      'direct question',
      'empathetic response',
      'escalation needed',
      'trust building',
      'emotional peak'
    ];

    return {
      totalInformation,
      revealedSoFar,
      nextToReveal,
      revealTriggers
    };
  }

  /**
   * Generate response that maintains persona consistency
   */
  private async generatePersonaConsistentResponse(
    input: GuestSimulationInput,
    emotionalState: EmotionalState,
    infoStrategy: InformationRevealStrategy
  ): Promise<string> {
    const prompt = this.buildGuestResponsePrompt(input, emotionalState, infoStrategy);

    const response = await this.llm.invoke([new HumanMessage(prompt)]);
    const responseText = this.extractTextFromResponse(response);

    // Clean up the response to ensure it's natural
    return this.cleanupResponse(responseText);
  }

  /**
   * Build prompt for guest response generation
   */
  private buildGuestResponsePrompt(
    input: GuestSimulationInput,
    emotionalState: EmotionalState,
    infoStrategy: InformationRevealStrategy
  ): string {
    const { persona, scenario, conversationHistory, userResponse, currentTurn } = input;

    // Build conversation context
    const conversationContext = conversationHistory
      .slice(-6) // Last 6 messages for context
      .map((msg, index) => {
        const role = msg._getType() === 'human' ? 'VA' : 'Guest';
        return `${role}: ${msg.content}`;
      })
      .join('\n');

    const latestUserResponse = userResponse ? `\nVA's Latest Response: ${userResponse}` : '';

    return `You are ${persona.name}, a guest interacting with a virtual assistant. You must stay completely in character.

PERSONA DETAILS:
Name: ${persona.name}
Background: ${persona.background}
Personality Traits: ${persona.personality_traits.join(', ')}
Communication Style: ${persona.communication_style}
Hidden Motivations: ${persona.hidden_motivations.join(', ')}

CURRENT EMOTIONAL STATE:
Current Emotion: ${emotionalState.currentEmotion}
Intensity: ${Math.round(emotionalState.intensity * 100)}%
${emotionalState.nextEmotion ? `Progressing toward: ${emotionalState.nextEmotion}` : ''}

SCENARIO CONTEXT:
${scenario.description}

CONVERSATION SO FAR:
${conversationContext}${latestUserResponse}

INFORMATION TO POTENTIALLY REVEAL:
${infoStrategy.nextToReveal.length > 0 ? infoStrategy.nextToReveal.join(', ') : 'Continue natural conversation flow'}

INSTRUCTIONS:
1. Respond as ${persona.name} would, maintaining complete character consistency
2. Match your current emotional state (${emotionalState.currentEmotion}) in tone and word choice
3. Follow your communication style: ${persona.communication_style}
4. Reveal information naturally if the VA's response warrants it
5. Do NOT break character or mention this is training
6. Keep response conversational and realistic (1-3 sentences typically)
7. Show personality traits through your language and reactions
8. Progress toward your next emotional state if appropriate

Respond as ${persona.name}:`;
  }

  /**
   * Extract background details for information revelation
   */
  private extractBackgroundDetails(background: string): string[] {
    // Simple extraction of key details from background
    const sentences = background.split(/[.!?]+/).filter(s => s.trim().length > 10);
    return sentences.map(s => s.trim()).slice(0, 3); // Take first 3 key details
  }

  /**
   * Extract scenario-specific information
   */
  private extractScenarioSpecificInfo(scenario: ScenarioData): string[] {
    // Extract key information from scenario that guest might reveal
    return [
      `Situation involves: ${scenario.title}`,
      'Specific details about the issue',
      'Timeline or urgency factors'
    ];
  }

  /**
   * Analyze what information has already been revealed
   */
  private analyzeRevealedInformation(
    conversationHistory: BaseMessage[],
    totalInformation: string[]
  ): string[] {
    const revealed: string[] = [];
    const conversationText = conversationHistory
      .map(msg => msg.content.toString().toLowerCase())
      .join(' ');

    totalInformation.forEach(info => {
      const keywords = info.toLowerCase().split(' ').filter(word => word.length > 3);
      const hasKeywords = keywords.some(keyword => conversationText.includes(keyword));
      if (hasKeywords) {
        revealed.push(info);
      }
    });

    return revealed;
  }

  /**
   * Select next information to reveal based on conversation state
   */
  private selectNextInformationToReveal(
    totalInformation: string[],
    revealedSoFar: string[],
    emotionalState: EmotionalState,
    currentTurn: number
  ): string[] {
    const unrevealed = totalInformation.filter(info => !revealedSoFar.includes(info));
    
    if (unrevealed.length === 0) {
      return [];
    }

    // Reveal more information as emotional intensity increases
    const maxToReveal = Math.floor(emotionalState.intensity * 2) + 1;
    
    // Prioritize information based on emotional state
    const prioritized = unrevealed.sort((a, b) => {
      // Prioritize emotional information when in emotional states
      const emotionalKeywords = ['upset', 'frustrated', 'worried', 'concerned', 'angry'];
      const aIsEmotional = emotionalKeywords.some(keyword => a.toLowerCase().includes(keyword));
      const bIsEmotional = emotionalKeywords.some(keyword => b.toLowerCase().includes(keyword));
      
      if (emotionalState.intensity > 0.6) {
        if (aIsEmotional && !bIsEmotional) return -1;
        if (!aIsEmotional && bIsEmotional) return 1;
      }
      
      return 0;
    });

    return prioritized.slice(0, maxToReveal);
  }

  /**
   * Calculate consistency score for the response
   */
  private calculateConsistencyScore(
    input: GuestSimulationInput,
    response: string,
    emotionalState: EmotionalState
  ): number {
    let score = 1.0;
    const { persona } = input;
    const responseLower = response.toLowerCase();

    // Check communication style consistency
    const styleKeywords = persona.communication_style.toLowerCase().split(' ');
    const directKeywords = ['direct', 'straightforward', 'blunt'];
    const politeKeywords = ['polite', 'courteous', 'respectful'];
    const casualKeywords = ['casual', 'informal', 'relaxed'];

    const isDirectStyle = styleKeywords.some(keyword => directKeywords.includes(keyword));
    const isPoliteStyle = styleKeywords.some(keyword => politeKeywords.includes(keyword));
    const isCasualStyle = styleKeywords.some(keyword => casualKeywords.includes(keyword));

    // Check for style consistency in response
    if (isDirectStyle && (responseLower.includes('maybe') || responseLower.includes('perhaps'))) {
      score -= 0.1;
    }
    if (isPoliteStyle && (responseLower.includes('whatever') || responseLower.includes('don\'t care'))) {
      score -= 0.2;
    }
    if (!isCasualStyle && (responseLower.includes('hey') || responseLower.includes('gonna'))) {
      score -= 0.1;
    }

    // Check emotional consistency
    const emotionalWords = {
      'frustrated': ['annoyed', 'irritated', 'upset', 'bothered'],
      'angry': ['mad', 'furious', 'livid', 'outraged'],
      'worried': ['concerned', 'anxious', 'nervous', 'troubled'],
      'happy': ['pleased', 'satisfied', 'glad', 'content'],
      'confused': ['unclear', 'don\'t understand', 'puzzled']
    };

    const expectedWords = emotionalWords[emotionalState.currentEmotion as keyof typeof emotionalWords] || [];
    const hasEmotionalConsistency = expectedWords.some(word => responseLower.includes(word)) ||
      responseLower.includes(emotionalState.currentEmotion);

    if (!hasEmotionalConsistency && emotionalState.intensity > 0.5) {
      score -= 0.15;
    }

    // Check personality trait consistency
    const traitKeywords = persona.personality_traits.flatMap(trait => trait.toLowerCase().split(' '));
    const hasTraitConsistency = traitKeywords.some(keyword => responseLower.includes(keyword));
    
    if (!hasTraitConsistency && input.currentTurn > 2) {
      score -= 0.1;
    }

    return Math.max(0, Math.round(score * 100) / 100);
  }

  /**
   * Determine if conversation should continue
   */
  private shouldContinueConversation(
    input: GuestSimulationInput,
    emotionalState: EmotionalState
  ): boolean {
    const { conversationHistory, scenario, persona } = input;
    
    // Continue if we haven't reached maximum turns
    if (conversationHistory.length >= 20) {
      return false;
    }

    // Continue if we're still in early emotional arc stages
    const arcPosition = persona.emotional_arc.indexOf(emotionalState.currentEmotion);
    if (arcPosition < persona.emotional_arc.length - 1) {
      return true;
    }

    // Continue if scenario objectives haven't been met
    // This would need integration with scoring agent to determine completion
    return true;
  }

  /**
   * Extract text content from LLM response
   */
  private extractTextFromResponse(response: AIMessage): string {
    if (typeof response.content === "string") {
      return response.content;
    }

    if (Array.isArray(response.content)) {
      return response.content
        .map((part: any) => (typeof part?.text === "string" ? part.text : ""))
        .join(" ")
        .trim();
    }

    return "";
  }

  /**
   * Clean up response to ensure natural conversation
   */
  private cleanupResponse(response: string): string {
    // Remove any system-like language or meta-commentary
    let cleaned = response
      .replace(/^(As [^,]+,?\s*)/i, '') // Remove "As [name]," prefixes
      .replace(/\*[^*]*\*/g, '') // Remove action descriptions in asterisks
      .replace(/\([^)]*\)/g, '') // Remove parenthetical notes
      .trim();

    // Ensure response doesn't break character
    const breakingPhrases = [
      'as an ai',
      'i am programmed',
      'this is a simulation',
      'training scenario',
      'i\'m designed to'
    ];

    breakingPhrases.forEach(phrase => {
      const regex = new RegExp(phrase, 'gi');
      cleaned = cleaned.replace(regex, '');
    });

    return cleaned.trim();
  }

  /**
   * Validate character consistency across multiple conversation turns
   */
  validateCharacterConsistency(
    persona: PersonaData,
    conversationHistory: string[],
    emotionalProgression: string[]
  ): { consistent: boolean; issues: string[]; score: number } {
    const issues: string[] = [];
    let consistencyPoints = 0;
    let totalChecks = 0;

    // Check communication style consistency
    totalChecks++;
    const styleWords = persona.communication_style.toLowerCase().split(' ');
    const directKeywords = ['direct', 'professional', 'straight', 'point'];
    const casualKeywords = ['hey', 'maybe', 'whenever', 'no rush', 'whatever', 'kinda', 'i guess'];
    
    const isDirectStyle = styleWords.some(word => directKeywords.includes(word));
    const hasCasualLanguage = conversationHistory.some(response =>
      casualKeywords.some(keyword => response.toLowerCase().includes(keyword))
    );
    
    if (isDirectStyle && hasCasualLanguage && conversationHistory.length > 2) {
      issues.push('Communication style not consistently maintained across turns');
    } else {
      consistencyPoints++;
    }

    // Check personality trait manifestation
    totalChecks++;
    const traitWords = persona.personality_traits.flatMap(trait => trait.toLowerCase().split(' '));
    const hasTraitConsistency = conversationHistory.some(response =>
      traitWords.some(word => response.toLowerCase().includes(word))
    );
    if (hasTraitConsistency) {
      consistencyPoints++;
    } else {
      issues.push('Personality traits not reflected in conversation');
    }

    // Check emotional arc progression
    totalChecks++;
    if (emotionalProgression.length >= 2) {
      const expectedArc = persona.emotional_arc;
      const progressionMatches = emotionalProgression.every((emotion, index) => {
        const expectedIndex = Math.floor((index / emotionalProgression.length) * expectedArc.length);
        return expectedIndex < expectedArc.length && 
               emotion.toLowerCase().includes(expectedArc[expectedIndex].toLowerCase());
      });
      
      if (progressionMatches) {
        consistencyPoints++;
      } else {
        issues.push('Emotional arc progression not following persona design');
      }
    }

    // Check for character breaking
    totalChecks++;
    const hasCharacterBreaking = conversationHistory.some(response => {
      const breakingPhrases = ['as an ai', 'i am programmed', 'this is a simulation'];
      return breakingPhrases.some(phrase => response.toLowerCase().includes(phrase));
    });
    if (!hasCharacterBreaking) {
      consistencyPoints++;
    } else {
      issues.push('Character breaking detected in responses');
    }

    const score = totalChecks > 0 ? consistencyPoints / totalChecks : 0;

    return {
      consistent: issues.length === 0,
      issues,
      score: Math.round(score * 100) / 100
    };
  }

  /**
   * Create fallback response when generation fails
   */
  createFallbackResponse(input: GuestSimulationInput): GuestSimulationOutput {
    const { persona } = input;
    
    const fallbackResponses = [
      "I'm not sure I understand. Could you help me with this?",
      "Can you clarify what you mean?",
      "I need some assistance with my situation.",
      "This is important to me. Can we figure this out?"
    ];

    const response = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    const currentEmotion = persona.emotional_arc[0] || 'neutral';

    return {
      response,
      currentEmotion,
      informationRevealed: [],
      consistencyScore: 0.5,
      shouldContinue: true
    };
  }
}

// Factory function for creating GuestSimulatorAgent instances
export const createGuestSimulatorAgent = (apiKey?: string) => {
  return new GuestSimulatorAgent(apiKey);
};