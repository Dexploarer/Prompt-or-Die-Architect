# ElizaOS API Reference

## API Architecture Overview

### Domain-Based API Organization
ElizaOS organizes APIs by domain, not by resource type:

```
/api/
├── /agents           # Agent creation, management, interactions
├── /messaging        # Messages, channels, chat functionality
├── /memory          # Agent memory storage and retrieval
├── /audio           # Audio processing, transcription, voice
├── /media           # File uploads, media management
├── /server          # Server runtime operations
├── /system          # Health checks, environment config
└── /tee             # Trusted Execution Environment
```

### Response Format Standards
All APIs follow consistent response patterns:

```typescript
// Success response
interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

// Error response  
interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: string;
  };
}

type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
```

## Public APIs

### Agent Management (`/api/agents`)
Core agent lifecycle operations:

#### Create Agent
```http
POST /api/agents
Content-Type: application/json

{
  "character": {
    "name": "MyAgent",
    "bio": ["AI assistant with specialized knowledge"],
    "lore": ["Created for customer support"],
    "modelProvider": "openai",
    "settings": {
      "model": "gpt-4",
      "temperature": 0.7
    }
  }
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "name": "MyAgent",
    "status": "created",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### Start/Stop Agent
```http
POST /api/agents/{agentId}/start
POST /api/agents/{agentId}/stop

Response:
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "status": "running" | "stopped",
    "lastActivity": "2024-01-01T00:00:00Z"
  }
}
```

#### List Agents
```http
GET /api/agents?page=1&limit=20

Response:
{
  "success": true,
  "data": {
    "agents": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50
    }
  }
}
```

### Messaging API (`/api/messaging`)
Real-time communication endpoints:

#### Send Message
```http
POST /api/messaging/rooms/{roomId}/messages
Content-Type: application/json

{
  "content": {
    "text": "Hello, how can I help you?",
    "action": "SEND_MESSAGE"
  },
  "agentId": "uuid-string"
}

Response:
{
  "success": true,
  "data": {
    "id": "message-uuid",
    "roomId": "room-uuid",
    "content": {...},
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

#### Get Room Messages
```http
GET /api/messaging/rooms/{roomId}/messages?limit=50&before=message-uuid

Response:
{
  "success": true,
  "data": {
    "messages": [...],
    "hasMore": true,
    "cursor": "next-message-uuid"
  }
}
```

### Memory Management (`/api/memory`)
Agent memory operations:

#### Search Memories
```http
POST /api/memory/{agentId}/search
Content-Type: application/json

{
  "query": "customer support tickets",
  "limit": 10,
  "similarity": 0.8,
  "type": "factual"
}

Response:
{
  "success": true,
  "data": {
    "memories": [
      {
        "id": "memory-uuid",
        "content": {...},
        "similarity": 0.95,
        "timestamp": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

#### Create Memory
```http
POST /api/memory/{agentId}/memories
Content-Type: application/json

{
  "content": {
    "text": "Customer reported payment issue",
    "action": "REMEMBER_FACT"
  },
  "roomId": "room-uuid",
  "type": "factual"
}

Response:
{
  "success": true,
  "data": {
    "id": "memory-uuid",
    "agentId": "agent-uuid",
    "content": {...},
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### Media Upload (`/api/media`)
File upload and media processing:

#### Upload File
```http
POST /api/media/upload
Content-Type: multipart/form-data

FormData:
- file: [binary data]
- agentId: "uuid-string"
- roomId: "uuid-string" (optional)

Response:
{
  "success": true,
  "data": {
    "id": "file-uuid",
    "filename": "document.pdf",
    "mimeType": "application/pdf",
    "size": 1024000,
    "url": "/api/media/files/file-uuid"
  }
}
```

## Internal APIs

### Runtime Management (`/api/server`)
Server administration endpoints (restricted access):

#### Server Health
```http
GET /api/server/health

Response:
{
  "success": true,
  "data": {
    "status": "healthy",
    "uptime": 3600,
    "memory": {
      "used": "125MB",
      "total": "512MB"
    },
    "agents": {
      "total": 5,
      "running": 3,
      "stopped": 2
    }
  }
}
```

#### Runtime Configuration
```http
GET /api/server/config
PUT /api/server/config

Request Body (PUT):
{
  "logLevel": "debug",
  "rateLimiting": {
    "enabled": true,
    "maxRequests": 100,
    "windowMs": 60000
  }
}
```

### System Configuration (`/api/system`)
Environment and system management:

#### Environment Status
```http
GET /api/system/environment

Response:
{
  "success": true,
  "data": {
    "nodeVersion": "23.3.0",
    "platform": "linux",
    "environment": "development",
    "database": {
      "type": "postgresql",
      "connected": true
    },
    "modelProviders": {
      "openai": { "configured": true },
      "anthropic": { "configured": false }
    }
  }
}
```

## Authentication & Authorization

### API Key Authentication
```http
GET /api/agents
Authorization: Bearer your-api-key-here
X-API-KEY: your-api-key-here  # Alternative header format
```

### Agent-Scoped Operations
Many endpoints require agent context:

```http
GET /api/memory/{agentId}/memories
# Agent ID in path provides scope

POST /api/messaging/rooms/{roomId}/messages
Content-Type: application/json
{
  "agentId": "uuid-string",  # Agent context in body
  "content": {...}
}
```

### Role-Based Access Control
- **Public APIs**: Agent interactions, memory operations
- **Admin APIs**: Agent lifecycle, server configuration
- **System APIs**: Health checks, environment status
- **Plugin APIs**: Custom routes defined by plugins

## Versioning Strategy

### Current Approach
- **API Version**: v1 (implicit, no version prefix)
- **Breaking Changes**: New major version (`/v2/api/...`)
- **Backwards Compatibility**: Maintained for one major version

### Content Negotiation
```http
Accept: application/json
Content-Type: application/json

# Future: Version-specific content types
Accept: application/vnd.elizaos.v1+json
```

## WebSocket Real-time APIs

### Connection Setup
```javascript
const io = require('socket.io-client');
const socket = io('ws://localhost:3000', {
  auth: {
    apiKey: 'your-api-key'
  }
});
```

### Event Patterns
```javascript
// Join agent room for real-time updates
socket.emit('join', { 
  agentId: 'uuid-string',
  roomId: 'room-uuid'
});

// Listen for new messages
socket.on('message', (data) => {
  console.log('New message:', data.content);
});

// Send message through WebSocket
socket.emit('sendMessage', {
  roomId: 'room-uuid',
  agentId: 'agent-uuid',
  content: { text: 'Hello!' }
});

// Memory updates
socket.on('memoryCreated', (memory) => {
  console.log('New memory:', memory.content);
});

// Agent status changes
socket.on('agentStatus', (status) => {
  console.log('Agent status:', status.state);
});
```

### Log Streaming
```javascript
// Real-time log streaming for debugging
socket.on('log', (logEntry) => {
  console.log(`[${logEntry.level}] ${logEntry.message}`, logEntry.context);
});
```

## Plugin Route System

### Plugin Route Registration
```typescript
// In plugin definition
export const myPlugin: Plugin = {
  name: 'my-plugin',
  routes: [
    {
      path: '/hello',
      method: 'GET',
      handler: (req, res, runtime) => {
        res.json({ message: 'Hello from plugin!' });
      }
    },
    {
      path: '/upload/*',  // Wildcard route
      method: 'POST',
      handler: (req, res, runtime) => {
        // Handle file uploads
      }
    }
  ]
};
```

### Plugin Route Access
```http
# Agent-scoped plugin route
GET /hello?agentId=uuid-string

# Global plugin route (if no agent-specific params)
GET /hello

# Plugin wildcard routes
POST /upload/images
POST /upload/documents
```

## Error Handling Patterns

### Standard Error Codes
```typescript
// Common error codes across all APIs
enum ErrorCode {
  AGENT_NOT_FOUND = 'AGENT_NOT_FOUND',
  INVALID_INPUT = 'INVALID_INPUT',
  UNAUTHORIZED = 'UNAUTHORIZED',
  RATE_LIMITED = 'RATE_LIMITED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE'
}
```

### Error Response Examples
```http
HTTP 400 Bad Request
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Required field 'content' is missing",
    "details": "content.text or content.action must be provided"
  }
}

HTTP 404 Not Found
{
  "success": false,
  "error": {
    "code": "AGENT_NOT_FOUND",
    "message": "Agent with ID 'uuid-string' not found"
  }
}

HTTP 429 Too Many Requests
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Rate limit exceeded",
    "details": "Try again in 60 seconds"
  }
}
```

## Rate Limiting & Security

### Rate Limiting Configuration
- **Default Limit**: 100 requests per minute per API key
- **Endpoints**: Different limits per endpoint category
  - Public APIs: 100/min
  - Admin APIs: 20/min
  - Upload APIs: 10/min

### Security Headers
```http
# Applied to all API responses
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: no-referrer
Cross-Origin-Resource-Policy: cross-origin
```

### CORS Policy
```javascript
// API-specific CORS (more restrictive than web UI)
{
  origin: process.env.API_CORS_ORIGIN || false,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-KEY'],
  maxAge: 86400  // 24 hours
}
```

## Type-Safe Client Usage

### API Client Configuration
```typescript
import { ElizaApiClient } from '@elizaos/api-client';

const client = new ElizaApiClient({
  baseUrl: 'http://localhost:3000/api',
  apiKey: 'your-api-key',
  timeout: 30000
});
```

### Typed API Calls
```typescript
// All methods return typed promises
const agents = await client.agents.list({ page: 1, limit: 10 });
// agents is typed as ApiResponse<{ agents: Agent[], pagination: Pagination }>

const message = await client.messaging.sendMessage('room-id', {
  content: { text: 'Hello' },
  agentId: 'agent-id'
});
// message is typed as ApiResponse<Message>

// Error handling with type guards
if (!agents.success) {
  console.error(`Error ${agents.error.code}: ${agents.error.message}`);
  return;
}

// Type-safe data access
console.log(`Found ${agents.data.agents.length} agents`);
```

## TODOs & API Gaps

- [ ] GraphQL endpoint for complex queries
- [ ] Batch operations API (multiple agents/messages)
- [ ] Webhook subscription system
- [ ] API usage analytics and monitoring
- [ ] OpenAPI/Swagger documentation generation
- [ ] Client SDK generation for multiple languages
- [ ] Request/response caching strategy
- [ ] API gateway integration patterns