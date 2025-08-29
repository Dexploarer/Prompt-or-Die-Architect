# ElizaOS Coding Standards

## Type System

### Strict TypeScript Requirements
```typescript
// ✅ REQUIRED: Specific, accurate types
interface AgentMemory {
  id: UUID;
  content: Content;
  timestamp: Date;
  embedding?: number[];
}

// ❌ FORBIDDEN: Generic escape hatches
const data: any = {};           // Never use any
const result: unknown = {};     // Never use unknown
const handler: never = {};      // Never use never
```

### Type Definition Patterns
- **File Location**: All types in `/packages/core/src/types/`
- **Export Pattern**: Re-export through `/packages/core/src/types/index.ts`
- **Naming**: PascalCase interfaces, camelCase properties
- **Optional Properties**: Use `?:` sparingly, prefer explicit `| null` when meaningful

### Module Augmentation for Plugins
```typescript
// Extend core types in plugin packages
declare module '@elizaos/core' {
  interface ServiceTypeRegistry {
    TWITTER: 'twitter';
    DISCORD: 'discord';
  }
}
```

## Naming Conventions

### Variables & Functions
- **Variables**: `camelCase` - `isLoading`, `messageCount`, `hasPermission`  
- **Functions**: `camelCase` - `processMessage`, `generateResponse`, `validateInput`
- **Constants**: `SCREAMING_SNAKE_CASE` - `MODEL_SETTINGS`, `DEFAULT_TIMEOUT`
- **Private members**: prefix with `_` - `_internalState`, `_validateConfig`

### Classes & Interfaces
- **Classes**: `PascalCase` - `AgentRuntime`, `MessageHandler`, `DatabaseAdapter`
- **Interfaces**: `PascalCase` with `I` prefix - `IAgentRuntime`, `IDatabaseAdapter`
- **Types**: `PascalCase` - `UUID`, `Content`, `ActionResult`
- **Enums**: `PascalCase` values - `MessageType.TEXT`, `ChannelType.DISCORD`

### Files & Directories
```
// Component files match their main export
AgentRuntime.ts         // exports class AgentRuntime
messageHandler.ts       // exports function messageHandler  
types/agent.ts         // exports Agent interface
actions/sendMessage.ts // exports sendMessage action

// Test files mirror source structure
__tests__/
  AgentRuntime.test.ts
  messageHandler.test.ts
```

### Package & Module Names
- **Packages**: `@elizaos/package-name` (kebab-case)
- **Directories**: `camelCase` - `pluginBootstrap`, `apiClient`
- **Template vars**: `{{templateName}}` in CLI templates

## Error Handling Model

### Error Types & Hierarchy
```typescript
// Base error types (in core/types/)
interface ElizaError {
  code: string;
  message: string;
  context?: Record<string, unknown>;
  cause?: Error;
}

// Service-specific error extensions
interface DatabaseError extends ElizaError {
  code: 'DB_CONNECTION' | 'DB_QUERY' | 'DB_VALIDATION';
  query?: string;
  table?: string;
}
```

### Error Handling Patterns
```typescript
// Action error handling - return ActionResult
handler: async (...args): Promise<ActionResult> => {
  try {
    const result = await riskyOperation();
    return { success: true, data: result };
  } catch (error) {
    await callback({ text: 'Operation failed', error: true });
    return { 
      success: false, 
      error: error.message,
      code: 'OPERATION_FAILED' 
    };
  }
};

// Service error handling - throw specific errors
async serviceMethod(): Promise<Data> {
  try {
    return await externalAPI.call();
  } catch (error) {
    throw new ServiceError('API_CALL_FAILED', {
      message: 'External service unavailable',
      cause: error,
      context: { service: 'external-api' }
    });
  }
}
```

### Error Propagation Rules
- **Actions**: Catch errors, return `ActionResult` with success: false
- **Services**: Let errors bubble up with enhanced context  
- **Runtime**: Catch all errors, log, continue processing
- **Never**: Swallow errors silently or throw generic Error()

## Logging Standards

### Logger Configuration
```typescript
// Use centralized logger from core
import { createLogger } from '@elizaos/core';

const logger = createLogger('MyComponent');
```

### Log Levels & Usage
- **`debug`**: Detailed flow information, variable values
- **`info`**: Major operations, user actions, system state changes  
- **`warn`**: Recoverable errors, deprecated usage, performance issues
- **`error`**: Unrecoverable errors, service failures, data corruption

### Logging Patterns
```typescript
// ✅ GOOD: Structured logging with context
logger.info('Processing user message', {
  userId: user.id,
  messageType: message.type,
  roomId: message.roomId,
  timestamp: Date.now()
});

logger.error('Service call failed', {
  service: 'twitter',
  endpoint: '/tweets',
  error: error.message,
  retryCount: 3
});

// ❌ BAD: Unstructured logging
logger.info('Got message from user');
logger.error('Something went wrong: ' + error);
```

### Sensitive Data Protection
```typescript
// Redact sensitive information
logger.debug('User authenticated', {
  userId: user.id,
  email: '[REDACTED]',        // Never log emails
  apiKey: '[REDACTED]',       // Never log secrets
  ipAddress: user.ip.slice(0, -2) + 'xx'  // Partial IP only
});
```

## Async & Streaming Patterns

### Promise Handling
```typescript
// ✅ PREFERRED: async/await
async function processMessage(message: Memory): Promise<ActionResult> {
  const context = await getContext(message);
  const response = await generateResponse(context);
  return await persistResponse(response);
}

// ❌ AVOID: Promise chains for complex flows
function processMessage(message) {
  return getContext(message)
    .then(context => generateResponse(context))
    .then(response => persistResponse(response));
}
```

### Streaming Response Handling
```typescript
// Model streaming pattern
async function* streamResponse(prompt: string): AsyncGenerator<string> {
  const stream = await model.generateStream(prompt);
  
  for await (const chunk of stream) {
    yield chunk.text;
  }
}

// Action streaming pattern  
handler: async (runtime, message, state, options, callback) => {
  const stream = runtime.generateStream(message.content);
  
  for await (const chunk of stream) {
    await callback({ 
      text: chunk, 
      action: 'STREAM_CHUNK',
      streaming: true 
    });
  }
  
  return { success: true };
};
```

### Concurrency Control
```typescript
// Rate limiting with semaphore pattern
class ServiceWithLimits {
  private semaphore = new Semaphore(5); // Max 5 concurrent calls
  
  async makeRequest(data: any): Promise<Result> {
    await this.semaphore.acquire();
    try {
      return await this.api.call(data);
    } finally {
      this.semaphore.release();
    }
  }
}
```

## Import & Export Patterns

### Internal Package Imports
```typescript
// ✅ PREFERRED: Use package names for dependencies
import { IAgentRuntime, Action } from '@elizaos/core';
import { DatabaseAdapter } from '@elizaos/plugin-sql';

// ✅ ALLOWED: Relative imports within same package
import { validateInput } from './utils';
import { MyService } from '../services/MyService';

// ❌ AVOID: Direct file paths across packages
import { runtime } from '../../../core/src/runtime';
```

### Export Consistency
```typescript
// Default exports for main component
export default class TwitterAction extends Action { }

// Named exports for utilities and types
export { TwitterConfig, TwitterClient } from './types';
export { validateTwitterAuth } from './utils';

// Re-exports in index files
export { default as TwitterAction } from './TwitterAction';
export * from './types';
```

## Code Organization Principles

### File Size & Responsibility
- **Max file length**: ~200-300 lines (excluding tests)
- **Single Responsibility**: One class/main function per file
- **Related Utilities**: Group in same file if < 50 lines total

### Directory Structure
```
src/
  actions/           # One action per file
    sendMessage.ts
    updateProfile.ts
  providers/         # Context suppliers
    timeProvider.ts  
    factsProvider.ts
  services/          # External integrations
    TwitterService.ts
    DatabaseService.ts
  types/            # Type definitions only
    twitter.ts
    database.ts
  utils/            # Pure functions
    validation.ts
    formatting.ts
  __tests__/        # Mirror src structure
    actions/
    services/
```

### Comment Guidelines
```typescript
/**
 * Processes user messages and generates appropriate responses.
 * Coordinates between memory retrieval, context building, and model interaction.
 * 
 * @param message - The incoming user message to process
 * @param context - Additional context from providers
 * @returns Promise resolving to generated response and updated state
 */
async processMessage(message: Memory, context: Context): Promise<Response> {
  // Complex business logic warrants explanation
  const relevantMemories = await this.searchMemories(message.content, {
    limit: 10,
    similarity: 0.8  // Threshold determined through experimentation
  });
  
  return this.generateResponse(message, relevantMemories);
}
```

## Performance Considerations

### Memory Management
- Prefer `const` over `let`, avoid `var` completely
- Use `WeakMap`/`WeakSet` for caching with automatic cleanup
- Clear large objects/arrays when no longer needed
- Stream large datasets instead of loading entirely into memory

### Database Patterns
- Always use prepared statements (Drizzle handles this)
- Batch insert operations when possible
- Use transactions for multi-table operations
- Index frequently queried columns

### Bundle Size Optimization
- Dynamic imports for large optional dependencies
- Tree-shaking friendly exports (avoid `export *` when possible)
- Separate client/server code bundles

## TODOs & Standards Gaps

- [ ] Formal code review checklist automation
- [ ] Performance benchmarking standards
- [ ] API versioning strategy documentation
- [ ] Security scanning integration
- [ ] Dependency update automation policies