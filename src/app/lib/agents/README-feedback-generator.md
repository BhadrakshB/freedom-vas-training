# Feedback Generator Agent

The Feedback Generator Agent provides comprehensive feedback for completed training sessions in the AI Training Simulator. It analyzes session performance, retrieves relevant SOP documents, and generates structured feedback with actionable recommendations.

## Features

### Comprehensive Feedback Generation
- **Overall Performance Assessment**: Provides grade (A-F), summary, and session completion metrics
- **Detailed Dimension Analysis**: Analyzes performance across 5 key dimensions:
  - Policy Adherence
  - Empathy & Emotional Intelligence  
  - Completeness & Thoroughness
  - Escalation Judgment
  - Time Efficiency

### RAG Integration
- **SOP Citation**: Retrieves and cites relevant Standard Operating Procedures
- **Policy Guidance**: Provides specific policy references with application examples
- **Context-Aware Retrieval**: Filters SOPs based on scenario type and performance gaps

### Actionable Recommendations
- **Prioritized Recommendations**: High/medium/low priority based on performance gaps
- **Specific Action Items**: Concrete steps for improvement
- **Expected Outcomes**: Clear benefits of following recommendations
- **Resource Suggestions**: Training materials and reference documents

## Usage

### Basic Usage

```typescript
import { FeedbackGeneratorAgent, FeedbackInput } from './agents/feedback-generator';
import { PineconeService } from './pinecone-service';

// Initialize with Pinecone service for RAG
const pineconeService = new PineconeService();
const feedbackAgent = new FeedbackGeneratorAgent('your-api-key', pineconeService);

// Prepare feedback input from completed session
const feedbackInput: FeedbackInput = {
  sessionId: 'session-123',
  scenario: scenarioData,
  persona: personaData,
  conversationHistory: messages,
  allScores: scoringMetrics,
  allEvidence: scoringEvidence,
  criticalErrors: [],
  completedSteps: ['step1', 'step2'],
  requiredSteps: ['step1', 'step2', 'step3'],
  overallScore: 85,
  sessionDuration: 300000 // 5 minutes in milliseconds
};

// Generate comprehensive feedback
const feedback = await feedbackAgent.generateFeedback(feedbackInput);

// Format for display
const formattedFeedback = feedbackAgent.formatFeedbackForDisplay(feedback);
console.log(formattedFeedback);
```

### Fallback Handling

```typescript
try {
  const feedback = await feedbackAgent.generateFeedback(input);
  return feedback;
} catch (error) {
  // Use fallback feedback when generation fails
  const fallbackFeedback = feedbackAgent.createFallbackFeedback(input);
  return fallbackFeedback;
}
```

## Input Requirements

### FeedbackInput Interface
```typescript
interface FeedbackInput {
  sessionId: string;                    // Unique session identifier
  scenario: ScenarioData;               // Training scenario details
  persona: PersonaData;                 // Guest persona information
  conversationHistory: BaseMessage[];   // Complete conversation transcript
  allScores: ScoringMetrics[];          // Scores from each turn
  allEvidence: ScoringEvidence[];       // Detailed scoring evidence
  criticalErrors: string[];             // Critical errors that occurred
  completedSteps: string[];             // Steps successfully completed
  requiredSteps: string[];              // All required scenario steps
  overallScore: number;                 // Final session score (0-100)
  sessionDuration: number;              // Session duration in milliseconds
}
```

## Output Structure

### FeedbackOutput Interface
```typescript
interface FeedbackOutput {
  overallPerformance: OverallPerformance;           // Grade, summary, key points
  detailedAnalysis: DetailedAnalysis;               // Per-dimension analysis
  sopCitations: SOPCitation[];                      // Relevant policy references
  actionableRecommendations: ActionableRecommendation[]; // Prioritized improvement suggestions
  resources: ResourceRecommendation[];             // Training materials and references
  nextSteps: string[];                              // Immediate action items
}
```

### Overall Performance
- **Grade**: A-F letter grade based on overall score
- **Summary**: 2-3 sentence performance overview
- **Key Strengths**: Top 3-4 demonstrated strengths
- **Primary Areas for Improvement**: 2-3 most critical improvement areas
- **Session Completion**: Steps completed, completion rate, critical error count

### Detailed Analysis
Each dimension includes:
- **Score**: Average score across all turns (0-100)
- **Trend**: Performance trend (improving/declining/stable)
- **Strengths**: Specific positive behaviors observed
- **Weaknesses**: Areas needing improvement
- **Specific Examples**: Positive and negative examples from conversation
- **Improvement Opportunities**: Targeted suggestions for growth

### SOP Citations
- **Section**: Policy category (e.g., "Overbooking Policy")
- **Content**: Relevant policy text excerpt
- **Relevance**: Why this policy applies to the session
- **Application Example**: How it should have been applied
- **Source**: Document source reference

### Actionable Recommendations
- **Category**: Type of recommendation (policy/communication/process/empathy/efficiency)
- **Priority**: Urgency level (high/medium/low)
- **Recommendation**: Clear improvement suggestion
- **Specific Actions**: Concrete steps to take
- **Expected Outcome**: Benefits of implementation
- **Related SOPs**: Relevant policy references

## Configuration

### Agent Configuration
```typescript
// From service-interfaces.ts
feedbackGenerator: {
  temperature: 0.3,    // Precise, educational tone
  maxTokens: 1024,     // Comprehensive feedback
  model: "gemini-1.5-flash"
}
```

### Grading Scale
- **A (90-100)**: Excellent performance, minimal improvement needed
- **B (80-89)**: Good performance with some areas for growth
- **C (70-79)**: Satisfactory performance, several improvement opportunities
- **D (60-69)**: Below expectations, significant improvement needed
- **F (<60)**: Unsatisfactory performance, major remediation required

## Error Handling

### Graceful Degradation
- **LLM Failures**: Throws error with detailed message
- **Pinecone Failures**: Continues without SOP context, logs warning
- **Parsing Errors**: Uses fallback values, maintains functionality

### Fallback Feedback
When generation fails completely:
- Provides basic performance summary
- Includes session completion metrics
- Offers generic improvement recommendations
- Maintains consistent output structure

## Testing

### Unit Tests
- Comprehensive feedback generation scenarios
- SOP citation accuracy and relevance
- Recommendation quality and prioritization
- Error handling and fallback behavior
- Output formatting and structure

### Integration Tests
- End-to-end feedback generation with realistic data
- RAG integration with Pinecone service
- Mixed performance scenario handling
- Critical error session feedback
- Display formatting validation

## Best Practices

### Input Preparation
- Ensure complete conversation history is provided
- Include all scoring evidence for accurate analysis
- Provide realistic session duration for time efficiency analysis
- Include scenario and persona context for relevant feedback

### Performance Optimization
- Limit SOP retrieval to top 8 most relevant documents
- Use appropriate temperature settings for consistent output
- Implement caching for frequently accessed SOPs
- Monitor token usage and adjust maxTokens as needed

### Quality Assurance
- Validate all required input fields before processing
- Verify SOP citations are accurate and relevant
- Ensure recommendations are specific and actionable
- Test with various performance levels and scenarios

## Dependencies

- **@langchain/google-genai**: LLM integration for feedback generation
- **@langchain/core/messages**: Message handling and conversation processing
- **PineconeService**: Vector database integration for SOP retrieval
- **Types**: Shared interfaces for data structures
- **Service Interfaces**: Agent configuration and service definitions