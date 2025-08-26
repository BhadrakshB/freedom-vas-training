// Service interfaces for AI Training Simulator

import { 
  DocumentMetadata, 
  RetrievalResult, 
  MetadataFilter, 
  VectorDocument 
} from "./types";

/** Pinecone Integration Service Interface */
export interface PineconeService {
  // Admin functions (one-time setup)
  ingestSOPs(documents: Document[]): Promise<void>;
  ingestTrainingMaterials(materials: Document[]): Promise<void>;
  tagDocument(docId: string, metadata: DocumentMetadata): Promise<void>;
  
  // Runtime retrieval functions (used during training sessions)
  retrieveRelevantSOPs(query: string, filters?: MetadataFilter): Promise<RetrievalResult[]>;
  retrieveTrainingContent(scenario: string, difficulty: string): Promise<RetrievalResult[]>;
  searchPolicyGuidance(userResponse: string): Promise<RetrievalResult[]>;
}

/** Session Management Service Interface */
export interface SessionManager {
  // Session lifecycle
  createSession(userId: string): Promise<string>;
  getSession(sessionId: string): Promise<any>;
  updateSession(sessionId: string, state: any): Promise<void>;
  completeSession(sessionId: string): Promise<void>;
  
  // Session cleanup
  cleanupExpiredSessions(): Promise<void>;
  getActiveSessions(): Promise<string[]>;
}

/** Document ingestion interface */
export interface Document {
  id: string;
  content: string;
  metadata: DocumentMetadata;
}

/** Agent Configuration Interface */
export interface AgentConfig {
  temperature: number;
  maxTokens: number;
  model: string;
}

/** Agent Configurations */
export const AGENT_CONFIGS: Record<string, AgentConfig> = {
  scenarioCreator: {
    temperature: 0.3,
    maxTokens: 1024,
    model: "gemini-1.5-flash"
  },
  personaGenerator: {
    temperature: 0.5,
    maxTokens: 1024,
    model: "gemini-1.5-flash"
  },
  guestSimulator: {
    temperature: 0.7,
    maxTokens: 1024,
    model: "gemini-1.5-flash"
  },
  silentScoring: {
    temperature: 0.1,
    maxTokens: 512,
    model: "gemini-1.5-flash"
  },
  feedbackGenerator: {
    temperature: 0.3,
    maxTokens: 1024,
    model: "gemini-1.5-flash"
  }
};