# API Documentation

This document provides comprehensive documentation for the message, thread, and thread group management APIs.

## Thread Groups API

### GET /api/threadgroups
Get all thread groups with optional thread counts.

**Query Parameters:**
- `includeCounts` (boolean): Include thread counts for each group

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "groupName": "string",
      "groupFeedback": "object|null",
      "createdAt": "timestamp",
      "updatedAt": "timestamp",
      "threadCount": "number" // only if includeCounts=true
    }
  ]
}
```

### POST /api/threadgroups
Create a new thread group.

**Request Body:**
```json
{
  "groupName": "string", // required
  "groupFeedback": "object" // optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "groupName": "string",
    "groupFeedback": "object|null",
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
}
```

### GET /api/threadgroups/[id]
Get a specific thread group by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "groupName": "string",
    "groupFeedback": "object|null",
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
}
```

### PUT /api/threadgroups/[id]
Update a specific thread group.

**Request Body:**
```json
{
  "groupName": "string", // optional
  "groupFeedback": "object" // optional
}
```

### DELETE /api/threadgroups/[id]
Delete a specific thread group.

**Response:**
```json
{
  "success": true,
  "message": "Thread group deleted successfully"
}
```

## Threads API

### GET /api/threads
Get threads with various filters.

**Query Parameters:**
- `userId` (string): Filter by user ID
- `status` (string): Filter by status (active, completed, paused)
- `visibility` (string): Filter by visibility (public, private)
- `activeOnly` (boolean): Get only active training sessions for a user

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "string",
      "userId": "uuid",
      "visibility": "public|private",
      "scenario": "object",
      "persona": "object",
      "status": "active|completed|paused",
      "score": "object|null",
      "feedback": "object|null",
      "startedAt": "timestamp",
      "completedAt": "timestamp|null",
      "version": "string",
      "groupId": "uuid|null",
      "createdAt": "timestamp",
      "updatedAt": "timestamp",
      "deletedAt": "timestamp|null"
    }
  ]
}
```

### POST /api/threads
Create a new thread.

**Request Body:**
```json
{
  "title": "string", // required
  "userId": "string", // required
  "scenario": "object", // required
  "persona": "object", // required
  "visibility": "public|private", // optional, defaults to "private"
  "status": "active|completed|paused", // optional, defaults to "active"
  "score": "object", // optional
  "feedback": "object", // optional
  "startedAt": "timestamp", // optional, defaults to now
  "completedAt": "timestamp", // optional
  "version": "string", // optional, defaults to "1"
  "groupId": "uuid" // optional
}
```

### GET /api/threads/[id]
Get a specific thread by ID.

### PUT /api/threads/[id]
Update a specific thread.

**Request Body:** (all fields optional)
```json
{
  "title": "string",
  "visibility": "public|private",
  "scenario": "object",
  "persona": "object",
  "status": "active|completed|paused",
  "score": "object",
  "feedback": "object",
  "completedAt": "timestamp",
  "version": "string",
  "groupId": "uuid"
}
```

### DELETE /api/threads/[id]
Delete a specific thread.

**Query Parameters:**
- `hard` (boolean): Perform hard delete instead of soft delete

### POST /api/threads/[id]/actions
Perform specific actions on a thread.

**Request Body:**
```json
{
  "action": "complete|pause|resume|restore", // required
  "score": "object", // optional, for complete action
  "feedback": "object" // optional, for complete action
}
```

## Messages API

### GET /api/messages
Get messages with various filters.

**Query Parameters:**
- `chatId` (string): Filter by chat/thread ID
- `role` (string): Filter by role (AI, trainee, etc.)
- `trainingOnly` (boolean): Get only training messages
- `nonTrainingOnly` (boolean): Get only non-training messages
- `latest` (boolean): Get only the latest message for a chat
- `count` (boolean): Get message count instead of messages

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "chatId": "uuid",
      "role": "string",
      "parts": "object",
      "attachments": "array",
      "isTraining": "boolean",
      "messageRating": "object|null",
      "messageSuggestions": "object|null",
      "createdAt": "timestamp"
    }
  ]
}
```

### POST /api/messages
Create a new message.

**Request Body:**
```json
{
  "chatId": "string", // required
  "role": "string", // required
  "parts": "object", // required
  "attachments": "array", // optional, defaults to []
  "isTraining": "boolean", // optional, defaults to false
  "messageRating": "object", // optional
  "messageSuggestions": "object" // optional
}
```

### GET /api/messages/[id]
Get a specific message by ID.

### PUT /api/messages/[id]
Update a specific message.

**Request Body:** (all fields optional)
```json
{
  "role": "string",
  "parts": "object",
  "attachments": "array",
  "isTraining": "boolean",
  "messageRating": "object",
  "messageSuggestions": "object"
}
```

### DELETE /api/messages/[id]
Delete a specific message.

### POST /api/messages/[id]/actions
Perform specific actions on a message.

**Request Body:**
```json
{
  "action": "updateRatingAndSuggestions|markAsTraining|markAsNonTraining", // required
  "messageRating": "object", // optional, for updateRatingAndSuggestions
  "messageSuggestions": "object" // optional, for updateRatingAndSuggestions
}
```

### POST /api/messages/bulk
Bulk create messages.

**Request Body:**
```json
{
  "messages": [
    {
      "chatId": "string", // required
      "role": "string", // required
      "parts": "object", // required
      "attachments": "array", // optional
      "isTraining": "boolean", // optional
      "messageRating": "object", // optional
      "messageSuggestions": "object" // optional
    }
  ]
}
```

### DELETE /api/messages/bulk
Bulk delete messages.

**Query Parameters:**
- `chatId` (string): Required - Chat ID to delete messages from
- `trainingOnly` (boolean): Delete only training messages

## Error Responses

All APIs return consistent error responses:

```json
{
  "error": "Error message",
  "errorType": "validation|server|not_found",
  "errorCode": "SPECIFIC_ERROR_CODE"
}
```

## Common Error Codes

- `INVALID_REQUEST_BODY`: Request body format is invalid
- `MISSING_*`: Required field is missing
- `*_NOT_FOUND`: Resource not found
- `NO_UPDATE_FIELDS`: No fields provided for update
- `INVALID_ACTION`: Invalid action specified
- `FETCH_*_ERROR`: Error fetching resource
- `CREATE_*_ERROR`: Error creating resource
- `UPDATE_*_ERROR`: Error updating resource
- `DELETE_*_ERROR`: Error deleting resource

## Usage Examples

### Create a thread group
```bash
curl -X POST /api/threadgroups \
  -H "Content-Type: application/json" \
  -d '{"groupName": "Customer Service Training"}'
```

### Get threads for a user
```bash
curl "/api/threads?userId=user-uuid&status=active"
```

### Create a message
```bash
curl -X POST /api/messages \
  -H "Content-Type: application/json" \
  -d '{
    "chatId": "thread-uuid",
    "role": "trainee",
    "parts": {"content": "Hello, I need help with my booking"},
    "isTraining": true
  }'
```

### Complete a training session
```bash
curl -X POST /api/threads/thread-uuid/actions \
  -H "Content-Type: application/json" \
  -d '{
    "action": "complete",
    "score": {"overall": 85},
    "feedback": {"strengths": ["Good communication"], "improvements": ["Faster response"]}
  }'
```