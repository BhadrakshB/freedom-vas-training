// Session Management System for Training Simulator
// Implements in-memory session store and session lifecycle management

import { TrainingSimulatorStateType } from "./training-state";
import { SessionStore, CompletedSession, SessionData } from "./types";
import { BaseMessage } from "@langchain/core/messages";

export class SessionManager {
  private activeSessions: SessionStore = {};
  private completedSessions: Map<string, CompletedSession> = new Map();
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  private readonly CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    // Start periodic cleanup
    this.startCleanupTimer();
  }

  /**
   * Create a new training session
   */
  async createSession(userId: string = 'anonymous'): Promise<string> {
    const sessionId = this.generateSessionId();
    
    const initialState: Partial<TrainingSimulatorStateType> = {
      sessionId,
      sessionStatus: 'creating',
      requiredSteps: [],
      completedSteps: [],
      criticalErrors: [],
      retrievedContext: [],
      turnCount: 0,
      messages: []
    };

    this.activeSessions[sessionId] = {
      state: initialState as TrainingSimulatorStateType,
      startTime: new Date(),
      lastActivity: new Date(),
      isActive: true
    };

    return sessionId;
  }

  /**
   * Get an active session by ID
   */
  async getSession(sessionId: string): Promise<TrainingSimulatorStateType | null> {
    const session = this.activeSessions[sessionId];
    if (!session || !session.isActive) {
      return null;
    }

    // Update last activity
    session.lastActivity = new Date();
    return session.state;
  }

  /**
   * Update session state
   */
  async updateSession(sessionId: string, state: Partial<TrainingSimulatorStateType>): Promise<void> {
    const session = this.activeSessions[sessionId];
    if (!session || !session.isActive) {
      throw new Error(`Session ${sessionId} not found or inactive`);
    }

    // Merge the state update
    session.state = { ...session.state, ...state };
    session.lastActivity = new Date();
  }

  /**
   * Complete a training session and move to completed sessions
   */
  async completeSession(sessionId: string): Promise<CompletedSession> {
    const session = this.activeSessions[sessionId];
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const state = session.state;
    const endTime = new Date();
    const duration = endTime.getTime() - session.startTime.getTime();

    // Create completed session record
    const completedSession: CompletedSession = {
      id: sessionId,
      userId: 'anonymous', // Would come from auth context
      scenario: state.scenario!,
      persona: state.persona!,
      transcript: state.messages,
      finalScores: state.scores!,
      feedback: this.extractFeedbackFromMessages(state.messages),
      duration,
      completedAt: endTime
    };

    // Store completed session
    this.completedSessions.set(sessionId, completedSession);

    // Remove from active sessions
    delete this.activeSessions[sessionId];

    return completedSession;
  }

  /**
   * Get all active session IDs
   */
  async getActiveSessions(): Promise<string[]> {
    return Object.keys(this.activeSessions).filter(
      sessionId => this.activeSessions[sessionId].isActive
    );
  }

  /**
   * Get session statistics
   */
  async getSessionStats(): Promise<{
    activeSessions: number;
    completedSessions: number;
    totalSessions: number;
  }> {
    return {
      activeSessions: Object.keys(this.activeSessions).length,
      completedSessions: this.completedSessions.size,
      totalSessions: Object.keys(this.activeSessions).length + this.completedSessions.size
    };
  }

  /**
   * Get completed session by ID
   */
  async getCompletedSession(sessionId: string): Promise<CompletedSession | null> {
    return this.completedSessions.get(sessionId) || null;
  }

  /**
   * Get all completed sessions for a user
   */
  async getUserCompletedSessions(userId: string): Promise<CompletedSession[]> {
    return Array.from(this.completedSessions.values())
      .filter(session => session.userId === userId);
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    const now = new Date();
    let cleanedCount = 0;

    Object.keys(this.activeSessions).forEach(sessionId => {
      const session = this.activeSessions[sessionId];
      const timeSinceLastActivity = now.getTime() - session.lastActivity.getTime();

      if (timeSinceLastActivity > this.SESSION_TIMEOUT) {
        // Mark as inactive but don't delete immediately
        session.isActive = false;
        cleanedCount++;
      }
    });

    // Remove inactive sessions after additional grace period
    const graceTime = this.SESSION_TIMEOUT * 2;
    Object.keys(this.activeSessions).forEach(sessionId => {
      const session = this.activeSessions[sessionId];
      const timeSinceLastActivity = now.getTime() - session.lastActivity.getTime();

      if (!session.isActive && timeSinceLastActivity > graceTime) {
        delete this.activeSessions[sessionId];
      }
    });

    return cleanedCount;
  }

  /**
   * Force complete a session (for cleanup or admin purposes)
   */
  async forceCompleteSession(sessionId: string, reason: string = 'Force completed'): Promise<void> {
    const session = this.activeSessions[sessionId];
    if (!session) {
      return;
    }

    try {
      // Try to complete normally
      await this.completeSession(sessionId);
    } catch (error) {
      // If normal completion fails, just remove from active sessions
      console.warn(`Failed to complete session ${sessionId} normally:`, error);
      delete this.activeSessions[sessionId];
    }
  }

  /**
   * Export session data for analysis or backup
   */
  async exportSessionData(sessionId: string): Promise<SessionData | null> {
    // Check active sessions first
    const activeSession = this.activeSessions[sessionId];
    if (activeSession) {
      const state = activeSession.state;
      return {
        id: sessionId,
        scenario: state.scenario!,
        persona: state.persona!,
        conversation: state.messages,
        scores: state.scores ? [state.scores] : [],
        startTime: activeSession.startTime,
        endTime: activeSession.isActive ? undefined : new Date()
      };
    }

    // Check completed sessions
    const completedSession = this.completedSessions.get(sessionId);
    if (completedSession) {
      return {
        id: sessionId,
        scenario: completedSession.scenario,
        persona: completedSession.persona,
        conversation: completedSession.transcript,
        scores: [completedSession.finalScores],
        startTime: new Date(completedSession.completedAt.getTime() - completedSession.duration),
        endTime: completedSession.completedAt
      };
    }

    return null;
  }

  /**
   * Get session transcript as formatted text
   */
  async getSessionTranscript(sessionId: string): Promise<string | null> {
    const sessionData = await this.exportSessionData(sessionId);
    if (!sessionData) {
      return null;
    }

    let transcript = `Training Session Transcript\n`;
    transcript += `Session ID: ${sessionId}\n`;
    transcript += `Scenario: ${sessionData.scenario.title}\n`;
    transcript += `Persona: ${sessionData.persona.name}\n`;
    transcript += `Start Time: ${sessionData.startTime.toISOString()}\n`;
    if (sessionData.endTime) {
      transcript += `End Time: ${sessionData.endTime.toISOString()}\n`;
    }
    transcript += `\n--- Conversation ---\n\n`;

    sessionData.conversation.forEach((message, index) => {
      const role = message._getType() === 'human' ? 'Trainee' : 'Guest';
      const content = typeof message.content === 'string' ? message.content : String(message.content);
      transcript += `${role}: ${content}\n\n`;
    });

    if (sessionData.scores.length > 0) {
      const finalScore = sessionData.scores[sessionData.scores.length - 1];
      transcript += `--- Final Scores ---\n`;
      transcript += `Policy Adherence: ${finalScore.policy_adherence}/100\n`;
      transcript += `Empathy Index: ${finalScore.empathy_index}/100\n`;
      transcript += `Completeness: ${finalScore.completeness}/100\n`;
      transcript += `Escalation Judgment: ${finalScore.escalation_judgment}/100\n`;
      transcript += `Time Efficiency: ${finalScore.time_efficiency}/100\n`;
    }

    return transcript;
  }

  /**
   * Pause a session (mark as inactive but don't clean up)
   */
  async pauseSession(sessionId: string): Promise<void> {
    const session = this.activeSessions[sessionId];
    if (session) {
      session.isActive = false;
    }
  }

  /**
   * Resume a paused session
   */
  async resumeSession(sessionId: string): Promise<boolean> {
    const session = this.activeSessions[sessionId];
    if (session && !session.isActive) {
      session.isActive = true;
      session.lastActivity = new Date();
      return true;
    }
    return false;
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substr(2, 9);
    return `session_${timestamp}_${randomPart}`;
  }

  /**
   * Extract feedback from the last AI message
   */
  private extractFeedbackFromMessages(messages: BaseMessage[]): string {
    // Find the last AI message which should contain feedback
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      if (message._getType() === 'ai') {
        const content = typeof message.content === 'string' ? message.content : String(message.content);
        if (content.includes('Training Session Complete') || content.includes('feedback')) {
          return content;
        }
      }
    }
    return 'No feedback available';
  }

  /**
   * Start the cleanup timer
   */
  private startCleanupTimer(): void {
    setInterval(async () => {
      try {
        const cleaned = await this.cleanupExpiredSessions();
        if (cleaned > 0) {
          console.log(`Cleaned up ${cleaned} expired sessions`);
        }
      } catch (error) {
        console.error('Error during session cleanup:', error);
      }
    }, this.CLEANUP_INTERVAL);
  }

  /**
   * Shutdown the session manager (cleanup resources)
   */
  async shutdown(): Promise<void> {
    // Force complete all active sessions
    const activeSessionIds = await this.getActiveSessions();
    for (const sessionId of activeSessionIds) {
      await this.forceCompleteSession(sessionId, 'System shutdown');
    }
  }
}

// Singleton instance for the application
export const sessionManager = new SessionManager();

// Export types for external use
export type { SessionStore, CompletedSession, SessionData };