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
- **Payments**: Stripe + HelloAsso (via provider abstraction layer — see `docs/payments.md`)
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
│   │   │   └── services/   # Payment providers (Stripe, HelloAsso), PDF invoices, QR codes
│   │   ├── crm/
│   │   ├── budget/
│   │   │   ├── domain/     # EditionBudget, BudgetCategory, BudgetTransaction
│   │   │   └── infra/      # PocketBase repositories for budget entities
│   │   ├── reporting/
│   │   │   ├── domain/     # Metrics, AlertThreshold, ReportConfig, Dashboard
│   │   │   ├── infra/      # PocketBase repositories for reporting entities
│   │   │   ├── services/   # Stats aggregation, threshold evaluation, report scheduler
│   │   │   └── ui/         # Dashboard components, charts, alert management
│   │   └── core/           # Shared (Organization, Event, Edition)
│   ├── components/         # Shared UI components
│   ├── server/             # Server-only code (notifications, permissions, invitations)
│   └── utils/              # Utilities
├── routes/
│   ├── admin/              # Admin pages (billing, planning, cfp, budget, organizations)
│   ├── tickets/            # Public ticket purchase pages
│   ├── api/                # API routes (payment webhooks, etc.)
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
Scopes: cfp, planning, billing, crm, budget, api, core, ui
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
| Stripe CLI | - | Webhook forwarding from Stripe test mode (profile: `stripe`) |

### Payment Testing

The app supports two payment providers: **Stripe** and **HelloAsso** (configured via Admin UI).
See `docs/payments.md` for complete setup and configuration guide.

**Stripe**: Uses real Stripe API in test mode (free, no charges).
Get test keys at https://dashboard.stripe.com/test/apikeys and add them to `.env`.
The Stripe CLI (`docker compose --profile stripe up`) forwards webhook events to your local app.
Use test card `4242 4242 4242 4242` with any future expiry and CVC.

**HelloAsso**: Configured entirely via Admin UI (Client ID, Client Secret, Organization Slug).
Use the sandbox API base `https://api.helloasso-sandbox.com` for testing.

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
- `domain:budget` - Budget, finance, transactions
- `domain:reporting` - Reporting, dashboards, alerts, KPIs
- `domain:api` - Public API

## Feature Modules

### Reporting Module

The reporting module provides comprehensive dashboards and analytics for event editions.

**Routes:**
- `/admin/reporting` - Edition selector
- `/admin/reporting/[editionSlug]` - Dashboard with KPIs and charts
- `/admin/reporting/[editionSlug]/alerts` - Alert thresholds configuration
- `/admin/reporting/[editionSlug]/reports` - Automated reports configuration

**Key Features:**
- **Dashboard KPIs**: Revenue, tickets sold, check-in rate, submissions, speakers, sessions, sponsors, budget
- **Distribution Charts**: Tickets by type, talks by category/format, sessions by track, sponsors by tier
- **Alert System**: Configurable thresholds with email/in-app notifications
- **Automated Reports**: Scheduled email reports (daily/weekly/monthly)
- **Presets**: Quick setup templates for both alerts and reports

**Alert Presets:**
- Low Ticket Sales (billing_sales < 50, warning)
- Low Revenue (billing_revenue < 10000, critical)
- Pending Reviews Backlog (cfp_pending_reviews > 20, info)
- Low Acceptance Rate (cfp_acceptance_rate < 25%, warning)
- Budget Overrun (budget_utilization > 90%, critical)

**Report Presets:**
- Weekly Summary (Monday 09:00, CFP + Billing + Planning)
- Daily Sales (08:00, Billing only)
- Monthly Overview (1st 10:00, all sections)
- CFP Weekly (Friday 17:00, CFP only)

**UI Components** (`src/lib/features/reporting/ui/`):
- `MetricCard` - Single metric display with optional trend indicator
- `ProgressCard` - Progress bar with current/total values
- `DonutChart` - Pie/donut chart with legend
- `HorizontalBarChart` - Bar chart for comparisons
- `MiniProgressChart` - Circular progress indicator
- `AlertThresholdConfig` - Alert configuration form with presets
- `ReportConfigForm` - Report configuration form with presets
- `AlertList` - Alert display and management

**Services:**
- Stats aggregation services per domain (billing, cfp, planning, etc.)
- Threshold evaluation service
- Report scheduler service
- Report generator service

## Milestones & Issues Standard

### Milestone Naming

Milestones follow a phased approach with sequential numbering:

```
Phase {number} - {Short Description}
```

Examples:
- `Phase 8 - Public API`
- `Phase 10 - PWA & Mobile`
- `Phase 15 - Analytics & Reporting`

### Issue Structure

Each issue must follow this format:

**Title**: Titre court et descriptif en français (sans préfixes comme feat(), fix(), etc. - ces informations sont portées par les labels)

**Labels** (required):
- Type: `enhancement`, `bug`, `documentation`
- Domain: `domain:cfp`, `domain:planning`, `domain:billing`, `domain:crm`, `domain:budget`, `domain:api`, `domain:foundations`
- Component: `type:frontend`, `type:backend`, `type:fullstack`
- Priority: `priority:high`, `priority:medium`, `priority:low`

**Body**:

```markdown
## Description

Clear explanation of what needs to be done and why.

## Acceptance Criteria

- [ ] First criterion
- [ ] Second criterion
- [ ] Third criterion

## Technical Notes

Optional section for implementation hints, architecture decisions, or related files.
```

### Example Issue

```markdown
Title: Recherche globale

Labels: enhancement, domain:planning, type:frontend, priority:high

## Description

Permettre de chercher dans les sessions, speakers et sponsors depuis n'importe quelle page de l'application.

## Acceptance Criteria

- [ ] Barre de recherche dans le header/navigation
- [ ] Résultats instantanés pendant la saisie
- [ ] Filtres par catégorie (sessions, speakers, sponsors)
- [ ] Accessible au clavier (raccourci Ctrl+K)
- [ ] Mise en surbrillance du texte correspondant
- [ ] Historique des recherches récentes

## Technical Notes

- Utiliser le composant Command de shadcn-svelte
- Implémenter une recherche debounced (300ms)
- Considérer Fuse.js pour le matching flou
```
