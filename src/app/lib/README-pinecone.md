# PineconeService Implementation

This document describes the PineconeService implementation for the AI Training Simulator, which provides vector database integration for storing and retrieving SOPs, training materials, and policy documents.

## Overview

The PineconeService class implements the `PineconeService` interface defined in `service-interfaces.ts` and provides:

- Document ingestion (SOPs and training materials)
- Vector-based document retrieval with metadata filtering
- Document management (tagging, deletion)
- Health monitoring and statistics

## Features

### ✅ Implemented Features

1. **Document Ingestion**
   - Ingest SOP documents with metadata
   - Ingest training materials with categorization
   - Automatic embedding generation (simplified for testing)
   - Metadata tagging and versioning

2. **Document Retrieval**
   - Retrieve relevant SOPs based on query
   - Search training content by scenario and difficulty
   - Policy guidance search based on user responses
   - Metadata filtering (type, category, difficulty, tags)

3. **Document Management**
   - Tag existing documents with additional metadata
   - Delete documents by ID
   - Update document metadata

4. **Monitoring & Health**
   - Health check functionality
   - Index statistics retrieval
   - Error handling and recovery

5. **Testing**
   - Comprehensive unit tests (20 test cases)
   - Mock-based testing for external dependencies
   - Error scenario coverage

## Usage

### Basic Setup

```typescript
import { createPineconeService } from './pinecone-service';

// Create service instance
const pineconeService = createPineconeService(
  process.env.PINECONE_API_KEY,
  'ai-training-simulator'
);

// Initialize connection
await pineconeService.initialize();
```

### Document Ingestion

```typescript
// Ingest SOP documents
const sopDocuments: Document[] = [
  {
    id: 'booking-sop-1',
    content: 'Standard procedure for booking confirmations...',
    metadata: {
      type: 'sop',
      category: 'booking',
      difficulty: 'beginner',
      tags: ['confirmation', 'booking']
    }
  }
];

await pineconeService.ingestSOPs(sopDocuments);
```

### Document Retrieval

```typescript
// Retrieve relevant SOPs
const results = await pineconeService.retrieveRelevantSOPs(
  'booking confirmation process',
  { category: 'booking', difficulty: 'beginner' }
);

// Search policy guidance
const guidance = await pineconeService.searchPolicyGuidance(
  'guest complaint about room cleanliness'
);
```

### Document Management

```typescript
// Tag a document
await pineconeService.tagDocument('doc-id', {
  type: 'sop',
  category: 'updated-category',
  difficulty: 'advanced',
  tags: ['updated', 'reviewed']
});

// Delete documents
await pineconeService.deleteDocuments(['old-doc-1', 'old-doc-2']);
```

## Configuration

### Environment Variables

```bash
PINECONE_API_KEY=your-pinecone-api-key
```

### Index Configuration

- **Index Name**: `ai-training-simulator` (default)
- **Dimensions**: 1536 (compatible with Gemini embeddings)
- **Metric**: Cosine similarity (default)

## API Reference

### Core Methods

#### `initialize(): Promise<void>`
Initializes the Pinecone index connection.

#### `ingestSOPs(documents: Document[]): Promise<void>`
Ingests SOP documents into the vector database.

#### `ingestTrainingMaterials(materials: Document[]): Promise<void>`
Ingests training materials into the vector database.

#### `retrieveRelevantSOPs(query: string, filters?: MetadataFilter): Promise<RetrievalResult[]>`
Retrieves relevant SOP documents based on query and optional filters.

#### `retrieveTrainingContent(scenario: string, difficulty: string): Promise<RetrievalResult[]>`
Retrieves training content for specific scenarios and difficulty levels.

#### `searchPolicyGuidance(userResponse: string): Promise<RetrievalResult[]>`
Searches for policy guidance based on user responses.

#### `tagDocument(docId: string, metadata: DocumentMetadata): Promise<void>`
Updates document metadata tags.

### Utility Methods

#### `healthCheck(): Promise<boolean>`
Performs a health check on the Pinecone connection.

#### `getIndexStats(): Promise<any>`
Retrieves index statistics and information.

#### `deleteDocuments(ids: string[]): Promise<void>`
Deletes documents by their IDs.

## Data Models

### Document Interface
```typescript
interface Document {
  id: string;
  content: string;
  metadata: DocumentMetadata;
}
```

### DocumentMetadata Interface
```typescript
interface DocumentMetadata {
  type: 'sop' | 'script' | 'best_practice';
  category: 'booking' | 'complaint' | 'overbooking' | 'general';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
}
```

### RetrievalResult Interface
```typescript
interface RetrievalResult {
  content: string;
  metadata: DocumentMetadata;
  score: number;
}
```

## Error Handling

The service implements comprehensive error handling:

- **Connection Errors**: Graceful handling of Pinecone connection failures
- **API Errors**: Proper error messages for API failures
- **Validation Errors**: Input validation and meaningful error messages
- **Recovery**: Automatic retry mechanisms where appropriate

## Testing

### Running Tests

```bash
# Run all tests
pnpm test:run

# Run tests in watch mode
pnpm test
```

### Test Coverage

- ✅ Initialization and connection handling
- ✅ Document ingestion (SOPs and training materials)
- ✅ Document retrieval with various filters
- ✅ Document management operations
- ✅ Error scenarios and edge cases
- ✅ Utility functions and health checks

## Integration with AI Training Simulator

The PineconeService integrates with the training simulator workflow:

1. **Scenario Creation**: Retrieves relevant SOPs to ground scenarios in company policies
2. **Silent Scoring**: Searches policy guidance to evaluate user responses
3. **Feedback Generation**: Retrieves SOPs and training materials for comprehensive feedback

## Performance Considerations

- **Embedding Generation**: Currently uses simplified hash-based embeddings for testing
- **Batch Operations**: Supports batch document ingestion for efficiency
- **Caching**: Consider implementing caching for frequently accessed documents
- **Rate Limiting**: Implements proper error handling for API rate limits

## Future Enhancements

1. **Real Embeddings**: Replace simplified embeddings with actual Gemini embeddings API
2. **Caching Layer**: Add Redis or in-memory caching for frequently accessed documents
3. **Batch Processing**: Implement batch processing for large document sets
4. **Analytics**: Add usage analytics and performance monitoring
5. **Backup/Restore**: Implement backup and restore functionality

## Requirements Satisfied

This implementation satisfies the following requirements from the specification:

- ✅ **6.1**: Pinecone index creation with appropriate dimensions for Gemini embeddings
- ✅ **6.2**: Document ingestion with proper metadata tagging for SOPs and training materials
- ✅ **6.5**: Document retrieval with citations and metadata filtering by document type

## Dependencies

- `@pinecone-database/pinecone`: Official Pinecone client library
- `vitest`: Testing framework
- TypeScript interfaces from `types.ts` and `service-interfaces.ts`