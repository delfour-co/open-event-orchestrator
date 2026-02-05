# CRM (Contact Relationship Management) Module

The CRM module provides unified contact management, audience segmentation, and email campaigns for events.

## Overview

The CRM module enables:

- **Organizers** to manage contacts across events with a unified profile per person
- **Segmentation** to build dynamic audiences based on rules (source, tags, edition role, check-in status, consent)
- **Email Campaigns** to create, schedule, test, and send targeted emails with template variables
- **GDPR Compliance** with explicit consent tracking (marketing, data sharing, analytics)
- **Import/Export** contacts via CSV with merge/overwrite strategies
- **Auto-sync** from CFP speakers and Billing attendees

## Architecture

```
src/lib/features/crm/
├── domain/                      # Business entities and rules
│   ├── contact.ts               # Contact entity
│   ├── consent.ts               # GDPR consent management
│   ├── segment.ts               # Segment rules and criteria
│   ├── email-campaign.ts        # Campaign lifecycle
│   ├── email-template.ts        # Template interpolation
│   └── contact-edition-link.ts  # Contact-edition role mapping
├── usecases/                    # Application logic
│   ├── sync-contacts.ts         # Auto-sync from CFP/Billing
│   ├── import-contacts.ts       # CSV import with strategies
│   ├── export-contacts.ts       # CSV export with filters
│   ├── evaluate-segment.ts      # Dynamic segment evaluation
│   └── send-campaign.ts         # Campaign sending with consent
├── infra/                       # PocketBase repositories
│   ├── contact-repository.ts
│   ├── consent-repository.ts
│   ├── segment-repository.ts
│   ├── email-campaign-repository.ts
│   ├── email-template-repository.ts
│   └── contact-edition-link-repository.ts
└── ui/                          # (future components)
```

## Routes Structure

### Admin Routes

| Route | Description |
|-------|-------------|
| `/admin/crm` | Event selector — choose which event's contacts to manage |
| `/admin/crm/[eventSlug]` | Contact list with search, filters, stats, and creation |
| `/admin/crm/[eventSlug]/[contactId]` | Contact detail with profile, tags, consents, edition links |
| `/admin/crm/[eventSlug]/segments` | Segment creation, editing, and evaluation |
| `/admin/crm/[eventSlug]/import` | CSV import with duplicate strategy selection |
| `/admin/emails` | Event selector for email campaigns |
| `/admin/emails/[eventSlug]` | Campaign list with create, edit, send, test, cancel, schedule |
| `/admin/emails/[eventSlug]/templates` | Email template management |

### Public Routes

| Route | Description |
|-------|-------------|
| `/unsubscribe/[token]` | One-click unsubscribe from marketing emails |

## Data Model

### Contact

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier |
| `eventId` | string | Scoped to an event |
| `email` | string | Email address (unique per event) |
| `firstName` | string | First name (required) |
| `lastName` | string | Last name (required) |
| `company` | string | Company name |
| `jobTitle` | string | Job title |
| `phone` | string | Phone number |
| `address` | string | Postal address |
| `bio` | string | Short biography |
| `photoUrl` | string | Profile photo URL |
| `twitter` | string | Twitter/X handle |
| `linkedin` | string | LinkedIn profile URL |
| `github` | string | GitHub username |
| `city` | string | City |
| `country` | string | Country |
| `source` | enum | How the contact was created |
| `tags` | string[] | Custom tags for categorization |
| `notes` | string | Free-text notes for traceability |
| `unsubscribeToken` | string | UUID token for one-click unsubscribe |

**Contact Sources:** `speaker`, `attendee`, `sponsor`, `manual`, `import`

### Consent (GDPR)

| Field | Type | Description |
|-------|------|-------------|
| `contactId` | string | Reference to contact |
| `type` | enum | `marketing_email`, `data_sharing`, `analytics` |
| `status` | enum | `granted`, `denied`, `withdrawn` |
| `grantedAt` | date | When consent was granted |
| `withdrawnAt` | date | When consent was withdrawn |
| `source` | enum | `form`, `import`, `api`, `manual` |

### Segment

| Field | Type | Description |
|-------|------|-------------|
| `eventId` | string | Scoped to an event |
| `editionId` | string | Optional edition filter |
| `name` | string | Segment name |
| `criteria` | object | Rules and match mode |
| `isStatic` | boolean | Static vs dynamic evaluation |
| `contactCount` | number | Cached contact count |

### Email Campaign

| Field | Type | Description |
|-------|------|-------------|
| `eventId` | string | Scoped to an event |
| `editionId` | string | Optional edition filter |
| `name` | string | Campaign name |
| `subject` | string | Email subject (supports variables) |
| `bodyHtml` | string | HTML body (supports variables) |
| `bodyText` | string | Plain text body (supports variables) |
| `segmentId` | string | Target segment |
| `templateId` | string | Source template |
| `status` | enum | Campaign lifecycle status |
| `scheduledAt` | date | When to send (for scheduled) |
| `sentAt` | date | When actually sent |
| `totalRecipients` | number | Total targeted contacts |
| `totalSent` | number | Successfully sent emails |
| `totalFailed` | number | Failed email deliveries |

### Contact Edition Link

| Field | Type | Description |
|-------|------|-------------|
| `contactId` | string | Reference to contact |
| `editionId` | string | Reference to edition |
| `roles` | enum[] | `speaker`, `attendee`, `sponsor`, `volunteer`, `organizer` |
| `speakerId` | string | Optional link to CFP speaker record |

## Campaign Status Flow

```
draft → scheduled → sending → sent
  ↓         ↓
  → cancelled ←
```

| Status | Description | Allowed Actions |
|--------|-------------|-----------------|
| `draft` | New campaign being composed | Edit, Send, Schedule, Cancel, Test Send |
| `scheduled` | Queued for future sending | Edit, Cancel |
| `sending` | Currently being sent | Cancel |
| `sent` | Delivery complete | View results |
| `cancelled` | Cancelled by organizer | Delete |

## Features

### 1. Contact Management

Contacts are scoped per event. A DevFest 2025 contact is separate from a DevFest 2026 contact — the `contact_edition_links` table tracks which editions a contact participated in and with which role.

**Create contacts:**
- Manually via the inline creation form
- Auto-sync from CFP speakers and Billing attendees
- CSV import

**Contact detail page:**
- Edit profile information
- Manage tags (add/remove)
- View and manage consents (grant/withdraw)
- View edition participation with roles

### 2. Contact Sync

Auto-sync pulls contacts from two sources:

- **CFP Speakers**: Contacts created from talks, linked to editions with `speaker` role
- **Billing Attendees**: Contacts created from tickets, linked to editions with `attendee` role

Merge behavior:
- If a contact with the same email already exists for the event, empty fields are filled from the source data
- Existing non-empty fields are preserved
- Edition links are created/updated to add new roles

### 3. CSV Import

Supports CSV files with headers in English or French:

| English | French | Required |
|---------|--------|----------|
| `email` | `email` | Yes |
| `firstName` / `first_name` | `prenom` | Yes |
| `lastName` / `last_name` | `nom` | Yes |
| `company` | `entreprise` | No |
| `jobTitle` / `job_title` | `poste` | No |
| `phone` | `telephone` | No |
| `city` | `ville` | No |
| `country` | `pays` | No |
| `tags` | `tags` | No |

**Duplicate strategies:**
- **Skip**: ignore rows where the email already exists
- **Merge**: fill empty fields from the import data (default)
- **Overwrite**: replace all fields with import data

Tags are always merged (union of existing + imported tags).

### 4. CSV Export

Exports contacts as CSV with configurable field selection. Default fields: email, firstName, lastName, company, jobTitle, phone, city, country, source, tags.

Supports segment-based filtering to export only matching contacts.

### 5. Segments

Dynamic segments evaluate rules at query time to produce a list of matching contact IDs.

**Supported rule fields:**

| Field | Type | Description |
|-------|------|-------------|
| `source` | Direct | Filter by contact source |
| `tags` | Direct | Filter by tag values |
| `company` | Direct | Filter by company name |
| `city` | Direct | Filter by city |
| `country` | Direct | Filter by country |
| `edition_role` | Related | Filter by edition role (queries contact_edition_links) |
| `edition_id` | Related | Filter by edition (queries contact_edition_links) |
| `consent_marketing` | Related | Filter by marketing consent status (queries consents) |
| `has_checked_in` | Related | Filter by check-in status (queries tickets) |

**Operators:** `equals`, `not_equals`, `contains`, `not_contains`, `is_empty`, `is_not_empty`, `in`, `not_in`

**Match modes:**
- `all` — intersection of all rule results (AND)
- `any` — union of all rule results (OR)

### 6. Email Campaigns

**Create** a campaign with name, subject, HTML/text body, optional segment and template.

**Edit** draft or scheduled campaigns.

**Test Send** sends a single email to a test address with dummy variables ([TEST] prefix on subject).

**Schedule** sets a future send date (draft campaigns only).

**Send** filters recipients by marketing consent, interpolates template variables, generates unsubscribe tokens, and sends emails individually with error tracking.

**Cancel** marks draft or scheduled campaigns as cancelled.

### 7. Email Templates

Templates use `{{variable}}` syntax for interpolation.

| Variable | Description |
|----------|-------------|
| `{{firstName}}` | Contact first name |
| `{{lastName}}` | Contact last name |
| `{{email}}` | Contact email |
| `{{company}}` | Contact company |
| `{{eventName}}` | Event name |
| `{{editionName}}` | Edition name |
| `{{unsubscribeUrl}}` | One-click unsubscribe link |

### 8. GDPR Consent Management

Three consent types with explicit status tracking:

| Type | Description |
|------|-------------|
| `marketing_email` | Permission to send marketing emails |
| `data_sharing` | Permission to share data with third parties |
| `analytics` | Permission for analytics tracking |

Consent can be:
- **Granted** or **Withdrawn** manually by an organizer
- **Withdrawn** by the contact via the unsubscribe link

Campaign sending respects consent: only contacts with `marketing_email = granted` receive emails.

### 9. Unsubscribe Mechanism

Each contact gets a UUID-based `unsubscribeToken` generated at campaign send time.

The unsubscribe URL (`/unsubscribe/[token]`) provides:
- Token lookup to identify the contact
- One-click consent withdrawal for `marketing_email`
- Confirmation page (already unsubscribed vs. unsubscribe button)

## Database Collections

| Collection | Description |
|------------|-------------|
| `contacts` | Contact profiles (scoped per event) |
| `consents` | GDPR consent records |
| `segments` | Segment definitions with criteria |
| `email_campaigns` | Campaign configuration and status |
| `email_templates` | Reusable email templates |
| `contact_edition_links` | Contact-to-edition role mappings |

## Testing

### Unit Tests

Tests located in `src/lib/features/crm/domain/*.test.ts`:
- Contact helpers (fullName, initials, search, social profiles)
- Consent status checks (isActive, canSendMarketing, canShareData)
- Segment helpers (isDynamic, hasRules, field/operator labels)
- Campaign lifecycle (canEdit, canSend, canSchedule, canCancel, successRate)
- Template interpolation and variable extraction
- Edition link role checks

Tests located in `src/lib/features/crm/usecases/*.test.ts`:
- CSV parsing (parseCsvLine, parseCsvToRows)
- Import with strategies (skip, merge, overwrite)
- Export with field selection and CSV escaping
- Segment evaluation (direct rules, related rules, set operations)
- Campaign sending with consent filtering and error handling
- Contact sync from speakers and attendees

### E2E Tests

Tests located in `tests/e2e/crm.spec.ts`:
- CRM event selector navigation
- Contact list display, search, and filtering
- Contact creation, editing, and deletion
- Segment creation and editing
- Campaign creation, editing, cancellation
- Email template management

## Usage Examples

### Evaluate a Segment

```typescript
import { createEvaluateSegmentUseCase } from '$lib/features/crm/usecases'

const evaluate = createEvaluateSegmentUseCase(pb)
const contactIds = await evaluate({
  id: 'seg-1',
  eventId: 'evt-1',
  name: 'Speakers from Paris',
  criteria: {
    match: 'all',
    rules: [
      { field: 'source', operator: 'equals', value: 'speaker' },
      { field: 'city', operator: 'equals', value: 'Paris' }
    ]
  },
  isStatic: false,
  contactCount: 0,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

### Send a Campaign

```typescript
import { createSendCampaignUseCase } from '$lib/features/crm/usecases'

const sendCampaign = createSendCampaignUseCase(pb)
const result = await sendCampaign('campaign-id')
// result: { totalRecipients: 50, totalSent: 48, totalFailed: 2, errors: [...] }
```

### Import Contacts from CSV

```typescript
import { createImportContactsUseCase, parseCsvToRows } from '$lib/features/crm/usecases'

const rows = parseCsvToRows(csvString)
const importContacts = createImportContactsUseCase(pb)
const result = await importContacts('event-id', rows, 'merge')
// result: { total: 100, created: 80, updated: 15, skipped: 5, errors: [] }
```

## Related Documentation

- [Database Seeding](../development/database-seeding.md) - Test data setup
- [CFP Module](cfp-module.md) - Speaker management (sync source)
