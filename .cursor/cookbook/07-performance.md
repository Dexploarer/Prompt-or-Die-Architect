# ElizaOS Performance Guide

## Performance Hotspots

### Message Processing Pipeline
The core runtime message processing is the primary performance bottleneck:

```typescript
// Runtime message processing (packages/core/src/runtime.ts)
async processMessage(message: Memory): Promise<void> {
  // 1. Context retrieval (database queries) - HIGH IMPACT
  const context = await this.buildContext(message);
  
  // 2. Provider execution (I/O bound) - HIGH IMPACT  
  const providerContext = await this.executeProviders(message);
  
  // 3. LLM generation (external API) - HIGHEST IMPACT
  const response = await this.generateResponse(context);
  
  // 4. Memory persistence (database writes) - MEDIUM IMPACT
  await this.persistMemory(response);
  
  // 5. Evaluator processing (CPU bound) - LOW IMPACT
  await this.runEvaluators(message, response);
}
```

### Database Operations
Database queries dominate processing time:

```typescript
// Memory retrieval optimization
class OptimizedMemoryProvider {
  private cache = new LRUCache<string, Memory[]>({ max: 1000, ttl: 300000 }); // 5 min
  
  async getRelevantMemories(query: string, limit: number = 10): Promise<Memory[]> {
    const cacheKey = `memories:${query}:${limit}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;
    
    // Optimized query with indexes and limits
    const memories = await this.db.select()
      .from(memoriesTable)
      .where(and(
        eq(memoriesTable.agentId, this.agentId),
        // Use full-text search index
        sql`to_tsvector('english', content) @@ plainto_tsquery(${query})`
      ))
      .orderBy(desc(memoriesTable.similarity))
      .limit(limit);
    
    this.cache.set(cacheKey, memories);
    return memories;
  }
}
```

### LLM Provider Latency
External API calls are the biggest bottleneck:

```typescript
// Model response time optimization
class OptimizedModelHandler {
  private responseCache = new Map<string, { response: string, timestamp: number }>();
  private readonly CACHE_TTL = 3600000; // 1 hour
  
  async generateResponse(prompt: string): Promise<string> {
    // Cache identical prompts
    const promptHash = this.hashPrompt(prompt);
    const cached = this.responseCache.get(promptHash);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.response;
    }
    
    // Parallel requests to multiple providers for speed
    const providers = [this.openaiHandler, this.anthropicHandler];
    const responses = await Promise.allSettled(
      providers.map(p => p.generateResponse(prompt))
    );
    
    // Return first successful response
    for (const result of responses) {
      if (result.status === 'fulfilled') {
        this.responseCache.set(promptHash, {
          response: result.value,
          timestamp: Date.now()
        });
        return result.value;
      }
    }
    
    throw new Error('All model providers failed');
  }
}
```

## Batching Strategies

### Memory Operations Batching
```typescript
// Batch memory operations to reduce database round trips
class BatchedMemoryManager {
  private pendingMemories: Memory[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private readonly BATCH_SIZE = 50;
  private readonly BATCH_DELAY = 100; // ms
  
  async createMemory(memory: Memory): Promise<void> {
    this.pendingMemories.push(memory);
    
    if (this.pendingMemories.length >= this.BATCH_SIZE) {
      await this.flushBatch();
    } else if (!this.batchTimeout) {
      this.batchTimeout = setTimeout(() => this.flushBatch(), this.BATCH_DELAY);
    }
  }
  
  private async flushBatch(): Promise<void> {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
    
    if (this.pendingMemories.length === 0) return;
    
    const batch = [...this.pendingMemories];
    this.pendingMemories = [];
    
    // Single transaction for all memories
    await this.db.transaction(async (tx) => {
      await tx.insert(memoriesTable).values(batch);
    });
  }
}
```

### Provider Execution Batching
```typescript
// Batch provider execution for multiple messages
class BatchedProviderManager {
  async executeProviders(messages: Memory[]): Promise<Map<UUID, string>> {
    const results = new Map<UUID, string>();
    
    // Group messages by room for context sharing
    const messagesByRoom = groupBy(messages, m => m.roomId);
    
    // Process rooms in parallel
    await Promise.all(
      Object.entries(messagesByRoom).map(async ([roomId, roomMessages]) => {
        // Fetch room context once for all messages
        const roomContext = await this.getRoomContext(roomId as UUID);
        
        // Execute providers for all messages in parallel
        const providerResults = await Promise.all(
          roomMessages.map(msg => this.executeProvidersForMessage(msg, roomContext))
        );
        
        // Store results
        roomMessages.forEach((msg, idx) => {
          results.set(msg.id, providerResults[idx]);
        });
      })
    );
    
    return results;
  }
}
```

## Pagination Patterns

### Memory Retrieval Pagination
```typescript
// Cursor-based pagination for memories
interface MemoryPagination {
  memories: Memory[];
  nextCursor?: string;
  hasMore: boolean;
}

class PaginatedMemoryService {
  async getMemories(
    agentId: UUID,
    limit: number = 20,
    cursor?: string
  ): Promise<MemoryPagination> {
    let query = this.db.select()
      .from(memoriesTable)
      .where(eq(memoriesTable.agentId, agentId))
      .orderBy(desc(memoriesTable.timestamp))
      .limit(limit + 1); // Fetch one extra to check hasMore
    
    if (cursor) {
      // Cursor contains timestamp and ID for stable pagination
      const [timestamp, id] = decodeCursor(cursor);
      query = query.where(
        or(
          lt(memoriesTable.timestamp, timestamp),
          and(
            eq(memoriesTable.timestamp, timestamp),
            lt(memoriesTable.id, id)
          )
        )
      );
    }
    
    const results = await query;
    const hasMore = results.length > limit;
    const memories = hasMore ? results.slice(0, -1) : results;
    
    let nextCursor: string | undefined;
    if (hasMore) {
      const lastMemory = memories[memories.length - 1];
      nextCursor = encodeCursor(lastMemory.timestamp, lastMemory.id);
    }
    
    return { memories, nextCursor, hasMore };
  }
}
```

### Agent List Pagination
```typescript
// Offset-based pagination for agent lists
interface AgentPagination {
  agents: Agent[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

async function getAgentsList(page: number = 1, limit: number = 20): Promise<AgentPagination> {
  const offset = (page - 1) * limit;
  
  // Get total count and agents in parallel
  const [totalResult, agents] = await Promise.all([
    db.select({ count: count() }).from(agentsTable),
    db.select()
      .from(agentsTable)
      .orderBy(desc(agentsTable.createdAt))
      .limit(limit)
      .offset(offset)
  ]);
  
  const total = totalResult[0].count;
  const totalPages = Math.ceil(total / limit);
  
  return {
    agents,
    pagination: { page, limit, total, totalPages }
  };
}
```

## Parallelism & Concurrency

### Multi-Agent Processing
```typescript
// Process multiple agents concurrently with controlled parallelism
class ConcurrentAgentManager {
  private readonly maxConcurrency = parseInt(process.env.MAX_AGENT_CONCURRENCY || '5');
  private semaphore = new Semaphore(this.maxConcurrency);
  
  async processMessagesForAllAgents(messages: Map<UUID, Memory[]>): Promise<void> {
    const agentTasks = Array.from(messages.entries()).map(([agentId, agentMessages]) =>
      this.processAgentMessages(agentId, agentMessages)
    );
    
    // Process with controlled concurrency
    await Promise.all(agentTasks);
  }
  
  private async processAgentMessages(agentId: UUID, messages: Memory[]): Promise<void> {
    await this.semaphore.acquire();
    
    try {
      const runtime = await this.getAgentRuntime(agentId);
      
      // Process messages in batches within agent
      const batches = chunk(messages, 10);
      for (const batch of batches) {
        await Promise.all(
          batch.map(message => runtime.processMessage(message))
        );
      }
    } finally {
      this.semaphore.release();
    }
  }
}
```

### Streaming Response Processing
```typescript
// Handle streaming responses efficiently
class StreamingResponseHandler {
  async processStreamingResponse(
    stream: AsyncGenerator<string>,
    callback: (chunk: string) => Promise<void>
  ): Promise<string> {
    let fullResponse = '';
    const chunks: string[] = [];
    
    // Process chunks as they arrive
    for await (const chunk of stream) {
      chunks.push(chunk);
      fullResponse += chunk;
      
      // Send intermediate callbacks without awaiting
      callback(chunk).catch(err => 
        console.error('Callback error:', err)
      );
    }
    
    return fullResponse;
  }
}
```

### Database Connection Pooling
```typescript
// Optimized database connection management
class DatabaseConnectionManager {
  private pool: Pool;
  
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.POSTGRES_URL,
      
      // Connection pool configuration
      max: 20,                    // Maximum connections
      min: 5,                     // Minimum connections
      idleTimeoutMillis: 30000,   // Close idle connections after 30s
      connectionTimeoutMillis: 2000, // Timeout connecting to database
      
      // Performance optimizations
      keepAlive: true,
      keepAliveInitialDelayMillis: 0,
      
      // Error handling
      maxUses: 7500,             // Refresh connections periodically
      allowExitOnIdle: true
    });
  }
  
  async query<T>(sql: string, params?: any[]): Promise<T[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(sql, params);
      return result.rows;
    } finally {
      client.release();
    }
  }
}
```

## Memory Optimization

### Working Memory Management
```typescript
// Bounded working memory with LRU eviction
class BoundedWorkingMemory {
  private memory: Map<string, Memory> = new Map();
  private accessOrder: string[] = [];
  private readonly MAX_SIZE = 1000;
  
  set(key: string, value: Memory): void {
    if (this.memory.has(key)) {
      // Update existing - move to end
      this.accessOrder = this.accessOrder.filter(k => k !== key);
    } else if (this.memory.size >= this.MAX_SIZE) {
      // Evict least recently used
      const lru = this.accessOrder.shift()!;
      this.memory.delete(lru);
    }
    
    this.memory.set(key, value);
    this.accessOrder.push(key);
  }
  
  get(key: string): Memory | undefined {
    const value = this.memory.get(key);
    if (value) {
      // Move to end (most recently used)
      this.accessOrder = this.accessOrder.filter(k => k !== key);
      this.accessOrder.push(key);
    }
    return value;
  }
}
```

### Object Pool Pattern
```typescript
// Reuse expensive objects to reduce GC pressure
class ResponseObjectPool {
  private pool: Array<{ text: string; timestamp: number; metadata: any }> = [];
  private readonly MAX_POOL_SIZE = 100;
  
  acquire(): { text: string; timestamp: number; metadata: any } {
    const obj = this.pool.pop();
    if (obj) {
      // Reset object state
      obj.text = '';
      obj.timestamp = 0;
      obj.metadata = null;
      return obj;
    }
    
    // Create new object if pool empty
    return { text: '', timestamp: 0, metadata: null };
  }
  
  release(obj: { text: string; timestamp: number; metadata: any }): void {
    if (this.pool.length < this.MAX_POOL_SIZE) {
      this.pool.push(obj);
    }
    // Otherwise let it be garbage collected
  }
}
```

## I/O Optimization

### File System Operations
```typescript
// Efficient file operations with streaming
class OptimizedFileManager {
  private readonly CHUNK_SIZE = 64 * 1024; // 64KB chunks
  
  async processLargeFile(filePath: string, processor: (chunk: Buffer) => void): Promise<void> {
    const file = Bun.file(filePath);
    const stream = file.stream();
    const reader = stream.getReader();
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        processor(Buffer.from(value));
      }
    } finally {
      reader.releaseLock();
    }
  }
  
  // Batch file writes
  private pendingWrites: Map<string, Buffer[]> = new Map();
  
  async writeFileChunk(filePath: string, chunk: Buffer): Promise<void> {
    const existing = this.pendingWrites.get(filePath) || [];
    existing.push(chunk);
    this.pendingWrites.set(filePath, existing);
    
    // Flush after collecting several chunks
    if (existing.length >= 10) {
      await this.flushWrites(filePath);
    }
  }
  
  private async flushWrites(filePath: string): Promise<void> {
    const chunks = this.pendingWrites.get(filePath);
    if (!chunks || chunks.length === 0) return;
    
    const combined = Buffer.concat(chunks);
    await Bun.write(filePath, combined);
    
    this.pendingWrites.delete(filePath);
  }
}
```

### Network Request Optimization
```typescript
// Connection pooling and request batching
class OptimizedHttpClient {
  private agent = new https.Agent({
    keepAlive: true,
    keepAliveMsecs: 1000,
    maxSockets: 50,
    maxFreeSockets: 10
  });
  
  private requestQueue: Array<{
    url: string;
    options: RequestInit;
    resolve: (response: Response) => void;
    reject: (error: Error) => void;
  }> = [];
  
  private processingQueue = false;
  
  async fetch(url: string, options: RequestInit = {}): Promise<Response> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ url, options, resolve, reject });
      this.processQueue();
    });
  }
  
  private async processQueue(): Promise<void> {
    if (this.processingQueue || this.requestQueue.length === 0) return;
    this.processingQueue = true;
    
    try {
      // Process up to 10 requests in parallel
      while (this.requestQueue.length > 0) {
        const batch = this.requestQueue.splice(0, 10);
        
        await Promise.all(batch.map(async ({ url, options, resolve, reject }) => {
          try {
            const response = await fetch(url, {
              ...options,
              agent: this.agent
            });
            resolve(response);
          } catch (error) {
            reject(error as Error);
          }
        }));
      }
    } finally {
      this.processingQueue = false;
    }
  }
}
```

## Performance Monitoring

### Metrics Collection
```typescript
// Performance metrics tracking
class PerformanceMonitor {
  private metrics = new Map<string, number[]>();
  
  time<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    
    return fn().finally(() => {
      const duration = performance.now() - start;
      this.recordMetric(operation, duration);
    });
  }
  
  private recordMetric(operation: string, duration: number): void {
    const existing = this.metrics.get(operation) || [];
    existing.push(duration);
    
    // Keep only last 1000 measurements
    if (existing.length > 1000) {
      existing.shift();
    }
    
    this.metrics.set(operation, existing);
  }
  
  getStats(operation: string) {
    const measurements = this.metrics.get(operation) || [];
    if (measurements.length === 0) return null;
    
    const sorted = [...measurements].sort((a, b) => a - b);
    return {
      count: measurements.length,
      avg: measurements.reduce((a, b) => a + b) / measurements.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    };
  }
}

// Usage in runtime
const monitor = new PerformanceMonitor();

await monitor.time('message_processing', async () => {
  return runtime.processMessage(message);
});
```

### Resource Usage Tracking
```typescript
// Monitor memory and CPU usage
class ResourceMonitor {
  startMonitoring(): void {
    setInterval(() => {
      const usage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      
      logger.debug('Resource usage', {
        memory: {
          rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
          heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
          external: `${Math.round(usage.external / 1024 / 1024)}MB`
        },
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system
        },
        uptime: process.uptime()
      });
    }, 30000); // Every 30 seconds
  }
}
```

## TODOs & Performance Gaps

- [ ] Database query optimization with EXPLAIN ANALYZE
- [ ] Memory leak detection and prevention
- [ ] Response time SLA monitoring
- [ ] Auto-scaling based on load metrics
- [ ] Caching layer optimization (Redis/Memcached)
- [ ] CDN integration for static assets
- [ ] Database read replica support
- [ ] Request deduplication mechanisms
- [ ] Background job processing optimization
- [ ] Performance regression testing in CI/CD