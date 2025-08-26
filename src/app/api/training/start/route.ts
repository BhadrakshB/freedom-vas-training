import { getSession, saveSession } from "@/app/lib/session-manager";
import { createTrainingWorkflow, initializeState } from "../../../lib/graph";
import { NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const { trainingObjective, difficultyLevel, sessionId, userMessage } = await req.json();
    
    // Get existing session state from storage or initialize new
    let state;
    if (sessionId) {
      // In a real implementation, retrieve from database
      // For demo, we'll use a simple in-memory store
      const sessionData = await getSession(sessionId);
      if (!sessionData) {
        return NextResponse.json(
          { error: "Session not found" },
          { status: 404 }
        );
      }
      state = sessionData.state;
      
      // Add user message to state if provided
      if (userMessage) {
        state.messages.push({ role: "user", content: userMessage });
      }
    } else {
      // Initialize new session
      state = initializeState(trainingObjective, difficultyLevel);
    }
    
    // Initialize the workflow
    const workflow = createTrainingWorkflow();
    
    // Process the workflow
    let currentState = state;
    let finalState;
    let sessionComplete = false;
    
    // Process until we get a guest response or session completes
    while (true) {
      finalState = await workflow.invoke(currentState);
      
      // If we're in guest simulator phase and have a response
      if (currentState === "guest_simulator" && 
          finalState.messages.length > currentState.messages.length) {
        break;
      }
      
      // If session is complete
      if (finalState.verdict_ready || finalState.next === "feedback_generator") {
        sessionComplete = true;
        break;
      }
      
      currentState = finalState;
    }
    
    // Save session state
    const responseSessionId = sessionId || finalState.sessionId;
    await saveSession(responseSessionId, finalState);
    
    // Prepare response
    const response = {
      sessionId: responseSessionId,
      message: sessionComplete ? null : finalState.messages[finalState.messages.length - 1].content,
      isSessionComplete: sessionComplete,
      feedback: sessionComplete ? finalState.messages[finalState.messages.length - 1].content : null,
      scores: sessionComplete ? finalState.scores : null
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { error: "Failed to process training session" },
      { status: 500 }
    );
  }
}

