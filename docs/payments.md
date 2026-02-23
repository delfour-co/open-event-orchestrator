# Payment Integration Guide

This document covers the payment architecture, provider configuration, and compliance rules for Open Event Orchestrator.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Payment Flow](#payment-flow)
3. [Configuring Stripe](#configuring-stripe)
4. [Configuring HelloAsso](#configuring-helloasso)
5. [Admin Configuration](#admin-configuration)
6. [Adding a New Payment Provider](#adding-a-new-payment-provider)
7. [Webhook Handling](#webhook-handling)
8. [Invoice Compliance](#invoice-compliance)
9. [Provider Feature Matrix](#provider-feature-matrix)
10. [Environment Variables](#environment-variables)
11. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

The billing module uses a **provider abstraction layer** that decouples checkout logic from specific payment APIs.

```
src/lib/features/billing/services/
  payment-providers/
    types.ts              # PaymentProvider interface
    factory.ts            # Provider factory (reads config from DB)
    stripe-provider.ts    # Stripe implementation
    none-provider.ts      # No-op provider (dev/free orders)
  helloasso/
    token-manager.ts      # OAuth2 token lifecycle
    api-client.ts         # HelloAsso REST client
    helloasso-provider.ts # HelloAsso implementation
  stripe-service.ts       # Low-level Stripe SDK wrapper
  payment-resilience.ts   # Idempotence (processed_payment_events)
  pdf-invoice-service.ts  # Ticket invoice PDF generation
  pdf-credit-note-service.ts  # Ticket credit note PDF
  pdf-shared.ts           # Shared PDF utilities (seller block, legal mentions)
```

### Key interfaces

```typescript
// payment-providers/types.ts
interface PaymentProvider {
  readonly type: 'stripe' | 'helloasso' | 'none'
  createCheckout(input: CreateCheckoutInput): Promise<CheckoutResult>
  createRefund(paymentReference: string): Promise<RefundResult>
  parseWebhookEvent(request: { body: string | Buffer; headers: Record<string, string> }): Promise<PaymentEvent>
}
```

The active provider is configured per-organization via the Admin UI and stored in the `app_settings` PocketBase collection.

---

## Payment Flow

```
User selects tickets/package
        |
        v
Checkout form (name, email, billing address)
        |
        v
Server creates order/sponsor (status: "pending")
        |
        v
  +--- Is total = 0? ---+
  |                      |
 YES                    NO
  |                      |
  v                      v
Complete order      provider.createCheckout()
immediately         stores sessionId on order
  |                      |
  v                      v
Confirmation        Redirect to provider
page                payment page
                         |
                         v
                    User pays on provider
                         |
                         v
                    Provider sends webhook
                    POST /api/billing/webhook
                         |
                         v
                    Idempotence check
                    (processed_payment_events)
                         |
                         v
                    Route by metadata:
                    - type=sponsor_package -> sponsor handler
                    - orderId -> ticket handler
                         |
                         v
                    Complete order / create sponsor
                    Generate invoice PDF
                    Send confirmation email
                         |
                         v
                    Return { received: true }
```

---

## Configuring Stripe

### 1. Get API keys

1. Go to [Stripe Dashboard (test mode)](https://dashboard.stripe.com/test/apikeys)
2. Copy the **Secret key** (`sk_test_...`) and **Publishable key** (`pk_test_...`)

### 2. Configure in Admin UI

Navigate to your **Organization Settings** and enter:
- **Stripe Secret Key**: `sk_test_...`
- **Stripe Publishable Key**: `pk_test_...`
- **Active Payment Provider**: `stripe`

Or set via environment variables:

```env
STRIPE_SECRET_KEY=sk_test_your_key_here
PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
```

### 3. Set up webhooks

**Local development** (recommended):

```bash
# Start Stripe CLI via Docker Compose
docker compose --profile stripe up
```

This automatically forwards webhooks to `http://localhost:3000/api/billing/webhook`. The webhook secret is printed on startup — copy it to your settings.

**Production**:

1. Go to [Stripe Webhooks](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://your-domain.com/api/billing/webhook`
3. Select events:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `charge.refunded`
4. Copy the signing secret (`whsec_...`) to your settings

### 4. Test cards

| Card Number | Result |
|---|---|
| `4242 4242 4242 4242` | Success |
| `4000 0000 0000 3220` | 3D Secure required |
| `4000 0000 0000 0002` | Declined |

Use any future expiry date and any 3-digit CVC.

### Example webhook payload (checkout.session.completed)

```json
{
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_test_abc123",
      "payment_intent": "pi_test_xyz789",
      "metadata": {
        "orderId": "order_abc123",
        "orderNumber": "ORD-2026-000001"
      }
    }
  }
}
```

For sponsor checkouts:

```json
{
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_test_abc123",
      "payment_intent": "pi_test_xyz789",
      "metadata": {
        "type": "sponsor_package",
        "editionId": "edition_abc",
        "packageId": "pkg_gold",
        "companyName": "ACME Corp",
        "legalName": "ACME SAS",
        "vatNumber": "FR12345678901",
        "billingAddress": "1 rue de la Paix",
        "billingCity": "Paris",
        "billingPostalCode": "75001",
        "billingCountry": "France",
        "poNumber": "PO-2026-042"
      }
    }
  }
}
```

---

## Configuring HelloAsso

### 1. Create an API account

1. Go to [HelloAsso Partner Portal](https://www.helloasso.com/partenaires)
2. Create an API application
3. Obtain your **Client ID** and **Client Secret**

### 2. Configure in Admin UI

Navigate to your **Organization Settings** and enter:
- **HelloAsso Client ID**
- **HelloAsso Client Secret**
- **HelloAsso Organization Slug**: Your organization's slug on HelloAsso
- **HelloAsso API Base URL**: `https://api.helloasso.com` (production) or `https://api.helloasso-sandbox.com` (sandbox)
- **Active Payment Provider**: `helloasso`

### 3. Webhook setup

HelloAsso webhooks are verified via API call (no HMAC signature). Configure your webhook URL in the HelloAsso dashboard:
- URL: `https://your-domain.com/api/billing/webhook`
- Events: Payment notifications

### 4. Sandbox testing

HelloAsso provides a sandbox environment for testing. Use the sandbox API base URL and sandbox credentials.

### Key differences from Stripe

- HelloAsso only supports **EUR** currency
- Refunds return status `'pending'` (processed asynchronously by HelloAsso)
- Webhook verification is done via API callback, not HMAC signature
- OAuth2 token management with automatic refresh

### Example webhook payload (Payment notification)

```json
{
  "eventType": "Payment",
  "data": {
    "id": 12345,
    "amount": 50000,
    "state": "Authorized",
    "order": {
      "id": 67890,
      "metadata": {
        "orderId": "order_abc123"
      }
    }
  }
}
```

---

## Admin Configuration

The payment provider is configured at the organization level via the Admin UI.

### Steps

1. Go to **Admin > Organization Settings**
2. In the **Payment Provider** section, select:
   - **Stripe** for card payments
   - **HelloAsso** for HelloAsso-based payments
   - **None** for free-only events (or development)
3. Enter the required credentials for the selected provider
4. Save settings

The configuration is stored in the `app_settings` PocketBase collection and read by `getPaymentProvider()` at checkout time.

---

## Adding a New Payment Provider

To add a new payment provider (e.g., PayPal, Mollie):

### 1. Create the provider file

```typescript
// src/lib/features/billing/services/payment-providers/my-provider.ts
import type { PaymentProvider, CreateCheckoutInput, CheckoutResult, RefundResult, PaymentEvent } from './types'

export interface MyProviderConfig {
  apiKey: string
  webhookSecret: string
}

export const createMyProvider = (config: MyProviderConfig): PaymentProvider => ({
  type: 'my-provider' as any, // Add to PaymentProviderType union first

  async createCheckout(input: CreateCheckoutInput): Promise<CheckoutResult> {
    // Call your provider's API to create a checkout session
    // Return { sessionId, redirectUrl, expiresAt? }
  },

  async createRefund(paymentReference: string): Promise<RefundResult> {
    // Call your provider's refund API
    // Return { refundId, status: 'succeeded' | 'pending' | 'failed' }
  },

  async parseWebhookEvent(request): Promise<PaymentEvent> {
    // Validate the webhook signature
    // Parse the event body
    // Return { type, eventId, metadata, paymentReference? }
  }
})
```

### 2. Update the type union

```typescript
// payment-providers/types.ts
export type PaymentProviderType = 'stripe' | 'helloasso' | 'my-provider' | 'none'
```

### 3. Register in the factory

```typescript
// payment-providers/factory.ts
case 'my-provider':
  return createMyProvider({ apiKey: settings.myApiKey, webhookSecret: settings.myWebhookSecret })
```

### 4. Add admin UI fields

Add configuration fields in the organization settings page for the new provider's credentials.

### 5. Write tests

Add unit tests following the pattern in `payment-providers/stripe-provider.test.ts`:
- Checkout creation
- Refund handling
- Webhook parsing and validation

---

## Webhook Handling

All webhooks are received at a single endpoint:

```
POST /api/billing/webhook
```

### Processing pipeline

1. **Signature validation**: Stripe uses HMAC (`stripe-signature` header), HelloAsso uses API verification
2. **Idempotence check**: Each event ID is checked against `processed_payment_events` collection
3. **Event routing**:
   - If metadata contains `type: 'sponsor_package'` → `handleSponsorCheckoutCompleted()`
   - If metadata contains `orderId` → ticket order completion
4. **Processing**: Complete order, generate invoice, send email
5. **Mark processed**: Store event ID in `processed_payment_events`

### Idempotence

The `processed_payment_events` collection stores:
- `eventId` (unique): Provider's event identifier
- `provider`: `'stripe'` | `'helloasso'`
- `processedAt`: Timestamp

This prevents duplicate processing when providers retry webhook delivery.

---

## Invoice Compliance

### French invoice mandatory mentions

All generated invoices (tickets and sponsors) include the following legally required mentions:

| Mention | Location |
|---|---|
| Seller identity (name, legal form) | Top-right seller block |
| SIRET number | Seller block |
| VAT number (if applicable) | Seller block |
| RCS/RNA number | Seller block |
| Share capital | Seller block |
| Seller address | Seller block |
| Invoice number (sequential) | Header |
| Invoice date | Header |
| Due date | Header |
| Buyer identity and address | Bill-to section |
| Line items (description, qty, unit price HT, total HT) | Items table |
| Subtotal HT | Summary |
| VAT rate and amount | Summary |
| Total TTC | Summary |
| Payment terms | Legal footer |
| Late payment penalties | Legal footer |
| Early payment discount | Legal footer |
| Recovery indemnity (40 EUR) | Legal footer |

### VAT handling

| Scenario | VAT Rate | Mention |
|---|---|---|
| Standard French sale | 20% | TVA 20% |
| VAT-exempt (art. 293 B du CGI) | 0% | "TVA non applicable, art. 293 B du CGI" |
| Intracommunity reverse charge | 0% | "Autoliquidation — art. 283-2 du CGI" |

Intracommunity reverse charge is automatically detected when:
- The sponsor has a VAT number, AND
- The sponsor's country differs from the seller's country

### Invoice numbering

- **Ticket invoices**: `F-YYYY-NNNNNN` (e.g., `F-2026-000001`)
- **Sponsor invoices**: `SPO-YYYYMMDD-XXXXXX` (e.g., `SPO-20260215-a1b2c3`)
- **Ticket credit notes**: `AV-YYYY-NNNNNN`
- **Sponsor credit notes**: `AV-SPO-YYYYMMDD-XXXXXX`

### Credit notes

Credit notes always reference:
- Original invoice number
- Original invoice date
- Amounts shown as negative values

---

## Provider Feature Matrix

| Feature | Stripe | HelloAsso | None (dev) |
|---|---|---|---|
| Card payments | Yes | No (bank transfer) | No |
| Currencies | Multi (EUR, USD, GBP...) | EUR only | N/A |
| Instant refunds | Yes | Pending (async) | N/A |
| Partial refunds | Yes | Yes | N/A |
| Webhook signature | HMAC (stripe-signature) | API verification | N/A |
| 3D Secure | Yes | N/A | N/A |
| Recurring payments | Yes (not used) | No | N/A |
| Sandbox/test mode | Test keys | Sandbox API | Always |
| OAuth tokens | No (API keys) | Yes (auto-refresh) | N/A |
| Free orders | Skipped (direct complete) | Skipped | Auto-complete |

---

## Environment Variables

### Required

```env
# PocketBase
PUBLIC_POCKETBASE_URL=http://localhost:8090
```

### Stripe (optional — can be configured via Admin UI)

```env
STRIPE_SECRET_KEY=sk_test_...
PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_API_BASE=                    # Leave empty for real Stripe API
```

### HelloAsso

HelloAsso credentials are configured exclusively via the Admin UI (Organization Settings):
- Client ID
- Client Secret
- Organization Slug
- API Base URL

No environment variables are needed for HelloAsso.

### SMTP (for confirmation emails and invoices)

```env
SMTP_HOST=localhost                 # Mailpit in dev
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@your-domain.com
```

---

## Troubleshooting

### Webhook not received

- **Stripe local dev**: Ensure `docker compose --profile stripe up` is running
- **Stripe production**: Check the webhook endpoint URL and signing secret
- **HelloAsso**: Verify the webhook URL is configured in the HelloAsso dashboard

### Duplicate webhook processing

The idempotence system prevents duplicates. Check the `processed_payment_events` collection in PocketBase admin if events are being skipped unexpectedly.

### Invoice PDF not generated

- Check that seller information is configured in Organization Settings (SIRET, VAT number, address)
- Check server logs for PDF generation errors
- Verify that `pdf-lib` is installed

### HelloAsso token errors

- Tokens are auto-refreshed with a 2-minute margin before expiry
- If persistent errors occur, check Client ID/Secret in Organization Settings
- Verify the API base URL matches your environment (production vs sandbox)

### Free orders not completing

- Free orders (total = 0) bypass the payment provider entirely
- They complete immediately and redirect to the confirmation page
- If not working, check order creation logic in the checkout server action
