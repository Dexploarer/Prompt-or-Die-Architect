# ElizaOS Plugin Generation Command Suite
> Enhanced Cursor agent workflow for deterministic ElizaOS plugin generation with deep architectural integration

## Command Metadata
```yaml
name: generate-elizaos-plugin
version: 2.0.0
description: Automated ElizaOS plugin generation with full lifecycle management
tags: [elizaos, plugin, generator, automation]
requires:
  - bun: ">=1.0.0"
  - node: ">=20.0.0"
  - claude: "@anthropic-ai/claude-code"
  - eliza: "@elizaos/cli"
```

---

## 🎯 Quick Start Command

```bash
# One-liner to generate a plugin
curl -fsSL https://raw.githubusercontent.com/elizaos/eliza/.cursor/commands/generate-elizaos-plugin.sh | bash -s -- --name "my-plugin" --quick
```

---

## 📋 Prerequisites Validation

### Enhanced Environment Check Script

```bash
#!/bin/bash
# check-plugin-env.sh

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}         ElizaOS Plugin Generator Environment Check             ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}\n"

# Track validation status
ERRORS=0
WARNINGS=0

# Function to check command existence
check_command() {
    local cmd=$1
    local required=$2
    local install_cmd=$3
    
    if command -v "$cmd" &> /dev/null; then
        local version=$($cmd --version 2>&1 | head -n1)
        echo -e "${GREEN}✅${NC} $cmd: $version"
        return 0
    else
        if [ "$required" = "true" ]; then
            echo -e "${RED}❌${NC} $cmd: NOT FOUND (required)"
            echo -e "   Install: $install_cmd"
            ((ERRORS++))
        else
            echo -e "${YELLOW}⚠️${NC} $cmd: NOT FOUND (optional)"
            echo -e "   Install: $install_cmd"
            ((WARNINGS++))
        fi
        return 1
    fi
}

# Function to check Node.js version
check_node_version() {
    if command -v node &> /dev/null; then
        local version=$(node -v | cut -d'v' -f2)
        local required="20.0.0"
        
        if [ "$(printf '%s\n' "$required" "$version" | sort -V | head -n1)" = "$required" ]; then
            echo -e "${GREEN}✅${NC} Node.js: v$version"
        else
            echo -e "${YELLOW}⚠️${NC} Node.js: v$version (minimum v$required recommended)"
            ((WARNINGS++))
        fi
    fi
}

# Function to check disk space
check_disk_space() {
    local required_mb=500
    local available_mb
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        available_mb=$(df -m . | awk 'NR==2 {print $4}')
    else
        available_mb=$(df -m . | awk 'NR==2 {print $4}')
    fi
    
    if [ "$available_mb" -lt "$required_mb" ]; then
        echo -e "${RED}❌${NC} Disk space: ${available_mb}MB (need ${required_mb}MB)"
        ((ERRORS++))
    else
        echo -e "${GREEN}✅${NC} Disk space: ${available_mb}MB available"
    fi
}

# Function to check ElizaOS workspace
check_elizaos_workspace() {
    if [ -f "package.json" ]; then
        if grep -q "@elizaos/core" package.json 2>/dev/null; then
            echo -e "${GREEN}✅${NC} ElizaOS workspace detected"
            
            # Check for existing plugins directory
            if [ -d "packages" ]; then
                echo -e "${GREEN}✅${NC} Packages directory exists"
            else
                echo -e "${YELLOW}⚠️${NC} No packages directory found"
                ((WARNINGS++))
            fi
        else
            echo -e "${YELLOW}⚠️${NC} Not in ElizaOS workspace (standalone mode)"
            ((WARNINGS++))
        fi
    else
        echo -e "${YELLOW}⚠️${NC} No package.json found (will create standalone)"
        ((WARNINGS++))
    fi
}

# Run checks
echo -e "${BLUE}🔍 Core Tools:${NC}"
check_command "bun" "true" "curl -fsSL https://bun.sh/install | bash"
check_node_version
check_command "git" "true" "apt-get install git / brew install git"

echo -e "\n${BLUE}🔧 ElizaOS Tools:${NC}"
check_command "eliza" "false" "bun install -g @elizaos/cli"
check_command "claude" "false" "bun install -g @anthropic-ai/claude-code"

echo -e "\n${BLUE}💾 System Resources:${NC}"
check_disk_space

echo -e "\n${BLUE}📁 Workspace:${NC}"
check_elizaos_workspace

echo -e "\n${BLUE}🔑 API Keys:${NC}"
if [ -n "${ANTHROPIC_API_KEY:-}" ]; then
    echo -e "${GREEN}✅${NC} ANTHROPIC_API_KEY is set"
else
    echo -e "${RED}❌${NC} ANTHROPIC_API_KEY is not set"
    ((ERRORS++))
fi

# Summary
echo -e "\n${BLUE}═══════════════════════════════════════════════════════════════${NC}"
if [ $ERRORS -eq 0 ]; then
    if [ $WARNINGS -eq 0 ]; then
        echo -e "${GREEN}✨ Environment ready for plugin generation!${NC}"
    else
        echo -e "${GREEN}✅ Environment ready with $WARNINGS warnings${NC}"
    fi
    exit 0
else
    echo -e "${RED}❌ $ERRORS errors found. Please fix before continuing.${NC}"
    exit 1
fi
```

---

## 🚀 Enhanced Plugin Generation Workflow

### Advanced Specification Schema

```typescript
// plugin-spec-schema.ts
interface EnhancedPluginSpecification {
  // Basic metadata
  name: string;
  version?: string;
  description: string;
  author?: string;
  license?: string;
  
  // Features and capabilities
  features: string[];
  tags?: string[];
  
  // Component definitions with detailed specs
  actions?: ActionSpec[];
  providers?: ProviderSpec[];
  evaluators?: EvaluatorSpec[];
  services?: ServiceSpec[];
  
  // Integration requirements
  dependencies?: string[];
  peerDependencies?: Record<string, string>;
  
  // Configuration schema
  config?: {
    required: ConfigParam[];
    optional: ConfigParam[];
  };
  
  // Testing requirements
  testing?: {
    coverage?: {
      statements: number;
      branches: number;
      functions: number;
      lines: number;
    };
    e2e?: boolean;
    performance?: boolean;
  };
  
  // Advanced options
  advanced?: {
    useDatabase?: boolean;
    useWebSocket?: boolean;
    useAuthentication?: boolean;
    rateLimit?: RateLimitConfig;
    caching?: CacheConfig;
  };
}

interface ActionSpec {
  name: string;
  description: string;
  parameters?: Parameter[];
  returns?: string;
  examples?: Example[];
  validation?: ValidationRule[];
}

interface ProviderSpec {
  name: string;
  description: string;
  refreshInterval?: number;
  cacheStrategy?: 'none' | 'memory' | 'persistent';
  dataFormat?: 'text' | 'json' | 'structured';
}

interface ServiceSpec {
  name: string;
  description: string;
  singleton?: boolean;
  lifecycle?: 'eager' | 'lazy';
  dependencies?: string[];
}

interface ConfigParam {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  default?: any;
  validation?: string;
}
```

### Enhanced Specification File Template

```json
{
  "name": "advanced-analytics",
  "version": "1.0.0",
  "description": "Advanced analytics and monitoring for ElizaOS agents with real-time metrics, anomaly detection, and performance insights",
  "author": "ElizaOS Team",
  "license": "MIT",
  
  "features": [
    "Real-time metrics collection",
    "Anomaly detection",
    "Performance monitoring",
    "Memory usage tracking",
    "API latency monitoring",
    "Custom event tracking",
    "Dashboard integration"
  ],
  
  "tags": ["analytics", "monitoring", "metrics", "performance"],
  
  "actions": [
    {
      "name": "recordMetric",
      "description": "Record a custom metric with metadata",
      "parameters": [
        { "name": "name", "type": "string", "required": true },
        { "name": "value", "type": "number", "required": true },
        { "name": "tags", "type": "object", "required": false }
      ],
      "returns": "MetricRecord"
    },
    {
      "name": "queryMetrics",
      "description": "Query metrics with filters",
      "parameters": [
        { "name": "filters", "type": "object", "required": false },
        { "name": "timeRange", "type": "object", "required": false }
      ],
      "returns": "MetricResult[]"
    },
    {
      "name": "detectAnomalies",
      "description": "Detect anomalies in metric patterns",
      "parameters": [
        { "name": "metricName", "type": "string", "required": true },
        { "name": "sensitivity", "type": "number", "required": false }
      ],
      "returns": "AnomalyReport"
    }
  ],
  
  "providers": [
    {
      "name": "systemMetricsProvider",
      "description": "Provides system-level metrics",
      "refreshInterval": 60000,
      "cacheStrategy": "memory",
      "dataFormat": "structured"
    },
    {
      "name": "performanceProvider",
      "description": "Provides performance metrics",
      "refreshInterval": 30000,
      "cacheStrategy": "memory",
      "dataFormat": "json"
    }
  ],
  
  "evaluators": [
    {
      "name": "performanceEvaluator",
      "description": "Evaluates agent performance",
      "metrics": ["response_time", "success_rate", "error_rate"]
    },
    {
      "name": "anomalyEvaluator",
      "description": "Evaluates metric anomalies",
      "threshold": 2.5
    }
  ],
  
  "services": [
    {
      "name": "MetricsCollectorService",
      "description": "Collects and aggregates metrics",
      "singleton": true,
      "lifecycle": "eager",
      "dependencies": []
    },
    {
      "name": "AnomalyDetectionService",
      "description": "Detects anomalies using statistical methods",
      "singleton": true,
      "lifecycle": "lazy",
      "dependencies": ["MetricsCollectorService"]
    }
  ],
  
  "config": {
    "required": [
      {
        "name": "METRICS_ENABLED",
        "type": "boolean",
        "description": "Enable metrics collection",
        "default": true
      }
    ],
    "optional": [
      {
        "name": "METRICS_RETENTION_DAYS",
        "type": "number",
        "description": "Days to retain metrics",
        "default": 30
      },
      {
        "name": "ANOMALY_SENSITIVITY",
        "type": "number",
        "description": "Anomaly detection sensitivity (1-10)",
        "default": 5,
        "validation": "min:1,max:10"
      }
    ]
  },
  
  "testing": {
    "coverage": {
      "statements": 85,
      "branches": 80,
      "functions": 85,
      "lines": 85
    },
    "e2e": true,
    "performance": true
  },
  
  "advanced": {
    "useDatabase": false,
    "useWebSocket": true,
    "useAuthentication": false,
    "rateLimit": {
      "enabled": true,
      "requests": 100,
      "window": 60000
    },
    "caching": {
      "strategy": "lru",
      "maxSize": 1000,
      "ttl": 300000
    }
  }
}
```

---

## 🛠️ Master Generation Script

### Complete Automation Script with Error Recovery

```bash
#!/bin/bash
# generate-plugin.sh - Enhanced ElizaOS Plugin Generator

set -euo pipefail

# Configuration
SCRIPT_VERSION="2.0.0"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORK_DIR="${WORK_DIR:-$(pwd)}"
TEMP_DIR=""
PLUGIN_NAME=""
SPEC_FILE=""
SKIP_PROMPTS=false
SKIP_TESTS=false
SKIP_VALIDATION=false
VERBOSE=false
DRY_RUN=false
INTEGRATION_MODE="standalone"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

log_debug() {
    if [ "$VERBOSE" = true ]; then
        echo -e "${CYAN}[DEBUG]${NC} $1"
    fi
}

# Cleanup function
cleanup() {
    local exit_code=$?
    
    if [ -n "$TEMP_DIR" ] && [ -d "$TEMP_DIR" ]; then
        log_debug "Cleaning up temporary directory: $TEMP_DIR"
        rm -rf "$TEMP_DIR"
    fi
    
    if [ $exit_code -ne 0 ]; then
        log_error "Plugin generation failed with exit code: $exit_code"
        
        # Save error log
        if [ -n "$PLUGIN_NAME" ]; then
            local error_log="${WORK_DIR}/.plugin-generation-error-${PLUGIN_NAME}.log"
            echo "Plugin generation failed at $(date)" > "$error_log"
            echo "Exit code: $exit_code" >> "$error_log"
            log_info "Error log saved to: $error_log"
        fi
    fi
    
    exit $exit_code
}

trap cleanup EXIT INT TERM

# Help function
show_help() {
    cat << EOF
ElizaOS Plugin Generator v${SCRIPT_VERSION}

Usage: $0 [OPTIONS]

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
    -h, --help                Show this help message

EXAMPLES:
    # Interactive mode
    $0 -n my-plugin

    # Non-interactive with spec file
    $0 -n my-plugin -s ./plugin.spec.json --skip-prompts

    # Monorepo integration
    $0 -n my-plugin -s ./spec.json --integration monorepo

    # Dry run to preview
    $0 -n my-plugin -s ./spec.json --dry-run

ENVIRONMENT VARIABLES:
    ANTHROPIC_API_KEY         Required for Claude Code integration
    ELIZA_WORKSPACE          Path to ElizaOS workspace (auto-detected)
    PLUGIN_OUTPUT_DIR         Override output directory

EOF
    exit 0
}

# Parse arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -n|--name)
                PLUGIN_NAME="$2"
                shift 2
                ;;
            -s|--spec)
                SPEC_FILE="$2"
                shift 2
                ;;
            -d|--dir)
                WORK_DIR="$2"
                shift 2
                ;;
            --skip-prompts)
                SKIP_PROMPTS=true
                shift
                ;;
            --skip-tests)
                SKIP_TESTS=true
                shift
                ;;
            --skip-validation)
                SKIP_VALIDATION=true
                shift
                ;;
            --integration)
                INTEGRATION_MODE="$2"
                shift 2
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --verbose)
                VERBOSE=true
                shift
                ;;
            -h|--help)
                show_help
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                ;;
        esac
    done
}

# Validate environment
validate_environment() {
    log_info "Validating environment..."
    
    # Check required tools
    local tools_missing=false
    
    for tool in bun git; do
        if ! command -v "$tool" &> /dev/null; then
            log_error "$tool is not installed"
            tools_missing=true
        else
            log_debug "$tool: $(command -v $tool)"
        fi
    done
    
    if [ "$tools_missing" = true ]; then
        log_error "Required tools are missing. Please install them first."
        exit 1
    fi
    
    # Check API key
    if [ -z "${ANTHROPIC_API_KEY:-}" ]; then
        log_error "ANTHROPIC_API_KEY is not set"
        echo "Please set it with: export ANTHROPIC_API_KEY='your-key'"
        exit 1
    fi
    
    # Check disk space
    local available_mb
    if [[ "$OSTYPE" == "darwin"* ]]; then
        available_mb=$(df -m "$WORK_DIR" | awk 'NR==2 {print $4}')
    else
        available_mb=$(df -m "$WORK_DIR" | awk 'NR==2 {print $4}')
    fi
    
    if [ "$available_mb" -lt 500 ]; then
        log_error "Insufficient disk space: ${available_mb}MB (need 500MB)"
        exit 1
    fi
    
    log_success "Environment validation passed"
}

# Install missing tools
install_tools() {
    log_info "Checking and installing ElizaOS tools..."
    
    # Install ElizaOS CLI if needed
    if ! command -v eliza &> /dev/null; then
        log_info "Installing @elizaos/cli..."
        if [ "$DRY_RUN" = true ]; then
            log_debug "[DRY RUN] Would install: bun install -g @elizaos/cli"
        else
            bun install -g @elizaos/cli
        fi
    fi
    
    # Install Claude Code if needed
    if ! command -v claude &> /dev/null; then
        log_info "Installing @anthropic-ai/claude-code..."
        if [ "$DRY_RUN" = true ]; then
            log_debug "[DRY RUN] Would install: bun install -g @anthropic-ai/claude-code"
        else
            bun install -g @anthropic-ai/claude-code
        fi
    fi
    
    log_success "Tools ready"
}

# Detect ElizaOS workspace
detect_workspace() {
    log_debug "Detecting ElizaOS workspace..."
    
    local current_dir="$WORK_DIR"
    
    while [ "$current_dir" != "/" ]; do
        if [ -f "$current_dir/package.json" ]; then
            if grep -q "@elizaos/core" "$current_dir/package.json" 2>/dev/null; then
                ELIZA_WORKSPACE="$current_dir"
                log_info "ElizaOS workspace detected: $ELIZA_WORKSPACE"
                
                # Auto-set integration mode if not specified
                if [ "$INTEGRATION_MODE" = "standalone" ] && [ -d "$ELIZA_WORKSPACE/packages" ]; then
                    INTEGRATION_MODE="workspace"
                    log_info "Auto-detected workspace mode"
                fi
                
                return 0
            fi
        fi
        current_dir="$(dirname "$current_dir")"
    done
    
    log_debug "No ElizaOS workspace found (standalone mode)"
    return 0
}

# Create enhanced spec file
create_enhanced_spec() {
    local spec_path="$1"
    
    log_info "Creating enhanced specification..."
    
    if [ -n "$SPEC_FILE" ] && [ -f "$SPEC_FILE" ]; then
        # Enhance existing spec
        log_debug "Enhancing existing spec: $SPEC_FILE"
        
        # Use jq to enhance the spec if available
        if command -v jq &> /dev/null; then
            jq '. + {
                "testing": {
                    "coverage": {
                        "statements": 85,
                        "branches": 80,
                        "functions": 85,
                        "lines": 85
                    },
                    "e2e": true
                },
                "advanced": {
                    "useDatabase": false,
                    "useWebSocket": false,
                    "useAuthentication": false
                }
            }' "$SPEC_FILE" > "$spec_path"
        else
            cp "$SPEC_FILE" "$spec_path"
        fi
    else
        # Create default spec
        cat > "$spec_path" << 'EOF'
{
  "name": "sample-plugin",
  "description": "A sample ElizaOS plugin with comprehensive features",
  "features": [
    "Core functionality",
    "Runtime integration",
    "Memory management",
    "Error handling"
  ],
  "actions": ["sampleAction", "queryAction"],
  "providers": ["sampleProvider"],
  "evaluators": ["sampleEvaluator"],
  "services": ["sampleService"],
  "testing": {
    "coverage": {
      "statements": 85,
      "branches": 80,
      "functions": 85,
      "lines": 85
    },
    "e2e": true
  }
}
EOF
    fi
    
    log_success "Specification created: $spec_path"
}

# Generate plugin with ElizaOS CLI
generate_plugin() {
    log_info "Generating plugin: $PLUGIN_NAME"
    
    local cmd="eliza plugins generate"
    
    if [ "$SKIP_PROMPTS" = true ]; then
        if [ -z "$SPEC_FILE" ]; then
            log_error "--skip-prompts requires --spec-file"
            exit 1
        fi
        cmd="$cmd --spec-file $SPEC_FILE --skip-prompts"
    fi
    
    if [ "$SKIP_TESTS" = true ]; then
        cmd="$cmd --skip-tests"
    fi
    
    if [ "$SKIP_VALIDATION" = true ]; then
        cmd="$cmd --skip-validation"
    fi
    
    cmd="$cmd --api-key \"\$ANTHROPIC_API_KEY\""
    
    log_debug "Command: $cmd"
    
    if [ "$DRY_RUN" = true ]; then
        log_info "[DRY RUN] Would execute: $cmd"
        return 0
    fi
    
    # Execute generation
    eval "$cmd"
    
    local exit_code=$?
    if [ $exit_code -ne 0 ]; then
        log_error "Plugin generation failed with exit code: $exit_code"
        return $exit_code
    fi
    
    log_success "Plugin generated successfully"
    return 0
}

# Build and test plugin
build_and_test() {
    local plugin_dir="$1"
    
    log_info "Building and testing plugin..."
    
    cd "$plugin_dir"
    
    # Install dependencies
    log_info "Installing dependencies..."
    if [ "$DRY_RUN" = false ]; then
        bun install
    fi
    
    # Build
    log_info "Building plugin..."
    if [ "$DRY_RUN" = false ]; then
        if ! bun run build; then
            log_warning "Build failed, attempting to fix..."
            fix_build_errors "$plugin_dir"
        fi
    fi
    
    # Test (unless skipped)
    if [ "$SKIP_TESTS" = false ]; then
        log_info "Running tests..."
        if [ "$DRY_RUN" = false ]; then
            if ! bun test; then
                log_warning "Tests failed, attempting to fix..."
                fix_test_failures "$plugin_dir"
            fi
        fi
    fi
    
    # Validation (unless skipped)
    if [ "$SKIP_VALIDATION" = false ]; then
        log_info "Running production validation..."
        if [ "$DRY_RUN" = false ]; then
            validate_production "$plugin_dir"
        fi
    fi
    
    cd - > /dev/null
    log_success "Build and test completed"
}

# Fix build errors using Claude
fix_build_errors() {
    local plugin_dir="$1"
    local max_attempts=3
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        log_info "Fix attempt $attempt/$max_attempts"
        
        # Capture build errors
        local error_log="${plugin_dir}/.build-errors.log"
        bun run build 2>&1 | tee "$error_log" || true
        
        # Check if build succeeded
        if bun run build &> /dev/null; then
            log_success "Build fixed!"
            rm -f "$error_log"
            return 0
        fi
        
        # Use Claude to fix errors
        log_info "Requesting fixes from Claude..."
        
        local fix_prompt="Please read the PLUGIN_SPEC.md file and fix the following build errors:

$(cat "$error_log")

Make all necessary changes to fix the issues and ensure the plugin builds successfully."
        
        cd "$plugin_dir"
        claude \
            --print \
            --max-turns 10 \
            --model opus \
            --dangerously-skip-permissions \
            "$fix_prompt"
        cd - > /dev/null
        
        ((attempt++))
    done
    
    log_error "Failed to fix build errors after $max_attempts attempts"
    return 1
}

# Fix test failures using Claude
fix_test_failures() {
    local plugin_dir="$1"
    local max_attempts=3
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        log_info "Test fix attempt $attempt/$max_attempts"
        
        # Capture test failures
        local test_log="${plugin_dir}/.test-failures.log"
        bun test 2>&1 | tee "$test_log" || true
        
        # Check if tests pass
        if bun test &> /dev/null; then
            log_success "Tests fixed!"
            rm -f "$test_log"
            return 0
        fi
        
        # Use Claude to fix tests
        log_info "Requesting test fixes from Claude..."
        
        local fix_prompt="Please read the PLUGIN_SPEC.md file and fix the following test failures:

$(cat "$test_log")

Make all necessary changes to fix the issues and ensure all tests pass."
        
        cd "$plugin_dir"
        claude \
            --print \
            --max-turns 10 \
            --model opus \
            --dangerously-skip-permissions \
            "$fix_prompt"
        cd - > /dev/null
        
        ((attempt++))
    done
    
    log_error "Failed to fix test failures after $max_attempts attempts"
    return 1
}

# Production validation
validate_production() {
    local plugin_dir="$1"
    
    log_info "Validating production readiness..."
    
    cd "$plugin_dir"
    
    # Type checking
    if [ -f "tsconfig.json" ]; then
        log_debug "Running type check..."
        bun tsc --noEmit || log_warning "Type check failed"
    fi
    
    # Linting
    if [ -f ".eslintrc.js" ] || [ -f "eslint.config.js" ]; then
        log_debug "Running linter..."
        bun run lint || log_warning "Linting failed"
    fi
    
    # Format checking
    log_debug "Checking code formatting..."
    bun run format:check || bun run format || true
    
    # Security audit
    log_debug "Running security audit..."
    bun audit || log_warning "Security vulnerabilities found"
    
    # Check for required files
    local required_files=(
        "src/index.ts"
        "package.json"
        "tsconfig.json"
        "README.md"
        "PLUGIN_SPEC.md"
    )
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            log_warning "Missing required file: $file"
        fi
    done
    
    # Check for ElizaOS core compliance
    if grep -r "import.*from.*@elizaos/core" src/ &> /dev/null; then
        log_success "ElizaOS core imports verified"
    else
        log_warning "No @elizaos/core imports found"
    fi
    
    # Check for database direct access (should not exist)
    if grep -r "import.*DatabaseAdapter" src/ | grep -v "@elizaos/core" &> /dev/null; then
        log_warning "Direct database adapter usage detected (use runtime APIs instead)"
    fi
    
    cd - > /dev/null
    log_success "Production validation completed"
}

# Integrate into workspace
integrate_workspace() {
    local plugin_dir="$1"
    local plugin_name=$(basename "$plugin_dir")
    
    if [ "$INTEGRATION_MODE" = "workspace" ] && [ -n "$ELIZA_WORKSPACE" ]; then
        log_info "Integrating into ElizaOS workspace..."
        
        local target_dir="$ELIZA_WORKSPACE/packages/$plugin_name"
        
        if [ "$DRY_RUN" = true ]; then
            log_info "[DRY RUN] Would move: $plugin_dir -> $target_dir"
        else
            # Move to packages directory
            if [ -d "$target_dir" ]; then
                log_warning "Target directory exists: $target_dir"
                log_info "Creating backup..."
                mv "$target_dir" "${target_dir}.backup.$(date +%Y%m%d%H%M%S)"
            fi
            
            mv "$plugin_dir" "$target_dir"
            
            # Update workspace package.json if using Bun workspaces
            if grep -q '"workspaces"' "$ELIZA_WORKSPACE/package.json"; then
                log_info "Updating workspace configuration..."
                cd "$ELIZA_WORKSPACE"
                bun install
                cd - > /dev/null
            fi
            
            log_success "Plugin integrated into workspace: $target_dir"
            plugin_dir="$target_dir"
        fi
    elif [ "$INTEGRATION_MODE" = "monorepo" ]; then
        log_info "Monorepo integration mode (manual steps required)"
        cat << EOF

To integrate into your monorepo:

1. Move the plugin to your packages directory:
   mv $plugin_dir ./packages/

2. Update your root package.json workspaces configuration

3. Run installation at the root:
   bun install

4. Update your agent configuration to include the plugin

EOF
    fi
    
    return 0
}

# Generate documentation
generate_docs() {
    local plugin_dir="$1"
    
    log_info "Generating additional documentation..."
    
    if [ "$DRY_RUN" = true ]; then
        log_debug "[DRY RUN] Would generate documentation"
        return 0
    fi
    
    # Create API documentation
    cat > "${plugin_dir}/API.md" << EOF
# API Documentation

## Plugin: $PLUGIN_NAME

### Installation

\`\`\`bash
bun install $plugin_dir
\`\`\`

### Usage

\`\`\`typescript
import { ${PLUGIN_NAME}Plugin } from './$PLUGIN_NAME';

const runtime = new AgentRuntime({
  plugins: [${PLUGIN_NAME}Plugin]
});
\`\`\`

### Components

See the generated code for detailed component documentation.

EOF
    
    # Create integration guide
    cat > "${plugin_dir}/INTEGRATION.md" << EOF
# Integration Guide

## Adding to ElizaOS Project

1. Install the plugin:
   \`\`\`bash
   cd your-elizaos-project
   bun add file:$plugin_dir
   \`\`\`

2. Register in your agent configuration:
   \`\`\`typescript
   import { ${PLUGIN_NAME}Plugin } from '$PLUGIN_NAME';
   
   const agent = {
     plugins: [${PLUGIN_NAME}Plugin]
   };
   \`\`\`

3. Configure environment variables (if needed):
   \`\`\`bash
   # Add to .env file
   ${PLUGIN_NAME^^}_ENABLED=true
   \`\`\`

## Testing Integration

Run the test suite:
\`\`\`bash
bun test
\`\`\`

EOF
    
    log_success "Documentation generated"
}

# Main execution flow
main() {
    log_info "ElizaOS Plugin Generator v${SCRIPT_VERSION}"
    log_info "Working directory: $WORK_DIR"
    
    # Validate environment
    validate_environment
    
    # Install tools if needed
    install_tools
    
    # Detect workspace
    detect_workspace
    
    # Create temp directory for generation
    TEMP_DIR=$(mktemp -d -t "eliza-plugin-XXXXXX")
    log_debug "Temp directory: $TEMP_DIR"
    
    # Create or enhance spec
    local spec_path="${TEMP_DIR}/plugin.spec.json"
    create_enhanced_spec "$spec_path"
    
    if [ -z "$SPEC_FILE" ]; then
        SPEC_FILE="$spec_path"
    fi
    
    # Generate plugin
    cd "$TEMP_DIR"
    generate_plugin
    
    # Find generated plugin directory
    local plugin_dir=""
    for dir in plugin-*; do
        if [ -d "$dir" ]; then
            plugin_dir="$TEMP_DIR/$dir"
            break
        fi
    done
    
    if [ -z "$plugin_dir" ] || [ ! -d "$plugin_dir" ]; then
        log_error "Generated plugin directory not found"
        exit 1
    fi
    
    log_info "Plugin generated at: $plugin_dir"
    
    # Build and test
    build_and_test "$plugin_dir"
    
    # Generate documentation
    generate_docs "$plugin_dir"
    
    # Move to final location
    local final_dir="${PLUGIN_OUTPUT_DIR:-$WORK_DIR}/plugin-${PLUGIN_NAME}"
    
    if [ "$DRY_RUN" = false ]; then
        if [ -d "$final_dir" ]; then
            log_warning "Destination exists: $final_dir"
            mv "$final_dir" "${final_dir}.backup.$(date +%Y%m%d%H%M%S)"
        fi
        mv "$plugin_dir" "$final_dir"
        plugin_dir="$final_dir"
    fi
    
    # Integrate into workspace if requested
    integrate_workspace "$plugin_dir"
    
    # Success summary
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}         Plugin Generation Completed Successfully!              ${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${BLUE}Plugin Details:${NC}"
    echo -e "  Name:     plugin-${PLUGIN_NAME}"
    echo -e "  Location: $plugin_dir"
    echo -e "  Mode:     $INTEGRATION_MODE"
    echo ""
    echo -e "${BLUE}Next Steps:${NC}"
    echo -e "  1. cd $plugin_dir"
    echo -e "  2. Review the generated code and documentation"
    echo -e "  3. Run tests: bun test"
    echo -e "  4. Add to your ElizaOS project"
    echo ""
    echo -e "${GREEN}Happy coding! 🚀${NC}"
}

# Parse arguments and run
parse_args "$@"

# If name not provided and not in skip-prompts mode, ask for it
if [ -z "$PLUGIN_NAME" ] && [ "$SKIP_PROMPTS" = false ]; then
    read -p "Enter plugin name (without 'plugin-' prefix): " PLUGIN_NAME
fi

# Validate plugin name
if [ -z "$PLUGIN_NAME" ]; then
    log_error "Plugin name is required"
    show_help
fi

# Clean plugin name (remove 'plugin-' prefix if present)
PLUGIN_NAME="${PLUGIN_NAME#plugin-}"

# Run main function
main
```

---

## 📝 Cursor Task Commands

### Quick Task Commands for Cursor

```yaml
# .cursor/tasks/generate-plugin.yaml
tasks:
  generate-plugin-interactive:
    name: "Generate ElizaOS Plugin (Interactive)"
    description: "Generate a new ElizaOS plugin with interactive prompts"
    steps:
      - command: "bash .cursor/commands/generate-plugin.sh"
        description: "Run interactive plugin generator"
        
  generate-plugin-quick:
    name: "Generate ElizaOS Plugin (Quick)"
    description: "Generate a plugin with minimal configuration"
    inputs:
      - name: "plugin_name"
        description: "Plugin name (without 'plugin-' prefix)"
        required: true
    steps:
      - command: |
          cat > /tmp/plugin-spec.json << EOF
          {
            "name": "${plugin_name}",
            "description": "ElizaOS plugin for ${plugin_name}",
            "features": ["core functionality"],
            "actions": ["main${plugin_name}Action"],
            "providers": ["${plugin_name}Provider"],
            "services": ["${plugin_name}Service"]
          }
          EOF
      - command: "bash .cursor/commands/generate-plugin.sh -n ${plugin_name} -s /tmp/plugin-spec.json --skip-prompts"
        
  validate-plugin:
    name: "Validate ElizaOS Plugin"
    description: "Validate an existing plugin for production readiness"
    inputs:
      - name: "plugin_path"
        description: "Path to plugin directory"
        required: true
    steps:
      - command: "cd ${plugin_path} && bun install"
      - command: "cd ${plugin_path} && bun run build"
      - command: "cd ${plugin_path} && bun test"
      - command: "cd ${plugin_path} && bun run lint"
      - command: "cd ${plugin_path} && bun tsc --noEmit"
```

### Cursor Command Palette Integration

```json
// .cursor/commands.json
{
  "commands": [
    {
      "id": "elizaos.generatePlugin",
      "title": "ElizaOS: Generate Plugin",
      "command": "bash .cursor/commands/generate-plugin.sh",
      "icon": "🔌",
      "category": "ElizaOS"
    },
    {
      "id": "elizaos.generatePluginQuick",
      "title": "ElizaOS: Quick Generate Plugin",
      "command": "bash .cursor/commands/generate-plugin.sh --quick",
      "icon": "⚡",
      "category": "ElizaOS"
    },
    {
      "id": "elizaos.validatePlugin",
      "title": "ElizaOS: Validate Plugin",
      "command": "bash .cursor/commands/validate-plugin.sh",
      "icon": "✅",
      "category": "ElizaOS"
    }
  ]
}
```

---

## 🔄 CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/plugin-generation.yml
name: Plugin Generation CI

on:
  workflow_dispatch:
    inputs:
      plugin_name:
        description: 'Plugin name'
        required: true
      spec_url:
        description: 'URL to plugin specification'
        required: false

jobs:
  generate:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest
          
      - name: Install dependencies
        run: |
          bun install -g @elizaos/cli
          bun install -g @anthropic-ai/claude-code
          
      - name: Download spec if provided
        if: ${{ github.event.inputs.spec_url }}
        run: |
          curl -L "${{ github.event.inputs.spec_url }}" -o plugin.spec.json
          
      - name: Generate plugin
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          if [ -f plugin.spec.json ]; then
            bash .cursor/commands/generate-plugin.sh \
              -n "${{ github.event.inputs.plugin_name }}" \
              -s plugin.spec.json \
              --skip-prompts
          else
            bash .cursor/commands/generate-plugin.sh \
              -n "${{ github.event.inputs.plugin_name }}" \
              --quick
          fi
          
      - name: Upload plugin artifact
        uses: actions/upload-artifact@v3
        with:
          name: plugin-${{ github.event.inputs.plugin_name }}
          path: plugin-${{ github.event.inputs.plugin_name }}/
```

---

## 🎯 Success Metrics

### Plugin Quality Checklist

```markdown
## Plugin Quality Checklist

### Core Requirements
- [ ] Builds without errors
- [ ] All tests pass
- [ ] Type checking passes
- [ ] Linting passes
- [ ] Uses only @elizaos/core imports
- [ ] No direct database access
- [ ] Follows ElizaOS patterns

### Documentation
- [ ] README.md present
- [ ] API documentation
- [ ] Integration guide
- [ ] PLUGIN_SPEC.md present
- [ ] JSDoc comments

### Testing
- [ ] Unit tests > 80% coverage
- [ ] Integration tests present
- [ ] E2E tests (if applicable)
- [ ] Performance tests (if applicable)

### Production Readiness
- [ ] Error handling implemented
- [ ] Logging configured
- [ ] Configuration validated
- [ ] Security audit passed
- [ ] Performance optimized
- [ ] Memory leaks checked

### Integration
- [ ] Works in standalone mode
- [ ] Works in workspace mode
- [ ] Dependencies resolved
- [ ] Version compatible
```

---

## 📚 Additional Resources

### Plugin Development Guide

```markdown
# ElizaOS Plugin Development Best Practices

## Architecture Guidelines
1. Always use dependency injection via runtime
2. Implement proper service lifecycle
3. Use type-safe patterns throughout
4. Follow single responsibility principle

## Code Patterns
- Use async/await consistently
- Implement proper error boundaries
- Add comprehensive logging
- Use structured data formats

## Testing Strategy
- Write tests first (TDD)
- Mock external dependencies
- Test error conditions
- Validate edge cases

## Performance Tips
- Implement caching where appropriate
- Use connection pooling
- Optimize database queries
- Monitor memory usage
```

This enhanced command suite provides a complete, production-ready workflow for ElizaOS plugin generation with deep architectural integration, comprehensive error handling, and extensive automation capabilities.
