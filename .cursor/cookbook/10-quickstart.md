# ElizaOS Quickstart Guide

## Prerequisites & Installation

### Required Tools
```bash
# Install Node.js 23.3.0+ (required)
# Download from https://nodejs.org/ or use version manager
node --version  # Should be 23.3.0 or higher

# Install Bun (CRITICAL - primary package manager)
curl -fsSL https://bun.sh/install | bash
# or on Windows: powershell -c "irm bun.sh/install.ps1|iex"

bun --version   # Should be 1.2.15 or higher
```

### Global CLI Installation
```bash
# Install ElizaOS CLI globally
bun install -g @elizaos/cli

# Verify installation
elizaos --version
elizaos --help
```

## Development Workflow

### Monorepo Setup
```bash
# Clone repository
git clone https://github.com/elizaOS/eliza.git
cd eliza

# Install all dependencies (NEVER use npm/pnpm)
bun install

# Build all packages
bun run build

# Verify installation
bun test --run
```

### Package-Specific Development
```bash
# Work on specific package
cd packages/core
bun run dev       # Development mode with watch
bun run build     # Build this package only
bun test         # Run package tests

# CLI development
cd packages/cli
bun run dev       # CLI development mode
bun test         # CLI-specific tests

# Client development  
cd packages/client
bun run dev       # Start dev server (usually http://localhost:5173)
bun run build     # Build for production
bun run test      # Frontend tests
```

## Running ElizaOS

### Using Global CLI (Recommended)
```bash
# Create new project
elizaos create my-agent
cd my-agent

# Configure environment
elizaos env edit-local
# Add your API keys (OPENAI_API_KEY, etc.)

# Start agent
elizaos start

# Development mode with auto-reload
LOG_LEVEL=debug elizaos start
```

### Using Monorepo CLI
```bash
# From repository root
bun start                    # Start CLI runtime
bun run start:debug         # Debug mode
bun run start:app          # Start Tauri desktop app

# With custom character
bun start --character=./characters/my-bot.json

# Multiple agents
bun start --character=./characters/agent1.json &
bun start --character=./characters/agent2.json &
```

### Server Mode
```bash
# Start HTTP/WebSocket server
cd packages/server
bun run build
bun start

# With custom configuration
PORT=3001 bun start
CORS_ORIGIN=http://localhost:5173 bun start
```

## Testing

### Full Test Suite
```bash
# Run all tests (excludes some packages)
bun test

# Run tests with specific concurrency
bun test --concurrency=3

# Test specific patterns
bun test --filter="**/runtime.test.ts"
```

### Package-Specific Testing
```bash
# Core package tests
bun run test:core

# CLI package tests  
bun run test:cli

# Client package tests
bun run test:client

# App package tests
bun run test:app
```

### Test Development Workflow
```bash
# Watch mode for TDD
cd packages/core
bun test --watch src/__tests__/runtime.test.ts

# Run specific test files
bun test src/__tests__/actions.test.ts

# Debug tests with logging
LOG_LEVEL=debug bun test
```

## Code Quality & Linting

### Linting & Formatting
```bash
# Lint and format all packages
bun run lint

# Format only (no fixes)
bun run format

# Check formatting without changes
bun run format:check

# Pre-commit checks
bun run pre-commit
```

### Package-Specific Linting
```bash
# Lint specific package
cd packages/core
bun run lint

# Format specific package
cd packages/cli  
bun run format

# Type checking
bun run build  # TypeScript compilation will catch type errors
```

## Building & Distribution

### Development Builds
```bash
# Build all packages
bun run build

# Build specific packages
bun run build:core
bun run build:cli  
bun run build:client

# Clean build (removes all artifacts)
bun run clean
```

### Production Builds
```bash
# Full production build
bun run build

# Client production build
cd packages/client
bun run build
# Output in dist/ directory

# CLI distribution build
cd packages/cli
bun run build
# Creates executable dist bundle
```

### Docker Builds
```bash
# Build Docker image
bun run docker:build

# Run in Docker
bun run docker:run

# Access container shell
bun run docker:bash

# Complete Docker workflow
bun run docker  # build + run + bash
```

## Database Operations

### Database Setup
```bash
# Default: Uses PGLite (no setup required)
elizaos start  # Automatically creates local database

# PostgreSQL setup (optional)
export POSTGRES_URL="postgresql://user:pass@localhost/elizaos"
bun run migrate
```

### Migration Management
```bash
# Run migrations
bun run migrate

# Generate new migration
bun run migrate:generate

# Check migration status
cd packages/plugin-sql
bun run migrate:status
```

## Environment Configuration

### Essential Environment Variables
```bash
# Create .env file
cp .env.example .env

# Required API keys
OPENAI_API_KEY=sk-...                    # OpenAI access
ANTHROPIC_API_KEY=sk-ant-...            # Anthropic Claude

# Optional platform keys
DISCORD_APPLICATION_ID=123456789...     # Discord bot
DISCORD_API_TOKEN=MTk...               # Discord token
TELEGRAM_BOT_TOKEN=1234567:AAG...      # Telegram bot

# Database (optional - defaults to PGLite)
POSTGRES_URL=postgresql://...           # Production DB

# Logging
LOG_LEVEL=info                          # debug, info, warn, error
```

### Environment Management
```bash
# Edit environment with CLI
elizaos env edit-local
elizaos env edit-global

# Validate environment
elizaos env validate

# Show current configuration
elizaos env show
```

## Project Creation & Templates

### Create New Project
```bash
# Interactive project creation
elizaos create my-project

# Non-interactive with defaults
elizaos create my-project --yes --type=project

# Plugin creation
elizaos create my-plugin --type=plugin

# TEE project
elizaos create tee-project --type=tee
```

### Template Options
- **Project**: Full ElizaOS application with agents
- **Plugin**: Reusable component package
- **Quick Plugin**: Minimal plugin template
- **TEE Project**: Trusted Execution Environment setup

## Debugging & Troubleshooting

### Debug Modes
```bash
# Debug logging
LOG_LEVEL=debug elizaos start

# Verbose CLI output  
elizaos start --verbose

# TypeScript debugging
NODE_OPTIONS="--inspect" bun start

# Memory debugging
NODE_OPTIONS="--max-old-space-size=4096" bun start
```

### Common Issues
```bash
# Clear build cache
bun run clean && bun install && bun run build

# Fix TypeScript errors
cd packages/core && bun run build

# Reset database
rm -rf .eliza .elizadb
bun run migrate

# Network issues
export NODE_TLS_REJECT_UNAUTHORIZED=0  # Only for development
```

### Health Checks
```bash
# Check system health
elizaos doctor

# Validate project structure
elizaos validate

# Check dependencies
bun run check-deps

# Test database connection
elizaos test-db
```

## Release & Publishing

### Version Management
```bash
# Version bump and publish (maintainers only)
bun run release

# Alpha release
bun run release:alpha

# Check what would be published
bun run release --dry-run
```

### Package Publishing
```bash
# Publish specific package
cd packages/my-plugin
npm publish  # Uses npm for publishing to registry

# Publish to GitHub Packages
npm publish --registry=https://npm.pkg.github.com
```

## Performance Tips

### Development Performance
```bash
# Use watch mode for active development
bun run dev

# Parallel package building
bun run build --concurrency=100%

# Skip expensive operations
SKIP_BUILD=true bun test
NO_TYPECHECK=true bun run dev
```

### Production Optimization
```bash
# Production environment variables
NODE_ENV=production
LOG_LEVEL=warn
CACHE_SIZE=1000

# Enable optimizations
USE_SWC=true bun run build
BUNDLE_ANALYZER=true bun run build:client
```

## Essential Commands Reference

### Package Management
```bash
bun install              # Install dependencies
bun add package          # Add dependency
bun remove package       # Remove dependency
bun update              # Update all dependencies
```

### Development
```bash
bun start               # Start application
bun run dev            # Development mode
bun test               # Run tests
bun run build          # Build packages
bun run lint           # Lint and format
```

### Monorepo
```bash
bun run build:core     # Build core package
bun run test:client    # Test client package
turbo run build        # Turbo build orchestration
lerna version          # Version management
```

### ElizaOS CLI
```bash
elizaos create         # Create project/plugin
elizaos start          # Start agent
elizaos test           # Run ElizaOS tests
elizaos env edit       # Edit environment
elizaos --help         # Show all commands
```

## Getting Help

### Documentation
- Repository README: `/README.md`
- Architecture guide: `/AGENTS.md`
- Development instructions: `/scripts/dev-instructions.md`
- Package-specific READMEs in `/packages/*/README.md`

### Community & Support
- GitHub Issues: Report bugs and feature requests
- GitHub Discussions: Community questions and ideas
- Discord: Real-time community chat
- Documentation: Official documentation site

### Debugging Resources
```bash
# Enable debug output
DEBUG=elizaos:* elizaos start

# Check logs
tail -f logs/eliza.log

# System information
elizaos --version
bun --version
node --version
```