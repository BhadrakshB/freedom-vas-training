# TrainingPanel.tsx Documentation

## Overview
The `TrainingPanel.tsx` component serves as the primary interface for training session interactions. It implements State Management, Polling Pattern, and Conditional Rendering patterns. **Note: The component has been simplified and some features like TrainingInput, ProgressIndicator, and comprehensive error handling have been removed or commented out.**

## Architecture Overview

### Component Structure
```mermaid
graph TB
    A[TrainingPanel] --> B[Header Section]
    A --> C[Scenario Info Section]
    A --> D[Scores Section]
    A --> E[Status Messages]
    
    B --> B1[Panel Title]
    B --> B2[Status Badge]
    B --> B3[Session Timer]
    B --> B4[Frozen Alert]
    
    C --> C1[Scenario Title]
    C --> C2[Scenario Description]
    C --> C3[Persona Badge]
    
    D --> D1[Overall Score]
    D --> D2[Policy Score]
    D --> D3[Empathy Score]
    
    E --> E1[Session Complete Alert]
    E --> E2[Loading Skeleton]
    
    Note: Input Area and Progress Section are commented out
```

## Design Patterns Implemented

### 1. State Management Pattern
The component uses simplified state management:

```mermaid
graph TB
    A[TrainingPanel State] --> B[Local State]
    A --> C[Context State]
    A --> D[Manager State]
    
    B --> B1[sessionStatus: SessionStatus]
    B --> B2[error: string - unused]
    B --> B3[isPolling: boolean]
    
    C --> C1[Training Context State Only]
    
    D --> D1[TrainingSessionManager]
    
    Note: TrainingLoadingContext removed
```

### 2. Polling Pattern Implementation
```mermaid
sequenceDiagram
    participant TP as TrainingPanel
    participant TSM as TrainingSessionManager
    participant API as Training API
    
    Note over TP: Session becomes active
    TP->>TP: Start polling (setIsPolling(true))
    
    loop Every 2 seconds
        TP->>TSM: getSessionStatus()
        TSM->>API: Fetch session data
        API-->>TSM: Session data
        TSM-->>TP: Updated session data
        TP->>TP: Update UI state
        
        alt Session Complete
            TP->>TP: Stop polling
        end
    end
```

### 3. Error Handling Strategy
```mermaid
graph TB
    A[Function Call] --> B[Try Block]
    B --> C{Operation Success?}
    
    C -->|Success| D[Update State]
    C -->|Error| E[Error Handling Chain]
    
    E --> F[Console Error Log]
    F --> G[Set Retry Action]
    G --> H[Update Error Handler]
    H --> I[Set Local Error State]
    I --> J[Set Context Error]
    J --> K[Display Error UI]
```

## Component Lifecycle and State Flow

### Component Initialization Flow
```mermaid
graph TB
    A[Component Mount] --> B[Initialize Hooks]
    B --> C[Get Context Values]
    C --> D[Get Session Manager]
    D --> E{isTrainingActive?}
    
    E -->|Yes| F[Start Status Polling]
    E -->|No| G[Show Start Session UI]
    
    F --> H[Fetch Initial Status]
    H --> I[Update UI State]
```

### State Transition Diagram
```mermaid
stateDiagram-v2
    [*] --> NotActive
    NotActive --> Loading : Training Starts
    Loading --> Active : Session Data Loaded
    Active --> Complete : Session Finished
    Complete --> NotActive : Session Reset
    
    Active --> Error : Fetch/Send Error
    Error --> Active : Retry Success
    Error --> NotActive : Give Up
    
    Loading --> Error : Initial Load Error
```

## Key Functions and Their Interactions

### 1. fetchSessionStatus()
```mermaid
sequenceDiagram
    participant TP as TrainingPanel
    participant TSM as TrainingSessionManager
    participant TC as TrainingContext
    
    TP->>TP: Check isTrainingActive
    alt Training Active
        TP->>TSM: getSessionStatus()
        TP->>TSM: getSessionData()
        
        alt Success
            TSM-->>TP: Session data
            TP->>TP: Convert to UI format
            TP->>TC: updateSessionData()
            TP->>TP: Clear local error
        else Error
            TP->>TC: setError()
            Note over TP: Simplified error handling
        end
    end
```

### 2. handleSendMessage() - Currently Unused
```mermaid
graph TB
    A[Function Defined] --> B[Not Connected to UI]
    
    B --> C[Would validate isTrainingActive]
    C --> D[Would call TrainingSessionManager.sendMessage]
    D --> E[Would call parent callback]
    E --> F[Would schedule status refresh]
    
    Note: This function exists but TrainingInput component is not rendered
```

### 3. Polling Management
```mermaid
graph TB
    A[useEffect: Polling] --> B{isTrainingActive && isPolling?}
    
    B -->|Yes| C[setInterval(fetchSessionStatus, 2000)]
    B -->|No| D[No Polling]
    
    C --> E[Return Cleanup Function]
    E --> F[clearInterval]
    
    G[useEffect: Session State] --> H{isTrainingActive?}
    H -->|Yes| I[fetchSessionStatus + setIsPolling(true)]
    H -->|No| J[setIsPolling(false) + clear status]
    
    K[useEffect: Session Complete] --> L{sessionStatus === 'complete'?}
    L -->|Yes| M[setIsPolling(false)]
    L -->|No| N[Continue Polling]
```

## UI Rendering Logic

### Conditional Rendering Strategy
```mermaid
graph TB
    A[Render Decision] --> B{Component State}
    
    B -->|!isTrainingActive| C[Start Session UI]
    B -->|error| D[Error Display UI]
    B -->|!sessionStatus| E[Loading Skeleton UI]
    B -->|sessionStatus exists| F[Active Session UI]
    
    C --> C1[Panel Title]
    C --> C2[Description Text]
    C --> C3[Start Button]
    
    D --> D1[TrainingErrorDisplay]
    D --> D2[Restart Option]
    
    E --> E1[Loading Skeletons]
    E --> E2[Loading Indicator Overlay]
    
    F --> F1[Session Header]
    F --> F2[Scenario Info]
    F --> F3[Progress/Scores]
    F --> F4[Input Area]
```

### Panel Variant System
```mermaid
graph TB
    A[getPanelVariant] --> B{State Check}
    
    B -->|isPanelFrozen| C[frozen variant]
    B -->|isTrainingActive| D[training variant]
    B -->|isFeedbackActive| E[feedback variant]
    B -->|default| F[default variant]
    
    C --> C1[opacity-90 + border-muted]
    D --> D1[border-blue-500]
    E --> E1[border-green-500]
    F --> F1[border-border]
```

## Data Flow and Transformations

### Session Data Transformation
```mermaid
graph TB
    A[TrainingSessionManager Data] --> B[sessionData object]
    B --> C[Transform to SessionStatus]
    
    C --> D[sessionStatus: status]
    C --> E[scenario: scenario data]
    C --> F[persona: persona data]
    C --> G[scores: scoring data]
    C --> H[sessionDuration: duration]
    C --> I[criticalErrors: errors array]
    
    D --> J[UI Status Badge]
    E --> K[Scenario Display]
    F --> L[Persona Badge]
    G --> M[Scores Section]
    H --> N[Session Timer]
    I --> O[Error Indicators]
```

### Context Synchronization
```mermaid
sequenceDiagram
    participant TP as TrainingPanel
    participant TSM as TrainingSessionManager
    participant TC as TrainingContext
    
    TP->>TSM: Get session data
    TSM-->>TP: Raw session data
    TP->>TP: Transform data
    TP->>TC: updateSessionData(transformed)
    TC->>TC: Update context state
    TC-->>TP: State change notification
    TP->>TP: Re-render with new state
```

## Error Handling Implementation

### Error Handler Integration
```mermaid
graph TB
    A[Error Occurs] --> B[trainingErrorHandler.handleError]
    B --> C[Set Retry Action]
    C --> D[Classify Error Type]
    D --> E[Update Error State]
    
    E --> F[Local Error State]
    E --> G[Training Loading Error]
    E --> H[Training Context Error]
    
    F --> I[Component Error UI]
    G --> J[Loading Error Indicators]
    H --> K[Global Error Display]
```

### Retry Mechanism
```mermaid
sequenceDiagram
    participant UI as Error UI
    participant EH as Error Handler
    participant TP as TrainingPanel
    participant TSM as TrainingSessionManager
    
    Note over UI: User clicks retry
    UI->>EH: Trigger retry
    EH->>EH: Get stored retry action
    EH->>TP: Execute retry function
    TP->>TSM: Retry original operation
    
    alt Retry Success
        TSM-->>TP: Success response
        TP->>EH: Clear error
        EH-->>UI: Hide error display
    else Retry Fails
        TSM-->>TP: Error response
        TP->>EH: Update error
        EH-->>UI: Show updated error
    end
```

## Performance Optimizations

### useCallback Dependencies
```mermaid
graph TB
    A[fetchSessionStatus useCallback] --> B[Dependencies]
    B --> B1[isTrainingActive]
    B --> B2[updateSessionData]
    B --> B3[setContextError]
    B --> B4[setTrainingLoading]
    B --> B5[setTrainingError]
    B --> B6[clearTrainingError]
    B --> B7[trainingErrorHandler]
    B --> B8[trainingSessionManager]
    
    C[Optimization Benefits] --> C1[Prevents unnecessary re-renders]
    C --> C2[Stable function reference]
    C --> C3[Efficient polling setup]
```

### Conditional Effect Execution
```mermaid
graph TB
    A[useEffect Hooks] --> B[Polling Effect]
    A --> C[Session State Effect]
    A --> D[Complete Check Effect]
    
    B --> B1[Condition: isTrainingActive && isPolling]
    C --> C1[Condition: isTrainingActive change]
    D --> D1[Condition: sessionStatus.sessionStatus change]
    
    B1 --> B2[Early return if false]
    C1 --> C2[Fetch status or clear]
    D1 --> D3[Stop polling if complete]
```

## Component Communication Patterns

### Props Interface
```mermaid
graph TB
    A[TrainingPanel Props] --> B[onStartSession?: function]
    A --> C[onSendMessage?: function]
    A --> D[className?: string]
    
    B --> B1[Called when user starts session]
    C --> C1[Called when user sends message]
    D --> D1[Additional CSS classes]
    
    B1 --> B2[Parent handles session creation]
    C1 --> C2[Parent handles message routing]
```

### Context Dependencies
```mermaid
graph TB
    A[TrainingPanel] --> B[useTraining Hook Only]
    
    B --> B1[state: TrainingUIState]
    B --> B2[updateSessionData: function]
    B --> B3[setError: function]
    B --> B4[panelTitle: string]
    B --> B5[isTrainingActive: boolean]
    B --> B6[isFeedbackActive: boolean]
    
    Note: TrainingLoadingContext dependency removed
```

## UI State Management

### Loading States
```mermaid
stateDiagram-v2
    [*] --> NotLoading
    NotLoading --> StatusCheck : Fetching Status
    NotLoading --> MessageSend : Sending Message
    
    StatusCheck --> NotLoading : Success/Error
    MessageSend --> NotLoading : Success/Error
    
    StatusCheck --> StatusCheck : Polling Continue
    MessageSend --> StatusCheck : Refresh After Send
```

### Visual State Indicators
```mermaid
graph TB
    A[Visual Indicators] --> B[Status Badge]
    A --> C[Panel Border]
    A --> D[Loading Overlays]
    A --> E[Alert Messages]
    
    B --> B1[Active/Complete/Creating/Frozen]
    C --> C1[Blue: Training / Green: Feedback / Gray: Default]
    D --> D1[Skeleton Loading / Spinner Overlay]
    E --> E1[Frozen Panel / Session Complete]
```

## Testing Strategy

### Testable Components
1. **State Management**: Local state updates and context interactions
2. **Polling Logic**: Interval setup, cleanup, and condition checking
3. **Error Handling**: Error scenarios and retry mechanisms
4. **UI Rendering**: Conditional rendering based on state
5. **User Interactions**: Button clicks and message sending

### Mock Requirements
```mermaid
graph TB
    A[Test Mocks] --> B[TrainingSessionManager]
    A --> C[Context Providers]
    A --> D[Timer Functions]
    A --> E[Error Handler]
    
    B --> B1[Mock session operations]
    C --> C1[Mock context state/actions]
    D --> D1[Mock setInterval/clearInterval]
    E --> E1[Mock error handling logic]
```

### Test Scenarios
1. **Happy Path**: Normal session flow from start to completion
2. **Error Scenarios**: Network errors, session failures, retry logic
3. **Loading States**: Various loading states and transitions
4. **Edge Cases**: Rapid state changes, component unmounting during operations
5. **User Interactions**: Input validation, disabled states, callback execution

## Key Implementation Insights

### 1. Separation of Concerns
- **UI Logic**: Handled within the component
- **Business Logic**: Delegated to TrainingSessionManager
- **State Management**: Coordinated through React Context
- **Error Handling**: Centralized through error handler utility

### 2. Robust Polling Implementation
- **Conditional Polling**: Only polls when training is active
- **Automatic Cleanup**: Proper interval cleanup on unmount/state change
- **Error Resilience**: Continues polling despite individual request failures

### 3. Progressive Enhancement
- **Graceful Degradation**: Shows appropriate UI for each state
- **Loading States**: Provides feedback during all async operations
- **Error Recovery**: Offers retry mechanisms for failed operations

### 4. Type Safety
- **Interface Definitions**: Clear TypeScript interfaces for all data structures
- **State Typing**: Strongly typed state management
- **Prop Validation**: Optional props with proper typing

This architecture ensures the TrainingPanel component is maintainable, testable, and provides a robust user experience for training session interactions.