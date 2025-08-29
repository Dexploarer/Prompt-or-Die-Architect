# ElizaOS Security Guide

## Secret Management

### Environment Variable Patterns
ElizaOS uses environment variables for all sensitive configuration:

```bash
# Model Provider Keys
OPENAI_API_KEY=sk-...                    # OpenAI API access
ANTHROPIC_API_KEY=sk-ant-...            # Anthropic Claude access
GOOGLE_API_KEY=AIza...                  # Google Gemini access

# Platform Integration Tokens
DISCORD_APPLICATION_ID=123456...        # Discord bot app ID
DISCORD_API_TOKEN=MTk...                # Discord bot token
TELEGRAM_BOT_TOKEN=1234567:AAG...       # Telegram bot token
TWITTER_USERNAME=your_bot_account       # Twitter account
TWITTER_PASSWORD=secure_password        # Twitter password (deprecated)

# Database & Infrastructure
POSTGRES_URL=postgresql://user:pass@... # Production database
TEST_POSTGRES_URL=postgresql://...      # Test database (isolated)
REDIS_URL=redis://localhost:6379       # Cache and session store

# Security & Access Control
JWT_SECRET=your_jwt_secret              # JWT token signing
API_KEYS=key1,key2,key3                 # Comma-separated API keys
ENCRYPTION_KEY=base64_encoded_key       # Data encryption key
```

### Secret Loading & Validation
```typescript
// Environment variable validation (packages/core/src/utils/environment.ts)
import { getEnv } from '@elizaos/core';

// Required secrets with validation
const apiKey = getEnv('OPENAI_API_KEY', {
  required: true,
  validate: (key) => key.startsWith('sk-'),
  error: 'OpenAI API key must start with sk-'
});

// Optional secrets with defaults
const jwtSecret = getEnv('JWT_SECRET', {
  default: crypto.randomBytes(32).toString('hex'),
  validate: (secret) => secret.length >= 32
});

// Encrypted secret storage
import { decryptSecret } from '@elizaos/core';
const decryptedKey = decryptSecret(process.env.ENCRYPTED_API_KEY, process.env.ENCRYPTION_KEY);
```

### Secret Encryption
```typescript
// Encrypt secrets for storage (packages/core/src/index.ts)
import { encryptSecret, decryptSecret, getSalt } from '@elizaos/core';

// Encrypt sensitive data before storage
const salt = getSalt();
const encryptedToken = encryptSecret(apiToken, salt);

// Store only encrypted version
await database.storeSecret({
  name: 'twitter_token',
  value: encryptedToken,
  salt: salt
});

// Decrypt when needed
const decryptedToken = decryptSecret(encryptedToken, salt);
```

## Authentication & Authorization

### API Key Authentication
```typescript
// API key middleware (packages/server/src/api/shared/middleware.ts)
export const authenticateApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.header('X-API-KEY') || 
                req.header('Authorization')?.replace('Bearer ', '') ||
                req.query.apiKey;
  
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: { code: 'NO_API_KEY', message: 'API key required' }
    });
  }
  
  const validKeys = process.env.API_KEYS?.split(',') || [];
  if (!validKeys.includes(apiKey)) {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_API_KEY', message: 'Invalid API key' }
    });
  }
  
  req.apiKey = apiKey;
  next();
};
```

### Agent-Scoped Authorization
```typescript
// Agent access control
export const authorizeAgentAccess = (req: Request, res: Response, next: NextFunction) => {
  const { agentId } = req.params;
  const userApiKey = req.apiKey;
  
  // Check if API key has access to this agent
  const agentPermissions = getAgentPermissions(userApiKey);
  if (!agentPermissions.includes(agentId)) {
    return res.status(403).json({
      success: false,
      error: { 
        code: 'INSUFFICIENT_PERMISSIONS', 
        message: 'Access denied to this agent' 
      }
    });
  }
  
  next();
};
```

### Role-Based Access Control
```typescript
// Permission levels
enum Permission {
  READ_AGENTS = 'read:agents',
  WRITE_AGENTS = 'write:agents',
  DELETE_AGENTS = 'delete:agents',
  READ_MEMORIES = 'read:memories',
  WRITE_MEMORIES = 'write:memories',
  ADMIN_SERVER = 'admin:server'
}

// Role definitions
interface Role {
  name: string;
  permissions: Permission[];
}

const roles: Record<string, Role> = {
  viewer: {
    name: 'Viewer',
    permissions: [Permission.READ_AGENTS, Permission.READ_MEMORIES]
  },
  operator: {
    name: 'Operator', 
    permissions: [
      Permission.READ_AGENTS, 
      Permission.WRITE_AGENTS,
      Permission.READ_MEMORIES, 
      Permission.WRITE_MEMORIES
    ]
  },
  admin: {
    name: 'Administrator',
    permissions: Object.values(Permission)
  }
};
```

## Input Validation & Sanitization

### Request Validation Middleware
```typescript
// Content validation (packages/server/src/api/shared/middleware.ts)
import { z } from 'zod';

const MessageSchema = z.object({
  content: z.object({
    text: z.string().max(4000).min(1),
    action: z.string().optional()
  }),
  roomId: z.string().uuid(),
  agentId: z.string().uuid()
});

export const validateMessageInput = (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = MessageSchema.parse(req.body);
    req.validatedBody = validated;
    next();
  } catch (error) {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'Request validation failed',
        details: error instanceof z.ZodError ? error.errors : undefined
      }
    });
  }
};
```

### Character Validation
```typescript
// Character security validation (packages/core/src/schemas/character.ts)
import { z } from 'zod';

const CharacterSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(50, 'Name too long')
    .regex(/^[a-zA-Z0-9_\s-]+$/, 'Invalid characters in name'),
    
  bio: z.array(z.string().max(500))
    .max(10, 'Too many bio entries'),
    
  lore: z.array(z.string().max(1000))
    .max(20, 'Too many lore entries'),
    
  knowledge: z.array(z.string().max(2000))
    .max(100, 'Too much knowledge'),
    
  // Prevent code injection in settings
  settings: z.object({
    model: z.enum(['gpt-4', 'gpt-3.5-turbo', 'claude-3', /* ... */]),
    temperature: z.number().min(0).max(2),
    maxTokens: z.number().min(1).max(4096)
  }).strict(), // Reject unknown properties
  
  // Sanitize client configuration
  clientConfig: z.record(z.unknown())
    .refine(config => {
      // Block dangerous configuration keys
      const dangerousKeys = ['eval', 'Function', '__proto__', 'constructor'];
      return !Object.keys(config).some(key => dangerousKeys.includes(key));
    }, 'Dangerous configuration detected')
});

// Usage in character creation
export const validateCharacter = (character: unknown): Character => {
  return CharacterSchema.parse(character);
};
```

### SQL Injection Prevention
```typescript
// Safe database queries using Drizzle ORM
import { eq, and, like } from 'drizzle-orm';
import { memories } from '../schema';

// ✅ SAFE: Parameterized queries via Drizzle
const getMemoriesByQuery = async (agentId: UUID, searchText: string) => {
  return db.select()
    .from(memories)
    .where(and(
      eq(memories.agentId, agentId),
      like(memories.content, `%${searchText}%`)  // Automatically escaped
    ));
};

// ❌ DANGEROUS: Raw SQL with string interpolation (NEVER DO THIS)
const unsafeQuery = `SELECT * FROM memories WHERE agent_id = '${agentId}' AND content LIKE '%${searchText}%'`;
```

## SSRF & RCE Prevention

### HTTP Request Filtering
```typescript
// Safe HTTP client (packages/core/src/utils/http.ts)
export class SecureHttpClient {
  private blockedDomains = [
    'localhost', '127.0.0.1', '::1',
    '169.254.169.254',  // AWS metadata
    '10.0.0.0/8',       // Private networks
    '172.16.0.0/12',
    '192.168.0.0/16'
  ];
  
  async fetch(url: string, options: RequestInit = {}): Promise<Response> {
    const parsedUrl = new URL(url);
    
    // Block dangerous protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('Invalid protocol: only HTTP/HTTPS allowed');
    }
    
    // Block internal/private addresses
    if (this.isBlockedDomain(parsedUrl.hostname)) {
      throw new Error('Access to internal addresses blocked');
    }
    
    // Set security headers
    const secureOptions: RequestInit = {
      ...options,
      headers: {
        'User-Agent': 'ElizaOS-Agent/1.0',
        ...options.headers
      },
      // Timeout to prevent hanging requests
      signal: AbortSignal.timeout(30000)
    };
    
    return fetch(url, secureOptions);
  }
  
  private isBlockedDomain(hostname: string): boolean {
    // Implementation to check against blocked domains/IP ranges
    return this.blockedDomains.some(blocked => {
      if (blocked.includes('/')) {
        // CIDR block checking
        return this.isInCidrBlock(hostname, blocked);
      }
      return hostname === blocked;
    });
  }
}
```

### Command Execution Prevention
```typescript
// Safe process execution (packages/cli/src/utils/bun-exec.ts)
import { spawn } from 'bun';

// Command whitelist for allowed operations
const ALLOWED_COMMANDS = [
  'git', 'bun', 'node', 'npm', 'tsc', 'eslint', 'prettier'
];

export const bunExec = async (command: string, args: string[], options: SpawnOptions = {}) => {
  // Validate command is in allowlist
  if (!ALLOWED_COMMANDS.includes(command)) {
    throw new Error(`Command '${command}' not allowed`);
  }
  
  // Sanitize arguments to prevent injection
  const sanitizedArgs = args.map(arg => {
    // Block shell metacharacters
    if (/[;&|`$()]/.test(arg)) {
      throw new Error(`Dangerous characters in argument: ${arg}`);
    }
    return arg;
  });
  
  // Execute with restricted environment
  return spawn([command, ...sanitizedArgs], {
    ...options,
    env: {
      // Minimal environment to prevent information leakage
      PATH: process.env.PATH,
      NODE_ENV: process.env.NODE_ENV
    },
    stdout: 'pipe',
    stderr: 'pipe'
  });
};
```

### File System Access Control
```typescript
// Safe file operations
export class SecureFileManager {
  private allowedDirectories = [
    '/tmp/eliza-uploads/',
    './user-data/',
    './logs/'
  ];
  
  private isPathSafe(filePath: string): boolean {
    const resolvedPath = path.resolve(filePath);
    
    // Prevent path traversal
    if (resolvedPath.includes('..')) {
      return false;
    }
    
    // Check against allowed directories
    return this.allowedDirectories.some(allowedDir => 
      resolvedPath.startsWith(path.resolve(allowedDir))
    );
  }
  
  async writeFile(filePath: string, content: string): Promise<void> {
    if (!this.isPathSafe(filePath)) {
      throw new Error('Access denied: unsafe file path');
    }
    
    // Additional validation
    if (content.length > 10 * 1024 * 1024) { // 10MB limit
      throw new Error('File too large');
    }
    
    return Bun.write(filePath, content);
  }
}
```

## Least Privilege Principles

### Service Isolation
```typescript
// Service with minimal permissions
class TwitterService extends Service {
  private apiClient: TwitterApi;
  
  async initialize(runtime: IAgentRuntime): Promise<void> {
    // Only request necessary Twitter permissions
    this.apiClient = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY,
      appSecret: process.env.TWITTER_API_SECRET,
      accessToken: process.env.TWITTER_ACCESS_TOKEN,
      accessSecret: process.env.TWITTER_ACCESS_SECRET,
      
      // Minimal permissions
      permissions: ['read', 'write']  // No admin permissions
    });
  }
  
  // Methods only expose necessary functionality
  async postTweet(content: string): Promise<Tweet> {
    // Validate content before posting
    if (content.length > 280) {
      throw new Error('Tweet too long');
    }
    
    return this.apiClient.v2.tweet(content);
  }
  
  // Don't expose dangerous operations
  // async deleteAllTweets() -- NOT IMPLEMENTED
  // async changePassword() -- NOT IMPLEMENTED
}
```

### Agent Permissions
```typescript
// Agent-specific capability restrictions
interface AgentCapabilities {
  canAccessInternet: boolean;
  canExecuteCode: boolean;
  canAccessFiles: boolean;
  canModifySystem: boolean;
  allowedServices: string[];
  rateLimits: {
    messagesPerMinute: number;
    apiCallsPerHour: number;
  };
}

const restrictedAgentCapabilities: AgentCapabilities = {
  canAccessInternet: false,
  canExecuteCode: false, 
  canAccessFiles: false,
  canModifySystem: false,
  allowedServices: ['memory', 'messaging'],
  rateLimits: {
    messagesPerMinute: 10,
    apiCallsPerHour: 100
  }
};
```

## Security Headers & Middleware

### HTTP Security Headers
```typescript
// Security headers middleware (packages/server/src/api/index.ts)
import helmet from 'helmet';

app.use(helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'cdnjs.cloudflare.com'],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'wss:'],
      fontSrc: ["'self'", 'cdnjs.cloudflare.com'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  
  // Additional security headers
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'no-referrer' },
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
```

### Rate Limiting
```typescript
// Rate limiting configuration
import rateLimit from 'express-rate-limit';

export const createApiRateLimit = () => rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  
  // Rate limit by API key instead of IP when available
  keyGenerator: (req) => req.apiKey || req.ip,
  
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests, try again later'
    }
  },
  
  // Skip successful requests from rate limiting
  skipSuccessfulRequests: true,
  
  // Differentiated limits by endpoint
  skip: (req) => {
    // Higher limits for read operations
    if (req.method === 'GET') {
      return false; // Apply standard limit
    }
    return false;
  }
});
```

### CORS Security
```typescript
// Strict CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
    
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  
  credentials: true,
  optionsSuccessStatus: 200,
  
  // Restrict allowed headers
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-KEY'],
  
  // Limit exposed headers
  exposedHeaders: ['X-Total-Count']
};
```

## Logging & Monitoring

### Security Event Logging
```typescript
// Security-focused logging
import { logger } from '@elizaos/core';

export const logSecurityEvent = (event: string, context: Record<string, unknown>) => {
  logger.warn(`SECURITY: ${event}`, {
    ...context,
    timestamp: new Date().toISOString(),
    severity: 'security'
  });
};

// Usage examples
logSecurityEvent('INVALID_API_KEY', {
  ip: req.ip,
  userAgent: req.get('User-Agent'),
  endpoint: req.path
});

logSecurityEvent('RATE_LIMIT_EXCEEDED', {
  apiKey: req.apiKey,
  ip: req.ip,
  endpoint: req.path,
  requestCount: requestCount
});

logSecurityEvent('SUSPICIOUS_ACTIVITY', {
  agentId: agentId,
  activity: 'Multiple failed authentication attempts',
  count: failedAttempts
});
```

### Sensitive Data Redaction
```typescript
// Log sanitization (packages/core/src/logger.ts)
const sanitizeLogData = (data: any): any => {
  const sensitiveFields = [
    'password', 'token', 'apiKey', 'secret', 'authorization',
    'cookie', 'session', 'jwt', 'signature'
  ];
  
  if (typeof data === 'object' && data !== null) {
    const sanitized = { ...data };
    
    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }
  
  return data;
};

// Apply in logger middleware
logger.debug('Processing request', sanitizeLogData({
  url: req.url,
  headers: req.headers,
  body: req.body
}));
```

## TODOs & Security Gaps

- [ ] Automated security scanning (SAST/DAST)
- [ ] Dependency vulnerability scanning
- [ ] Penetration testing procedures
- [ ] Security incident response plan
- [ ] Certificate management automation
- [ ] Multi-factor authentication support
- [ ] Session management and JWT refresh
- [ ] Database encryption at rest
- [ ] Network security policies (VPC, firewall rules)
- [ ] Compliance frameworks (SOC2, GDPR)