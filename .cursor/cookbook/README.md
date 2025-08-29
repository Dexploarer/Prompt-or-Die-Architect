# ElizaOS Cookbook Index

A comprehensive guide to the ElizaOS multi-agent AI framework. Each cookbook file provides actionable insights, specific patterns, and concrete examples from the actual codebase.

## Cookbook Files

### [00-overview.md](./00-overview.md)
Repository structure, core domains, key packages, and essential commands for ElizaOS development.

### [01-architecture.md](./01-architecture.md) 
System layers, component boundaries, data flow patterns, dependency rules, and extension points.

### [02-coding-standards.md](./02-coding-standards.md)
TypeScript patterns, naming conventions, error handling models, logging standards, and code organization.

### [03-patterns.md](./03-patterns.md)
Adapter pattern implementations, dependency injection, state management, caching strategies, and resilience patterns.

### [04-apis.md](./04-apis.md)
REST/WebSocket APIs, request/response formats, authentication, versioning, and type-safe client usage.

### [05-testing.md](./05-testing.md)
Bun-based testing strategy, mock systems, integration patterns, coverage expectations, and test organization.

### [06-security.md](./06-security.md)
Secret management, authentication/authorization, input validation, SSRF/RCE prevention, and security monitoring.

### [07-performance.md](./07-performance.md)
Hotspot identification, batching strategies, pagination patterns, concurrency control, and memory optimization.

### [08-decisions.md](./08-decisions.md)
Major architectural decisions (ADRs) with rationale, trade-offs, and implementation details for key choices.

### [09-glossary.md](./09-glossary.md)
Domain terminology, abbreviations, component definitions, and platform-specific concepts with file references.

### [10-quickstart.md](./10-quickstart.md)
Installation, development workflow, essential commands, debugging tips, and common troubleshooting solutions.

### [11-contributing.md](./11-contributing.md)
PR review checklist, commit conventions, CI/CD expectations, testing requirements, and community guidelines.

---

## Quick Reference

### Essential Commands
```bash
# Setup & Installation
bun install -g @elizaos/cli
elizaos create my-agent && cd my-agent
elizaos start

# Development Workflow  
bun install && bun run build
bun test && bun run lint
bun start
```

### Key File Locations
- **Core Types**: `/packages/core/src/types/index.ts`
- **Runtime**: `/packages/core/src/runtime.ts`
- **CLI Commands**: `/packages/cli/src/commands/`
- **API Routes**: `/packages/server/src/api/`
- **Database Schema**: `/packages/plugin-sql/src/schema/`

### Critical Constraints
- **Package Manager**: Only Bun (never npm/pnpm)
- **Dependencies**: Use `workspace:*` for internal packages
- **Process Execution**: Only Bun.spawn() (never Node.js child_process)
- **Event System**: EventTarget only (never EventEmitter)
- **Testing**: Bun test only (never Jest/Vitest/Mocha)

---

*This cookbook reflects the actual patterns, constraints, and conventions used in the ElizaOS codebase as of the latest analysis.*