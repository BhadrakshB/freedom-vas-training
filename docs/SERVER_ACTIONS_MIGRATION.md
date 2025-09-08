# Server Actions Migration Guide

This document outlines the migration from API routes to Next.js Server Actions while maintaining backwards compatibility.

## Overview

Server Actions provide better performance, type safety, and developer experience compared to traditional API routes. They run on the server and can be called directly from React components without the need for fetch requests.

## Migration Mapping

### Chat API → Chat Actions

**Before (API Route):**
```typescript
// POST /api/chat
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Hello',
    userId: 'user123',
    context: 'general'
  })
});
const data = await response.json();
```

**After (Server Action):**
```typescript
import { sendChatMessage } from '@/lib/actions';

const result = await sendChatMessage({
  message: 'Hello',
  userId: 'user123',
  context: 'general'
});
```

**Using the Hook:**
```typescript
import { useChatActions } from '@/lib/hooks/use-server-actions';

function ChatComponent() {
  const { sendMessage, isPending, error } = useChatActions();
  
  const handleSend = async () => {
    try {
      const result = await sendMessage({
        message: 'Hello',
        userId: 'user123',
        context: 'general'
      });
      console.log(result);
    } catch (err) {
      console.error('Chat error:', err);
    }
  };
  
  return (
    <button onClick={handleSend} disabled={isPending}>
      {isPending ? 'Sending...' : 'Send Message'}
    </button>
  );
}
```

### Analytics API → Analytics Actions

**Before (API Route):**
```typescript
// GET /api/chat?userId=user123&action=analytics
const response = await fetch('/api/chat?userId=user123&action=analytics');
const data = await response.json();
```

**After (Server Action):**
```typescript
import { getUserAnalytics } from '@/lib/actions';

const result = await getUserAnalytics({
  userId: 'user123',
  action: 'analytics'
});
```

### Training API → Training Actions

**Before (API Routes):**
```typescript
// POST /api/training/start
const startResponse = await fetch('/api/training/start', {
  method: 'POST'
});

// POST /api/training/update
const updateResponse = await fetch('/api/training/update', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ persona, scenario, messages })
});
```

**After (Server Actions):**
```typescript
import { startTrainingSession, updateTrainingSession } from '@/lib/actions';

// Start session
const startResult = await startTrainingSession();

// Update session
const updateResult = await updateTrainingSession({
  persona,
  scenario,
  messages
});
```

**Using the Hook:**
```typescript
import { useTrainingActions } from '@/lib/hooks/use-server-actions';

function TrainingComponent() {
  const { startSession, updateSession, isPending, error } = useTrainingActions();
  
  const handleStart = async () => {
    try {
      const result = await startSession();
      console.log('Session started:', result);
    } catch (err) {
      console.error('Start error:', err);
    }
  };
  
  return (
    <button onClick={handleStart} disabled={isPending}>
      {isPending ? 'Starting...' : 'Start Training'}
    </button>
  );
}
```

## Benefits of Server Actions

1. **Type Safety**: Direct TypeScript integration without manual type definitions
2. **Performance**: No network overhead for server-side operations
3. **Simplified Code**: No need for fetch requests and response handling
4. **Better Error Handling**: Errors are thrown directly and can be caught with try/catch
5. **Automatic Serialization**: No need to manually stringify/parse JSON
6. **Progressive Enhancement**: Works without JavaScript enabled

## Backwards Compatibility

The original API routes remain intact and functional. You can migrate components gradually:

1. **Phase 1**: Use server actions for new components
2. **Phase 2**: Migrate existing components one by one
3. **Phase 3**: Remove API routes once all components are migrated (optional)

## Error Handling

Server actions return error information in the response object instead of throwing HTTP errors:

```typescript
const result = await sendChatMessage({ message: 'test' });

if (result.error) {
  console.error('Error:', result.error);
  console.error('Type:', result.errorType);
  console.error('Code:', result.errorCode);
} else {
  console.log('Success:', result.response);
}
```

## Testing

Server actions can be tested directly without mocking fetch:

```typescript
import { sendChatMessage } from '@/lib/actions';

test('should send chat message', async () => {
  const result = await sendChatMessage({
    message: 'test message',
    userId: 'test-user'
  });
  
  expect(result.response).toBeDefined();
  expect(result.error).toBeUndefined();
});
```

## File Structure

```
src/app/lib/
├── actions/
│   ├── index.ts              # Barrel exports
│   ├── chat-actions.ts       # Chat-related server actions
│   └── training-actions.ts   # Training-related server actions
├── hooks/
│   └── use-server-actions.ts # React hooks for server actions
└── api/                      # Original API routes (maintained for compatibility)
    ├── chat/
    └── training/
```

## Next Steps

1. Start using server actions in new components
2. Gradually migrate existing components
3. Update documentation and examples
4. Consider removing API routes once migration is complete