# Technology Stack

## Framework & Runtime
- **Next.js 15.5.0** with App Router and Turbopack
- **React 19.1.0** with TypeScript
- **Node.js** runtime environment

## AI & ML Stack
- **LangChain** (`@langchain/core`, `@langchain/langgraph`) for AI agent orchestration
- **Google Gemini** (`@langchain/google-genai`) as primary LLM
- **Pinecone** (`@pinecone-database/pinecone`) for vector database and RAG
- **Zod** for schema validation and structured AI outputs

## Database & Authentication
- **Neon PostgreSQL** as primary database
- **Drizzle ORM** for type-safe database operations
- **Firebase Authentication** for user management
- **Firebase Admin SDK** for server-side auth operations

## UI & Styling
- **Tailwind CSS v4** for styling with PostCSS
- **Radix UI** components for accessible primitives
- **shadcn/ui** component system
- **Lucide React** for icons
- **class-variance-authority** and **clsx** for conditional styling
- **tailwind-merge** for class merging

## State Management
- **React Context** with useState for training session state
- **Custom hooks** for component logic encapsulation
- **Server Actions** for type-safe server-side operations

## Testing
- **Vitest** for unit and integration testing
- **Testing Library** for React component testing
- **jsdom** for DOM simulation
- **@vitest/ui** for test visualization

## Development Tools
- **ESLint** with Next.js config for code quality
- **TypeScript** with strict mode for type safety
- **pnpm** for package management
- **Bundle Analyzer** for build optimization
- **tsx** for TypeScript execution

## Common Commands

```bash
# Development
pnpm dev              # Start dev server with Turbopack
pnpm build            # Build for production with Turbopack
pnpm start            # Start production server

# Testing
pnpm test             # Run tests in watch mode
pnpm test:run         # Run tests once

# Code Quality
pnpm lint             # Run ESLint

# Database
npx drizzle-kit generate    # Generate migrations
npx drizzle-kit migrate     # Run migrations
npx drizzle-kit studio      # Open Drizzle Studio
```

## Path Aliases
- `@/*` → `./src/*`
- `@/app/*` → `./src/app/*`
- `@/components/*` → `./src/app/components/*`
- `@/lib/*` → `./src/app/lib/*`

## Environment Variables
- `NEXT_PUBLIC_FIREBASE_*` - Firebase client configuration
- `FIREBASE_*` - Firebase admin configuration
- `NEON_DATABASE_URL` - PostgreSQL connection string
- `GOOGLE_API_KEY` - Google Gemini API key
- `PINECONE_*` - Pinecone vector database configuration