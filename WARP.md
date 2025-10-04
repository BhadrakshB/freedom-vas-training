# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is an AI-powered training simulator for Short-Term Rental (STR) virtual assistants. The system creates realistic training scenarios where VAs interact with AI-simulated guests to practice handling bookings, complaints, and overbookings in a safe environment.

## Development Commands

### Core Development
```bash
# Start development server with Turbopack
pnpm dev

# Build for production with Turbopack
pnpm build

# Start production server
pnpm start
```

### Testing
```bash
# Run tests in watch mode
pnpm test

# Run tests once (CI mode)
pnpm test:run

# Open Vitest UI for interactive testing
pnpm test:ui
```

### Database Management
```bash
# Generate new migrations from schema changes
pnpm db:generate

# Push schema changes to database
pnpm db:push

# Open Drizzle Studio for database inspection
pnpm db:studio
```

### Code Quality
```bash
# Run ESLint
pnpm lint

# Run TypeScript type checking
pnpm type-check
```

### Bundle Analysis
```bash
# Analyze bundle size (run after build)
node scripts/analyze-bundle.js
```

## Architecture Overview

### Technology Stack
- **Framework**: Next.js 15.5.0 with App Router and Turbopack
- **Runtime**: React 19.1.0 with TypeScript
- **AI Stack**: LangChain + LangGraph with Google Gemini
- **Vector DB**: Pinecone for RAG (knowledge retrieval)
- **Database**: Neon PostgreSQL with Drizzle ORM
- **UI**: Tailwind CSS v4 + Radix UI + shadcn/ui
- **Testing**: Vitest + Testing Library
- **Auth**: Firebase Authentication

### High-Level System Flow
1. **Session Creation**: AI generates scenario and guest persona
2. **Active Training**: VA interacts with AI guest simulator in training panel
3. **Silent Scoring**: Background evaluation tracks performance against company policies
4. **Feedback Phase**: Detailed analysis with SOP citations and recommendations

### Key Architectural Patterns

#### AI Agent Architecture
- **Scenario Creator**: Generates realistic STR scenarios with specific objectives
- **Persona Generator**: Creates detailed guest personas with emotional arcs
- **Guest Simulator**: Simulates guest interactions with personality-driven responses  
- **Silent Scorer**: Evaluates performance across 5 dimensions (policy adherence, empathy, completeness, escalation judgment, time efficiency)
- **Feedback Generator**: Provides comprehensive post-session analysis with SOP citations

Agents are orchestrated through LangGraph workflows and located in `src/app/lib/agents/`.

#### State Management
- **Training Context**: Main state management via React Context + useReducer pattern
- **Session Management**: Server-side session storage with cleanup mechanisms
- **Real-time Updates**: Polling-based session status updates in UI

#### Component Organization
- **Feature-based grouping**: Components organized by functionality, not technical concerns
- **Barrel exports**: Clean imports via `index.ts` files
- **UI separation**: Base components in `/ui`, feature components at component root

#### Database Schema
Located in `src/app/lib/db/schema.ts`. Key entities:
- User sessions and progress tracking
- Training scenarios and personas
- Performance metrics and feedback data
- Knowledge base content for RAG

#### Path Aliases
- `@/*` → `./src/*`
- `@/app/*` → `./src/app/*` 
- `@/components/*` → `./src/app/components/*`
- `@/lib/*` → `./src/app/lib/*`

### RAG Knowledge System
The system uses Pinecone vector database to store and retrieve:
- Company SOPs (Standard Operating Procedures)
- Training materials and best practices
- Customer service scripts and templates

Knowledge retrieval is integrated into scenario generation, silent scoring, and feedback generation to ensure training aligns with company policies.

### Environment Configuration
Key environment variables:
- `GOOGLE_API_KEY`: Google Gemini API access
- `PINECONE_API_KEY`: Vector database access
- `NEXT_PUBLIC_NEON_DATABASE_URL`: PostgreSQL database connection
- Firebase configuration for authentication

### Testing Strategy
- **Component Tests**: React Testing Library for UI components
- **Integration Tests**: Full workflow testing with Vitest
- **Test Setup**: Centralized configuration in `src/test-setup.ts`
- **Mocking**: AI service mocks for reliable testing

### Performance Considerations
- **Turbopack**: Fast development builds and hot reloading
- **Server Components**: Optimized rendering where possible
- **Vector Search**: Efficient similarity search for knowledge retrieval
- **Session Cleanup**: Automatic cleanup of inactive training sessions

### Development Tips
- Training sessions are stored server-side with automatic cleanup
- AI agents use different temperature settings for varied behaviors (scenario creation: 0.7, scoring: 0.2)
- Silent scoring runs in background without user awareness to maintain training immersion
- Use TypeScript strict mode - all interfaces defined in `src/app/lib/types.ts`