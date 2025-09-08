# Server Actions

This directory contains Next.js Server Actions that provide type-safe, server-side functionality for the AI Training Simulator.

## Structure

- `chat-actions.ts` - Chat and analytics server actions
- `training-actions.ts` - Training session management server actions
- `index.ts` - Barrel exports for clean imports

## Usage

### Direct Import
```typescript
import { sendChatMessage, startTrainingSession } from '@/lib/actions';
```

### With React Hooks
```typescript
import { useChatActions, useTrainingActions } from '@/lib/hooks/use-server-actions';
```

## Available Actions

### Chat Actions
- `sendChatMessage(request)` - Send a chat message and get AI response
- `getUserAnalytics(request)` - Get user analytics, session comparisons, or session details

### Training Actions
- `startTrainingSession()` - Initialize a new training session
- `updateTrainingSession(request)` - Update an existing training session

## Error Handling

All server actions return error information in the response object instead of throwing HTTP errors:

```typescript
const result = await sendChatMessage({ message: 'test' });

if (result.error) {
  // Handle error
  console.error(result.error, result.errorType, result.errorCode);
} else {
  // Handle success
  console.log(result.response);
}
```

## Benefits Over API Routes

1. **Type Safety**: Direct TypeScript integration
2. **Performance**: No network requests for server operations
3. **Simplified Code**: No fetch/response handling needed
4. **Better DX**: Automatic serialization and error handling
5. **Progressive Enhancement**: Works without JavaScript

## Migration

See `docs/SERVER_ACTIONS_MIGRATION.md` for detailed migration guide from API routes to Server Actions.