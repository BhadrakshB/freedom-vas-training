// Example usage of PineconeService for AI Training Simulator

import { PineconeService, createPineconeService } from '../pinecone-service';
import { Document } from '../service-interfaces';

/**
 * Example: Setting up and using PineconeService
 */
export async function examplePineconeUsage() {
  // Create a new PineconeService instance
  const pineconeService = createPineconeService(
    process.env.PINECONE_API_KEY,
    'ai-training-simulator'
  );

  try {
    // Initialize the service
    await pineconeService.initialize();
    console.log('✅ Pinecone service initialized successfully');

    // Check health
    const isHealthy = await pineconeService.healthCheck();
    console.log(`🏥 Health check: ${isHealthy ? 'Healthy' : 'Unhealthy'}`);

    // Example SOP documents to ingest
    const sopDocuments: Document[] = [
      {
        id: 'booking-confirmation-sop',
        content: 'When a guest makes a booking, always confirm the dates, number of guests, and special requests. Send a confirmation email within 15 minutes.',
        metadata: {
          type: 'sop',
          category: 'booking',
          difficulty: 'beginner',
          tags: ['confirmation', 'email', 'booking']
        }
      },
      {
        id: 'complaint-handling-sop',
        content: 'For guest complaints: 1) Listen actively, 2) Acknowledge the issue, 3) Apologize sincerely, 4) Offer solutions, 5) Follow up within 24 hours.',
        metadata: {
          type: 'sop',
          category: 'complaint',
          difficulty: 'intermediate',
          tags: ['complaint', 'customer-service', 'escalation']
        }
      }
    ];

    // Ingest SOP documents
    await pineconeService.ingestSOPs(sopDocuments);
    console.log('📚 SOP documents ingested successfully');

    // Example training materials
    const trainingMaterials: Document[] = [
      {
        id: 'empathy-training',
        content: 'Practice active listening by paraphrasing guest concerns and using empathetic language like "I understand how frustrating this must be for you."',
        metadata: {
          type: 'best_practice',
          category: 'general',
          difficulty: 'beginner',
          tags: ['empathy', 'communication', 'active-listening']
        }
      }
    ];

    // Ingest training materials
    await pineconeService.ingestTrainingMaterials(trainingMaterials);
    console.log('🎓 Training materials ingested successfully');

    // Retrieve relevant SOPs for a booking scenario
    const bookingSOPs = await pineconeService.retrieveRelevantSOPs(
      'guest wants to confirm their reservation',
      { category: 'booking', difficulty: 'beginner' }
    );
    console.log('🔍 Retrieved booking SOPs:', bookingSOPs.length);

    // Search for policy guidance based on user response
    const policyGuidance = await pineconeService.searchPolicyGuidance(
      'The guest is upset about their room not being ready'
    );
    console.log('📋 Found policy guidance:', policyGuidance.length);

    // Retrieve training content for complaint scenarios
    const trainingContent = await pineconeService.retrieveTrainingContent(
      'handling guest complaints',
      'intermediate'
    );
    console.log('📖 Retrieved training content:', trainingContent.length);

    // Get index statistics
    const stats = await pineconeService.getIndexStats();
    console.log('📊 Index statistics:', stats);

    return {
      success: true,
      message: 'Pinecone service example completed successfully',
      results: {
        bookingSOPs: bookingSOPs.length,
        policyGuidance: policyGuidance.length,
        trainingContent: trainingContent.length,
        indexStats: stats
      }
    };

  } catch (error) {
    console.error('❌ Error in Pinecone service example:', error);
    return {
      success: false,
      message: `Error: ${error}`,
      results: null
    };
  }
}

/**
 * Example: Document management operations
 */
export async function exampleDocumentManagement() {
  const pineconeService = createPineconeService();
  
  try {
    await pineconeService.initialize();

    // Tag an existing document with additional metadata
    await pineconeService.tagDocument('booking-confirmation-sop', {
      type: 'sop',
      category: 'booking',
      difficulty: 'advanced', // Updated difficulty
      tags: ['confirmation', 'email', 'booking', 'updated'] // Added 'updated' tag
    });
    console.log('🏷️ Document tagged successfully');

    // Delete specific documents
    await pineconeService.deleteDocuments(['old-document-1', 'old-document-2']);
    console.log('🗑️ Documents deleted successfully');

    return { success: true, message: 'Document management completed' };

  } catch (error) {
    console.error('❌ Error in document management:', error);
    return { success: false, message: `Error: ${error}` };
  }
}

/**
 * Example: Error handling and recovery
 */
export async function exampleErrorHandling() {
  const pineconeService = createPineconeService('invalid-api-key', 'test-index');

  try {
    // This should fail with invalid API key
    await pineconeService.initialize();
    
  } catch (error) {
    console.log('✅ Expected error caught:', error);
    
    // Health check should return false
    const isHealthy = await pineconeService.healthCheck();
    console.log(`🏥 Health check with invalid config: ${isHealthy}`);
    
    return {
      success: true,
      message: 'Error handling example completed - errors were properly caught'
    };
  }
}

// Export for use in other parts of the application
export { PineconeService, createPineconeService };