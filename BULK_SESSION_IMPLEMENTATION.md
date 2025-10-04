# Bulk Session Implementation with Thread Groups

This document describes the implementation of bulk training session creation with thread group functionality.

## Overview

The `handleStartAllSessions` function has been updated to work similarly to `handleStartTraining` by:

1. **Creating a Thread Group First**: Creates an empty thread group with a name to get a UUID
2. **Individual Session Creation**: Creates each training session individually using the same logic as `handleStartTraining`
3. **Group Association**: Associates all created threads with the thread group ID
4. **Database Storage**: Stores all threads and their data in the database with proper group association

## Key Changes

### 1. Updated `useTrainingHandlers.ts`

#### Added Thread Group Import
```typescript
import { createThreadGroup } from "../lib/db/actions/thread-group-actions";
```

#### Enhanced `handleStartAllSessions` Function
- **Step 1**: Create thread group first to get group ID
- **Step 2**: Create each training session individually (similar to `handleStartTraining`)
- **Step 3**: Create thread in database with group ID
- **Step 4**: Save initial AI message to database
- **Step 5**: Update CoreAppDataContext with new threads
- **Step 6**: Provide detailed feedback on results

#### Function Signature
```typescript
const handleStartAllSessions = async (
    sessionConfigurations: SessionConfiguration[],
    groupName?: string
) => Promise<{
    success: boolean;
    message?: string;
    groupId?: string;
    groupName?: string;
    createdCount?: number;
    failedCount?: number;
    error?: string;
}>
```

### 2. Updated `BulkSessionCreation.tsx`

#### Added Group Name Interface
```typescript
export interface BulkSessionGroup {
  groupName: string;
}
```

#### Enhanced Component Props
- Added `groupName: string` prop
- Added `onGroupNameChange: (groupName: string) => void` handler

#### Added Group Name Input Field
- Input field for group name with placeholder
- Descriptive text explaining group functionality
- Proper validation and disabled state handling

### 3. Updated `ChatPage.tsx`

#### Added Group Name State
```typescript
const [groupName, setGroupName] = useState("");
```

#### Added Group Name Handler
```typescript
const handleGroupNameChange = (name: string) => {
  setGroupName(name);
};
```

#### Enhanced Bulk Session Start
- Passes group name to `handleStartAllSessions`
- Resets group name on successful creation
- Sets default group name when opening modal

## Implementation Flow

### 1. User Opens Bulk Creation Modal
```typescript
onShowBulkCreation={() => {
  setShowBulkCreation(true);
  // Set default group name if empty
  if (!groupName) {
    const defaultName = `Training Group - ${new Date().toLocaleDateString()}`;
    setGroupName(defaultName);
  }
}}
```

### 2. User Configures Sessions
- Enter group name (with default provided)
- Configure individual session titles, scenarios, and personas
- Add/remove sessions as needed

### 3. Create All Sessions
```typescript
const handleBulkSessionStart = async () => {
  setIsCreatingBulkSessions(true);
  try {
    const result = await handleStartAllSessions(sessionConfigurations, groupName);
    if (result?.success) {
      // Reset state and close modal
    }
  } finally {
    setIsCreatingBulkSessions(false);
  }
};
```

### 4. Backend Processing
```typescript
// Step 1: Create thread group
const threadGroupResult = await createThreadGroup({
  groupName: defaultGroupName,
  groupFeedback: null,
});

// Step 2: Create each session individually
for (const config of sessionConfigurations) {
  // Start training session (same as handleStartTraining)
  const result = await startTrainingSession(requestData);
  
  // Create thread with group ID
  const newThread = await createThread({
    title: config.title,
    userId: dbUserResult.user.id,
    // ... other fields
    groupId: threadGroupResult.id, // Associate with group
  });
  
  // Save initial message
  await createMessage({
    chatId: newThread.id,
    role: "AI",
    parts: [{ text: initialMessage }],
    // ... other fields
  });
}
```

## Database Schema

### Thread Group Table
```sql
CREATE TABLE "ThreadGroup" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "groupName" text NOT NULL,
  "groupFeedback" json,
  "createdAt" timestamp DEFAULT now() NOT NULL,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);
```

### Thread Table (Updated)
```sql
ALTER TABLE "Thread" ADD COLUMN "groupId" uuid REFERENCES "ThreadGroup"("id");
```

## Error Handling

The implementation includes comprehensive error handling:

### Individual Session Failures
- Each session creation is wrapped in try-catch
- Failed sessions are logged but don't stop other sessions
- Final result includes count of successful and failed sessions

### Group Creation Failure
- If group creation fails, entire operation fails
- Clear error message provided to user
- No partial state left in database

### Database Transaction Safety
- Each session is created independently
- Failed sessions don't affect successful ones
- Group remains even if some sessions fail (for retry purposes)

## Usage Example

```typescript
// Create 3 training sessions in a group
const sessionConfigurations = [
  {
    id: "1",
    title: "Booking Complaint Handling",
    scenario: "Guest complains about double booking",
    persona: "Frustrated business traveler"
  },
  {
    id: "2", 
    title: "Cancellation Request",
    scenario: "Last-minute cancellation due to emergency",
    persona: "Anxious family traveler"
  },
  {
    id: "3",
    title: "Amenity Issues",
    scenario: "WiFi not working in room",
    persona: "Tech-savvy remote worker"
  }
];

const result = await handleStartAllSessions(
  sessionConfigurations,
  "Customer Service Training - Week 1"
);

if (result.success) {
  console.log(`Created ${result.createdCount} sessions in group "${result.groupName}"`);
  console.log(`Group ID: ${result.groupId}`);
}
```

## Benefits

1. **Organization**: Sessions are grouped for easy management
2. **Scalability**: Can create multiple sessions efficiently
3. **Consistency**: Uses same logic as individual session creation
4. **Reliability**: Comprehensive error handling and rollback
5. **Flexibility**: Optional group names with sensible defaults
6. **Traceability**: Full audit trail of group and session creation

## Future Enhancements

1. **Batch Operations**: Group-level operations (complete all, delete all, etc.)
2. **Templates**: Save session configurations as templates
3. **Progress Tracking**: Real-time progress during bulk creation
4. **Group Analytics**: Aggregate statistics across group sessions
5. **Export/Import**: Export group configurations for reuse