# Project Structure

## Directory Organization

### `/src/app` - Next.js App Router Structure
- **`/api`** - API routes for backend functionality
  - `/chat` - Main chat interface endpoints
  - `/training` - Training session management endpoints
- **`/components`** - React components organized by feature
  - `/ui` - shadcn/ui base components (Button, Card, Dialog, etc.)
  - Feature components (ChatInterface, TrainingPanel, FeedbackDisplay)
  - `index.ts` - Barrel exports for clean imports
- **`/contexts`** - React Context providers
  - `ThemeContext.tsx` - Theme management
  - `TrainingContext.tsx` - Training session state management
- **`/lib`** - Core business logic and utilities
  - `/agents` - AI agent implementations (chat, feedback, scoring, etc.)
  - Core services (session-manager, pinecone-service, types, utils)

### Key Architectural Patterns

#### Component Organization
- **Barrel Exports**: Use `index.ts` files for clean component imports
- **Feature Grouping**: Components grouped by functionality, not technical concerns
- **UI Separation**: Base UI components in `/ui`, feature components at root level

#### State Management
- **Context + Reducer**: Training state managed via TrainingContext with useReducer
- **Typed Actions**: All state updates through typed action dispatchers
- **Computed Properties**: Derived state exposed as computed properties from context

#### Type Safety
- **Centralized Types**: All interfaces in `/lib/types.ts`
- **Strict TypeScript**: Full type coverage with strict mode enabled
- **Interface Segregation**: Separate interfaces for different concerns (UI state, API data, etc.)

#### AI Agent Architecture
- **Agent Separation**: Each AI agent (scenario creator, persona generator, etc.) in separate files
- **LangGraph Integration**: Agents orchestrated through LangGraph workflows
- **RAG Integration**: Pinecone service provides context retrieval for agents

#### Testing Strategy
- **Component Tests**: React Testing Library for UI components
- **Integration Tests**: Full workflow testing in `__tests__` directories
- **Test Setup**: Centralized test configuration in `src/test-setup.ts`

### File Naming Conventions
- **Components**: PascalCase (e.g., `TrainingPanel.tsx`)
- **Utilities**: kebab-case (e.g., `session-manager.ts`)
- **Types**: kebab-case (e.g., `service-interfaces.ts`)
- **Tests**: `*.test.tsx` or `*.test.ts`

### Import Patterns
- Use path aliases (`@/components/*`, `@/lib/*`) for internal imports
- Barrel exports for component collections
- Explicit imports for utilities and types