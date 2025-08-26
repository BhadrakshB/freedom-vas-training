# Implementation Plan

- [x] 1. Set up core data models and interfaces
  - Create TypeScript interfaces for ScenarioData, PersonaData, ScoringMetrics, and SessionData
  - Define TrainingSimulatorState annotation extending MessagesAnnotation
  - Implement session storage interfaces and types
  - _Requirements: 1.3, 2.4, 4.4, 6.4_

- [x] 2. Implement Pinecone integration service
  - Create PineconeService class with vector database connection
  - Implement document retrieval functions for SOPs and training materials
  - Add metadata filtering and search capabilities
  - Write unit tests for Pinecone integration functions
  - _Requirements: 6.1, 6.2, 6.5_

- [ ] 3. Create Scenario Creator Agent
  - Implement scenario creation node with RAG integration
  - Add SOP retrieval logic for grounding scenarios in company policies
  - Create JSON schema validation for scenario output
  - Write unit tests for scenario generation with mock Pinecone responses
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 4. Create Persona Generator Agent
  - Implement persona generation node with psychological depth modeling
  - Add persona consistency validation logic
  - Create JSON schema validation for persona output
  - Write unit tests for persona generation with various scenario inputs
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 5. Create Guest Simulator Agent
  - Implement guest response generation with persona consistency
  - Add emotional arc progression logic
  - Implement natural conversation flow with information revelation
  - Write unit tests for character consistency across multiple turns
  - _Requirements: 2.5, 3.4, 3.5_

- [ ] 6. Create Silent Scoring Agent
  - Implement multi-dimensional scoring logic (policy adherence, empathy, completeness, escalation, time efficiency)
  - Add session completion detection logic
  - Create scoring evidence tracking and critical error detection
  - Write unit tests for scoring accuracy with sample conversations
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 7. Create Feedback Generator Agent
  - Implement comprehensive feedback generation with SOP citations
  - Add RAG integration for retrieving relevant policy documents
  - Create structured feedback output with actionable recommendations
  - Write unit tests for feedback quality and SOP citation accuracy
  - _Requirements: 5.1, 5.3, 5.4, 5.5_

- [ ] 8. Build LangGraph orchestration workflow
  - Create training simulator graph with all five agent nodes
  - Implement state transitions and conditional routing logic
  - Add session management and error handling
  - Write integration tests for complete workflow execution
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1_

- [ ] 9. Create session management system
  - Implement in-memory session store for active sessions
  - Add session persistence for completed training sessions
  - Create session ID generation and tracking
  - Write unit tests for session lifecycle management
  - _Requirements: 3.1, 5.1, 7.4, 7.5_

- [ ] 10. Build training session API endpoints
  - Create POST /api/training/start endpoint for session initiation
  - Create POST /api/training/respond endpoint for user responses during sessions
  - Create GET /api/training/status endpoint for session state retrieval
  - Write API integration tests with mock agent responses
  - _Requirements: 3.1, 3.2, 4.1, 5.1_

- [ ] 11. Implement side panel UI component
  - Create TrainingPanel React component with session display
  - Add session timer and progress indicator components
  - Implement user input handling for training responses
  - Write component tests for UI state management
  - _Requirements: 3.1, 3.2, 3.3, 7.1_

- [ ] 12. Build main chat feedback interface
  - Extend existing chat interface to handle feedback phase
  - Add feedback display components with structured sections
  - Implement SOP citation links and resource references
  - Write component tests for feedback presentation
  - _Requirements: 5.1, 5.2, 5.3, 7.1_

- [ ] 13. Implement UI state management
  - Create React context for training session state
  - Add visual distinction logic between training and feedback phases
  - Implement session completion transitions and panel freezing
  - Write integration tests for UI state transitions
  - _Requirements: 7.1, 7.2, 7.3, 7.5_

- [ ] 14. Add session export functionality
  - Create session transcript export feature
  - Add feedback report export with PDF generation
  - Implement session history preservation
  - Write unit tests for export functionality
  - _Requirements: 7.2, 7.3_

- [ ] 15. Implement error handling and recovery
  - Add agent failure recovery mechanisms with fallback responses
  - Create session timeout handling with auto-save
  - Implement external service failure handling (Pinecone, Gemini)
  - Write error scenario tests for all failure modes
  - _Requirements: 6.3, 6.4, 7.5_

- [ ] 16. Create end-to-end integration tests
  - Write complete training session workflow tests
  - Add multi-user concurrent session testing
  - Create performance benchmarking tests
  - Test all error scenarios and recovery mechanisms
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1_