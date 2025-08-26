// POST /api/training/start - Session initiation endpoint
import { NextRequest, NextResponse } from "next/server";
import { sessionManager } from "../../../lib/session-manager";
import { createTrainingSimulatorGraph } from "../../../lib/training-simulator-graph";
import { PineconeService } from "../../../lib/pinecone-service";

// Force Node runtime for LangGraph compatibility
export const runtime = "nodejs";

interface StartSessionRequest {
  trainingObjective: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  category?: 'booking' | 'complaint' | 'overbooking' | 'general';
  userId?: string;
}

interface StartSessionResponse {
  sessionId: string;
  scenario: {
    title: string;
    description: string;
    required_steps: string[];
  };
  persona: {
    name: string;
    background: string;
    communication_style: string;
  };
  status: 'ready';
  message: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: StartSessionRequest = await req.json();

    // Validate required fields
    if (!body.trainingObjective || typeof body.trainingObjective !== 'string') {
      return NextResponse.json(
        { error: "trainingObjective is required and must be a string" },
        { status: 400 }
      );
    }

    // Validate optional fields
    const validDifficulties = ['beginner', 'intermediate', 'advanced'];
    if (body.difficulty && !validDifficulties.includes(body.difficulty)) {
      return NextResponse.json(
        { error: "difficulty must be one of: beginner, intermediate, advanced" },
        { status: 400 }
      );
    }

    const validCategories = ['booking', 'complaint', 'overbooking', 'general'];
    if (body.category && !validCategories.includes(body.category)) {
      return NextResponse.json(
        { error: "category must be one of: booking, complaint, overbooking, general" },
        { status: 400 }
      );
    }

    // Create a new session
    const sessionId = await sessionManager.createSession(body.userId || 'anonymous');

    // Initialize Pinecone service (in production, this would be configured properly)
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

    // Start the training session
    const sessionInput = {
      trainingObjective: body.trainingObjective,
      difficulty: body.difficulty || 'beginner',
      category: body.category || 'general',
      userId: body.userId
    };

    const result = await trainingGraph.startSession(sessionInput);

    // Update session with the initial state
    await sessionManager.updateSession(sessionId, result);

    // Extract scenario and persona for response
    const scenario = result.scenario;
    const persona = result.persona;

    if (!scenario || !persona) {
      return NextResponse.json(
        { error: "Failed to create scenario and persona" },
        { status: 500 }
      );
    }

    const response: StartSessionResponse = {
      sessionId,
      scenario: {
        title: scenario.title,
        description: scenario.description,
        required_steps: scenario.required_steps
      },
      persona: {
        name: persona.name,
        background: persona.background,
        communication_style: persona.communication_style
      },
      status: 'ready',
      message: `Training session started. You will be interacting with ${persona.name}. ${scenario.description}`
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error: any) {
    console.error('Training session start error:', error);
    
    // Handle specific error types
    if (error.message?.includes('Pinecone')) {
      return NextResponse.json(
        { error: "Knowledge base temporarily unavailable. Please try again later." },
        { status: 503 }
      );
    }

    if (error.message?.includes('Gemini') || error.message?.includes('API')) {
      return NextResponse.json(
        { error: "AI service temporarily unavailable. Please try again later." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Failed to start training session. Please try again." },
      { status: 500 }
    );
  }
}