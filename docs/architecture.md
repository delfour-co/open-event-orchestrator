# Architecture Overview

Open Event Orchestrator follows Clean Architecture principles with a feature-based organization. This document describes the project structure, patterns, and conventions.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | SvelteKit 2.x, TypeScript 5.x, Svelte 5 |
| Styling | Tailwind CSS 4.x, shadcn-svelte (Bits UI) |
| Forms | Superforms + Zod |
| Backend | PocketBase 0.25 (SQLite) |
| Payments | Stripe |
| Email | Nodemailer (SMTP), Mailpit (local dev) |
| QR Codes | qrcode (generation), html5-qrcode (scanning) |
| Testing | Vitest (unit), Playwright (E2E) |
| Linting | Biome |
| CI/CD | GitHub Actions |

## Project Structure

```
src/
├── lib/
│   ├── features/              # Feature modules (Clean Architecture)
│   │   ├── auth/              # Authentication
│   │   ├── billing/           # Ticketing & payments
│   │   ├── budget/            # Budget & finance
│   │   ├── cfp/               # Call for Papers
│   │   ├── core/              # Organization, Event, Edition
│   │   ├── crm/               # Contact management
│   │   ├── planning/          # Schedule management
│   │   ├── reporting/         # Dashboards, alerts & reports
│   │   └── sponsoring/        # Sponsor management
│   ├── components/            # Shared UI components
│   │   ├── layout/            # Sidebar, Header, etc.
│   │   └── ui/                # shadcn-svelte components
│   ├── server/                # Server-only code
│   └── stores/                # Svelte stores
├── routes/                    # SvelteKit routes
│   ├── admin/                 # Protected admin pages
│   ├── api/                   # API endpoints (webhooks)
│   ├── auth/                  # Login, register
│   └── (public)/              # Public pages
└── tests/
    └── e2e/                   # Playwright E2E tests
```

## Feature Module Structure

Each feature follows Clean Architecture with four layers:

```
feature/
├── domain/                    # Core business logic
│   ├── entity.ts             # Type definitions (Zod schemas)
│   ├── entity.test.ts        # Unit tests
│   └── index.ts              # Public API
├── usecases/                  # Application logic
│   ├── use-case.ts           # Workflow orchestration
│   ├── use-case.test.ts      # Unit tests
│   └── index.ts
├── infra/                     # Data access
│   ├── entity-repository.ts  # PocketBase repository
│   └── index.ts
├── services/                  # External integrations
│   └── external-service.ts   # Stripe, email, etc.
└── ui/                        # Svelte components
    └── Component.svelte
```

### Layer Dependencies

```
UI → Use Cases → Domain + Infrastructure
     ↓
   Services (external)
```

- **Domain**: Pure business logic, no external dependencies
- **Use Cases**: Orchestrate domain and infrastructure
- **Infrastructure**: Database access (PocketBase repositories)
- **Services**: External integrations (Stripe, Nodemailer)
- **UI**: Svelte components for the feature

## Architectural Patterns

### 1. Repository Pattern

Database access is abstracted behind typed interfaces:

```typescript
// Domain interface
interface TalkRepository {
  findById(id: string): Promise<Talk | null>
  findByEdition(editionId: string): Promise<Talk[]>
  create(data: CreateTalkInput): Promise<Talk>
  update(id: string, data: UpdateTalkInput): Promise<Talk>
  delete(id: string): Promise<void>
}

// Infrastructure implementation
export const createTalkRepository = (pb: PocketBase): TalkRepository => ({
  async findById(id) {
    try {
      const record = await pb.collection('talks').getOne(id)
      return mapToTalk(record)
    } catch {
      return null
    }
  },
  // ...
})
```

### 2. Factory Pattern

Repositories and use cases are created via factory functions:

```typescript
// Create repository
const talkRepo = createTalkRepository(pb)

// Create use case with dependencies
const submitTalk = createSubmitTalkUseCase(talkRepo, speakerRepo)

// Execute
const result = await submitTalk(input)
```

### 3. Zod Schema Validation

All domain entities use Zod for type-safe validation:

```typescript
import { z } from 'zod'

export const talkSchema = z.object({
  id: z.string(),
  title: z.string().min(5).max(200),
  abstract: z.string().max(2000),
  status: z.enum(['draft', 'submitted', 'accepted', 'rejected']),
  // ...
})

export type Talk = z.infer<typeof talkSchema>
export const createTalkSchema = talkSchema.omit({ id: true, createdAt: true })
export type CreateTalkInput = z.infer<typeof createTalkSchema>
```

### 4. Use Case Pattern

Application logic is encapsulated in use cases:

```typescript
export const createSubmitTalkUseCase = (
  talkRepository: TalkRepository,
  speakerRepository: SpeakerRepository
) => {
  return async (input: SubmitTalkInput): Promise<SubmitTalkResult> => {
    // 1. Validate input
    const validated = submitTalkSchema.parse(input)

    // 2. Business logic
    const speaker = await speakerRepository.findByEmail(validated.email)
      ?? await speakerRepository.create(validated.speaker)

    // 3. Create talk
    const talk = await talkRepository.create({
      ...validated,
      speakerId: speaker.id,
      status: 'submitted'
    })

    return { talkId: talk.id, speakerId: speaker.id }
  }
}
```

### 5. Barrel Files

Each layer exports a public API through `index.ts`:

```typescript
// src/lib/features/cfp/domain/index.ts
export * from './talk'
export * from './speaker'
export * from './review'
export type { Talk, Speaker, Review }
```

## Server-Side Code

Server-only utilities in `/src/lib/server/`:

| File | Purpose |
|------|---------|
| `pocketbase.ts` | PocketBase client initialization |
| `permissions.ts` | Role-based access control |
| `invitations.ts` | Organization invite processing |
| `app-settings.ts` | Application configuration |
| `cfp-notifications.ts` | CFP email templates |
| `billing-notifications.ts` | Order/refund emails |
| `speaker-tokens.ts` | Speaker portal access tokens |

### Permission System

```typescript
// Role hierarchy: admin > organizer > reviewer
export function canManageCfpSettings(role: string): boolean {
  return ['admin', 'organizer'].includes(role)
}

export function canSubmitReviews(role: string): boolean {
  return ['admin', 'organizer', 'reviewer'].includes(role)
}
```

## Route Organization

### Admin Routes (Protected)

```
/admin/
├── +layout.server.ts          # Auth check
├── cfp/[editionSlug]/         # CFP management
├── billing/[editionSlug]/     # Ticketing
├── budget/[editionSlug]/      # Budget
├── planning/[editionSlug]/    # Schedule
├── crm/[editionSlug]/         # Contacts
├── sponsoring/[editionSlug]/  # Sponsors
├── reporting/[editionSlug]/   # Dashboards, alerts & reports
├── organizations/             # Org management
├── events/                    # Event settings
└── editions/                  # Edition settings
```

### Public Routes

```
/
├── auth/login
├── auth/register
├── cfp/[editionSlug]/submit   # Talk submission
├── tickets/[editionSlug]/     # Ticket purchase
├── schedule/[editionSlug]/    # Public schedule
├── speaker/[editionSlug]/     # Speaker portal
├── sponsor/[editionSlug]/     # Sponsor portal
└── sponsors/[editionSlug]/    # Sponsor directory
```

### API Routes

```
/api/
├── billing/webhook/           # Stripe webhooks
└── schedule/[editionSlug]/    # Schedule exports (JSON, iCal)
```

## Data Flow Example

### Creating an Order

```
1. User submits checkout form
   ↓
2. +page.server.ts action handler
   ↓
3. Create repositories (pb dependency injection)
   ↓
4. createCreateOrderUseCase(repos)
   ↓
5. Use case validates tickets (domain logic)
   ↓
6. Repository creates order (infra)
   ↓
7. Returns result to handler
   ↓
8. Redirect to Stripe or confirmation
```

## Testing Strategy

### Unit Tests (Vitest)

- Co-located with source: `*.test.ts`
- Focus on domain logic and schemas
- Mock infrastructure dependencies

```typescript
// domain/talk.test.ts
describe('talkSchema', () => {
  it('validates correct input', () => {
    const result = talkSchema.safeParse(validTalk)
    expect(result.success).toBe(true)
  })

  it('rejects invalid title', () => {
    const result = talkSchema.safeParse({ ...validTalk, title: '' })
    expect(result.success).toBe(false)
  })
})
```

### E2E Tests (Playwright)

- Located in `/tests/e2e/`
- Test complete user flows
- Use data-testid attributes

```typescript
// tests/e2e/cfp-submit.spec.ts
test('submit talk', async ({ page }) => {
  await page.goto('/cfp/devfest-2025/submit')
  await page.fill('[data-testid="title"]', 'My Talk')
  await page.click('[data-testid="submit"]')
  await expect(page).toHaveURL(/confirmation/)
})
```

### Coverage Thresholds

| Metric | Threshold |
|--------|-----------|
| Lines | 80% |
| Functions | 80% |
| Statements | 80% |
| Branches | 60% |

**Excluded from coverage:**
- `infra/` (repositories)
- `usecases/` (integration logic)
- `services/` (external integrations)
- `server/` (server utilities)
- `components/` (UI)

## Code Conventions

### Naming

- Files: `kebab-case.ts`
- Components: `PascalCase.svelte`
- Functions: `camelCase`
- Types/Interfaces: `PascalCase`
- Constants: `SCREAMING_SNAKE_CASE`

### Exports

- Named exports only
- Barrel files for public API
- No default exports

### Clean Code

- Single Responsibility: one function = one purpose
- Functions < 20 lines when possible
- Early returns over nested conditions
- Descriptive names over comments

## Environment Variables

```env
# PocketBase
PUBLIC_POCKETBASE_URL=http://localhost:8090

# Stripe (optional)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# SMTP (defaults to Mailpit in dev)
SMTP_HOST=localhost
SMTP_PORT=1025
```

## Related Documentation

- [Database Seeding](./development/database-seeding.md)
- [CFP Module](./features/cfp-module.md)
- [Billing Module](./features/billing-module.md)
- [Planning Module](./features/planning-module.md)
- [Budget Module](./features/budget-module.md)
- [CRM Module](./features/crm-module.md)
- [Sponsoring Module](./features/sponsoring-module.md)
- [Reporting Module](./features/reporting-module.md)
- [Core Module](./features/core-module.md)
