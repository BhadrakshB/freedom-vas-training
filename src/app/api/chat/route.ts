// Chat API endpoint for conversational interface
// Provides access to user session data and general conversation

import { NextRequest, NextResponse } from "next/server";
import { createChatAgent, ChatInput } from "@/app/lib/agents/chat-agent";
import { BaseMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { TrainingError, ERROR_MESSAGES } from "@/app/lib/error-handling";

interface ChatRequest {
  message: string;
  userId?: string;
  context?:
    | "general"
    | "performance_review"
    | "training_advice"
    | "session_analysis";
  conversationHistory?: Array<{
    role: "user" | "assistant";
    content: string;
    timestamp?: string;
  }>;
}

interface ChatResponse {
  response: string;
  suggestedActions?: string[];
  sessionReferences?: string[];
  performanceInsights?: {
    totalSessions: number;
    averageScore: number;
    strongestSkill: string;
    improvementArea: string;
    recentTrend: "improving" | "declining" | "stable";
    recommendations: string[];
  };
  error?: string;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ChatResponse>> {
  try {
    const body: ChatRequest = await request.json();

    // Validate required fields
    if (!body.message || typeof body.message !== "string") {
      throw new TrainingError(
        ERROR_MESSAGES.VALIDATION_ERROR,
        'validation',
        'medium',
        'INVALID_MESSAGE_FORMAT'
      );
    }

    // Validate conversation history format if provided
    if (body.conversationHistory && !Array.isArray(body.conversationHistory)) {
      throw new TrainingError(
        "Conversation history must be an array",
        'validation',
        'medium',
        'INVALID_CONVERSATION_HISTORY'
      );
    }

    // Validate each message in conversation history
    if (body.conversationHistory) {
      for (const msg of body.conversationHistory) {
        if (!msg.role || !msg.content || !['user', 'assistant'].includes(msg.role)) {
          throw new TrainingError(
            "Invalid conversation history format. Each message must have 'role' (user|assistant) and 'content'",
            'validation',
            'medium',
            'INVALID_MESSAGE_FORMAT'
          );
        }
      }
    }

    // Convert conversation history to BaseMessage format
    const conversationHistory: BaseMessage[] =
      body.conversationHistory?.map((msg) => {
        if (msg.role === "user") {
          return new HumanMessage(msg.content);
        } else {
          return new AIMessage(msg.content);
        }
      }) || [];

    // Log conversation context for debugging
    console.log(`Chat request - User: ${body.userId}, Context: ${body.context}, History length: ${conversationHistory.length}`);

    // Prepare chat input
    const chatInput: ChatInput = {
      userMessage: body.message.trim(),
      userId: body.userId || "anonymous",
      conversationHistory,
      context: body.context || "general",
    };

    // Create chat agent and process message
    const chatAgent = createChatAgent();
    const result = await chatAgent.chat(chatInput);

    // Return successful response
    return NextResponse.json({
      response: result.response,
      suggestedActions: result.suggestedActions,
      sessionReferences: result.sessionReferences,
      performanceInsights: result.performanceInsights,
    });
  } catch (error) {
    console.error("Chat API error:", error);

    if (error instanceof TrainingError) {
      const statusCode = error.type === 'validation' ? 400 : 500;
      return NextResponse.json(
        {
          response: ERROR_MESSAGES.CHAT_ERROR,
          error: error.message,
          errorType: error.type,
          errorCode: error.code,
        },
        { status: statusCode }
      );
    }

    return NextResponse.json(
      {
        response: ERROR_MESSAGES.CHAT_ERROR,
        error: error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR,
        errorType: 'unknown',
      },
      { status: 500 }
    );
  }
}

// GET endpoint for retrieving user analytics
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    let action = searchParams.get("action");

    if (!action) {
      action = "analytics";
    }

    if (!userId) {
      throw new TrainingError(
        "User ID is required for analytics",
        'validation',
        'medium',
        'MISSING_USER_ID'
      );
    }

    const chatAgent = createChatAgent();

    switch (action) {
      case "analytics": {
        // Get user analytics without generating a chat response
        const analytics = await (chatAgent as unknown as { getUserAnalytics: (userId: string) => Promise<unknown> }).getUserAnalytics(userId);
        return NextResponse.json({ analytics });
      }

      case "compare-sessions": {
        const sessionCount = parseInt(searchParams.get("count") || "3");
        const comparison = await chatAgent.compareRecentSessions(
          userId,
          sessionCount
        );
        return NextResponse.json({ comparison });
      }

      case "session-details": {
        const sessionId = searchParams.get("sessionId");
        if (!sessionId) {
          throw new TrainingError(
            "Session ID is required for session details",
            'validation',
            'medium',
            'MISSING_SESSION_ID'
          );
        }
        const sessionDetails = await chatAgent.getSessionDetails(sessionId);
        return NextResponse.json({ sessionDetails });
      }

      default:
        throw new TrainingError(
          "Invalid action. Supported actions: analytics, compare-sessions, session-details",
          'validation',
          'medium',
          'INVALID_ACTION'
        );
    }
  } catch (error) {
    console.error("Chat API GET error:", error);

    if (error instanceof TrainingError) {
      const statusCode = error.type === 'validation' ? 400 : 500;
      return NextResponse.json(
        {
          error: error.message,
          errorType: error.type,
          errorCode: error.code,
        },
        { status: statusCode }
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR,
        errorType: 'unknown',
      },
      { status: 500 }
    );
  }
}
