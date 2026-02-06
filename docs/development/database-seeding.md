# Database Seeding

This guide explains how to set up and seed the database with test data for local development.

## Quick Start

```bash
# Start PocketBase and initialize with test data
docker compose up -d
pnpm db:init
```

Or reset everything from scratch:

```bash
pnpm db:reset
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm db:init` | Initialize PocketBase with superuser and seed data |
| `pnpm db:reset` | Reset database completely and re-seed |
| `pnpm seed` | Run seed script only (requires PocketBase running) |

## Test Accounts

After seeding, the following test accounts are available:

| Email | Password | Role |
|-------|----------|------|
| `admin@example.com` | `admin123` | Organizer (Owner) |
| `speaker@example.com` | `speaker123` | Speaker |
| `speaker2@example.com` | `speaker123` | Speaker |
| `reviewer@example.com` | `reviewer123` | Reviewer |
| `marie@example.com` | `volunteer123` | Organizer (Staff) |
| `pierre@example.com` | `volunteer123` | Organizer (Staff) |
| `sophie@example.com` | `volunteer123` | Organizer (Staff) |

## PocketBase Admin

- **URL**: http://localhost:8090/_/
- **Email**: `admin@pocketbase.local`
- **Password**: `adminpassword123`

## Seed Data Overview

The seed script creates a complete demo environment:

### Organization & Event Structure

```
Demo Conference Org (organization)
└── DevFest (event)
    └── DevFest Paris 2025 (edition)
        ├── Categories (5)
        ├── Formats (4)
        ├── Speakers (2)
        ├── Talks (13)
        ├── Reviews (7)
        ├── Rooms (3)
        ├── Tracks (3)
        ├── Slots (33)
        ├── Sessions (13)
        ├── Room Assignments (4)
        ├── Ticket Types (4)
        ├── Orders (10)
        ├── Tickets (17)
        ├── CRM Contacts (10)
        ├── Segments (4)
        ├── Email Templates (3)
        ├── Email Campaigns (2)
        ├── Budget (50,000 EUR, approved)
        ├── Budget Categories (7)
        ├── Budget Transactions (10)
        ├── Budget Quotes (3)
        ├── Budget Invoices (2)
        ├── Reimbursement Requests (2)
        ├── Sponsors (6)
        ├── Sponsor Packages (4)
        └── Edition Sponsors (6)
```

### Categories

| Name | Color |
|------|-------|
| Web Development | blue |
| Mobile | green |
| Cloud & DevOps | purple |
| AI & Machine Learning | orange |
| Security | red |

### Formats

| Name | Duration |
|------|----------|
| Lightning Talk | 15 min |
| Conference Talk | 45 min |
| Deep Dive | 60 min |
| Workshop | 120 min |

### Sample Talks

The seed includes 13 talks with different statuses:

**Accepted (10 talks):**
- Building Scalable Web Apps with SvelteKit
- Kubernetes for Developers: A Practical Guide
- Introduction to Large Language Models
- TypeScript Advanced Patterns
- GraphQL in Production: Lessons Learned
- From Monolith to Microservices
- Building AI-Powered Code Assistants
- PWA in 2025: The State of Progressive Web Apps
- Terraform Best Practices
- React Server Components Deep Dive

**Other statuses:**
- Securing Your Node.js Applications (rejected)
- React Native vs Flutter: A 2025 Comparison (submitted)
- Mobile Performance Optimization (under_review)

### Rooms

| Name | Capacity | Equipment |
|------|----------|-----------|
| Grand Amphithéâtre | 500 | Projector, screen, mic, video, streaming, wifi, wheelchair |
| Salle Turing | 150 | Projector, screen, mic, wifi, power outlets |
| Salle Lovelace | 80 | Projector, whiteboard, wifi, power, A/C |

### Tracks

| Name | Color |
|------|-------|
| Web & Frontend | #3B82F6 |
| Cloud & Backend | #8B5CF6 |
| AI & Data | #F59E0B |

### Time Slots

Two-day event (October 15-16, 2025):
- **Day 1**: 09:00, 10:00, 11:00, 14:00, 15:00, 16:00
- **Day 2**: 09:00, 10:00, 11:00, 14:00, 15:00

### Ticket Types

| Name | Price | Quantity |
|------|-------|----------|
| Early Bird | 49 EUR | 50 |
| Standard | 99 EUR | 200 |
| VIP | 199 EUR | 30 |
| Student | Free | 100 |

### Sponsors

| Sponsor | Website |
|---------|---------|
| TechCorp International | techcorp.example.com |
| CloudScale Inc | cloudscale.example.com |
| DataFlow Systems | dataflow.example.com |
| SecureNet Solutions | securenet.example.com |
| AI Innovations Lab | ailab.example.com |
| StartupXYZ | startupxyz.example.com |

### Sponsor Packages

| Package | Tier | Price | Max Sponsors |
|---------|------|-------|--------------|
| Platinum | 1 | 25,000 EUR | 2 |
| Gold | 2 | 15,000 EUR | 5 |
| Silver | 3 | 8,000 EUR | 10 |
| Bronze | 4 | 3,000 EUR | Unlimited |

### Edition Sponsors

| Sponsor | Package | Status |
|---------|---------|--------|
| TechCorp International | Platinum | confirmed (paid) |
| CloudScale Inc | Gold | confirmed (paid) |
| DataFlow Systems | Gold | confirmed (unpaid) |
| SecureNet Solutions | Silver | negotiating |
| AI Innovations Lab | Bronze | contacted |
| StartupXYZ | - | prospect |

### Budget Categories

| Category | Planned Amount |
|----------|----------------|
| Venue | 15,000 EUR |
| Catering | 8,000 EUR |
| Speakers | 5,000 EUR |
| Marketing | 3,000 EUR |
| Equipment | 4,000 EUR |
| Staff | 2,000 EUR |
| Other | 3,000 EUR |

### CRM Contacts

10 contacts with various sources:
- 2 speakers (from CFP)
- 5 attendees (from ticketing)
- 1 manual VIP contact
- 2 imported prospects

### Organization Members

| User | Role |
|------|------|
| Admin User | Owner |
| Bob Reviewer | Reviewer |
| Marie Dupont | Organizer |
| Pierre Martin | Organizer |
| Sophie Bernard | Organizer |

### Room Assignments

| Room | Staff | Day |
|------|-------|-----|
| Grand Amphithéâtre | Marie | Day 1 |
| Grand Amphithéâtre | Pierre | Day 2 |
| Salle Turing | Sophie | Both days |
| Salle Lovelace | Marie | Day 2 |

## Test URLs

After seeding, you can access:

- **Public CFP**: http://localhost:5173/cfp/devfest-paris-2025
- **Admin Dashboard**: http://localhost:5173/admin/cfp/devfest-paris-2025/submissions
- **Public Schedule**: http://localhost:5173/schedule/devfest-paris-2025
- **Ticket Purchase**: http://localhost:5173/tickets/devfest-paris-2025
- **Sponsor Page**: http://localhost:5173/sponsors/devfest-paris-2025

## Speaker Tokens

For E2E testing, fixed tokens are generated for speaker portal access:

| Speaker | Token |
|---------|-------|
| Jane Speaker | `aaaa...` (64 chars of 'a') |
| John Talker | `bbbb...` (64 chars of 'b') |

Access speaker submissions at:
- `/cfp/devfest-paris-2025/submissions?token=aaaa...`
- `/cfp/devfest-paris-2025/submissions?token=bbbb...`

## Environment Variables

You can customize the seed behavior with environment variables:

```bash
# PocketBase connection
PUBLIC_POCKETBASE_URL=http://localhost:8090

# Superuser credentials
PB_ADMIN_EMAIL=admin@pocketbase.local
PB_ADMIN_PASSWORD=adminpassword123

# Docker container name
POCKETBASE_CONTAINER=oeo-pocketbase
```

## Troubleshooting

### PocketBase not ready

If you see "Timeout waiting for PocketBase", make sure the container is running:

```bash
docker compose up -d
docker ps
```

### Permission errors on reset

If `db:reset` fails with permission errors, the script uses Docker to clean the data directory. Make sure Docker is running and you have access to run containers.

### Authentication fails

If the seed script can't authenticate:

1. Check PocketBase is running: `curl http://localhost:8090/api/health`
2. Verify superuser exists: Access http://localhost:8090/_/
3. Check credentials match environment variables

### Collections already exist

The seed script is idempotent - it checks for existing data before creating. If you want a completely fresh database, use `pnpm db:reset`.

## Adding Custom Seed Data

To modify the seed data, edit `scripts/seed.ts`:

```typescript
// Add a new user
const users = [
  // ... existing users
  {
    email: 'newuser@example.com',
    password: 'password123',
    passwordConfirm: 'password123',
    name: 'New User',
    role: 'speaker'
  }
]

// Add a new sponsor
const sponsorDefs = [
  // ... existing sponsors
  {
    name: 'New Sponsor',
    website: 'https://newsponsor.example.com',
    contactName: 'Contact Name',
    contactEmail: 'contact@newsponsor.example.com'
  }
]
```

## Architecture

The seed script follows this order to respect foreign key relationships:

1. **Users** - Auth collection (built-in)
2. **Organizations** - No dependencies
3. **Organization Members** - Depends on organizations, users
4. **Events** - Depends on organizations
5. **Editions** - Depends on events
6. **Categories** - Depends on editions
7. **Formats** - Depends on editions
8. **Speakers** - Depends on users
9. **Speaker Tokens** - Depends on speakers, editions
10. **Talks** - Depends on editions, categories, formats, speakers
11. **Reviews** - Depends on talks, users
12. **Rooms** - Depends on editions
13. **Tracks** - Depends on editions
14. **Slots** - Depends on rooms, editions
15. **Sessions** - Depends on slots, talks, tracks
16. **Room Assignments** - Depends on rooms, organization members
17. **Ticket Types** - Depends on editions
18. **App Settings** - No dependencies
19. **Orders** - Depends on editions
20. **Order Items** - Depends on orders, ticket types
21. **Billing Tickets** - Depends on orders, ticket types, editions
22. **CRM Contacts** - Depends on events
23. **Contact Edition Links** - Depends on contacts, editions, speakers
24. **Consents** - Depends on contacts
25. **Segments** - Depends on events
26. **Email Templates** - Depends on events
27. **Email Campaigns** - Depends on events, templates, segments
28. **Edition Budgets** - Depends on editions
29. **Budget Categories** - Depends on edition budgets
30. **Budget Transactions** - Depends on budget categories
31. **Budget Quotes** - Depends on editions
32. **Budget Invoices** - Depends on transactions
33. **Reimbursement Requests** - Depends on editions, speakers
34. **Reimbursement Items** - Depends on reimbursement requests
35. **Financial Audit Log** - Depends on editions, users
36. **Sponsors** - Depends on organizations
37. **Sponsor Packages** - Depends on editions
38. **Edition Sponsors** - Depends on editions, sponsors, sponsor packages

## E2E Testing

E2E tests are available in `tests/e2e/`. To run them:

```bash
# Start PocketBase and seed data
pnpm db:init

# Run E2E tests (uses preview server)
pnpm test:e2e

# Run with UI mode for debugging
pnpm test:e2e:ui
```

## Related Documentation

- [PocketBase Documentation](https://pocketbase.io/docs/)
- [Architecture Overview](../architecture.md)
- [Contributing Guide](../../CONTRIBUTING.md)
- [Sponsoring Module](../features/sponsoring-module.md)
- [Billing Module](../features/billing-module.md)
- [Budget Module](../features/budget-module.md)
