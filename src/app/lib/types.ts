// // Core data models and interfaces for AI Training Simulator

// import { BaseMessage } from "@langchain/core/messages";

// /** Core Training Data Models */

// export interface ScenarioData {
//   title: string;
//   description: string;
//   required_steps: string[];
//   critical_errors: string[];
//   time_pressure: number;
// }

// export interface PersonaData {
//   name: string;
//   background: string;
//   personality_traits: string[];
//   hidden_motivations: string[];
//   communication_style: string;
//   emotional_arc: string[];
// }

// export interface ScoringMetrics {
//   policy_adherence: number;
//   empathy_index: number;
//   completeness: number;
//   escalation_judgment: number;
//   time_efficiency: number;
// }

// export interface SessionData {
//   id: string;
//   scenario: ScenarioData;
//   persona: PersonaData;
//   conversation: BaseMessage[];
//   scores: ScoringMetrics[];
//   finalFeedback?: string;
//   startTime: Date;
//   endTime?: Date;
// }

// /** Session Storage Interfaces */

// export interface SessionStore {
//   [sessionId: string]: {
//     state: TrainingSimulatorState;
//     startTime: Date;
//     lastActivity: Date;
//     isActive: boolean;
//     userId: string;
//   };
// }

// export interface CompletedSession {
//   id: string;
//   userId: string;
//   scenario: ScenarioData;
//   persona: PersonaData;
//   transcript: BaseMessage[];
//   finalScores: ScoringMetrics;
//   feedback: string;
//   duration: number;
//   completedAt: Date;
// }

// /** Vector Database Types */

// export interface DocumentMetadata {
//   type: 'sop' | 'script' | 'best_practice';
//   category: 'booking' | 'complaint' | 'overbooking' | 'general';
//   difficulty: 'beginner' | 'intermediate' | 'advanced';
//   tags: string[];
// }

// export interface VectorDocument {
//   id: string;
//   content: string;
//   embedding: number[];
//   metadata: {
//     source: string;
//     type: 'sop' | 'script' | 'training_material';
//     category: string;
//     difficulty: string;
//     section?: string;
//     version: string;
//     lastUpdated: Date;
//   };
// }

// export interface RetrievalResult {
//   content: string;
//   metadata: DocumentMetadata;
//   score: number;
// }

// export interface MetadataFilter {
//   type?: string;
//   category?: string;
//   difficulty?: string;
//   tags?: string[];
// }

// /** Session Status Types */

// export type SessionStatus = 'creating' | 'active' | 'complete' | 'idle';

// /** Training Simulator State Interface */

// export interface TrainingSimulatorState {
//   // Messages from MessagesAnnotation
//   messages: BaseMessage[];
  
//   // Session Management
//   sessionId: string;
//   sessionStatus: SessionStatus;
  
//   // Scenario & Persona
//   scenario?: ScenarioData;
//   persona?: PersonaData;
  
//   // Training Progress
//   requiredSteps: string[];
//   completedSteps: string[];
  
//   // Silent Scoring
//   scores?: ScoringMetrics;
//   criticalErrors: string[];
  
//   // Knowledge Context
//   retrievedContext: string[];
  
//   // UI State
//   currentEmotion?: string;
//   turnCount: number;
// }

// /** Feedback System Types */

// export interface OverallPerformance {
//   grade: 'A' | 'B' | 'C' | 'D' | 'F';
//   score: number;
//   summary: string;
//   keyStrengths: string[];
//   primaryAreasForImprovement: string[];
//   sessionCompletion: {
//     completionRate: number;
//     stepsCompleted: number;
//     totalSteps: number;
//     criticalErrorCount: number;
//   };
// }

// export interface DimensionAnalysis {
//   score: number;
//   trend: 'improving' | 'declining' | 'stable';
//   strengths: string[];
//   weaknesses: string[];
//   improvementOpportunities: string[];
// }

// export interface DetailedAnalysis {
//   policyAdherence: DimensionAnalysis;
//   empathyIndex: DimensionAnalysis;
//   completeness: DimensionAnalysis;
//   escalationJudgment: DimensionAnalysis;
//   timeEfficiency: DimensionAnalysis;
// }

// export interface SOPCitation {
//   section: string;
//   content: string;
//   relevance: string;
//   applicationExample: string;
//   source: string;
// }

// export interface ActionableRecommendation {
//   category: 'policy' | 'communication' | 'process' | 'empathy' | 'efficiency';
//   priority: 'high' | 'medium' | 'low';
//   recommendation: string;
//   specificActions: string[];
//   expectedOutcome: string;
//   relatedSOPs: string[];
// }

// export interface ResourceRecommendation {
//   type: 'training_material' | 'sop_section' | 'best_practice' | 'script_template';
//   title: string;
//   description: string;
//   relevance: string;
//   source: string;
// }

// export interface FeedbackOutput {
//   overallPerformance: OverallPerformance;
//   detailedAnalysis: DetailedAnalysis;
//   sopCitations: SOPCitation[];
//   actionableRecommendations: ActionableRecommendation[];
//   resources: ResourceRecommendation[];
//   nextSteps: string[];
// }

// /** Document Embedding Adapter Types */

// export interface ProcessedDocument {
//   id: string;
//   chunks: DocumentChunk[];
//   metadata: DocumentMetadata;
//   totalTokens: number;
// }

// export interface DocumentChunk {
//   content: string;
//   embedding: number[];
//   chunkIndex: number;
//   tokenCount: number;
// }

// export interface EmbeddingOptions {
//   batchSize?: number;
//   maxRetries?: number;
//   enableCaching?: boolean;
//   chunkSize?: number;
//   chunkOverlap?: number;
// }

// export interface EmbeddingMetrics {
//   totalDocuments: number;
//   totalChunks: number;
//   totalTokens: number;
//   apiCalls: number;
//   cacheHits: number;
//   processingTime: number;
//   errors: number;
// }

// /** Document Embedding Error Types */

// export type EmbeddingErrorType = 
//   | 'RATE_LIMIT'
//   | 'NETWORK_ERROR'
//   | 'TIMEOUT'
//   | 'INVALID_API_KEY'
//   | 'MALFORMED_REQUEST'
//   | 'QUOTA_EXCEEDED'
//   | 'VALIDATION_ERROR'
//   | 'PROCESSING_ERROR'
//   | 'UNKNOWN_ERROR';

// export interface EmbeddingError extends Error {
//   type: EmbeddingErrorType;
//   retryable: boolean;
//   details?: Record<string, any>;
//   originalError?: Error;
// }

// export class DocumentEmbeddingError extends Error implements EmbeddingError {
//   public readonly type: EmbeddingErrorType;
//   public readonly retryable: boolean;
//   public readonly details?: Record<string, any>;
//   public readonly originalError?: Error;

//   constructor(
//     type: EmbeddingErrorType,
//     message: string,
//     retryable: boolean = false,
//     details?: Record<string, any>,
//     originalError?: Error
//   ) {
//     super(message);
//     this.name = 'DocumentEmbeddingError';
//     this.type = type;
//     this.retryable = retryable;
//     this.details = details;
//     this.originalError = originalError;
//   }
// }