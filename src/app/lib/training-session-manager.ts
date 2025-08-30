/**
 * TrainingSessionManager - Independent training session handling
 * 
 * This manager handles training sessions completely independently from chat sessions.
 * It manages training session lifecycle, message sending to training API, and 
 * training-specific state without any dependencies on chat functionality.
 */

import { SessionStatus, ScenarioData, PersonaData, ScoringMetrics } from './types';
// Removed unused imports - these functions are not used in this file

export interface TrainingConfig {
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  category?: string;
  trainingObjective?: string;
}

export interface TrainingSessionData {
  sessionId: string;
  status: SessionStatus;
  scenario?: ScenarioData;
  persona?: PersonaData;
  scores?: ScoringMetrics & { overall: number };
  progress: {
    currentTurn: number;
    completedSteps: string[];
    requiredSteps: string[];
    completionPercentage: number;
  };
  sessionDuration: number;
  startTime?: Date;
  criticalErrors: string[];
}

export interface TrainingSessionState {
  activeSessionId?: string;
  completedSessionId?: string;
  sessionData?: TrainingSessionData;
  isActive: boolean;
  lastStatusCheck?: Date;
}

export interface TrainingSessionManager {
  // Session state
  getSessionState(): TrainingSessionState;
  
  // Session lifecycle
  startSession(config: TrainingConfig): Promise<string>;
  getSessionStatus(sessionId: string): Promise<SessionStatus>;
  completeSession(sessionId: string): void;
  
  // Message operations
  sendMessage(sessionId: string, message: string): Promise<void>;
  
  // Session data management
  updateSessionData(sessionId: string, data: Partial<TrainingSessionData>): void;
  getSessionData(sessionId: string): TrainingSessionData | undefined;
  
  // Session queries
  isSessionActive(): boolean;
  getActiveSessionId(): string | undefined;
  getCompletedSessionId(): string | undefined;
}

class TrainingSessionManagerImpl implements TrainingSessionManager {
  private state: TrainingSessionState = {
    isActive: false,
  };

  private sessionDataStore = new Map<string, TrainingSessionData>();

  getSessionState(): TrainingSessionState {
    return { ...this.state };
  }

  async startSession(config: TrainingConfig): Promise<string> {
    try {
      const response = await fetch('/api/training/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          difficulty: config.difficulty || 'beginner',
          category: config.category || 'general',
          trainingObjective: config.trainingObjective || 'General training session',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start training session');
      }

      const data = await response.json();
      const sessionId = data.sessionId;

      // Initialize session data
      const sessionData: TrainingSessionData = {
        sessionId,
        status: 'creating',
        progress: {
          currentTurn: 0,
          completedSteps: [],
          requiredSteps: [],
          completionPercentage: 0,
        },
        sessionDuration: 0,
        startTime: new Date(),
        criticalErrors: [],
      };

      // Store session data
      this.sessionDataStore.set(sessionId, sessionData);

      // Update state
      this.state.activeSessionId = sessionId;
      this.state.completedSessionId = undefined;
      this.state.sessionData = sessionData;
      this.state.isActive = true;

      return sessionId;
    } catch (error) {
      console.error('Failed to start training session:', error);
      throw error;
    }
  }

  async getSessionStatus(sessionId: string): Promise<SessionStatus> {
    try {
      const response = await fetch(`/api/training/status?sessionId=${sessionId}`);
      
      if (!response.ok) {
        throw new Error('Failed to get session status');
      }

      const data = await response.json();
      const status = data.sessionStatus as SessionStatus;

      // Update session data with latest status
      const sessionData = this.sessionDataStore.get(sessionId);
      if (sessionData) {
        sessionData.status = status;
        
        // Update with additional data from API response
        if (data.scenario) sessionData.scenario = data.scenario;
        if (data.persona) sessionData.persona = data.persona;
        if (data.scores) sessionData.scores = data.scores;
        if (data.progress) sessionData.progress = data.progress;
        if (data.sessionDuration) sessionData.sessionDuration = data.sessionDuration;
        if (data.criticalErrors) sessionData.criticalErrors = data.criticalErrors;
        
        this.sessionDataStore.set(sessionId, sessionData);
        
        // Update state if this is the active session
        if (this.state.activeSessionId === sessionId) {
          this.state.sessionData = sessionData;
        }
      }

      this.state.lastStatusCheck = new Date();
      return status;
    } catch (error) {
      console.error('Failed to get session status:', error);
      throw error;
    }
  }

  completeSession(sessionId: string): void {
    // Move from active to completed
    if (this.state.activeSessionId === sessionId) {
      this.state.completedSessionId = sessionId;
      this.state.activeSessionId = undefined;
      this.state.isActive = false;

      // Update session data status
      const sessionData = this.sessionDataStore.get(sessionId);
      if (sessionData) {
        sessionData.status = 'complete';
        this.sessionDataStore.set(sessionId, sessionData);
        this.state.sessionData = sessionData;
      }
    }
  }

  async sendMessage(sessionId: string, message: string): Promise<void> {
    if (!message.trim()) {
      throw new Error('Message cannot be empty');
    }

    try {
      const response = await fetch('/api/training/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          userResponse: message.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send training message');
      }

      // Update session data with new turn
      const sessionData = this.sessionDataStore.get(sessionId);
      if (sessionData) {
        sessionData.progress.currentTurn++;
        this.sessionDataStore.set(sessionId, sessionData);
        
        // Update state if this is the active session
        if (this.state.activeSessionId === sessionId) {
          this.state.sessionData = sessionData;
        }
      }
    } catch (error) {
      console.error('Failed to send training message:', error);
      throw error;
    }
  }

  updateSessionData(sessionId: string, data: Partial<TrainingSessionData>): void {
    const existingData = this.sessionDataStore.get(sessionId);
    if (existingData) {
      const updatedData = { ...existingData, ...data };
      this.sessionDataStore.set(sessionId, updatedData);
      
      // Update state if this is the active session
      if (this.state.activeSessionId === sessionId) {
        this.state.sessionData = updatedData;
      }
    }
  }

  getSessionData(sessionId: string): TrainingSessionData | undefined {
    return this.sessionDataStore.get(sessionId);
  }

  isSessionActive(): boolean {
    return this.state.isActive && this.state.activeSessionId !== undefined;
  }

  getActiveSessionId(): string | undefined {
    return this.state.activeSessionId;
  }

  getCompletedSessionId(): string | undefined {
    return this.state.completedSessionId;
  }
}

// Factory function to create a new training session manager
export function createTrainingSessionManager(): TrainingSessionManager {
  return new TrainingSessionManagerImpl();
}

// Singleton instance for global use (optional)
let globalTrainingSessionManager: TrainingSessionManager | null = null;

export function getTrainingSessionManager(): TrainingSessionManager {
  if (!globalTrainingSessionManager) {
    globalTrainingSessionManager = createTrainingSessionManager();
  }
  return globalTrainingSessionManager;
}