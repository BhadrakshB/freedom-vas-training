# Design Document

## Overview

The Document Embedding Adapter is a specialized service class that provides a clean, efficient interface for converting text content and documents into high-quality embeddings using Google's Gemini `models/embedding-001` model. The adapter serves as a bridge between raw document content and the vector database storage layer, handling all aspects of text preprocessing, embedding generation, error handling, and batch processing.

## Architecture

### Core Components

```
DocumentEmbeddingAdapter
├── EmbeddingGenerator (Google Gemini integration)
├── DocumentProcessor (text preprocessing & chunking)
├── BatchProcessor (efficient batch operations)
├── ErrorHandler (retry logic & error management)
└── MetricsCollector (usage tracking & monitoring)
```

### Integration Points

- **PineconeService**: The adapter will replace the current hash-based embedding generation
- **Existing Types**: Full compatibility with `Document`, `DocumentMetadata`, and `VectorDocument` interfaces
- **LLM Configuration**: Reuses the existing Google Gemini setup from `llms.ts`

## Components and Interfaces

### DocumentEmbeddingAdapter Class

```typescript
export class DocumentEmbeddingAdapter {
  private embeddings: GoogleGenerativeAIEmbeddings;
  private batchProcessor: BatchProcessor;
  private documentProcessor: DocumentProcessor;
  private errorHandler: ErrorHandler;
  private metricsCollector: MetricsCollector;

  // Core embedding methods
  async generateEmbedding(text: string): Promise<number[]>
  async generateEmbeddings(texts: string[]): Promise<number[][]>
  
  // Document processing methods
  async processDocument(document: Document): Promise<ProcessedDocument>
  async processDocuments(documents: Document[]): Promise<ProcessedDocument[]>
  
  // Integration methods
  async createVectorDocument(document: Document): Promise<VectorDocument>
  async createVectorDocuments(documents: Document[]): Promise<VectorDocument[]>
}
```

### Supporting Interfaces

```typescript
interface ProcessedDocument {
  id: string;
  chunks: DocumentChunk[];
  metadata: DocumentMetadata;
  totalTokens: number;
}

interface DocumentChunk {
  content: string;
  embedding: number[];
  chunkIndex: number;
  tokenCount: number;
}

interface EmbeddingOptions {
  batchSize?: number;
  maxRetries?: number;
  enableCaching?: boolean;
  chunkSize?: number;
  chunkOverlap?: number;
}

interface EmbeddingMetrics {
  totalDocuments: number;
  totalChunks: number;
  totalTokens: number;
  apiCalls: number;
  cacheHits: number;
  processingTime: number;
  errors: number;
}
```

## Data Models

### Document Processing Flow

1. **Input Validation**: Validate document structure and metadata
2. **Text Preprocessing**: Clean and normalize text content
3. **Chunking**: Split large documents into optimal chunks (if needed)
4. **Embedding Generation**: Generate embeddings using Gemini model
5. **Result Assembly**: Combine embeddings with metadata
6. **Output Formatting**: Format for Pinecone integration

### Chunking Strategy

- **Default Chunk Size**: 1000 tokens (optimal for Gemini embedding model)
- **Overlap**: 100 tokens between chunks to maintain context
- **Chunk Boundaries**: Respect sentence and paragraph boundaries when possible
- **Metadata Preservation**: Each chunk inherits parent document metadata with chunk-specific additions

### Batch Processing

- **Optimal Batch Size**: 10-20 documents per API call (based on Gemini API limits)
- **Rate Limiting**: Respect API rate limits with exponential backoff
- **Parallel Processing**: Process independent batches concurrently
- **Progress Tracking**: Provide progress callbacks for large operations

## Error Handling

### Retry Strategy

```typescript
interface RetryConfig {
  maxRetries: 3;
  baseDelay: 1000; // ms
  maxDelay: 30000; // ms
  backoffMultiplier: 2;
  retryableErrors: ['RATE_LIMIT', 'NETWORK_ERROR', 'TIMEOUT'];
}
```

### Error Categories

1. **Retryable Errors**: Rate limits, network timeouts, temporary API issues
2. **Non-Retryable Errors**: Invalid API keys, malformed requests, quota exceeded
3. **Validation Errors**: Invalid document format, missing required fields
4. **Processing Errors**: Text encoding issues, chunk size violations

### Error Recovery

- **Partial Batch Failures**: Continue processing remaining documents
- **Graceful Degradation**: Return partial results with error details
- **Error Logging**: Comprehensive logging for debugging and monitoring
- **Circuit Breaker**: Temporary service suspension on repeated failures



## Performance Considerations

### Optimization Strategies

1. **Batch Processing**: Group multiple documents into single API calls
2. **Caching**: Optional in-memory cache for identical content
3. **Streaming**: Process large document sets without loading everything into memory
4. **Connection Pooling**: Reuse HTTP connections for API calls

### Memory Management

- **Chunk Processing**: Process documents in chunks to limit memory usage
- **Garbage Collection**: Explicit cleanup of large objects after processing
- **Stream Processing**: Use streams for very large document collections
- **Memory Monitoring**: Track memory usage and provide warnings

### API Efficiency

- **Token Optimization**: Optimize chunk sizes for Gemini model efficiency
- **Request Batching**: Minimize API calls through intelligent batching
- **Rate Limit Management**: Proactive rate limit handling to avoid delays
- **Cost Tracking**: Monitor token usage and API costs

## Security Considerations

### Data Protection

- **Content Sanitization**: Remove sensitive information before embedding
- **Metadata Filtering**: Validate and sanitize metadata fields
- **API Key Security**: Secure handling of Google API credentials
- **Audit Logging**: Log all embedding operations for security auditing

### Access Control

- **Service Isolation**: Adapter operates within existing security boundaries
- **Input Validation**: Strict validation of all input parameters
- **Output Sanitization**: Ensure embeddings don't leak sensitive information
- **Error Message Security**: Avoid exposing internal details in error messages