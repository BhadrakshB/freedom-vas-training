# Project Structure

## Directory Organization

### `/src/app` - Next.js App Router Structure
- **`/adapters`** - External service integrations
  - `/firebase` - Firebase client and admin configurations
- **`/auth`** - Authentication pages and components
- **`/components`** - React components organized by feature
  - `/ui` - shadcn/ui base components (Button, Card, Dialog, etc.)
  - Feature components (TrainingPanel, FeedbackDisplay, MessageArea, etc.)
  - `index.ts` - Barrel exports for clean imports
- **`/contexts`** - React Context providers
  - `AuthContext.tsx` - Firebase authentication state
  - `CoreAppDataContext.tsx` - Application data management
  - `ThemeContext.tsx` - Theme management
  - `TrainingContext.tsx` - Training session state management
- **`/hooks`** - Custom React hooks
  - `useAuthListener.ts` - Firebase auth state listener
- **`/lib`** - Core business logic and utilities
  - `/actions` - Next.js Server Actions for type-safe server operations
  - `/agents` - AI agent implementations with LangGraph workflows
    - `/v2` - Current agent implementation (graph_v2.ts, prompts.ts, etc.)
  - `/db` - Database layer with Drizzle ORM
    - `/actions` - Database operations (CRUD)
    - `schema.ts` - Database schema definitions
  - `/hooks` - Server-side hooks and utilities
  - `/rag-tools` - RAG implementation with Pinecone
  - `/types` - TypeScript type definitions
  - Core utilities (validation, error-handling, utils)

### Key Architectural Patterns

#### Component Organization
- **Barrel Exports**: Use `index.ts` files for clean component imports
- **Feature Grouping**: Components grouped by functionality, not technical concerns
- **UI Separation**: Base UI components in `/ui`, feature components at root level
- **Specialized Components**: AuthStatus, ProtectedRoute, CollapsiblePanel for specific features

#### State Management
- **Context + useState**: Training state managed via TrainingContext with useState hooks
- **Typed Actions**: All state updates through typed action functions
- **Multi-Context Architecture**: Separate contexts for auth, theme, training, and core app data
- **Extended Message Types**: Custom ExtendedHumanMessage with rating and suggestions

#### Data Layer
- **Server Actions**: Type-safe server operations replacing API routes
- **Database Actions**: Separate CRUD operations for each entity (users, threads, messages)
- **Drizzle ORM**: Type-safe database operations with PostgreSQL
- **Firebase Integration**: Authentication with both client and admin SDKs

#### AI Agent Architecture
- **LangGraph State Management**: StateGraph with typed annotations for agent workflows
- **Structured Outputs**: Zod schemas for all AI responses (scenarios, personas, feedback)
- **Multi-Agent System**: Separate agents for customer simulation, scenario generation, persona creation, and feedback
- **RAG Integration**: Pinecone service with document processing and embedding

#### Type Safety
- **Centralized Types**: All interfaces in `/lib/types.ts`
- **Strict TypeScript**: Full type coverage with strict mode enabled
- **Schema Validation**: Zod schemas for runtime type checking
- **Database Types**: Inferred types from Drizzle schema

#### Testing Strategy
- **Vitest Configuration**: Custom config with jsdom environment
- **Component Tests**: React Testing Library for UI components
- **Test Setup**: Centralized configuration in `src/test-setup.ts`
- **Path Aliases**: Consistent alias resolution in tests

### File Naming Conventions
- **Components**: PascalCase (e.g., `TrainingPanel.tsx`, `MessageArea.tsx`)
- **Utilities**: kebab-case (e.g., `error-handling.ts`, `document-processor.ts`)
- **Database**: kebab-case (e.g., `user-actions.ts`, `thread-actions.ts`)
- **Actions**: kebab-case with suffix (e.g., `training-actions.ts`, `message-actions.ts`)
- **Tests**: `*.test.tsx` or `*.test.ts`

### Import Patterns
- Use path aliases (`@/components/*`, `@/lib/*`) for internal imports
- Barrel exports for component collections and actions
- Explicit imports for utilities and types
- Context imports from centralized index files

### Database Schema
- **User Management**: User table with separate UserAuth for multiple providers
- **Thread System**: Conversation threads linked to users
- **Message Storage**: Individual messages within threads
- **Training Sessions**: Structured training data with scenarios and personas