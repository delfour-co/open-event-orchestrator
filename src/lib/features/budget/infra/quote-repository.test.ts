import type PocketBase from 'pocketbase'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createQuoteRepository } from './quote-repository'

vi.mock('$lib/server/safe-filter', () => ({
  safeFilter: (strings: TemplateStringsArray, ...values: string[]) =>
    strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), '')
}))

const createMockPb = () => {
  const mockCollection = vi.fn()
  return {
    collection: mockCollection,
    _mockCollection: mockCollection
  }
}

const makeQuoteRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'quote1',
  editionId: 'edition1',
  quoteNumber: 'QT-001',
  vendor: 'ACME Corp',
  vendorEmail: 'acme@example.com',
  vendorAddress: '123 Main St',
  description: 'Catering services',
  items: [{ description: 'Lunch', quantity: 100, unitPrice: 15, total: 1500 }],
  totalAmount: 1500,
  currency: 'EUR',
  status: 'draft',
  validUntil: '2024-06-01T00:00:00Z',
  notes: 'Priority vendor',
  transactionId: null,
  sentAt: null,
  created: '2024-01-01T00:00:00Z',
  updated: '2024-01-02T00:00:00Z',
  ...overrides
})

describe('QuoteRepository', () => {
  let mockPb: ReturnType<typeof createMockPb>

  beforeEach(() => {
    mockPb = createMockPb()
  })

  describe('findByEdition', () => {
    it('should return quotes for an edition', async () => {
      const records = [makeQuoteRecord()]
      const mockGetFullList = vi.fn().mockResolvedValue(records)
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = createQuoteRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByEdition('edition1')

      expect(result).toHaveLength(1)
      expect(result[0].vendor).toBe('ACME Corp')
      expect(result[0].items).toHaveLength(1)
    })
  })

  describe('findById', () => {
    it('should return quote by id', async () => {
      const record = makeQuoteRecord()
      const mockGetOne = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ getOne: mockGetOne })

      const repo = createQuoteRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('quote1')

      expect(result?.quoteNumber).toBe('QT-001')
      expect(result?.totalAmount).toBe(1500)
    })

    it('should return null when not found', async () => {
      const mockGetOne = vi.fn().mockRejectedValue(new Error('not found'))
      mockPb._mockCollection.mockReturnValue({ getOne: mockGetOne })

      const repo = createQuoteRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('create', () => {
    it('should create a quote with all fields', async () => {
      const record = makeQuoteRecord()
      const mockCreate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ create: mockCreate })

      const repo = createQuoteRepository(mockPb as unknown as PocketBase)
      const result = await repo.create({
        editionId: 'edition1',
        vendor: 'ACME Corp',
        vendorEmail: 'acme@example.com',
        items: [{ description: 'Item', quantity: 1, unitPrice: 1500 }],
        totalAmount: 1500,
        currency: 'EUR',
        status: 'draft',
        validUntil: new Date('2024-06-01')
      })

      expect(result.vendor).toBe('ACME Corp')
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          vendor: 'ACME Corp',
          editionId: 'edition1'
        })
      )
    })

    it('should handle null validUntil', async () => {
      const record = makeQuoteRecord({ validUntil: null })
      const mockCreate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ create: mockCreate })

      const repo = createQuoteRepository(mockPb as unknown as PocketBase)
      await repo.create({
        editionId: 'edition1',
        vendor: 'Vendor',
        items: [{ description: 'Item', quantity: 1, unitPrice: 500 }],
        totalAmount: 500,
        currency: 'EUR',
        status: 'draft'
      })

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          validUntil: null
        })
      )
    })
  })

  describe('update', () => {
    it('should update only provided fields', async () => {
      const record = makeQuoteRecord({ vendor: 'New Vendor' })
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const repo = createQuoteRepository(mockPb as unknown as PocketBase)
      const result = await repo.update('quote1', { vendor: 'New Vendor' })

      expect(result.vendor).toBe('New Vendor')
    })

    it('should convert validUntil date to ISO string', async () => {
      const record = makeQuoteRecord()
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const date = new Date('2024-12-31')
      const repo = createQuoteRepository(mockPb as unknown as PocketBase)
      await repo.update('quote1', { validUntil: date })

      expect(mockUpdate).toHaveBeenCalledWith('quote1', { validUntil: date.toISOString() })
    })
  })

  describe('updateStatus', () => {
    it('should update status with extra fields', async () => {
      const sentAt = new Date('2024-03-15')
      const record = makeQuoteRecord({ status: 'sent', sentAt: sentAt.toISOString() })
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const repo = createQuoteRepository(mockPb as unknown as PocketBase)
      const result = await repo.updateStatus('quote1', 'sent', { sentAt })

      expect(result.status).toBe('sent')
      expect(mockUpdate).toHaveBeenCalledWith(
        'quote1',
        expect.objectContaining({
          status: 'sent',
          sentAt: sentAt.toISOString()
        })
      )
    })

    it('should update status without extra fields', async () => {
      const record = makeQuoteRecord({ status: 'accepted' })
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const repo = createQuoteRepository(mockPb as unknown as PocketBase)
      await repo.updateStatus('quote1', 'accepted')

      expect(mockUpdate).toHaveBeenCalledWith('quote1', { status: 'accepted' })
    })
  })

  describe('delete', () => {
    it('should delete a quote by id', async () => {
      const mockDelete = vi.fn().mockResolvedValue(undefined)
      mockPb._mockCollection.mockReturnValue({ delete: mockDelete })

      const repo = createQuoteRepository(mockPb as unknown as PocketBase)
      await repo.delete('quote1')

      expect(mockDelete).toHaveBeenCalledWith('quote1')
    })
  })

  describe('getNextSequence', () => {
    it('should return totalItems + 1', async () => {
      const mockGetList = vi.fn().mockResolvedValue({ totalItems: 5 })
      mockPb._mockCollection.mockReturnValue({ getList: mockGetList })

      const repo = createQuoteRepository(mockPb as unknown as PocketBase)
      const result = await repo.getNextSequence('edition1')

      expect(result).toBe(6)
    })

    it('should return 1 when no quotes exist', async () => {
      const mockGetList = vi.fn().mockResolvedValue({ totalItems: 0 })
      mockPb._mockCollection.mockReturnValue({ getList: mockGetList })

      const repo = createQuoteRepository(mockPb as unknown as PocketBase)
      const result = await repo.getNextSequence('edition1')

      expect(result).toBe(1)
    })
  })
})
