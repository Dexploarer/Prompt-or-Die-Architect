# Prompt or Die: The Architect

AI-powered project planning and code generation platform inspired by Pre.dev and Better-T Stack.

## Features

- 🏗️ **Architecture Generator**: Turn ideas into system diagrams with React Flow + ELK layout
- ⚙️ **Stack Builder**: Interactive tech stack selection with AI recommendations  
- 📊 **Diagram Canvas**: Visual editing with tldraw overlay and PNG/SVG export
- 📝 **Plan Generator**: Comprehensive project plans like Pre.dev with sections, backlog, risks
- 🔧 **Code Scaffolding**: Generate complete project structures for multiple frameworks

## Tech Stack

- **Frontend**: Next.js 14+ with TypeScript, Tailwind CSS, React Flow, tldraw
- **AI**: OpenAI GPT-4 with structured outputs (JSON mode)
- **Styling**: Glassmorphism design system
- **Tooling**: Biome (linting), Husky (git hooks), Storybook (component dev)

## Quick Start

1. Clone and install dependencies:
```bash
git clone https://github.com/Dexplorera/Prompt-or-Die-Architect.git
cd Prompt-or-Die-Architect
bun install
```

2. Set up environment:
```bash
cp env.example .env.local
# Edit .env.local with your OpenAI API key
```

3. Start development:
```bash
bun dev          # Main app (port 3000)
bun run storybook # Component dev (port 6006)
```

## Usage

### Architecture Generator
1. Visit `/` 
2. Paste your project idea
3. Click "Generate Architecture" 
4. Use "Suggest Improvements" to evolve the design
5. Export as PNG

### Stack Builder
1. Visit `/builder`
2. Describe your requirements
3. Get AI stack recommendations
4. Configure your preferred stack
5. Generate project plan and code scaffold

### Diagram Canvas
1. Visit `/diagram`
2. Create visual diagrams with React Flow
3. Use tldraw overlay for annotations
4. Export as PNG/SVG

## Supported Stacks

- **Web**: Next.js, React, Vue, Svelte, Solid
- **Backend**: Hono, FastAPI, Express, Elysia, Gin
- **Mobile**: React Native, Flutter, Ionic
- **Blockchain**: Hardhat, Anchor, Foundry
- **AI/ML**: LangChain, AutoGEN, LlamaIndex

## Prompt Examples

Try these in the Architecture Generator:

**SaaS Onboarding Flow**:
```
Create a step by step user journey for a SaaS onboarding, include auth, email verify, profile setup, paywall, dashboard, usage tracking. Label edges with actions.
```

**Multi-tenant AI Platform**:
```
Design a scalable web architecture for multi tenant AI content platform. Include Next.js web, Hono API, worker queue, Redis cache, Postgres, object storage, vector DB, analytics, feature flags.
```

**Solana Staking App**:
```
Solana app with Anchor program for staking, a webhook listener, an indexer, and a web client. Include program accounts, client SDK, RPC provider, and dashboards.
```

## Development

- **Lint**: `bun run lint`
- **Format**: `bun run format`
- **Test Stories**: `bun run storybook`
- **Build**: `bun run build`

## License

MIT
