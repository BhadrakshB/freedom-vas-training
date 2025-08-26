// Persona Generator Agent for AI Training Simulator
// Implements persona generation with psychological depth modeling

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { PersonaData, ScenarioData } from "../types";
import { validatePersonaData, validatePersonaAgainstSchema } from "../validation";
import { AGENT_CONFIGS } from "../service-interfaces";

export interface PersonaGenerationInput {
  scenario: ScenarioData;
  trainingLevel: 'beginner' | 'intermediate' | 'advanced';
  personalityType?: 'cooperative' | 'difficult' | 'neutral' | 'emotional';
  specificChallenges?: string[];
}

export interface PersonaGenerationOutput {
  persona: PersonaData;
  consistency: number;
  psychologicalProfile: PsychologicalProfile;
}

export interface PsychologicalProfile {
  primaryMotivation: string;
  stressResponse: string;
  communicationPattern: string;
  emotionalTriggers: string[];
  resolutionStyle: string;
}

export class PersonaGeneratorAgent {
  private llm: ChatGoogleGenerativeAI;

  constructor(apiKey?: string) {
    const config = AGENT_CONFIGS.personaGenerator;
    this.llm = new ChatGoogleGenerativeAI({
      model: config.model,
      apiKey: apiKey || process.env.GOOGLE_API_KEY!,
      temperature: config.temperature,
      maxOutputTokens: config.maxTokens,
    });
  }

  /**
   * Generate a persona based on scenario and training requirements
   */
  async generatePersona(input: PersonaGenerationInput): Promise<PersonaGenerationOutput> {
    try {
      // Step 1: Generate psychological profile
      const psychologicalProfile = await this.generatePsychologicalProfile(input);

      // Step 2: Generate persona with psychological depth
      const persona = await this.generatePersonaWithDepth(input, psychologicalProfile);

      // Step 3: Validate the generated persona
      const schemaValidation = validatePersonaAgainstSchema(persona);
      if (!schemaValidation.valid) {
        throw new Error(`Persona schema validation failed: ${schemaValidation.errors.join(', ')}`);
      }

      if (!validatePersonaData(persona)) {
        throw new Error('Generated persona failed type validation');
      }

      // Step 4: Calculate consistency score
      const consistency = this.calculateConsistencyScore(persona, psychologicalProfile);

      return {
        persona,
        consistency,
        psychologicalProfile
      };
    } catch (error) {
      throw new Error(`Persona generation failed: ${error}`);
    }
  }

  /**
   * Generate psychological profile for the persona
   */
  private async generatePsychologicalProfile(input: PersonaGenerationInput): Promise<PsychologicalProfile> {
    const prompt = this.buildPsychologicalProfilePrompt(input);

    const response = await this.llm.invoke([new HumanMessage(prompt)]);
    const responseText = this.extractTextFromResponse(response);

    try {
      const profileJson = this.extractJsonFromResponse(responseText);
      return this.parsePsychologicalProfile(profileJson);
    } catch (error) {
      throw new Error(`Failed to parse psychological profile: ${error}`);
    }
  }

  /**
   * Generate persona with psychological depth
   */
  private async generatePersonaWithDepth(
    input: PersonaGenerationInput,
    profile: PsychologicalProfile
  ): Promise<PersonaData> {
    const prompt = this.buildPersonaPrompt(input, profile);

    const response = await this.llm.invoke([new HumanMessage(prompt)]);
    const responseText = this.extractTextFromResponse(response);

    try {
      const personaJson = this.extractJsonFromResponse(responseText);
      return this.parsePersonaFromJson(personaJson);
    } catch (error) {
      throw new Error(`Failed to parse persona JSON: ${error}`);
    }
  }

  /**
   * Build prompt for psychological profile generation
   */
  private buildPsychologicalProfilePrompt(input: PersonaGenerationInput): string {
    const challengeText = input.specificChallenges?.length
      ? `\nSPECIFIC CHALLENGES TO INCORPORATE: ${input.specificChallenges.join(', ')}`
      : '';

    return `You are a psychological profiler creating realistic guest personas for STR training scenarios.

SCENARIO CONTEXT:
Title: ${input.scenario.title}
Description: ${input.scenario.description}
Training Level: ${input.trainingLevel}
Personality Type: ${input.personalityType || 'neutral'}${challengeText}

Create a psychological profile that will drive authentic behavior patterns. Consider:
- What motivates this person in this specific situation?
- How do they respond to stress or frustration?
- What are their communication preferences?
- What emotional triggers might surface during the interaction?
- How do they typically seek resolution?

OUTPUT FORMAT:
Respond with ONLY a valid JSON object:
{
  "primaryMotivation": "What drives this person's behavior in this scenario",
  "stressResponse": "How they react when things don't go as expected",
  "communicationPattern": "Their preferred way of expressing themselves",
  "emotionalTriggers": ["Trigger 1", "Trigger 2", "etc"],
  "resolutionStyle": "How they prefer problems to be solved"
}`;
  }

  /**
   * Build prompt for persona generation with psychological depth
   */
  private buildPersonaPrompt(input: PersonaGenerationInput, profile: PsychologicalProfile): string {
    return `You are creating a realistic guest persona for STR virtual assistant training.

SCENARIO CONTEXT:
${input.scenario.description}

PSYCHOLOGICAL PROFILE:
- Primary Motivation: ${profile.primaryMotivation}
- Stress Response: ${profile.stressResponse}
- Communication Pattern: ${profile.communicationPattern}
- Emotional Triggers: ${profile.emotionalTriggers.join(', ')}
- Resolution Style: ${profile.resolutionStyle}

REQUIREMENTS:
1. Create psychological depth with realistic background and motivations
2. Define communication patterns that match the psychological profile
3. Ensure appropriate challenge level for ${input.trainingLevel} training
4. Design emotional progression that creates learning opportunities
5. Make the persona feel like a real person, not a caricature

The persona should challenge the trainee's skills while remaining believable and consistent.

OUTPUT FORMAT:
Respond with ONLY a valid JSON object:
{
  "name": "Realistic first name",
  "background": "Detailed background explaining their situation and context",
  "personality_traits": ["Trait 1", "Trait 2", "Trait 3", "etc"],
  "hidden_motivations": ["Hidden motivation 1", "Hidden motivation 2", "etc"],
  "communication_style": "Detailed description of how they communicate",
  "emotional_arc": ["Initial emotion", "Mid-conversation emotion", "Final emotion", "etc"]
}`;
  }

  /**
   * Parse psychological profile from JSON
   */
  private parsePsychologicalProfile(jsonString: string): PsychologicalProfile {
    try {
      const parsed = JSON.parse(jsonString);

      return {
        primaryMotivation: parsed.primaryMotivation || 'Seeking resolution',
        stressResponse: parsed.stressResponse || 'Becomes more direct',
        communicationPattern: parsed.communicationPattern || 'Clear and direct',
        emotionalTriggers: Array.isArray(parsed.emotionalTriggers) ? parsed.emotionalTriggers : [],
        resolutionStyle: parsed.resolutionStyle || 'Wants quick solutions'
      };
    } catch (error) {
      throw new Error(`Psychological profile JSON parsing failed: ${error}`);
    }
  }

  /**
   * Parse persona from JSON string with validation
   */
  private parsePersonaFromJson(jsonString: string): PersonaData {
    try {
      const parsed = JSON.parse(jsonString);

      const persona: PersonaData = {
        name: parsed.name || 'Guest',
        background: parsed.background || 'No background provided',
        personality_traits: Array.isArray(parsed.personality_traits) ? parsed.personality_traits : [],
        hidden_motivations: Array.isArray(parsed.hidden_motivations) ? parsed.hidden_motivations : [],
        communication_style: parsed.communication_style || 'Direct communication',
        emotional_arc: Array.isArray(parsed.emotional_arc) ? parsed.emotional_arc : ['neutral']
      };

      return persona;
    } catch (error) {
      throw new Error(`Persona JSON parsing failed: ${error}`);
    }
  }

  /**
   * Calculate consistency score between persona and psychological profile
   */
  private calculateConsistencyScore(persona: PersonaData, profile: PsychologicalProfile): number {
    let consistencyPoints = 0;
    let totalChecks = 0;

    // Check if communication style aligns with psychological pattern
    totalChecks++;
    if (persona.communication_style.toLowerCase().includes(profile.communicationPattern.toLowerCase().split(' ')[0])) {
      consistencyPoints++;
    }

    // Check if personality traits align with motivations
    totalChecks++;
    const motivationKeywords = profile.primaryMotivation.toLowerCase().split(' ');
    const hasAlignedTraits = persona.personality_traits.some(trait =>
      motivationKeywords.some(keyword => trait.toLowerCase().includes(keyword))
    );
    if (hasAlignedTraits) {
      consistencyPoints++;
    }

    // Check if emotional arc makes psychological sense
    totalChecks++;
    if (persona.emotional_arc.length >= 2) {
      consistencyPoints++;
    }

    // Check if hidden motivations align with background
    totalChecks++;
    if (persona.hidden_motivations.length > 0 && persona.background.length > 50) {
      consistencyPoints++;
    }

    const score = totalChecks > 0 ? (consistencyPoints / totalChecks) : 0;
    return Math.round(score * 100) / 100;
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
   * Extract JSON from response text
   */
  private extractJsonFromResponse(responseText: string): string {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON object found in response');
    }
    return jsonMatch[0];
  }

  /**
   * Validate persona consistency across multiple interactions
   */
  validatePersonaConsistency(
    persona: PersonaData,
    conversationHistory: string[]
  ): { consistent: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check if responses align with communication style
    const styleKeywords = persona.communication_style.toLowerCase().split(' ');
    const directKeywords = ['direct', 'professional', 'straight', 'point'];
    const casualKeywords = ['hey', 'maybe', 'whenever', 'no rush'];

    const isDirectPersona = styleKeywords.some(keyword => directKeywords.includes(keyword));
    const hasCasualLanguage = conversationHistory.some(message =>
      casualKeywords.some(keyword => message.toLowerCase().includes(keyword))
    );

    if (isDirectPersona && hasCasualLanguage && conversationHistory.length > 3) {
      issues.push('Communication style not consistently maintained');
    }

    // Check emotional arc progression
    if (persona.emotional_arc.length > 1 && conversationHistory.length >= persona.emotional_arc.length) {
      // This would require more sophisticated analysis in a real implementation
      // For now, we assume consistency if no obvious contradictions
    }

    // Check for personality trait consistency
    const traitKeywords = persona.personality_traits.flatMap(trait => trait.toLowerCase().split(' '));
    const hasTraitConsistency = conversationHistory.some(message =>
      traitKeywords.some(keyword => message.toLowerCase().includes(keyword))
    );

    if (!hasTraitConsistency && conversationHistory.length > 3) {
      issues.push('Personality traits not reflected in conversation');
    }

    return {
      consistent: issues.length === 0,
      issues
    };
  }

  /**
   * Create a fallback persona when generation fails
   */
  createFallbackPersona(input: PersonaGenerationInput): PersonaGenerationOutput {
    const fallbackPersona: PersonaData = {
      name: 'Alex',
      background: `A guest with a ${input.trainingLevel} level inquiry related to ${input.scenario.title}. ` +
        'They are seeking assistance and expect professional service.',
      personality_traits: [
        'Direct communicator',
        'Expects timely responses',
        'Values clear information'
      ],
      hidden_motivations: [
        'Wants to resolve the issue quickly',
        'Concerned about service quality'
      ],
      communication_style: 'Clear and straightforward, becomes more direct if not getting answers',
      emotional_arc: ['curious', 'concerned', 'satisfied']
    };

    const fallbackProfile: PsychologicalProfile = {
      primaryMotivation: 'Seeking quick resolution',
      stressResponse: 'Becomes more direct and specific',
      communicationPattern: 'Clear and factual',
      emotionalTriggers: ['Delays', 'Unclear answers'],
      resolutionStyle: 'Prefers step-by-step solutions'
    };

    return {
      persona: fallbackPersona,
      consistency: 0.7,
      psychologicalProfile: fallbackProfile
    };
  }
}

// Factory function for creating PersonaGeneratorAgent instances
export const createPersonaGeneratorAgent = (apiKey?: string) => {
  return new PersonaGeneratorAgent(apiKey);
};