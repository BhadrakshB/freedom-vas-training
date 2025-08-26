// POST /api/training/respond - User response handling during sessions
import { NextRequest, NextResponse } from "next/server";
import { sessionManager } from "../../../lib/session-manager";
import { createTrainingSimulatorGraph } from "../../../lib/training-simulator-graph";
import { PineconeService } from "../../../lib/pinecone-service";

// Force Node runtime for LangGraph compatibility
export const runtime = "nodejs";

interface RespondRequest {
  sessionId: string;
  userResponse: string;
}

interface RespondResponse {
  sessionId: string;
  guestResponse?: string;
  sessionStatus: 'active' | 'complete';
  currentTurn: number;
  feedback?: {
    overallScore: number;
    summary: string;
    recommendations: string[];
  };
  error?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: RespondRequest = await req.json();

    // Validate required fields
    if (!body.sessionId || typeof body.sessionId !== 'string') {
      return NextResponse.json(
        { error: "sessionId is required and must be a string" },
        { status: 400 }
      );
    }

    if (!body.userResponse || typeof body.userResponse !== 'string') {
      return NextResponse.json(
        { error: "userResponse is required and must be a string" },
        { status: 400 }
      );
    }

    // Validate user response length
    if (body.userResponse.trim().length === 0) {
      return NextResponse.json(
        { error: "userResponse cannot be empty" },
        { status: 400 }
      );
    }

    if (body.userResponse.length > 2000) {
      return NextResponse.json(
        { error: "userResponse is too long (maximum 2000 characters)" },
        { status: 400 }
      );
    }

    // Get the current session
    const currentState = await sessionManager.getSession(body.sessionId);
    if (!currentState) {
      return NextResponse.json(
        { error: "Session not found or expired" },
        { status: 404 }
      );
    }

    // Check if session is in a valid state for responses
    if (currentState.sessionStatus === 'complete') {
      return NextResponse.json(
        { error: "Session is already complete" },
        { status: 400 }
      );
    }

    if (currentState.sessionStatus === 'creating') {
      return NextResponse.json(
        { error: "Session is still being created. Please wait." },
        { status: 400 }
      );
    }

    // Initialize Pinecone service
    const pineconeService = new PineconeService({
      apiKey: process.env.PINECONE_API_KEY || '',
      indexName: process.env.PINECONE_INDEX_NAME || 'training-simulator',
      environment: process.env.PINECONE_ENVIRONMENT || 'us-east-1-aws'
    });

    // Create training simulator graph
    const trainingGraph = createTrainingSimulatorGraph({
      pineconeService,
      apiKey: process.env.GEMINI_API_KEY
    });

    // Continue the session with user input
    const result = await trainingGraph.continueSession(currentState, body.userResponse);

    // Update session with new state
    await sessionManager.updateSession(body.sessionId, result);

    // Extract the guest response (last AI message)
    const lastMessage = result.messages[result.messages.length - 1];
    const guestResponse = lastMessage?._getType() === 'ai' ? 
      (typeof lastMessage.content === 'string' ? lastMessage.content : String(lastMessage.content)) : 
      undefined;

    // Prepare response
    const response: RespondResponse = {
      sessionId: body.sessionId,
      sessionStatus: result.sessionStatus,
      currentTurn: result.turnCount || 0
    };

    // If session is complete, extract feedback
    if (result.sessionStatus === 'complete') {
      // Complete the session in session manager
      const completedSession = await sessionManager.completeSession(body.sessionId);
      
      // Parse feedback from the last message if it contains feedback
      if (guestResponse && guestResponse.includes('Training Session Complete')) {
        response.feedback = {
          overallScore: result.scores ? Math.round(
            (result.scores.policy_adherence + 
             result.scores.empathy_index + 
             result.scores.completeness + 
             result.scores.escalation_judgment + 
             result.scores.time_efficiency) / 5
          ) : 0,
          summary: "Training session completed successfully.",
          recommendations: ["Review the feedback provided", "Practice identified areas for improvement"]
        };
      }
    } else {
      // Session is still active, include guest response
      response.guestResponse = guestResponse;
    }

    return NextResponse.json(response, { status: 200 });

  } catch (error: any) {
    console.error('Training session respond error:', error);
    
    // Handle specific error types
    if (error.message?.includes('Session') && error.message?.includes('not found')) {
      return NextResponse.json(
        { error: "Session not found or expired" },
        { status: 404 }
      );
    }

    if (error.message?.includes('Pinecone')) {
      return NextResponse.json(
        { error: "Knowledge base temporarily unavailable" },
        { status: 503 }
      );
    }

    if (error.message?.includes('Gemini') || error.message?.includes('API')) {
      return NextResponse.json(
        { error: "AI service temporarily unavailable" },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Failed to process response. Please try again." },
      { status: 500 }
    );
  }
}