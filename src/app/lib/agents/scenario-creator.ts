// Scenario Creator Agent for AI Training Simulator
// Implements scenario creation with RAG integration for SOP grounding

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { PineconeService } from "../pinecone-service";
import { ScenarioData, RetrievalResult, MetadataFilter } from "../types";
import { validateScenarioData, validateScenarioAgainstSchema } from "../validation";
import { AGENT_CONFIGS } from "../service-interfaces";

export interface ScenarioCreationInput {
  trainingObjective: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category?: 'booking' | 'complaint' | 'overbooking' | 'general';
  specificSOPs?: string[];
}

export interface ScenarioCreationOutput {
  scenario: ScenarioData;
  sopReferences: RetrievalResult[];
  confidence: number;
}

export class ScenarioCreatorAgent {
  private llm: ChatGoogleGenerativeAI;
  private pineconeService: PineconeService;

  constructor(pineconeService: PineconeService, apiKey?: string) {
    const config = AGENT_CONFIGS.scenarioCreator;
    this.llm = new ChatGoogleGenerativeAI({
      model: config.model,
      apiKey: apiKey || process.env.GOOGLE_API_KEY!,
      temperature: config.temperature,
      maxOutputTokens: config.maxTokens,
    });
    this.pineconeService = pineconeService;
  }

  /**
   * Create a training scenario based on input parameters
   */
  async createScenario(input: ScenarioCreationInput): Promise<ScenarioCreationOutput> {
    try {
      // Step 1: Retrieve relevant SOPs from knowledge base
      const sopReferences = await this.retrieveRelevantSOPs(input);

      // Step 2: Generate scenario using RAG context
      const scenario = await this.generateScenarioWithRAG(input, sopReferences);

      // Step 3: Validate the generated scenario
      const schemaValidation = validateScenarioAgainstSchema(scenario);
      if (!schemaValidation.valid) {
        throw new Error(`Scenario schema validation failed: ${schemaValidation.errors.join(', ')}`);
      }

      if (!validateScenarioData(scenario)) {
        throw new Error('Generated scenario failed type validation');
      }

      // Step 4: Calculate confidence based on SOP coverage
      const confidence = this.calculateConfidence(sopReferences);

      return {
        scenario,
        sopReferences,
        confidence
      };
    } catch (error) {
      throw new Error(`Scenario creation failed: ${error}`);
    }
  }

  /**
   * Retrieve relevant SOPs based on training objective and category
   */
  private async retrieveRelevantSOPs(input: ScenarioCreationInput): Promise<RetrievalResult[]> {
    const filters: MetadataFilter = {
      type: 'sop',
      difficulty: input.difficulty
    };

    if (input.category) {
      filters.category = input.category;
    }

    // Create search query combining objective and specific SOPs
    let searchQuery = input.trainingObjective;
    if (input.specificSOPs && input.specificSOPs.length > 0) {
      searchQuery += ` ${input.specificSOPs.join(' ')}`;
    }

    return await this.pineconeService.retrieveRelevantSOPs(searchQuery, filters);
  }

  /**
   * Generate scenario using retrieved SOP context
   */
  private async generateScenarioWithRAG(
    input: ScenarioCreationInput,
    sopReferences: RetrievalResult[]
  ): Promise<ScenarioData> {
    // Build context from retrieved SOPs
    const sopContext = sopReferences
      .map((ref, index) => `SOP ${index + 1}: ${ref.content}`)
      .join('\n\n');

    const prompt = this.buildScenarioPrompt(input, sopContext);

    const response = await this.llm.invoke([new HumanMessage(prompt)]);
    const responseText = this.extractTextFromResponse(response);

    // Parse JSON response
    try {
      const scenarioJson = this.extractJsonFromResponse(responseText);
      return this.parseScenarioFromJson(scenarioJson);
    } catch (error) {
      throw new Error(`Failed to parse scenario JSON: ${error}`);
    }
  }

  /**
   * Build the prompt for scenario generation
   */
  private buildScenarioPrompt(input: ScenarioCreationInput, sopContext: string): string {
    return `You are a training scenario creator for STR (Short-Term Rental) virtual assistants. 
Create a realistic training scenario based on the following requirements:

TRAINING OBJECTIVE: ${input.trainingObjective}
DIFFICULTY LEVEL: ${input.difficulty}
CATEGORY: ${input.category || 'general'}

RELEVANT COMPANY SOPs:
${sopContext}

REQUIREMENTS:
1. Create scenarios with clear objectives and natural conclusion conditions
2. Ground the scenario in the provided SOP content
3. Include hidden test points that evaluate specific competencies
4. Ensure scenarios are realistic but challenging for the difficulty level
5. DO NOT mention this is a training exercise in the scenario description

OUTPUT FORMAT:
Respond with ONLY a valid JSON object in this exact format:
{
  "title": "Brief scenario title",
  "description": "Detailed scenario description that sets up the situation naturally",
  "required_steps": ["Step 1 the trainee should complete", "Step 2 they should complete", "etc"],
  "critical_errors": ["Error 1 that would fail the scenario", "Error 2 that would fail", "etc"],
  "time_pressure": 1-10 (1=low pressure, 10=high pressure)
}

The scenario should test the trainee's ability to follow the SOPs provided above. Make it feel like a real guest interaction.`;
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
    // Look for JSON object in the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON object found in response');
    }
    return jsonMatch[0];
  }

  /**
   * Parse and validate scenario from JSON string
   */
  private parseScenarioFromJson(jsonString: string): ScenarioData {
    try {
      const parsed = JSON.parse(jsonString);

      // Ensure all required fields are present with defaults
      const scenario: ScenarioData = {
        title: parsed.title || 'Untitled Scenario',
        description: parsed.description || 'No description provided',
        required_steps: Array.isArray(parsed.required_steps) ? parsed.required_steps : [],
        critical_errors: Array.isArray(parsed.critical_errors) ? parsed.critical_errors : [],
        time_pressure: typeof parsed.time_pressure === 'number' ?
          Math.max(1, Math.min(10, parsed.time_pressure)) : 5
      };

      return scenario;
    } catch (error) {
      throw new Error(`JSON parsing failed: ${error}`);
    }
  }

  /**
   * Calculate confidence score based on SOP retrieval quality
   */
  private calculateConfidence(sopReferences: RetrievalResult[]): number {
    if (sopReferences.length === 0) {
      return 0.3; // Low confidence without SOP grounding
    }

    // Calculate average relevance score
    const avgScore = sopReferences.reduce((sum, ref) => sum + ref.score, 0) / sopReferences.length;

    // Normalize to 0-1 range and apply minimum threshold
    const normalizedScore = Math.max(0.4, Math.min(1.0, avgScore));

    return Math.round(normalizedScore * 100) / 100;
  }

  /**
   * Create a fallback scenario when SOP retrieval fails
   */
  async createFallbackScenario(input: ScenarioCreationInput): Promise<ScenarioCreationOutput> {
    const fallbackScenario: ScenarioData = {
      title: `${input.difficulty} ${input.category || 'General'} Training Scenario`,
      description: `A ${input.difficulty} level training scenario for ${input.trainingObjective}. ` +
        'Please handle this guest inquiry professionally and according to company policies.',
      required_steps: [
        'Acknowledge the guest inquiry promptly',
        'Gather necessary information',
        'Provide appropriate solution or escalate if needed',
        'Confirm guest satisfaction'
      ],
      critical_errors: [
        'Failing to acknowledge the guest within reasonable time',
        'Providing incorrect information',
        'Being unprofessional or rude',
        'Not following up appropriately'
      ],
      time_pressure: input.difficulty === 'beginner' ? 3 :
        input.difficulty === 'intermediate' ? 6 : 8
    };

    return {
      scenario: fallbackScenario,
      sopReferences: [],
      confidence: 0.3
    };
  }
}

// Factory function for creating ScenarioCreatorAgent instances
export const createScenarioCreatorAgent = (pineconeService: PineconeService, apiKey?: string) => {
  return new ScenarioCreatorAgent(pineconeService, apiKey);
};