// Feedback Generator Agent for AI Training Simulator
// Implements comprehensive feedback generation with SOP citations and actionable recommendations

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, AIMessage, BaseMessage } from "@langchain/core/messages";
import { 
  ScenarioData, 
  PersonaData, 
  ScoringMetrics, 
  RetrievalResult 
} from "../types";
import { AGENT_CONFIGS } from "../service-interfaces";
import { PineconeService } from "../pinecone-service";
import { ScoringEvidence } from "./silent-scoring";

export interface FeedbackInput {
  sessionId: string;
  scenario: ScenarioData;
  persona: PersonaData;
  conversationHistory: BaseMessage[];
  allScores: ScoringMetrics[];
  allEvidence: ScoringEvidence[];
  criticalErrors: string[];
  completedSteps: string[];
  requiredSteps: string[];
  overallScore: number;
  sessionDuration: number;
}

export interface FeedbackOutput {
  overallPerformance: OverallPerformance;
  detailedAnalysis: DetailedAnalysis;
  sopCitations: SOPCitation[];
  actionableRecommendations: ActionableRecommendation[];
  resources: ResourceRecommendation[];
  nextSteps: string[];
}

export interface OverallPerformance {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  summary: string;
  keyStrengths: string[];
  primaryAreasForImprovement: string[];
  sessionCompletion: {
    stepsCompleted: number;
    totalSteps: number;
    completionRate: number;
    criticalErrorCount: number;
  };
}

export interface DetailedAnalysis {
  policyAdherence: DimensionAnalysis;
  empathyIndex: DimensionAnalysis;
  completeness: DimensionAnalysis;
  escalationJudgment: DimensionAnalysis;
  timeEfficiency: DimensionAnalysis;
}

export interface DimensionAnalysis {
  score: number;
  trend: 'improving' | 'declining' | 'stable';
  strengths: string[];
  weaknesses: string[];
  specificExamples: {
    positive: string[];
    negative: string[];
  };
  improvementOpportunities: string[];
}

export interface SOPCitation {
  section: string;
  content: string;
  relevance: string;
  applicationExample: string;
  source: string;
}

export interface ActionableRecommendation {
  category: 'policy' | 'communication' | 'process' | 'empathy' | 'efficiency';
  priority: 'high' | 'medium' | 'low';
  recommendation: string;
  specificActions: string[];
  expectedOutcome: string;
  relatedSOPs: string[];
}

export interface ResourceRecommendation {
  type: 'training_material' | 'sop_section' | 'best_practice' | 'script_template';
  title: string;
  description: string;
  relevance: string;
  source: string;
}

export class FeedbackGeneratorAgent {
  private llm: ChatGoogleGenerativeAI;
  private pineconeService: PineconeService;

  constructor(apiKey?: string, pineconeService?: PineconeService) {
    const config = AGENT_CONFIGS.feedbackGenerator;
    this.llm = new ChatGoogleGenerativeAI({
      model: config.model,
      apiKey: apiKey || process.env.GOOGLE_API_KEY!,
      temperature: config.temperature,
      maxOutputTokens: config.maxTokens,
    });
    
    this.pineconeService = pineconeService || new PineconeService();
  }

  /**
   * Generate comprehensive feedback for completed training session
   */
  async generateFeedback(input: FeedbackInput): Promise<FeedbackOutput> {
    try {
      // Step 1: Retrieve relevant SOP documents for context
      const sopContext = await this.retrieveRelevantSOPs(input);

      // Step 2: Generate overall performance assessment
      const overallPerformance = await this.generateOverallPerformance(input, sopContext);

      // Step 3: Generate detailed dimension analysis
      const detailedAnalysis = await this.generateDetailedAnalysis(input, sopContext);

      // Step 4: Create SOP citations with specific applications
      const sopCitations = await this.generateSOPCitations(input, sopContext);

      // Step 5: Generate actionable recommendations
      const actionableRecommendations = await this.generateActionableRecommendations(input, sopContext);

      // Step 6: Recommend relevant resources
      const resources = await this.generateResourceRecommendations(input, sopContext);

      // Step 7: Define next steps for continued learning
      const nextSteps = this.generateNextSteps(input, actionableRecommendations);

      return {
        overallPerformance,
        detailedAnalysis,
        sopCitations,
        actionableRecommendations,
        resources,
        nextSteps
      };
    } catch (error) {
      throw new Error(`Feedback generation failed: ${error}`);
    }
  }

  /**
   * Retrieve relevant SOP documents based on session context
   */
  private async retrieveRelevantSOPs(input: FeedbackInput): Promise<RetrievalResult[]> {
    try {
      // Build query from scenario, critical errors, and weak performance areas
      const queryParts = [
        input.scenario.title,
        input.scenario.description,
        ...input.criticalErrors,
        ...this.extractWeakAreas(input.allEvidence)
      ];

      const query = queryParts.join(' ');
      
      // Retrieve SOPs with appropriate filters
      const sopResults = await this.pineconeService.retrieveRelevantSOPs(query, {
        category: this.categorizeScenario(input.scenario),
        type: 'sop'
      });

      return sopResults.slice(0, 8); // Limit to top 8 most relevant SOPs
    } catch (error) {
      console.warn('Failed to retrieve SOPs for feedback:', error);
      return []; // Continue with empty context if retrieval fails
    }
  }

  /**
   * Extract weak performance areas from evidence
   */
  private extractWeakAreas(allEvidence: ScoringEvidence[]): string[] {
    const weakAreas: string[] = [];
    
    allEvidence.forEach(evidence => {
      if (evidence.policy_adherence.score < 60) {
        weakAreas.push(...evidence.policy_adherence.violations);
      }
      if (evidence.empathy_index.score < 60) {
        weakAreas.push(...evidence.empathy_index.missed_opportunities);
      }
      if (evidence.completeness.score < 60) {
        weakAreas.push(...evidence.completeness.missing_elements);
      }
      if (evidence.escalation_judgment.score < 60) {
        weakAreas.push(...evidence.escalation_judgment.inappropriate_actions);
      }
      if (evidence.time_efficiency.score < 60) {
        weakAreas.push(...evidence.time_efficiency.inefficiencies);
      }
    });

    return weakAreas;
  }

  /**
   * Categorize scenario for SOP filtering
   */
  private categorizeScenario(scenario: ScenarioData): string {
    const title = scenario.title.toLowerCase();
    const description = scenario.description.toLowerCase();
    
    if (title.includes('booking') || description.includes('reservation')) {
      return 'booking';
    } else if (title.includes('complaint') || description.includes('issue') || description.includes('problem')) {
      return 'complaint';
    } else if (title.includes('overbooking') || description.includes('overbook')) {
      return 'overbooking';
    }
    
    return 'general';
  }

  /**
   * Generate overall performance assessment
   */
  private async generateOverallPerformance(
    input: FeedbackInput, 
    sopContext: RetrievalResult[]
  ): Promise<OverallPerformance> {
    const prompt = this.buildOverallPerformancePrompt(input, sopContext);
    const response = await this.llm.invoke([new HumanMessage(prompt)]);
    const analysisText = this.extractTextFromResponse(response);

    return this.parseOverallPerformance(analysisText, input);
  }

  /**
   * Build prompt for overall performance analysis
   */
  private buildOverallPerformancePrompt(input: FeedbackInput, sopContext: RetrievalResult[]): string {
    const contextInfo = sopContext.length > 0 
      ? `\nRELEVANT SOP CONTEXT:\n${sopContext.map(sop => `- ${sop.content}`).join('\n')}`
      : '';

    const conversationSummary = this.buildConversationSummary(input.conversationHistory);
    const scoresSummary = this.buildScoresSummary(input.allScores);

    return `You are providing overall performance feedback for a virtual assistant training session. Analyze the complete session and provide a comprehensive assessment.

TRAINING SESSION CONTEXT:
Scenario: ${input.scenario.title}
Description: ${input.scenario.description}
Required Steps: ${input.requiredSteps.join(', ')}
Completed Steps: ${input.completedSteps.join(', ')}
Critical Errors: ${input.criticalErrors.join(', ') || 'None'}
Overall Score: ${input.overallScore}/100
Session Duration: ${Math.round(input.sessionDuration / 60)} minutes
${contextInfo}

CONVERSATION SUMMARY:
${conversationSummary}

PERFORMANCE SCORES:
${scoresSummary}

Provide an overall performance assessment with the following format:

GRADE: [A/B/C/D/F based on overall score: A=90+, B=80-89, C=70-79, D=60-69, F=<60]

SUMMARY: [2-3 sentence overall assessment of performance, highlighting the most significant strengths and areas for improvement]

KEY_STRENGTHS: [List 3-4 specific strengths demonstrated during the session]
- [Specific strength with brief explanation]
- [Specific strength with brief explanation]
- [Specific strength with brief explanation]

PRIMARY_IMPROVEMENT_AREAS: [List 2-3 most critical areas needing improvement]
- [Specific area with brief explanation]
- [Specific area with brief explanation]

Provide your assessment:`;
  }

  /**
   * Build conversation summary for context
   */
  private buildConversationSummary(conversationHistory: BaseMessage[]): string {
    const summary = conversationHistory
      .slice(-8) // Last 8 messages for context
      .map((msg, index) => {
        const role = msg._getType() === 'human' ? 'VA' : 'Guest';
        const content = typeof msg.content === 'string' ? msg.content : String(msg.content);
        return `${role}: ${content.substring(0, 150)}${content.length > 150 ? '...' : ''}`;
      })
      .join('\n');

    return summary || 'No conversation history available';
  }

  /**
   * Build scores summary for analysis
   */
  private buildScoresSummary(allScores: ScoringMetrics[]): string {
    if (allScores.length === 0) return 'No scores available';

    const avgScores = this.calculateAverageScores(allScores);
    
    return `Average Scores:
- Policy Adherence: ${avgScores.policy_adherence}/100
- Empathy Index: ${avgScores.empathy_index}/100
- Completeness: ${avgScores.completeness}/100
- Escalation Judgment: ${avgScores.escalation_judgment}/100
- Time Efficiency: ${avgScores.time_efficiency}/100`;
  }

  /**
   * Calculate average scores across all turns
   */
  private calculateAverageScores(allScores: ScoringMetrics[]): ScoringMetrics {
    const totals = allScores.reduce((acc, scores) => ({
      policy_adherence: acc.policy_adherence + scores.policy_adherence,
      empathy_index: acc.empathy_index + scores.empathy_index,
      completeness: acc.completeness + scores.completeness,
      escalation_judgment: acc.escalation_judgment + scores.escalation_judgment,
      time_efficiency: acc.time_efficiency + scores.time_efficiency
    }), {
      policy_adherence: 0,
      empathy_index: 0,
      completeness: 0,
      escalation_judgment: 0,
      time_efficiency: 0
    });

    const count = allScores.length;
    return {
      policy_adherence: Math.round(totals.policy_adherence / count),
      empathy_index: Math.round(totals.empathy_index / count),
      completeness: Math.round(totals.completeness / count),
      escalation_judgment: Math.round(totals.escalation_judgment / count),
      time_efficiency: Math.round(totals.time_efficiency / count)
    };
  }

  /**
   * Parse overall performance from LLM response
   */
  private parseOverallPerformance(analysisText: string, input: FeedbackInput): OverallPerformance {
    const lines = analysisText.split('\n').filter(line => line.trim());
    
    let grade: 'A' | 'B' | 'C' | 'D' | 'F' = 'C';
    let summary = '';
    const keyStrengths: string[] = [];
    const primaryAreasForImprovement: string[] = [];

    let currentSection = '';
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('GRADE:')) {
        const gradeMatch = trimmedLine.match(/GRADE:\s*([ABCDF])/);
        if (gradeMatch) {
          grade = gradeMatch[1] as 'A' | 'B' | 'C' | 'D' | 'F';
        }
      } else if (trimmedLine.startsWith('SUMMARY:')) {
        summary = trimmedLine.replace('SUMMARY:', '').trim();
      } else if (trimmedLine.startsWith('KEY_STRENGTHS:')) {
        currentSection = 'strengths';
      } else if (trimmedLine.startsWith('PRIMARY_IMPROVEMENT_AREAS:')) {
        currentSection = 'improvements';
      } else if (trimmedLine.startsWith('- ')) {
        const item = trimmedLine.substring(2).trim();
        if (currentSection === 'strengths') {
          keyStrengths.push(item);
        } else if (currentSection === 'improvements') {
          primaryAreasForImprovement.push(item);
        }
      }
    });

    return {
      score: input.overallScore,
      grade,
      summary: summary || 'Performance assessment completed',
      keyStrengths,
      primaryAreasForImprovement,
      sessionCompletion: {
        stepsCompleted: input.completedSteps.length,
        totalSteps: input.requiredSteps.length,
        completionRate: Math.round((input.completedSteps.length / input.requiredSteps.length) * 100),
        criticalErrorCount: input.criticalErrors.length
      }
    };
  }

  /**
   * Generate detailed analysis for each dimension
   */
  private async generateDetailedAnalysis(
    input: FeedbackInput, 
    sopContext: RetrievalResult[]
  ): Promise<DetailedAnalysis> {
    const dimensions: (keyof ScoringMetrics)[] = [
      'policy_adherence', 'empathy_index', 'completeness', 
      'escalation_judgment', 'time_efficiency'
    ];

    const analysis: Partial<DetailedAnalysis> = {};

    for (const dimension of dimensions) {
      analysis[dimension] = await this.generateDimensionAnalysis(dimension, input, sopContext);
    }

    return analysis as DetailedAnalysis;
  }

  /**
   * Generate analysis for a specific dimension
   */
  private async generateDimensionAnalysis(
    dimension: keyof ScoringMetrics,
    input: FeedbackInput,
    sopContext: RetrievalResult[]
  ): Promise<DimensionAnalysis> {
    const scores = input.allScores.map(score => score[dimension]);
    const evidence = input.allEvidence.map(e => e[dimension]);
    const averageScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);

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

    // Extract strengths and weaknesses
    const strengths = evidence.map(e => e.evidence).flat().filter(e => e.length > 0);
    const weaknesses = evidence.map(e => 
      'violations' in e ? e.violations :
      'missed_opportunities' in e ? e.missed_opportunities :
      'missing_elements' in e ? e.missing_elements :
      'inappropriate_actions' in e ? e.inappropriate_actions :
      'inefficiencies' in e ? e.inefficiencies : []
    ).flat().filter(w => w.length > 0);

    return {
      score: averageScore,
      trend,
      strengths: this.getTopItems(strengths, 3),
      weaknesses: this.getTopItems(weaknesses, 3),
      specificExamples: {
        positive: this.getTopItems(strengths, 2),
        negative: this.getTopItems(weaknesses, 2)
      },
      improvementOpportunities: this.generateImprovementOpportunities(dimension, weaknesses, sopContext)
    };
  }

  /**
   * Get top items by frequency
   */
  private getTopItems(items: string[], limit: number): string[] {
    const frequency = items.reduce((freq, item) => {
      freq[item] = (freq[item] || 0) + 1;
      return freq;
    }, {} as Record<string, number>);

    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([item]) => item)
      .filter(item => item.length > 0);
  }

  /**
   * Generate improvement opportunities based on dimension and context
   */
  private generateImprovementOpportunities(
    dimension: keyof ScoringMetrics,
    weaknesses: string[],
    sopContext: RetrievalResult[]
  ): string[] {
    const opportunities: string[] = [];
    
    // Dimension-specific improvement suggestions
    switch (dimension) {
      case 'policy_adherence':
        opportunities.push('Review company SOPs and procedures regularly');
        opportunities.push('Practice applying policies to various scenarios');
        break;
      case 'empathy_index':
        opportunities.push('Practice active listening techniques');
        opportunities.push('Focus on acknowledging guest emotions before problem-solving');
        break;
      case 'completeness':
        opportunities.push('Use checklists to ensure all guest needs are addressed');
        opportunities.push('Ask follow-up questions to uncover additional concerns');
        break;
      case 'escalation_judgment':
        opportunities.push('Learn escalation criteria and decision trees');
        opportunities.push('Practice identifying when situations require manager involvement');
        break;
      case 'time_efficiency':
        opportunities.push('Streamline communication by addressing multiple points at once');
        opportunities.push('Use templates and scripts for common scenarios');
        break;
    }

    // Add context-specific opportunities from SOPs
    if (sopContext.length > 0 && weaknesses.length > 0) {
      opportunities.push(`Review relevant SOP sections: ${sopContext.slice(0, 2).map(sop => sop.metadata.category).join(', ')}`);
    }

    return opportunities.slice(0, 3);
  }

  /**
   * Generate SOP citations with specific applications
   */
  private async generateSOPCitations(
    input: FeedbackInput,
    sopContext: RetrievalResult[]
  ): Promise<SOPCitation[]> {
    const citations: SOPCitation[] = [];

    for (const sop of sopContext.slice(0, 5)) {
      const citation: SOPCitation = {
        section: sop.metadata.category || 'General Policy',
        content: sop.content.substring(0, 200) + (sop.content.length > 200 ? '...' : ''),
        relevance: this.determineSOPRelevance(sop, input),
        applicationExample: this.generateApplicationExample(sop, input),
        source: sop.metadata.type || 'SOP Document'
      };
      
      citations.push(citation);
    }

    return citations;
  }

  /**
   * Determine SOP relevance to the session
   */
  private determineSOPRelevance(sop: RetrievalResult, input: FeedbackInput): string {
    const category = sop.metadata.category;
    const hasErrors = input.criticalErrors.length > 0;
    const lowScores = input.allScores.some(score => 
      Object.values(score).some(value => value < 60)
    );

    if (hasErrors) {
      return `Directly relevant to addressing critical errors in ${category} situations`;
    } else if (lowScores) {
      return `Provides guidance for improving performance in ${category} scenarios`;
    } else {
      return `Best practices for maintaining excellence in ${category} interactions`;
    }
  }

  /**
   * Generate application example for SOP
   */
  private generateApplicationExample(sop: RetrievalResult, input: FeedbackInput): string {
    const category = sop.metadata.category;
    const scenarioType = input.scenario.title.toLowerCase();

    if (scenarioType.includes(category)) {
      return `This policy should have been applied when ${this.getScenarioContext(input.scenario)}`;
    } else {
      return `Apply this guidance in similar ${category} situations to ensure policy compliance`;
    }
  }

  /**
   * Get scenario context for examples
   */
  private getScenarioContext(scenario: ScenarioData): string {
    const description = scenario.description.toLowerCase();
    
    if (description.includes('guest')) {
      return 'interacting with the guest about their concerns';
    } else if (description.includes('booking')) {
      return 'handling the booking-related issue';
    } else if (description.includes('complaint')) {
      return 'addressing the guest complaint';
    }
    
    return 'managing the situation described in the scenario';
  }

  /**
   * Generate actionable recommendations
   */
  private async generateActionableRecommendations(
    input: FeedbackInput,
    sopContext: RetrievalResult[]
  ): Promise<ActionableRecommendation[]> {
    const recommendations: ActionableRecommendation[] = [];
    
    // Generate recommendations based on weak areas
    const weakDimensions = this.identifyWeakDimensions(input.allScores);
    
    for (const dimension of weakDimensions) {
      const recommendation = this.createRecommendationForDimension(dimension, input, sopContext);
      if (recommendation) {
        recommendations.push(recommendation);
      }
    }

    // Add critical error recommendations
    if (input.criticalErrors.length > 0) {
      recommendations.push(this.createCriticalErrorRecommendation(input.criticalErrors, sopContext));
    }

    return recommendations.slice(0, 5); // Limit to top 5 recommendations
  }

  /**
   * Identify dimensions with scores below 70
   */
  private identifyWeakDimensions(allScores: ScoringMetrics[]): (keyof ScoringMetrics)[] {
    const avgScores = this.calculateAverageScores(allScores);
    const weakDimensions: (keyof ScoringMetrics)[] = [];

    Object.entries(avgScores).forEach(([dimension, score]) => {
      if (score < 70) {
        weakDimensions.push(dimension as keyof ScoringMetrics);
      }
    });

    return weakDimensions;
  }

  /**
   * Create recommendation for specific dimension
   */
  private createRecommendationForDimension(
    dimension: keyof ScoringMetrics,
    input: FeedbackInput,
    sopContext: RetrievalResult[]
  ): ActionableRecommendation | null {
    const dimensionConfig = this.getDimensionConfig(dimension);
    if (!dimensionConfig) return null;

    const relatedSOPs = sopContext
      .filter(sop => sop.metadata.category === this.categorizeScenario(input.scenario))
      .map(sop => sop.metadata.category)
      .slice(0, 2);

    return {
      category: dimensionConfig.category,
      priority: dimensionConfig.priority,
      recommendation: dimensionConfig.recommendation,
      specificActions: dimensionConfig.actions,
      expectedOutcome: dimensionConfig.outcome,
      relatedSOPs
    };
  }

  /**
   * Get configuration for dimension recommendations
   */
  private getDimensionConfig(dimension: keyof ScoringMetrics): {
    category: ActionableRecommendation['category'];
    priority: ActionableRecommendation['priority'];
    recommendation: string;
    actions: string[];
    outcome: string;
  } | null {
    const configs = {
      policy_adherence: {
        category: 'policy' as const,
        priority: 'high' as const,
        recommendation: 'Strengthen knowledge and application of company policies and procedures',
        actions: [
          'Review relevant SOP sections daily',
          'Practice policy application with scenario exercises',
          'Create quick reference guides for common situations'
        ],
        outcome: 'Improved compliance and reduced policy violations'
      },
      empathy_index: {
        category: 'empathy' as const,
        priority: 'high' as const,
        recommendation: 'Develop stronger emotional intelligence and guest connection skills',
        actions: [
          'Practice active listening techniques',
          'Use empathetic language patterns',
          'Acknowledge emotions before problem-solving'
        ],
        outcome: 'Enhanced guest satisfaction and emotional connection'
      },
      completeness: {
        category: 'communication' as const,
        priority: 'medium' as const,
        recommendation: 'Improve thoroughness in addressing all guest needs and concerns',
        actions: [
          'Use structured checklists for complex situations',
          'Ask probing questions to uncover all issues',
          'Summarize solutions before concluding interactions'
        ],
        outcome: 'More comprehensive problem resolution and fewer follow-up issues'
      },
      escalation_judgment: {
        category: 'process' as const,
        priority: 'high' as const,
        recommendation: 'Enhance decision-making skills for appropriate escalation timing',
        actions: [
          'Study escalation criteria and decision trees',
          'Practice identifying escalation triggers',
          'Learn when to involve different authority levels'
        ],
        outcome: 'Better judgment in escalation decisions and improved issue resolution'
      },
      time_efficiency: {
        category: 'efficiency' as const,
        priority: 'medium' as const,
        recommendation: 'Streamline communication and problem-solving processes',
        actions: [
          'Use templates for common responses',
          'Address multiple concerns in single responses',
          'Prioritize most critical issues first'
        ],
        outcome: 'Faster resolution times and improved productivity'
      }
    };

    return configs[dimension] || null;
  }

  /**
   * Create recommendation for critical errors
   */
  private createCriticalErrorRecommendation(
    criticalErrors: string[],
    sopContext: RetrievalResult[]
  ): ActionableRecommendation {
    const relatedSOPs = sopContext.map(sop => sop.metadata.category).slice(0, 2);

    return {
      category: 'policy',
      priority: 'high',
      recommendation: 'Address critical errors that occurred during the session',
      specificActions: [
        'Review the specific policies violated',
        'Practice correct responses to similar situations',
        'Understand the impact of these errors on guest experience'
      ],
      expectedOutcome: 'Prevention of similar critical errors in future interactions',
      relatedSOPs
    };
  }

  /**
   * Generate resource recommendations
   */
  private async generateResourceRecommendations(
    input: FeedbackInput,
    sopContext: RetrievalResult[]
  ): Promise<ResourceRecommendation[]> {
    const resources: ResourceRecommendation[] = [];

    // Add SOP-based resources
    sopContext.slice(0, 3).forEach(sop => {
      resources.push({
        type: 'sop_section',
        title: `${sop.metadata.category} Policy Guidelines`,
        description: sop.content.substring(0, 100) + '...',
        relevance: `Directly applicable to ${sop.metadata.category} scenarios like the one practiced`,
        source: sop.metadata.type || 'Company SOP'
      });
    });

    // Add training materials based on weak areas
    const weakDimensions = this.identifyWeakDimensions(input.allScores);
    weakDimensions.forEach(dimension => {
      const resource = this.getTrainingResourceForDimension(dimension);
      if (resource) {
        resources.push(resource);
      }
    });

    return resources.slice(0, 5);
  }

  /**
   * Get training resource for specific dimension
   */
  private getTrainingResourceForDimension(dimension: keyof ScoringMetrics): ResourceRecommendation | null {
    const resources = {
      policy_adherence: {
        type: 'training_material' as const,
        title: 'Policy Application Workshop',
        description: 'Interactive training on applying company policies in various scenarios',
        relevance: 'Helps improve policy knowledge and application skills',
        source: 'Training Department'
      },
      empathy_index: {
        type: 'training_material' as const,
        title: 'Emotional Intelligence for Customer Service',
        description: 'Training module on recognizing and responding to guest emotions',
        relevance: 'Develops empathy and emotional connection skills',
        source: 'Training Department'
      },
      completeness: {
        type: 'best_practice' as const,
        title: 'Comprehensive Problem-Solving Checklist',
        description: 'Step-by-step guide for ensuring all guest needs are addressed',
        relevance: 'Provides structure for thorough issue resolution',
        source: 'Best Practices Guide'
      },
      escalation_judgment: {
        type: 'training_material' as const,
        title: 'Escalation Decision Tree Training',
        description: 'Interactive guide for making appropriate escalation decisions',
        relevance: 'Improves judgment on when and how to escalate issues',
        source: 'Training Department'
      },
      time_efficiency: {
        type: 'script_template' as const,
        title: 'Efficient Communication Templates',
        description: 'Pre-written templates for common guest interactions',
        relevance: 'Helps streamline communication and reduce response time',
        source: 'Communication Templates'
      }
    };

    return resources[dimension] || null;
  }

  /**
   * Generate next steps for continued learning
   */
  private generateNextSteps(
    input: FeedbackInput,
    recommendations: ActionableRecommendation[]
  ): string[] {
    const nextSteps: string[] = [];

    // Add immediate action items
    if (input.criticalErrors.length > 0) {
      nextSteps.push('Review and understand the critical errors that occurred in this session');
    }

    // Add top priority recommendations
    const highPriorityRecs = recommendations.filter(rec => rec.priority === 'high');
    if (highPriorityRecs.length > 0) {
      nextSteps.push(`Focus on ${highPriorityRecs[0].category} improvements as the highest priority`);
    }

    // Add practice recommendations
    if (input.completedSteps.length < input.requiredSteps.length) {
      nextSteps.push('Practice completing all required steps in similar scenarios');
    }

    // Add general improvement steps
    nextSteps.push('Schedule follow-up training sessions to practice weak areas');
    nextSteps.push('Review relevant SOP sections before your next shift');

    return nextSteps.slice(0, 4);
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
   * Format feedback output as structured text for display
   */
  formatFeedbackForDisplay(feedback: FeedbackOutput): string {
    const sections: string[] = [];

    // Overall Performance
    sections.push(`# Training Session Feedback\n`);
    sections.push(`## Overall Performance: ${feedback.overallPerformance.grade} (${feedback.overallPerformance.score}/100)\n`);
    sections.push(`${feedback.overallPerformance.summary}\n`);
    
    sections.push(`### Session Completion`);
    sections.push(`- Steps Completed: ${feedback.overallPerformance.sessionCompletion.stepsCompleted}/${feedback.overallPerformance.sessionCompletion.totalSteps} (${feedback.overallPerformance.sessionCompletion.completionRate}%)`);
    sections.push(`- Critical Errors: ${feedback.overallPerformance.sessionCompletion.criticalErrorCount}\n`);

    // Key Strengths
    if (feedback.overallPerformance.keyStrengths.length > 0) {
      sections.push(`### Key Strengths`);
      feedback.overallPerformance.keyStrengths.forEach(strength => {
        sections.push(`- ${strength}`);
      });
      sections.push('');
    }

    // Areas for Improvement
    if (feedback.overallPerformance.primaryAreasForImprovement.length > 0) {
      sections.push(`### Primary Areas for Improvement`);
      feedback.overallPerformance.primaryAreasForImprovement.forEach(area => {
        sections.push(`- ${area}`);
      });
      sections.push('');
    }

    // Detailed Analysis
    sections.push(`## Detailed Performance Analysis\n`);
    
    const dimensionNames = {
      policyAdherence: 'Policy Adherence',
      empathyIndex: 'Empathy & Emotional Intelligence',
      completeness: 'Completeness & Thoroughness',
      escalationJudgment: 'Escalation Judgment',
      timeEfficiency: 'Time Efficiency'
    };

    Object.entries(feedback.detailedAnalysis).forEach(([key, analysis]) => {
      const dimensionName = dimensionNames[key as keyof typeof dimensionNames];
      sections.push(`### ${dimensionName}: ${analysis.score}/100 (${analysis.trend})`);
      
      if (analysis.strengths.length > 0) {
        sections.push(`**Strengths:** ${analysis.strengths.join(', ')}`);
      }
      
      if (analysis.weaknesses.length > 0) {
        sections.push(`**Areas to improve:** ${analysis.weaknesses.join(', ')}`);
      }
      
      sections.push('');
    });

    // SOP Citations
    if (feedback.sopCitations.length > 0) {
      sections.push(`## Relevant Policy References\n`);
      feedback.sopCitations.forEach((citation, index) => {
        sections.push(`### ${index + 1}. ${citation.section}`);
        sections.push(`${citation.content}`);
        sections.push(`**Relevance:** ${citation.relevance}`);
        sections.push(`**Application:** ${citation.applicationExample}\n`);
      });
    }

    // Actionable Recommendations
    if (feedback.actionableRecommendations.length > 0) {
      sections.push(`## Actionable Recommendations\n`);
      feedback.actionableRecommendations.forEach((rec, index) => {
        sections.push(`### ${index + 1}. ${rec.recommendation} (${rec.priority} priority)`);
        sections.push(`**Category:** ${rec.category}`);
        sections.push(`**Specific Actions:**`);
        rec.specificActions.forEach(action => {
          sections.push(`- ${action}`);
        });
        sections.push(`**Expected Outcome:** ${rec.expectedOutcome}\n`);
      });
    }

    // Resources
    if (feedback.resources.length > 0) {
      sections.push(`## Recommended Resources\n`);
      feedback.resources.forEach((resource, index) => {
        sections.push(`### ${index + 1}. ${resource.title}`);
        sections.push(`${resource.description}`);
        sections.push(`**Why this helps:** ${resource.relevance}\n`);
      });
    }

    // Next Steps
    if (feedback.nextSteps.length > 0) {
      sections.push(`## Next Steps\n`);
      feedback.nextSteps.forEach((step, index) => {
        sections.push(`${index + 1}. ${step}`);
      });
    }

    return sections.join('\n');
  }

  /**
   * Create fallback feedback when generation fails
   */
  createFallbackFeedback(input: FeedbackInput): FeedbackOutput {
    return {
      overallPerformance: {
        score: input.overallScore,
        grade: input.overallScore >= 80 ? 'B' : input.overallScore >= 70 ? 'C' : 'D',
        summary: 'Training session completed. Detailed analysis unavailable due to system limitations.',
        keyStrengths: ['Session participation', 'Engagement with scenario'],
        primaryAreasForImprovement: ['Review session performance', 'Practice similar scenarios'],
        sessionCompletion: {
          stepsCompleted: input.completedSteps.length,
          totalSteps: input.requiredSteps.length,
          completionRate: Math.round((input.completedSteps.length / input.requiredSteps.length) * 100),
          criticalErrorCount: input.criticalErrors.length
        }
      },
      detailedAnalysis: {
        policyAdherence: this.createFallbackDimensionAnalysis(input.allScores, 'policy_adherence'),
        empathyIndex: this.createFallbackDimensionAnalysis(input.allScores, 'empathy_index'),
        completeness: this.createFallbackDimensionAnalysis(input.allScores, 'completeness'),
        escalationJudgment: this.createFallbackDimensionAnalysis(input.allScores, 'escalation_judgment'),
        timeEfficiency: this.createFallbackDimensionAnalysis(input.allScores, 'time_efficiency')
      },
      sopCitations: [],
      actionableRecommendations: [{
        category: 'policy',
        priority: 'medium',
        recommendation: 'Review session performance and practice similar scenarios',
        specificActions: ['Analyze conversation transcript', 'Practice with training materials'],
        expectedOutcome: 'Improved performance in future sessions',
        relatedSOPs: []
      }],
      resources: [{
        type: 'training_material',
        title: 'General Training Resources',
        description: 'Access additional training materials for continued learning',
        relevance: 'Supports ongoing skill development',
        source: 'Training Department'
      }],
      nextSteps: [
        'Review session transcript',
        'Practice similar scenarios',
        'Schedule follow-up training'
      ]
    };
  }

  /**
   * Create fallback dimension analysis
   */
  private createFallbackDimensionAnalysis(
    allScores: ScoringMetrics[], 
    dimension: keyof ScoringMetrics
  ): DimensionAnalysis {
    const scores = allScores.map(score => score[dimension]);
    const averageScore = scores.length > 0 
      ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
      : 50;

    return {
      score: averageScore,
      trend: 'stable',
      strengths: ['Analysis unavailable'],
      weaknesses: ['Analysis unavailable'],
      specificExamples: {
        positive: ['Analysis unavailable'],
        negative: ['Analysis unavailable']
      },
      improvementOpportunities: ['Review training materials', 'Practice scenarios']
    };
  }
}

// Factory function for creating FeedbackGeneratorAgent instances
export const createFeedbackGeneratorAgent = (apiKey?: string, pineconeService?: PineconeService) => {
  return new FeedbackGeneratorAgent(apiKey, pineconeService);
};