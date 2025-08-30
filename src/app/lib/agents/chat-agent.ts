// Chat Agent for AI Training Simulator
// Provides conversational interface with access to user session history and analytics

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, AIMessage, BaseMessage } from "@langchain/core/messages";
import { CompletedSession, ScoringMetrics } from "../types";
import { AGENT_CONFIGS } from "../service-interfaces";
// import { sessionManager } from "../session-manager";

export interface ChatInput {
  userMessage: string;
  userId: string;
  conversationHistory?: BaseMessage[];
  context?:
    | "general"
    | "performance_review"
    | "training_advice"
    | "session_analysis";
}

export interface ChatOutput {
  response: string;
  suggestedActions?: string[];
  sessionReferences?: string[];
  performanceInsights?: PerformanceInsights;
}

export interface PerformanceInsights {
  totalSessions: number;
  averageScore: number;
  strongestSkill: string;
  improvementArea: string;
  recentTrend: "improving" | "declining" | "stable";
  recommendations: string[];
}

export interface UserSessionAnalytics {
  totalSessions: number;
  completedSessions: CompletedSession[];
  averageScores: ScoringMetrics;
  performanceTrends: {
    dimension: keyof ScoringMetrics;
    trend: "improving" | "declining" | "stable";
    change: number;
  }[];
  commonScenarios: { scenario: string; count: number; avgScore: number }[];
  recentActivity: {
    lastSessionDate?: Date;
    sessionsThisWeek: number;
    sessionsThisMonth: number;
  };
}

export class ChatAgent {
  private llm: ChatGoogleGenerativeAI;

  constructor(apiKey?: string) {
    const config = AGENT_CONFIGS.chatAgent;
    this.llm = new ChatGoogleGenerativeAI({
      model: config.model,
      apiKey: apiKey || process.env.GOOGLE_API_KEY!,
      temperature: config.temperature,
      maxOutputTokens: config.maxTokens,
    });
  }

  /**
   * Process user chat message and generate response
   */
  async chat(input: ChatInput): Promise<ChatOutput> {
    try {
      // Get user session analytics
      const analytics = await this.getUserAnalytics(input.userId);

      // Build conversation messages for the LLM
      const messages = await this.buildConversationMessages(input, analytics);

      // Generate response using conversation history
      const response = await this.llm.invoke(messages);
      const responseText = this.extractTextFromResponse(response);

      // Parse response and extract structured data
      const parsedOutput = this.parseResponse(responseText, analytics);

      return parsedOutput;
    } catch (error) {
      console.error("Chat agent error:", error);
      return {
        response:
          "I'm having trouble processing your message right now. Please try again in a moment.",
        suggestedActions: ["Try rephrasing your question", "Check back later"],
      };
    }
  }

  /**
   * Get comprehensive user analytics from session data
   */
  private async getUserAnalytics(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    userId: string
  ): Promise<UserSessionAnalytics> {
    const completedSessions: CompletedSession[] = [];

    if (completedSessions.length === 0) {
      return {
        totalSessions: 0,
        completedSessions: [],
        averageScores: {
          policy_adherence: 0,
          empathy_index: 0,
          completeness: 0,
          escalation_judgment: 0,
          time_efficiency: 0,
        },
        performanceTrends: [],
        commonScenarios: [],
        recentActivity: {
          sessionsThisWeek: 0,
          sessionsThisMonth: 0,
        },
      };
    }

    // Calculate average scores
    const averageScores = this.calculateAverageScores(completedSessions);

    // Calculate performance trends
    const performanceTrends =
      this.calculatePerformanceTrends(completedSessions);

    // Analyze common scenarios
    const commonScenarios = this.analyzeCommonScenarios(completedSessions);

    // Calculate recent activity
    const recentActivity = this.calculateRecentActivity(completedSessions);

    return {
      totalSessions: completedSessions.length,
      completedSessions,
      averageScores,
      performanceTrends,
      commonScenarios,
      recentActivity,
    };
  }

  /**
   * Calculate average scores across all sessions
   */
  private calculateAverageScores(sessions: CompletedSession[]): ScoringMetrics {
    if (sessions.length === 0) {
      return {
        policy_adherence: 0,
        empathy_index: 0,
        completeness: 0,
        escalation_judgment: 0,
        time_efficiency: 0,
      };
    }

    const totals = sessions.reduce(
      (acc, session) => ({
        policy_adherence:
          acc.policy_adherence + session.finalScores.policy_adherence,
        empathy_index: acc.empathy_index + session.finalScores.empathy_index,
        completeness: acc.completeness + session.finalScores.completeness,
        escalation_judgment:
          acc.escalation_judgment + session.finalScores.escalation_judgment,
        time_efficiency:
          acc.time_efficiency + session.finalScores.time_efficiency,
      }),
      {
        policy_adherence: 0,
        empathy_index: 0,
        completeness: 0,
        escalation_judgment: 0,
        time_efficiency: 0,
      }
    );

    return {
      policy_adherence: Math.round(totals.policy_adherence / sessions.length),
      empathy_index: Math.round(totals.empathy_index / sessions.length),
      completeness: Math.round(totals.completeness / sessions.length),
      escalation_judgment: Math.round(
        totals.escalation_judgment / sessions.length
      ),
      time_efficiency: Math.round(totals.time_efficiency / sessions.length),
    };
  }

  /**
   * Calculate performance trends for each dimension
   */
  private calculatePerformanceTrends(
    sessions: CompletedSession[]
  ): UserSessionAnalytics["performanceTrends"] {
    if (sessions.length < 3) return [];

    const dimensions: (keyof ScoringMetrics)[] = [
      "policy_adherence",
      "empathy_index",
      "completeness",
      "escalation_judgment",
      "time_efficiency",
    ];

    return dimensions.map((dimension) => {
      const scores = sessions.map((s) => s.finalScores[dimension]);
      const midpoint = Math.floor(scores.length / 2);

      const firstHalf = scores.slice(0, midpoint);
      const secondHalf = scores.slice(midpoint);

      const firstAvg =
        firstHalf.reduce((sum, score) => sum + score, 0) / firstHalf.length;
      const secondAvg =
        secondHalf.reduce((sum, score) => sum + score, 0) / secondHalf.length;

      const change = secondAvg - firstAvg;
      let trend: "improving" | "declining" | "stable" = "stable";

      if (change > 5) trend = "improving";
      else if (change < -5) trend = "declining";

      return { dimension, trend, change: Math.round(change) };
    });
  }

  /**
   * Analyze common scenarios and performance
   */
  private analyzeCommonScenarios(
    sessions: CompletedSession[]
  ): { scenario: string; count: number; avgScore: number }[] {
    const scenarioMap = new Map<
      string,
      { count: number; totalScore: number }
    >();

    sessions.forEach((session) => {
      const scenarioTitle = session.scenario.title;
      const overallScore = this.calculateOverallScore(session.finalScores);

      if (scenarioMap.has(scenarioTitle)) {
        const existing = scenarioMap.get(scenarioTitle)!;
        existing.count++;
        existing.totalScore += overallScore;
      } else {
        scenarioMap.set(scenarioTitle, { count: 1, totalScore: overallScore });
      }
    });

    return Array.from(scenarioMap.entries())
      .map(([scenario, data]) => ({
        scenario,
        count: data.count,
        avgScore: Math.round(data.totalScore / data.count),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  /**
   * Calculate recent activity metrics
   */
  private calculateRecentActivity(
    sessions: CompletedSession[]
  ): UserSessionAnalytics["recentActivity"] {
    if (sessions.length === 0) {
      return { sessionsThisWeek: 0, sessionsThisMonth: 0 };
    }

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const sessionsThisWeek = sessions.filter(
      (s) => s.completedAt >= oneWeekAgo
    ).length;
    const sessionsThisMonth = sessions.filter(
      (s) => s.completedAt >= oneMonthAgo
    ).length;

    const lastSession = sessions.sort(
      (a, b) => b.completedAt.getTime() - a.completedAt.getTime()
    )[0];

    return {
      lastSessionDate: lastSession?.completedAt,
      sessionsThisWeek,
      sessionsThisMonth,
    };
  }

  /**
   * Calculate overall score from individual metrics
   */
  private calculateOverallScore(scores: ScoringMetrics): number {
    const weights = {
      policy_adherence: 0.25,
      empathy_index: 0.2,
      completeness: 0.25,
      escalation_judgment: 0.15,
      time_efficiency: 0.15,
    };

    return Math.round(
      scores.policy_adherence * weights.policy_adherence +
        scores.empathy_index * weights.empathy_index +
        scores.completeness * weights.completeness +
        scores.escalation_judgment * weights.escalation_judgment +
        scores.time_efficiency * weights.time_efficiency
    );
  }

  /**
   * Build conversation messages for the LLM including system prompt and history
   */
  private async buildConversationMessages(
    input: ChatInput,
    analytics: UserSessionAnalytics
  ): Promise<BaseMessage[]> {
    const { userMessage, context, conversationHistory } = input;
    const messages: BaseMessage[] = [];

    // Build analytics summary
    const analyticsContext = this.buildAnalyticsContext(analytics);
    const contextualInfo = this.getContextualInfo(
      context,
      analytics,
      conversationHistory
    );
    const isFirstMessage =
      !conversationHistory || conversationHistory.length === 0;

    // System prompt
    const systemPrompt = `You're Maya, the friendly training coach for Freedomvas. You've helped hundreds of virtual assistants improve their STR communication skills through realistic scenario training.

Your personality:
- Warm and encouraging like a supportive colleague
- Uses contractions ("you're", "let's", "I'm") naturally
- Speaks conversationally with natural rhythm
- Varies sentence length and structure
- Shows authentic enthusiasm for trainee progress
- Never sounds robotic or technical
- Maintains conversation flow by referencing previous messages naturally

CURRENT USER CONTEXT:
${analyticsContext}

CONVERSATION GUIDANCE:
${contextualInfo}

When responding:
${
  isFirstMessage
    ? `- Start with a natural greeting that matches the time of day
- Reference their training status naturally without technical terms`
    : `- Continue the conversation naturally, referencing what was discussed before
- Build on previous topics and maintain conversational flow`
}
- Use phrases like "I noticed..." instead of "According to your session data..."
- Include occasional empathetic phrases ("That can be tricky!")
- Keep responses conversational and engaging
- End with an open question or clear next step when appropriate

NEVER say:
- "I will await your message"
- "According to your session data"
- "Based on the provided context variables"
- "Let me process your request"
- Repeat information already covered in the conversation

Your goal is to make the trainee forget they're talking to AI - you're their supportive training partner who remembers your conversations.`;

    // Add system message
    messages.push(new AIMessage(systemPrompt));

    // Add conversation history (limit to last 10 messages to avoid token limits)
    if (conversationHistory && conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-10);
      messages.push(...recentHistory);
    }

    // Add current user message
    messages.push(new HumanMessage(userMessage));

    return messages;
  }

  /**
   * Get contextual information based on conversation stage and user context
   */
  private getContextualInfo(
    context: string | undefined,
    analytics: UserSessionAnalytics,
    conversationHistory?: BaseMessage[]
  ): string {
    const isFirstMessage =
      !conversationHistory || conversationHistory.length === 0;

    if (isFirstMessage) {
      if (analytics.totalSessions === 0) {
        return "This is a new user who hasn't completed any training sessions yet. Be welcoming and explain how the training works.";
      } else if (analytics.recentActivity.lastSessionDate) {
        const daysSinceLastSession = Math.floor(
          (new Date().getTime() -
            analytics.recentActivity.lastSessionDate.getTime()) /
            (1000 * 60 * 60 * 24)
        );
        if (daysSinceLastSession === 0) {
          return "User completed a training session today. They might want feedback or be ready for another session.";
        } else if (daysSinceLastSession <= 7) {
          return `User last trained ${daysSinceLastSession} days ago. They're actively engaged in training.`;
        } else {
          return `User hasn't trained in ${daysSinceLastSession} days. Encourage them to get back into practice.`;
        }
      }
    }

    // For continuing conversations, provide context based on the specific request type
    switch (context) {
      case "performance_review":
        return "User is asking about their performance. Focus on specific feedback and actionable improvements.";
      case "training_advice":
        return "User wants training advice. Provide specific, practical suggestions for skill improvement.";
      case "session_analysis":
        return "User wants to analyze a specific session. Be detailed and constructive in your analysis.";
      default:
        return "Continue the natural conversation flow, being helpful and supportive.";
    }
  }

  /**
   * Build analytics context for the prompt
   */
  private buildAnalyticsContext(analytics: UserSessionAnalytics): string {
    if (analytics.totalSessions === 0) {
      return "New user - no training sessions completed yet.";
    }

    const overallAvg = this.calculateOverallScore(analytics.averageScores);
    const strongestSkill = this.getStrongestSkill(analytics.averageScores);
    const weakestSkill = this.getWeakestSkill(analytics.averageScores);

    let context = `Total Sessions: ${analytics.totalSessions}
Overall Average Score: ${overallAvg}/100
Strongest Skill: ${strongestSkill.skill} (${strongestSkill.score}/100)
Area for Improvement: ${weakestSkill.skill} (${weakestSkill.score}/100)`;

    if (analytics.recentActivity.lastSessionDate) {
      const daysSinceLastSession = Math.floor(
        (new Date().getTime() -
          analytics.recentActivity.lastSessionDate.getTime()) /
          (1000 * 60 * 60 * 24)
      );
      context += `\nLast Session: ${daysSinceLastSession} days ago`;
    }

    context += `\nSessions This Week: ${analytics.recentActivity.sessionsThisWeek}
Sessions This Month: ${analytics.recentActivity.sessionsThisMonth}`;

    if (analytics.performanceTrends.length > 0) {
      const improvingSkills = analytics.performanceTrends.filter(
        (t) => t.trend === "improving"
      );
      const decliningSkills = analytics.performanceTrends.filter(
        (t) => t.trend === "declining"
      );

      if (improvingSkills.length > 0) {
        context += `\nImproving Skills: ${improvingSkills
          .map((s) => s.dimension)
          .join(", ")}`;
      }
      if (decliningSkills.length > 0) {
        context += `\nNeeds Attention: ${decliningSkills
          .map((s) => s.dimension)
          .join(", ")}`;
      }
    }

    if (analytics.commonScenarios.length > 0) {
      const topScenario = analytics.commonScenarios[0];
      context += `\nMost Practiced Scenario: ${topScenario.scenario} (${topScenario.count} times, avg: ${topScenario.avgScore}/100)`;
    }

    return context;
  }

  /**
   * Get strongest skill from scores
   */
  private getStrongestSkill(scores: ScoringMetrics): {
    skill: string;
    score: number;
  } {
    const skills = [
      { skill: "Policy Adherence", score: scores.policy_adherence },
      { skill: "Empathy", score: scores.empathy_index },
      { skill: "Completeness", score: scores.completeness },
      { skill: "Escalation Judgment", score: scores.escalation_judgment },
      { skill: "Time Efficiency", score: scores.time_efficiency },
    ];

    return skills.reduce((max, current) =>
      current.score > max.score ? current : max
    );
  }

  /**
   * Get weakest skill from scores
   */
  private getWeakestSkill(scores: ScoringMetrics): {
    skill: string;
    score: number;
  } {
    const skills = [
      { skill: "Policy Adherence", score: scores.policy_adherence },
      { skill: "Empathy", score: scores.empathy_index },
      { skill: "Completeness", score: scores.completeness },
      { skill: "Escalation Judgment", score: scores.escalation_judgment },
      { skill: "Time Efficiency", score: scores.time_efficiency },
    ];

    return skills.reduce((min, current) =>
      current.score < min.score ? current : min
    );
  }

  /**
   * Parse response and extract structured data
   */
  private parseResponse(
    responseText: string,
    analytics: UserSessionAnalytics
  ): ChatOutput {
    // Extract suggested actions if present
    const suggestedActions: string[] = [];
    const actionMatches = responseText.match(
      /(?:try|consider|you could|i suggest|recommendation):?\s*([^.!?]+)/gi
    );
    if (actionMatches) {
      actionMatches.slice(0, 3).forEach((match) => {
        const action = match
          .replace(
            /^(?:try|consider|you could|i suggest|recommendation):?\s*/i,
            ""
          )
          .trim();
        if (action.length > 10) {
          suggestedActions.push(action);
        }
      });
    }

    // Generate performance insights if relevant
    let performanceInsights: PerformanceInsights | undefined;
    if (analytics.totalSessions > 0) {
      const overallScore = this.calculateOverallScore(analytics.averageScores);
      const strongestSkill = this.getStrongestSkill(analytics.averageScores);
      const weakestSkill = this.getWeakestSkill(analytics.averageScores);

      // Determine overall trend
      const improvingCount = analytics.performanceTrends.filter(
        (t) => t.trend === "improving"
      ).length;
      const decliningCount = analytics.performanceTrends.filter(
        (t) => t.trend === "declining"
      ).length;
      let recentTrend: "improving" | "declining" | "stable" = "stable";
      if (improvingCount > decliningCount) recentTrend = "improving";
      else if (decliningCount > improvingCount) recentTrend = "declining";

      performanceInsights = {
        totalSessions: analytics.totalSessions,
        averageScore: overallScore,
        strongestSkill: strongestSkill.skill,
        improvementArea: weakestSkill.skill,
        recentTrend,
        recommendations: this.generateRecommendations(analytics),
      };
    }

    return {
      response: responseText,
      suggestedActions:
        suggestedActions.length > 0 ? suggestedActions : undefined,
      performanceInsights,
    };
  }

  /**
   * Generate personalized recommendations
   */
  private generateRecommendations(analytics: UserSessionAnalytics): string[] {
    const recommendations: string[] = [];

    if (analytics.totalSessions < 5) {
      recommendations.push(
        "Complete more training sessions to build consistency"
      );
    }

    const weakestSkill = this.getWeakestSkill(analytics.averageScores);
    if (weakestSkill.score < 70) {
      recommendations.push(
        `Focus on improving ${weakestSkill.skill.toLowerCase()} skills`
      );
    }

    if (analytics.recentActivity.sessionsThisWeek === 0) {
      recommendations.push(
        "Try to practice at least once this week to maintain momentum"
      );
    }

    const decliningSkills = analytics.performanceTrends.filter(
      (t) => t.trend === "declining"
    );
    if (decliningSkills.length > 0) {
      recommendations.push(
        `Review fundamentals for ${decliningSkills[0].dimension.replace(
          "_",
          " "
        )}`
      );
    }

    if (analytics.commonScenarios.length > 0) {
      const lowPerformingScenario = analytics.commonScenarios.find(
        (s) => s.avgScore < 70
      );
      if (lowPerformingScenario) {
        recommendations.push(
          `Practice more ${lowPerformingScenario.scenario.toLowerCase()} scenarios`
        );
      }
    }

    return recommendations.slice(0, 3);
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
        .map((part) => {
          if (typeof part === 'string') return part;
          if (typeof part === 'object' && part && 'text' in part && typeof part.text === 'string') {
            return part.text;
          }
          return '';
        })
        .join(" ")
        .trim();
    }

    return "";
  }

  /**
   * Get session details for reference
   */
  async getSessionDetails(sessionId: string): Promise<CompletedSession | null> {
    // TODO: Implement session retrieval from database
    console.log(`Getting session details for: ${sessionId}`);
    return null;
  }

  /**
   * Generate session comparison
   */
  async compareRecentSessions(
    userId: string,
    sessionCount: number = 3
  ): Promise<string> {
    // TODO: Implement session retrieval from database
    console.log(
      `Comparing recent sessions for user: ${userId}, count: ${sessionCount}`
    );

    const sessions: CompletedSession[] = [];
    const recentSessions = sessions
      .sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime())
      .slice(0, sessionCount);

    if (recentSessions.length < 2) {
      return "Not enough sessions to compare. Complete more training sessions to see progress trends.";
    }

    let comparison = `Comparison of your last ${recentSessions.length} sessions:\n\n`;

    recentSessions.forEach((session, index) => {
      const overallScore = this.calculateOverallScore(session.finalScores);
      const daysAgo = Math.floor(
        (new Date().getTime() - session.completedAt.getTime()) /
          (1000 * 60 * 60 * 24)
      );

      comparison += `${index + 1}. ${
        session.scenario.title
      } (${daysAgo} days ago)\n`;
      comparison += `   Overall Score: ${overallScore}/100\n`;
      comparison += `   Duration: ${Math.round(
        session.duration / 60000
      )} minutes\n\n`;
    });

    return comparison;
  }
}

// Factory function for creating ChatAgent instances
export const createChatAgent = (apiKey?: string) => {
  return new ChatAgent(apiKey);
};
