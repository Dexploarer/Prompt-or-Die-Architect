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
