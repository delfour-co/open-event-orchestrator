# Sponsoring Module

The Sponsoring module provides comprehensive sponsor management for events, including a sponsor pipeline, package configuration, and a dedicated sponsor portal.

## Overview

The Sponsoring module enables:

- **Organizers** to manage sponsors with a Kanban-style pipeline
- **Packages** to define sponsorship tiers with benefits
- **Pipeline** to track sponsor status from prospect to confirmed
- **Sponsor Portal** for sponsors to access their information via token-based auth
- **Public Page** to showcase confirmed sponsors grouped by tier

## Architecture

```
src/lib/features/sponsoring/
├── domain/                        # Business entities and rules
│   ├── sponsor.ts                 # Sponsor entity
│   ├── sponsor.test.ts            # Unit tests
│   ├── package.ts                 # SponsorPackage entity, benefits
│   ├── package.test.ts            # Unit tests
│   ├── edition-sponsor.ts         # EditionSponsor with status workflow
│   ├── edition-sponsor.test.ts    # Unit tests
│   ├── sponsor-token.ts           # Token-based portal access
│   ├── sponsor-token.test.ts      # Unit tests
│   └── index.ts                   # Barrel exports
├── infra/                         # PocketBase repositories
│   ├── sponsor-repository.ts      # CRUD for sponsors
│   ├── package-repository.ts      # CRUD for sponsor_packages
│   ├── edition-sponsor-repository.ts  # CRUD for edition_sponsors
│   ├── sponsor-token-repository.ts    # Token management
│   └── index.ts                   # Barrel exports
├── services/                      # External services
│   ├── sponsor-token-service.ts   # Token generation/validation
│   ├── sponsor-email-service.ts   # Email notifications
│   └── index.ts                   # Barrel exports
└── index.ts                       # Feature barrel exports
```

## Routes Structure

### Admin Routes

| Route | Description |
|-------|-------------|
| `/admin/sponsoring` | Edition selector — choose which edition to manage |
| `/admin/sponsoring/[editionSlug]` | Sponsor dashboard with pipeline view |
| `/admin/sponsoring/[editionSlug]/packages` | Package configuration (tiers, benefits, pricing) |
| `/admin/sponsoring/[editionSlug]/sponsors` | Sponsors list with all sponsors |

### Sponsor Routes

| Route | Description |
|-------|-------------|
| `/sponsor/[editionSlug]/portal` | Sponsor portal (token-based auth) |

### Public Routes

| Route | Description |
|-------|-------------|
| `/sponsors/[editionSlug]` | Public sponsors page showing confirmed sponsors |

## Data Model

### Sponsor

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier |
| `organizationId` | string | Relation to organizations |
| `name` | string | Company name (1-200 chars) |
| `logo` | file | Company logo (optional) |
| `website` | string | Company website URL (optional) |
| `description` | string | Company description (max 2000 chars) |
| `contactName` | string | Primary contact name (max 200 chars) |
| `contactEmail` | string | Contact email address |
| `contactPhone` | string | Contact phone (max 50 chars) |
| `notes` | string | Internal notes (max 5000 chars) |
| `createdAt` | date | Creation timestamp |
| `updatedAt` | date | Last update timestamp |

### SponsorPackage

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier |
| `editionId` | string | Relation to editions |
| `name` | string | Package name (1-100 chars) |
| `tier` | number | Package tier (1 = highest) |
| `price` | number | Package price (>= 0) |
| `currency` | enum | `EUR`, `USD`, `GBP` |
| `maxSponsors` | number | Maximum sponsors for this tier (optional) |
| `benefits` | json | Array of benefits `{name, included}` |
| `description` | string | Package description (max 2000 chars) |
| `isActive` | boolean | Whether package is available |
| `createdAt` | date | Creation timestamp |
| `updatedAt` | date | Last update timestamp |

**Default Benefits:**
- Logo on website
- Logo on printed materials
- Social media mention
- Booth at venue
- Speaking slot
- Attendee list access
- VIP dinner invitation
- Free tickets

**Default Package Tiers:**
- Platinum (Tier 1)
- Gold (Tier 2)
- Silver (Tier 3)
- Bronze (Tier 4)

### EditionSponsor

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier |
| `editionId` | string | Relation to editions |
| `sponsorId` | string | Relation to sponsors |
| `packageId` | string | Relation to sponsor_packages (optional) |
| `status` | enum | Sponsor status in pipeline |
| `confirmedAt` | date | Date sponsor was confirmed |
| `paidAt` | date | Date payment was received |
| `amount` | number | Sponsorship amount (>= 0) |
| `notes` | string | Notes about this sponsorship |
| `createdAt` | date | Creation timestamp |
| `updatedAt` | date | Last update timestamp |

### SponsorToken

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier |
| `editionSponsorId` | string | Relation to edition_sponsors |
| `token` | string | 64-character secure token |
| `expiresAt` | date | Token expiration date |
| `createdAt` | date | Creation timestamp |

## Sponsor Status Workflow

```
prospect → contacted → negotiating → confirmed
                   ↘                ↗
                    → declined / cancelled
```

| Status | Description | Badge |
|--------|-------------|-------|
| `prospect` | Potential sponsor identified | Gray |
| `contacted` | Initial outreach made | Blue |
| `negotiating` | In discussions about package | Yellow |
| `confirmed` | Sponsorship confirmed | Green |
| `declined` | Sponsor declined | Red |
| `cancelled` | Sponsorship cancelled | Slate |

### Valid Transitions

| From | Can Transition To |
|------|-------------------|
| prospect | contacted, declined, cancelled |
| contacted | negotiating, declined, cancelled |
| negotiating | confirmed, declined, cancelled |
| confirmed | cancelled |
| declined | prospect, contacted |
| cancelled | prospect |

## Features

### 1. Sponsor Pipeline

A Kanban-style board showing sponsors organized by status:
- **Columns:** Prospect, Contacted, Negotiating, Confirmed
- **Cards:** Show sponsor name, logo, package, and amount
- **Quick actions:** Change status, assign package, view details
- **Stats:** Total sponsors, confirmed count, revenue

### 2. Package Configuration

Manage sponsorship packages per edition:
- **Create packages** with name, tier, price, and benefits
- **Benefits checklist** — select which benefits are included
- **Max sponsors** — limit the number of sponsors per tier
- **Toggle active** — enable/disable packages for sale
- **Sort by tier** — automatic ordering by tier level

### 3. Sponsor Management

Full CRUD for sponsors:
- **Create sponsors** with company info and contact details
- **Upload logos** — displayed in pipeline and public page
- **Add to editions** — link sponsors to specific events
- **Track history** — see all editions a sponsor participated in

### 4. Sponsor Portal

Token-based access for sponsors to view their information:
- **Generate portal link** — creates unique token URL
- **Send via email** — automated notification with link
- **View package details** — benefits included in their tier
- **View event information** — dates, venue, schedule

### 5. Public Sponsors Page

Showcase confirmed sponsors:
- **Grouped by tier** — Platinum, Gold, Silver, Bronze sections
- **Logo display** — clickable logos linking to sponsor websites
- **Responsive grid** — adapts to screen size
- **No auth required** — publicly accessible

## Dashboard Integration

The main admin dashboard (`/admin`) includes a Sponsoring Stats section:
- **Total Sponsors** — count of all sponsors in pipeline
- **Confirmed** — sponsors with confirmed status
- **Revenue** — total confirmed sponsorship amount
- **Paid** — amount already received

## Testing

### Unit Tests

Tests located in `src/lib/features/sponsoring/domain/*.test.ts`:

- **sponsor.test.ts** — Sponsor schema validation, helpers
- **package.test.ts** — Package schema, benefits, tier helpers
- **edition-sponsor.test.ts** — Status workflow, transitions, stats
- **sponsor-token.test.ts** — Token generation, validation

### E2E Tests

Tests located in `tests/e2e/sponsor*.spec.ts`:

**sponsoring.spec.ts:**
- Edition selector navigation
- Dashboard with pipeline display
- Sponsor CRUD (create, update status, assign package)
- Portal link generation
- Access control

**sponsoring-packages.spec.ts:**
- Package CRUD (create, edit, delete)
- Benefits management
- Toggle active status
- Navigation

**sponsoring-public.spec.ts:**
- Public page without auth
- Sponsors grouped by tier
- Logo display and links
- Responsive design
- Empty state handling

**sponsor-portal.spec.ts:**
- Token-based authentication
- Access denied without token
- Portal content display

## Database Collections

| Collection | Description |
|------------|-------------|
| `sponsors` | Sponsor companies (organization-level) |
| `sponsor_packages` | Sponsorship tiers per edition |
| `edition_sponsors` | Sponsor participation per edition |
| `sponsor_tokens` | Portal access tokens |

## Related Documentation

- [Database Seeding](../development/database-seeding.md) — Test data including sponsors
- [Budget Module](budget-module.md) — Track sponsor payments
- [CRM Module](crm-module.md) — Sponsor contacts sync
