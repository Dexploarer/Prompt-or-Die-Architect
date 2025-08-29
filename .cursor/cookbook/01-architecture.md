# ElizaOS Architecture

## System Layers

### 1. Core Runtime Layer (`packages/core/`)
- **Agent Runtime** (`runtime.ts`): Central orchestrator managing agent lifecycle
- **Type System** (`types/index.ts`): Comprehensive TypeScript definitions
- **Memory System** (`entities.ts`, `database.ts`): Persistent and working memory
- **Service Registry**: Dependency injection container for external integrations

### 2. Component Layer (`packages/plugin-*`)
- **Actions**: Handle user commands, return `ActionResult` for chaining
- **Providers**: Supply context for LLM prompts (read-only)
- **Evaluators**: Post-interaction learning and reflection
- **Services**: Stateful external integrations (APIs, databases, wallets)

### 3. Platform Abstraction Layer
- **Messaging**: Channel → Room mapping for platform-agnostic chat
- **Identity**: UUID-based system with agent-specific swizzling
- **State Management**: Per-agent isolated contexts and memory

### 4. API & Transport Layer (`packages/server/`, `packages/api-client/`)
- **REST API**: CRUD operations for agents, memories, messages
- **WebSocket**: Real-time bidirectional communication via Socket.IO
- **Type-safe Client**: Generated from server API definitions

### 5. Frontend Layer (`packages/client/`, `packages/app/`)
- **React Dashboard**: Agent management, chat interfaces, system monitoring
- **Tauri App**: Desktop/mobile deployment wrapper
- **Real-time Updates**: Socket.IO integration for live data

## Architectural Boundaries

### Core → Plugin Direction Only
```typescript
// ✅ ALLOWED: Plugins depend on core
import { Action, IAgentRuntime } from '@elizaos/core';

// ❌ FORBIDDEN: Core depends on plugins
// import { TwitterAction } from '@elizaos/plugin-twitter';
```

### Service Isolation
- Services cannot directly call other services without runtime mediation
- All inter-service communication through `IAgentRuntime.getService()`
- Services own their state, Actions coordinate between services

### Memory Boundary Enforcement
- Agent memory completely isolated by UUID
- No cross-agent memory access without explicit relationship
- Working memory cleared between message processing cycles

### Platform Abstraction
- Platform-specific code isolated in client packages
- Core uses abstract Room/World concepts only
- Message routing handled at runtime level, not component level

## Data Flow

### Message Processing Pipeline
```
1. Platform Client → Runtime.processMessage()
2. Runtime → Memory.getMemories() [Context retrieval]
3. Runtime → Provider.get() [Dynamic context]
4. Runtime → Model.generateResponse() [LLM interaction]
5. Runtime → Action.handler() [Command execution]
6. Runtime → Evaluator.evaluate() [Post-processing]
7. Runtime → Memory.createMemory() [Persistence]
8. Runtime → Platform Client [Response delivery]
```

### Service Interaction Pattern
```typescript
// Action handler coordinating multiple services
handler: async (runtime, message, state, options, callback) => {
  const walletService = runtime.getService<WalletService>('wallet');
  const dbService = runtime.getDatabaseAdapter();
  
  // Service coordination through runtime only
  const balance = await walletService.getBalance();
  await dbService.log({ action: 'balance_check', balance });
  
  return { success: true, data: { balance } };
};
```

### Memory Flow Architecture
```
Short-term (Working) Memory ←→ Runtime ←→ Long-term (Persistent) Memory
                ↓                           ↓
        Per-session context          Database storage
        Cleared after response       Searchable embeddings
```

## Dependency Rules

### Workspace Dependencies
```json
// ✅ CORRECT: All internal deps use workspace:*
{
  "dependencies": {
    "@elizaos/core": "workspace:*",
    "@elizaos/plugin-sql": "workspace:*"
  }
}

// ❌ INCORRECT: Never hardcode versions for internal packages
{
  "dependencies": {
    "@elizaos/core": "1.4.4"  // Breaks monorepo resolution
  }
}
```

### Build Dependencies (Turbo)
- Core builds before all other packages
- Server depends on core build completion
- CLI depends on core build completion
- Client can build independently (uses API client)

### Runtime Dependencies
- Services registered at startup, available throughout agent lifecycle
- Actions/Providers/Evaluators loaded per-plugin, per-agent
- Memory adapters initialized once per agent runtime

## Extension Points

### Plugin System
```typescript
// Plugin registration pattern
export const myPlugin: Plugin = {
  name: 'my-plugin',
  services: [MyService],      // State management
  actions: [MyAction],        // User interactions
  providers: [MyProvider],    // Context suppliers
  evaluators: [MyEvaluator]   // Learning processors
};
```

### Service Type Extension
```typescript
// Extend core service registry via module augmentation
declare module '@elizaos/core' {
  interface ServiceTypeRegistry {
    MY_CUSTOM_SERVICE: 'my_custom_service';
  }
}
```

### Model Provider Extension
- Implement `ModelHandler` interface
- Register in `MODEL_SETTINGS` configuration
- Support both streaming and non-streaming responses

### Database Adapter Extension
- Implement `IDatabaseAdapter` interface
- Handle all core entity types (Memory, Room, Participant, etc.)
- Support both SQL and NoSQL backends

## Communication Patterns

### Agent-to-Agent Communication
- Shared memory spaces via Room relationships
- Message routing through runtime message bus
- No direct agent references, all communication via UUIDs

### Client-Server Communication
- REST API for CRUD operations
- WebSocket for real-time updates (chat, agent status)
- Type-safe contracts via `@elizaos/api-client`

### Service-to-External System
- All external API calls through Service implementations
- Retry logic and error handling in service layer
- Configuration via environment variables

## Scalability Considerations

### Memory Management
- Working memory size limits prevent unbounded growth
- Embeddings for semantic search of long-term memory
- Periodic cleanup of stale memories via background tasks

### Multi-Agent Coordination
- UUID-based identity prevents ID collision across agents
- Room-based message routing allows selective agent activation
- Service sharing reduces resource duplication

### Performance Isolation
- Each agent runtime runs in isolated context
- Service instances shared across agents in same process
- Database connection pooling handled by adapter layer

## Error Boundaries

### Runtime Error Handling
- Agent runtime continues despite individual component failures
- Error isolation: Action failures don't crash entire agent
- Graceful degradation: Missing services disable dependent features

### Service Error Propagation
- Service failures bubble up as ActionResult errors
- Retry logic implemented at service layer
- Circuit breakers prevent cascade failures

### Memory Consistency
- Transactional memory operations where supported
- Eventual consistency acceptable for non-critical data
- Conflict resolution via last-write-wins or timestamp ordering

## TODOs & Architectural Gaps

- [ ] Formal plugin versioning and compatibility matrix
- [ ] Distributed agent deployment across multiple processes/machines  
- [ ] Plugin sandboxing for untrusted code execution
- [ ] Standardized metrics and observability hooks
- [ ] Hot plugin reloading without agent restart
- [ ] Cross-agent memory sharing security model