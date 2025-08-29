# ElizaOS Plugin Generator Scripts

This directory contains enhanced scripts for generating ElizaOS plugins with full architectural compliance and automated workflows.

## 📁 Files

- **`generate-plugin.sh`** - Main plugin generation script
- **`check-plugin-env.sh`** - Environment validation script  
- **`plugin-spec-example.json`** - Example plugin specification
- **`generate-elizaos-plugin.md`** - Comprehensive documentation

## 🚀 Quick Start

### 1. Check Environment

First, verify your environment is ready:

```bash
bash .cursor/commands/check-plugin-env.sh
```

### 2. Set API Key

Export your Anthropic API key:

```bash
export ANTHROPIC_API_KEY='your-api-key-here'
```

### 3. Generate Plugin

#### Interactive Mode (easiest):
```bash
bash .cursor/commands/generate-plugin.sh
```

#### With Specification File:
```bash
bash .cursor/commands/generate-plugin.sh \
  -n "my-plugin" \
  -s .cursor/commands/plugin-spec-example.json \
  --skip-prompts
```

#### Quick Mode (minimal config):
```bash
bash .cursor/commands/generate-plugin.sh \
  -n "my-plugin" \
  --skip-prompts
```

## 📋 Command Options

```
OPTIONS:
    -n, --name NAME           Plugin name (without 'plugin-' prefix)
    -s, --spec FILE           Path to specification file
    -d, --dir DIR             Working directory (default: current)
    --skip-prompts            Skip interactive prompts (requires --spec)
    --skip-tests              Skip test execution
    --skip-validation         Skip production validation
    --integration MODE        Integration mode: standalone|monorepo|workspace
    --dry-run                 Show what would be done without executing
    --verbose                 Enable verbose output
    -h, --help                Show help message
```

## 📝 Examples

### Example 1: Generate Analytics Plugin

```bash
# Copy and modify the example spec
cp .cursor/commands/plugin-spec-example.json my-analytics-spec.json
# Edit my-analytics-spec.json as needed

# Generate the plugin
bash .cursor/commands/generate-plugin.sh \
  -n "analytics" \
  -s my-analytics-spec.json \
  --skip-prompts
```

### Example 2: Workspace Integration

If you're in an ElizaOS workspace with a `packages/` directory:

```bash
bash .cursor/commands/generate-plugin.sh \
  -n "my-feature" \
  --integration workspace
```

### Example 3: Dry Run Preview

See what would happen without actually generating:

```bash
bash .cursor/commands/generate-plugin.sh \
  -n "test-plugin" \
  -s plugin-spec.json \
  --dry-run \
  --verbose
```

## 🔧 Troubleshooting

### Missing Tools

If the environment check shows missing tools:

```bash
# Install Bun
curl -fsSL https://bun.sh/install | bash

# Install ElizaOS CLI
bun install -g @elizaos/cli

# Install Claude Code
bun install -g @anthropic-ai/claude-code
```

### API Key Issues

Ensure your API key is exported:

```bash
echo $ANTHROPIC_API_KEY  # Should show your key (or use: echo ${ANTHROPIC_API_KEY:0:10}... for security)
```

### Build/Test Failures

The script automatically attempts to fix build and test failures using Claude. If it fails after 3 attempts, check:

1. The error logs in `.plugin-generation-error-*.log`
2. The build errors in the plugin's `.build-errors.log`
3. The test failures in the plugin's `.test-failures.log`

## 🏗️ Plugin Structure

Generated plugins will have this structure:

```
plugin-{name}/
├── src/
│   ├── index.ts           # Main plugin export
│   ├── actions/           # Action implementations
│   ├── providers/         # Provider implementations
│   ├── evaluators/        # Evaluator implementations
│   └── services/          # Service implementations
├── __tests__/             # Test files
├── package.json           # Package configuration
├── tsconfig.json          # TypeScript configuration
├── README.md              # Plugin documentation
├── API.md                 # API documentation
├── INTEGRATION.md         # Integration guide
└── PLUGIN_SPEC.md         # Generated specification
```

## 🎯 Features

- **Automatic Error Recovery**: Fixes build and test failures using AI
- **Workspace Detection**: Auto-detects ElizaOS monorepo structure
- **Architecture Compliance**: Ensures plugins follow ElizaOS patterns
- **Production Validation**: Type checking, linting, security audit
- **Documentation Generation**: Creates API and integration guides
- **Multiple Integration Modes**: Standalone, monorepo, or workspace

## 📚 Advanced Usage

### Custom Specification

Create your own specification based on the example:

```json
{
  "name": "my-custom-plugin",
  "description": "Description of your plugin",
  "features": ["feature1", "feature2"],
  "actions": ["action1", "action2"],
  "providers": ["provider1"],
  "services": ["service1"]
}
```

### Integration with CI/CD

Use in GitHub Actions or other CI/CD:

```yaml
- name: Generate Plugin
  env:
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
  run: |
    bash .cursor/commands/generate-plugin.sh \
      -n "${{ inputs.plugin_name }}" \
      -s "${{ inputs.spec_file }}" \
      --skip-prompts \
      --skip-validation
```

## 📖 Documentation

For complete documentation including architectural details, see:
- `generate-elizaos-plugin.md` - Comprehensive guide and workflow documentation

## 🤝 Contributing

To improve these scripts:
1. Test your changes thoroughly
2. Update this README if adding new features
3. Ensure backward compatibility
4. Add examples for new functionality

## 📄 License

These scripts are part of the ElizaOS project and follow the same license terms.
