// Service interfaces and configurations for the training system

export interface Document {
  pageContent: string;
  metadata: DocumentMetadata;
}

export interface DocumentMetadata {
  source: string;
  title?: string;
  section?: string;
  type?: 'sop' | 'training' | 'policy';
}

export interface PineconeService {
  searchSimilarDocuments(query: string, topK?: number): Promise<Document[]>;
  addDocuments(documents: Document[]): Promise<void>;
  deleteDocuments(ids: string[]): Promise<void>;
}

export const AGENT_CONFIGS = {
  scenarioCreator: {
    model: "gemini-1.5-pro",
    temperature: 0.7,
    maxTokens: 2000,
  },
  personaGenerator: {
    model: "gemini-1.5-pro", 
    temperature: 0.8,
    maxTokens: 1500,
  },
  guestSimulator: {
    model: "gemini-1.5-pro",
    temperature: 0.6,
    maxTokens: 1000,
  },
  feedbackAgent: {
    model: "gemini-1.5-pro",
    temperature: 0.3,
    maxTokens: 2500,
  },
  scoringAgent: {
    model: "gemini-1.5-pro",
    temperature: 0.2,
    maxTokens: 1500,
  }
};