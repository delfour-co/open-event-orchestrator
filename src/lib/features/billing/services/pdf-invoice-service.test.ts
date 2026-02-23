import { describe, expect, it } from 'vitest'
import type { Order, OrderItem } from '../domain'
import { generateOrderInvoicePdf } from './pdf-invoice-service'

const makeOrder = (overrides: Partial<Order> = {}): Order => ({
  id: 'order-1',
  editionId: 'edition-1',
  orderNumber: 'ORD-TEST-001',
  email: 'buyer@example.com',
  firstName: 'Alice',
  lastName: 'Martin',
  status: 'paid',
  totalAmount: 12000,
  currency: 'EUR',
  createdAt: new Date('2025-06-01'),
  updatedAt: new Date('2025-06-01'),
  ...overrides
})

const makeItem = (overrides: Partial<OrderItem> = {}): OrderItem => ({
  id: 'item-1',
  orderId: 'order-1',
  ticketTypeId: 'type-1',
  ticketTypeName: 'General Admission',
  quantity: 2,
  unitPrice: 6000,
  totalPrice: 12000,
  createdAt: new Date('2025-06-01'),
  updatedAt: new Date('2025-06-01'),
  ...overrides
})

describe('pdf-invoice-service', () => {
  it('should generate a valid PDF', async () => {
    const pdfBytes = await generateOrderInvoicePdf({
      invoiceNumber: 'INV-2025-001',
      invoiceDate: 'June 1, 2025',
      eventName: 'Tech Conference',
      order: makeOrder(),
      items: [makeItem()],
      vatRate: 20
    })

    expect(pdfBytes).toBeInstanceOf(Uint8Array)
    expect(pdfBytes.length).toBeGreaterThan(100)
  })

  it('should generate PDF with seller info', async () => {
    const pdfBytes = await generateOrderInvoicePdf({
      invoiceNumber: 'INV-2025-002',
      invoiceDate: 'June 1, 2025',
      eventName: 'Tech Conference',
      order: makeOrder(),
      items: [makeItem()],
      vatRate: 20,
      seller: {
        name: 'ACME Corp',
        legalName: 'ACME SAS',
        legalForm: 'SAS',
        siret: '123 456 789 00010',
        vatNumber: 'FR12345678901',
        address: '1 rue de la Paix',
        city: 'Paris',
        postalCode: '75001',
        country: 'France'
      }
    })

    expect(pdfBytes).toBeInstanceOf(Uint8Array)
    expect(pdfBytes.length).toBeGreaterThan(100)
  })

  it('should generate PDF with zero VAT', async () => {
    const pdfBytes = await generateOrderInvoicePdf({
      invoiceNumber: 'INV-2025-003',
      invoiceDate: 'June 1, 2025',
      eventName: 'Free Event',
      order: makeOrder({ totalAmount: 5000 }),
      items: [makeItem({ unitPrice: 5000, totalPrice: 5000, quantity: 1 })],
      vatRate: 0
    })

    expect(pdfBytes).toBeInstanceOf(Uint8Array)
    expect(pdfBytes.length).toBeGreaterThan(100)
  })

  it('should generate PDF with due date', async () => {
    const pdfBytes = await generateOrderInvoicePdf({
      invoiceNumber: 'INV-2025-004',
      invoiceDate: 'June 1, 2025',
      dueDate: 'June 30, 2025',
      eventName: 'Conference',
      order: makeOrder(),
      items: [makeItem()],
      vatRate: 20
    })

    expect(pdfBytes).toBeInstanceOf(Uint8Array)
    expect(pdfBytes.length).toBeGreaterThan(100)
  })

  it('should generate PDF with billing address', async () => {
    const pdfBytes = await generateOrderInvoicePdf({
      invoiceNumber: 'INV-2025-005',
      invoiceDate: 'June 1, 2025',
      eventName: 'Conference',
      order: makeOrder({
        billingAddress: '10 avenue des Champs',
        billingCity: 'Paris',
        billingPostalCode: '75008',
        billingCountry: 'France'
      }),
      items: [makeItem()],
      vatRate: 20
    })

    expect(pdfBytes).toBeInstanceOf(Uint8Array)
    expect(pdfBytes.length).toBeGreaterThan(100)
  })

  it('should generate PDF with multiple items', async () => {
    const pdfBytes = await generateOrderInvoicePdf({
      invoiceNumber: 'INV-2025-006',
      invoiceDate: 'June 1, 2025',
      eventName: 'Conference',
      order: makeOrder({ totalAmount: 20000 }),
      items: [
        makeItem({ ticketTypeName: 'VIP Pass', unitPrice: 10000, totalPrice: 10000, quantity: 1 }),
        makeItem({
          id: 'item-2',
          ticketTypeName: 'Workshop',
          unitPrice: 5000,
          totalPrice: 10000,
          quantity: 2
        })
      ],
      vatRate: 20
    })

    expect(pdfBytes).toBeInstanceOf(Uint8Array)
    expect(pdfBytes.length).toBeGreaterThan(100)
  })
})
