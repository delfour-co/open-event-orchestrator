# Contributing to Open Event Orchestrator

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 8+
- Docker & Docker Compose

### Setup

```bash
# Clone the repository
git clone git@github.com:delfour-co/open-event-orchestrator.git
cd open-event-orchestrator

# Start services
docker-compose up -d

# Install dependencies
pnpm install

# Run development server
pnpm dev
```

## Development Workflow

### 1. Pick an Issue

Browse open issues and pick one that matches your skills:
- `type:backend` - Domain logic, PocketBase, API routes
- `type:frontend` - UI components, pages, forms
- `type:qa` - Tests, CI/CD, quality
- `type:docs` - Documentation

### 2. Create a Worktree

We use git worktrees to work on multiple issues in parallel:

```bash
# Create worktree for your issue
git worktree add ../oeo-issue-{number} -b feature/issue-{number}-short-description main

# Navigate to worktree
cd ../oeo-issue-{number}

# Install dependencies
pnpm install
```

### 3. Develop

- Follow the architecture guidelines in `CLAUDE.md`
- Write tests for your code
- Ensure coverage stays >= 80%

### 4. Commit

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

Types: feat, fix, docs, style, refactor, test, chore
Scopes: cfp, planning, billing, crm, api, core, ui
```

Examples:
```bash
git commit -m "feat(cfp): add talk submission form"
git commit -m "fix(billing): correct stock calculation"
git commit -m "test(planning): add scheduler unit tests"
```

### 5. Push and Create PR

```bash
# Push your branch
git push -u origin feature/issue-{number}-short-description

# Create PR
gh pr create --title "[#{number}] feat(scope): description" --body "..."
```

### 6. Cleanup

After your PR is merged:

```bash
cd ..
git worktree remove oeo-issue-{number}
git branch -d feature/issue-{number}-short-description
```

## Code Style

### Linting & Formatting

We use Biome for linting and formatting:

```bash
# Check for issues
pnpm lint

# Fix issues automatically
pnpm lint:fix

# Format code
pnpm format
```

### TypeScript

- Strict mode enabled
- Explicit return types on public functions
- Use `type` for data, `interface` for contracts

### Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Files | kebab-case | `talk-repository.ts` |
| Components | PascalCase | `TalkCard.svelte` |
| Functions | camelCase | `submitTalk()` |
| Constants | SCREAMING_SNAKE | `MAX_TITLE_LENGTH` |
| Types | PascalCase | `Talk`, `TalkStatus` |

## Testing

### Unit Tests

```bash
# Run all unit tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run tests for a specific file
pnpm test src/lib/features/cfp/usecases/submit-talk.test.ts
```

### E2E Tests

```bash
# Install Playwright browsers
pnpm exec playwright install

# Run E2E tests
pnpm test:e2e

# Run with UI
pnpm test:e2e --ui
```

### Coverage Requirements

- Minimum coverage: 80%
- PRs below threshold will be blocked by CI

## Architecture

See `CLAUDE.md` for full architecture documentation.

### Quick Overview

```
src/lib/features/{feature}/
├── domain/     # Entities, types, business rules
├── usecases/   # Application logic
├── infra/      # PocketBase repositories
└── ui/         # Svelte components
```

## Pull Request Guidelines

### Title Format

```
[#{issue}] type(scope): description
```

Example: `[#42] feat(cfp): add speaker profile form`

### Description Template

```markdown
## Summary
Brief description of changes

## Changes
- Change 1
- Change 2

## Testing
- [ ] Unit tests added/updated
- [ ] E2E tests added/updated (if applicable)
- [ ] Manual testing performed

## Screenshots
(if UI changes)
```

### Review Process

1. All PRs require human review
2. CI must pass (lint, tests, coverage, build)
3. At least one approval required

## Questions?

Open an issue with the `question` label or reach out to the maintainers.
