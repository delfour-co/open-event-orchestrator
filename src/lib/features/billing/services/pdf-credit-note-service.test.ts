import { describe, expect, it } from 'vitest'
import type { Order, OrderItem } from '../domain'
import { generateCreditNotePdf } from './pdf-credit-note-service'

const makeOrder = (overrides: Partial<Order> = {}): Order => ({
  id: 'order-1',
  editionId: 'edition-1',
  orderNumber: 'ORD-TEST-001',
  email: 'buyer@example.com',
  firstName: 'Alice',
  lastName: 'Martin',
  status: 'refunded',
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

describe('pdf-credit-note-service', () => {
  it('should generate a valid credit note PDF', async () => {
    const pdfBytes = await generateCreditNotePdf({
      creditNoteNumber: 'CN-2025-001',
      creditNoteDate: 'June 15, 2025',
      originalInvoiceNumber: 'INV-2025-001',
      originalInvoiceDate: 'June 1, 2025',
      eventName: 'Tech Conference',
      order: makeOrder(),
      items: [makeItem()],
      vatRate: 20
    })

    expect(pdfBytes).toBeInstanceOf(Uint8Array)
    expect(pdfBytes.length).toBeGreaterThan(100)
  })

  it('should generate credit note with seller info', async () => {
    const pdfBytes = await generateCreditNotePdf({
      creditNoteNumber: 'CN-2025-002',
      creditNoteDate: 'June 15, 2025',
      originalInvoiceNumber: 'INV-2025-002',
      originalInvoiceDate: 'June 1, 2025',
      eventName: 'Tech Conference',
      order: makeOrder(),
      items: [makeItem()],
      vatRate: 20,
      seller: {
        name: 'ACME Corp',
        legalName: 'ACME SAS',
        siret: '123 456 789 00010',
        vatNumber: 'FR12345678901'
      }
    })

    expect(pdfBytes).toBeInstanceOf(Uint8Array)
    expect(pdfBytes.length).toBeGreaterThan(100)
  })

  it('should generate credit note with zero VAT', async () => {
    const pdfBytes = await generateCreditNotePdf({
      creditNoteNumber: 'CN-2025-003',
      creditNoteDate: 'June 15, 2025',
      originalInvoiceNumber: 'INV-2025-003',
      originalInvoiceDate: 'June 1, 2025',
      eventName: 'Free Event',
      order: makeOrder({ totalAmount: 5000 }),
      items: [makeItem({ unitPrice: 5000, totalPrice: 5000, quantity: 1 })],
      vatRate: 0
    })

    expect(pdfBytes).toBeInstanceOf(Uint8Array)
    expect(pdfBytes.length).toBeGreaterThan(100)
  })

  it('should generate credit note with billing address', async () => {
    const pdfBytes = await generateCreditNotePdf({
      creditNoteNumber: 'CN-2025-004',
      creditNoteDate: 'June 15, 2025',
      originalInvoiceNumber: 'INV-2025-004',
      originalInvoiceDate: 'June 1, 2025',
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
})
