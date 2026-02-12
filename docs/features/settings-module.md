# Settings Module

The settings module provides global application configuration for integrations, email, and payment processing.

## Overview

The settings module manages:
- **SMTP Configuration**: Email delivery settings
- **Stripe Configuration**: Payment processing settings
- **Slack Configuration**: Team notifications
- **Integrations Dashboard**: Overview of all third-party services

## Architecture

```
src/lib/server/
├── app-settings.ts              # Settings service
├── app-settings.test.ts         # Unit tests
├── integration-registry.ts      # Integration types and metadata
├── integration-registry.test.ts # Unit tests
├── integration-service.ts       # Integration status checking
└── integration-service.test.ts  # Unit tests

src/routes/admin/settings/
├── +page.server.ts              # SMTP settings server
├── +page.svelte                 # SMTP settings UI
├── integrations/
│   ├── +page.server.ts          # Dashboard server
│   └── +page.svelte             # Dashboard UI
└── stripe/
    ├── +page.server.ts          # Stripe settings server
    └── +page.svelte             # Stripe settings UI
```

## Integrations Dashboard

The integrations dashboard provides a unified view of all third-party service connections.

### Features

- **Summary Statistics**: Count of connected, not configured, and error states
- **Integration Cards**: Visual cards for each integration with status
- **Quick Configuration**: Direct links to configure each integration
- **Status Details**: Additional context like host, port, or mode

### Supported Integrations

| Integration | Description | Status |
|-------------|-------------|--------|
| SMTP | Email delivery | Available |
| Stripe | Payment processing | Available |
| Slack | Team notifications | Available |
| Discord | Team notifications | Coming soon |
| Webhooks | External notifications | Available |

### Integration Status Types

| Status | Description |
|--------|-------------|
| `connected` | Integration is configured and working |
| `not_configured` | Integration needs configuration |
| `error` | Integration has a problem |

## SMTP Configuration

Email settings for sending notifications, invitations, and confirmations.

### Settings

| Field | Description | Default |
|-------|-------------|---------|
| `smtpHost` | SMTP server hostname | localhost |
| `smtpPort` | SMTP server port | 1025 |
| `smtpUser` | Authentication username | (empty) |
| `smtpPass` | Authentication password | (empty) |
| `smtpFrom` | Sender email address | noreply@open-event-orchestrator.local |
| `smtpEnabled` | Enable/disable email sending | true |

### Common Ports

| Port | Protocol |
|------|----------|
| 25 | SMTP (unencrypted) |
| 465 | SMTP over SSL |
| 587 | SMTP with STARTTLS |
| 1025 | Mailpit (local dev) |

### Test Email

The settings page includes a test email feature to verify configuration:
1. Enter a recipient email address
2. Click "Send Test"
3. Check for success message or error

## Stripe Configuration

Payment processing settings for ticket sales.

### Settings

| Field | Description |
|-------|-------------|
| `stripeSecretKey` | Server-side API key (sk_test_* or sk_live_*) |
| `stripePublishableKey` | Client-side API key (pk_test_* or pk_live_*) |
| `stripeWebhookSecret` | Webhook signature verification (whsec_*) |
| `stripeEnabled` | Enable/disable payments |

### Mode Detection

The system automatically detects test vs live mode from the secret key prefix:
- `sk_test_*` → Test mode
- `sk_live_*` → Live mode

### Validation

Keys are validated for:
- **Format**: Must match expected prefix
- **Mode consistency**: Secret and publishable keys must be same mode
- **Connection**: Test connection verifies API access

### Test Connection

The Stripe settings page includes connection testing:
1. Save your secret key
2. Click "Test Connection"
3. On success, shows Stripe account name and ID
4. On failure, shows error message

### Webhook Endpoint

Configure this URL in Stripe dashboard:
```
https://your-domain.com/api/billing/webhook
```

Required events:
- `checkout.session.completed`
- `checkout.session.expired`
- `charge.refunded`

## Slack Configuration

Team notification settings for Slack workspace integration.

### Settings

| Field | Description | Default |
|-------|-------------|---------|
| `slackWebhookUrl` | Incoming webhook URL | (empty) |
| `slackEnabled` | Enable/disable notifications | false |
| `slackDefaultChannel` | Default channel for messages | #general |

### Setup

1. Create an incoming webhook in Slack
2. Copy the webhook URL
3. Paste in settings and enable

## API Reference

### Settings Service

```typescript
import {
  getSmtpSettings,
  saveSmtpSettings,
  getStripeSettings,
  saveStripeSettings,
  testStripeConnection,
  getSlackSettings,
  saveSlackSettings
} from '$lib/server/app-settings'

// Get SMTP settings
const smtp = await getSmtpSettings(pb)

// Save SMTP settings
await saveSmtpSettings(pb, {
  smtpHost: 'smtp.example.com',
  smtpPort: 587,
  smtpUser: 'user',
  smtpPass: 'pass',
  smtpFrom: 'noreply@example.com',
  smtpEnabled: true
})

// Get Stripe settings (includes mode and isConfigured)
const stripe = await getStripeSettings(pb)
console.log(stripe.mode) // 'test' or 'live'
console.log(stripe.isConfigured) // boolean

// Test Stripe connection
const result = await testStripeConnection('sk_test_xxx')
if (result.success) {
  console.log(result.message, result.accountId)
}

// Get Slack settings
const slack = await getSlackSettings(pb)
```

### Integration Service

```typescript
import {
  checkIntegrationStatus,
  getAllIntegrationStatuses,
  createIntegrationService
} from '$lib/server/integration-service'

// Check single integration
const smtp = await checkIntegrationStatus(pb, 'smtp')
console.log(smtp.status.status) // 'connected' | 'not_configured' | 'error'
console.log(smtp.status.message) // Human-readable message

// Get all integrations
const all = await getAllIntegrationStatuses(pb)

// Create service instance
const service = createIntegrationService(pb)
const isStripeConnected = await service.isConnected('stripe')
```

### Helper Functions

```typescript
import {
  getStripeMode,
  isStripeConfigured,
  maskStripeKey,
  isSlackConfigured
} from '$lib/server/app-settings'

// Detect mode from key
getStripeMode('sk_live_xxx') // 'live'
getStripeMode('sk_test_xxx') // 'test'

// Check if fully configured
isStripeConfigured(settings) // boolean

// Mask sensitive keys for display
maskStripeKey('sk_test_1234567890abcdef')
// 'sk_test_••••••••cdef'

// Check Slack configuration
isSlackConfigured(settings) // boolean
```

## Database Schema

### app_settings Collection

Single record containing all application settings.

| Field | Type | Description |
|-------|------|-------------|
| id | text | Primary key |
| smtpHost | text | SMTP server hostname |
| smtpPort | number | SMTP server port |
| smtpUser | text | SMTP username |
| smtpPass | text | SMTP password |
| smtpFrom | email | Sender email address |
| smtpEnabled | bool | Email enabled flag |
| stripeSecretKey | text | Stripe secret API key |
| stripePublishableKey | text | Stripe publishable API key |
| stripeWebhookSecret | text | Stripe webhook secret |
| stripeEnabled | bool | Stripe enabled flag |
| slackWebhookUrl | url | Slack webhook URL |
| slackEnabled | bool | Slack enabled flag |
| slackDefaultChannel | text | Default Slack channel |
| discordWebhookUrl | url | Discord webhook (future) |
| discordEnabled | bool | Discord enabled (future) |

## Admin Routes

| Route | Description |
|-------|-------------|
| `/admin/settings` | SMTP configuration |
| `/admin/settings/integrations` | Integrations dashboard |
| `/admin/settings/stripe` | Stripe configuration |
| `/admin/settings/slack` | Slack configuration (future) |
| `/admin/settings/webhooks` | Webhooks configuration (future) |

## Security

### Key Storage

- All sensitive keys are stored in the database
- Keys are never exposed in client-side code
- Masked display shows only prefix and last 4 characters

### Environment Variable Fallback

Stripe settings fall back to environment variables if not configured in database:
- `STRIPE_SECRET_KEY`
- `PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`

### Access Control

Settings pages require admin or organizer role. The `canAccessSettings()` function validates access.

## Testing

### Unit Tests

```bash
# Run settings unit tests
pnpm test src/lib/server/app-settings.test.ts
pnpm test src/lib/server/integration-registry.test.ts
pnpm test src/lib/server/integration-service.test.ts
```

### E2E Tests

```bash
# Run settings E2E tests
pnpm test:e2e tests/e2e/admin-settings.spec.ts
```

## Related Documentation

- [API Module](./api-module.md) - Slack integration and event bus
- [Billing Module](./billing-module.md) - Stripe payment processing
- [CRM Module](./crm-module.md) - Email templates and campaigns
