# Core Module

The core module provides the foundational domain entities that form the backbone of the entire platform: Organization, Event, Edition, and TeamMember.

## Overview

The core module defines:
- **Organization**: Top-level entity (company/community hosting events)
- **Event**: Recurring event series within an organization
- **Edition**: Specific instance/year of an event
- **TeamMember**: Staff and organizers for an edition

All other feature modules (billing, budget, sponsoring, CFP, planning, CRM) depend on these core entities.

## Architecture

```
core/
├── domain/                    # Business entities & rules
│   ├── organization.ts       # Organization entity
│   ├── event.ts              # Event entity
│   ├── edition.ts            # Edition with status
│   ├── team-member.ts        # Team members with socials
│   └── index.ts              # Domain exports
├── infra/                     # Data access
│   ├── organization-repository.ts
│   ├── event-repository.ts
│   ├── edition-repository.ts
│   ├── team-member-repository.ts
│   └── index.ts
├── usecases/                  # (Empty)
└── ui/                        # (Empty)
```

## Entity Hierarchy

```
Organization (top-level)
├── Event (multiple per organization)
│   └── Edition (multiple per event)
│       └── TeamMember (multiple per edition)
│
└── Sponsor (sponsoring module)
```

## Domain Entities

### Organization

Top-level entity representing a company or community.

```typescript
type Organization = {
  id: string
  name: string                   // 2-100 chars
  slug: string                   // 2-50 chars, kebab-case
  description?: string           // max 500 chars
  logo?: string                  // URL
  website?: string               // URL
  createdAt: Date
  updatedAt: Date
}
```

**Validation:**
- Slug must match `/^[a-z0-9-]+$/`
- URLs must be valid format

### Event

Recurring event series within an organization.

```typescript
type Event = {
  id: string
  organizationId: string         // FK to Organization
  name: string                   // 2-100 chars
  slug: string                   // 2-50 chars, kebab-case
  description?: string           // max 2000 chars
  logo?: string                  // URL
  website?: string               // URL
  createdAt: Date
  updatedAt: Date
}
```

**Relationship:** Many-to-One with Organization

### Edition

Specific instance/year of an event.

```typescript
type Edition = {
  id: string
  eventId: string                // FK to Event
  name: string                   // 2-100 chars
  slug: string                   // 2-50 chars, kebab-case
  year: number                   // 2000-2100
  startDate: Date
  endDate: Date
  venue?: string                 // max 200 chars
  city?: string                  // max 100 chars
  country?: string               // max 100 chars
  status: 'draft' | 'published' | 'archived'
  createdAt: Date
  updatedAt: Date
}
```

**Status Values:**
- `draft`: Edition in preparation (default)
- `published`: Edition is live/active
- `archived`: Past edition

**Validation:**
- `validateEditionDates()`: Ensures startDate < endDate

### TeamMember

Organizers, staff, and volunteers for an edition.

```typescript
type TeamMember = {
  id: string
  editionId: string              // FK to Edition
  slug: string                   // 2-100 chars, auto-generated
  name: string                   // 1-200 chars
  team?: string                  // Team category (max 100 chars)
  role?: string                  // Job title (max 200 chars)
  bio?: string                   // Biography (max 2000 chars)
  photo?: string                 // Filename
  photoUrl?: string              // Full URL
  socials: SocialLink[]          // Social profiles
  displayOrder: number           // UI ordering
  created: Date
  updated: Date
}

type SocialLink = {
  name: string                   // 1-50 chars
  icon: string                   // Icon identifier
  url: string                    // Profile URL
}
```

**Helper Functions:**
- `generateSlug(name)`: Converts names to kebab-case, handles Unicode
- `getSocialIcon(name)`: Maps network names to icons
- `SOCIAL_ICONS`: twitter, x, linkedin, github, youtube, instagram, facebook, mastodon, bluesky, website, blog
- `DEFAULT_TEAMS`: Core Team, Organizers, Volunteers, Staff, Communication, Technical, Sponsors, Speakers

## Repositories

### OrganizationRepository

```typescript
interface OrganizationRepository {
  findById(id: string): Promise<Organization | null>
  findBySlug(slug: string): Promise<Organization | null>
  findAll(): Promise<Organization[]>
  create(input: CreateOrganizationInput): Promise<Organization>
  update(id: string, input: UpdateOrganizationInput): Promise<Organization>
  delete(id: string): Promise<void>
}
```

### EventRepository

```typescript
interface EventRepository {
  findById(id: string): Promise<Event | null>
  findBySlug(slug: string): Promise<Event | null>
  findByOrganization(organizationId: string): Promise<Event[]>
  create(input: CreateEventInput): Promise<Event>
  update(id: string, input: UpdateEventInput): Promise<Event>
  delete(id: string): Promise<void>
}
```

### EditionRepository

```typescript
interface EditionRepository {
  findById(id: string): Promise<Edition | null>
  findBySlug(slug: string): Promise<Edition | null>
  findByEvent(eventId: string): Promise<Edition[]>
  create(input: CreateEditionInput): Promise<Edition>
  update(id: string, input: UpdateEditionInput): Promise<Edition>
  delete(id: string): Promise<void>
}
```

### TeamMemberRepository

```typescript
interface TeamMemberRepository {
  findById(id: string): Promise<TeamMember | null>
  findBySlug(editionId: string, slug: string): Promise<TeamMember | null>
  findByEdition(editionId: string): Promise<TeamMember[]>
  findByTeam(editionId: string, team: string): Promise<TeamMember[]>
  getTeams(editionId: string): Promise<string[]>
  create(data: CreateTeamMemberInput): Promise<TeamMember>
  update(id: string, data: UpdateTeamMemberInput): Promise<TeamMember>
  updatePhoto(id: string, file: File): Promise<TeamMember>
  removePhoto(id: string): Promise<TeamMember>
  delete(id: string): Promise<void>
  reorder(editionId: string, memberIds: string[]): Promise<void>
}
```

## Routes

### Admin Routes

| Route | Description |
|-------|-------------|
| `/admin` | Dashboard with Quick Setup button |
| `/admin/organizations` | Organization list |
| `/admin/organizations/[orgSlug]` | Organization settings |
| `/admin/events/[eventSlug]` | Event settings |
| `/admin/editions/[editionSlug]` | Edition settings |
| `/admin/editions/[editionSlug]/team` | Team members |

## Quick Setup Wizard

A streamlined wizard for creating Organization → Event → Edition in one flow.

### Features

- **Step 1**: Create or select existing organization
- **Step 2**: Create new event under the organization
- **Step 3**: Create edition with dates, venue, and city
- **Auto Slug**: Automatic slug generation from names
- **Validation**: Form validation at each step
- **Redirect**: Redirects to edition settings on completion

### Access

The Quick Setup button is available on the `/admin` dashboard.

### Component

```typescript
import { QuickSetupWizard } from '$lib/features/core/ui'

<QuickSetupWizard
  organizations={existingOrganizations}
  onComplete={(editionSlug) => goto(`/admin/editions/${editionSlug}/settings`)}
/>
```

### Workflow

```
Dashboard → Click "Quick Setup"
         → Step 1: Organization (new or existing)
         → Step 2: Event (name, description)
         → Step 3: Edition (year, dates, venue)
         → Redirect to edition settings
```

## Integration with Other Modules

All feature modules reference core entities:

| Module | References |
|--------|------------|
| Billing | `editionId` for ticket types, orders |
| Budget | `editionId` for budgets, transactions |
| Sponsoring | `organizationId` for sponsors, `editionId` for packages |
| CFP | `editionId` for talks, speakers |
| Planning | `editionId` for rooms, sessions |
| CRM | `organizationId` for contacts |

## PocketBase Collections

| Collection | Description |
|------------|-------------|
| `organizations` | Top-level entities |
| `events` | Event series |
| `editions` | Event instances |
| `team_members` | Staff per edition |

## Architectural Patterns

1. **Repository Pattern**: PocketBase abstracted via typed interfaces
2. **Factory Functions**: Repositories created with `createXxxRepository(pb)`
3. **Null-Safe Queries**: Methods return `null` instead of throwing on not-found
4. **Immutable Foreign Keys**: `organizationId`, `eventId`, `editionId` cannot change
5. **Zod Validation**: Runtime schema validation for type safety
6. **Status Machine**: Edition status lifecycle (draft → published → archived)

## Testing

Unit tests validate:
- Schema validation rules
- Date validation (start < end)
- Slug generation from names
- Social icon mapping
- Boundary conditions

E2E tests cover:
- Quick Setup Wizard flow
- Organization CRUD
- Event CRUD
- Edition CRUD
- Team member management

```bash
pnpm test src/lib/features/core/domain/*.test.ts
pnpm test:e2e tests/e2e/quick-setup-wizard.spec.ts
```

## Related Documentation

- [Architecture Overview](../architecture.md)
- [Database Seeding](../development/database-seeding.md)
- [Sponsoring Module](./sponsoring-module.md) (uses Organization)
