# Message Feedback Implementation

This document describes the complete implementation for storing message feedback and scores in the database during training sessions.

## Overview

The implementation allows storing both message rating and alternative suggestions alongside each message in the database. This enables comprehensive tracking of training performance and provides data for analytics and improvement recommendations.

## Database Schema Changes

### Updated Message Table

```sql
ALTER TABLE "Message" ADD COLUMN "messageRating" json;
ALTER TABLE "Message" ADD COLUMN "messageSuggestions" json;
```

The `messageRating` field stores rating data with this structure:
```typescript
{
  Message_Rating: {
    Rating: number; // 0-10
    Rationale: string;
  }
}
```

The `messageSuggestions` field stores alternative suggestions:
```typescript
{
  Alternative_Suggestions: [
    {
      Response: string;
      Explanation: string;
    }
  ]
}
```

## Implementation Components

### 1. Database Actions (`src/app/lib/db/actions/message-actions.ts`)

New functions added:
- `createMessageWithRatingAndSuggestions()` - Create message with feedback data
- `updateMessageRatingAndSuggestions()` - Update existing message feedback

### 2. Server Actions (`src/app/lib/actions/training-actions.ts`)

New server actions:
- `saveMessageWithFeedback()` - Save message with rating and suggestions
- `updateMessageFeedback()` - Update message feedback in database

### 3. Training Context (`src/app/contexts/TrainingContext.tsx`)

Enhanced with:
- `updateMessageWithFeedback()` - Update message feedback in context
- `saveMessageWithFeedbackToDb()` - Save message with feedback to database
- Extended `ExtendedHumanMessage` class to handle feedback data

### 4. Utility Handler (`src/app/lib/utils/message-feedback-handler.ts`)

`MessageFeedbackHandler` class provides:
- `processMessageWithFeedback()` - Complete workflow for message + feedback
- `updateMessageFeedback()` - Update existing message feedback
- `createMessageWithFeedback()` - Create ExtendedHumanMessage with feedback

## Usage Examples

### Basic Usage in Training Session

```typescript
import { useTrainingActions } from '@/contexts/TrainingContext';
import { MessageFeedbackHandler } from '@/lib/utils/message-feedback-handler';

function TrainingComponent({ trainingId }: { trainingId: string }) {
  const trainingActions = useTrainingActions(trainingId);

  const handleMessageWithFeedback = async (
    messageContent: string,
    rating: MessageRatingSchema,
    suggestions: AlternativeSuggestionsSchema
  ) => {
    if (!trainingActions) return;

    // Create message with feedback
    const message = MessageFeedbackHandler.createMessageWithFeedback(
      messageContent,
      rating,
      suggestions
    );

    // Process and save
    const result = await MessageFeedbackHandler.processMessageWithFeedback(
      trainingActions,
      message,
      rating,
      suggestions
    );

    if (result.success) {
      console.log('Message saved with ID:', result.messageId);
    } else {
      console.error('Failed to save:', result.error);
    }
  };
}
```

### Integration with Training Workflow

The existing `updateTrainingSession` in `training-actions.ts` already handles rating and suggestions:

```typescript
const [data, currMessageRating] = await Promise.all([
  workflow.invoke({
    conversationHistory: request.messages,
    persona: request.guestPersona,
    scenario: request.scenario,
  }),
  messageRatingWorkflow.invoke({
    conversationHistory: request.messages,
    latestUserMessage: request.messages[request.messages.length - 1].content,
    scenario: request.scenario,
    persona: request.guestPersona,
  })
]);

// The rating and suggestions are returned in the response
return {
  // ... other fields
  lastMessageRating: currMessageRating?.rating,
  lastMessageRatingReason: currMessageRating?.suggestions,
};
```

### Saving During Chat Session

When a user sends a message and receives feedback:

```typescript
// 1. User sends message
const userMessage = new ExtendedHumanMessageImpl(userInput);
trainingActions.addMessage(userMessage);

// 2. Get AI response with rating
const response = await updateTrainingSession({
  scenario: currentScenario,
  guestPersona: currentPersona,
  messages: [...currentMessages, userMessage]
});

// 3. Save user message with feedback to database
if (response.lastMessageRating || response.lastMessageRatingReason) {
  await trainingActions.saveMessageWithFeedbackToDb(
    userMessage,
    response.lastMessageRating,
    response.lastMessageRatingReason
  );
}

// 4. Add AI response
trainingActions.addMessage(new AIMessage(response.guestResponse));

// 5. Save AI message to database
await trainingActions.saveMessageWithFeedbackToDb(
  new AIMessage(response.guestResponse)
);
```

## Data Flow

1. **User Input**: User types message in training interface
2. **Context Update**: Message added to training context
3. **AI Processing**: Message sent to AI agents for rating and response
4. **Feedback Generation**: AI generates rating and alternative suggestions
5. **Context Update**: Message updated with feedback in context
6. **Database Save**: Message with feedback saved to database
7. **UI Update**: Feedback displayed to user

## Database Queries

### Retrieve Messages with Feedback

```typescript
import { getMessagesByChatId } from '@/lib/db/actions/message-actions';

const messages = await getMessagesByChatId(threadId);
messages.forEach(msg => {
  if (msg.messageRating) {
    console.log('Rating:', msg.messageRating.Message_Rating.Rating);
    console.log('Rationale:', msg.messageRating.Message_Rating.Rationale);
  }
  if (msg.messageSuggestions) {
    console.log('Suggestions:', msg.messageSuggestions.Alternative_Suggestions);
  }
});
```

### Analytics Queries

```sql
-- Average rating per training session
SELECT 
  chatId,
  AVG(CAST(messageRating->>'Message_Rating'->>'Rating' AS INTEGER)) as avg_rating
FROM "Message" 
WHERE messageRating IS NOT NULL 
GROUP BY chatId;

-- Messages with low ratings (< 5)
SELECT 
  id, 
  parts, 
  messageRating->>'Message_Rating'->>'Rating' as rating,
  messageRating->>'Message_Rating'->>'Rationale' as rationale
FROM "Message" 
WHERE CAST(messageRating->>'Message_Rating'->>'Rating' AS INTEGER) < 5;
```

## Error Handling

All functions include comprehensive error handling:

```typescript
try {
  const result = await saveMessageWithFeedback(request);
  if (!result.success) {
    // Handle business logic errors
    console.error('Save failed:', result.error);
  }
} catch (error) {
  // Handle system errors
  console.error('System error:', error);
}
```

## Testing

Use the example component at `src/app/components/examples/MessageFeedbackExample.tsx` to test the implementation:

```bash
# Import and use in your page
import { MessageFeedbackExample } from '@/components/examples/MessageFeedbackExample';

<MessageFeedbackExample trainingId="your-training-id" />
```

## Migration

The database migration has been applied automatically. If you need to run it manually:

```bash
npx drizzle-kit push
```

## Performance Considerations

- JSON fields are indexed for efficient queries
- Feedback data is optional and won't impact existing functionality
- Database writes are asynchronous and don't block UI updates
- Consider pagination for large message histories with feedback

## Future Enhancements

1. **Batch Operations**: Save multiple messages with feedback in single transaction
2. **Caching**: Cache frequently accessed feedback data
3. **Analytics Dashboard**: Build UI for feedback analytics
4. **Export**: Export training data with feedback for analysis
5. **Real-time Updates**: WebSocket updates for collaborative training sessions