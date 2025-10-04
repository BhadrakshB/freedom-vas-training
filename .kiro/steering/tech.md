# Technology Stack

## Core Framework

- **Next.js 15.5.0**: App Router with Turbopack for fast builds
- **React 19.1.0**: Latest React with server/client components
- **TypeScript 5**: Strict mode enabled for type safety

## AI/ML Stack

- **LangChain 0.3.31**: AI orchestration framework
- **LangGraph 0.4.6**: State machine for multi-agent workflows
- **Google Gemini**: LLM provider (gemini-1.5-flash, gemini-1.5-pro)
- **Pinecone**: Vector database for RAG implementation

## Database & ORM

- **Neon PostgreSQL**: Serverless PostgreSQL database
- **Drizzle ORM 0.44.5**: Type-safe database queries
- **Drizzle Kit 0.31.4**: Schema migrations

## UI Components

- **Tailwind CSS v4**: Utility-first styling
- **Radix UI**: Accessible component primitives
- **shadcn/ui**: Pre-built component library
- **Lucide React**: Icon library

## Authentication

- **Firebase 12.2.1**: Client-side auth
- **Firebase Admin 13.5.0**: Server-side auth verification

## Testing

- **Vitest 3.2.4**: Unit and integration testing
- **Testing Library**: React component testing
- **jsdom**: DOM environment for tests

## Package Manager

- **pnpm**: Fast, disk-efficient package manager

## Common Commands

```bash
# Development
pnpm dev              # Start dev server with Turbopack
pnpm build            # Build for production
pnpm start            # Start production server

# Database
pnpm db:generate      # Generate migrations
pnpm db:push          # Push schema changes
pnpm db:studio        # Open Drizzle Studio

# Testing
pnpm test             # Run tests in watch mode
pnpm test:run         # Run tests once
pnpm test:ui          # Open Vitest UI

# Code Quality
pnpm lint             # Run ESLint
```

## Environment Variables

Required environment variables:
- `GOOGLE_API_KEY`: Google Gemini API key
- `PINECONE_API_KEY`: Pinecone vector database key
- `PINECONE_INDEX_NAME`: Pinecone index name
- `DATABASE_URL`: Neon PostgreSQL connection string
- Firebase configuration variables (client and admin)

## Build Configuration

- **Turbopack**: Enabled for dev and build
- **Bundle Analyzer**: Available with `ANALYZE=true`
- **Package Optimization**: Radix UI and Lucide React optimized
