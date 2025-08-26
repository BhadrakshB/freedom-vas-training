// Silent Scoring Agent for AI Training Simulator
// Implements multi-dimensional scoring logic and session completion detection

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, AIMessage, BaseMessage } from "@langchain/core/messages";
import { ScoringMetrics, ScenarioData, PersonaData } from "../types";
import { AGENT_CONFIGS } from "../service-interfaces";

export interface ScoringInput {
  userResponse: string;
  conversationHistory: BaseMessage[];
  scenario: ScenarioData;
  persona: PersonaData;
  requiredSteps: string[];
  completedSteps: string[];
  turnCount: number;
  retrievedContext?: string[];
}

export interface ScoringOutput {
  scores: ScoringMetrics;
  evidence: ScoringEvidence;
  criticalErrors: string[];
  completedSteps: string[];
  sessionComplete: boolean;
  completionReason?: string;
}

export interface ScoringEvidence {
  policy_adherence: {
    score: number;
    evidence: string[];
    violations: string[];
  };
  empathy_index: {
    score: number;
    evidence: string[];
    missed_opportunities: string[];
  };
  completeness: {
    score: number;
    evidence: string[];
    missing_elements: string[];
  };
  escalation_judgment: {
    score: number;
    evidence: string[];
    inappropriate_actions: string[];
  };
  time_efficiency: {
    score: number;
    evidence: string[];
    inefficiencies: string[];
  };
}

export interface SessionCompletionCheck {
  allStepsCompleted: boolean;
  maxTurnsReached: boolean;
  criticalErrorOccurred: boolean;
  naturalConclusion: boolean;
  completionReason: string;
}

export class SilentScoringAgent {
  private llm: ChatGoogleGenerativeAI;
  private readonly MAX_TURNS = 20;
  private readonly CRITICAL_ERROR_THRESHOLD = 3;

  constructor(apiKey?: string) {
    const config = AGENT_CONFIGS.silentScoring;
    this.llm = new ChatGoogleGenerativeAI({
      model: config.model,
      apiKey: apiKey || process.env.GOOGLE_API_KEY!,
      temperature: config.temperature,
      maxOutputTokens: config.maxTokens,
    });
  }

  /**
   * Perform silent scoring of user response across all dimensions
   */
  async scoreUserResponse(input: ScoringInput): Promise<ScoringOutput> {
    try {
      // Step 1: Analyze user response for scoring evidence
      const evidence = await this.analyzeResponseEvidence(input);

      // Step 2: Calculate scores based on evidence
      const scores = this.calculateScores(evidence);

      // Step 3: Detect critical errors
      const criticalErrors = this.detectCriticalErrors(input, evidence);

      // Step 4: Update completed steps
      const completedSteps = this.updateCompletedSteps(input, evidence);

      // Step 5: Check session completion
      const completionCheck = this.checkSessionCompletion(input, criticalErrors, completedSteps);

      return {
        scores,
        evidence,
        criticalErrors,
        completedSteps,
        sessionComplete: completionCheck.allStepsCompleted || 
                        completionCheck.maxTurnsReached || 
                        completionCheck.criticalErrorOccurred ||
                        completionCheck.naturalConclusion,
        completionReason: completionCheck.completionReason
      };
    } catch (error) {
      throw new Error(`Silent scoring failed: ${error}`);
    }
  }

  /**
   * Analyze user response to extract scoring evidence
   */
  private async analyzeResponseEvidence(input: ScoringInput): Promise<ScoringEvidence> {
    const prompt = this.buildScoringAnalysisPrompt(input);
    const response = await this.llm.invoke([new HumanMessage(prompt)]);
    const analysisText = this.extractTextFromResponse(response);

    // Parse the structured analysis
    return this.parseEvidenceFromAnalysis(analysisText, input);
  }

  /**
   * Build prompt for scoring analysis
   */
  private buildScoringAnalysisPrompt(input: ScoringInput): string {
    const { userResponse, conversationHistory, scenario, persona, retrievedContext } = input;

    // Build conversation context
    const conversationContext = conversationHistory
      .slice(-4) // Last 4 messages for context
      .map((msg, index) => {
        const role = msg._getType() === 'human' ? 'VA' : 'Guest';
        return `${role}: ${msg.content}`;
      })
      .join('\n');

    const contextInfo = retrievedContext && retrievedContext.length > 0 
      ? `\nRELEVANT SOP CONTEXT:\n${retrievedContext.join('\n')}`
      : '';

    return `You are a silent scoring agent evaluating a virtual assistant's response during training. Analyze the response across five dimensions and provide specific evidence.

SCENARIO CONTEXT:
Title: ${scenario.title}
Description: ${scenario.description}
Required Steps: ${scenario.required_steps.join(', ')}
Critical Errors to Avoid: ${scenario.critical_errors.join(', ')}

GUEST PERSONA:
Name: ${persona.name}
Background: ${persona.background}
Communication Style: ${persona.communication_style}

CONVERSATION CONTEXT:
${conversationContext}

VA'S LATEST RESPONSE TO ANALYZE:
"${userResponse}"
${contextInfo}

SCORING DIMENSIONS TO ANALYZE:

1. POLICY ADHERENCE (0-100): How well does the response follow company SOPs and procedures?
   - Look for: Proper protocols, correct information, adherence to guidelines
   - Violations: Incorrect procedures, policy breaches, unauthorized actions

2. EMPATHY INDEX (0-100): How well does the response show understanding and emotional intelligence?
   - Look for: Acknowledgment of feelings, supportive language, active listening
   - Missed opportunities: Ignoring emotional cues, cold responses, dismissive tone

3. COMPLETENESS (0-100): How thoroughly does the response address the guest's needs?
   - Look for: All questions answered, comprehensive solutions, follow-up offered
   - Missing elements: Unanswered questions, incomplete solutions, lack of detail

4. ESCALATION JUDGMENT (0-100): How appropriately does the response handle escalation decisions?
   - Look for: Proper escalation timing, appropriate authority levels, clear reasoning
   - Inappropriate actions: Premature escalation, avoiding necessary escalation, wrong level

5. TIME EFFICIENCY (0-100): How efficiently does the response move toward resolution?
   - Look for: Direct solutions, efficient communication, progress toward goals
   - Inefficiencies: Unnecessary questions, circular conversation, time-wasting

For each dimension, provide:
- Score (0-100)
- Specific evidence from the response
- Issues or missed opportunities

Format your analysis as:
POLICY_ADHERENCE: [score] | Evidence: [specific examples] | Violations: [specific issues]
EMPATHY_INDEX: [score] | Evidence: [specific examples] | Missed: [specific opportunities]
COMPLETENESS: [score] | Evidence: [specific examples] | Missing: [specific elements]
ESCALATION_JUDGMENT: [score] | Evidence: [specific examples] | Issues: [specific problems]
TIME_EFFICIENCY: [score] | Evidence: [specific examples] | Inefficiencies: [specific issues]

Provide your analysis:`;
  }

  /**
   * Parse evidence from LLM analysis response
   */
  private parseEvidenceFromAnalysis(analysisText: string, input: ScoringInput): ScoringEvidence {
    const lines = analysisText.split('\n').filter(line => line.trim());
    
    const evidence: ScoringEvidence = {
      policy_adherence: { score: 50, evidence: [], violations: [] },
      empathy_index: { score: 50, evidence: [], missed_opportunities: [] },
      completeness: { score: 50, evidence: [], missing_elements: [] },
      escalation_judgment: { score: 50, evidence: [], inappropriate_actions: [] },
      time_efficiency: { score: 50, evidence: [], inefficiencies: [] }
    };

    lines.forEach(line => {
      if (line.startsWith('POLICY_ADHERENCE:')) {
        const parsed = this.parseScoreLine(line);
        evidence.policy_adherence = {
          score: parsed.score,
          evidence: parsed.evidence,
          violations: parsed.issues
        };
      } else if (line.startsWith('EMPATHY_INDEX:')) {
        const parsed = this.parseScoreLine(line);
        evidence.empathy_index = {
          score: parsed.score,
          evidence: parsed.evidence,
          missed_opportunities: parsed.issues
        };
      } else if (line.startsWith('COMPLETENESS:')) {
        const parsed = this.parseScoreLine(line);
        evidence.completeness = {
          score: parsed.score,
          evidence: parsed.evidence,
          missing_elements: parsed.issues
        };
      } else if (line.startsWith('ESCALATION_JUDGMENT:')) {
        const parsed = this.parseScoreLine(line);
        evidence.escalation_judgment = {
          score: parsed.score,
          evidence: parsed.evidence,
          inappropriate_actions: parsed.issues
        };
      } else if (line.startsWith('TIME_EFFICIENCY:')) {
        const parsed = this.parseScoreLine(line);
        evidence.time_efficiency = {
          score: parsed.score,
          evidence: parsed.evidence,
          inefficiencies: parsed.issues
        };
      }
    });

    return evidence;
  }

  /**
   * Parse individual score line from analysis
   */
  private parseScoreLine(line: string): { score: number; evidence: string[]; issues: string[] } {
    const parts = line.split('|').map(part => part.trim());
    
    // Extract score
    const scorePart = parts[0] || '';
    const scoreMatch = scorePart.match(/(\d+)/);
    const score = scoreMatch ? Math.min(100, Math.max(0, parseInt(scoreMatch[1]))) : 50;

    // Extract evidence
    const evidencePart = parts.find(part => part.toLowerCase().includes('evidence:')) || '';
    const evidence = evidencePart.replace(/evidence:\s*/i, '').split(',').map(e => e.trim()).filter(e => e);

    // Extract issues (violations, missed opportunities, etc.)
    const issuesPart = parts.find(part => 
      part.toLowerCase().includes('violations:') || 
      part.toLowerCase().includes('missed:') ||
      part.toLowerCase().includes('missing:') ||
      part.toLowerCase().includes('issues:') ||
      part.toLowerCase().includes('inefficiencies:')
    ) || '';
    const issues = issuesPart.replace(/^[^:]+:\s*/i, '').split(',').map(i => i.trim()).filter(i => i);

    return { score, evidence, issues };
  }

  /**
   * Calculate final scores based on evidence
   */
  private calculateScores(evidence: ScoringEvidence): ScoringMetrics {
    return {
      policy_adherence: evidence.policy_adherence.score,
      empathy_index: evidence.empathy_index.score,
      completeness: evidence.completeness.score,
      escalation_judgment: evidence.escalation_judgment.score,
      time_efficiency: evidence.time_efficiency.score
    };
  }

  /**
   * Detect critical errors in user response
   */
  private detectCriticalErrors(input: ScoringInput, evidence: ScoringEvidence): string[] {
    const criticalErrors: string[] = [];
    const { scenario, userResponse } = input;

    // Check for scenario-specific critical errors
    scenario.critical_errors.forEach(criticalError => {
      if (this.responseContainsCriticalError(userResponse, criticalError)) {
        criticalErrors.push(`Critical error detected: ${criticalError}`);
      }
    });

    // Check for severe policy violations
    if (evidence.policy_adherence.score < 30 && evidence.policy_adherence.violations.length > 0) {
      criticalErrors.push(`Severe policy violation: ${evidence.policy_adherence.violations[0]}`);
    }

    // Check for inappropriate escalation
    if (evidence.escalation_judgment.score < 20 && evidence.escalation_judgment.inappropriate_actions.length > 0) {
      criticalErrors.push(`Inappropriate escalation: ${evidence.escalation_judgment.inappropriate_actions[0]}`);
    }

    // Check for complete lack of empathy in emotional situations (only if score is very low)
    if (evidence.empathy_index.score < 15 && this.isEmotionalSituation(input.persona)) {
      criticalErrors.push('Complete lack of empathy in emotional situation');
    }

    return criticalErrors;
  }

  /**
   * Check if response contains a critical error
   */
  private responseContainsCriticalError(response: string, criticalError: string): boolean {
    const responseLower = response.toLowerCase();
    const errorLower = criticalError.toLowerCase();
    
    // Check for specific critical error patterns
    if (errorLower.includes('blaming') && (responseLower.includes('your fault') || responseLower.includes('you should have'))) {
      return true;
    }
    if (errorLower.includes('refusing to help') && responseLower.includes('nothing we can do')) {
      return true;
    }
    if (errorLower.includes('incorrect information') && responseLower.includes('probably') && responseLower.includes('third-party')) {
      return true;
    }
    
    // General keyword matching as fallback
    const errorKeywords = criticalError.toLowerCase().split(' ').filter(word => word.length > 3);
    return errorKeywords.some(keyword => responseLower.includes(keyword));
  }

  /**
   * Check if situation is emotional based on persona
   */
  private isEmotionalSituation(persona: PersonaData): boolean {
    const emotionalStates = ['frustrated', 'angry', 'upset', 'worried', 'distressed', 'furious'];
    return persona.emotional_arc.some(emotion => 
      emotionalStates.some(state => emotion.toLowerCase().includes(state))
    );
  }

  /**
   * Update completed steps based on response analysis
   */
  private updateCompletedSteps(input: ScoringInput, evidence: ScoringEvidence): string[] {
    const { requiredSteps, completedSteps, userResponse } = input;
    const newCompletedSteps = [...completedSteps];

    requiredSteps.forEach(step => {
      if (!completedSteps.includes(step) && this.stepCompletedInResponse(userResponse, step, evidence)) {
        newCompletedSteps.push(step);
      }
    });

    return newCompletedSteps;
  }

  /**
   * Check if a required step was completed in the response
   */
  private stepCompletedInResponse(response: string, step: string, evidence: ScoringEvidence): boolean {
    const responseLower = response.toLowerCase();
    const stepLower = step.toLowerCase();

    // Check for specific step patterns
    if (stepLower.includes('acknowledge') && (responseLower.includes('understand') || responseLower.includes('frustrat'))) {
      return evidence.empathy_index.score > 50;
    }
    if (stepLower.includes('apologize') && (responseLower.includes('apologize') || responseLower.includes('sorry'))) {
      return evidence.empathy_index.score > 60;
    }
    if (stepLower.includes('alternative') && (responseLower.includes('alternative') || responseLower.includes('option') || responseLower.includes('find you'))) {
      return evidence.completeness.score > 60;
    }
    if (stepLower.includes('compensation') && (responseLower.includes('compensation') || responseLower.includes('refund') || responseLower.includes('credit'))) {
      return evidence.policy_adherence.score > 60;
    }
    if (stepLower.includes('follow up') && (responseLower.includes('follow up') || responseLower.includes('check back') || responseLower.includes('ensure'))) {
      return evidence.completeness.score > 70;
    }

    // General keyword matching as fallback
    const stepKeywords = step.toLowerCase().split(' ').filter(word => word.length > 3);
    const hasStepKeywords = stepKeywords.some(keyword => responseLower.includes(keyword));
    const hasGoodEvidence = evidence.completeness.score > 60 && evidence.policy_adherence.score > 50;

    return hasStepKeywords && hasGoodEvidence;
  }

  /**
   * Check if session should be completed
   */
  private checkSessionCompletion(
    input: ScoringInput, 
    criticalErrors: string[], 
    completedSteps: string[]
  ): SessionCompletionCheck {
    const { requiredSteps, turnCount } = input;

    // Check if all required steps are completed
    const allStepsCompleted = requiredSteps.every(step => completedSteps.includes(step));

    // Check if maximum turns reached
    const maxTurnsReached = turnCount >= this.MAX_TURNS;

    // Check if critical error threshold reached
    const criticalErrorOccurred = criticalErrors.length >= this.CRITICAL_ERROR_THRESHOLD;

    // Check for natural conclusion (high completeness + all major steps done)
    const majorStepsCompleted = completedSteps.length >= Math.ceil(requiredSteps.length * 0.8);
    const naturalConclusion = majorStepsCompleted && turnCount >= 5;

    let completionReason = '';
    if (allStepsCompleted) {
      completionReason = 'All required steps completed successfully';
    } else if (criticalErrorOccurred) {
      completionReason = `Session terminated due to critical errors (${criticalErrors.length})`;
    } else if (maxTurnsReached) {
      completionReason = 'Maximum conversation turns reached';
    } else if (naturalConclusion) {
      completionReason = 'Natural conclusion reached with major objectives met';
    }

    return {
      allStepsCompleted,
      maxTurnsReached,
      criticalErrorOccurred,
      naturalConclusion,
      completionReason
    };
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
   * Calculate overall session performance score
   */
  calculateOverallScore(scores: ScoringMetrics[]): number {
    if (scores.length === 0) return 0;

    const weights = {
      policy_adherence: 0.25,
      empathy_index: 0.20,
      completeness: 0.25,
      escalation_judgment: 0.15,
      time_efficiency: 0.15
    };

    // Calculate weighted average across all turns
    const totalWeightedScore = scores.reduce((total, score) => {
      return total + (
        score.policy_adherence * weights.policy_adherence +
        score.empathy_index * weights.empathy_index +
        score.completeness * weights.completeness +
        score.escalation_judgment * weights.escalation_judgment +
        score.time_efficiency * weights.time_efficiency
      );
    }, 0);

    return Math.round(totalWeightedScore / scores.length);
  }

  /**
   * Generate scoring summary for feedback
   */
  generateScoringSummary(
    allScores: ScoringMetrics[], 
    allEvidence: ScoringEvidence[], 
    criticalErrors: string[]
  ): {
    overallScore: number;
    dimensionSummaries: Record<keyof ScoringMetrics, {
      averageScore: number;
      trend: 'improving' | 'declining' | 'stable';
      keyStrengths: string[];
      keyWeaknesses: string[];
    }>;
    criticalIssues: string[];
  } {
    const overallScore = this.calculateOverallScore(allScores);
    
    const dimensions: (keyof ScoringMetrics)[] = [
      'policy_adherence', 'empathy_index', 'completeness', 
      'escalation_judgment', 'time_efficiency'
    ];

    const dimensionSummaries = {} as any;

    dimensions.forEach(dimension => {
      const scores = allScores.map(score => score[dimension]);
      const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      
      // Calculate trend
      let trend: 'improving' | 'declining' | 'stable' = 'stable';
      if (scores.length >= 3) {
        const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
        const secondHalf = scores.slice(Math.floor(scores.length / 2));
        const firstAvg = firstHalf.reduce((sum, score) => sum + score, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, score) => sum + score, 0) / secondHalf.length;
        
        if (secondAvg > firstAvg + 5) trend = 'improving';
        else if (secondAvg < firstAvg - 5) trend = 'declining';
      }

      // Extract key strengths and weaknesses
      const evidence = allEvidence.map(e => e[dimension]);
      const keyStrengths = this.extractTopEvidence(evidence.map(e => e.evidence).flat());
      const keyWeaknesses = this.extractTopEvidence(
        evidence.map(e => 
          'violations' in e ? e.violations :
          'missed_opportunities' in e ? e.missed_opportunities :
          'missing_elements' in e ? e.missing_elements :
          'inappropriate_actions' in e ? e.inappropriate_actions :
          'inefficiencies' in e ? e.inefficiencies : []
        ).flat()
      );

      dimensionSummaries[dimension] = {
        averageScore: Math.round(averageScore),
        trend,
        keyStrengths,
        keyWeaknesses
      };
    });

    return {
      overallScore,
      dimensionSummaries,
      criticalIssues: criticalErrors
    };
  }

  /**
   * Extract top evidence items by frequency
   */
  private extractTopEvidence(evidenceItems: string[]): string[] {
    const frequency = evidenceItems.reduce((freq, item) => {
      freq[item] = (freq[item] || 0) + 1;
      return freq;
    }, {} as Record<string, number>);

    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([item]) => item)
      .filter(item => item.length > 0);
  }

  /**
   * Create fallback scoring when analysis fails
   */
  createFallbackScoring(input: ScoringInput): ScoringOutput {
    const fallbackScores: ScoringMetrics = {
      policy_adherence: 50,
      empathy_index: 50,
      completeness: 50,
      escalation_judgment: 50,
      time_efficiency: 50
    };

    const fallbackEvidence: ScoringEvidence = {
      policy_adherence: { score: 50, evidence: ['Analysis unavailable'], violations: [] },
      empathy_index: { score: 50, evidence: ['Analysis unavailable'], missed_opportunities: [] },
      completeness: { score: 50, evidence: ['Analysis unavailable'], missing_elements: [] },
      escalation_judgment: { score: 50, evidence: ['Analysis unavailable'], inappropriate_actions: [] },
      time_efficiency: { score: 50, evidence: ['Analysis unavailable'], inefficiencies: [] }
    };

    return {
      scores: fallbackScores,
      evidence: fallbackEvidence,
      criticalErrors: [],
      completedSteps: input.completedSteps,
      sessionComplete: input.turnCount >= this.MAX_TURNS,
      completionReason: 'Fallback scoring applied due to analysis failure'
    };
  }
}

// Factory function for creating SilentScoringAgent instances
export const createSilentScoringAgent = (apiKey?: string) => {
  return new SilentScoringAgent(apiKey);
};