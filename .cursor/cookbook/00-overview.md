# ElizaOS Repository Overview

## Mission
ElizaOS is a multi-agent AI framework for building, deploying, and managing autonomous agents that can interact across various platforms (Discord, Telegram, Farcaster) and integrate with multiple LLM providers.

## Repository Map

### Core Architecture
```
eliza/
├── packages/core/           # Core runtime, types, agents, database abstractions
├── packages/cli/            # Command-line interface for agent management
├── packages/server/         # HTTP/WebSocket API server with real-time comm
├── packages/client/         # React dashboard for managing agents & groups
├── packages/api-client/     # Type-safe client for ElizaOS server APIs
└── packages/app/           # Tauri desktop/mobile application
```

### Plugin System
```
├── packages/plugin-bootstrap/    # Default actions, providers, evaluators
├── packages/plugin-sql/         # Database adapters (PostgreSQL, PGLite)
├── packages/plugin-dummy-services/ # Mock services for testing
├── packages/plugin-quick-starter/  # Minimal plugin template
└── packages/plugin-starter/     # Full-featured plugin template
```

### Project Templates
```
├── packages/project-starter/     # Standard agent project template
├── packages/project-tee-starter/ # Trusted Execution Environment template
└── packages/create-eliza/       # Project scaffolding CLI tool
```

### Development & Configuration
```
├── packages/config/         # Shared ESLint, Prettier, TypeScript configs
└── packages/test-utils/     # Testing infrastructure and mocks
```

## Core Domains

### Agent Runtime System
- **File**: `/packages/core/src/runtime.ts`
- Manages agent lifecycle, memory, message processing
- Coordinates services, actions, providers, evaluators
- Handles model interactions and response generation

### Component Architecture
- **Actions**: User command handlers (`/packages/plugin-bootstrap/src/actions/`)
- **Providers**: Context suppliers for prompts (`/packages/plugin-bootstrap/src/providers/`)
- **Evaluators**: Post-interaction processors (`/packages/plugin-bootstrap/src/evaluators/`)
- **Services**: External integrations and state management

### Memory & Persistence
- **Memory Types**: Short-term (working), long-term (persistent)
- **Database Adapters**: Abstract interface with PostgreSQL/PGLite implementations
- **Schema**: `/packages/plugin-sql/src/schema/` - Drizzle ORM definitions

### Multi-Platform Support
- Channel → Room abstraction for platform-agnostic messaging
- Server → World mapping for multi-server agent presence
- UUID-based identity system with agent-specific swizzling

## Key Packages & Scripts

### Essential Commands
```bash
# Package management (Bun-only, NEVER npm/pnpm)
bun install                  # Install dependencies
bun run build               # Build all packages (excludes docs)
bun run build:core          # Build core package only
bun run build:cli           # Build CLI package only

# Development workflow
bun start                   # Start CLI with agent runtime
bun run dev                 # Development mode with auto-rebuild
bun test                    # Run test suite (excludes certain packages)
bun run lint               # Lint and format codebase

# Production deployment
elizaos create my-agent     # Create new project (global CLI)
elizaos start              # Run agent in production
```

### Package Dependencies
- **Core Hierarchy**: Everything depends on `@elizaos/core`
- **No Circular Deps**: Core cannot depend on other packages
- **Workspace References**: All internal deps use `workspace:*`

### Build System
- **Turbo**: Monorepo task orchestration (`/turbo.json`)
- **Lerna**: Publishing and versioning (`/lerna.json`)
- **TypeScript**: Shared configs in `/packages/config/src/typescript/`
- **Node Version**: 23.3.0 (specified in `/package.json`)

## Technology Stack

### Core Runtime
- **TypeScript**: Primary language with strict typing
- **Bun**: Package manager, test runner, and process execution
- **UUID**: Deterministic ID generation for multi-agent coordination

### Persistence Layer
- **Drizzle ORM**: Type-safe database operations
- **PostgreSQL**: Production database
- **PGLite**: Lightweight development database

### Frontend Stack
- **React 19**: UI framework with strict hooks
- **Vite**: Build tooling and development server
- **Tailwind CSS**: Utility-first styling
- **Socket.IO**: Real-time communication

### Platform Integrations
- Multiple LLM providers (OpenAI, Anthropic, Llama, etc.)
- Social platforms (Discord, Telegram, Farcaster)
- Web3 wallets and DeFi protocols

## Key Architectural Decisions

### Package Management Constraints
- **CRITICAL**: Only Bun allowed, never npm/pnpm
- **Rationale**: Consistency, performance, and native TypeScript support

### Process Execution
- **NEVER use**: Node.js child_process, execa libraries
- **ALWAYS use**: Bun.spawn() or bun-exec utilities (`/packages/cli/src/utils/bun-exec.ts`)
- **Rationale**: Bun compatibility and consistent error handling

### Event System
- **NEVER use**: Node.js EventEmitter
- **ALWAYS use**: EventTarget with CustomEvent pattern
- **Rationale**: Bun compatibility and modern web standards

### Testing Strategy
- **Framework**: Bun test only (never Jest, Vitest, Mocha)
- **Scope**: Integration tests preferred over isolated unit tests
- **Coverage**: Real runtime testing with actual integrations

### Component Separation
- **Services**: Stateful external integrations, accessed via `getService()`
- **Actions**: User command handlers, return `ActionResult` for chaining
- **Providers**: Read-only context suppliers for prompts
- **Evaluators**: Post-interaction learning and reflection

## Development Workflow

1. **Never create stubs** - Always implement complete, working code
2. **Test-driven** - Write tests before implementation when possible
3. **Build verification** - All changes must pass `bun run build` and `bun test`
4. **Type safety** - No `any`, `unknown`, or `never` types
5. **Error handling** - Comprehensive error boundaries and logging

## Notable Constraints & Conventions

### Import Patterns
- Internal references: Use `packages/core` for file paths
- Package imports: Use `@elizaos/core` for dependencies
- Plugin extends: Use module augmentation for service types

### File Organization
- One file per major component (Action, Provider, Evaluator, Service)
- Tests alongside source in `__tests__/` directories
- Templates in `/packages/cli/templates/` for scaffolding

### Environment Configuration
- Model provider keys (OPENAI_API_KEY, ANTHROPIC_API_KEY)
- Platform tokens (DISCORD_API_TOKEN, TELEGRAM_BOT_TOKEN)
- Database URLs (POSTGRES_URL, defaults to PGLite)
- Logging levels (LOG_LEVEL: debug, info, warn, error)