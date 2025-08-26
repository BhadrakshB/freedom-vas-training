// Training Simulator LangGraph Orchestration Workflow
// Implements the complete training session workflow with all five agent nodes

import { HumanMessage, AIMessage, BaseMessage } from "@langchain/core/messages";
import { StateGraph, START, END } from "@langchain/langgraph";
import { TrainingSimulatorState, TrainingSimulatorStateType } from "./training-state";
import { PineconeService } from "./pinecone-service";

// Import all agent classes
import { ScenarioCreatorAgent, ScenarioCreationInput } from "./agents/scenario-creator";
import { PersonaGeneratorAgent, PersonaGenerationInput } from "./agents/persona-generator";
import { GuestSimulatorAgent, GuestSimulationInput } from "./agents/guest-simulator";
import { SilentScoringAgent, ScoringInput } from "./agents/silent-scoring";
import { FeedbackGeneratorAgent, FeedbackInput } from "./agents/feedback-generator";

/** Training Simulator Graph Configuration */
export interface TrainingSimulatorConfig {
  pineconeService: PineconeService;
  apiKey?: string;
}

/** Session Initialization Input */
export interface SessionInitInput {
  trainingObjective: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category?: 'booking' | 'complaint' | 'overbooking' | 'general';
  userId?: string;
}

/** Training Simulator Graph Class */
export class TrainingSimulatorGraph {
  private scenarioCreator: ScenarioCreatorAgent;
  private personaGenerator: PersonaGeneratorAgent;
  private guestSimulator: GuestSimulatorAgent;
  private silentScoring: SilentScoringAgent;
  private feedbackGenerator: FeedbackGeneratorAgent;
  private graph: any;

  constructor(config: TrainingSimulatorConfig) {
    // Initialize all agents
    this.scenarioCreator = new ScenarioCreatorAgent(config.pineconeService, config.apiKey);
    this.personaGenerator = new PersonaGeneratorAgent(config.apiKey);
    this.guestSimulator = new GuestSimulatorAgent(config.apiKey);
    this.silentScoring = new SilentScoringAgent(config.apiKey);
    this.feedbackGenerator = new FeedbackGeneratorAgent(config.apiKey, config.pineconeService);

    // Build the graph
    this.graph = this.buildGraph();
  }

  /**
   * Build the LangGraph workflow
   */
  private buildGraph() {
    const builder = new StateGraph(TrainingSimulatorState)
      .addNode("scenario_creation", this.scenarioCreationNode.bind(this))
      .addNode("persona_generation", this.personaGenerationNode.bind(this))
      .addNode("session_ready", this.sessionReadyNode.bind(this))
      .addNode("guest_simulation", this.guestSimulationNode.bind(this))
      .addNode("silent_scoring", this.silentScoringNode.bind(this))
      .addNode("feedback_generation", this.feedbackGenerationNode.bind(this))
      
      // Define the workflow edges for initial session creation
      .addEdge(START, "scenario_creation")
      .addEdge("scenario_creation", "persona_generation")
      .addEdge("persona_generation", "session_ready")
      
      // Conditional routing for active sessions
      .addConditionalEdges(
        "session_ready",
        this.routeFromSessionReady.bind(this),
        {
          ready: END,
          continue: "guest_simulation"
        }
      )
      
      .addEdge("guest_simulation", "silent_scoring")
      
      // Conditional routing after scoring
      .addConditionalEdges(
        "silent_scoring",
        this.routeAfterScoring.bind(this),
        {
          continue: "guest_simulation",
          complete: "feedback_generation"
        }
      )
      
      .addEdge("feedback_generation", END);

    return builder.compile();
  }

  /**
   * Scenario Creation Node
   */
  private async scenarioCreationNode(state: TrainingSimulatorStateType) {
    try {
      // Extract initialization parameters from the first message
      const initMessage = state.messages[0];
      const initInput = this.parseInitializationInput(initMessage);

      const scenarioInput: ScenarioCreationInput = {
        trainingObjective: initInput.trainingObjective,
        difficulty: initInput.difficulty,
        category: initInput.category
      };

      const result = await this.scenarioCreator.createScenario(scenarioInput);

      return {
        scenario: result.scenario,
        requiredSteps: result.scenario.required_steps,
        sessionStatus: 'creating' as const,
        retrievedContext: result.sopReferences.map(ref => ref.content),
        messages: [new AIMessage(`Scenario created: ${result.scenario.title}`)]
      };
    } catch (error) {
      console.error('Scenario creation failed:', error);
      // Use fallback scenario
      const fallbackInput: ScenarioCreationInput = {
        trainingObjective: 'General customer service training',
        difficulty: 'beginner'
      };
      
      try {
        const fallbackResult = await this.scenarioCreator.createFallbackScenario(fallbackInput);
        
        return {
          scenario: fallbackResult.scenario,
          requiredSteps: fallbackResult.scenario.required_steps,
          sessionStatus: 'creating' as const,
          retrievedContext: [],
          messages: [new AIMessage(`Fallback scenario created: ${fallbackResult.scenario.title}`)]
        };
      } catch (fallbackError) {
        // Ultimate fallback - create a basic scenario
        const basicScenario = {
          title: 'Basic Customer Service Training',
          description: 'Handle a general customer inquiry professionally',
          required_steps: ['Greet the customer', 'Listen to their concern', 'Provide assistance'],
          critical_errors: ['Being rude', 'Ignoring the customer'],
          time_pressure: 3
        };
        
        return {
          scenario: basicScenario,
          requiredSteps: basicScenario.required_steps,
          sessionStatus: 'creating' as const,
          retrievedContext: [],
          messages: [new AIMessage(`Basic scenario created: ${basicScenario.title}`)]
        };
      }
    }
  }

  /**
   * Persona Generation Node
   */
  private async personaGenerationNode(state: TrainingSimulatorStateType) {
    try {
      if (!state.scenario) {
        throw new Error('No scenario available for persona generation');
      }

      const personaInput: PersonaGenerationInput = {
        scenario: state.scenario,
        trainingLevel: this.extractDifficultyFromScenario(state.scenario),
        personalityType: 'neutral'
      };

      const result = await this.personaGenerator.generatePersona(personaInput);

      return {
        persona: result.persona,
        currentEmotion: result.persona.emotional_arc[0] || 'neutral',
        messages: [new AIMessage(`Persona created: ${result.persona.name}`)]
      };
    } catch (error) {
      console.error('Persona generation failed:', error);
      // Use fallback persona
      const fallbackInput: PersonaGenerationInput = {
        scenario: state.scenario!,
        trainingLevel: 'beginner'
      };
      
      try {
        const fallbackResult = this.personaGenerator.createFallbackPersona(fallbackInput);
        
        return {
          persona: fallbackResult.persona,
          currentEmotion: fallbackResult.persona.emotional_arc[0] || 'neutral',
          messages: [new AIMessage(`Fallback persona created: ${fallbackResult.persona.name}`)]
        };
      } catch (fallbackError) {
        // Ultimate fallback - create a basic persona
        const basicPersona = {
          name: 'Guest',
          background: 'A customer seeking assistance',
          personality_traits: ['polite', 'direct'],
          hidden_motivations: ['wants quick resolution'],
          communication_style: 'straightforward',
          emotional_arc: ['neutral', 'satisfied']
        };
        
        return {
          persona: basicPersona,
          currentEmotion: 'neutral',
          messages: [new AIMessage(`Basic persona created: ${basicPersona.name}`)]
        };
      }
    }
  }

  /**
   * Guest Simulation Node
   */
  private async guestSimulationNode(state: TrainingSimulatorStateType) {
    try {
      if (!state.persona || !state.scenario) {
        throw new Error('Missing persona or scenario for guest simulation');
      }

      // Get the latest user response (if any)
      const userResponse = this.extractLatestUserResponse(state.messages);

      const simulationInput: GuestSimulationInput = {
        persona: state.persona,
        scenario: state.scenario,
        conversationHistory: state.messages,
        currentTurn: state.turnCount,
        userResponse
      };

      const result = await this.guestSimulator.simulateGuestResponse(simulationInput);

      return {
        currentEmotion: result.currentEmotion,
        turnCount: 1, // Increment turn count
        sessionStatus: 'active' as const,
        messages: [new AIMessage(result.response)]
      };
    } catch (error) {
      console.error('Guest simulation failed:', error);
      // Use fallback response
      const fallbackResult = this.guestSimulator.createFallbackResponse({
        persona: state.persona!,
        scenario: state.scenario!,
        conversationHistory: state.messages,
        currentTurn: state.turnCount
      });
      
      return {
        currentEmotion: fallbackResult.currentEmotion,
        turnCount: 1,
        sessionStatus: 'active' as const,
        messages: [new AIMessage(fallbackResult.response)]
      };
    }
  }

  /**
   * Silent Scoring Node
   */
  private async silentScoringNode(state: TrainingSimulatorStateType) {
    try {
      if (!state.persona || !state.scenario) {
        throw new Error('Missing persona or scenario for scoring');
      }

      // Get the latest user response for scoring
      const userResponse = this.extractLatestUserResponse(state.messages);
      if (!userResponse) {
        // No user response to score yet, continue
        return {
          sessionStatus: 'active' as const
        };
      }

      const scoringInput: ScoringInput = {
        userResponse,
        conversationHistory: state.messages,
        scenario: state.scenario,
        persona: state.persona,
        requiredSteps: state.requiredSteps,
        completedSteps: state.completedSteps,
        turnCount: state.turnCount,
        retrievedContext: state.retrievedContext
      };

      const result = await this.silentScoring.scoreUserResponse(scoringInput);

      return {
        scores: result.scores,
        criticalErrors: result.criticalErrors,
        completedSteps: result.completedSteps,
        sessionStatus: result.sessionComplete ? 'complete' as const : 'active' as const
      };
    } catch (error) {
      console.error('Silent scoring failed:', error);
      // Use fallback scoring
      const fallbackResult = this.silentScoring.createFallbackScoring({
        userResponse: this.extractLatestUserResponse(state.messages) || '',
        conversationHistory: state.messages,
        scenario: state.scenario!,
        persona: state.persona!,
        requiredSteps: state.requiredSteps,
        completedSteps: state.completedSteps,
        turnCount: state.turnCount,
        retrievedContext: state.retrievedContext
      });
      
      return {
        scores: fallbackResult.scores,
        criticalErrors: fallbackResult.criticalErrors,
        completedSteps: fallbackResult.completedSteps,
        sessionStatus: fallbackResult.sessionComplete ? 'complete' as const : 'active' as const
      };
    }
  }

  /**
   * Feedback Generation Node
   */
  private async feedbackGenerationNode(state: TrainingSimulatorStateType) {
    try {
      if (!state.persona || !state.scenario) {
        // Provide basic completion message if missing data
        return {
          sessionStatus: 'complete' as const,
          messages: [new AIMessage('Training session completed. Thank you for participating!')]
        };
      }

      // Calculate session duration (mock for now)
      const sessionDuration = state.turnCount * 60000; // Approximate 1 minute per turn

      // Collect all scores and evidence (for now using single score)
      const allScores = state.scores ? [state.scores] : [{
        policy_adherence: 50,
        empathy_index: 50,
        completeness: 50,
        escalation_judgment: 50,
        time_efficiency: 50
      }];
      const allEvidence = []; // Would need to collect from scoring history

      const feedbackInput: FeedbackInput = {
        sessionId: state.sessionId,
        scenario: state.scenario,
        persona: state.persona,
        conversationHistory: state.messages,
        allScores,
        allEvidence: allEvidence as any[], // Type assertion for now
        criticalErrors: state.criticalErrors,
        completedSteps: state.completedSteps,
        requiredSteps: state.requiredSteps,
        overallScore: this.calculateOverallScore(allScores),
        sessionDuration
      };

      const result = await this.feedbackGenerator.generateFeedback(feedbackInput);

      // Format feedback as a comprehensive message
      const feedbackMessage = this.formatFeedbackMessage(result);

      return {
        sessionStatus: 'complete' as const,
        messages: [new AIMessage(feedbackMessage)]
      };
    } catch (error) {
      console.error('Feedback generation failed:', error);
      return {
        sessionStatus: 'complete' as const,
        messages: [new AIMessage('Training session completed. Feedback generation encountered an error, but your performance has been recorded.')]
      };
    }
  }

  /**
   * Session Ready Node - marks session as ready for interaction
   */
  private async sessionReadyNode(state: TrainingSimulatorStateType) {
    return {
      sessionStatus: 'active' as const,
      messages: [new AIMessage(`Training session ready. Scenario: ${state.scenario?.title}, Persona: ${state.persona?.name}`)]
    };
  }

  /**
   * Route from session ready state
   */
  private routeFromSessionReady(state: TrainingSimulatorStateType): string {
    // If this is initial session creation, mark as ready and end
    const hasUserInput = this.extractLatestUserResponse(state.messages);
    if (!hasUserInput || state.turnCount === 0) {
      return 'ready';
    }
    
    // If we have user input, continue with simulation
    return 'continue';
  }

  /**
   * Route after scoring to determine next step
   */
  private routeAfterScoring(state: TrainingSimulatorStateType): string {
    // Check for critical errors that should end the session
    if (state.criticalErrors && state.criticalErrors.length >= 3) {
      return 'complete';
    }

    // Check if session is marked as complete
    if (state.sessionStatus === 'complete') {
      return 'complete';
    }

    // Check if maximum turns reached
    if (state.turnCount >= 20) {
      return 'complete';
    }

    // Check if all required steps are completed
    if (state.completedSteps && state.requiredSteps && 
        state.completedSteps.length >= state.requiredSteps.length && 
        state.requiredSteps.length > 0) {
      return 'complete';
    }

    // For initial session creation, don't continue the loop
    if (state.sessionStatus === 'creating') {
      return 'complete';
    }

    // Continue the conversation only if we have a user response to process
    const hasUserResponse = this.extractLatestUserResponse(state.messages);
    if (!hasUserResponse) {
      return 'complete';
    }

    return 'continue';
  }

  /**
   * Parse initialization input from the first message
   */
  private parseInitializationInput(message: BaseMessage): SessionInitInput {
    const content = typeof message.content === 'string' ? message.content : String(message.content);
    
    // Try to parse JSON input
    try {
      const parsed = JSON.parse(content);
      return {
        trainingObjective: parsed.trainingObjective || 'General customer service training',
        difficulty: parsed.difficulty || 'beginner',
        category: parsed.category,
        userId: parsed.userId
      };
    } catch {
      // Fallback to text parsing
      return {
        trainingObjective: content || 'General customer service training',
        difficulty: 'beginner',
        category: 'general'
      };
    }
  }

  /**
   * Extract difficulty level from scenario
   */
  private extractDifficultyFromScenario(scenario: any): 'beginner' | 'intermediate' | 'advanced' {
    const pressure = scenario.time_pressure || 5;
    if (pressure <= 3) return 'beginner';
    if (pressure <= 7) return 'intermediate';
    return 'advanced';
  }

  /**
   * Extract the latest user response from messages
   */
  private extractLatestUserResponse(messages: BaseMessage[]): string | undefined {
    // Find the last human message
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg._getType() === 'human') {
        return typeof msg.content === 'string' ? msg.content : String(msg.content);
      }
    }
    return undefined;
  }

  /**
   * Calculate overall score from all scores
   */
  private calculateOverallScore(allScores: any[]): number {
    if (allScores.length === 0) return 0;
    
    const weights = {
      policy_adherence: 0.25,
      empathy_index: 0.20,
      completeness: 0.25,
      escalation_judgment: 0.15,
      time_efficiency: 0.15
    };

    const totalWeightedScore = allScores.reduce((total, score) => {
      return total + (
        score.policy_adherence * weights.policy_adherence +
        score.empathy_index * weights.empathy_index +
        score.completeness * weights.completeness +
        score.escalation_judgment * weights.escalation_judgment +
        score.time_efficiency * weights.time_efficiency
      );
    }, 0);

    return Math.round(totalWeightedScore / allScores.length);
  }

  /**
   * Format feedback result into a readable message
   */
  private formatFeedbackMessage(feedback: any): string {
    const { overallPerformance, actionableRecommendations } = feedback;
    
    let message = `## Training Session Complete\n\n`;
    message += `**Overall Score:** ${overallPerformance.score}/100 (Grade: ${overallPerformance.grade})\n\n`;
    message += `**Summary:** ${overallPerformance.summary}\n\n`;
    
    if (overallPerformance.keyStrengths.length > 0) {
      message += `**Key Strengths:**\n`;
      overallPerformance.keyStrengths.forEach((strength: string) => {
        message += `- ${strength}\n`;
      });
      message += `\n`;
    }
    
    if (overallPerformance.primaryAreasForImprovement.length > 0) {
      message += `**Areas for Improvement:**\n`;
      overallPerformance.primaryAreasForImprovement.forEach((area: string) => {
        message += `- ${area}\n`;
      });
      message += `\n`;
    }
    
    if (actionableRecommendations.length > 0) {
      message += `**Recommendations:**\n`;
      actionableRecommendations.slice(0, 3).forEach((rec: any) => {
        message += `- ${rec.recommendation}\n`;
      });
    }
    
    return message;
  }

  /**
   * Start a new training session
   */
  async startSession(input: SessionInitInput): Promise<any> {
    const sessionId = this.generateSessionId();
    
    const initialState = {
      sessionId,
      sessionStatus: 'creating' as const,
      requiredSteps: [],
      completedSteps: [],
      criticalErrors: [],
      retrievedContext: [],
      turnCount: 0,
      messages: [new HumanMessage(JSON.stringify(input))]
    };

    const result = await this.graph.invoke(initialState);
    
    // Return the final state after session creation
    return result;
  }

  /**
   * Continue an existing session with user input
   */
  async continueSession(sessionState: any, userInput: string): Promise<any> {
    // Create a new state for continuing the session
    const continuationState = {
      ...sessionState,
      sessionStatus: 'active' as const,
      messages: [...sessionState.messages, new HumanMessage(userInput)]
    };

    // Use a different graph path for continuing sessions
    return await this.continueSessionGraph(continuationState);
  }

  /**
   * Continue session graph - handles ongoing conversation
   */
  private async continueSessionGraph(state: any): Promise<any> {
    // Manually execute the conversation flow
    try {
      // Step 1: Guest simulation
      const guestState = await this.guestSimulationNode(state);
      const afterGuest = { ...state, ...guestState };

      // Step 2: Silent scoring
      const scoringState = await this.silentScoringNode(afterGuest);
      const afterScoring = { ...afterGuest, ...scoringState };

      // Step 3: Check if session should complete
      const shouldComplete = this.routeAfterScoring(afterScoring);
      
      if (shouldComplete === 'complete') {
        // Generate feedback
        const feedbackState = await this.feedbackGenerationNode(afterScoring);
        return { ...afterScoring, ...feedbackState };
      }

      return afterScoring;
    } catch (error) {
      console.error('Continue session failed:', error);
      return {
        ...state,
        sessionStatus: 'complete' as const,
        messages: [...state.messages, new AIMessage('Session encountered an error and has been completed.')]
      };
    }
  }

  /**
   * Get the compiled graph for direct use
   */
  getGraph() {
    return this.graph;
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Factory function to create a training simulator graph
 */
export function createTrainingSimulatorGraph(config: TrainingSimulatorConfig): TrainingSimulatorGraph {
  return new TrainingSimulatorGraph(config);
}

/**
 * Create a simple graph instance for direct use
 */
export function createSimpleTrainingGraph(pineconeService: PineconeService, apiKey?: string) {
  const config: TrainingSimulatorConfig = {
    pineconeService,
    apiKey
  };
  
  const simulator = new TrainingSimulatorGraph(config);
  return simulator.getGraph();
}