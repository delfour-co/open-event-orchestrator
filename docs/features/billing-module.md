# Billing Module

The billing module handles ticket sales, payment processing, order management, and check-in functionality for event editions.

## Overview

The billing module provides:
- **Ticket Types**: Configure different ticket tiers with pricing, quantities, and sales windows
- **Order Management**: Create, complete, cancel, and refund orders
- **Payment Integration**: Stripe Checkout for paid tickets
- **Ticket Generation**: QR codes for digital tickets
- **Check-in System**: Validate and scan tickets at the event
- **Email Notifications**: Order confirmations and refund notifications
- **Waitlist**: Allow attendees to join a waitlist when tickets are sold out

## Architecture

```
billing/
├── domain/                    # Business entities & rules
│   ├── ticket-type.ts        # Ticket tier configuration
│   ├── order.ts              # Order with status workflow
│   ├── order-item.ts         # Line items in order
│   ├── ticket.ts             # Individual ticket with QR
│   ├── waitlist.ts           # Waitlist for sold-out tickets
│   ├── promo-code.ts         # Promotional codes
│   └── index.ts              # Domain exports
├── usecases/                  # Application logic
│   ├── create-order.ts       # Order creation workflow
│   ├── complete-order.ts     # Order completion & ticket generation
│   ├── cancel-order.ts       # Order cancellation
│   ├── refund-order.ts       # Refund processing
│   └── check-in-ticket.ts    # Ticket validation & check-in
├── infra/                     # Data access
│   ├── ticket-type-repository.ts
│   ├── order-repository.ts
│   ├── order-item-repository.ts
│   └── ticket-repository.ts
└── services/                  # External integrations
    ├── stripe-service.ts     # Stripe payment processing
    ├── qr-code-service.ts    # QR code generation
    └── ticket-email-service.ts # Email templates
```

## Domain Entities

### TicketType

Represents a ticket tier (e.g., "Early Bird", "Regular", "VIP").

```typescript
type TicketType = {
  id: string
  editionId: string
  name: string                    // 1-100 chars
  description?: string            // max 500 chars
  price: number                   // Amount in cents
  currency: 'EUR' | 'USD' | 'GBP'
  quantity: number                // Total available
  quantitySold: number            // Already sold
  salesStartDate?: Date
  salesEndDate?: Date
  isActive: boolean
  order: number                   // Display order
  createdAt: Date
  updatedAt: Date
}
```

**Helper Functions:**
- `isFreeTicket(ticketType)`: Check if price is 0
- `isTicketAvailable(ticketType)`: Validates status, dates, and stock
- `remainingTickets(ticketType)`: Calculate unsold tickets
- `formatPrice(ticketType)`: Format price with currency

### Order

Represents a customer purchase.

```typescript
type Order = {
  id: string
  editionId: string
  orderNumber: string            // Format: ORD-{timestamp}-{random}
  email: string
  firstName: string
  lastName: string
  status: 'pending' | 'paid' | 'cancelled' | 'refunded'
  totalAmount: number            // Amount in cents
  currency: string
  stripeSessionId?: string
  stripePaymentIntentId?: string
  paidAt?: Date
  cancelledAt?: Date
  createdAt: Date
  updatedAt: Date
}
```

**Status Transitions:**
- `pending` → `paid` (on successful payment)
- `pending` → `cancelled` (on cancellation or timeout)
- `paid` → `refunded` (on refund)

### OrderItem

Line item linking an order to a ticket type.

```typescript
type OrderItem = {
  id: string
  orderId: string
  ticketTypeId: string
  ticketTypeName: string
  quantity: number
  unitPrice: number              // Price at time of purchase
  totalPrice: number             // unitPrice * quantity
  createdAt: Date
  updatedAt: Date
}
```

### Ticket

Individual ticket issued after payment.

```typescript
type Ticket = {
  id: string
  orderId: string
  ticketTypeId: string
  editionId: string
  attendeeEmail: string
  attendeeFirstName: string
  attendeeLastName: string
  ticketNumber: string           // Format: TKT-{timestamp}-{random}
  qrCode: string                 // Data URL (PNG)
  status: 'valid' | 'used' | 'cancelled'
  checkedInAt?: Date
  checkedInBy?: string           // Staff user ID
  createdAt: Date
  updatedAt: Date
}
```

### Waitlist Entry

Represents a person waiting for tickets when sold out.

```typescript
type WaitlistEntry = {
  id: string
  editionId: string
  ticketTypeId: string
  email: string
  firstName: string
  lastName: string
  status: 'waiting' | 'notified' | 'converted' | 'expired'
  position: number                // Queue position
  notifiedAt?: Date
  notificationExpiresAt?: Date
  convertedOrderId?: string
  createdAt: Date
  updatedAt: Date
}
```

**Status Flow:**
- `waiting` → `notified` (when tickets become available)
- `notified` → `converted` (when attendee purchases)
- `notified` → `expired` (notification window expires)

**Features:**
- Automatic position tracking in queue
- Configurable notification window (default 48h)
- Email notifications when tickets available
- Priority access link for notified attendees

**Helper Functions:**
- `isWaitlistOpen(ticketType)`: Check if waitlist is enabled for sold-out ticket
- `getNextInQueue(entries)`: Get next waiting entry
- `hasExpiredNotification(entry)`: Check if notification window passed
- `buildNotificationContext(entry, ticketType)`: Build email template context

## Use Cases

### Create Order

Creates a pending order with validation of ticket availability.

```typescript
const createOrderUseCase = createCreateOrderUseCase(repositories)

const result = await createOrderUseCase({
  editionId: 'edition-id',
  email: 'customer@example.com',
  firstName: 'John',
  lastName: 'Doe',
  items: [
    { ticketTypeId: 'ticket-type-id', quantity: 2 }
  ]
})

// Returns: { orderId, orderNumber, totalAmount, isFree }
```

**Validation:**
- All ticket types must exist and be active
- Sufficient inventory for requested quantities
- Calculates total amount from ticket prices

### Complete Order

Marks order as paid and generates tickets.

```typescript
const completeOrderUseCase = createCompleteOrderUseCase(repositories)

const result = await completeOrderUseCase({
  orderId: 'order-id',
  qrCodeGenerator: generateQrCodeDataUrl
})

// Returns: { orderId, ticketIds }
```

**Actions:**
1. Sets order status to `paid`
2. Increments `quantitySold` for each ticket type
3. Generates individual tickets (one per quantity)
4. Creates QR codes containing ticket data

### Cancel Order

Cancels a pending order and restores inventory.

```typescript
const cancelOrderUseCase = createCancelOrderUseCase(repositories)

await cancelOrderUseCase({ orderId: 'order-id' })
```

**Constraints:** Only pending orders can be cancelled.

### Refund Order

Refunds a paid order via Stripe.

```typescript
const refundOrderUseCase = createRefundOrderUseCase(repositories)

await refundOrderUseCase({ orderId: 'order-id' })
```

**Actions:**
1. Validates order is paid
2. Cancels all valid/used tickets
3. Restores quantity sold counters
4. Sets order status to `refunded`
5. Triggers Stripe refund (handled separately)

### Check-in Ticket

Validates and marks a ticket as used.

```typescript
const checkInUseCase = createCheckInTicketUseCase(repositories)

const result = await checkInUseCase({
  ticketNumber: 'TKT-1234567890-abc',
  checkedInBy: 'staff-user-id'
})

// Returns: { success: true, ticket } or { success: false, error: 'message' }
```

**Validation:**
- Ticket must exist
- Status must be `valid` (not used or cancelled)
- Records timestamp and staff member

## Services

### Stripe Service

Integration with Stripe for payment processing.

```typescript
const stripe = createStripeService(stripeSecretKey)

// Create checkout session
const session = await stripe.createCheckoutSession({
  orderId: 'order-id',
  orderNumber: 'ORD-123',
  customerEmail: 'customer@example.com',
  items: [
    { name: 'Regular Ticket', unitAmount: 5000, quantity: 2 }
  ],
  currency: 'eur',
  successUrl: 'https://example.com/success',
  cancelUrl: 'https://example.com/cancel'
})

// Retrieve session status
const status = await stripe.retrieveSession(sessionId)

// Process refund
await stripe.createRefund(paymentIntentId)

// Validate webhook
const event = stripe.constructWebhookEvent(payload, signature)
```

### QR Code Service

Generates QR codes for tickets.

```typescript
import { generateQrCodeDataUrl } from './qr-code-service'

const dataUrl = await generateQrCodeDataUrl({
  ticketId: 'ticket-id',
  ticketNumber: 'TKT-123',
  editionId: 'edition-id'
})
// Returns: 'data:image/png;base64,...'
```

**Configuration:**
- Size: 300x300 pixels
- Error correction: M (medium)
- Margin: 2 modules

### Email Templates

HTML and text email templates.

```typescript
import { generateOrderConfirmationHtml, generateOrderRefundHtml } from './ticket-email-service'

const html = generateOrderConfirmationHtml({
  orderNumber: 'ORD-123',
  customerName: 'John Doe',
  items: [...],
  tickets: [...],
  totalAmount: 10000,
  currency: 'EUR'
})
```

## Routes

### Public Routes

| Route | Description |
|-------|-------------|
| `/tickets/[editionSlug]` | Ticket selection page |
| `/tickets/[editionSlug]/checkout` | Checkout form |
| `/tickets/[editionSlug]/confirmation` | Order confirmation |

### Admin Routes

| Route | Description |
|-------|-------------|
| `/admin/billing/[editionSlug]` | Dashboard with stats, URLs for tickets and scanner |
| `/admin/billing/[editionSlug]/participants` | Order list |
| `/admin/billing/[editionSlug]/checkin` | Check-in Control Tower |
| `/admin/billing/[editionSlug]/checkin/stats` | Detailed check-in statistics |
| `/admin/billing/[editionSlug]/settings` | Ticket type management |

### Billing Dashboard

The billing dashboard (`/admin/billing/[editionSlug]`) displays:
- Revenue and order statistics
- Ticket types with stock levels
- **Quick access URLs** with copy buttons:
  - Public tickets page: `/tickets/[slug]`
  - Scanner PWA: `/scan/[editionId]`

### Check-in Control Tower

The check-in page (`/admin/billing/[editionSlug]/checkin`) serves as a control center for event check-in operations:

**Left Column - Scanner Station:**
- Mode toggle: Manual entry or QR scanner
- Manual ticket number input
- QR code scanning with camera
- Success/error feedback

**Right Column - Live Dashboard:**
- **Global Stats**: Total checked in, active scanners count, progress percentage
- **Field Scanners**: List of staff members scanning tickets with:
  - Name
  - Number of scans
  - Last activity time
- **Recent Activity**: Live feed of the last 15 check-ins with:
  - Attendee name
  - Ticket number
  - Check-in time
  - Scanner name

**Features:**
- Auto-refresh every 10 seconds
- Manual refresh button
- Real-time monitoring of field staff activity

### API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/billing/webhook` | POST | Stripe webhook handler |

## Stripe Webhook Events

The webhook handler processes:

- `checkout.session.completed`: Complete order, generate tickets, send email
- `checkout.session.expired`: Cancel pending order

## Data Flow

### Free Ticket Purchase

```
User selects free tickets
→ Submit checkout form
→ createCreateOrderUseCase (pending order)
→ createCompleteOrderUseCase (tickets + QR)
→ sendOrderConfirmationEmail (async)
→ Redirect to confirmation
```

### Paid Ticket Purchase

```
User selects paid tickets
→ Submit checkout form
→ createCreateOrderUseCase (pending order)
→ createStripeCheckoutSession
→ Redirect to Stripe Checkout
→ Payment completed
→ Stripe webhook received
→ createCompleteOrderUseCase (tickets + QR)
→ sendOrderConfirmationEmail
→ User returns to confirmation
```

### Check-in Flow

```
Staff scans QR code / enters ticket number
→ Parse ticket number from QR JSON
→ Validate ticket exists and matches edition
→ Check status is 'valid'
→ Update status to 'used'
→ Record check-in time and staff
→ Display confirmation
```

## PocketBase Collections

| Collection | Description |
|------------|-------------|
| `ticket_types` | Ticket tier configuration |
| `orders` | Customer orders |
| `order_items` | Line items per order |
| `billing_tickets` | Individual tickets with QR |
| `waitlist_entries` | Waitlist for sold-out tickets |
| `promo_codes` | Promotional discount codes |

## Environment Variables

```env
# Stripe configuration (required for paid tickets)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## Testing

Unit tests cover:
- Domain entity validation (Zod schemas)
- Use case workflows
- Price calculations
- Status transitions

E2E tests cover:
- Free ticket checkout flow
- Paid ticket checkout flow (mocked Stripe)
- Order management (cancel, refund)
- Check-in Control Tower functionality
- Scanner PWA functionality

```bash
pnpm test                              # Unit tests
pnpm test:e2e tests/e2e/billing*.spec.ts  # Billing E2E tests
pnpm test:e2e tests/e2e/checkin.spec.ts   # Check-in Control Tower tests
pnpm test:e2e tests/e2e/scan.spec.ts      # Scanner PWA tests
```

## Mobile Scan App (PWA)

A Progressive Web App for scanning tickets with offline support.

### Features

- **PWA installable**: Works on mobile devices as a standalone app
- **QR scanning**: Uses html5-qrcode for automatic camera scanning
- **Offline mode**: Cache tickets locally for scanning without internet
- **Background sync**: Automatic bidirectional sync every 15 seconds
  - Upload pending check-ins to server
  - Download ticket status updates from other scanners
- **Real-time stats**: Expected tickets, scanned count, errors
- **Visual feedback**: Green/red indicators for valid/invalid tickets

### Routes

| Route | Description |
|-------|-------------|
| `/scan` | Edition selector |
| `/scan/[editionId]` | QR scanner interface |

### API Endpoints

| Route | Method | Description |
|-------|--------|-------------|
| `/api/scan/tickets` | GET | Download tickets for offline cache |
| `/api/scan/tickets/updates` | GET | Get ticket status updates (for sync) |
| `/api/scan/checkin` | POST | Check in a ticket |

### Architecture

```
src/lib/features/billing/services/
├── ticket-cache-service.ts    # IndexedDB ticket cache
└── offline-sync-service.ts    # Sync queue management

src/routes/scan/
├── +layout.svelte             # PWA layout with online/offline status
├── +page.svelte               # Edition selector
└── [editionId]/+page.svelte   # Scanner interface

static/
├── manifest.json              # PWA manifest
└── sw.js                      # Service worker
```

### Offline Flow

1. Staff downloads tickets for caching (requires online)
2. Scans tickets offline - stored in IndexedDB
3. Pending check-ins queued for sync
4. Background sync every 15 seconds (when online):
   - Uploads pending check-ins to server
   - Fetches ticket status updates from other scanners
   - Updates local cache to avoid duplicate check-ins

### Usage

```typescript
import { ticketCacheService } from '$lib/features/billing/services/ticket-cache-service'
import { offlineSyncService } from '$lib/features/billing/services/offline-sync-service'

// Download tickets for offline
await offlineSyncService.downloadTickets(editionId, origin)

// Check ticket locally
const ticket = await ticketCacheService.getTicket(ticketNumber)

// Add pending check-in
await ticketCacheService.addPendingCheckIn({
  ticketNumber,
  editionId,
  checkedInAt: new Date().toISOString(),
  checkedInBy: userId
})

// Sync pending check-ins to server
await offlineSyncService.syncPendingCheckIns(origin)

// Fetch ticket updates from other scanners
await offlineSyncService.fetchTicketUpdates(editionId, origin)
```

## Related Documentation

- [Architecture Overview](../architecture.md)
- [Database Seeding](../development/database-seeding.md)
- [Stripe Documentation](https://stripe.com/docs)
