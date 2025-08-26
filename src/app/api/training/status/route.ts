// GET /api/training/status - Session state retrieval endpoint
import { NextRequest, NextResponse } from "next/server";
import { sessionManager } from "../../../lib/session-manager";

// Force Node runtime for consistency
export const runtime = "nodejs";

interface StatusResponse {
  sessionId: string;
  sessionStatus: 'creating' | 'active' | 'complete';
  scenario?: {
    title: string;
    description: string;
    required_steps: string[];
  };
  persona?: {
    name: string;
    background: string;
    communication_style: string;
  };
  progress: {
    currentTurn: number;
    completedSteps: string[];
    requiredSteps: string[];
    completionPercentage: number;
  };
  scores?: {
    policy_adherence: number;
    empathy_index: number;
    completeness: number;
    escalation_judgment: number;
    time_efficiency: number;
    overall: number;
  };
  sessionDuration: number; // in milliseconds
  lastActivity: string; // ISO timestamp
  criticalErrors: string[];
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    // Validate required parameters
    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId query parameter is required" },
        { status: 400 }
      );
    }

    // Get the current session
    const currentState = await sessionManager.getSession(sessionId);
    if (!currentState) {
      // Check if it's a completed session
      const completedSession = await sessionManager.getCompletedSession(sessionId);
      if (completedSession) {
        const response: StatusResponse = {
          sessionId,
          sessionStatus: 'complete',
          scenario: {
            title: completedSession.scenario.title,
            description: completedSession.scenario.description,
            required_steps: completedSession.scenario.required_steps
          },
          persona: {
            name: completedSession.persona.name,
            background: completedSession.persona.background,
            communication_style: completedSession.persona.communication_style
          },
          progress: {
            currentTurn: completedSession.transcript.length,
            completedSteps: completedSession.scenario.required_steps, // Assume all completed
            requiredSteps: completedSession.scenario.required_steps,
            completionPercentage: 100
          },
          scores: {
            policy_adherence: completedSession.finalScores.policy_adherence,
            empathy_index: completedSession.finalScores.empathy_index,
            completeness: completedSession.finalScores.completeness,
            escalation_judgment: completedSession.finalScores.escalation_judgment,
            time_efficiency: completedSession.finalScores.time_efficiency,
            overall: Math.round(
              (completedSession.finalScores.policy_adherence +
               completedSession.finalScores.empathy_index +
               completedSession.finalScores.completeness +
               completedSession.finalScores.escalation_judgment +
               completedSession.finalScores.time_efficiency) / 5
            )
          },
          sessionDuration: completedSession.duration,
          lastActivity: completedSession.completedAt.toISOString(),
          criticalErrors: [] // Not stored in completed sessions currently
        };

        return NextResponse.json(response, { status: 200 });
      }

      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // Get session metadata from session manager
    const sessionStore = (sessionManager as any).activeSessions;
    const sessionMetadata = sessionStore[sessionId];
    
    if (!sessionMetadata) {
      return NextResponse.json(
        { error: "Session metadata not found" },
        { status: 404 }
      );
    }

    // Calculate session duration
    const sessionDuration = Date.now() - sessionMetadata.startTime.getTime();

    // Calculate completion percentage
    const completionPercentage = currentState.requiredSteps.length > 0 ? 
      Math.round((currentState.completedSteps.length / currentState.requiredSteps.length) * 100) : 0;

    // Prepare response
    const response: StatusResponse = {
      sessionId,
      sessionStatus: currentState.sessionStatus,
      progress: {
        currentTurn: currentState.turnCount || 0,
        completedSteps: currentState.completedSteps || [],
        requiredSteps: currentState.requiredSteps || [],
        completionPercentage
      },
      sessionDuration,
      lastActivity: sessionMetadata.lastActivity.toISOString(),
      criticalErrors: currentState.criticalErrors || []
    };

    // Include scenario and persona if available
    if (currentState.scenario) {
      response.scenario = {
        title: currentState.scenario.title,
        description: currentState.scenario.description,
        required_steps: currentState.scenario.required_steps
      };
    }

    if (currentState.persona) {
      response.persona = {
        name: currentState.persona.name,
        background: currentState.persona.background,
        communication_style: currentState.persona.communication_style
      };
    }

    // Include scores if available
    if (currentState.scores) {
      response.scores = {
        policy_adherence: currentState.scores.policy_adherence,
        empathy_index: currentState.scores.empathy_index,
        completeness: currentState.scores.completeness,
        escalation_judgment: currentState.scores.escalation_judgment,
        time_efficiency: currentState.scores.time_efficiency,
        overall: Math.round(
          (currentState.scores.policy_adherence +
           currentState.scores.empathy_index +
           currentState.scores.completeness +
           currentState.scores.escalation_judgment +
           currentState.scores.time_efficiency) / 5
        )
      };
    }

    return NextResponse.json(response, { status: 200 });

  } catch (error: any) {
    console.error('Training session status error:', error);
    
    return NextResponse.json(
      { error: "Failed to retrieve session status" },
      { status: 500 }
    );
  }
}