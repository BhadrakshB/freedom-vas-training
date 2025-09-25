# TrainingContext Documentation

The TrainingContext provides comprehensive state management for multiple concurrent training sessions in the STR Virtual Assistant training platform.

## Quick Start

```tsx
import { useTraining, useActiveTraining, useTrainingActions } from '@/contexts/TrainingContext';
import { HumanMessage, AIMessage } from '@langchain/core/messages';

function MyComponent() {
  const { createTrainingState, setActiveTrainingId } = useTraining();
  
  // Create a new training session
  const sessionId = createTrainingState("Customer Complaint Training");
  setActiveTrainingId(sessionId);
}
```

## Core Hooks

### `useTraining()`
Main context hook with full access to all training state and actions.

```tsx
const {
  // Session management
  createTrainingState,
  setActiveTrainingId,
  removeTrainingState,
  
  // Get all sessions
  getAllTrainingStates,
  getActiveTrainingStates,
  
  // Session limits
  canCreateNewSession,
  getSessionCount
} = useTraining();
```

### `useActiveTraining()`
Get the currently active training session.

```tsx
const { activeTraining, activeTrainingId } = useActiveTraining();

if (activeTraining) {
  console.log(`Active: ${activeTraining.name}`);
  console.log(`Status: ${activeTraining.trainingStatus}`);
  console.log(`Messages: ${activeTraining.messages.length}`);
}
```

### `useTrainingSession(id)`
Get a specific training session by ID.

```tsx
const sessionId = "training-123";
const session = useTrainingSession(sessionId);

if (session) {
  console.log(`Session: ${session.name}`);
  console.log(`Created: ${session.createdAt}`);
}
```

### `useTrainingActions(id)`
Get pre-bound actions for a specific session.

```tsx
import { HumanMessage } from '@langchain/core/messages';

const sessionId = "training-123";
const actions = useTrainingActions(sessionId);

if (actions) {
  actions.addMessage(new HumanMessage("Hello"));
  actions.setTrainingStatus("ongoing");
  actions.setIsLoading(true);
}
```

## Session Management

### Creating Sessions

```tsx
// Basic session
const sessionId = createTrainingState();

// Named session
const sessionId = createTrainingState("Booking Cancellation Training");

// Check if can create new session
if (canCreateNewSession()) {
  const sessionId = createTrainingState("New Session");
}
```

### Duplicating Sessions

```tsx
// Duplicate with auto-generated name
const newSessionId = duplicateTrainingState(existingSessionId);

// Duplicate with custom name
const newSessionId = duplicateTrainingState(existingSessionId, "Advanced Training");
```

### Session Navigation

```tsx
// Switch to different session
setActiveTrainingId("training-456");

// Get all active sessions
const activeSessions = getActiveTrainingStates();
activeSessions.forEach(session => {
  console.log(`${session.name}: ${session.trainingStatus}`);
});
```

### Session Lifecycle

```tsx
// Archive completed session
archiveTrainingState(sessionId);

// Restore archived session
restoreTrainingState(sessionId);

// Rename session
renameTrainingState(sessionId, "Updated Training Name");

// Remove session permanently
removeTrainingState(sessionId);
```

## Message Management

### Adding Messages

```tsx
import { HumanMessage, AIMessage } from '@langchain/core/messages';

const actions = useTrainingActions(sessionId);

// Add human message
actions?.addMessage(new HumanMessage("I need help with my booking"));

// Add AI message  
actions?.addMessage(new AIMessage("I'd be happy to help you with that"));
```

### Message Operations

```tsx
import { HumanMessage, AIMessage } from '@langchain/core/messages';

// Update specific message
actions?.updateMessage(0, new HumanMessage("Updated message"));

// Remove message
actions?.removeMessage(2);

// Replace all messages
actions?.setMessages([
  new HumanMessage("Start fresh"),
  new AIMessage("How can I help?")
]);
```

## Scenario & Persona Management

### Setting Scenario

```tsx
const scenario = {
  title: "Booking Cancellation",
  description: "Guest wants to cancel last-minute",
  difficulty: "medium",
  objectives: ["Handle cancellation", "Offer alternatives"]
};

actions?.setScenario(scenario);

// Custom scenario text
actions?.setCustomScenario("Handle angry guest complaint about noise");
```

### Setting Persona

```tsx
const persona = {
  name: "Sarah Johnson",
  age: 35,
  personality: "frustrated but reasonable",
  communicationStyle: "direct",
  escalationTriggers: ["long wait times", "unhelpful responses"]
};

actions?.setPersona(persona);

// Custom persona text
actions?.setCustomPersona("Elderly guest, not tech-savvy, prefers phone calls");
```

## Training Status Management

### Valid Training Status Values
- `"start"` - Initial state, training not yet begun
- `"ongoing"` - Training session is active
- `"completed"` - Training session finished successfully
- `"error"` - Training session encountered an error
- `"paused"` - Training session temporarily paused

### Status Updates

```tsx
// Start training
actions?.setTrainingStarted(true);
actions?.setTrainingStatus("ongoing");

// Complete training
actions?.setTrainingStatus("completed");
actions?.setSessionFeedback(feedbackData);

// Handle errors
actions?.setTrainingStatus("error");
actions?.setError("Connection failed", "network");
```

### Loading States

```tsx
// Show loading during AI processing
actions?.setIsLoading(true);

// Hide loading when complete
actions?.setIsLoading(false);

// Track failed messages for retry
actions?.setLastFailedMessage("Failed to send message");
```

## Error Management

### Individual Session Errors

```tsx
// Set error for specific session
actions?.setError("Invalid scenario format", "validation");

// Clear error
actions?.clearError();

// Check error state
if (session?.errorMessage) {
  console.log(`Error: ${session.errorMessage} (${session.errorType})`);
}
```

### Bulk Error Management

```tsx
// Clear all errors across all sessions
clearAllErrors();
```

## Bulk Operations

### Archive Management

```tsx
// Archive all completed sessions
archiveAllCompletedSessions();

// Remove all archived sessions permanently
removeAllArchivedSessions();

// Get archived sessions
const archivedSessions = getArchivedTrainingStates();
```

## Session Filtering & Sorting

### Get Sessions by Status

```tsx
// Active (non-archived) sessions
const activeSessions = getActiveTrainingStates();

// Archived sessions
const archivedSessions = getArchivedTrainingStates();

// All sessions (sorted by last activity)
const allSessions = getAllTrainingStates();
```

### Filter by Training Status

```tsx
const completedSessions = getAllTrainingStates().filter(
  session => session.trainingStatus === "completed"
);

const ongoingSessions = getAllTrainingStates().filter(
  session => session.trainingStatus === "ongoing"
);
```

## Session Reset

### Reset Session Data

```tsx
// Reset session to initial state
actions?.resetSession();

// This clears:
// - messages
// - scenario/persona
// - feedback
// - error states
// - training status (back to "start")
```

## UI State Management

### Panel Resizing

```tsx
const { panelWidth, isResizing, setPanelWidth, setIsResizing } = useTraining();

// Update panel width
setPanelWidth(400);

// Track resize state
setIsResizing(true);
```

## Complete Example: Session Manager Component

```tsx
import React from 'react';
import { useTraining, useActiveTraining } from '@/contexts/TrainingContext';

function SessionManager() {
  const {
    getAllTrainingStates,
    createTrainingState,
    setActiveTrainingId,
    canCreateNewSession,
    archiveAllCompletedSessions
  } = useTraining();
  
  const { activeTrainingId } = useActiveTraining();
  const sessions = getAllTrainingStates();

  const handleCreateSession = () => {
    if (canCreateNewSession()) {
      const sessionId = createTrainingState("New Training Session");
      setActiveTrainingId(sessionId);
    } else {
      alert("Maximum concurrent sessions reached");
    }
  };

  const handleCleanup = () => {
    archiveAllCompletedSessions();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ongoing': return 'text-blue-600';
      case 'completed': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'paused': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="p-4">
      <div className="mb-4 space-x-2">
        <button 
          onClick={handleCreateSession}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          disabled={!canCreateNewSession()}
        >
          New Session
        </button>
        <button 
          onClick={handleCleanup}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Archive Completed
        </button>
      </div>
      
      <div className="space-y-2">
        {sessions.map(session => (
          <div 
            key={session.id}
            className={`p-3 border rounded cursor-pointer transition-colors ${
              activeTrainingId === session.id 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTrainingId(session.id)}
          >
            <h3 className="font-semibold">{session.name}</h3>
            <p className={`text-sm ${getStatusColor(session.trainingStatus)}`}>
              Status: {session.trainingStatus}
            </p>
            <p className="text-sm text-gray-600">
              Messages: {session.messages.length}
            </p>
            <p className="text-xs text-gray-500">
              Last Activity: {session.lastActivity.toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SessionManager;
```

## Performance Tips

1. **Use specific hooks**: Prefer `useActiveTraining()` over `useTraining()` when you only need active session data
2. **Memoize actions**: `useTrainingActions()` returns memoized functions to prevent re-renders
3. **Session limits**: Check `canCreateNewSession()` before creating new sessions
4. **Cleanup**: Regularly archive completed sessions to maintain performance