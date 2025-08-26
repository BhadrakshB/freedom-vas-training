# Persona Generator Agent

The Persona Generator Agent creates realistic guest personas for STR (Short-Term Rental) training scenarios. It generates psychologically consistent characters that challenge trainees while maintaining authentic behavior patterns throughout training sessions.

## Features

- **Psychological Depth Modeling**: Creates personas with realistic backgrounds, motivations, and emotional progression
- **Consistency Validation**: Ensures persona behavior remains consistent across multiple interactions
- **Training Level Adaptation**: Adjusts persona complexity based on trainee skill level
- **Personality Type Customization**: Supports cooperative, difficult, neutral, and emotional personality types
- **Challenge Integration**: Incorporates specific training challenges like language barriers or time pressure
- **JSON Schema Validation**: Validates all generated personas against strict schemas
- **Fallback Support**: Provides reliable fallback personas when generation fails

## Core Components

### PersonaGeneratorAgent Class

The main agent class that orchestrates persona generation:

```typescript
import { PersonaGeneratorAgent } from './agents/persona-generator';

const agent = new PersonaGeneratorAgent();
```

### Input Interface

```typescript
interface PersonaGenerationInput {
  scenario: ScenarioData;                    // The training scenario context
  trainingLevel: 'beginner' | 'intermediate' | 'advanced';
  personalityType?: 'cooperative' | 'difficult' | 'neutral' | 'emotional';
  specificChallenges?: string[];             // Additional challenges to incorporate
}
```

### Output Interface

```typescript
interface PersonaGenerationOutput {
  persona: PersonaData;                      // The generated persona
  consistency: number;                       // Consistency score (0-1)
  psychologicalProfile: PsychologicalProfile; // Underlying psychological model
}
```

## Usage Examples

### Basic Persona Generation

```typescript
const scenario = {
  title: 'WiFi Connection Issue',
  description: 'A guest needs help connecting to WiFi',
  required_steps: ['Acknowledge issue', 'Provide credentials', 'Troubleshoot'],
  critical_errors: ['Providing wrong info', 'Being dismissive'],
  time_pressure: 4
};

const input = {
  scenario,
  trainingLevel: 'beginner',
  personalityType: 'cooperative'
};

const result = await agent.generatePersona(input);
console.log(`Generated persona: ${result.persona.name}`);
```

### Advanced Persona with Challenges

```typescript
const input = {
  scenario: complexScenario,
  trainingLevel: 'advanced',
  personalityType: 'difficult',
  specificChallenges: [
    'Language barrier',
    'Cultural differences',
    'Time pressure'
  ]
};

const result = await agent.generatePersona(input);
```

### Persona Consistency Validation

```typescript
const conversationHistory = [
  "I'm frustrated about the noise!",
  "This is unacceptable!",
  "I need this resolved now!"
];

const consistencyCheck = agent.validatePersonaConsistency(
  result.persona,
  conversationHistory
);

if (!consistencyCheck.consistent) {
  console.log('Issues:', consistencyCheck.issues);
}
```

## Persona Data Structure

### PersonaData

```typescript
interface PersonaData {
  name: string;                    // Realistic first name
  background: string;              // Detailed background and context
  personality_traits: string[];    // Key personality characteristics
  hidden_motivations: string[];    // Underlying motivations driving behavior
  communication_style: string;     // How they prefer to communicate
  emotional_arc: string[];         // Emotional progression through interaction
}
```

### PsychologicalProfile

```typescript
interface PsychologicalProfile {
  primaryMotivation: string;       // What drives their behavior
  stressResponse: string;          // How they react under pressure
  communicationPattern: string;    // Their communication preferences
  emotionalTriggers: string[];     // What sets them off emotionally
  resolutionStyle: string;         // How they prefer problems solved
}
```

## Training Level Adaptation

The agent adapts persona complexity based on training level:

- **Beginner**: Simple, straightforward personas with clear motivations
- **Intermediate**: More complex personalities with multiple motivations
- **Advanced**: Sophisticated personas with conflicting motivations and subtle challenges

## Personality Types

### Cooperative
- Willing to work with the trainee
- Patient and understanding
- Provides clear information
- Responds well to professional service

### Difficult
- Challenging but realistic
- May be impatient or demanding
- Tests trainee's problem-solving skills
- Requires skilled handling

### Neutral
- Balanced approach
- Neither overly helpful nor difficult
- Realistic middle-ground behavior
- Good for standard training

### Emotional
- Heightened emotional responses
- May be upset, frustrated, or anxious
- Tests empathy and de-escalation skills
- Requires careful handling

## Consistency Scoring

The agent calculates consistency scores based on:

1. **Communication Alignment**: Does the persona's communication match their style?
2. **Trait Consistency**: Are personality traits reflected in behavior?
3. **Emotional Progression**: Does the emotional arc make sense?
4. **Motivation Alignment**: Do actions align with stated motivations?

Scores range from 0.0 to 1.0, with higher scores indicating better consistency.

## Error Handling

### Graceful Degradation
- Validates all generated content against schemas
- Provides detailed error messages for debugging
- Falls back to reliable default personas when generation fails

### Fallback Personas
```typescript
const fallbackResult = agent.createFallbackPersona(input);
// Always returns a valid, scenario-appropriate persona
```

## Validation

### Schema Validation
All personas are validated against strict JSON schemas:
- Required fields must be present
- String lengths must be within bounds
- Arrays must have appropriate item counts
- All content must be meaningful

### Type Validation
Runtime type checking ensures:
- All fields have correct types
- Arrays contain only strings
- Numeric values are within valid ranges

## Integration with Training System

The Persona Generator integrates with the broader training system:

1. **Scenario Input**: Receives scenarios from Scenario Creator Agent
2. **Guest Simulation**: Provides personas to Guest Simulator Agent
3. **Consistency Tracking**: Validates behavior throughout training sessions
4. **Feedback Integration**: Persona data informs feedback generation

## Testing

### Unit Tests
- Mock LLM responses for predictable testing
- Validate all input/output combinations
- Test error handling and edge cases
- Verify consistency scoring algorithms

### Integration Tests
- Real API integration with Gemini
- End-to-end persona generation workflows
- Cross-scenario persona variation testing
- Performance and reliability testing

## Configuration

### Agent Configuration
```typescript
// From service-interfaces.ts
personaGenerator: {
  temperature: 0.5,        // Balanced creativity and consistency
  maxTokens: 1024,         // Sufficient for detailed personas
  model: "gemini-1.5-flash"
}
```

### Environment Variables
- `GOOGLE_API_KEY`: Required for Gemini API access

## Best Practices

1. **Scenario Context**: Always provide rich scenario context for better personas
2. **Training Level**: Match persona complexity to trainee skill level
3. **Consistency Validation**: Regularly validate persona consistency during sessions
4. **Fallback Planning**: Always have fallback personas ready for production use
5. **Testing**: Test with various scenario types and personality combinations

## Troubleshooting

### Common Issues

**Low Consistency Scores**
- Check if psychological profile aligns with persona traits
- Ensure communication style matches personality
- Verify emotional arc makes psychological sense

**Generation Failures**
- Verify API key is valid and has quota
- Check network connectivity
- Review scenario input for completeness

**Validation Errors**
- Ensure all required fields are present
- Check string lengths are within bounds
- Verify arrays have minimum required items

### Debug Mode
Enable detailed logging by setting environment variables:
```bash
export DEBUG=persona-generator
export LOG_LEVEL=debug
```

## Performance Considerations

- **Generation Time**: Typically 2-5 seconds per persona
- **Token Usage**: ~800-1200 tokens per generation
- **Caching**: Consider caching personas for repeated scenarios
- **Batch Generation**: Generate multiple personas in parallel when possible

## Future Enhancements

- **Cultural Adaptation**: Personas adapted for different cultural contexts
- **Historical Learning**: Learn from successful persona patterns
- **Dynamic Adjustment**: Real-time persona adjustment based on trainee performance
- **Multi-language Support**: Generate personas in different languages