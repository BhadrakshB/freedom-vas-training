// Example usage of Scenario Creator Agent

import { ScenarioCreatorAgent, ScenarioCreationInput } from '../scenario-creator';
import { createPineconeService } from '../../pinecone-service';
import { Document } from '../../service-interfaces';

/**
 * Example: Setting up and using the Scenario Creator Agent
 */
export async function demonstrateScenarioCreator() {
  // Initialize Pinecone service
  const pineconeService = createPineconeService();
  await pineconeService.initialize();

  // Create scenario creator agent
  const scenarioCreator = new ScenarioCreatorAgent(pineconeService);

  // Example 1: Basic booking scenario
  console.log('=== Example 1: Basic Booking Scenario ===');
  const bookingInput: ScenarioCreationInput = {
    trainingObjective: 'Practice handling booking confirmations and payment verification',
    difficulty: 'beginner',
    category: 'booking'
  };

  try {
    const bookingResult = await scenarioCreator.createScenario(bookingInput);
    console.log('Generated Scenario:', JSON.stringify(bookingResult.scenario, null, 2));
    console.log('Confidence Score:', bookingResult.confidence);
    console.log('SOP References:', bookingResult.sopReferences.length);
  } catch (error) {
    console.error('Booking scenario creation failed:', error);
    
    // Fallback to basic scenario
    const fallbackResult = await scenarioCreator.createFallbackScenario(bookingInput);
    console.log('Fallback Scenario:', JSON.stringify(fallbackResult.scenario, null, 2));
  }

  // Example 2: Advanced complaint handling
  console.log('\n=== Example 2: Advanced Complaint Handling ===');
  const complaintInput: ScenarioCreationInput = {
    trainingObjective: 'Handle complex guest complaints with multiple issues requiring escalation',
    difficulty: 'advanced',
    category: 'complaint',
    specificSOPs: ['escalation procedures', 'compensation guidelines', 'guest communication']
  };

  try {
    const complaintResult = await scenarioCreator.createScenario(complaintInput);
    console.log('Generated Scenario:', JSON.stringify(complaintResult.scenario, null, 2));
    console.log('Confidence Score:', complaintResult.confidence);
    console.log('Retrieved SOPs:', complaintResult.sopReferences.map(ref => ref.metadata.category));
  } catch (error) {
    console.error('Complaint scenario creation failed:', error);
  }

  // Example 3: Overbooking crisis
  console.log('\n=== Example 3: Overbooking Crisis Management ===');
  const overbookingInput: ScenarioCreationInput = {
    trainingObjective: 'Manage overbooking situation during peak season with limited alternatives',
    difficulty: 'intermediate',
    category: 'overbooking'
  };

  try {
    const overbookingResult = await scenarioCreator.createScenario(overbookingInput);
    console.log('Generated Scenario:', JSON.stringify(overbookingResult.scenario, null, 2));
    console.log('Time Pressure Level:', overbookingResult.scenario.time_pressure);
    console.log('Critical Errors to Avoid:', overbookingResult.scenario.critical_errors);
  } catch (error) {
    console.error('Overbooking scenario creation failed:', error);
  }
}

/**
 * Example: Batch scenario creation for training curriculum
 */
export async function createTrainingCurriculum() {
  const pineconeService = createPineconeService();
  await pineconeService.initialize();
  const scenarioCreator = new ScenarioCreatorAgent(pineconeService);

  const curriculumInputs: ScenarioCreationInput[] = [
    {
      trainingObjective: 'Basic guest check-in process',
      difficulty: 'beginner',
      category: 'booking'
    },
    {
      trainingObjective: 'Handle payment issues during booking',
      difficulty: 'intermediate',
      category: 'booking'
    },
    {
      trainingObjective: 'Manage angry guest with multiple complaints',
      difficulty: 'advanced',
      category: 'complaint'
    },
    {
      trainingObjective: 'Emergency overbooking during holiday weekend',
      difficulty: 'advanced',
      category: 'overbooking'
    }
  ];

  console.log('=== Creating Training Curriculum ===');
  const curriculum = [];

  for (const [index, input] of curriculumInputs.entries()) {
    try {
      console.log(`\nCreating scenario ${index + 1}/${curriculumInputs.length}...`);
      const result = await scenarioCreator.createScenario(input);
      
      curriculum.push({
        id: `scenario_${index + 1}`,
        input,
        scenario: result.scenario,
        confidence: result.confidence,
        sopCount: result.sopReferences.length
      });

      console.log(`✓ Created: "${result.scenario.title}" (confidence: ${result.confidence})`);
    } catch (error) {
      console.error(`✗ Failed to create scenario ${index + 1}:`, error);
      
      // Use fallback
      const fallback = await scenarioCreator.createFallbackScenario(input);
      curriculum.push({
        id: `scenario_${index + 1}_fallback`,
        input,
        scenario: fallback.scenario,
        confidence: fallback.confidence,
        sopCount: 0
      });
    }
  }

  console.log('\n=== Curriculum Summary ===');
  curriculum.forEach((item, index) => {
    console.log(`${index + 1}. ${item.scenario.title}`);
    console.log(`   Difficulty: ${item.input.difficulty}`);
    console.log(`   Category: ${item.input.category}`);
    console.log(`   Confidence: ${item.confidence}`);
    console.log(`   Steps: ${item.scenario.required_steps.length}`);
    console.log(`   Critical Errors: ${item.scenario.critical_errors.length}`);
    console.log('');
  });

  return curriculum;
}

/**
 * Example: Testing scenario quality with different SOP availability
 */
export async function testScenarioQuality() {
  const pineconeService = createPineconeService();
  await pineconeService.initialize();
  const scenarioCreator = new ScenarioCreatorAgent(pineconeService);

  // First, let's ingest some sample SOPs
  const sampleSOPs: Document[] = [
    {
      id: 'booking_sop_001',
      content: 'All booking confirmations must include: guest name verification, payment method validation, property availability check, and confirmation email with check-in instructions.',
      metadata: {
        type: 'sop',
        category: 'booking',
        difficulty: 'beginner',
        tags: ['booking', 'confirmation', 'verification']
      }
    },
    {
      id: 'complaint_sop_001',
      content: 'When handling guest complaints: 1) Listen actively and acknowledge concerns, 2) Apologize for the inconvenience, 3) Investigate the issue thoroughly, 4) Offer appropriate solutions or escalate to management, 5) Follow up to ensure resolution.',
      metadata: {
        type: 'sop',
        category: 'complaint',
        difficulty: 'intermediate',
        tags: ['complaint', 'resolution', 'escalation']
      }
    },
    {
      id: 'overbooking_sop_001',
      content: 'Overbooking protocol: Immediately contact affected guests, offer alternative accommodations of equal or higher value, provide transportation if needed, offer compensation (one night free stay or equivalent credit), document incident for management review.',
      metadata: {
        type: 'sop',
        category: 'overbooking',
        difficulty: 'advanced',
        tags: ['overbooking', 'compensation', 'alternatives']
      }
    }
  ];

  console.log('=== Ingesting Sample SOPs ===');
  await pineconeService.ingestSOPs(sampleSOPs);
  console.log('✓ SOPs ingested successfully');

  // Test scenario creation with good SOP coverage
  console.log('\n=== Testing Scenario Quality ===');
  const testInput: ScenarioCreationInput = {
    trainingObjective: 'Handle booking confirmation with payment verification',
    difficulty: 'beginner',
    category: 'booking'
  };

  const result = await scenarioCreator.createScenario(testInput);
  
  console.log('Scenario Quality Metrics:');
  console.log(`- Title: "${result.scenario.title}"`);
  console.log(`- Description length: ${result.scenario.description.length} characters`);
  console.log(`- Required steps: ${result.scenario.required_steps.length}`);
  console.log(`- Critical errors: ${result.scenario.critical_errors.length}`);
  console.log(`- Time pressure: ${result.scenario.time_pressure}/10`);
  console.log(`- Confidence score: ${result.confidence}`);
  console.log(`- SOP references: ${result.sopReferences.length}`);
  
  // Analyze SOP grounding
  console.log('\nSOP Grounding Analysis:');
  result.sopReferences.forEach((ref, index) => {
    console.log(`${index + 1}. Category: ${ref.metadata.category}, Score: ${ref.score.toFixed(3)}`);
    console.log(`   Content preview: ${ref.content.substring(0, 100)}...`);
  });

  return result;
}

// Export for use in other examples
export { ScenarioCreatorAgent, ScenarioCreationInput };