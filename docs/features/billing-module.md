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

## Architecture

```
billing/
├── domain/                    # Business entities & rules
│   ├── ticket-type.ts        # Ticket tier configuration
│   ├── order.ts              # Order with status workflow
│   ├── order-item.ts         # Line items in order
│   ├── ticket.ts             # Individual ticket with QR
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
| `/admin/billing/[editionSlug]` | Dashboard with stats |
| `/admin/billing/[editionSlug]/participants` | Order list |
| `/admin/billing/[editionSlug]/checkin` | Check-in interface |
| `/admin/billing/[editionSlug]/settings` | Ticket type management |

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
- Check-in functionality

```bash
pnpm test                    # Unit tests
pnpm test:e2e tests/e2e/billing*.spec.ts  # E2E tests
```

## Related Documentation

- [Architecture Overview](../architecture.md)
- [Database Seeding](../development/database-seeding.md)
- [Stripe Documentation](https://stripe.com/docs)
