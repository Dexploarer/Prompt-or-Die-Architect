# ElizaOS Testing Strategy

## Testing Framework & Philosophy

### Bun Test Only
ElizaOS exclusively uses Bun's built-in test runner:

```bash
# Never use these
npm test    # ❌ Forbidden
jest        # ❌ Forbidden  
vitest      # ❌ Forbidden
mocha       # ❌ Forbidden

# Always use
bun test    # ✅ Required
```

### Testing Philosophy
- **Integration over Unit**: Prefer full runtime tests over isolated units
- **Real Dependencies**: Use actual services, databases when possible
- **Isolation**: Each test gets independent state/database
- **Comprehensive**: Test entire feature flows, not just happy paths

## Test Organization

### File Structure
```
packages/*/src/
  __tests__/              # Test files mirror source structure
    runtime.test.ts       # Tests for runtime.ts
    actions.test.ts       # Tests for actions/index.ts
    services.test.ts      # Tests for services/index.ts
    test-utils.ts         # Package-specific test utilities
    
  actions/
    __tests__/            # Tests for specific actions
      sendMessage.test.ts
      updateProfile.test.ts
```

### Test Naming Convention
```typescript
// File naming: {component}.test.ts
describe('AgentRuntime', () => {
  describe('processMessage', () => {
    it('should process simple text message', async () => {
      // Test implementation
    });
    
    it('should handle message with attachments', async () => {
      // Test implementation
    });
    
    it('should reject message from unauthorized user', async () => {
      // Error case testing
    });
  });
});
```

## Test Infrastructure

### Database Testing
Using isolated test databases:

```typescript
// Test database setup (packages/test-utils/src/testDatabase.ts)
import { TestDatabaseManager } from '@elizaos/test-utils';

describe('Agent Memory Tests', () => {
  let testDb: IDatabaseAdapter;
  let dbManager: TestDatabaseManager;
  
  beforeEach(async () => {
    dbManager = new TestDatabaseManager();
    testDb = await dbManager.createIsolatedDatabase('memory-test');
    await testDb.init();
  });
  
  afterEach(async () => {
    await dbManager.cleanup();
  });
});
```

### Test Database Options
1. **PostgreSQL**: Real database for integration tests (preferred)
2. **PGLite**: Lightweight SQL database for quick tests
3. **Mock Database**: In-memory mock for unit tests (fallback)

```typescript
// Environment-based database selection
const getDatabaseForTesting = async (): Promise<IDatabaseAdapter> => {
  if (process.env.TEST_POSTGRES_URL) {
    return new PostgresAdapter(process.env.TEST_POSTGRES_URL);
  } else if (process.env.USE_PGLITE) {
    return new PgliteAdapter(':memory:');
  } else {
    return new MockDatabaseAdapter();
  }
};
```

## Mock System

### Service Mocking
```typescript
import { mock, spyOn } from 'bun:test';

// Mock external services
const mockTwitterService = {
  serviceType: 'twitter' as const,
  initialize: mock().mockResolvedValue(undefined),
  postTweet: mock().mockResolvedValue({ id: 'tweet-123' }),
  getUser: mock().mockResolvedValue({ username: 'testuser' })
};

// Mock runtime dependencies
const mockRuntime = {
  agentId: 'test-agent-uuid' as UUID,
  getService: mock((type: string) => {
    if (type === 'twitter') return mockTwitterService;
    throw new Error(`Service ${type} not available in mock`);
  }),
  databaseAdapter: mockDatabase,
  generateResponse: mock().mockResolvedValue('Test response')
};
```

### Character & Agent Mocking
```typescript
// Mock character configuration
const mockCharacter: Character = {
  name: 'TestAgent',
  bio: ['Test agent for automated testing'],
  lore: ['Created for test purposes'],
  messageExamples: [],
  postExamples: [],
  people: [],
  topics: [],
  adjectives: [],
  knowledge: [],
  clientConfig: {},
  settings: {
    model: 'gpt-4',
    temperature: 0.7
  }
};

// Mock agent runtime with test configuration
const createTestRuntime = async (): Promise<IAgentRuntime> => {
  return new AgentRuntime({
    databaseAdapter: await createTestDatabase(),
    character: mockCharacter,
    plugins: [],
    serverUrl: 'http://localhost:3000'
  });
};
```

## Test Patterns

### Action Testing
```typescript
describe('SendMessage Action', () => {
  let runtime: IAgentRuntime;
  let mockCallback: ReturnType<typeof mock>;
  
  beforeEach(async () => {
    runtime = await createTestRuntime();
    mockCallback = mock();
  });
  
  it('should send message successfully', async () => {
    const message: Memory = {
      id: 'test-message-uuid' as UUID,
      content: { text: 'Hello world' },
      roomId: 'test-room-uuid' as UUID,
      agentId: runtime.agentId,
      userId: 'test-user-uuid' as UUID,
      timestamp: Date.now()
    };
    
    const result = await sendMessageAction.handler(
      runtime, message, {} as State, {}, mockCallback
    );
    
    expect(result.success).toBe(true);
    expect(mockCallback).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining('Hello'),
        action: 'SEND_MESSAGE'
      })
    );
  });
});
```

### Provider Testing
```typescript
describe('Facts Provider', () => {
  let runtime: IAgentRuntime;
  let factsProvider: Provider;
  
  beforeEach(async () => {
    runtime = await createTestRuntime();
    factsProvider = new FactsProvider();
  });
  
  it('should provide relevant facts for message', async () => {
    const message: Memory = {
      content: { text: 'What is the weather like?' },
      // ... other properties
    };
    
    const context = await factsProvider.get(runtime, message);
    
    expect(context).toContain('Weather');
    expect(context.length).toBeGreaterThan(0);
  });
  
  it('should return empty string when no facts available', async () => {
    const emptyMessage: Memory = {
      content: { text: '' },
      // ... other properties
    };
    
    const context = await factsProvider.get(runtime, emptyMessage);
    
    expect(context).toBe('');
  });
});
```

### Service Integration Testing
```typescript
describe('Twitter Service Integration', () => {
  let runtime: IAgentRuntime;
  let twitterService: TwitterService;
  
  beforeEach(async () => {
    runtime = await createTestRuntime();
    twitterService = new TwitterService();
    await twitterService.initialize(runtime);
    await runtime.registerService(twitterService);
  });
  
  it('should post tweet through service', async () => {
    const tweetContent = 'Test tweet from integration test';
    
    // Use real API in integration environment, mock in unit tests
    if (process.env.TWITTER_API_TOKEN) {
      const result = await twitterService.postTweet(tweetContent);
      expect(result.id).toBeDefined();
      
      // Cleanup: delete test tweet
      await twitterService.deleteTweet(result.id);
    } else {
      // Mock API response for unit testing
      spyOn(twitterService, 'postTweet').mockResolvedValue({
        id: 'test-tweet-123',
        text: tweetContent
      });
      
      const result = await twitterService.postTweet(tweetContent);
      expect(result.id).toBe('test-tweet-123');
    }
  });
});
```

## Test Fixtures & Utilities

### Character Templates
```typescript
// Test character templates (packages/test-utils/src/templates.ts)
export const createTestCharacter = (overrides: Partial<Character> = {}): Character => ({
  name: 'TestBot',
  bio: ['A test bot for automated testing'],
  lore: ['Created in the test lab'],
  messageExamples: [
    [
      { user: 'user1', content: { text: 'Hello' } },
      { user: 'TestBot', content: { text: 'Hi there!' } }
    ]
  ],
  postExamples: ['Test post from TestBot'],
  people: [],
  topics: [],
  adjectives: ['helpful', 'reliable', 'test-oriented'],
  knowledge: [],
  clientConfig: {},
  settings: {
    model: 'gpt-4',
    temperature: 0.1  // Lower temperature for predictable test outputs
  },
  ...overrides
});
```

### Memory Factories
```typescript
// Memory creation utilities
export const createTestMemory = (overrides: Partial<Memory> = {}): Memory => ({
  id: uuidv4() as UUID,
  content: { text: 'Test memory content' },
  roomId: uuidv4() as UUID,
  agentId: uuidv4() as UUID,
  userId: uuidv4() as UUID,
  timestamp: Date.now(),
  type: MemoryType.MESSAGE,
  ...overrides
});

export const createTestMessage = (text: string, overrides: Partial<Memory> = {}): Memory =>
  createTestMemory({
    content: { text, action: 'TEST_MESSAGE' },
    ...overrides
  });
```

### Test Runtime Builder
```typescript
// Runtime builder for tests with common configuration
export class TestRuntimeBuilder {
  private character: Character = createTestCharacter();
  private plugins: Plugin[] = [];
  private databaseAdapter?: IDatabaseAdapter;
  
  withCharacter(character: Character): TestRuntimeBuilder {
    this.character = character;
    return this;
  }
  
  withPlugins(...plugins: Plugin[]): TestRuntimeBuilder {
    this.plugins.push(...plugins);
    return this;
  }
  
  withDatabase(adapter: IDatabaseAdapter): TestRuntimeBuilder {
    this.databaseAdapter = adapter;
    return this;
  }
  
  async build(): Promise<IAgentRuntime> {
    const db = this.databaseAdapter || await createTestDatabase();
    return new AgentRuntime({
      character: this.character,
      databaseAdapter: db,
      plugins: this.plugins,
      serverUrl: 'http://localhost:3000'
    });
  }
}

// Usage in tests
const runtime = await new TestRuntimeBuilder()
  .withCharacter(createTestCharacter({ name: 'SpecialBot' }))
  .withPlugins(twitterPlugin, discordPlugin)
  .build();
```

## Coverage Expectations

### Coverage Targets
- **Actions**: 90%+ coverage including error cases
- **Providers**: 85%+ coverage with various input scenarios  
- **Services**: 80%+ coverage focusing on integration points
- **Core Runtime**: 95%+ coverage (critical path)

### Running Coverage
```bash
# Generate coverage report
bun test --coverage

# Coverage by package
cd packages/core && bun test --coverage
cd packages/cli && bun test --coverage

# Specific coverage report generation (packages/cli/scripts/)
bun run generate-coverage-report.ts
```

### Coverage Configuration
```typescript
// bun test coverage configuration
{
  "coverage": {
    "thresholds": {
      "lines": 80,
      "functions": 80,
      "branches": 75,
      "statements": 80
    },
    "exclude": [
      "**/__tests__/**",
      "**/node_modules/**",
      "**/*.test.ts",
      "**/dist/**"
    ]
  }
}
```

## One-File-Per-Purpose Rule

### Component Testing
Each major component gets dedicated test file:

```
src/
  actions/
    sendMessage.ts          → __tests__/sendMessage.test.ts
    updateProfile.ts        → __tests__/updateProfile.test.ts
  services/
    TwitterService.ts       → __tests__/TwitterService.test.ts
    DatabaseService.ts      → __tests__/DatabaseService.test.ts
  providers/
    factsProvider.ts        → __tests__/factsProvider.test.ts
```

### Test File Focus
Each test file focuses on ONE primary component:

```typescript
// ✅ GOOD: sendMessage.test.ts focuses only on sendMessage action
describe('SendMessage Action', () => {
  // All tests related to sendMessage action
});

// ❌ BAD: Mixed component testing
describe('Actions', () => {
  describe('sendMessage', () => { /* ... */ });
  describe('updateProfile', () => { /* ... */ });  // Should be separate file
});
```

## Testing Commands

### Package-Specific Testing
```bash
# Test specific package
cd packages/core && bun test
cd packages/cli && bun test

# Test specific file
bun test src/__tests__/runtime.test.ts

# Watch mode for development
bun test --watch src/__tests__/runtime.test.ts
```

### Monorepo Testing
```bash
# Test all packages (excludes certain packages)
bun test

# Test with specific filters
bun test --filter="!./packages/plugin-starter" --filter="!./packages/docs"

# Parallel testing
bun test --concurrency=3
```

### CI Testing Pipeline
```bash
# Full test suite in CI
bun install
bun run build
bun test
bun run lint

# Test isolation verification
bun test --bail  # Stop on first failure
```

## Test Environment Configuration

### Environment Variables
```bash
# Testing-specific environment
NODE_ENV=test
LOG_LEVEL=error                    # Reduce noise in tests
TEST_POSTGRES_URL=postgresql://... # Real DB for integration tests
FORCE_MOCK_DB=true                 # Force mock database usage
TEST_TIMEOUT=30000                 # 30 second test timeout
```

### Test Configuration Files
```typescript
// Global test setup (packages/*/tests/setup.ts)
import { beforeAll, afterAll } from 'bun:test';

beforeAll(async () => {
  // Global test setup
  process.env.LOG_LEVEL = 'error';
  process.env.NODE_ENV = 'test';
});

afterAll(async () => {
  // Global cleanup
  await cleanupTestResources();
});
```

## Performance Testing

### Load Testing Actions
```typescript
describe('Action Performance', () => {
  it('should handle 100 concurrent messages', async () => {
    const runtime = await createTestRuntime();
    const messages = Array(100).fill(null).map(() => 
      createTestMessage('Performance test message')
    );
    
    const start = Date.now();
    const results = await Promise.all(
      messages.map(msg => sendMessageAction.handler(runtime, msg, {}, {}, mock()))
    );
    const duration = Date.now() - start;
    
    expect(results.every(r => r.success)).toBe(true);
    expect(duration).toBeLessThan(5000); // 5 second max
  });
});
```

### Memory Leak Detection
```typescript
describe('Memory Management', () => {
  it('should not leak memory during runtime lifecycle', async () => {
    const initialMemory = process.memoryUsage().heapUsed;
    
    for (let i = 0; i < 50; i++) {
      const runtime = await createTestRuntime();
      await runtime.processMessage(createTestMessage(`Test ${i}`));
      // Runtime should be garbage collected after scope
    }
    
    // Force garbage collection
    if (global.gc) global.gc();
    
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryGrowth = finalMemory - initialMemory;
    
    expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024); // 50MB max growth
  });
});
```

## TODOs & Testing Gaps

- [ ] Automated performance regression testing
- [ ] Cross-platform test execution (Windows, macOS, Linux)
- [ ] Plugin compatibility matrix testing
- [ ] End-to-end testing with real platform integrations
- [ ] Security vulnerability testing automation
- [ ] Test data management and seeding strategies
- [ ] Visual regression testing for UI components