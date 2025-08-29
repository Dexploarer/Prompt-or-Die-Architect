# ElizaOS Architectural Decision Records (ADRs)

## ADR-001: Bun-Only Package Management

**Status**: Adopted  
**Date**: 2024-01-15  
**Context**: Need standardized package management across monorepo

### Decision
Use Bun exclusively for all package management, never npm or pnpm.

### Rationale
- **Performance**: Bun installs are 2-3x faster than npm
- **TypeScript Native**: Built-in TypeScript support without compilation step
- **Test Runner**: Integrated test framework eliminates external dependencies
- **Consistency**: Single tool for install, run, test, build operations
- **Bundle Size**: Smaller runtime footprint compared to Node.js alternatives

### Consequences
- ✅ Faster CI/CD pipelines
- ✅ Simplified developer setup
- ✅ Native TypeScript execution
- ❌ Limited ecosystem compared to npm
- ❌ Potential compatibility issues with some packages
- ❌ Learning curve for developers familiar with npm

### Implementation
```bash
# Enforced in all package.json files
"packageManager": "bun@1.2.15"

# CI/CD uses bun exclusively
bun install
bun run build
bun test
```

---

## ADR-002: EventTarget over EventEmitter

**Status**: Adopted  
**Date**: 2024-01-20  
**Context**: Event system compatibility with Bun runtime

### Decision
Replace Node.js EventEmitter with web-standard EventTarget + CustomEvent.

### Rationale
- **Bun Compatibility**: EventEmitter has known issues with Bun runtime
- **Web Standards**: EventTarget is standard across all JS environments
- **Future Proof**: Aligns with web platform evolution
- **Cross-Platform**: Works in browser, Node.js, Bun, and Deno
- **Type Safety**: Better TypeScript support with CustomEvent generics

### Consequences
- ✅ Bun runtime compatibility
- ✅ Browser/server code sharing
- ✅ Standards compliance
- ❌ Migration effort from existing EventEmitter code
- ❌ Slightly more verbose API
- ❌ Less familiar to Node.js developers

### Implementation
```typescript
// Before: EventEmitter
class OldBus extends EventEmitter {
  publishMessage(type: string, data: any) {
    this.emit(type, data);
  }
}

// After: EventTarget
class MessageBus extends EventTarget {
  publishMessage(type: string, data: any) {
    this.dispatchEvent(new CustomEvent(type, { detail: data }));
  }
}
```

---

## ADR-003: Bun.spawn() for Process Execution

**Status**: Adopted  
**Date**: 2024-01-25  
**Context**: Process execution reliability and performance

### Decision
Use Bun.spawn() for all process execution, never Node.js child_process or execa.

### Rationale
- **Performance**: Bun.spawn() has lower overhead than child_process
- **Reliability**: Better error handling and process cleanup
- **Consistency**: Single API across all process execution needs
- **Type Safety**: Better TypeScript definitions than alternatives
- **Resource Management**: Automatic cleanup prevents resource leaks

### Consequences
- ✅ Better process management
- ✅ Improved error handling
- ✅ Performance gains
- ❌ Bun-specific API (less portable)
- ❌ Migration effort from existing child_process code
- ❌ Fewer third-party utilities available

### Implementation
```typescript
// Utility wrapper (packages/cli/src/utils/bun-exec.ts)
export const bunExec = async (
  command: string, 
  args: string[], 
  options: SpawnOptions = {}
): Promise<SpawnResult> => {
  return Bun.spawn([command, ...args], {
    stdout: 'pipe',
    stderr: 'pipe',
    ...options
  });
};
```

---

## ADR-004: Workspace-Only Internal Dependencies

**Status**: Adopted  
**Date**: 2024-02-01  
**Context**: Monorepo dependency management and build reliability

### Decision
All internal package dependencies must use `workspace:*`, never hardcoded versions.

### Rationale
- **Build Consistency**: Ensures all packages use locally built versions
- **Development Workflow**: Changes immediately available across packages
- **Version Alignment**: Eliminates version mismatch issues
- **Monorepo Benefits**: Leverages workspace dependency resolution
- **Publishing Safety**: Prevents accidental external version references

### Consequences
- ✅ Reliable builds and development
- ✅ Simplified dependency management
- ✅ No version drift between packages
- ❌ Cannot pin to specific internal versions
- ❌ All internal packages must be built together
- ❌ Less flexibility in package release cycles

### Implementation
```json
// ✅ Correct internal dependencies
{
  "dependencies": {
    "@elizaos/core": "workspace:*",
    "@elizaos/plugin-sql": "workspace:*"
  }
}

// ❌ Forbidden hardcoded versions
{
  "dependencies": {
    "@elizaos/core": "1.4.4"
  }
}
```

---

## ADR-005: Drizzle ORM with Adapter Pattern

**Status**: Adopted  
**Date**: 2024-02-10  
**Context**: Database abstraction and multiple database support

### Decision
Use Drizzle ORM with IDatabaseAdapter interface for database operations.

### Rationale
- **Type Safety**: Full TypeScript support with compile-time query validation
- **Performance**: Generated queries optimized for target database
- **Multiple Databases**: Single adapter interface supports PostgreSQL, PGLite, SQLite
- **Migration Support**: Built-in schema migration capabilities
- **Developer Experience**: IntelliSense and auto-completion for queries

### Consequences
- ✅ Type-safe database operations
- ✅ Multiple database backend support
- ✅ Excellent developer experience
- ❌ Learning curve for developers unfamiliar with Drizzle
- ❌ Schema-first development approach required
- ❌ Less community resources compared to Prisma/TypeORM

### Implementation
```typescript
// Adapter interface (packages/core/src/types/database.ts)
interface IDatabaseAdapter {
  getMemories(params: GetMemoriesParams): Promise<Memory[]>;
  createMemory(memory: Memory): Promise<void>;
  searchMemories(params: SearchParams): Promise<Memory[]>;
}

// PostgreSQL implementation
class PostgresAdapter implements IDatabaseAdapter {
  constructor(private db: DrizzleDB) {}
  
  async getMemories(params: GetMemoriesParams): Promise<Memory[]> {
    return this.db.select().from(memories).where(eq(memories.roomId, params.roomId));
  }
}
```

---

## ADR-006: Component-Based Plugin Architecture

**Status**: Adopted  
**Date**: 2024-02-15  
**Context**: Extensible agent functionality and third-party integrations

### Decision
Implement plugin system with Actions, Providers, Evaluators, and Services.

### Rationale
- **Separation of Concerns**: Each component type has distinct responsibility
- **Extensibility**: Plugins can add new capabilities without core changes
- **Testability**: Components can be tested independently
- **Reusability**: Components can be shared across different agents
- **Clear Contracts**: Well-defined interfaces for each component type

### Consequences
- ✅ Highly extensible architecture
- ✅ Clear separation of concerns
- ✅ Excellent testability
- ❌ Complexity for simple use cases
- ❌ Learning curve for plugin developers
- ❌ More boilerplate code required

### Implementation
```typescript
// Plugin definition
interface Plugin {
  name: string;
  actions: Action[];       // User command handlers
  providers: Provider[];   // Context suppliers
  evaluators: Evaluator[]; // Learning processors
  services: Service[];     // External integrations
}

// Component types have specific responsibilities
class TwitterAction extends Action {
  handler: Handler = async (runtime, message, state, options, callback) => {
    const twitterService = runtime.getService<TwitterService>('twitter');
    const result = await twitterService.postTweet(message.content.text);
    return { success: true, data: result };
  };
}
```

---

## ADR-007: UUID-Based Agent Identity System

**Status**: Adopted  
**Date**: 2024-02-20  
**Context**: Multi-agent coordination and identity uniqueness

### Decision
Use UUID-based identity with agent-specific swizzling for all entities.

### Rationale
- **Global Uniqueness**: UUIDs prevent ID collisions across agents
- **Agent Isolation**: Each agent has its own UUID space for entities
- **Deterministic**: Same input always generates same swizzled UUID
- **Scalability**: Works across distributed deployments
- **Backwards Compatibility**: Can convert existing string IDs to UUIDs

### Consequences
- ✅ No ID collisions between agents
- ✅ Proper agent isolation
- ✅ Scalable across deployments
- ❌ More complex ID management
- ❌ Debugging becomes harder with long UUIDs
- ❌ Slight performance overhead for UUID operations

### Implementation
```typescript
// UUID swizzling (packages/core/src/entities.ts)
export const createUniqueUuid = (input: string, agentId: UUID): UUID => {
  const namespace = uuidv5(agentId, uuidv5.DNS);
  return uuidv5(input, namespace) as UUID;
};

// Usage in runtime
const roomId = createUniqueUuid('discord-server-123', this.agentId);
const userId = createUniqueUuid('user@example.com', this.agentId);
```

---

## ADR-008: Streaming-First LLM Integration

**Status**: Adopted  
**Date**: 2024-03-01  
**Context**: Real-time user experience and large response handling

### Decision
Prioritize streaming responses from LLM providers over blocking calls.

### Rationale
- **User Experience**: Immediate feedback improves perceived performance
- **Resource Efficiency**: Can process responses as they arrive
- **Timeout Handling**: Less likely to hit API timeouts on large responses
- **Interactivity**: Users can interrupt or redirect conversations
- **Scalability**: Better resource utilization under load

### Consequences
- ✅ Better user experience
- ✅ More efficient resource usage
- ✅ Reduced timeout issues
- ❌ More complex error handling
- ❌ Difficult to implement response caching
- ❌ Complications for testing

### Implementation
```typescript
// Streaming response handler
async *generateStream(prompt: string): AsyncGenerator<string> {
  const stream = await this.openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    stream: true
  });
  
  for await (const chunk of stream) {
    if (chunk.choices[0]?.delta?.content) {
      yield chunk.choices[0].delta.content;
    }
  }
}
```

---

## ADR-009: Platform-Agnostic Messaging Abstraction

**Status**: Adopted  
**Date**: 2024-03-10  
**Context**: Multi-platform agent deployment and message handling

### Decision
Abstract platform concepts to Room/World/Participant model.

### Rationale
- **Platform Independence**: Core logic works across Discord, Telegram, Twitter, etc.
- **Code Reuse**: Same agent can deploy to multiple platforms
- **Unified API**: Consistent messaging interface regardless of platform
- **Future Proof**: Easy to add new platforms without core changes
- **Testing**: Simplified mocking and testing of messaging logic

### Consequences
- ✅ Platform-independent agent logic
- ✅ Easy multi-platform deployment
- ✅ Simplified testing
- ❌ Platform-specific features harder to access
- ❌ Abstraction overhead
- ❌ May not fit all platform paradigms perfectly

### Implementation
```typescript
// Platform abstraction
interface Room {
  id: UUID;
  name: string;
  participants: Participant[];
}

interface World {
  id: UUID;
  name: string;
  rooms: Room[];
}

// Platform adapters convert to/from platform-specific formats
class DiscordAdapter {
  toRoom(discordChannel: DiscordChannel): Room {
    return {
      id: createUniqueUuid(discordChannel.id, this.agentId),
      name: discordChannel.name,
      participants: discordChannel.members.map(this.toParticipant)
    };
  }
}
```

---

## ADR-010: Test-First Integration Strategy

**Status**: Adopted  
**Date**: 2024-03-15  
**Context**: Testing reliability and development workflow

### Decision
Prioritize integration tests over unit tests, prefer real dependencies over mocks.

### Rationale
- **Real World Testing**: Integration tests catch issues unit tests miss
- **Confidence**: Testing actual integrations provides higher confidence
- **Maintenance**: Fewer brittle tests that break on implementation changes
- **Documentation**: Integration tests serve as usage examples
- **Bug Prevention**: Catch interface mismatches and integration issues

### Consequences
- ✅ Higher confidence in functionality
- ✅ Better bug prevention
- ✅ Tests serve as documentation
- ❌ Slower test execution
- ❌ More complex test setup
- ❌ Harder to isolate failures

### Implementation
```typescript
// Integration test example
describe('Agent Message Processing', () => {
  let runtime: IAgentRuntime;
  let database: IDatabaseAdapter;
  
  beforeEach(async () => {
    database = await createTestDatabase(); // Real database
    runtime = new AgentRuntime({
      character: createTestCharacter(),
      databaseAdapter: database,
      plugins: [twitterPlugin, discordPlugin] // Real plugins
    });
  });
  
  it('should process message end-to-end', async () => {
    const message = createTestMessage('Hello world');
    const result = await runtime.processMessage(message);
    
    expect(result.success).toBe(true);
    
    // Verify persistence in real database
    const memories = await database.getMemories({ roomId: message.roomId });
    expect(memories).toContain(expect.objectContaining({
      content: { text: 'Hello world' }
    }));
  });
});
```

---

## TODOs & Future Decisions

- [ ] **ADR-011**: GraphQL vs REST API strategy for complex queries
- [ ] **ADR-012**: Distributed agent deployment architecture
- [ ] **ADR-013**: Plugin sandboxing and security model
- [ ] **ADR-014**: Real-time collaboration between agents
- [ ] **ADR-015**: AI model fallback and redundancy strategy
- [ ] **ADR-016**: Event sourcing for agent state management
- [ ] **ADR-017**: Caching strategy for expensive operations
- [ ] **ADR-018**: Monitoring and observability architecture