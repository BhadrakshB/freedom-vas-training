# Requirements Document

## Introduction

The AI Training Simulator is a comprehensive training platform for STR (Short-Term Rental) virtual assistants. The system creates realistic, scenario-based training experiences where trainees interact with AI-generated guest personas while being silently evaluated against company SOPs. The platform provides immersive training sessions followed by detailed feedback to improve VA performance.

## Requirements

### Requirement 1

**User Story:** As a training administrator, I want to create realistic training scenarios based on company SOPs, so that virtual assistants can practice handling real-world situations in a controlled environment.

#### Acceptance Criteria

1. WHEN a training administrator initiates scenario creation THEN the system SHALL generate scenarios with clear objectives, hidden test points, and natural conclusion conditions
2. WHEN creating a scenario THEN the system SHALL retrieve relevant SOP sections from the knowledge base to ground the scenario in company policies
3. WHEN a scenario is created THEN the system SHALL output structured JSON with title, description, required_steps, critical_errors, and time_pressure fields
4. WHEN designing scenarios THEN the system SHALL ensure scenarios test specific competencies without being unrealistic
5. WHEN presenting scenarios to trainees THEN the system SHALL NOT mention this is a training exercise

### Requirement 2

**User Story:** As a training system, I want to generate authentic guest personas for each scenario, so that trainees experience realistic interactions that challenge their skills appropriately.

#### Acceptance Criteria

1. WHEN generating a persona THEN the system SHALL create psychological depth with background, motivations, and emotional progression
2. WHEN creating personas THEN the system SHALL define communication patterns that match the persona's traits
3. WHEN generating personas THEN the system SHALL ensure appropriate challenges for the training level
4. WHEN outputting personas THEN the system SHALL provide structured JSON with name, background, personality_traits, hidden_motivations, communication_style, and emotional_arc
5. WHEN personas interact with trainees THEN the system SHALL maintain character consistency throughout the session

### Requirement 3

**User Story:** As a trainee, I want to interact with realistic guest personas in a dedicated training interface, so that I can practice my skills in an immersive environment without knowing it's a simulation.

#### Acceptance Criteria

1. WHEN a training session starts THEN the system SHALL open a side panel with clear session identification
2. WHEN in an active session THEN the system SHALL allow trainees to type responses in the side panel while keeping the main chat inactive
3. WHEN during a session THEN the system SHALL display a session timer and progress indicator
4. WHEN the guest persona responds THEN the system SHALL maintain authentic character behavior without breaking immersion
5. WHEN trainees make responses THEN the system SHALL ensure natural conversation flow with appropriate information revelation

### Requirement 4

**User Story:** As a training system, I want to silently evaluate trainee performance during sessions, so that I can provide accurate scoring without disrupting the training experience.

#### Acceptance Criteria

1. WHEN evaluating performance THEN the system SHALL analyze responses across policy adherence, empathy index, completeness, escalation judgment, and time efficiency dimensions
2. WHEN scoring responses THEN the system SHALL provide scores (0-100) with specific evidence from the conversation
3. WHEN tracking progress THEN the system SHALL identify missing steps and critical errors without communicating to the trainee
4. WHEN determining session completion THEN the system SHALL check if all required steps are completed, maximum turns reached, or critical errors occurred
5. WHEN outputting evaluations THEN the system SHALL use structured JSON format that remains invisible to trainees

### Requirement 5

**User Story:** As a trainee, I want to receive comprehensive feedback after completing a training session, so that I can understand my performance and identify areas for improvement.

#### Acceptance Criteria

1. WHEN a session completes THEN the system SHALL freeze the side panel and display "Session Complete" with final scores
2. WHEN entering feedback phase THEN the system SHALL activate the main chat area with the feedback generator
3. WHEN providing feedback THEN the system SHALL include overall performance, detailed analysis, SOP citations, actionable recommendations, and resources
4. WHEN generating feedback THEN the system SHALL reference specific SOP documents retrieved via RAG with proper citations
5. WHEN presenting feedback THEN the system SHALL maintain a supportive, professional tone focused on behaviors rather than personal attributes

### Requirement 6

**User Story:** As a system administrator, I want to integrate with Pinecone vector database and Gemini AI, so that the training simulator can access company knowledge and generate intelligent responses.

#### Acceptance Criteria

1. WHEN setting up the system THEN the system SHALL create a Pinecone index with appropriate dimensions for Gemini embeddings
2. WHEN ingesting documents THEN the system SHALL store all SOP documents, scripts, and training materials with proper metadata tagging
3. WHEN configuring Gemini THEN the system SHALL use temperature 0.7 for guest simulator and 0.3 for scoring agents
4. WHEN making API calls THEN the system SHALL implement appropriate token limits (512 for scoring, 1024 for feedback)
5. WHEN retrieving information THEN the system SHALL fetch relevant documents with citations and filter by document type

### Requirement 7

**User Story:** As a user, I want a clear visual distinction between training sessions and feedback phases, so that I understand the current state and can navigate the interface effectively.

#### Acceptance Criteria

1. WHEN managing UI state THEN the system SHALL provide clear visual distinction between active training (side panel) and feedback phase (main chat)
2. WHEN preserving data THEN the system SHALL maintain session history for future reference
3. WHEN sessions complete THEN the system SHALL provide export options for session transcript and feedback
4. WHEN tracking sessions THEN the system SHALL implement proper session ID tracking for contextual feedback
5. WHEN sessions are completed THEN the system SHALL prevent users from modifying the training session data