# Open Event Orchestrator

> **The open-source control plane for events**

[![CI](https://github.com/delfour-co/open-event-orchestrator/actions/workflows/ci.yml/badge.svg)](https://github.com/delfour-co/open-event-orchestrator/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

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
| `admin@example.com` | `admin123` | Organizer |
| `speaker@example.com` | `speaker123` | Speaker |
| `reviewer@example.com` | `reviewer123` | Reviewer |

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
│   │   └── ui/            # Button, Input, Card, etc.
│   ├── features/          # Feature modules
│   │   ├── auth/          # Authentication
│   │   ├── cfp/           # Call for Papers
│   │   ├── planning/      # Schedule management
│   │   ├── billing/       # Ticketing
│   │   ├── crm/           # Contact management
│   │   └── core/          # Organization, Event, Edition
│   ├── server/            # Server-only code
│   └── stores/            # Svelte stores
├── routes/                # SvelteKit routes
│   ├── admin/             # Admin dashboard
│   ├── auth/              # Login, Register
│   └── (public)/          # Public pages
└── tests/
    ├── unit/
    └── e2e/
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

### Git Conventions

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(cfp): add talk submission form
fix(billing): correct stock calculation
test(planning): add scheduler unit tests
```

Scopes: `cfp`, `planning`, `billing`, `crm`, `api`, `core`, `ui`

## Roadmap

- [x] **Phase 0** — Foundations (SvelteKit, PocketBase, Auth, UI Shell)
- [x] **Phase 1** — CFP (Call for Papers)
  - Speaker submission form with categories and formats
  - Organizer dashboard with filters, bulk actions, and CSV export
  - Review system with ratings and comments
  - Notification system (email templates)
  - CFP settings management
- [ ] **Phase 2** — Planning (Schedule management)
- [ ] **Phase 3** — Ticketing (Billing, check-in)
- [ ] **Phase 4** — CRM (Contacts, GDPR, emailing)
- [ ] **Phase 5** — API (REST, webhooks, widgets)

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
