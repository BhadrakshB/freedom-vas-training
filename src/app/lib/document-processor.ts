// import { DocumentMetadata, DocumentEmbeddingError, ProcessedDocument, DocumentChunk } from './types';

// /**
//  * Configuration options for document processing
//  */
// export interface DocumentProcessorOptions {
//   chunkSize?: number;
//   chunkOverlap?: number;
//   minChunkSize?: number;
//   maxChunkSize?: number;
//   respectSentenceBoundaries?: boolean;
//   respectParagraphBoundaries?: boolean;
//   preserveFormatting?: boolean;
// }

// /**
//  * Input document interface for processing
//  */
// export interface InputDocument {
//   id: string;
//   content: string;
//   metadata: DocumentMetadata;
// }

// /**
//  * DocumentProcessor handles text preprocessing, cleaning, normalization, and intelligent chunking
//  * for documents before they are sent for embedding generation.
//  */
// export class DocumentProcessor {
//   private readonly options: Required<DocumentProcessorOptions>;

//   constructor(options: DocumentProcessorOptions = {}) {
//     this.options = {
//       chunkSize: options.chunkSize ?? 1000,
//       chunkOverlap: options.chunkOverlap ?? 100,
//       minChunkSize: options.minChunkSize ?? 100,
//       maxChunkSize: options.maxChunkSize ?? 2000,
//       respectSentenceBoundaries: options.respectSentenceBoundaries ?? true,
//       respectParagraphBoundaries: options.respectParagraphBoundaries ?? true,
//       preserveFormatting: options.preserveFormatting ?? false,
//     };

//     this.validateOptions();
//   }

//   /**
//    * Process a single document: clean, normalize, and chunk the content
//    */
//   async processDocument(document: InputDocument): Promise<ProcessedDocument> {
//     try {
//       // Validate input document
//       this.validateDocument(document);

//       // Validate and normalize metadata
//       const normalizedMetadata = this.validateAndNormalizeMetadata(document.metadata);

//       // Clean and normalize text content
//       const cleanedContent = this.cleanAndNormalizeText(document.content);

//       // Generate chunks with embeddings placeholder
//       const chunks = this.chunkText(cleanedContent);

//       // Calculate total tokens (rough estimation: 1 token ≈ 4 characters)
//       const totalTokens = Math.ceil(cleanedContent.length / 4);

//       return {
//         id: document.id,
//         chunks: chunks.map((chunk, index) => ({
//           content: chunk,
//           embedding: [], // Will be filled by the embedding adapter
//           chunkIndex: index,
//           tokenCount: Math.ceil(chunk.length / 4),
//         })),
//         metadata: normalizedMetadata,
//         totalTokens,
//       };
//     } catch (error) {
//       throw new DocumentEmbeddingError(
//         'PROCESSING_ERROR',
//         `Failed to process document ${document.id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
//         false,
//         { documentId: document.id },
//         error instanceof Error ? error : undefined
//       );
//     }
//   }

//   /**
//    * Process multiple documents in batch
//    */
//   async processDocuments(documents: InputDocument[]): Promise<ProcessedDocument[]> {
//     const results: ProcessedDocument[] = [];
//     const errors: { document: InputDocument; error: Error }[] = [];

//     for (const document of documents) {
//       try {
//         const processed = await this.processDocument(document);
//         results.push(processed);
//       } catch (error) {
//         errors.push({ document, error: error as Error });
//       }
//     }

//     // If there were errors, include them in the error details
//     if (errors.length > 0) {
//       const errorDetails = errors.map(({ document, error }) => ({
//         documentId: document.id,
//         error: error.message,
//       }));

//       // If all documents failed, throw an error
//       if (results.length === 0) {
//         throw new DocumentEmbeddingError(
//           'PROCESSING_ERROR',
//           `Failed to process all ${documents.length} documents`,
//           false,
//           { errors: errorDetails }
//         );
//       }

//       // If some documents failed, log the errors but continue with successful ones
//       console.warn(`Failed to process ${errors.length} out of ${documents.length} documents:`, errorDetails);
//     }

//     return results;
//   }

//   /**
//    * Clean and normalize text content
//    */
//   private cleanAndNormalizeText(content: string): string {
//     if (!content || typeof content !== 'string') {
//       throw new DocumentEmbeddingError(
//         'VALIDATION_ERROR',
//         'Document content must be a non-empty string',
//         false
//       );
//     }

//     let cleaned = content;

//     if (!this.options.preserveFormatting) {
//       // Normalize whitespace
//       cleaned = cleaned.replace(/\s+/g, ' ');
      
//       // Remove excessive line breaks
//       cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
      
//       // Clean up common formatting artifacts
//       cleaned = cleaned.replace(/\r\n/g, '\n'); // Normalize line endings
//       cleaned = cleaned.replace(/\t/g, ' '); // Replace tabs with spaces
//     }

//     // Remove leading/trailing whitespace
//     cleaned = cleaned.trim();

//     // Remove null characters and other control characters (except newlines and tabs if preserving formatting)
//     cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

//     if (!cleaned) {
//       throw new DocumentEmbeddingError(
//         'VALIDATION_ERROR',
//         'Document content is empty after cleaning',
//         false
//       );
//     }

//     return cleaned;
//   }

//   /**
//    * Intelligent text chunking that respects sentence and paragraph boundaries
//    */
//   private chunkText(content: string): string[] {
//     if (content.length <= this.options.chunkSize) {
//       return [content];
//     }

//     const chunks: string[] = [];
//     let currentChunk = '';
//     let position = 0;

//     // Split by paragraphs first if respecting paragraph boundaries
//     const paragraphs = this.options.respectParagraphBoundaries 
//       ? content.split(/\n\s*\n/).filter(p => p.trim())
//       : [content];

//     for (const paragraph of paragraphs) {
//       const sentences = this.options.respectSentenceBoundaries
//         ? this.splitIntoSentences(paragraph)
//         : [paragraph];

//       for (const sentence of sentences) {
//         const trimmedSentence = sentence.trim();
//         if (!trimmedSentence) continue;

//         // If adding this sentence would exceed chunk size, finalize current chunk
//         if (currentChunk && (currentChunk.length + trimmedSentence.length + 1) > this.options.chunkSize) {
//           if (currentChunk.length >= this.options.minChunkSize) {
//             chunks.push(currentChunk.trim());
            
//             // Start new chunk with overlap from previous chunk
//             currentChunk = this.createOverlap(currentChunk, trimmedSentence);
//           } else {
//             // Current chunk is too small, just add the sentence
//             currentChunk += (currentChunk ? ' ' : '') + trimmedSentence;
//           }
//         } else {
//           // Add sentence to current chunk
//           currentChunk += (currentChunk ? ' ' : '') + trimmedSentence;
//         }

//         // If sentence itself is too long, split it further
//         if (currentChunk.length > this.options.maxChunkSize) {
//           const splitChunks = this.splitLongText(currentChunk);
//           chunks.push(...splitChunks.slice(0, -1));
//           currentChunk = splitChunks[splitChunks.length - 1];
//         }
//       }
//     }

//     // Add the final chunk if it has content
//     if (currentChunk.trim() && currentChunk.length >= this.options.minChunkSize) {
//       chunks.push(currentChunk.trim());
//     }

//     return chunks.length > 0 ? chunks : [content];
//   }

//   /**
//    * Split text into sentences using common sentence boundaries
//    */
//   private splitIntoSentences(text: string): string[] {
//     // Simple sentence splitting - can be enhanced with more sophisticated NLP
//     const sentences = text.split(/(?<=[.!?])\s+(?=[A-Z])/);
//     return sentences.filter(s => s.trim().length > 0);
//   }

//   /**
//    * Create overlap between chunks to maintain context
//    */
//   private createOverlap(previousChunk: string, nextSentence: string): string {
//     if (this.options.chunkOverlap <= 0) {
//       return nextSentence;
//     }

//     // Get the last part of the previous chunk for overlap
//     const overlapLength = Math.min(this.options.chunkOverlap, previousChunk.length);
//     const overlapStart = previousChunk.length - overlapLength;
    
//     // Try to find a good boundary for overlap (sentence or word boundary)
//     let overlapText = previousChunk.substring(overlapStart);
    
//     // Try to start overlap at a sentence boundary
//     const sentenceMatch = overlapText.match(/[.!?]\s+(.+)$/);
//     if (sentenceMatch) {
//       overlapText = sentenceMatch[1];
//     } else {
//       // Fall back to word boundary
//       const wordMatch = overlapText.match(/\s+(.+)$/);
//       if (wordMatch) {
//         overlapText = wordMatch[1];
//       }
//     }

//     return overlapText + ' ' + nextSentence;
//   }

//   /**
//    * Split text that's too long even for a single chunk
//    */
//   private splitLongText(text: string): string[] {
//     const chunks: string[] = [];
//     let remaining = text;

//     while (remaining.length > this.options.maxChunkSize) {
//       let splitPoint = this.options.maxChunkSize;
      
//       // Try to find a good split point (sentence boundary)
//       const sentenceBoundary = remaining.lastIndexOf('.', splitPoint);
//       if (sentenceBoundary > splitPoint * 0.7) {
//         splitPoint = sentenceBoundary + 1;
//       } else {
//         // Fall back to word boundary
//         const wordBoundary = remaining.lastIndexOf(' ', splitPoint);
//         if (wordBoundary > splitPoint * 0.7) {
//           splitPoint = wordBoundary;
//         }
//       }

//       chunks.push(remaining.substring(0, splitPoint).trim());
//       remaining = remaining.substring(splitPoint).trim();
//     }

//     if (remaining) {
//       chunks.push(remaining);
//     }

//     return chunks;
//   }

//   /**
//    * Validate and normalize document metadata
//    */
//   private validateAndNormalizeMetadata(metadata: DocumentMetadata): DocumentMetadata {
//     if (!metadata || typeof metadata !== 'object') {
//       throw new DocumentEmbeddingError(
//         'VALIDATION_ERROR',
//         'Document metadata must be a valid object',
//         false
//       );
//     }

//     // Validate required fields
//     const validTypes = ['sop', 'script', 'best_practice'] as const;
//     const validCategories = ['booking', 'complaint', 'overbooking', 'general'] as const;
//     const validDifficulties = ['beginner', 'intermediate', 'advanced'] as const;

//     if (!validTypes.includes(metadata.type)) {
//       throw new DocumentEmbeddingError(
//         'VALIDATION_ERROR',
//         `Invalid metadata type: ${metadata.type}. Must be one of: ${validTypes.join(', ')}`,
//         false
//       );
//     }

//     if (!validCategories.includes(metadata.category)) {
//       throw new DocumentEmbeddingError(
//         'VALIDATION_ERROR',
//         `Invalid metadata category: ${metadata.category}. Must be one of: ${validCategories.join(', ')}`,
//         false
//       );
//     }

//     if (!validDifficulties.includes(metadata.difficulty)) {
//       throw new DocumentEmbeddingError(
//         'VALIDATION_ERROR',
//         `Invalid metadata difficulty: ${metadata.difficulty}. Must be one of: ${validDifficulties.join(', ')}`,
//         false
//       );
//     }

//     // Normalize tags
//     const normalizedTags = Array.isArray(metadata.tags) 
//       ? metadata.tags.filter(tag => typeof tag === 'string' && tag.trim()).map(tag => tag.trim().toLowerCase())
//       : [];

//     return {
//       type: metadata.type,
//       category: metadata.category,
//       difficulty: metadata.difficulty,
//       tags: normalizedTags,
//     };
//   }

//   /**
//    * Validate input document structure
//    */
//   private validateDocument(document: InputDocument): void {
//     if (!document || typeof document !== 'object') {
//       throw new DocumentEmbeddingError(
//         'VALIDATION_ERROR',
//         'Document must be a valid object',
//         false
//       );
//     }

//     if (!document.id || typeof document.id !== 'string') {
//       throw new DocumentEmbeddingError(
//         'VALIDATION_ERROR',
//         'Document must have a valid string ID',
//         false
//       );
//     }

//     if (!document.content || typeof document.content !== 'string') {
//       throw new DocumentEmbeddingError(
//         'VALIDATION_ERROR',
//         'Document must have valid string content',
//         false
//       );
//     }

//     if (!document.metadata) {
//       throw new DocumentEmbeddingError(
//         'VALIDATION_ERROR',
//         'Document must have metadata',
//         false
//       );
//     }
//   }

//   /**
//    * Validate processor options
//    */
//   private validateOptions(): void {
//     if (this.options.chunkSize <= 0) {
//       throw new DocumentEmbeddingError(
//         'VALIDATION_ERROR',
//         'Chunk size must be greater than 0',
//         false
//       );
//     }

//     if (this.options.chunkOverlap < 0) {
//       throw new DocumentEmbeddingError(
//         'VALIDATION_ERROR',
//         'Chunk overlap cannot be negative',
//         false
//       );
//     }

//     if (this.options.chunkOverlap >= this.options.chunkSize) {
//       throw new DocumentEmbeddingError(
//         'VALIDATION_ERROR',
//         'Chunk overlap must be less than chunk size',
//         false
//       );
//     }

//     if (this.options.minChunkSize <= 0) {
//       throw new DocumentEmbeddingError(
//         'VALIDATION_ERROR',
//         'Minimum chunk size must be greater than 0',
//         false
//       );
//     }

//     if (this.options.maxChunkSize <= this.options.chunkSize) {
//       throw new DocumentEmbeddingError(
//         'VALIDATION_ERROR',
//         'Maximum chunk size must be greater than chunk size',
//         false
//       );
//     }
//   }
// }