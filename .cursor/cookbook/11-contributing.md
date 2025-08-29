# ElizaOS Contributing Guide

## Pull Request Review Checklist

### Pre-Submission Requirements
- [ ] **Branch**: PR targets `develop` branch (NOT `main`)
- [ ] **Tests**: All tests pass (`bun test`)
- [ ] **Build**: Code compiles successfully (`bun run build`)
- [ ] **Linting**: Code passes linting (`bun run lint`)
- [ ] **Dependencies**: Only `workspace:*` for internal packages
- [ ] **Package Manager**: Only Bun used (no npm/pnpm commands)

### Code Quality Checks
- [ ] **TypeScript**: No `any`, `unknown`, or `never` types
- [ ] **Error Handling**: Comprehensive error handling with specific types
- [ ] **Logging**: Appropriate logging with structured data
- [ ] **Performance**: No obvious performance anti-patterns
- [ ] **Security**: Input validation and sanitization where needed

### Architecture Compliance
- [ ] **Component Separation**: Actions, Providers, Services, Evaluators used correctly
- [ ] **Dependencies**: No circular dependencies between packages
- [ ] **Abstractions**: Platform-specific code properly abstracted
- [ ] **Event System**: Uses EventTarget, not EventEmitter
- [ ] **Process Execution**: Uses Bun.spawn(), not Node.js child_process

### Documentation & Testing
- [ ] **Test Coverage**: New functionality has corresponding tests
- [ ] **Integration Tests**: Prefer integration over unit tests
- [ ] **Documentation**: Public APIs documented with TSDoc
- [ ] **Examples**: Complex functionality includes usage examples
- [ ] **Breaking Changes**: Breaking changes clearly documented

## Commit Style Guide

### Commit Message Format
```
type(scope): brief description

Optional longer description explaining the change in more detail.
Can span multiple lines.

- List any breaking changes
- Reference issue numbers: Fixes #123
- Co-authored-by: Name <email> (if applicable)
```

### Commit Types
- **feat**: New feature or capability
- **fix**: Bug fix
- **refactor**: Code restructuring without functionality change
- **perf**: Performance improvement
- **test**: Adding or fixing tests
- **docs**: Documentation changes
- **build**: Build system or dependency changes
- **ci**: CI/CD pipeline changes
- **chore**: Maintenance tasks (version bumps, cleanup)

### Scopes (Optional)
- **core**: Changes to packages/core
- **cli**: Changes to packages/cli
- **client**: Changes to packages/client
- **server**: Changes to packages/server
- **plugin-***: Changes to specific plugins
- **api**: API changes
- **db**: Database related changes

### Examples
```bash
# Good commit messages
feat(core): add streaming response support for LLM providers
fix(cli): resolve plugin loading issue with workspace dependencies
refactor(server): migrate from EventEmitter to EventTarget
perf(core): optimize memory search with caching layer
test(plugin-sql): add integration tests for PostgreSQL adapter

# Avoid these
git commit -m "fix stuff"
git commit -m "update"
git commit -m "minor changes"
git commit -m "WIP"
```

## CI/CD Expectations

### Automated Checks
All PRs trigger automated checks that must pass:

#### Build & Test Pipeline
```yaml
# GitHub Actions workflow
- Install dependencies: bun install
- Build all packages: bun run build  
- Run test suite: bun test
- Lint codebase: bun run lint
- Type checking: TypeScript compilation
- Security scan: npm audit equivalent for Bun
```

#### Package-Specific Checks
```yaml
# Core package validation
- Core builds successfully
- Core tests pass (95%+ coverage expected)
- No circular dependencies detected
- TypeScript strict mode compliance

# CLI package validation  
- CLI builds and creates executable
- Command tests pass
- Template generation works
- Integration tests with real projects

# Client package validation
- Frontend builds for production
- Component tests pass
- E2E tests with Cypress
- Bundle size analysis
```

### Performance Benchmarks
```yaml
# Performance regression testing
- Bundle size check (max increase: 5%)
- Runtime performance tests
- Memory usage validation
- Database query performance
- API response time benchmarks
```

### Security Checks
```yaml
# Security validation
- Dependency vulnerability scan
- Secret scanning (no hardcoded keys)
- Input validation tests
- Authentication/authorization tests
- CORS and security header validation
```

## Development Workflow

### Setting Up Development Environment
```bash
# 1. Fork and clone repository
git clone https://github.com/your-username/eliza.git
cd eliza

# 2. Add upstream remote
git remote add upstream https://github.com/elizaOS/eliza.git

# 3. Install dependencies
bun install

# 4. Create feature branch from develop
git checkout develop
git pull upstream develop
git checkout -b feature/your-feature-name

# 5. Make changes and test
bun run build
bun test
bun run lint
```

### Making Changes
```bash
# 1. Write tests first (TDD approach)
cd packages/core
bun test --watch src/__tests__/your-feature.test.ts

# 2. Implement functionality
# Write production code to make tests pass

# 3. Verify changes
bun run build          # Build must succeed
bun test              # All tests must pass
bun run lint          # Code must pass linting

# 4. Test integration
bun start             # Verify runtime works
elizaos test          # Run ElizaOS E2E tests
```

### Submitting Changes
```bash
# 1. Commit changes with good messages
git add .
git commit -m "feat(core): add new feature with comprehensive tests"

# 2. Push to your fork
git push origin feature/your-feature-name

# 3. Create PR via GitHub UI
# - Target: develop branch
# - Include description of changes
# - Reference related issues
# - Add screenshots if UI changes
```

### PR Review Process
1. **Automated Checks**: CI/CD pipeline runs automatically
2. **Code Review**: Maintainers review code quality and architecture
3. **Testing**: Reviewers test functionality in their environment  
4. **Feedback**: Address any requested changes
5. **Approval**: Once approved, maintainer merges to develop
6. **Deployment**: Changes included in next release

## Code Review Guidelines

### For Contributors
- **Self Review**: Review your own PR before submitting
- **Small PRs**: Keep PRs focused and reasonably sized
- **Clear Description**: Explain what changes and why
- **Screenshots**: Include screenshots for UI changes
- **Breaking Changes**: Clearly document any breaking changes
- **Tests**: Ensure your changes are well tested
- **Documentation**: Update docs for API changes

### For Reviewers
- **Timely Reviews**: Aim to review within 48 hours
- **Constructive Feedback**: Provide helpful, specific feedback
- **Code Quality**: Focus on maintainability and best practices
- **Architecture**: Ensure changes align with system design
- **Security**: Review for potential security issues
- **Performance**: Consider performance implications
- **Documentation**: Verify documentation is updated

## Testing Contributions

### Test Requirements
- **New Features**: Must include comprehensive tests
- **Bug Fixes**: Must include regression tests
- **Integration**: Test real-world usage scenarios
- **Coverage**: Maintain or improve test coverage
- **Performance**: Include performance tests for critical paths

### Test Categories
```typescript
// Unit tests - test individual components
describe('ActionHandler', () => {
  it('should process valid action', () => { /* ... */ });
});

// Integration tests - test component interactions  
describe('Agent Runtime Integration', () => {
  it('should process message end-to-end', async () => { /* ... */ });
});

// E2E tests - test complete user workflows
describe('CLI Workflow', () => {
  it('should create and start new project', async () => { /* ... */ });
});
```

### Test Best Practices
- **Real Dependencies**: Prefer real services over mocks when possible
- **Isolated Tests**: Each test should be independent
- **Descriptive Names**: Test names should clearly describe behavior
- **Comprehensive Coverage**: Test both happy path and error cases
- **Performance Tests**: Include performance tests for critical functionality

## Documentation Standards

### TSDoc Requirements
```typescript
/**
 * Processes incoming messages and generates appropriate responses.
 * 
 * @param message - The incoming message to process
 * @param context - Additional context for processing
 * @returns Promise resolving to processing result
 * 
 * @example
 * ```typescript
 * const result = await runtime.processMessage(message, context);
 * if (result.success) {
 *   console.log('Message processed:', result.response);
 * }
 * ```
 * 
 * @throws {ValidationError} When message format is invalid
 * @throws {ServiceError} When external service calls fail
 */
async processMessage(
  message: Memory, 
  context: Context
): Promise<ProcessingResult>
```

### README Requirements
Each package should have a README with:
- **Purpose**: What the package does
- **Installation**: How to install and setup
- **Usage**: Basic usage examples
- **API**: Key interfaces and functions
- **Contributing**: Package-specific contribution notes

### CHANGELOG Updates
For significant changes, update CHANGELOG.md:
```markdown
## [Unreleased]

### Added
- New streaming response support for LLM providers
- Plugin hot-reloading capabilities

### Changed  
- Migrated from EventEmitter to EventTarget for better Bun compatibility

### Fixed
- Plugin dependency resolution in monorepo environment

### Breaking Changes
- `EventEmitter` usage replaced with `EventTarget`
- Action handler signature updated to include streaming callback
```

## Release Process

### Version Management
ElizaOS uses Lerna for version management:

```bash
# Create release (maintainers only)
bun run release

# Alpha/beta releases
bun run release:beta

# The release process:
# 1. Bumps versions across packages
# 2. Updates changelogs
# 3. Creates git tags
# 4. Publishes to npm registry
# 5. Creates GitHub release
```

### Release Schedule
- **Major Releases**: Every 3-4 months (breaking changes)
- **Minor Releases**: Monthly (new features, non-breaking)
- **Patch Releases**: As needed (bug fixes, security)
- **Alpha/Beta**: Continuous (testing new features)

### Breaking Change Policy
- **Deprecated APIs**: Maintained for one major version
- **Migration Guides**: Provided for all breaking changes
- **Gradual Migration**: Prefer gradual migration over hard breaks
- **Community Input**: Major changes discussed with community first

## Community Guidelines

### Communication
- **Be Respectful**: Treat all community members with respect
- **Be Constructive**: Provide helpful, actionable feedback
- **Be Patient**: Recognize that contributors have different experience levels
- **Ask Questions**: Don't hesitate to ask for clarification
- **Share Knowledge**: Help others learn and grow

### Issue Reporting
When reporting issues:
- **Search First**: Check if issue already exists
- **Clear Title**: Descriptive title that summarizes the issue
- **Reproduction Steps**: Clear steps to reproduce the problem
- **Environment**: Include OS, Node.js/Bun versions, package versions
- **Expected vs Actual**: What you expected vs what happened
- **Logs/Screenshots**: Include relevant error messages or screenshots

### Feature Requests
When requesting features:
- **Use Case**: Explain the problem you're trying to solve
- **Proposed Solution**: Suggest how it might work
- **Alternatives**: Consider alternative approaches
- **Breaking Changes**: Note if it would require breaking changes
- **Community Benefit**: How would it benefit other users

## TODOs & Contributing Improvements

- [ ] Automated PR template with checklist
- [ ] Contributor recognition system
- [ ] Plugin development guidelines
- [ ] Performance benchmarking automation
- [ ] Security review process documentation
- [ ] Community mentorship program
- [ ] Documentation contribution guidelines
- [ ] Internationalization contribution process