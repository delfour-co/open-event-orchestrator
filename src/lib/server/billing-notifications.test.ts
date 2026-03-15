import type PocketBase from 'pocketbase'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockSend = vi.fn()
const mockOrderFindById = vi.fn()
const mockOrderItemFindByOrder = vi.fn()
const mockTicketFindByOrder = vi.fn()
const mockTicketTemplateFindByEdition = vi.fn()
const mockTicketTemplateGetLogoUrl = vi.fn()

vi.mock('$lib/server/app-settings', () => ({
  getEmailService: vi.fn().mockResolvedValue({
    send: (...args: unknown[]) => mockSend(...args)
  })
}))

vi.mock('$lib/server/email-branding', () => ({
  getEventBranding: vi.fn().mockResolvedValue({
    orgName: 'Test Org',
    primaryColor: '#3b82f6',
    logoUrl: undefined,
    footerText: 'Footer'
  })
}))

vi.mock('$lib/features/billing/infra', () => ({
  createOrderRepository: () => ({
    findById: (...args: unknown[]) => mockOrderFindById(...args)
  }),
  createOrderItemRepository: () => ({
    findByOrder: (...args: unknown[]) => mockOrderItemFindByOrder(...args)
  }),
  createTicketRepository: () => ({
    findByOrder: (...args: unknown[]) => mockTicketFindByOrder(...args)
  }),
  createTicketTemplateRepository: () => ({
    findByEdition: (...args: unknown[]) => mockTicketTemplateFindByEdition(...args),
    getLogoUrl: (...args: unknown[]) => mockTicketTemplateGetLogoUrl(...args)
  })
}))

vi.mock('$lib/features/billing/services', () => ({
  generateOrderConfirmationHtml: vi.fn().mockReturnValue('<html>confirmation</html>'),
  generateOrderConfirmationText: vi.fn().mockReturnValue('confirmation text'),
  generateOrderRefundHtml: vi.fn().mockReturnValue('<html>refund</html>'),
  generateOrderRefundText: vi.fn().mockReturnValue('refund text'),
  generateOrderInvoicePdf: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
  generateCreditNotePdf: vi.fn().mockResolvedValue(new Uint8Array([4, 5, 6])),
  getNextInvoiceNumber: vi.fn().mockResolvedValue('INV-2024-001'),
  getNextCreditNoteNumber: vi.fn().mockResolvedValue('CN-2024-001')
}))

vi.mock('$lib/features/budget/services', () => ({
  recordIncome: vi.fn().mockResolvedValue(undefined),
  recordCreditNote: vi.fn().mockResolvedValue(undefined)
}))

import { sendOrderConfirmationEmail, sendOrderRefundEmail } from './billing-notifications'

function createMockPb(): PocketBase {
  return {
    collection: vi.fn().mockReturnValue({
      getList: vi.fn().mockResolvedValue({ items: [] }),
      getOne: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockResolvedValue({})
    })
  } as unknown as PocketBase
}

const sampleOrder = {
  id: 'order-1',
  orderNumber: 'ORD-001',
  email: 'buyer@example.com',
  firstName: 'John',
  lastName: 'Doe',
  totalAmount: 5000,
  editionId: 'edition-1',
  invoiceNumber: '',
  paidAt: new Date('2024-06-01'),
  createdAt: new Date('2024-05-30')
}

const sampleItems = [
  { id: 'item-1', orderId: 'order-1', ticketTypeId: 'tt-1', quantity: 2, unitPrice: 2500 }
]

const sampleTickets = [{ id: 'ticket-1', orderId: 'order-1', code: 'TKT-001' }]

describe('billing-notifications', () => {
  let pb: PocketBase

  beforeEach(() => {
    pb = createMockPb()
    vi.clearAllMocks()

    mockOrderFindById.mockResolvedValue(sampleOrder)
    mockOrderItemFindByOrder.mockResolvedValue(sampleItems)
    mockTicketFindByOrder.mockResolvedValue(sampleTickets)
    mockTicketTemplateFindByEdition.mockResolvedValue(null)
    mockSend.mockResolvedValue({ success: true })
  })

  describe('sendOrderConfirmationEmail', () => {
    it('should send confirmation email successfully', async () => {
      const result = await sendOrderConfirmationEmail({
        pb,
        orderId: 'order-1',
        editionName: 'Conference 2024',
        eventName: 'My Event'
      })

      expect(result.success).toBe(true)
      expect(mockSend).toHaveBeenCalledTimes(1)
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'buyer@example.com',
          subject: 'Order Confirmation #ORD-001 - Conference 2024',
          html: expect.any(String),
          text: expect.any(String)
        })
      )
    })

    it('should return error when order is not found', async () => {
      mockOrderFindById.mockResolvedValue(null)

      const result = await sendOrderConfirmationEmail({
        pb,
        orderId: 'missing',
        editionName: 'Conference 2024',
        eventName: 'My Event'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Order not found')
      expect(mockSend).not.toHaveBeenCalled()
    })

    it('should send email without attachments for free orders', async () => {
      mockOrderFindById.mockResolvedValue({ ...sampleOrder, totalAmount: 0 })

      const result = await sendOrderConfirmationEmail({
        pb,
        orderId: 'order-1',
        editionName: 'Conference 2024',
        eventName: 'My Event'
      })

      expect(result.success).toBe(true)
      const sendCall = mockSend.mock.calls[0][0] as { attachments?: unknown[] }
      expect(sendCall.attachments).toBeUndefined()
    })

    it('should return error when email service fails', async () => {
      mockSend.mockResolvedValue({ success: false, error: 'SMTP down' })

      const result = await sendOrderConfirmationEmail({
        pb,
        orderId: 'order-1',
        editionName: 'Conference 2024',
        eventName: 'My Event'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('SMTP down')
    })

    it('should catch exceptions and return error', async () => {
      mockOrderFindById.mockRejectedValue(new Error('DB error'))

      const result = await sendOrderConfirmationEmail({
        pb,
        orderId: 'order-1',
        editionName: 'Conference 2024',
        eventName: 'My Event'
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('DB error')
    })
  })

  describe('sendOrderRefundEmail', () => {
    it('should send refund email successfully', async () => {
      const result = await sendOrderRefundEmail({
        pb,
        orderId: 'order-1',
        editionName: 'Conference 2024',
        eventName: 'My Event'
      })

      expect(result.success).toBe(true)
      expect(mockSend).toHaveBeenCalledTimes(1)
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'buyer@example.com',
          subject: 'Order Refunded #ORD-001 - Conference 2024'
        })
      )
    })

    it('should return error when order is not found', async () => {
      mockOrderFindById.mockResolvedValue(null)

      const result = await sendOrderRefundEmail({
        pb,
        orderId: 'missing',
        editionName: 'Conference 2024',
        eventName: 'My Event'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Order not found')
    })

    it('should send without attachments when order has no invoice number', async () => {
      mockOrderFindById.mockResolvedValue({
        ...sampleOrder,
        invoiceNumber: ''
      })

      const result = await sendOrderRefundEmail({
        pb,
        orderId: 'order-1',
        editionName: 'Conference 2024',
        eventName: 'My Event'
      })

      expect(result.success).toBe(true)
      const sendCall = mockSend.mock.calls[0][0] as { attachments?: unknown[] }
      expect(sendCall.attachments).toBeUndefined()
    })

    it('should send without attachments for free orders', async () => {
      mockOrderFindById.mockResolvedValue({
        ...sampleOrder,
        totalAmount: 0,
        invoiceNumber: 'INV-001'
      })

      const result = await sendOrderRefundEmail({
        pb,
        orderId: 'order-1',
        editionName: 'Conference 2024',
        eventName: 'My Event'
      })

      expect(result.success).toBe(true)
      const sendCall = mockSend.mock.calls[0][0] as { attachments?: unknown[] }
      expect(sendCall.attachments).toBeUndefined()
    })

    it('should return error when email service fails', async () => {
      mockSend.mockResolvedValue({ success: false, error: 'Connection refused' })

      const result = await sendOrderRefundEmail({
        pb,
        orderId: 'order-1',
        editionName: 'Conference 2024',
        eventName: 'My Event'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Connection refused')
    })

    it('should catch exceptions and return error', async () => {
      mockOrderFindById.mockRejectedValue(new Error('Network error'))

      const result = await sendOrderRefundEmail({
        pb,
        orderId: 'order-1',
        editionName: 'Conference 2024',
        eventName: 'My Event'
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Network error')
    })
  })
})
