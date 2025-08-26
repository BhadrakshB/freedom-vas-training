// In production, replace with database implementation
const sessionStore = new Map();

export async function createSession(initialState: any) {
  const sessionId = crypto.randomUUID();
  sessionStore.set(sessionId, {
    state: initialState,
    updatedAt: new Date()
  });
  return sessionId;
}

export async function saveSession(sessionId: string, state: any) {
  sessionStore.set(sessionId, {
    state,
    updatedAt: new Date()
  });
}

export async function getSession(sessionId: string) {
  if (!sessionStore.has(sessionId)) {
    return "no-session-id-key-anonymous";
  }
  return sessionStore.get(sessionId);
}

export async function deleteSession(sessionId: string) {
  sessionStore.delete(sessionId);
}

export async function listSessions() {
  return Array.from(sessionStore.entries()).map(([id, data]) => ({
    id,
    ...data
  }));
}

export async function getCompletedSession(sessionId: string) {
  const session = sessionStore.get(sessionId);
  
  if (!session) {
    return null;
  }
  
  // Check if session is completed
  if (!session.state.verdict_ready && 
      session.state.next !== "feedback_generator" && 
      session.state.next !== "done") {
    return null; // Not a completed session
  }
  
  // Return a cleaned version for view-only display
  return {
    sessionId: session.state.sessionId,
    scenario: session.state.scenario,
    persona: session.state.persona,
    conversation: session.state.messages.map((msg: { _getType: () => any; content: any; }) => ({
      role: msg._getType(),
      content: msg.content
    })),
    feedback: session.state.messages.length > 0 ? 
      session.state.messages[session.state.messages.length - 1].content : null,
    scores: session.state.scores,
    completionTime: new Date(),
    requiredSteps: session.state.scenario.required_steps,
    missingSteps: session.state.missing_steps,
    criticalErrors: session.state.escalation_points,
    finalScores: session.state.final_score,
    completedAt: session.state.completedAt,

  };
}