# Page.tsx Documentation

## Overview
The `page.tsx` file is the main entry point for the AI Training Simulator application. It implements a React component architecture using Provider Pattern, Context API, Custom Hooks, and State Management patterns. **Note: The TrainingLoadingProvider mentioned in some diagrams does not exist in the current codebase.**

## Architecture Overview

### High-Level Component Structure
```mermaid
graph TB
    A[Home Component] --> B[TrainingProvider]
    B --> C[ChatLoadingProvider]
    C --> D[MainContent Component]
    
    D --> E[Header Section]
    D --> F[Main Content Area]
    D --> G[Floating Training Panel]
    
    E --> E1[Theme Toggle]
    E --> E2[Phase Indicator Badge]
    E --> E3[Panel Toggle Button]
    
    F --> F1[Feedback Interface]
    F --> F2[Training Status Alerts]
    F --> F3[Chat Interface]
    F --> F4[Error Display]
    
    G --> G1[Training Panel]
```

## Design Patterns Implemented

### 1. Provider Pattern (Context API)
The application uses two context providers to manage different aspects of state:

```mermaid
graph LR
    A[App Root] --> B[TrainingProvider]
    B --> C[ChatLoadingProvider]
    C --> D[MainContent]
    
    B -.-> B1[Training State & Actions]
    C -.-> C1[Chat Loading State]
```

**Implementation Details:**
- **TrainingProvider**: Manages training session state, phase transitions, session data, and all training-related actions
- **ChatLoadingProvider**: Handles loading states specifically for chat operations

### 2. Custom Hooks Pattern
Two custom hooks encapsulate complex logic:

```mermaid
graph TB
    A[MainContent Component] --> B[useTraining Hook]
    A --> C[useChatLoading Hook]
    
    B --> B1[Training State Management]
    B --> B2[Session Lifecycle Methods]
    B --> B3[Computed Properties]
    B --> B4[Error Handling]
    
    C --> C1[Chat Loading State]
    C --> C2[Loading Control Methods]
```

### 3. Manager Pattern (Session Management)
Two separate manager instances handle different concerns:

```mermaid
graph LR
    A[MainContent] --> B[ChatSessionManager]
    A --> C[TrainingSessionManager]
    
    B --> B1[Chat History]
    B --> B2[General Messages]
    B --> B3[Chat State]
    
    C --> C1[Training Sessions]
    C --> C2[Training Messages]
    C --> C3[Session Status]
```

## Component State Flow

### Training Session Lifecycle
```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> SessionStarting : startTrainingSession()
    SessionStarting --> Training : Session Created
    Training --> Complete : Session Finished
    Complete --> Feedback : enterFeedbackPhase()
    Feedback --> Idle : exitFeedbackPhase()
    
    Training --> Training : sendTrainingMessage()
    Complete --> Complete : Generating Feedback
```

### State Management Flow
```mermaid
graph TB
    A[User Action] --> B{Action Type}
    
    B -->|Start Session| C[startTrainingSession]
    B -->|Send Message| D[sendTrainingMessage]
    B -->|Complete Session| E[Session Completion Check]
    
    C --> C1[TrainingSessionManager.startSession]
    C1 --> C2[Update TrainingContext]
    C2 --> C3[UI State Update]
    
    D --> D1[TrainingSessionManager.sendMessage]
    D1 --> D2[Message Processing]
    
    E --> E1[Status Polling]
    E1 --> E2[Complete Session]
    E2 --> E3[Enter Feedback Phase]
```

## Key Functions and Their Interactions

### 1. startTrainingSession()
```mermaid
sequenceDiagram
    participant UI as User Interface
    participant MST as MainContent
    participant TSM as TrainingSessionManager
    participant TC as TrainingContext
    participant API as Training API
    
    UI->>MST: Click Start Session
    MST->>TSM: startSession(config)
    TSM->>API: POST /api/training/start
    API-->>TSM: Return workflow state (scenario, persona, messages)
    TSM-->>MST: Return sessionData
    MST->>TC: startSession(sessionData)
    TC->>TC: Update phase to 'training'
    TC-->>UI: UI Updates to Training Mode
```

### 2. sendTrainingMessage()
```mermaid
sequenceDiagram
    participant TP as TrainingPanel
    participant MST as MainContent
    participant TSM as TrainingSessionManager
    
    TP->>MST: sendTrainingMessage(message)
    MST->>MST: Check isTrainingActive
    alt Training Active
        MST->>TSM: sendMessage(message)
        TSM->>TSM: Call API /api/training/update
        TSM-->>MST: Success
    else Not Active
        MST-->>TP: Return early
    end
```

### 3. Session Status Polling
```mermaid
graph TB
    A[useEffect Hook] --> B{isTrainingActive?}
    B -->|Yes| C[checkSessionStatus]
    B -->|No| D[Clear Interval]
    
    C --> E[TrainingSessionManager.getSessionStatus]
    E --> F{Status = 'complete'?}
    F -->|Yes| G[completeSession]
    F -->|No| H[Continue Polling]
    
    G --> I[enterFeedbackPhase]
    H --> J[Wait 3 seconds]
    J --> C
```

## UI State Management

### Panel Mode Management
```mermaid
stateDiagram-v2
    [*] --> Hidden
    Hidden --> Half : Show Panel
    Half --> Full : Expand
    Full --> Half : Minimize
    Half --> Hidden : Hide Panel
    Hidden --> Full : Direct Full
```

### Visual State Indicators
```mermaid
graph TB
    A[Training Phase] --> B{Current Phase}
    
    B -->|idle| C[Default Background]
    B -->|training| D[Blue Background/Border]
    B -->|feedback| E[Green Background/Border]
    B -->|complete| F[Completion Animation]
    
    D --> D1[Training Active Badge]
    E --> E1[Feedback Phase Badge]
    F --> F1[Session Complete Badge]
```

## Error Handling Strategy

### Error Flow
```mermaid
graph TB
    A[Function Call] --> B{Try Block}
    B -->|Success| C[Continue Execution]
    B -->|Error| D[Catch Block]
    
    D --> E[console.error]
    E --> F[setError in Context]
    F --> G[UI Error Display]
    
    G --> H[ErrorAlert Component]
    H --> I[Retry Option]
    H --> J[Dismiss Option]
```

## Loading State Management

### Loading States Management
```mermaid
graph TB
    A[User Action] --> B{Action Type}
    
    B -->|Chat Message| C[ChatLoading Context]
    B -->|Training Operations| D[No Dedicated Loading Context]
    
    C --> C1[setLoading with type]
    C1 --> C2[Chat UI Loading Indicators]
    
    D --> D1[Direct UI State Management]
    D1 --> D2[Conditional Loading Display]
    D2 --> D3[Built-in Loading Messages]
```

## Component Communication Patterns

### Parent-Child Communication
```mermaid
graph TB
    A[MainContent] --> B[TrainingPanel]
    A --> C[FeedbackInterface]
    
    A -->|Props| B1[onStartSession callback]
    A -->|Props| B2[onSendMessage callback]
    
    B -->|Callback| A1[handleStartNewSession]
    B -->|Callback| A2[sendTrainingMessage]
    
    C -->|Callback| A3[handleCloseFeedback]
```

### Context-Based Communication
```mermaid
graph TB
    A[TrainingContext] --> B[MainContent]
    A --> C[TrainingPanel]
    A --> D[FeedbackInterface]
    
    A -->|State| B1[isTrainingActive]
    A -->|State| B2[isFeedbackActive]
    A -->|State| B3[state.phase]
    
    A -->|Actions| B4[startSession]
    A -->|Actions| B5[completeSession]
    A -->|Actions| B6[enterFeedbackPhase]
```

## Performance Optimizations

### useEffect Dependencies
```mermaid
graph TB
    A[useEffect Hooks] --> B[Session Status Polling]
    A --> C[Chat Session Init]
    A --> D[Auto-scroll]
    
    B --> B1["Dependencies: [isTrainingActive, state.showFeedback, completeSession, enterFeedbackPhase, setError, trainingSessionManager]"]
    C --> C1["Dependencies: [chatSessionManager]"]
    D --> D1["Dependencies: [chatSessionState.conversationHistory]"]
    
    B1 --> B2[Cleanup: clearInterval]
    C1 --> C2[Cleanup: None needed]
    D1 --> D2[Cleanup: None needed]
```

### Conditional Rendering Strategy
```mermaid
graph TB
    A[Render Decision] --> B{Training State}
    
    B -->|isFeedbackActive| C[Render FeedbackInterface]
    B -->|isTrainingActive| D[Render Training UI]
    B -->|idle| E[Render Default UI]
    
    D --> D1[Training Status Alert]
    D1 --> D2[Scenario Information]
    
    E --> E1[Welcome Message]
    E1 --> E2[Chat Interface]
    E1 --> E3[Start Session Button]
```

## Key Implementation Details

### 1. Session Manager Integration
- **Separation of Concerns**: Chat and Training managers are completely independent
- **State Synchronization**: Training manager state is synchronized with React context
- **Error Isolation**: Errors in one manager don't affect the other

### 2. Loading State Coordination
- **Multiple Loading Contexts**: Different loading states for different operations
- **Type-Safe Loading**: Loading states include operation type and custom messages
- **UI Feedback**: Loading states drive specific UI indicators and messages

### 3. Phase-Based UI Rendering
- **Conditional Styling**: Background colors and borders change based on training phase
- **Component Visibility**: Different components render based on current phase
- **State-Driven Badges**: Status badges reflect current training state

### 4. Event Handling Patterns
- **Async/Await**: All async operations use proper error handling
- **Early Returns**: Functions check preconditions before proceeding
- **State Validation**: UI state is validated before performing operations

## Testing Considerations

### Testable Units
1. **Individual Functions**: Each async function can be unit tested
2. **State Transitions**: Training phase transitions can be tested
3. **Error Handling**: Error scenarios can be simulated
4. **Loading States**: Loading state changes can be verified
5. **UI Rendering**: Conditional rendering can be tested

### Mock Points
1. **Session Managers**: Can be mocked for isolated testing
2. **Context Providers**: Can provide test state
3. **API Calls**: Underlying API calls can be mocked
4. **Timers**: Polling intervals can be mocked

This architecture provides a robust, maintainable, and testable foundation for the AI Training Simulator application.