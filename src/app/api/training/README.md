# Training API Endpoints

This directory contains REST API endpoints for the AI Training Simulator. These endpoints provide HTTP access to the training functions defined in `src/app/lib/actions/training-actions.ts`.

## Available Endpoints

### POST `/api/training/start`
Start a new training session with optional custom scenario and persona. Creates a new thread in the database and saves initial messages.

**Request Body:**
```json
{
  "userId": "string (required)",
  "title": "string (optional)",
  "scenario": {
    "scenario_title": "string",
    "business_context": "string", 
    "guest_situation": "string",
    "constraints_and_policies": ["string"],
    "expected_va_challenges": ["string"],
    "difficulty_level": "Easy" | "Medium" | "Hard",
    "success_criteria": ["string"]
  },
  "guestPersona": {
    "name": "string",
    "demographics": "string",
    "personality_traits": ["string"],
    "communication_style": "string",
    "emotional_tone": "string",
    "expectations": ["string"],
    "escalation_behavior": ["string"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "scenario": "ScenarioGeneratorSchema",
    "guestPersona": "PersonaGeneratorSchema", 
    "messages": "BaseMessage[]",
    "finalOutput": "MessageContent",
    "thread": "Thread",
    "savedMessages": "DBMessage[]",
    "threadId": "string"
  }
}
```

### POST `/api/training/update`
Update an existing training session with a new message. Saves new messages to the database and updates thread status.

**Request Body:**
```json
{
  "threadId": "string (required)",
  "scenario": "ScenarioGeneratorSchema (required)",
  "guestPersona": "PersonaGeneratorSchema (required)",
  "messages": "BaseMessage[] (required)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "scenario": "ScenarioGeneratorSchema",
    "guestPersona": "PersonaGeneratorSchema",
    "messages": "BaseMessage[]",
    "guestResponse": "MessageContent",
    "status": "TrainingStateType",
    "lastMessageRating": "MessageRatingSchema | null",
    "lastMessageRatingReason": "AlternativeSuggestionsSchema | null",
    "feedback": "FeedbackSchema",
    "savedMessages": "DBMessage[]",
    "updatedThread": "Thread",
    "threadId": "string"
  }
}
```

### POST `/api/training/end`
End a training session and generate final feedback. Completes the thread in the database with feedback data.

**Request Body:**
```json
{
  "threadId": "string (required)",
  "scenario": "ScenarioGeneratorSchema (required)",
  "guestPersona": "PersonaGeneratorSchema (required)", 
  "messages": "BaseMessage[] (required)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "feedback": "FeedbackSchema",
    "status": "TrainingStateType",
    "completedThread": "Thread",
    "threadId": "string"
  }
}
```

### POST `/api/training/refine-scenario`
Refine a scenario description using AI.

**Request Body:**
```json
{
  "scenario": "string (required)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "refinedScenario": "ScenarioGeneratorSchema",
    "originalScenario": "string"
  }
}
```

### POST `/api/training/refine-persona`
Refine a persona description using AI.

**Request Body:**
```json
{
  "persona": "string (required)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "refinedPersona": "PersonaGeneratorSchema",
    "originalPersona": "string"
  }
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "errorType": "validation" | "server" | "network",
  "errorCode": "ERROR_CODE"
}
```

**HTTP Status Codes:**
- `200`: Success
- `400`: Validation error (missing or invalid parameters)
- `500`: Server error (internal processing error)

## Usage

### Using the Client Library

The recommended way to use these APIs is through the provided client library:

```typescript
import { TrainingApiClient } from '@/lib/api/training-client';

// Start training session
const result = await TrainingApiClient.startTrainingSession({
  userId: "user-123",
  title: "My Training Session"
});

// Update training session  
const updateResult = await TrainingApiClient.updateTrainingSession({
  threadId: result.data.threadId,
  scenario,
  guestPersona,
  messages
});

// End training session
const endResult = await TrainingApiClient.endTrainingSession({
  threadId: result.data.threadId,
  scenario,
  guestPersona,
  messages
});
```

### Direct HTTP Calls

You can also make direct HTTP requests:

```typescript
const response = await fetch('/api/training/start', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    userId: "user-123",
    title: "Custom Training Session",
    scenario: customScenario,
    guestPersona: customPersona
  })
});

const result = await response.json();
```

## Examples

See `src/app/lib/api/training-examples.ts` for complete usage examples including:
- Starting training sessions
- Updating with new messages
- Ending sessions and getting feedback
- Refining scenarios and personas
- Complete training workflows

## Type Definitions

All type definitions are available in:
- `src/app/lib/agents/v2/graph_v2.ts` - Core schemas
- `src/app/lib/api/training-client.ts` - API response types