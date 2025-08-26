# Training Session API Endpoints

This directory contains the API endpoints for the AI Training Simulator system. These endpoints handle the complete lifecycle of training sessions from initiation to completion.

## Endpoints

### POST /api/training/start
Initiates a new training session with scenario and persona generation.

**Request Body:**
```json
{
  "trainingObjective": "Practice booking handling",
  "difficulty": "beginner", // optional: "beginner" | "intermediate" | "advanced"
  "category": "booking", // optional: "booking" | "complaint" | "overbooking" | "general"
  "userId": "user123" // optional
}
```

**Response (201):**
```json
{
  "sessionId": "session_1234567890_abc123",
  "scenario": {
    "title": "Hotel Booking Inquiry",
    "description": "Handle a customer booking request",
    "required_steps": ["Greet customer", "Gather information", "Process booking"]
  },
  "persona": {
    "name": "John Smith",
    "background": "Business traveler",
    "communication_style": "professional"
  },
  "status": "ready",
  "message": "Training session started. You will be interacting with John Smith..."
}
```

### POST /api/training/respond
Processes user responses during active training sessions.

**Request Body:**
```json
{
  "sessionId": "session_1234567890_abc123",
  "userResponse": "Hello! How can I help you today?"
}
```

**Response (200) - Active Session:**
```json
{
  "sessionId": "session_1234567890_abc123",
  "guestResponse": "Hi, I'd like to book a room for next week.",
  "sessionStatus": "active",
  "currentTurn": 2
}
```

**Response (200) - Completed Session:**
```json
{
  "sessionId": "session_1234567890_abc123",
  "sessionStatus": "complete",
  "currentTurn": 5,
  "feedback": {
    "overallScore": 85,
    "summary": "Excellent performance with strong policy adherence.",
    "recommendations": [
      "Continue practicing empathy techniques",
      "Review escalation procedures"
    ]
  }
}
```

### GET /api/training/status
Retrieves the current status and progress of a training session.

**Query Parameters:**
- `sessionId` (required): The session ID to query

**Response (200) - Active Session:**
```json
{
  "sessionId": "session_1234567890_abc123",
  "sessionStatus": "active",
  "scenario": {
    "title": "Hotel Booking Inquiry",
    "description": "Handle a customer booking request",
    "required_steps": ["Greet customer", "Gather information", "Process booking"]
  },
  "persona": {
    "name": "John Smith",
    "background": "Business traveler",
    "communication_style": "professional"
  },
  "progress": {
    "currentTurn": 3,
    "completedSteps": ["Greet customer"],
    "requiredSteps": ["Greet customer", "Gather information", "Process booking"],
    "completionPercentage": 33
  },
  "scores": {
    "policy_adherence": 85,
    "empathy_index": 90,
    "completeness": 80,
    "escalation_judgment": 75,
    "time_efficiency": 85,
    "overall": 83
  },
  "sessionDuration": 180000,
  "lastActivity": "2024-01-01T10:05:00.000Z",
  "criticalErrors": []
}
```

## Error Responses

All endpoints return appropriate HTTP status codes and error messages:

- `400 Bad Request`: Invalid request parameters
- `404 Not Found`: Session not found or expired
- `500 Internal Server Error`: Server-side errors
- `503 Service Unavailable`: External service (Pinecone, Gemini) unavailable

**Error Response Format:**
```json
{
  "error": "Description of the error"
}
```

## Usage Flow

1. **Start Session**: Call `POST /api/training/start` to create a new training session
2. **Check Status**: Use `GET /api/training/status` to monitor session progress
3. **Send Responses**: Use `POST /api/training/respond` to interact with the guest persona
4. **Complete Session**: Continue responding until session status becomes "complete"
5. **Review Feedback**: Extract feedback from the final response or status check

## Session States

- `creating`: Session is being initialized (scenario and persona generation)
- `active`: Session is ready for user interaction
- `complete`: Session has ended and feedback is available

## Validation Rules

### Start Session
- `trainingObjective`: Required, non-empty string
- `difficulty`: Optional, must be "beginner", "intermediate", or "advanced"
- `category`: Optional, must be "booking", "complaint", "overbooking", or "general"

### Respond to Session
- `sessionId`: Required, non-empty string
- `userResponse`: Required, 1-2000 characters, non-empty after trimming

### Status Check
- `sessionId`: Required query parameter

## Testing

The API endpoints are thoroughly tested with both unit tests and integration tests:

- `training-api.test.ts`: Individual endpoint testing with mocked dependencies
- `training-api-integration.test.ts`: End-to-end workflow testing

Run tests with:
```bash
npm test -- src/app/api/training/ --run
```