# ElizaOS Design Patterns

## Adapter Pattern

### Database Adapters
ElizaOS uses adapters to abstract database implementations:

```typescript
// Core interface (packages/core/src/types/database.ts)
interface IDatabaseAdapter {
  init(): Promise<void>;
  getMemories(params: GetMemoriesParams): Promise<Memory[]>;
  createMemory(memory: Memory): Promise<void>;
  searchMemories(params: SearchParams): Promise<Memory[]>;
}

// PostgreSQL implementation (packages/plugin-sql/src/pg/adapter.ts)
class PostgresAdapter implements IDatabaseAdapter {
  constructor(private connectionString: string) {}
  
  async init(): Promise<void> {
    this.db = drizzle(postgres(this.connectionString));
  }
  
  async getMemories(params: GetMemoriesParams): Promise<Memory[]> {
    return await this.db.select().from(memories)
      .where(eq(memories.roomId, params.roomId));
  }
}

// PGLite implementation (packages/plugin-sql/src/pglite/adapter.ts)  
class PgliteAdapter implements IDatabaseAdapter {
  constructor(private path: string) {}
  
  async init(): Promise<void> {
    const client = new PGlite(this.path);
    this.db = drizzle(client);
  }
}
```

### Model Provider Adapters
Similar pattern for LLM providers:

```typescript
interface ModelHandler {
  async generateResponse(prompt: string): Promise<string>;
  async generateStream(prompt: string): AsyncGenerator<string>;
}

// OpenAI implementation
class OpenAIHandler implements ModelHandler {
  async generateResponse(prompt: string): Promise<string> {
    const response = await this.openai.chat.completions.create({
      model: this.model,
      messages: [{ role: 'user', content: prompt }]
    });
    return response.choices[0].message.content;
  }
}
```

## Port Pattern (Hexagonal Architecture)

### Core Domain Isolation
The runtime serves as the hexagonal core, isolated from external concerns:

```typescript
// Core runtime (packages/core/src/runtime.ts) - The hexagon center
class AgentRuntime implements IAgentRuntime {
  constructor(
    private databaseAdapter: IDatabaseAdapter,  // Port
    private services: Map<string, Service>,     // Port
    private character: Character                // Domain object
  ) {}
  
  // Domain logic - platform agnostic
  async processMessage(message: Memory): Promise<void> {
    const context = await this.buildContext(message);
    const response = await this.generateResponse(context);
    await this.persistMemory(response);
  }
}

// Adapter implementations - The hexagon edges
class DiscordAdapter {
  constructor(private runtime: IAgentRuntime) {}
  
  async onMessage(discordMessage: DiscordMessage): Promise<void> {
    // Transform external format to domain format
    const memory = this.toMemory(discordMessage);
    await this.runtime.processMessage(memory);
  }
}
```

### Service Ports
Services define contracts for external integrations:

```typescript
// Port definition (packages/core/src/types/service.ts)
abstract class Service {
  abstract serviceType: ServiceTypeName;
  abstract initialize(runtime: IAgentRuntime): Promise<void>;
}

// Adapter implementation (packages/plugin-*/src/services/)
class TwitterService extends Service {
  serviceType = 'twitter' as const;
  
  async initialize(runtime: IAgentRuntime): Promise<void> {
    this.api = new TwitterAPI(process.env.TWITTER_TOKEN);
  }
  
  async postTweet(content: string): Promise<Tweet> {
    return await this.api.v2.tweet(content);
  }
}
```

## Dependency Injection

### Service Registry Pattern
Runtime acts as DI container:

```typescript
// Registration in runtime constructor
class AgentRuntime {
  private services = new Map<string, Service>();
  
  async registerService(service: Service): Promise<void> {
    await service.initialize(this);
    this.services.set(service.serviceType, service);
  }
  
  getService<T extends Service>(type: ServiceTypeName): T {
    const service = this.services.get(type);
    if (!service) {
      throw new Error(`Service ${type} not registered`);
    }
    return service as T;
  }
}

// Usage in actions
const handler: Handler = async (runtime, message) => {
  const walletService = runtime.getService<WalletService>('wallet');
  const balance = await walletService.getBalance();
  return { success: true, data: { balance } };
};
```

### Plugin-based DI
Plugins register their dependencies:

```typescript
// Plugin definition (packages/plugin-*/src/index.ts)
export const twitterPlugin: Plugin = {
  name: 'twitter',
  services: [TwitterService],     // DI registration
  actions: [PostTweetAction],     // Depends on TwitterService
  providers: [TwitterProvider],   // Context suppliers
  evaluators: []
};

// Runtime loads plugin dependencies
async loadPlugin(plugin: Plugin): Promise<void> {
  for (const ServiceClass of plugin.services) {
    const service = new ServiceClass();
    await this.registerService(service);
  }
}
```

## State Management

### Agent-Isolated State
Each agent maintains completely separate state:

```typescript
// State isolation by agent UUID
class AgentRuntime {
  private agentId: UUID;
  private workingMemory: Map<string, Memory> = new Map();
  private longTermMemory: Memory[] = [];
  
  // All state operations scoped to this agent
  async getMemories(params: GetMemoriesParams): Promise<Memory[]> {
    return this.databaseAdapter.getMemories({
      ...params,
      agentId: this.agentId  // Always scope to this agent
    });
  }
  
  // UUID swizzling ensures unique IDs across agents
  private swizzleId(id: string): UUID {
    return createUniqueUuid(id, this.agentId);
  }
}
```

### Working vs Long-term Memory
Dual memory system:

```typescript
interface WorkingMemoryEntry {
  actionName: string;
  result: ActionResult;
  timestamp: number;
}

class AgentRuntime {
  private workingMemory: WorkingMemoryEntry[] = [];
  private readonly maxWorkingMemorySize = 10;
  
  async addToWorkingMemory(entry: WorkingMemoryEntry): Promise<void> {
    this.workingMemory.push(entry);
    
    // Bounded working memory
    if (this.workingMemory.length > this.maxWorkingMemorySize) {
      this.workingMemory.shift();
    }
  }
  
  async persistToLongTerm(memory: Memory): Promise<void> {
    await this.databaseAdapter.createMemory({
      ...memory,
      agentId: this.agentId
    });
  }
}
```

## Caching Patterns

### Memory Caching with Expiration
```typescript
class CachedMemoryProvider {
  private cache = new Map<string, { 
    data: Memory[], 
    timestamp: number,
    ttl: number 
  }>();
  
  async getMemories(query: string): Promise<Memory[]> {
    const cacheKey = this.hashQuery(query);
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    
    const memories = await this.fetchMemories(query);
    this.cache.set(cacheKey, {
      data: memories,
      timestamp: Date.now(),
      ttl: 5 * 60 * 1000  // 5 minutes
    });
    
    return memories;
  }
}
```

### Service-Level Caching
```typescript
class TwitterService extends Service {
  private userCache = new Map<string, TwitterUser>();
  
  async getUser(username: string): Promise<TwitterUser> {
    if (this.userCache.has(username)) {
      return this.userCache.get(username)!;
    }
    
    const user = await this.api.v2.userByUsername(username);
    this.userCache.set(username, user.data);
    
    // Auto-cleanup with WeakRef for memory management
    setTimeout(() => {
      this.userCache.delete(username);
    }, 30 * 60 * 1000);  // 30 minutes
    
    return user.data;
  }
}
```

## Retry & Resilience Patterns

### Exponential Backoff
```typescript
class ResilientService extends Service {
  private async withRetry<T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxAttempts) {
          const delay = Math.min(1000 * (2 ** (attempt - 1)), 10000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw new Error(`Operation failed after ${maxAttempts} attempts: ${lastError.message}`);
  }
  
  async makeAPICall(data: any): Promise<any> {
    return this.withRetry(() => this.api.call(data));
  }
}
```

### Circuit Breaker
```typescript
class CircuitBreakerService extends Service {
  private failureCount = 0;
  private lastFailureTime = 0;
  private readonly failureThreshold = 5;
  private readonly recoveryTimeout = 60000; // 1 minute
  
  async makeRequest(data: any): Promise<any> {
    if (this.isCircuitOpen()) {
      throw new Error('Circuit breaker is open');
    }
    
    try {
      const result = await this.api.call(data);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private isCircuitOpen(): boolean {
    return this.failureCount >= this.failureThreshold &&
           Date.now() - this.lastFailureTime < this.recoveryTimeout;
  }
  
  private onSuccess(): void {
    this.failureCount = 0;
  }
  
  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
  }
}
```

## Idempotency Patterns

### Action Result Caching
```typescript
// Action with idempotency key
const handler: Handler = async (runtime, message, state, options, callback) => {
  const idempotencyKey = `${message.id}-${options?.actionId}`;
  
  // Check if already processed
  const existingResult = await runtime.getActionResult(idempotencyKey);
  if (existingResult) {
    return existingResult;
  }
  
  // Process and cache result
  const result = await performAction(runtime, message);
  await runtime.cacheActionResult(idempotencyKey, result);
  
  return result;
};
```

### Database Idempotency
```typescript
class DatabaseAdapter implements IDatabaseAdapter {
  async createMemory(memory: Memory): Promise<void> {
    try {
      await this.db.insert(memories).values({
        id: memory.id,
        content: memory.content,
        agentId: memory.agentId
      });
    } catch (error) {
      // Handle unique constraint violation gracefully
      if (error.code === '23505') { // PostgreSQL unique violation
        console.log(`Memory ${memory.id} already exists`);
        return;
      }
      throw error;
    }
  }
}
```

## Event-Driven Patterns

### EventTarget-based Communication
```typescript
// Replace EventEmitter with EventTarget (Bun compatibility)
class MessageBus extends EventTarget {
  async publishMessage(type: string, data: any): Promise<void> {
    this.dispatchEvent(new CustomEvent(type, { 
      detail: data 
    }));
  }
  
  subscribeToMessages(type: string, handler: (data: any) => void): void {
    const wrappedHandler = (event: CustomEvent) => {
      handler(event.detail);
    };
    this.addEventListener(type, wrappedHandler as EventListener);
  }
}

// Usage in runtime
class AgentRuntime {
  constructor(private messageBus: MessageBus) {
    this.messageBus.subscribeToMessages('memory_created', 
      this.onMemoryCreated.bind(this)
    );
  }
  
  async createMemory(memory: Memory): Promise<void> {
    await this.databaseAdapter.createMemory(memory);
    await this.messageBus.publishMessage('memory_created', memory);
  }
}
```

## Factory Patterns

### Plugin Factory
```typescript
// Plugin factory for dynamic loading
class PluginFactory {
  static async createPlugin(config: PluginConfig): Promise<Plugin> {
    const { name, version, source } = config;
    
    // Dynamic import for plugin code
    const module = await import(source);
    const plugin = module.default || module[name];
    
    if (!this.validatePlugin(plugin)) {
      throw new Error(`Invalid plugin: ${name}`);
    }
    
    return plugin;
  }
  
  private static validatePlugin(plugin: any): plugin is Plugin {
    return plugin.name && 
           Array.isArray(plugin.actions) &&
           Array.isArray(plugin.services);
  }
}
```

### Service Factory
```typescript
// Service instantiation with configuration
class ServiceFactory {
  static createService(
    type: ServiceTypeName, 
    config: ServiceConfig
  ): Service {
    switch (type) {
      case 'twitter':
        return new TwitterService(config.twitter);
      case 'database':
        return new DatabaseService(config.database);
      default:
        throw new Error(`Unknown service type: ${type}`);
    }
  }
}
```

## TODOs & Pattern Gaps

- [ ] Observer pattern for plugin lifecycle events
- [ ] Command pattern for undoable actions
- [ ] Strategy pattern for different LLM interaction styles
- [ ] Decorator pattern for service middleware (logging, metrics)
- [ ] Repository pattern for different data storage backends
- [ ] Publisher/Subscriber for cross-agent communication