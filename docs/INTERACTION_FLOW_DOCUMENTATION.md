# Complete Interaction Flow Documentation

## Overview
This document provides a comprehensive view of how `page.tsx` and `TrainingPanel.tsx` interact with each other and the broader application ecosystem.

## Complete System Architecture

### High-Level System Overview
```mermaid
graph TB
    subgraph "Application Layer"
        A[page.tsx - MainContent]
        B[TrainingPanel.tsx]
        C[FeedbackInterface.tsx]
    end
    
    subgraph "Context Layer"
        D[TrainingContext]
        E[ChatLoadingContext]
    end
    
    subgraph "Manager Layer"
        F[TrainingSessionManager]
        G[ChatSessionManager]
    end
    
    subgraph "API Layer"
        H[/api/training/start]
        I[/api/training/update]
    end
    
    A --> D
    A --> E
    A --> F
    A --> G
    B --> D
    B --> F
    
    F --> H
    F --> I
    
    A -.-> B
    A -.-> C
    
    Note: TrainingLoadingContext and /api/training/status removed
```

## Complete Training Session Flow

### End-to-End Training Session Journey
```mermaid
sequenceDiagram
    participant U as User
    participant P as page.tsx
    participant TP as TrainingPanel
    participant TC as TrainingContext
    participant TSM as TrainingSessionManager
    participant API as Training API
    
    Note over U,API: Session Initialization
    U->>P: Click "Show Panel"
    P->>P: setPanelMode("half")
    P->>TP: Render TrainingPanel
    TP->>TP: Render "Start Session" UI
    
    U->>TP: Click "Start Training Session"
    TP->>P: onStartSession callback
    P->>P: startTrainingSession()
    P->>TSM: startSession(config)
    TSM->>API: POST /api/training/start
    API-->>TSM: Workflow state (scenario, persona, messages)
    TSM-->>P: sessionData
    P->>TC: startSession(sessionData)
    TC->>TC: Update phase to 'training'
    
    Note over U,API: Active Training Phase
    TC-->>P: State change notification
    P->>P: Re-render with training UI
    TC-->>TP: State change notification
    TP->>TP: Start polling (fetchSessionStatus)
    
    loop Every 2 seconds
        TP->>TSM: getSessionStatus()
        TSM->>TSM: Return cached status
        TP->>TP: Update UI with session data
    end
    
    Note over U,API: Message Exchange - Currently Not Functional
    Note over TP: TrainingInput component not rendered
    Note over TP: handleSendMessage exists but unused
    
    Note over U,API: Session Completion
    P->>P: checkSessionStatus() [polling every 3 seconds]
    P->>TSM: getSessionStatus()
    TSM-->>P: Status check
    alt Status is 'complete'
        P->>TSM: completeSession()
        P->>TC: completeSession()
        TC->>TC: Update phase to 'complete'
        P->>P: setTimeout enterFeedbackPhase
        P->>TC: enterFeedbackPhase()
        TC->>TC: Update phase to 'feedback'
    end
    
    Note over U,API: Feedback Phase
    TC-->>P: State change to feedback
    P->>P: Render FeedbackInterface
    TP->>TP: Panel shows completion message
```

## State Synchronization Patterns

### Context State Flow Between Components
```mermaid
graph TB
    subgraph "TrainingContext State"
        A[phase: TrainingPhase]
        B[scenario: ScenarioData]
        C[persona: PersonaData]
        D[sessionStatus: SessionStatus]
        E[isPanelFrozen: boolean]
        F[showFeedback: boolean]
        G[messages: BaseMessage array]
        H[sessionDuration: number]
        I[criticalErrors: string array]
    end
    
    subgraph "page.tsx Computed Values"
        J[isTrainingActive = phase === 'training']
        K[isFeedbackActive = phase === 'feedback' && showFeedback]
    end
    
    subgraph "TrainingPanel Local State"
        L[sessionStatus: SessionStatus - converted from context]
        M[error: string - unused]
        N[isPolling: boolean]
    end
    
    A --> J
    A --> K
    F --> K
    
    B --> L
    C --> L
    D --> L
    
    J -.-> N
    L -.-> A
```

### Loading State Management
```mermaid
graph TB
    subgraph "ChatLoadingContext"
        A[Chat Operations Only]
        B[message-send type]
    end
    
    subgraph "page.tsx Usage"
        C[Chat Loading UI]
        D[Conditional Loading Display]
    end
    
    subgraph "TrainingPanel Usage"
        E[Loading Skeleton Display]
        F[TrainingLoadingIndicator]
    end
    
    A --> C
    B --> C
    
    Note: No dedicated TrainingLoadingContext
    Note: Training loading handled via conditional rendering
    
    D --> E
    D --> F
```

## Error Handling Coordination

### Multi-Layer Error Handling
```mermaid
graph TB
    subgraph "Error Sources"
        A[API Failures]
        B[Network Issues]
        C[Validation Errors]
        D[State Inconsistencies]
    end
    
    subgraph "Error Handling Layers"
        E[TrainingSessionManager]
        F[Component Try-Catch]
        G[Error Handler Utility]
        H[Context Error State]
    end
    
    subgraph "Error Display"
        I[TrainingErrorDisplay]
        J[ErrorAlert Component]
        K[Loading Error States]
        L[Toast Notifications]
    end
    
    A --> E
    B --> F
    C --> F
    D --> F
    
    E --> G
    F --> G
    G --> H
    
    H --> I
    H --> J
    H --> K
    H --> L
```

### Error Recovery Flow
```mermaid
sequenceDiagram
    participant TP as TrainingPanel
    participant EH as ErrorHandler
    participant TSM as TrainingSessionManager
    participant TC as TrainingContext
    participant UI as Error UI
    
    Note over TP,UI: Error Occurs
    TP->>TP: Operation fails
    TP->>EH: handleError(error)
    EH->>EH: Classify error type
    EH->>EH: Store retry action
    TP->>TC: setError(error)
    TC-->>UI: Display error
    
    Note over TP,UI: User Initiates Recovery
    UI->>EH: Retry button clicked
    EH->>EH: Execute stored retry action
    EH->>TSM: Retry original operation
    
    alt Retry Success
        TSM-->>EH: Success
        EH->>TC: clearError()
        TC-->>UI: Hide error display
        TP->>TP: Resume normal operation
    else Retry Fails
        TSM-->>EH: Error again
        EH->>TC: setError(new error)
        TC-->>UI: Update error display
    end
```

## Component Lifecycle Interactions

### Mount/Unmount Coordination
```mermaid
sequenceDiagram
    participant P as page.tsx
    participant TP as TrainingPanel
    participant TSM as TrainingSessionManager
    participant TC as TrainingContext
    
    Note over P,TC: Application Start
    P->>P: Component mounts
    P->>TC: Subscribe to context
    P->>TSM: Get session manager instance
    
    Note over P,TC: Panel Visibility Toggle
    P->>P: setPanelMode("half")
    P->>TP: Mount TrainingPanel
    TP->>TC: Subscribe to context
    TP->>TSM: Get session manager instance
    TP->>TP: Initialize local state
    
    Note over P,TC: Training Session Active
    TP->>TP: Start polling
    TP->>TP: Setup useEffect intervals
    
    Note over P,TC: Panel Hidden
    P->>P: setPanelMode("hidden")
    P->>TP: Unmount TrainingPanel
    TP->>TP: Cleanup intervals
    TP->>TP: Cancel pending requests
    
    Note over P,TC: Application Cleanup
    P->>P: Component unmounts
    P->>P: Cleanup all intervals
    P->>TSM: Cancel pending operations
```

## Data Flow Patterns

### Session Data Propagation
```mermaid
graph TB
    A[API Response] --> B[TrainingSessionManager]
    B --> C[Manager Internal State]
    
    C --> D[page.tsx: startSession]
    C --> E[TrainingPanel: fetchSessionStatus]
    
    D --> F[TrainingContext: startSession]
    E --> G[TrainingPanel: local state]
    
    F --> H[Context State Update]
    G --> I[UI State Update]
    
    H --> J[All Context Consumers]
    I --> K[TrainingPanel Re-render]
    
    J --> L[page.tsx Re-render]
    J --> M[Other Components Re-render]
```

### Message Flow Architecture
```mermaid
sequenceDiagram
    participant U as User Input
    participant TP as TrainingPanel
    participant P as page.tsx
    participant TSM as TrainingSessionManager
    participant API as Training API
    participant TC as TrainingContext
    
    U->>TP: Enter message
    TP->>TP: handleSendMessage(message)
    TP->>TSM: sendMessage(message)
    TSM->>API: POST /api/training/update
    API-->>TSM: Updated conversation
    TSM-->>TP: Success
    
    par Callback Chain
        TP->>P: onSendMessage(message)
        P->>P: sendTrainingMessage(message)
        P->>TSM: sendMessage(message) [duplicate call]
    and Status Update
        TP->>TP: setTimeout(fetchSessionStatus, 500)
        TP->>TSM: getSessionStatus()
        TSM-->>TP: Updated session data
        TP->>TC: updateSessionData()
    end
```

## Performance Optimization Strategies

### Re-render Optimization
```mermaid
graph TB
    subgraph "Optimization Techniques"
        A[useCallback for stable functions]
        B[useMemo for expensive calculations]
        C[Conditional useEffect execution]
        D[Early returns in functions]
        E[Debounced API calls]
    end
    
    subgraph "page.tsx Optimizations"
        F[Stable callback references]
        G[Conditional rendering]
        H[Effect dependency arrays]
    end
    
    subgraph "TrainingPanel Optimizations"
        I[Polling condition checks]
        J[Status transformation caching]
        K[Error state isolation]
    end
    
    A --> F
    A --> I
    C --> H
    C --> I
    D --> G
    D --> J
```

### Memory Management
```mermaid
sequenceDiagram
    participant C as Component
    participant E as useEffect
    participant I as Intervals
    participant A as API Calls
    
    Note over C,A: Component Mount
    C->>E: Setup effects
    E->>I: Create intervals
    E->>A: Start API polling
    
    Note over C,A: Component Update
    C->>E: Dependencies change
    E->>I: Clear old intervals
    E->>I: Create new intervals
    
    Note over C,A: Component Unmount
    C->>E: Cleanup phase
    E->>I: Clear all intervals
    E->>A: Cancel pending requests
    E->>E: Remove event listeners
```

## Testing Integration Points

### Cross-Component Testing Strategy
```mermaid
graph TB
    subgraph "Unit Tests"
        A[page.tsx functions]
        B[TrainingPanel functions]
        C[Context actions]
        D[Manager operations]
    end
    
    subgraph "Integration Tests"
        E[page.tsx + TrainingPanel]
        F[Component + Context]
        G[Manager + API]
        H[Full user flows]
    end
    
    subgraph "E2E Tests"
        I[Complete training session]
        J[Error scenarios]
        K[State persistence]
        L[UI interactions]
    end
    
    A --> E
    B --> E
    C --> F
    D --> G
    
    E --> I
    F --> I
    G --> I
    
    I --> J
    I --> K
    I --> L
```

### Mock Strategy for Integration
```mermaid
graph TB
    subgraph "Mock Layers"
        A[API Responses]
        B[Session Managers]
        C[Context Providers]
        D[Timer Functions]
    end
    
    subgraph "Test Scenarios"
        E[Happy Path Flow]
        F[Error Conditions]
        G[Loading States]
        H[State Transitions]
    end
    
    A --> E
    A --> F
    B --> E
    B --> F
    C --> G
    C --> H
    D --> G
    D --> H
```

## Key Architectural Decisions

### 1. Separation of Concerns
- **page.tsx**: Orchestrates overall application state and layout
- **TrainingPanel**: Handles training-specific interactions and polling
- **Contexts**: Manage shared state and provide actions
- **Managers**: Encapsulate business logic and API interactions

### 2. Communication Patterns
- **Props**: For direct parent-child communication
- **Callbacks**: For child-to-parent event notification
- **Context**: For shared state and actions across components
- **Managers**: For centralized business logic

### 3. State Management Strategy
- **Local State**: Component-specific UI state
- **Context State**: Shared application state
- **Manager State**: Business logic state with API synchronization

### 4. Error Handling Philosophy
- **Graceful Degradation**: UI remains functional during errors
- **User Feedback**: Clear error messages and recovery options
- **Retry Logic**: Automatic and manual retry mechanisms
- **Error Isolation**: Errors in one area don't break others

## Current Limitations and Missing Features

### 1. Incomplete TrainingPanel Implementation
```mermaid
graph TB
    A[TrainingPanel Current State] --> B[Missing Components]
    A --> C[Unused Functions]
    A --> D[Commented Code]
    
    B --> B1[TrainingInput - not rendered]
    B --> B2[ProgressIndicator - commented out]
    B --> B3[Comprehensive error handling]
    
    C --> C1[handleSendMessage - defined but unused]
    C --> C2[Error handling logic - simplified]
    
    D --> D1[Progress section commented]
    D --> D2[Input area not rendered]
```

### 2. Missing Context Integration
- **TrainingLoadingContext**: Referenced in documentation but doesn't exist
- **Simplified Error Handling**: No dedicated error handler utility
- **No Progress Tracking**: Progress-related functionality is commented out

### 3. Incomplete Message Flow
```mermaid
sequenceDiagram
    participant U as User
    participant TP as TrainingPanel
    participant P as page.tsx
    
    U->>TP: Want to send message
    Note over TP: TrainingInput not rendered
    Note over TP: handleSendMessage exists but unused
    TP->>P: onSendMessage callback exists
    P->>P: sendTrainingMessage exists
    Note over P: But no UI to trigger it
```

### 4. Session Status Management
- **Status Polling**: Works but only returns cached status
- **No Real Status Updates**: getSessionStatus() doesn't actually check server
- **Manual Completion**: Sessions don't automatically complete based on conversation

This interaction model provides the foundation for training session management, but several key features need implementation to make it fully functional.