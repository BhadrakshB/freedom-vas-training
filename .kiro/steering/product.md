# Product Overview

## AI Training Simulator for STR Virtual Assistants

This is an AI-powered training platform designed for Short-Term Rental (STR) virtual assistants. The system creates realistic training scenarios where VAs interact with simulated guests to practice handling various situations like bookings, complaints, and overbookings.

### Core Features

- **Scenario-Based Training**: AI generates realistic STR scenarios with specific objectives, success criteria, and difficulty levels (Easy/Medium/Hard)
- **Persona-Driven Interactions**: AI creates authentic guest personas with demographics, personality traits, communication styles, and escalation behaviors
- **Real-time Customer Simulation**: LangGraph-powered customer simulator that maintains behavioral consistency and tracks resolution acceptance
- **Message Rating & Suggestions**: Each VA message receives real-time scoring with alternative response suggestions
- **Comprehensive Feedback**: Post-session analysis with detailed performance metrics and actionable recommendations
- **Knowledge Integration**: RAG-powered system using Pinecone for SOP and training material retrieval
- **Multi-User Support**: Firebase authentication with thread-based conversation management

### Training Workflow

1. **Session Setup**: 
   - User authentication via Firebase
   - Custom scenario and persona creation or AI generation
   - Training session initialization with unique thread ID

2. **Active Training**: 
   - VA interacts with AI customer simulator in dedicated training panel
   - Real-time message rating and alternative suggestions
   - Behavioral trait tracking and resolution status monitoring
   - Resizable panel interface for optimal user experience

3. **Session Management**:
   - Training status tracking (start → active → complete)
   - Message persistence in PostgreSQL database
   - Error handling with retry mechanisms
   - Session reset and continuation capabilities

4. **Feedback Phase**: 
   - Comprehensive performance analysis
   - Structured feedback with specific improvement areas
   - Historical session comparison and progress tracking

### Technical Architecture

- **Frontend**: React 19 with Next.js 15 App Router and TypeScript
- **AI Orchestration**: LangGraph state machines with Google Gemini LLM
- **Database**: PostgreSQL with Drizzle ORM for type-safe operations
- **Authentication**: Firebase Auth with admin SDK integration
- **Vector Database**: Pinecone for RAG-based knowledge retrieval
- **State Management**: React Context with typed actions and error handling

### User Interface

- **Main Chat Area**: Primary conversation interface with message history
- **Training Panel**: Collapsible side panel for scenario/persona display and customer simulation
- **Status Indicators**: Real-time training status and progress tracking
- **Theme Support**: Light/dark mode with system preference detection
- **Responsive Design**: Optimized for desktop training environments

### Target Users

Virtual assistants working in the short-term rental industry who need to practice customer service scenarios in a safe, controlled environment before handling real guest interactions. The platform supports both individual training sessions and organizational training programs with user management and progress tracking.