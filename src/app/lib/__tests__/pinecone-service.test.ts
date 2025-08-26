// Unit tests for PineconeService

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PineconeService } from '../pinecone-service';
import { Document } from '../service-interfaces';
import { DocumentMetadata, MetadataFilter } from '../types';

// Mock the entire Pinecone module
vi.mock('@pinecone-database/pinecone', () => {
  const mockIndex = {
    upsert: vi.fn(),
    query: vi.fn(),
    fetch: vi.fn(),
    deleteMany: vi.fn(),
    describeIndexStats: vi.fn()
  };

  return {
    Pinecone: vi.fn().mockImplementation(() => ({
      index: vi.fn(() => mockIndex)
    }))
  };
});

describe('PineconeService', () => {
  let pineconeService: PineconeService;
  let mockClient: any;
  let mockIndex: any;

  beforeEach(() => {
    // Create a fresh service instance for each test
    pineconeService = new PineconeService('test-api-key', 'test-index');
    
    // Get the mocked client and index
    mockClient = (pineconeService as any).client;
    mockIndex = {
      upsert: vi.fn(),
      query: vi.fn(),
      fetch: vi.fn(),
      deleteMany: vi.fn(),
      describeIndexStats: vi.fn()
    };
    
    // Mock the index method to return our mock index
    mockClient.index = vi.fn(() => mockIndex);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      await pineconeService.initialize();
      expect(mockClient.index).toHaveBeenCalledWith('test-index');
    });

    it('should handle initialization errors', async () => {
      mockClient.index.mockImplementation(() => {
        throw new Error('Connection failed');
      });

      await expect(pineconeService.initialize()).rejects.toThrow(
        'Failed to initialize Pinecone index: Error: Connection failed'
      );
    });
  });

  describe('ingestSOPs', () => {
    const mockSOPs: Document[] = [
      {
        id: 'sop-1',
        content: 'Standard operating procedure for booking confirmations',
        metadata: {
          type: 'sop',
          category: 'booking',
          difficulty: 'beginner',
          tags: ['confirmation', 'booking']
        }
      }
    ];

    it('should successfully ingest SOP documents', async () => {
      mockIndex.upsert.mockResolvedValue({});

      await pineconeService.ingestSOPs(mockSOPs);

      expect(mockIndex.upsert).toHaveBeenCalledTimes(1);
      const upsertCall = mockIndex.upsert.mock.calls[0][0];
      
      expect(upsertCall).toHaveLength(1);
      expect(upsertCall[0].id).toBe('sop_sop-1');
      expect(upsertCall[0].metadata.type).toBe('sop');
      expect(upsertCall[0].metadata.content).toBe('Standard operating procedure for booking confirmations');
      expect(upsertCall[0].values).toHaveLength(1536);
    });

    it('should handle upsert errors', async () => {
      mockIndex.upsert.mockRejectedValue(new Error('Upsert failed'));

      await expect(pineconeService.ingestSOPs(mockSOPs)).rejects.toThrow(
        'Failed to ingest SOPs: Error: Upsert failed'
      );
    });
  });

  describe('ingestTrainingMaterials', () => {
    const mockMaterials: Document[] = [
      {
        id: 'training-1',
        content: 'Best practices for guest communication',
        metadata: {
          type: 'best_practice',
          category: 'general',
          difficulty: 'beginner',
          tags: ['communication', 'best-practice']
        }
      }
    ];

    it('should successfully ingest training materials', async () => {
      mockIndex.upsert.mockResolvedValue({});

      await pineconeService.ingestTrainingMaterials(mockMaterials);

      expect(mockIndex.upsert).toHaveBeenCalledTimes(1);
      const upsertCall = mockIndex.upsert.mock.calls[0][0];
      
      expect(upsertCall).toHaveLength(1);
      expect(upsertCall[0].id).toBe('training_training-1');
      expect(upsertCall[0].metadata.type).toBe('training_material');
    });
  });

  describe('tagDocument', () => {
    const mockMetadata: DocumentMetadata = {
      type: 'sop',
      category: 'booking',
      difficulty: 'advanced',
      tags: ['updated', 'reviewed']
    };

    it('should successfully tag an existing document', async () => {
      const existingDoc = {
        values: [0.1, 0.2, 0.3],
        metadata: {
          type: 'sop',
          category: 'general',
          difficulty: 'beginner',
          tags: ['old-tag']
        }
      };

      mockIndex.fetch.mockResolvedValue({
        records: { 'doc-1': existingDoc }
      });
      mockIndex.upsert.mockResolvedValue({});

      await pineconeService.tagDocument('doc-1', mockMetadata);

      expect(mockIndex.fetch).toHaveBeenCalledWith(['doc-1']);
      expect(mockIndex.upsert).toHaveBeenCalledTimes(1);
    });

    it('should throw error if document not found', async () => {
      mockIndex.fetch.mockResolvedValue({
        records: {}
      });

      await expect(pineconeService.tagDocument('nonexistent', mockMetadata)).rejects.toThrow(
        'Failed to tag document nonexistent: Error: Document nonexistent not found'
      );
    });
  });

  describe('retrieveRelevantSOPs', () => {
    const mockQueryResponse = {
      matches: [
        {
          id: 'sop_1',
          score: 0.95,
          metadata: {
            content: 'SOP for booking confirmations',
            type: 'sop',
            category: 'booking',
            difficulty: 'beginner',
            tags: ['booking', 'confirmation']
          }
        }
      ]
    };

    it('should retrieve relevant SOPs without filters', async () => {
      mockIndex.query.mockResolvedValue(mockQueryResponse);

      const results = await pineconeService.retrieveRelevantSOPs('booking confirmation');

      expect(mockIndex.query).toHaveBeenCalledWith({
        vector: expect.any(Array),
        topK: 10,
        includeMetadata: true,
        filter: { type: { $eq: 'sop' } }
      });

      expect(results).toHaveLength(1);
      expect(results[0].content).toBe('SOP for booking confirmations');
      expect(results[0].score).toBe(0.95);
    });

    it('should retrieve SOPs with metadata filters', async () => {
      mockIndex.query.mockResolvedValue(mockQueryResponse);

      const filters: MetadataFilter = {
        category: 'booking',
        difficulty: 'beginner'
      };

      await pineconeService.retrieveRelevantSOPs('booking help', filters);

      expect(mockIndex.query).toHaveBeenCalledWith({
        vector: expect.any(Array),
        topK: 10,
        includeMetadata: true,
        filter: {
          type: { $eq: 'sop' },
          category: { $eq: 'booking' },
          difficulty: { $eq: 'beginner' }
        }
      });
    });

    it('should handle empty results', async () => {
      mockIndex.query.mockResolvedValue({ matches: [] });

      const results = await pineconeService.retrieveRelevantSOPs('no matches');

      expect(results).toHaveLength(0);
    });
  });

  describe('retrieveTrainingContent', () => {
    const mockTrainingResponse = {
      matches: [
        {
          id: 'training_1',
          score: 0.92,
          metadata: {
            content: 'Training material for booking scenarios',
            type: 'training_material',
            category: 'booking',
            difficulty: 'beginner',
            tags: ['training', 'booking']
          }
        }
      ]
    };

    it('should retrieve training content by scenario and difficulty', async () => {
      mockIndex.query.mockResolvedValue(mockTrainingResponse);

      const results = await pineconeService.retrieveTrainingContent('booking scenario', 'beginner');

      expect(mockIndex.query).toHaveBeenCalledWith({
        vector: expect.any(Array),
        topK: 5,
        includeMetadata: true,
        filter: {
          type: { $eq: 'training_material' },
          difficulty: { $eq: 'beginner' }
        }
      });

      expect(results).toHaveLength(1);
      expect(results[0].content).toBe('Training material for booking scenarios');
    });
  });

  describe('searchPolicyGuidance', () => {
    const mockPolicyResponse = {
      matches: [
        {
          id: 'policy_1',
          score: 0.88,
          metadata: {
            content: 'Policy guidance for user response handling',
            type: 'sop',
            category: 'general',
            difficulty: 'intermediate',
            tags: ['policy', 'guidance']
          }
        }
      ]
    };

    it('should search for policy guidance based on user response', async () => {
      mockIndex.query.mockResolvedValue(mockPolicyResponse);

      const results = await pineconeService.searchPolicyGuidance('user made a complaint');

      expect(mockIndex.query).toHaveBeenCalledWith({
        vector: expect.any(Array),
        topK: 5,
        includeMetadata: true,
        filter: { type: { $eq: 'sop' } }
      });

      expect(results).toHaveLength(1);
      expect(results[0].content).toBe('Policy guidance for user response handling');
    });
  });

  describe('utility methods', () => {
    it('should perform health check successfully', async () => {
      mockIndex.describeIndexStats.mockResolvedValue({ totalVectorCount: 100 });

      const isHealthy = await pineconeService.healthCheck();

      expect(isHealthy).toBe(true);
      expect(mockIndex.describeIndexStats).toHaveBeenCalled();
    });

    it('should return false for failed health check', async () => {
      mockIndex.describeIndexStats.mockRejectedValue(new Error('Health check failed'));

      const isHealthy = await pineconeService.healthCheck();

      expect(isHealthy).toBe(false);
    });

    it('should delete documents by IDs', async () => {
      mockIndex.deleteMany.mockResolvedValue({});

      await pineconeService.deleteDocuments(['doc1', 'doc2']);

      expect(mockIndex.deleteMany).toHaveBeenCalledWith(['doc1', 'doc2']);
    });

    it('should get index statistics', async () => {
      const mockStats = { totalVectorCount: 150, dimension: 1536 };
      mockIndex.describeIndexStats.mockResolvedValue(mockStats);

      const stats = await pineconeService.getIndexStats();

      expect(stats).toEqual(mockStats);
      expect(mockIndex.describeIndexStats).toHaveBeenCalled();
    });
  });

  describe('embedding generation', () => {
    it('should generate consistent embeddings for same input', async () => {
      // Access private method through any casting for testing
      const service = pineconeService as any;
      
      const embedding1 = await service.generateEmbedding('test text');
      const embedding2 = await service.generateEmbedding('test text');

      expect(embedding1).toEqual(embedding2);
      expect(embedding1).toHaveLength(1536);
      expect(embedding1.every((val: number) => val >= 0 && val <= 1)).toBe(true);
    });

    it('should generate different embeddings for different inputs', async () => {
      const service = pineconeService as any;
      
      const embedding1 = await service.generateEmbedding('first text');
      const embedding2 = await service.generateEmbedding('second text');

      expect(embedding1).not.toEqual(embedding2);
    });
  });

  describe('metadata filter building', () => {
    it('should build empty filter for no input', () => {
      const service = pineconeService as any;
      const filter = service.buildMetadataFilter();

      expect(filter).toEqual({});
    });

    it('should build comprehensive metadata filter', () => {
      const service = pineconeService as any;
      const filters: MetadataFilter = {
        type: 'sop',
        category: 'booking',
        difficulty: 'beginner',
        tags: ['tag1', 'tag2']
      };

      const filter = service.buildMetadataFilter(filters);

      expect(filter).toEqual({
        type: { $eq: 'sop' },
        category: { $eq: 'booking' },
        difficulty: { $eq: 'beginner' },
        tags: { $in: ['tag1', 'tag2'] }
      });
    });
  });
});