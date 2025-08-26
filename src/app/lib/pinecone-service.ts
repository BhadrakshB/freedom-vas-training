// Pinecone integration service for AI Training Simulator

import { Pinecone } from '@pinecone-database/pinecone';
import { 
  PineconeService as IPineconeService, 
  Document 
} from './service-interfaces';
import { 
  DocumentMetadata, 
  RetrievalResult, 
  MetadataFilter, 
  VectorDocument 
} from './types';

export class PineconeService implements IPineconeService {
  private client: Pinecone;
  private indexName: string;
  private index: any;

  constructor(apiKey?: string, indexName: string = 'quickstart') {
    this.client = new Pinecone({
      apiKey: apiKey || process.env.PINECONE_API_KEY || ''
    });
    this.indexName = "quickstart";
  }

  /**
   * Initialize the Pinecone index connection
   */
  async initialize(): Promise<void> {
    try {
      this.index = this.client.index(this.indexName);
    } catch (error) {
      throw new Error(`Failed to initialize Pinecone index: ${error}`);
    }
  }

  /**
   * Generate embeddings using a simple text-based approach
   * In production, this would use Gemini embeddings API
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    // Simple hash-based embedding for testing
    // In production, replace with actual Gemini embeddings
    const hash = this.simpleHash(text);
    const embedding = new Array(1536).fill(0);
    
    for (let i = 0; i < Math.min(hash.length, embedding.length); i++) {
      embedding[i] = (hash.charCodeAt(i) % 256) / 255;
    }
    
    return embedding;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  /**
   * Ingest SOP documents into Pinecone
   */
  async ingestSOPs(documents: Document[]): Promise<void> {
    if (!this.index) {
      await this.initialize();
    }

    const vectors = await Promise.all(
      documents.map(async (doc) => {
        const embedding = await this.generateEmbedding(doc.content);
        return {
          id: `sop_${doc.id}`,
          values: embedding,
          metadata: {
            ...doc.metadata,
            content: doc.content,
            source: doc.id,
            type: 'sop',
            lastUpdated: new Date().toISOString()
          }
        };
      })
    );

    try {
      await this.index.upsert(vectors);
    } catch (error) {
      throw new Error(`Failed to ingest SOPs: ${error}`);
    }
  }

  /**
   * Ingest training materials into Pinecone
   */
  async ingestTrainingMaterials(materials: Document[]): Promise<void> {
    if (!this.index) {
      await this.initialize();
    }

    const vectors = await Promise.all(
      materials.map(async (material) => {
        const embedding = await this.generateEmbedding(material.content);
        return {
          id: `training_${material.id}`,
          values: embedding,
          metadata: {
            ...material.metadata,
            content: material.content,
            source: material.id,
            type: 'training_material',
            lastUpdated: new Date().toISOString()
          }
        };
      })
    );

    try {
      await this.index.upsert(vectors);
    } catch (error) {
      throw new Error(`Failed to ingest training materials: ${error}`);
    }
  }

  /**
   * Tag a document with additional metadata
   */
  async tagDocument(docId: string, metadata: DocumentMetadata): Promise<void> {
    if (!this.index) {
      await this.initialize();
    }

    try {
      // Fetch existing document
      const fetchResult = await this.index.fetch([docId]);
      const existingDoc = fetchResult.records[docId];
      
      if (!existingDoc) {
        throw new Error(`Document ${docId} not found`);
      }

      // Update with new metadata
      const updatedMetadata = {
        ...existingDoc.metadata,
        ...metadata,
        lastUpdated: new Date().toISOString()
      };

      await this.index.upsert([{
        id: docId,
        values: existingDoc.values,
        metadata: updatedMetadata
      }]);
    } catch (error) {
      throw new Error(`Failed to tag document ${docId}: ${error}`);
    }
  }

  /**
   * Build metadata filter for Pinecone queries
   */
  private buildMetadataFilter(filters?: MetadataFilter): Record<string, any> {
    if (!filters) return {};

    const filter: Record<string, any> = {};

    if (filters.type) {
      filter.type = { $eq: filters.type };
    }
    if (filters.category) {
      filter.category = { $eq: filters.category };
    }
    if (filters.difficulty) {
      filter.difficulty = { $eq: filters.difficulty };
    }
    if (filters.tags && filters.tags.length > 0) {
      filter.tags = { $in: filters.tags };
    }

    return filter;
  }

  /**
   * Convert Pinecone results to RetrievalResult format
   */
  private convertToRetrievalResults(matches: any[]): RetrievalResult[] {
    return matches.map(match => ({
      content: match.metadata.content || '',
      metadata: {
        type: match.metadata.type,
        category: match.metadata.category,
        difficulty: match.metadata.difficulty,
        tags: match.metadata.tags || []
      },
      score: match.score || 0
    }));
  }

  /**
   * Retrieve relevant SOP documents
   */
  async retrieveRelevantSOPs(query: string, filters?: MetadataFilter): Promise<RetrievalResult[]> {
    if (!this.index) {
      await this.initialize();
    }

    try {
      const queryEmbedding = await this.generateEmbedding(query);
      const metadataFilter = this.buildMetadataFilter({
        ...filters,
        type: 'sop'
      });

      const queryResponse = await this.index.query({
        vector: queryEmbedding,
        topK: 10,
        includeMetadata: true,
        filter: metadataFilter
      });

      return this.convertToRetrievalResults(queryResponse.matches || []);
    } catch (error) {
      throw new Error(`Failed to retrieve SOPs: ${error}`);
    }
  }

  /**
   * Retrieve training content based on scenario and difficulty
   */
  async retrieveTrainingContent(scenario: string, difficulty: string): Promise<RetrievalResult[]> {
    if (!this.index) {
      await this.initialize();
    }

    try {
      const queryEmbedding = await this.generateEmbedding(scenario);
      const metadataFilter = this.buildMetadataFilter({
        type: 'training_material',
        difficulty: difficulty as 'beginner' | 'intermediate' | 'advanced'
      });

      const queryResponse = await this.index.query({
        vector: queryEmbedding,
        topK: 5,
        includeMetadata: true,
        filter: metadataFilter
      });

      return this.convertToRetrievalResults(queryResponse.matches || []);
    } catch (error) {
      throw new Error(`Failed to retrieve training content: ${error}`);
    }
  }

  /**
   * Search for policy guidance based on user response
   */
  async searchPolicyGuidance(userResponse: string): Promise<RetrievalResult[]> {
    if (!this.index) {
      await this.initialize();
    }

    try {
      const queryEmbedding = await this.generateEmbedding(userResponse);
      const metadataFilter = this.buildMetadataFilter({
        type: 'sop'
      });

      const queryResponse = await this.index.query({
        vector: queryEmbedding,
        topK: 5,
        includeMetadata: true,
        filter: metadataFilter
      });

      return this.convertToRetrievalResults(queryResponse.matches || []);
    } catch (error) {
      throw new Error(`Failed to search policy guidance: ${error}`);
    }
  }

  /**
   * Health check for Pinecone connection
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.index) {
        await this.initialize();
      }
      
      // Try to describe the index stats
      const stats = await this.index.describeIndexStats();
      return stats !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Delete documents by ID
   */
  async deleteDocuments(ids: string[]): Promise<void> {
    if (!this.index) {
      await this.initialize();
    }

    try {
      await this.index.deleteMany(ids);
    } catch (error) {
      throw new Error(`Failed to delete documents: ${error}`);
    }
  }

  /**
   * Get index statistics
   */
  async getIndexStats(): Promise<any> {
    if (!this.index) {
      await this.initialize();
    }

    try {
      return await this.index.describeIndexStats();
    } catch (error) {
      throw new Error(`Failed to get index stats: ${error}`);
    }
  }
}

// Factory function for creating PineconeService instances
export const createPineconeService = (apiKey?: string, indexName?: string) => {
  return new PineconeService(apiKey, indexName);
};