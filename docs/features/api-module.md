# API Module

The API module provides a public REST API for integrating Open Event Orchestrator with external systems, websites, and mobile applications. It also includes an internal event bus for decoupled integrations and Slack notifications.

## Features

### REST API Endpoints

- **Organizations** - List and retrieve organizations
- **Events** - List and retrieve events
- **Editions** - List and retrieve editions with nested resources
- **Speakers** - List and retrieve speakers
- **Sessions** - List and retrieve sessions
- **Schedule** - Get complete schedule for an edition
- **Ticket Types** - List available ticket types
- **Sponsors** - List confirmed sponsors

### API Key Authentication

API keys use Bearer token authentication:

```bash
curl -H "Authorization: Bearer oeo_live_xxxxx" \
  https://your-instance.com/api/v1/editions
```

Key features:
- Secure key generation with SHA-256 hashing
- Key prefix (`oeo_live_` or `oeo_test_`) for identification
- Scoped permissions (organization, event, or edition level)
- Rate limiting (configurable per key)
- Expiration dates (optional)
- Activity tracking (last used timestamp)

### OpenAPI Documentation

Interactive API documentation is available at `/api/docs` using Swagger UI.

The OpenAPI 3.1 specification is served at `/api/v1/openapi.json`.

### Webhooks

Outgoing webhooks notify external services of events:

**Supported Events:**
- `talk.submitted` - New talk submitted
- `talk.accepted` - Talk accepted
- `talk.rejected` - Talk rejected
- `order.created` - New order created
- `order.completed` - Order payment completed
- `order.refunded` - Order refunded
- `ticket.checked_in` - Ticket checked in
- `sponsor.confirmed` - Sponsor confirmed

**Security:**
- HMAC-SHA256 payload signing
- Signature header: `X-OEO-Signature: sha256=...`
- Configurable retry attempts with exponential backoff

### Embeddable Widgets

Web components for embedding on external websites:

```html
<!-- Schedule Widget -->
<script src="https://your-instance.com/widgets/oeo-schedule.js"></script>
<oeo-schedule
  api-url="https://your-instance.com/api/v1"
  api-key="oeo_live_xxxxx"
  edition-id="abc123">
</oeo-schedule>

<!-- Speakers Widget -->
<oeo-speakers
  api-url="https://your-instance.com/api/v1"
  api-key="oeo_live_xxxxx"
  edition-id="abc123">
</oeo-speakers>

<!-- Ticket Button Widget -->
<oeo-tickets
  api-url="https://your-instance.com/api/v1"
  api-key="oeo_live_xxxxx"
  edition-id="abc123">
</oeo-tickets>
```

## Architecture

```
src/lib/features/api/
├── domain/
│   ├── api-key.ts           # API key schema, types, permissions
│   └── webhook.ts           # Webhook events, types
├── infra/
│   ├── api-key-repository.ts
│   ├── api-request-log-repository.ts
│   ├── webhook-repository.ts
│   └── webhook-delivery-repository.ts
├── services/
│   ├── api-key-service.ts        # Generate, validate, revoke
│   ├── rate-limiter-service.ts   # Sliding window rate limit
│   └── webhook-dispatcher.ts     # Trigger and deliver
└── openapi/
    └── spec.ts              # OpenAPI specification builder
```

## Database Schema

### api_keys

| Field | Type | Description |
|-------|------|-------------|
| id | text | Primary key |
| name | text | Display name |
| keyHash | text | SHA-256 hash of the key |
| keyPrefix | text | First 12 chars for lookup |
| organizationId | relation | Scope to organization (optional) |
| eventId | relation | Scope to event (optional) |
| editionId | relation | Scope to edition (optional) |
| permissions | json | Array of permission strings |
| rateLimit | number | Requests per minute (default: 60) |
| lastUsedAt | date | Last API call timestamp |
| expiresAt | date | Expiration date (optional) |
| isActive | boolean | Active status |
| createdBy | relation | User who created the key |

### webhooks

| Field | Type | Description |
|-------|------|-------------|
| id | text | Primary key |
| name | text | Display name |
| url | url | Endpoint URL |
| secret | text | HMAC signing secret |
| organizationId | relation | Scope (optional) |
| eventId | relation | Scope (optional) |
| editionId | relation | Scope (optional) |
| events | json | Array of event types to subscribe |
| isActive | boolean | Active status |
| headers | json | Custom headers |
| retryCount | number | Retry attempts (0-10) |
| createdBy | relation | User who created the webhook |

### webhook_deliveries

| Field | Type | Description |
|-------|------|-------------|
| id | text | Primary key |
| webhookId | relation | Parent webhook |
| event | text | Event type |
| payload | json | Request payload |
| statusCode | number | Response status |
| responseBody | text | Response body |
| attempt | number | Attempt number |
| nextRetryAt | date | Next retry scheduled |
| deliveredAt | date | Successful delivery timestamp |
| error | text | Error message if failed |

### api_request_logs

| Field | Type | Description |
|-------|------|-------------|
| id | text | Primary key |
| apiKeyId | relation | API key used |
| method | text | HTTP method |
| path | text | Request path |
| statusCode | number | Response status |
| responseTimeMs | number | Response time in ms |
| ipAddress | text | Client IP |
| userAgent | text | Client user agent |

## API Response Format

### Success Response

```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "perPage": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### Error Response

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "API key required"
  }
}
```

## Permissions

| Permission | Description |
|------------|-------------|
| `read:organizations` | List and view organizations |
| `read:events` | List and view events |
| `read:editions` | List and view editions |
| `read:speakers` | List and view speakers |
| `read:talks` | List and view talks |
| `read:sessions` | List and view sessions |
| `read:schedule` | Get full schedule |
| `read:ticket-types` | List ticket types |
| `read:sponsors` | List sponsors |
| `write:orders` | Create orders |

## Admin UI

The API module includes admin pages for managing:

- **API Dashboard** (`/admin/api`) - Overview with stats and recent activity
- **API Keys** (`/admin/api/keys`) - List, create, revoke API keys
- **Webhooks** (`/admin/api/webhooks`) - Configure and monitor webhooks

## Internal Event Bus

The event bus provides a decoupled pub/sub system for internal integrations.

### Supported Events

| Category | Events |
|----------|--------|
| **CFP** | `talk.submitted`, `talk.accepted`, `talk.rejected`, `talk.withdrawn`, `talk.confirmed`, `talk.declined`, `review.created`, `review.updated` |
| **Billing** | `order.created`, `order.completed`, `order.cancelled`, `order.refunded`, `ticket.generated`, `ticket.checked_in` |
| **CRM** | `contact.created`, `contact.updated`, `contact.deleted`, `segment.updated`, `campaign.sent` |
| **Planning** | `session.created`, `session.updated`, `session.deleted`, `schedule.published` |
| **Sponsoring** | `sponsor.created`, `sponsor.confirmed`, `sponsor.payment_received` |

### Usage

```typescript
import { eventBus } from '$lib/server/event-bus'

// Subscribe to events
eventBus.subscribe('order.completed', async (event) => {
  console.log('Order completed:', event.payload.orderId)
})

// Subscribe with priority (higher = first)
eventBus.subscribe('talk.submitted', handler, { priority: 10 })

// Subscribe to all events in a category
eventBus.subscribe('order.*', allOrdersHandler)

// Emit events (fire-and-forget)
eventBus.emit('order.completed', {
  orderId: 'order-123',
  editionId: 'edition-456',
  customerEmail: 'customer@example.com',
  totalAmount: 5000,
  itemCount: 2,
  timestamp: new Date()
})

// Emit and wait for all handlers
await eventBus.emitAndWait('order.completed', payload)
```

### Features

- **Fire-and-forget**: `emit()` returns immediately, handlers run async
- **Handler isolation**: One handler failure doesn't affect others
- **Priority ordering**: Higher priority handlers execute first
- **Wildcard subscriptions**: Subscribe to `category.*` patterns
- **Event logging**: All events logged for debugging

## Slack Integration

Send notifications to Slack channels for important events.

### Notification Types

| Type | Description |
|------|-------------|
| `new_talk_submitted` | New CFP submission received |
| `talk_accepted` | Talk accepted by reviewers |
| `talk_rejected` | Talk rejected |
| `new_order` | New ticket order created |
| `order_completed` | Payment received |
| `order_refunded` | Order refunded |
| `ticket_checked_in` | Attendee checked in |
| `sponsor_confirmed` | New sponsor confirmed |
| `daily_summary` | Daily stats summary |
| `custom` | Custom message |

### Configuration

```typescript
import { createSlackService } from '$lib/server/slack-service'

const slack = createSlackService({
  webhookUrl: 'https://hooks.slack.com/services/...',
  defaultChannel: '#events',
  enabled: true
})

// Send notification
await slack.notify('new_order', {
  orderNumber: 'ORD-123',
  customerName: 'John Doe',
  amount: 150,
  currency: 'EUR',
  ticketCount: 2
})

// Send custom message
await slack.sendMessage({
  channel: '#alerts',
  text: 'Important notification',
  blocks: [
    header('Alert'),
    section('Something happened'),
    divider()
  ]
})
```

### Block Kit Helpers

```typescript
import { header, section, divider, context, fieldsSection } from '$lib/server/slack-service'

const blocks = [
  header('New Order Received'),
  section('*Order #ORD-123* has been placed'),
  fieldsSection([
    '*Customer*\nJohn Doe',
    '*Amount*\n€150.00'
  ]),
  divider(),
  context('Received at 2025-02-12 10:30')
]
```

### Event Bus Integration

Slack notifications are automatically triggered via event bus subscriptions:

```typescript
// In slack-service.ts
eventBus.subscribe('order.completed', async (event) => {
  await slack.notify('order_completed', {
    orderNumber: event.payload.orderNumber,
    // ...
  })
})
```

## Testing

```bash
# Run API tests
pnpm test:e2e tests/e2e/api-admin.spec.ts
pnpm test:e2e tests/e2e/api-v1.spec.ts

# Run unit tests
pnpm test src/lib/features/api/
pnpm test src/lib/server/event-bus.test.ts
pnpm test src/lib/server/slack-service.test.ts
```
