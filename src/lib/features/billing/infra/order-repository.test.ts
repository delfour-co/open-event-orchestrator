import type PocketBase from 'pocketbase'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createOrderRepository } from './order-repository'

vi.mock('$lib/server/safe-filter', () => ({
  safeFilter: (strings: TemplateStringsArray, ...values: unknown[]) =>
    strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
  filterAnd: (...filters: (string | undefined | null)[]) => filters.filter(Boolean).join(' && ')
}))

const createMockPb = () => {
  const mockCollection = {
    getOne: vi.fn(),
    getList: vi.fn(),
    getFullList: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }
  return {
    collection: vi.fn(() => mockCollection),
    mockCollection
  }
}

const MOCK_RECORD = {
  id: 'order1',
  editionId: 'edition1',
  orderNumber: 'ORD-001',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  status: 'pending',
  totalAmount: 100,
  currency: 'EUR',
  stripeSessionId: 'sess_123',
  stripePaymentIntentId: 'pi_123',
  invoiceNumber: 'F-2026-000001',
  paymentProvider: 'stripe',
  billingAddress: '123 Street',
  billingCity: 'Paris',
  billingPostalCode: '75001',
  billingCountry: 'FR',
  invoicePdf: 'invoice.pdf',
  paidAt: '2024-01-01T00:00:00Z',
  cancelledAt: null,
  created: '2024-01-01T00:00:00Z',
  updated: '2024-01-01T00:00:00Z'
}

describe('OrderRepository', () => {
  let mockPb: ReturnType<typeof createMockPb>

  beforeEach(() => {
    mockPb = createMockPb()
    vi.clearAllMocks()
  })

  const getRepo = () => createOrderRepository(mockPb as unknown as PocketBase)

  describe('findById', () => {
    it('should return an order when found', async () => {
      mockPb.mockCollection.getOne.mockResolvedValue(MOCK_RECORD)
      const result = await getRepo().findById('order1')

      expect(mockPb.collection).toHaveBeenCalledWith('orders')
      expect(mockPb.mockCollection.getOne).toHaveBeenCalledWith('order1')
      expect(result).not.toBeNull()
      expect(result?.id).toBe('order1')
      expect(result?.email).toBe('test@example.com')
      expect(result?.paidAt).toBeInstanceOf(Date)
    })

    it('should return null when not found', async () => {
      mockPb.mockCollection.getOne.mockRejectedValue(new Error('Not found'))
      const result = await getRepo().findById('nonexistent')
      expect(result).toBeNull()
    })
  })

  describe('findByEdition', () => {
    it('should return orders for an edition with defaults', async () => {
      mockPb.mockCollection.getList.mockResolvedValue({ items: [MOCK_RECORD] })
      const result = await getRepo().findByEdition('edition1')

      expect(mockPb.mockCollection.getList).toHaveBeenCalledWith(1, 50, {
        filter: expect.any(String),
        sort: '-created'
      })
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('order1')
    })

    it('should pass custom options', async () => {
      mockPb.mockCollection.getList.mockResolvedValue({ items: [] })
      await getRepo().findByEdition('edition1', { page: 2, perPage: 10, sort: 'email' })

      expect(mockPb.mockCollection.getList).toHaveBeenCalledWith(2, 10, {
        filter: expect.any(String),
        sort: 'email'
      })
    })
  })

  describe('findByEmail', () => {
    it('should return orders for an email', async () => {
      mockPb.mockCollection.getFullList.mockResolvedValue([MOCK_RECORD])
      const result = await getRepo().findByEmail('test@example.com')

      expect(result).toHaveLength(1)
    })

    it('should filter by edition when provided', async () => {
      mockPb.mockCollection.getFullList.mockResolvedValue([])
      await getRepo().findByEmail('test@example.com', 'edition1')

      expect(mockPb.mockCollection.getFullList).toHaveBeenCalledWith({
        filter: expect.stringContaining('&&'),
        sort: '-created'
      })
    })
  })

  describe('findByStripeSessionId', () => {
    it('should return an order when found', async () => {
      mockPb.mockCollection.getList.mockResolvedValue({ items: [MOCK_RECORD] })
      const result = await getRepo().findByStripeSessionId('sess_123')

      expect(result).not.toBeNull()
      expect(result?.stripeSessionId).toBe('sess_123')
    })

    it('should return null when no items', async () => {
      mockPb.mockCollection.getList.mockResolvedValue({ items: [] })
      const result = await getRepo().findByStripeSessionId('nonexistent')
      expect(result).toBeNull()
    })

    it('should return null on error', async () => {
      mockPb.mockCollection.getList.mockRejectedValue(new Error('Error'))
      const result = await getRepo().findByStripeSessionId('sess_123')
      expect(result).toBeNull()
    })
  })

  describe('create', () => {
    it('should create an order with default pending status', async () => {
      mockPb.mockCollection.create.mockResolvedValue(MOCK_RECORD)
      const result = await getRepo().create({
        editionId: 'edition1',
        orderNumber: 'ORD-001',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        totalAmount: 100,
        currency: 'EUR'
      })

      expect(mockPb.mockCollection.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'pending' })
      )
      expect(result.id).toBe('order1')
    })
  })

  describe('updateStatus', () => {
    it('should set paidAt when status is paid', async () => {
      mockPb.mockCollection.update.mockResolvedValue({ ...MOCK_RECORD, status: 'paid' })
      await getRepo().updateStatus('order1', 'paid')

      expect(mockPb.mockCollection.update).toHaveBeenCalledWith(
        'order1',
        expect.objectContaining({ status: 'paid', paidAt: expect.any(String) })
      )
    })

    it('should set cancelledAt when status is cancelled', async () => {
      mockPb.mockCollection.update.mockResolvedValue({ ...MOCK_RECORD, status: 'cancelled' })
      await getRepo().updateStatus('order1', 'cancelled')

      expect(mockPb.mockCollection.update).toHaveBeenCalledWith(
        'order1',
        expect.objectContaining({ status: 'cancelled', cancelledAt: expect.any(String) })
      )
    })

    it('should not set timestamps for other statuses', async () => {
      mockPb.mockCollection.update.mockResolvedValue({ ...MOCK_RECORD, status: 'refunded' })
      await getRepo().updateStatus('order1', 'refunded')

      const callArgs = mockPb.mockCollection.update.mock.calls[0][1]
      expect(callArgs).toEqual({ status: 'refunded' })
    })
  })

  describe('updatePaymentInfo', () => {
    it('should update payment info', async () => {
      mockPb.mockCollection.update.mockResolvedValue(MOCK_RECORD)
      await getRepo().updatePaymentInfo('order1', { stripeSessionId: 'sess_new' })

      expect(mockPb.mockCollection.update).toHaveBeenCalledWith('order1', {
        stripeSessionId: 'sess_new'
      })
    })
  })

  describe('countByEdition', () => {
    it('should count orders by status and compute revenue', async () => {
      mockPb.mockCollection.getFullList.mockResolvedValue([
        { status: 'paid', totalAmount: 50 },
        { status: 'paid', totalAmount: 75 },
        { status: 'pending', totalAmount: 30 },
        { status: 'cancelled', totalAmount: 20 }
      ])

      const result = await getRepo().countByEdition('edition1')

      expect(result.total).toBe(4)
      expect(result.byStatus.paid).toBe(2)
      expect(result.byStatus.pending).toBe(1)
      expect(result.byStatus.cancelled).toBe(1)
      expect(result.byStatus.refunded).toBe(0)
      expect(result.totalRevenue).toBe(125)
    })
  })

  describe('mapping', () => {
    it('should map record fields correctly', async () => {
      mockPb.mockCollection.getOne.mockResolvedValue(MOCK_RECORD)
      const result = await getRepo().findById('order1')

      expect(result?.currency).toBe('EUR')
      expect(result?.invoiceNumber).toBe('F-2026-000001')
      expect(result?.billingAddress).toBe('123 Street')
      expect(result?.createdAt).toBeInstanceOf(Date)
      expect(result?.updatedAt).toBeInstanceOf(Date)
    })

    it('should handle missing optional fields with defaults', async () => {
      mockPb.mockCollection.getOne.mockResolvedValue({
        id: 'order2',
        editionId: 'e1',
        orderNumber: 'ORD-002',
        email: 'a@b.com',
        firstName: 'A',
        lastName: 'B',
        status: '',
        totalAmount: 0,
        currency: '',
        invoiceNumber: '',
        paymentProvider: '',
        billingAddress: '',
        billingCity: '',
        billingPostalCode: '',
        billingCountry: '',
        invoicePdf: '',
        paidAt: null,
        cancelledAt: null,
        created: '2024-01-01T00:00:00Z',
        updated: '2024-01-01T00:00:00Z'
      })
      const result = await getRepo().findById('order2')

      expect(result?.status).toBe('pending')
      expect(result?.currency).toBe('EUR')
      expect(result?.invoiceNumber).toBeUndefined()
      expect(result?.paidAt).toBeUndefined()
      expect(result?.cancelledAt).toBeUndefined()
    })
  })
})
