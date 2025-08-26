// Example usage of Persona Generator Agent

import { PersonaGeneratorAgent, PersonaGenerationInput } from '../persona-generator';
import { ScenarioData } from '../../types';

/**
 * Example: Basic persona generation for a simple scenario
 */
export async function basicPersonaGeneration() {
  const agent = new PersonaGeneratorAgent();

  const scenario: ScenarioData = {
    title: 'WiFi Connection Issue',
    description: 'A guest is having trouble connecting to the WiFi and needs assistance',
    required_steps: [
      'Acknowledge the issue',
      'Provide WiFi credentials',
      'Offer troubleshooting steps',
      'Escalate if needed'
    ],
    critical_errors: [
      'Not providing correct credentials',
      'Being dismissive of the problem'
    ],
    time_pressure: 4
  };

  const input: PersonaGenerationInput = {
    scenario,
    trainingLevel: 'beginner',
    personalityType: 'cooperative'
  };

  try {
    const result = await agent.generatePersona(input);
    
    console.log('Generated Persona:');
    console.log(`Name: ${result.persona.name}`);
    console.log(`Background: ${result.persona.background}`);
    console.log(`Personality Traits: ${result.persona.personality_traits.join(', ')}`);
    console.log(`Communication Style: ${result.persona.communication_style}`);
    console.log(`Emotional Arc: ${result.persona.emotional_arc.join(' → ')}`);
    console.log(`Consistency Score: ${result.consistency}`);
    
    return result;
  } catch (error) {
    console.error('Persona generation failed:', error);
    
    // Use fallback persona
    const fallbackResult = agent.createFallbackPersona(input);
    console.log('Using fallback persona:', fallbackResult.persona.name);
    return fallbackResult;
  }
}

/**
 * Example: Advanced persona generation with specific challenges
 */
export async function advancedPersonaGeneration() {
  const agent = new PersonaGeneratorAgent();

  const complexScenario: ScenarioData = {
    title: 'Overbooking Crisis Resolution',
    description: 'Multiple guests arrive to find their reservations conflict, requiring immediate resolution during peak season',
    required_steps: [
      'Remain calm and professional',
      'Acknowledge all parties',
      'Investigate booking records',
      'Offer alternative accommodations',
      'Provide compensation if appropriate',
      'Document the incident',
      'Follow up with all affected guests'
    ],
    critical_errors: [
      'Showing panic or stress',
      'Blaming guests or system',
      'Not offering adequate solutions',
      'Failing to document properly'
    ],
    time_pressure: 9
  };

  const input: PersonaGenerationInput = {
    scenario: complexScenario,
    trainingLevel: 'advanced',
    personalityType: 'difficult',
    specificChallenges: [
      'Language barrier',
      'Cultural differences',
      'Time pressure from flight schedules',
      'Group booking complications'
    ]
  };

  const result = await agent.generatePersona(input);
  
  console.log('\n=== Advanced Persona Generation ===');
  console.log(`Name: ${result.persona.name}`);
  console.log(`Hidden Motivations: ${result.persona.hidden_motivations.join(', ')}`);
  console.log(`Psychological Profile:`);
  console.log(`  Primary Motivation: ${result.psychologicalProfile.primaryMotivation}`);
  console.log(`  Stress Response: ${result.psychologicalProfile.stressResponse}`);
  console.log(`  Emotional Triggers: ${result.psychologicalProfile.emotionalTriggers.join(', ')}`);
  
  return result;
}

/**
 * Example: Persona consistency validation during conversation
 */
export async function personaConsistencyExample() {
  const agent = new PersonaGeneratorAgent();

  const scenario: ScenarioData = {
    title: 'Noise Complaint',
    description: 'A guest is complaining about noise from neighboring rooms affecting their sleep',
    required_steps: [
      'Listen to the complaint',
      'Apologize for the disturbance',
      'Investigate the source',
      'Take corrective action',
      'Follow up'
    ],
    critical_errors: [
      'Dismissing the complaint',
      'Not taking action'
    ],
    time_pressure: 6
  };

  const input: PersonaGenerationInput = {
    scenario,
    trainingLevel: 'intermediate',
    personalityType: 'emotional'
  };

  const result = await agent.generatePersona(input);
  
  console.log('\n=== Persona Consistency Validation ===');
  console.log(`Generated persona: ${result.persona.name}`);
  console.log(`Communication style: ${result.persona.communication_style}`);
  
  // Simulate a conversation
  const conversationHistory = [
    "I'm really frustrated about the noise coming from the room next door!",
    "It's been going on for hours and I can't sleep.",
    "This is completely unacceptable for the price I'm paying.",
    "I need this resolved immediately or I want a refund!"
  ];
  
  const consistencyCheck = agent.validatePersonaConsistency(result.persona, conversationHistory);
  
  console.log(`Consistency check: ${consistencyCheck.consistent ? 'PASSED' : 'FAILED'}`);
  if (!consistencyCheck.consistent) {
    console.log(`Issues found: ${consistencyCheck.issues.join(', ')}`);
  }
  
  return { result, consistencyCheck };
}

/**
 * Example: Generating multiple personas for the same scenario
 */
export async function multiplePersonaGeneration() {
  const agent = new PersonaGeneratorAgent();

  const scenario: ScenarioData = {
    title: 'Check-out Extension Request',
    description: 'A guest wants to extend their checkout time due to a delayed flight',
    required_steps: [
      'Check availability',
      'Explain policies',
      'Offer solutions',
      'Confirm arrangements'
    ],
    critical_errors: [
      'Refusing without checking',
      'Not explaining options'
    ],
    time_pressure: 5
  };

  const personalityTypes: Array<'cooperative' | 'difficult' | 'neutral' | 'emotional'> = [
    'cooperative',
    'difficult',
    'neutral',
    'emotional'
  ];

  console.log('\n=== Multiple Persona Generation ===');
  
  const personas = await Promise.all(
    personalityTypes.map(async (personalityType) => {
      const input: PersonaGenerationInput = {
        scenario,
        trainingLevel: 'intermediate',
        personalityType
      };
      
      const result = await agent.generatePersona(input);
      
      console.log(`\n${personalityType.toUpperCase()} Persona:`);
      console.log(`  Name: ${result.persona.name}`);
      console.log(`  Key Traits: ${result.persona.personality_traits.slice(0, 3).join(', ')}`);
      console.log(`  Communication: ${result.persona.communication_style.substring(0, 80)}...`);
      console.log(`  Consistency: ${result.consistency}`);
      
      return result;
    })
  );

  return personas;
}

/**
 * Example: Error handling and fallback usage
 */
export async function errorHandlingExample() {
  const agent = new PersonaGeneratorAgent('invalid-api-key'); // Intentionally invalid

  const scenario: ScenarioData = {
    title: 'Test Scenario',
    description: 'A test scenario for error handling',
    required_steps: ['Test step'],
    critical_errors: ['Test error'],
    time_pressure: 5
  };

  const input: PersonaGenerationInput = {
    scenario,
    trainingLevel: 'beginner'
  };

  console.log('\n=== Error Handling Example ===');
  
  try {
    const result = await agent.generatePersona(input);
    console.log('Unexpected success:', result.persona.name);
    return result;
  } catch (error) {
    console.log('Expected error occurred:', error.message);
    
    // Use fallback
    const fallbackResult = agent.createFallbackPersona(input);
    console.log('Fallback persona created:', fallbackResult.persona.name);
    console.log('Fallback consistency:', fallbackResult.consistency);
    
    return fallbackResult;
  }
}

// Export all examples for easy testing
export const examples = {
  basicPersonaGeneration,
  advancedPersonaGeneration,
  personaConsistencyExample,
  multiplePersonaGeneration,
  errorHandlingExample
};

// Main execution function for testing
export async function runAllExamples() {
  console.log('=== Persona Generator Agent Examples ===\n');
  
  try {
    await basicPersonaGeneration();
    await advancedPersonaGeneration();
    await personaConsistencyExample();
    await multiplePersonaGeneration();
    await errorHandlingExample();
    
    console.log('\n=== All examples completed ===');
  } catch (error) {
    console.error('Example execution failed:', error);
  }
}

// Uncomment to run examples directly
// runAllExamples();