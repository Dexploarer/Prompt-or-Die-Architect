# ElizaOS Glossary

## Core Concepts

### Agent
An autonomous AI entity with personality, memory, and behavioral patterns. Each agent has a unique UUID and operates independently with its own runtime environment.
- **Files**: `/packages/core/src/runtime.ts`, `/packages/core/src/types/agent.ts`
- **Example**: Customer support agent, trading bot, game NPC

### Agent Runtime (IAgentRuntime)
The execution environment for an agent. Manages message processing, memory, services, and component lifecycle.
- **Interface**: `IAgentRuntime` in `/packages/core/src/types/runtime.ts`
- **Implementation**: `AgentRuntime` class in `/packages/core/src/runtime.ts`

### Character
Configuration defining an agent's personality, knowledge, and behavior patterns. Includes bio, lore, examples, and settings.
- **Schema**: `/packages/core/src/schemas/character.ts`
- **Type**: `Character` interface in `/packages/core/src/types/agent.ts`

## Component Architecture

### Action
Component that handles user commands and interactions. Takes a message as input and returns an ActionResult.
- **Interface**: `Action` in `/packages/core/src/types/components.ts`
- **Pattern**: Must implement `handler`, `name`, `description`, `validate`, `examples`
- **Example**: Send message, update profile, post tweet

### Provider
Component that supplies context information for LLM prompts. Read-only, provides formatted strings based on agent state.
- **Interface**: `Provider` in `/packages/core/src/types/components.ts`
- **Pattern**: Implements `get()` method returning formatted context string
- **Example**: Time provider, facts provider, recent messages provider

### Evaluator  
Component that processes interactions after completion. Enables agent learning, reflection, and memory updates.
- **Interface**: `Evaluator` in `/packages/core/src/types/components.ts`
- **Pattern**: Implements `evaluate()` method for post-interaction processing
- **Example**: Goal evaluation, fact extraction, relationship updates

### Service
Component managing external integrations and stateful operations. Handles APIs, databases, and system interactions.
- **Interface**: `Service` in `/packages/core/src/types/service.ts`
- **Pattern**: Extends base `Service` class, accessed via `runtime.getService()`
- **Example**: Twitter service, wallet service, database service

### Plugin
Collection of components (Actions, Providers, Evaluators, Services) that add capabilities to agents.
- **Interface**: `Plugin` in `/packages/core/src/types/plugin.ts`
- **Structure**: Name, description, and arrays of component instances
- **Example**: Twitter plugin, Discord plugin, SQL plugin

## Memory System

### Memory
Stored information from agent interactions. Can be messages, facts, relationships, or other data.
- **Type**: `Memory` interface in `/packages/core/src/types/memory.ts`
- **Properties**: id, content, roomId, agentId, userId, timestamp, type
- **Storage**: Persisted via IDatabaseAdapter

### Working Memory
Temporary memory used during message processing. Cleared after each interaction.
- **Scope**: Single message processing cycle
- **Purpose**: Store intermediate results, action chains
- **Implementation**: `WorkingMemoryEntry[]` in runtime

### Long-term Memory
Persistent storage of agent experiences, facts, and relationships. Searchable via embeddings.
- **Scope**: Agent lifetime
- **Purpose**: Knowledge retention, context building
- **Search**: Vector similarity search for relevant memories

### Embedding
Vector representation of memory content used for semantic search and similarity matching.
- **Storage**: Database embedding columns
- **Usage**: Find relevant memories for context building
- **Generation**: Via embedding service during memory creation

## Platform Abstractions

### Room
Platform-agnostic representation of a conversation space (Discord channel, Telegram chat, etc.).
- **Type**: `Room` interface in `/packages/core/src/types/primitives.ts`
- **Mapping**: Discord Channel → Room, Telegram Chat → Room
- **Properties**: id, name, participants, metadata

### World  
Platform-agnostic representation of a server or platform instance containing multiple rooms.
- **Type**: `World` interface in `/packages/core/src/types/primitives.ts`
- **Mapping**: Discord Server → World, Telegram Group → World
- **Properties**: id, name, rooms, participants

### Participant
Platform-agnostic representation of a user or entity that can send messages.
- **Type**: `Participant` interface in `/packages/core/src/types/primitives.ts`
- **Mapping**: Discord User → Participant, Telegram User → Participant
- **Properties**: id, name, username, details

### Message/Memory Mapping
- **Platform Message**: Native platform message format
- **Memory**: ElizaOS internal message representation
- **Conversion**: Platform adapters transform between formats

## Data Types

### UUID
Universally Unique Identifier used for all entity IDs in ElizaOS.
- **Type**: `UUID` branded string type
- **Generation**: `uuidv4()` for new entities, `createUniqueUuid()` for agent-scoped IDs
- **Swizzling**: Agent-specific UUID generation for consistent cross-agent identity

### Content
Structured data representing message content with text and optional action.
- **Type**: `Content` interface in `/packages/core/src/types/primitives.ts`
- **Properties**: text (required), action (optional), metadata
- **Usage**: All messages, memories, and responses use Content format

### State
Context object passed between components during message processing.
- **Type**: `State` interface in `/packages/core/src/types/state.ts`
- **Purpose**: Share data between actions, providers, evaluators
- **Lifecycle**: Created per message, passed through processing chain

## Database & Persistence

### IDatabaseAdapter
Interface defining database operations for agent memory and data storage.
- **Interface**: `/packages/core/src/types/database.ts`
- **Implementations**: PostgresAdapter, PgliteAdapter, MockDatabaseAdapter
- **Methods**: getMemories, createMemory, searchMemories, etc.

### Drizzle ORM
TypeScript-first ORM used for database schema and query management.
- **Schema**: `/packages/plugin-sql/src/schema/`
- **Usage**: Type-safe queries, migrations, multi-database support
- **Benefits**: Compile-time validation, excellent TypeScript integration

### Migration
Database schema changes managed through versioned migration files.
- **Location**: `/packages/plugin-sql/src/schema/`
- **Tool**: Drizzle migration system
- **Execution**: `bun run migrate` command

## API & Communication

### ActionResult
Response object returned by Action handlers to indicate success/failure and pass data.
- **Type**: `ActionResult` interface
- **Properties**: success, text?, data?, error?
- **Usage**: Action chaining, response handling

### HandlerCallback
Function passed to Action handlers for sending responses to users.
- **Type**: `HandlerCallback` function type
- **Usage**: `await callback({ text: 'Response', action: 'ACTION_NAME' })`
- **Purpose**: Send messages back to platform/user

### Route
HTTP route definition for plugin-provided web endpoints.
- **Type**: `Route` interface in `/packages/core/src/types/plugin.ts`
- **Properties**: path, method, handler
- **Usage**: Plugins can expose HTTP endpoints for web interfaces

## Development Tools

### ElizaOS CLI (`elizaos`)
Command-line interface for creating, managing, and running ElizaOS projects.
- **Package**: `/packages/cli/`
- **Commands**: create, start, dev, test, build, publish
- **Global Install**: `bun install -g @elizaos/cli`

### Test Utils
Utilities and infrastructure for testing ElizaOS components.
- **Package**: `/packages/test-utils/`
- **Features**: Test database, mock runtime, character factories
- **Usage**: Integration testing, component testing

### Build System
Monorepo build orchestration using Turbo and TypeScript.
- **Config**: `/turbo.json`, `/tsconfig.json`
- **Commands**: `bun run build`, `bun run build:core`
- **Dependencies**: Respects package dependency order

## Abbreviations & Acronyms

### API
**Application Programming Interface** - ElizaOS provides REST and WebSocket APIs

### ADR  
**Architectural Decision Record** - Documented decisions about system design

### CLI
**Command Line Interface** - The `elizaos` command-line tool

### CRUD
**Create, Read, Update, Delete** - Basic database operations

### DI
**Dependency Injection** - Service registration and retrieval pattern

### E2E
**End-to-End** - Testing complete user workflows

### HTTP
**HyperText Transfer Protocol** - Web communication protocol

### I/O
**Input/Output** - Data transfer operations (file, network, database)

### JWT
**JSON Web Token** - Authentication token format

### LLM
**Large Language Model** - AI models like GPT-4, Claude, Gemini

### LRU  
**Least Recently Used** - Cache eviction strategy

### NPC
**Non-Player Character** - Game character controlled by AI

### ORM
**Object-Relational Mapping** - Database abstraction layer (Drizzle)

### REST
**Representational State Transfer** - HTTP API architectural style

### SDK
**Software Development Kit** - Tools for developing with ElizaOS

### SPA
**Single Page Application** - Client-side web application architecture

### SQL
**Structured Query Language** - Database query language

### TEE
**Trusted Execution Environment** - Secure computation environment

### TTS
**Text-to-Speech** - Converting text to audio

### UI/UX
**User Interface / User Experience** - Frontend design and interaction

### UUID
**Universally Unique Identifier** - 128-bit unique identifier

### WebSocket
**WebSocket Protocol** - Real-time bidirectional communication

## File Extensions & Formats

### `.ts` 
TypeScript source files - Primary development language

### `.js`
JavaScript files - Compiled output or configuration

### `.json`
JSON configuration files - package.json, tsconfig.json, etc.

### `.md`
Markdown documentation files

### `.toml`
TOML configuration files - bunfig.toml, config.toml

### `.sql`
SQL migration and schema files

### `.env`
Environment variable configuration files

### `.lock`
Dependency lock files - bun.lock

## Platform-Specific Terms

### Discord
- **Guild**: Discord server (maps to World)
- **Channel**: Chat channel (maps to Room) 
- **User**: Discord user (maps to Participant)
- **Bot**: Discord application (ElizaOS agent)

### Telegram  
- **Chat**: Conversation space (maps to Room)
- **Group**: Multi-user chat (maps to World)
- **User**: Telegram user (maps to Participant)
- **Bot**: Telegram bot account (ElizaOS agent)

### Twitter/X
- **Tweet**: Public message
- **DM**: Direct message (maps to Room)
- **Space**: Audio conversation room
- **User**: Twitter account (maps to Participant)

### Farcaster
- **Cast**: Public message (like tweet)
- **Channel**: Topic-based conversation space
- **Frame**: Interactive widget within casts

## Configuration Terms

### Model Provider
AI service providing language models (OpenAI, Anthropic, Google, etc.)

### Model Settings
Configuration for LLM behavior (temperature, maxTokens, model name)

### Client Config
Platform-specific configuration for connections and behavior

### Environment
Runtime environment (development, production, test)

### Log Level
Logging verbosity (debug, info, warn, error, fatal)

## TODOs & Missing Definitions

- [ ] WebRTC terms for voice/video features
- [ ] Blockchain/Web3 terminology for wallet features  
- [ ] Docker/containerization terms
- [ ] Performance monitoring terminology
- [ ] Security and authentication terms
- [ ] CI/CD pipeline terminology