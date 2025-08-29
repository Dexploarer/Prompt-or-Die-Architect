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
