# Scenario Creator Agent

The Scenario Creator Agent is responsible for generating realistic training scenarios for STR (Short-Term Rental) virtual assistants. It uses RAG (Retrieval-Augmented Generation) to ground scenarios in company SOPs and policies.

## Features

- **RAG Integration**: Retrieves relevant SOPs from Pinecone vector database to ground scenarios in company policies
- **JSON Schema Validation**: Ensures generated scenarios meet quality standards and structural requirements
- **Difficulty Scaling**: Adjusts scenario complexity based on training level (beginner, intermediate, advanced)
- **Category Targeting**: Creates scenarios for specific categories (booking, complaint, overbooking, general)
- **Confidence Scoring**: Provides confidence metrics based on SOP retrieval quality
- **Fallback Scenarios**: Graceful degradation when SOP retrieval fails

## Usage

### Basic Usage

```typescript
import { ScenarioCreatorAgent, ScenarioCreationInput } from './scenario-creator';
import { createPineconeService } from '../pinecone-service';

// Initialize services
const pineconeService = createPineconeService();
await pineconeService.initialize();

const scenarioCreator = new ScenarioCreatorAgent(pineconeService);

// Create a scenario
const input: ScenarioCreationInput = {
  trainingObjective: 'Practice handling booking confirmations',
  difficulty: 'beginner',
  category: 'booking'
};

const result = await scenarioCreator.createScenario(input);
console.log('Generated Scenario:', result.scenario);
console.log('Confidence Score:', result.confidence);
```

### Advanced Usage with Specific SOPs

```typescript
const input: ScenarioCreationInput = {
  trainingObjective: 'Handle complex guest complaints with escalation',
  difficulty: 'advanced',
  category: 'complaint',
  specificSOPs: ['escalation procedures', 'compensation guidelines']
};

const result = await scenarioCreator.createScenario(input);
```

### Error Handling with Fallback

```typescript
try {
  const result = await scenarioCreator.createScenario(input);
  // Use the generated scenario
} catch (error) {
  console.error('Scenario creation failed:', error);
  
  // Use fallback scenario
  const fallback = await scenarioCreator.createFallbackScenario(input);
  console.log('Using fallback scenario:', fallback.scenario);
}
```

## Input Parameters

### ScenarioCreationInput

- `trainingObjective` (string): The learning goal for the scenario
- `difficulty` ('beginner' | 'intermediate' | 'advanced'): Training difficulty level
- `category` (optional): Scenario category ('booking' | 'complaint' | 'overbooking' | 'general')
- `specificSOPs` (optional): Array of specific SOP topics to include

## Output Structure

### ScenarioCreationOutput

- `scenario`: The generated scenario data
- `sopReferences`: Array of retrieved SOP documents used for grounding
- `confidence`: Confidence score (0-1) based on SOP retrieval quality

### ScenarioData

- `title`: Brief scenario title
- `description`: Detailed scenario setup
- `required_steps`: Array of steps the trainee should complete
- `critical_errors`: Array of errors that would fail the scenario
- `time_pressure`: Pressure level from 1 (low) to 10 (high)

## Validation

The agent performs comprehensive validation:

1. **JSON Schema Validation**: Ensures structural correctness
2. **Type Validation**: Verifies data types and constraints
3. **Content Quality**: Checks description length, step count, etc.
4. **Range Validation**: Ensures numeric values are within acceptable ranges

## Configuration

The agent uses configuration from `AGENT_CONFIGS.scenarioCreator`:

- **Temperature**: 0.3 (precise, policy-grounded responses)
- **Max Tokens**: 1024
- **Model**: gemini-1.5-flash

## Testing

Comprehensive test coverage includes:

- Unit tests for all core functionality
- Integration tests with Pinecone service
- Validation testing for edge cases
- Error handling and recovery scenarios
- Mock-based testing for external dependencies

Run tests with:
```bash
npm test -- src/app/lib/agents/__tests__/scenario-creator.test.ts
npm test -- src/app/lib/agents/__tests__/scenario-creator-integration.test.ts
```

## Requirements Satisfied

This implementation satisfies the following requirements from the specification:

- **1.1**: Generates scenarios with clear objectives and natural conclusion conditions
- **1.2**: Retrieves relevant SOP sections to ground scenarios in company policies
- **1.3**: Outputs structured JSON with all required fields
- **1.4**: Ensures scenarios test specific competencies without being unrealistic

## Architecture Integration

The Scenario Creator Agent integrates with:

- **Pinecone Service**: For SOP retrieval and knowledge grounding
- **LangGraph State**: Contributes scenario data to the training simulator state
- **Validation System**: Uses shared validation utilities
- **Agent Configuration**: Follows standardized agent configuration patterns

## Error Handling

The agent handles various error conditions:

- **Pinecone Connection Failures**: Graceful degradation with fallback scenarios
- **Invalid LLM Responses**: JSON parsing and validation with retry logic
- **Schema Validation Failures**: Clear error messages with specific validation issues
- **SOP Retrieval Issues**: Confidence scoring reflects retrieval quality

## Future Enhancements

Potential improvements:

- **Dynamic Difficulty Adjustment**: Adapt scenarios based on trainee performance history
- **Multi-language Support**: Generate scenarios in different languages
- **Scenario Templates**: Pre-built templates for common training situations
- **A/B Testing**: Compare scenario effectiveness across different approaches