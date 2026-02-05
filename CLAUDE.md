# Open Event Orchestrator - Development Guidelines

## Project Overview

Open Event Orchestrator is an all-in-one open-source platform for event management, replacing separate tools for CFP, scheduling, ticketing, and CRM.

## Tech Stack

- **Frontend**: SvelteKit + TypeScript
- **Backend**: PocketBase (SQLite)
- **UI**: shadcn-svelte
- **Forms**: Superforms + Zod
- **Testing**: Vitest (unit) + Playwright (E2E)
- **Linting**: Biome
- **Containerization**: Docker Compose
- **Payments**: Stripe (Checkout Sessions)
- **Email**: Nodemailer (SMTP) + Mailpit (local dev)
- **QR Codes**: qrcode (generation) + html5-qrcode (scanning)

## Architecture

Structure par feature/module avec Clean Architecture principles:

```
src/
├── lib/
│   ├── features/           # Feature modules
│   │   ├── cfp/
│   │   │   ├── domain/     # Entities, types, business rules
│   │   │   ├── usecases/   # Application logic
│   │   │   ├── infra/      # PocketBase repositories
│   │   │   ├── services/   # External services (email, etc.)
│   │   │   └── ui/         # Svelte components
│   │   ├── planning/
│   │   │   ├── domain/
│   │   │   ├── usecases/
│   │   │   ├── infra/
│   │   │   └── ui/
│   │   ├── billing/
│   │   │   ├── domain/     # TicketType, Order, OrderItem, Ticket
│   │   │   ├── usecases/   # create-order, complete-order, cancel-order, refund-order, check-in-ticket
│   │   │   ├── infra/      # PocketBase repositories for billing entities
│   │   │   └── services/   # Stripe, QR code generation, email templates
│   │   ├── crm/
│   │   └── core/           # Shared (Organization, Event, Edition)
│   ├── components/         # Shared UI components
│   ├── server/             # Server-only code (notifications, permissions, invitations)
│   └── utils/              # Utilities
├── routes/
│   ├── admin/              # Admin pages (billing, planning, cfp, organizations)
│   ├── tickets/            # Public ticket purchase pages
│   ├── api/                # API routes (Stripe webhook, etc.)
│   └── auth/               # Authentication (login, register)
└── tests/
    └── e2e/                # Playwright E2E tests
```

## Code Conventions

### TypeScript

- Strict mode enabled
- Explicit return types on public functions
- Use `type` for data structures, `interface` for contracts
- Prefer `unknown` over `any`

### Naming

- Files: `kebab-case.ts`
- Components: `PascalCase.svelte`
- Functions: `camelCase`
- Constants: `SCREAMING_SNAKE_CASE`
- Types/Interfaces: `PascalCase`

### Clean Code Principles

- Single Responsibility: one function = one purpose
- Functions < 20 lines when possible
- No magic numbers, use named constants
- Early returns over nested conditions
- Descriptive variable names over comments

### Exports

- Named exports only: `export const MyComponent`
- No default exports
- Barrel files (`index.ts`) for public API of each module

## Git Workflow

### Branch Naming

```
feature/issue-{number}-{short-description}
fix/issue-{number}-{short-description}
```

### Commit Messages (Conventional Commits)

```
type(scope): description

Types: feat, fix, docs, style, refactor, test, chore
Scopes: cfp, planning, billing, crm, api, core, ui
```

Examples:
```
feat(cfp): add talk submission form
fix(billing): correct stock calculation on order
test(planning): add scheduler unit tests
```

### Pull Request Process

1. Create worktree: `git worktree add ../oeo-issue-{n} -b feature/issue-{n}-description`
2. Develop with tests
3. Ensure coverage >= 80%
4. Run `pnpm lint && pnpm test`
5. Push and create PR
6. PR requires human review

### PR Title Format

```
[#{issue}] type(scope): description
```

Example: `[#42] feat(cfp): add speaker profile form`

## Testing

### Unit Tests (Vitest)

- Co-located with source: `*.test.ts`
- Test business logic in `domain/` and `usecases/`
- Mock infrastructure (PocketBase)

### E2E Tests (Playwright)

- Located in `tests/e2e/`
- Test complete user flows
- Use data-testid attributes

### Coverage

- Minimum threshold: 80%
- Enforced in CI

## Quality Gates

Before merge:
- [ ] Biome lint passes
- [ ] All tests pass
- [ ] Coverage >= 80%
- [ ] Build succeeds
- [ ] Human review approved

## Local Development

```bash
# Start services (PocketBase + Mailpit)
docker-compose up -d

# Install dependencies
pnpm install

# Run dev server
pnpm dev

# Run tests
pnpm test

# Run E2E tests
pnpm test:e2e

# Lint & format
pnpm lint
pnpm format
```

### Docker Services

| Service | Port | Description |
|---------|------|-------------|
| PocketBase | 8090 | Backend API + admin UI |
| Mailpit | 8025 | Email testing web UI |
| Mailpit SMTP | 1025 | SMTP server for local email capture |

### Email Testing

All emails (invitations, order confirmations, refund notifications) are sent via SMTP.
In local development, Mailpit captures all outgoing emails. View them at http://localhost:8025.

SMTP configuration defaults to `localhost:1025` (Mailpit). In production, SMTP settings will be configurable via the admin settings UI.

## Environment Variables

```env
# PocketBase
PUBLIC_POCKETBASE_URL=http://localhost:8090

# Stripe (optional, for paid tickets)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

## Domain Labels

- `domain:foundations` - Setup, infra, auth
- `domain:cfp` - Call for Papers
- `domain:planning` - Programme, scheduler
- `domain:billing` - Billetterie, payments
- `domain:crm` - CRM, contacts, GDPR
- `domain:api` - Public API
