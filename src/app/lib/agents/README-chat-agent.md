# Chat Agent

The Chat Agent provides a conversational interface for users to interact with their training data and get personalized advice outside of active training sessions.

## Features

### User Session Analytics
- Access to all completed training sessions
- Performance metrics and trends analysis
- Scenario-specific performance tracking
- Recent activity monitoring

### Conversational Capabilities
- Natural language interaction about training progress
- Performance insights and recommendations
- Session comparisons and analysis
- General training advice and support

### Context-Aware Responses
- **General Chat**: Casual conversation about training
- **Performance Review**: Detailed analysis of scores and trends
- **Training Advice**: Specific recommendations for improvement
- **Session Analysis**: Deep dive into specific training sessions

## API Endpoints

### POST /api/chat
Send a message to the chat agent and receive a conversational response.

**Request Body:**
```json
{
  "message": "How am I doing with my training?",
  "userId": "user123",
  "context": "performance_review",
  "conversationHistory": [
    {
      "role": "user",
      "content": "Previous message",
      "timestamp": "2024-01-01T00:00:00Z"
    }
  ]
}
```

**Response:**
```json
{
  "response": "Based on your 5 completed sessions, you're doing great! Your average score is 78/100...",
  "suggestedActions": [
    "Try focusing on empathy skills in your next session",
    "Practice more complaint handling scenarios"
  ],
  "performanceInsights": {
    "totalSessions": 5,
    "averageScore": 78,
    "strongestSkill": "Policy Adherence",
    "improvementArea": "Empathy",
    "recentTrend": "improving",
    "recommendations": [
      "Focus on improving empathy skills",
      "Practice more training sessions to build consistency"
    ]
  }
}
```

### GET /api/chat
Retrieve user analytics and session data.

**Query Parameters:**
- `userId`: User identifier (required)
- `action`: Type of data to retrieve
  - `analytics`: Complete user analytics
  - `compare-sessions`: Compare recent sessions
  - `session-details`: Get specific session details

**Examples:**
```
GET /api/chat?userId=user123&action=analytics
GET /api/chat?userId=user123&action=compare-sessions&count=3
GET /api/chat?userId=user123&action=session-details&sessionId=session_123
```

## Usage in Components

### ChatInterface Component
The `ChatInterface` component provides a complete chat UI with:
- Message history display
- Performance insights visualization
- Suggested action buttons
- Context switching (general, performance review, etc.)

```tsx
import { ChatInterface } from '@/app/components';

function MyComponent() {
  return (
    <ChatInterface 
      userId="user123"
      className="h-96"
      onClose={() => console.log('Chat closed')}
    />
  );
}
```

## Performance Analytics

The chat agent provides comprehensive analytics including:

### Score Tracking
- Average scores across all dimensions
- Performance trends over time
- Strongest and weakest skills identification

### Session Analysis
- Most practiced scenarios
- Session frequency and patterns
- Recent activity metrics

### Personalized Recommendations
- Skill-specific improvement suggestions
- Training frequency recommendations
- Scenario-specific advice

## Integration with Training System

The chat agent seamlessly integrates with the existing training system:
- Accesses completed session data from SessionManager
- Uses the same scoring metrics as the training simulator
- Provides insights based on actual training performance
- Maintains conversation context across interactions

## Example Conversations

### Performance Review
**User:** "How am I doing with my training?"
**Agent:** "You've completed 8 training sessions with an average score of 82/100! Your strongest skill is Policy Adherence (89/100), and you're showing improvement in Empathy (+12 points over your last 3 sessions). I'd recommend focusing on Time Efficiency in your next sessions."

### Training Advice
**User:** "I keep struggling with complaint scenarios"
**Agent:** "I see you've done 3 complaint scenarios with an average score of 68/100. The main areas for improvement are Empathy (62/100) and Completeness (65/100). Try acknowledging the customer's frustration early and ensuring you address all their concerns before offering solutions."

### Session Analysis
**User:** "Tell me about my last session"
**Agent:** "Your last session was 'Overbooked Flight Complaint' completed 2 days ago. You scored 75/100 overall, with strong Policy Adherence (85/100) but lower Empathy (60/100). The guest was frustrated about missing a wedding, and while you followed procedures correctly, there were opportunities to show more understanding of their emotional state."