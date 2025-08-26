// Chat API endpoint for conversational interface
// Provides access to user session data and general conversation

import { NextRequest, NextResponse } from 'next/server';
import { createChatAgent, ChatInput } from '@/app/lib/agents/chat-agent';
import { BaseMessage, HumanMessage, AIMessage } from '@langchain/core/messages';

interface ChatRequest {
  message: string;
  userId?: string;
  context?: 'general' | 'performance_review' | 'training_advice' | 'session_analysis';
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
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
    recentTrend: 'improving' | 'declining' | 'stable';
    recommendations: string[];
  };
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<ChatResponse>> {
  try {
    const body: ChatRequest = await request.json();

    // Validate required fields
    if (!body.message || typeof body.message !== 'string') {
      return NextResponse.json(
        { 
          response: "Please provide a valid message.",
          error: "Invalid message format" 
        },
        { status: 400 }
      );
    }

    // Convert conversation history to BaseMessage format
    const conversationHistory: BaseMessage[] = body.conversationHistory?.map(msg => {
      if (msg.role === 'user') {
        return new HumanMessage(msg.content);
      } else {
        return new AIMessage(msg.content);
      }
    }) || [];

    // Prepare chat input
    const chatInput: ChatInput = {
      userMessage: body.message.trim(),
      userId: body.userId || 'anonymous',
      conversationHistory,
      context: body.context || 'general'
    };

    // Create chat agent and process message
    const chatAgent = createChatAgent();
    const result = await chatAgent.chat(chatInput);

    // Return successful response
    return NextResponse.json({
      response: result.response,
      suggestedActions: result.suggestedActions,
      sessionReferences: result.sessionReferences,
      performanceInsights: result.performanceInsights
    });

  } catch (error) {
    console.error('Chat API error:', error);
    
    return NextResponse.json(
      {
        response: "I'm having trouble processing your message right now. Please try again in a moment.",
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

// GET endpoint for retrieving user analytics
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter is required' },
        { status: 400 }
      );
    }

    const chatAgent = createChatAgent();

    switch (action) {
      case 'analytics': {
        // Get user analytics without generating a chat response
        const analytics = await (chatAgent as any).getUserAnalytics(userId);
        return NextResponse.json({ analytics });
      }

      case 'compare-sessions': {
        const sessionCount = parseInt(searchParams.get('count') || '3');
        const comparison = await chatAgent.compareRecentSessions(userId, sessionCount);
        return NextResponse.json({ comparison });
      }

      case 'session-details': {
        const sessionId = searchParams.get('sessionId');
        if (!sessionId) {
          return NextResponse.json(
            { error: 'sessionId parameter is required for session-details action' },
            { status: 400 }
          );
        }
        const sessionDetails = await chatAgent.getSessionDetails(sessionId);
        return NextResponse.json({ sessionDetails });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: analytics, compare-sessions, session-details' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Chat API GET error:', error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}