# Project Structure

## Directory Organization

```
src/app/
├── adapters/          # External service adapters (Firebase)
├── api/               # API route handlers
│   ├── messages/      # Message CRUD operations
│   ├── threads/       # Thread management
│   ├── threadgroups/  # Thread group operations
│   └── training/      # Training session endpoints
├── auth/              # Authentication pages
├── components/        # React components
│   ├── ui/           # Base UI components (shadcn/ui)
│   └── examples/     # Example implementations
├── contexts/          # React Context providers
├── hooks/             # Custom React hooks
└── lib/               # Core business logic
    ├── actions/       # Next.js Server Actions
    ├── agents/        # AI agent implementations
    │   └── v2/       # Current agent version
    ├── api/          # API client utilities
    ├── db/           # Database schema and queries
    │   └── actions/  # Database operations
    ├── rag-tools/    # RAG and document processing
    ├── types/        # TypeScript type definitions
    └── utils/        # Utility functions
```

## Key Conventions

### Import Aliases

- `@/*`: Root src directory
- `@/app/*`: App directory
- `@/components/*`: Components directory
- `@/lib/*`: Lib directory

### Component Organization

- **UI Components**: Base components in `components/ui/` (shadcn/ui pattern)
- **Feature Components**: Domain-specific components in `components/`
- **Barrel Exports**: Use `index.ts` for clean imports

### Server Actions vs API Routes

- **Prefer Server Actions**: Located in `lib/actions/` for type-safe server operations
- **API Routes**: Used for external integrations or streaming responses
- **Error Handling**: Return error objects, don't throw HTTP errors

### Database Patterns

- **Schema**: Single source of truth in `lib/db/schema.ts`
- **Actions**: Database operations in `lib/db/actions/`
- **Migrations**: Generated in `drizzle/` directory
- **Type Inference**: Use `InferSelectModel` for type safety

### AI Agent Architecture

- **LangGraph**: State machine orchestration in `lib/agents/v2/graph_v2.ts`
- **Agents**: Individual agent implementations (scenario creator, persona generator, guest simulator, etc.)
- **Prompts**: Centralized in `lib/agents/v2/prompts.ts`
- **Tools**: Agent tools in `lib/agents/v2/tools.ts`
- **RAG**: Vector search in `lib/agents/v2/rags.ts`

### State Management

- **React Context**: Global state in `contexts/`
- **useReducer**: Complex state logic
- **Server State**: Managed via Server Actions
- **Polling**: Used for real-time updates (training status)

### Styling

- **Tailwind CSS v4**: Utility-first approach
- **CSS Variables**: Theme tokens in `globals.css`
- **Component Variants**: Use `class-variance-authority` (cva)
- **Utility Function**: `cn()` from `lib/utils.ts` for conditional classes

### File Naming

- **Components**: PascalCase (e.g., `TrainingPanel.tsx`)
- **Utilities**: kebab-case (e.g., `message-feedback-handler.ts`)
- **Actions**: kebab-case with suffix (e.g., `training-actions.ts`)
- **Types**: Singular (e.g., `types.ts`)

### Documentation

- **Implementation Docs**: Root-level markdown files (e.g., `BULK_SESSION_IMPLEMENTATION.md`)
- **Architecture Docs**: In `docs/` directory
- **Component Docs**: Co-located with complex components
- **API Docs**: In respective action/route directories
