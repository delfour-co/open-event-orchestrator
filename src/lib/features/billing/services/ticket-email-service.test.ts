import { describe, expect, it } from 'vitest'
import type { Order, OrderItem, Ticket } from '../domain'
import {
  type OrderConfirmationData,
  type OrderRefundData,
  generateOrderConfirmationHtml,
  generateOrderConfirmationText,
  generateOrderRefundHtml,
  generateOrderRefundText
} from './ticket-email-service'

const now = new Date()

const makeOrder = (overrides: Partial<Order> = {}): Order => ({
  id: 'order-1',
  editionId: 'ed-1',
  orderNumber: 'ORD-ABC-123',
  email: 'john@example.com',
  firstName: 'John',
  lastName: 'Doe',
  status: 'paid',
  totalAmount: 9800,
  currency: 'EUR',
  createdAt: now,
  updatedAt: now,
  ...overrides
})

const makeOrderItem = (overrides: Partial<OrderItem> = {}): OrderItem => ({
  id: 'oi-1',
  orderId: 'order-1',
  ticketTypeId: 'tt-1',
  ticketTypeName: 'Standard',
  quantity: 2,
  unitPrice: 4900,
  totalPrice: 9800,
  createdAt: now,
  updatedAt: now,
  ...overrides
})

const makeTicket = (overrides: Partial<Ticket> = {}): Ticket => ({
  id: 'ticket-1',
  orderId: 'order-1',
  ticketTypeId: 'tt-1',
  editionId: 'ed-1',
  attendeeEmail: 'john@example.com',
  attendeeFirstName: 'John',
  attendeeLastName: 'Doe',
  ticketNumber: 'TKT-ABC-123',
  status: 'valid',
  createdAt: now,
  updatedAt: now,
  ...overrides
})

const makeData = (overrides: Partial<OrderConfirmationData> = {}): OrderConfirmationData => ({
  order: makeOrder(),
  items: [makeOrderItem()],
  tickets: [makeTicket()],
  editionName: 'DevFest Paris 2025',
  eventName: 'DevFest',
  ...overrides
})

describe('generateOrderConfirmationHtml', () => {
  it('should generate valid HTML', () => {
    const html = generateOrderConfirmationHtml(makeData())

    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('</html>')
  })

  it('should include order number', () => {
    const html = generateOrderConfirmationHtml(makeData())

    expect(html).toContain('ORD-ABC-123')
  })

  it('should include attendee first name', () => {
    const html = generateOrderConfirmationHtml(makeData())

    expect(html).toContain('Hello John')
  })

  it('should include edition name', () => {
    const html = generateOrderConfirmationHtml(makeData())

    expect(html).toContain('DevFest Paris 2025')
  })

  it('should include event name', () => {
    const html = generateOrderConfirmationHtml(makeData())

    expect(html).toContain('DevFest')
  })

  it('should include item details', () => {
    const html = generateOrderConfirmationHtml(makeData())

    expect(html).toContain('Standard')
    expect(html).toContain('2') // quantity
  })

  it('should format price in cents to currency', () => {
    const html = generateOrderConfirmationHtml(makeData())

    expect(html).toContain('98.00 EUR')
  })

  it('should show "Free" for zero amount orders', () => {
    const html = generateOrderConfirmationHtml(makeData({ order: makeOrder({ totalAmount: 0 }) }))

    expect(html).toContain('Free')
  })

  it('should include ticket numbers', () => {
    const html = generateOrderConfirmationHtml(makeData())

    expect(html).toContain('TKT-ABC-123')
  })

  it('should include QR code image when available', () => {
    const html = generateOrderConfirmationHtml(
      makeData({
        tickets: [makeTicket({ qrCode: 'data:image/png;base64,abc123' })]
      })
    )

    expect(html).toContain('data:image/png;base64,abc123')
    expect(html).toContain('<img')
  })

  it('should handle tickets without QR codes', () => {
    const html = generateOrderConfirmationHtml(
      makeData({
        tickets: [makeTicket({ qrCode: undefined })]
      })
    )

    expect(html).not.toContain('<img')
    expect(html).toContain('TKT-ABC-123')
  })

  it('should include multiple tickets', () => {
    const html = generateOrderConfirmationHtml(
      makeData({
        tickets: [
          makeTicket({ ticketNumber: 'TKT-001' }),
          makeTicket({ id: 'ticket-2', ticketNumber: 'TKT-002' })
        ]
      })
    )

    expect(html).toContain('TKT-001')
    expect(html).toContain('TKT-002')
  })
})

describe('generateOrderConfirmationText', () => {
  it('should include order number', () => {
    const text = generateOrderConfirmationText(makeData())

    expect(text).toContain('ORD-ABC-123')
  })

  it('should include attendee name', () => {
    const text = generateOrderConfirmationText(makeData())

    expect(text).toContain('Hello John')
  })

  it('should include edition name', () => {
    const text = generateOrderConfirmationText(makeData())

    expect(text).toContain('DevFest Paris 2025')
  })

  it('should include event name', () => {
    const text = generateOrderConfirmationText(makeData())

    expect(text).toContain('DevFest')
  })

  it('should include item line with quantity and price', () => {
    const text = generateOrderConfirmationText(makeData())

    expect(text).toContain('Standard x2')
    expect(text).toContain('98.00 EUR')
  })

  it('should show "Free" for zero amount orders', () => {
    const text = generateOrderConfirmationText(makeData({ order: makeOrder({ totalAmount: 0 }) }))

    expect(text).toContain('Free')
  })

  it('should include ticket numbers', () => {
    const text = generateOrderConfirmationText(makeData())

    expect(text).toContain('TKT-ABC-123')
  })

  it('should include attendee names on tickets', () => {
    const text = generateOrderConfirmationText(makeData())

    expect(text).toContain('John Doe')
  })
})

const makeRefundData = (overrides: Partial<OrderRefundData> = {}): OrderRefundData => ({
  order: makeOrder({ status: 'refunded' }),
  items: [makeOrderItem()],
  editionName: 'DevFest Paris 2025',
  eventName: 'DevFest',
  ...overrides
})

describe('generateOrderRefundHtml', () => {
  it('should generate valid HTML', () => {
    const html = generateOrderRefundHtml(makeRefundData())

    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('</html>')
  })

  it('should include "Refunded" heading', () => {
    const html = generateOrderRefundHtml(makeRefundData())

    expect(html).toContain('Order Refunded')
  })

  it('should include order number', () => {
    const html = generateOrderRefundHtml(makeRefundData())

    expect(html).toContain('ORD-ABC-123')
  })

  it('should include attendee first name', () => {
    const html = generateOrderRefundHtml(makeRefundData())

    expect(html).toContain('Hello John')
  })

  it('should include edition name', () => {
    const html = generateOrderRefundHtml(makeRefundData())

    expect(html).toContain('DevFest Paris 2025')
  })

  it('should include item details', () => {
    const html = generateOrderRefundHtml(makeRefundData())

    expect(html).toContain('Standard')
    expect(html).toContain('2')
  })

  it('should format refunded amount', () => {
    const html = generateOrderRefundHtml(makeRefundData())

    expect(html).toContain('98.00 EUR')
  })

  it('should mention cancelled tickets', () => {
    const html = generateOrderRefundHtml(makeRefundData())

    expect(html).toContain('cancelled')
  })
})

describe('generateOrderRefundText', () => {
  it('should include "Refunded" in text', () => {
    const text = generateOrderRefundText(makeRefundData())

    expect(text).toContain('Order Refunded')
  })

  it('should include order number', () => {
    const text = generateOrderRefundText(makeRefundData())

    expect(text).toContain('ORD-ABC-123')
  })

  it('should include attendee name', () => {
    const text = generateOrderRefundText(makeRefundData())

    expect(text).toContain('Hello John')
  })

  it('should include refunded amount', () => {
    const text = generateOrderRefundText(makeRefundData())

    expect(text).toContain('98.00 EUR')
  })

  it('should include item line with quantity and price', () => {
    const text = generateOrderRefundText(makeRefundData())

    expect(text).toContain('Standard x2')
  })

  it('should mention cancelled tickets', () => {
    const text = generateOrderRefundText(makeRefundData())

    expect(text).toContain('cancelled')
  })
})
