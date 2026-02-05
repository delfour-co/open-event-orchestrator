# Open Event Orchestrator

> **The open-source control plane for events**

[![CI](https://github.com/delfour-co/open-event-orchestrator/actions/workflows/ci.yml/badge.svg)](https://github.com/delfour-co/open-event-orchestrator/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Tests](https://img.shields.io/badge/tests-504%20passed-brightgreen)](https://github.com/delfour-co/open-event-orchestrator/actions)
[![Coverage](https://img.shields.io/badge/coverage-97.3%25-brightgreen)](https://github.com/delfour-co/open-event-orchestrator/actions)

Open Event Orchestrator is an **all-in-one open-source platform** for managing conferences, meetups, and community events. CFP, scheduling, ticketing, and CRM — unified in one place.

## Features

- **Call for Papers (CFP)** — Manage speaker submissions, reviews, and notifications
- **Planning** — Build your schedule with drag-and-drop simplicity
- **Ticketing** — Sell tickets, manage registrations, and check-in attendees
- **CRM** — Keep track of your community across all events
- **API** — Headless API for custom integrations and websites

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker & Docker Compose

### Development

```bash
# Clone the repository
git clone https://github.com/delfour-co/open-event-orchestrator.git
cd open-event-orchestrator

# Install dependencies
pnpm install

# Start PocketBase and seed with test data
docker compose up -d
pnpm db:init

# Run development server
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Test Accounts

After running `pnpm db:init`, these test accounts are available:

| Email | Password | Role |
|-------|----------|------|
| `admin@example.com` | `admin123` | Organizer (Owner) |
| `speaker@example.com` | `speaker123` | Speaker |
| `reviewer@example.com` | `reviewer123` | Reviewer |
| `marie@example.com` | `volunteer123` | Organizer (Staff) |
| `pierre@example.com` | `volunteer123` | Organizer (Staff) |
| `sophie@example.com` | `volunteer123` | Organizer (Staff) |

See [Database Seeding](docs/development/database-seeding.md) for more details.

### Production

```bash
# Build for production
docker compose -f docker-compose.prod.yml up -d
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | SvelteKit, TypeScript, Tailwind CSS |
| UI Components | shadcn-svelte |
| Backend | PocketBase (SQLite) |
| Testing | Vitest, Playwright |
| Linting | Biome |
| CI/CD | GitHub Actions |

## Project Structure

```
src/
├── lib/
│   ├── components/        # Shared UI components
│   │   ├── layout/        # Sidebar, Header, ThemeToggle
│   │   └── ui/            # Button, Input, Card, etc. (shadcn-svelte)
│   ├── features/          # Feature modules (Clean Architecture)
│   │   ├── auth/          # Authentication & roles
│   │   ├── cfp/           # Call for Papers (Talk, Speaker, Review, etc.)
│   │   ├── core/          # Organization, Event, Edition
│   │   ├── planning/      # Schedule management (Phase 2)
│   │   ├── billing/       # Ticketing (Phase 3)
│   │   └── crm/           # Contact management (Phase 4)
│   ├── server/            # Server-only code (PocketBase client)
│   └── stores/            # Svelte stores
├── routes/                # SvelteKit routes
│   ├── admin/             # Admin dashboard
│   │   ├── cfp/           # CFP management (submissions, settings)
│   │   ├── events/        # Events & editions management
│   │   ├── editions/      # Edition settings
│   │   └── organizations/ # Organization management
│   ├── auth/              # Login, Register
│   ├── cfp/               # Public CFP pages (speaker submission)
│   └── (public)/          # Public pages (home, etc.)
├── tests/
│   ├── e2e/               # Playwright E2E tests
│   └── unit/              # Vitest unit tests (in src/lib/features/*/domain/)
└── scripts/               # Database seeding, initialization
```

## Architecture

The project follows **Clean Architecture** principles with a feature-based structure:

```
feature/
├── domain/     # Entities, types, business rules
├── usecases/   # Application logic
├── infra/      # PocketBase repositories
└── ui/         # Svelte components
```

## Development

### Commands

```bash
pnpm dev           # Start development server
pnpm build         # Build for production
pnpm preview       # Preview production build
pnpm test          # Run unit tests
pnpm test:e2e      # Run E2E tests
pnpm test:coverage # Run tests with coverage
pnpm lint          # Lint code
pnpm format        # Format code
pnpm check         # Type check
pnpm db:init       # Initialize database with test data
pnpm db:reset      # Reset database and re-seed
pnpm seed          # Run seed script only
```

### Testing

The project has comprehensive test coverage:

| Type | Tests | Coverage |
|------|-------|----------|
| Unit tests | 236 | 97.3% statements |
| E2E tests | 268 | - |
| **Total** | **504** | **97.3%** |

```bash
pnpm test              # Run unit tests
pnpm test:coverage     # Run with coverage report
pnpm test:e2e          # Run Playwright E2E tests
pnpm test:e2e:ui       # Run E2E with interactive UI
```

Unit tests cover domain entities (Talk, Speaker, Review, etc.) while E2E tests cover user flows (authentication, CFP submission, organization management).

### Git Conventions

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(cfp): add talk submission form
fix(billing): correct stock calculation
test(planning): add scheduler unit tests
```

Scopes: `cfp`, `planning`, `billing`, `crm`, `api`, `core`, `ui`

## Roadmap

### Phase 0 — Foundations ✅

- [x] SvelteKit project setup with TypeScript, Tailwind CSS, shadcn-svelte
- [x] PocketBase 0.36+ setup with Docker
- [x] Authentication with role-based access (speaker, organizer, reviewer, admin)
- [x] UI Shell: sidebar, header, theme toggle (dark/light)
- [x] Git hooks (Husky, commitlint) and CI/CD (GitHub Actions)
- [x] Core data model: Organization, Event, Edition

### Phase 1 — CFP (Call for Papers) 🚧

- [x] Speaker submission form with categories and formats
- [x] Organizer dashboard with filters, bulk actions, and CSV export
- [x] Review system with ratings and comments
- [x] Notification system (email templates)
- [x] CFP settings with database persistence (dates, categories, formats)
- [x] Edition settings (separate from CFP)
- [x] Dashboard with stats and edition filter
- [ ] Organization settings with team management (#45)
- [ ] Event settings page (#46)
- [ ] UX cleanup: categories/formats placement (#47)

### Phase 2 — Planning (Schedule management) ✅

- [x] Data model: Session, Room, Slot, Track (#15)
- [x] CRUD Rooms, Tracks, Slots with equipment management (#56, #57)
- [x] Session management: assign talks to slots (#58)
- [x] Staff assignments: assign team members to rooms (#56)
- [x] Schedule view switcher (by room / by track)
- [x] Session form dialog modal (UX improvement)
- [x] Public schedule view (#18)
- [x] Export: iCal, JSON, PDF (#19)
- [x] E2E tests (#59)
- [ ] Drag & drop scheduler (#16) - deferred to post-v1

### Phase 3 — Ticketing ✅

- [x] Ticket types and pricing
- [x] Stripe integration
- [x] QR code tickets and check-in
- [x] Order management (create, complete, cancel, refund)
- [x] Attendee email notifications
- [x] Participant list and check-in dashboard
- [x] E2E tests

### Phase 4 — CRM ✅

- [x] Unified contact model scoped per event
- [x] Contact sources: speaker, attendee, sponsor, manual, import
- [x] Auto-sync from CFP speakers and Billing attendees
- [x] CSV import with merge/skip/overwrite strategies
- [x] CSV export with field selection
- [x] Dynamic segments with rule-based evaluation
- [x] Email campaigns (create, edit, send, test send, schedule, cancel)
- [x] Email templates with variable interpolation
- [x] GDPR consent management (marketing, data sharing, analytics)
- [x] One-click unsubscribe mechanism
- [x] Unit and E2E tests

### Phase 5 — API

- [ ] REST API with authentication
- [ ] Webhooks
- [ ] Embeddable widgets

### Phase 6 — Budget & Finance

- [ ] Budget model: categories, transactions (#60)
- [ ] Budget dashboard with visualization (#61)
- [ ] Quotes and invoices management (#62)
- [ ] Speaker reimbursements (#63)

### Phase 7 — Sponsoring

- [ ] Sponsor model: sponsors, packages, benefits (#64)
- [ ] Sponsor dashboard with pipeline (#65)
- [ ] Sponsoring packages configuration (#66)
- [ ] Public sponsors page (#67)
- [ ] Sponsor portal (#68)

See the [GitHub Milestones](https://github.com/delfour-co/open-event-orchestrator/milestones) for detailed progress.

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) before submitting a PR.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/issue-123-description`)
3. Commit your changes (`git commit -m "feat(scope): description"`)
4. Push to the branch (`git push origin feature/issue-123-description`)
5. Open a Pull Request

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

## Links

- [Documentation Wiki](https://github.com/delfour-co/open-event-orchestrator/wiki)
- [Database Seeding Guide](docs/development/database-seeding.md)
- [Issue Tracker](https://github.com/delfour-co/open-event-orchestrator/issues)
- [Discussions](https://github.com/delfour-co/open-event-orchestrator/discussions)
