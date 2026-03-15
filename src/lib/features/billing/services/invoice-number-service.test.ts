import type PocketBase from 'pocketbase'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getNextCreditNoteNumber, getNextInvoiceNumber } from './invoice-number-service'

const createMockPb = () => {
  const mockCollection = {
    getFirstListItem: vi.fn(),
    create: vi.fn(),
    update: vi.fn()
  }
  return { collection: vi.fn(() => mockCollection), mockCollection }
}

describe('InvoiceNumberService', () => {
  let mockPb: ReturnType<typeof createMockPb>

  beforeEach(() => {
    mockPb = createMockPb()
    vi.clearAllMocks()
  })

  describe('getNextInvoiceNumber', () => {
    it('should create a counter and return first number when none exists', async () => {
      mockPb.mockCollection.getFirstListItem.mockRejectedValue(new Error('Not found'))
      mockPb.mockCollection.create.mockResolvedValue({})

      const result = await getNextInvoiceNumber(mockPb as unknown as PocketBase, 'org1')

      expect(mockPb.collection).toHaveBeenCalledWith('invoice_counters')
      expect(mockPb.mockCollection.create).toHaveBeenCalledWith({
        organizationId: 'org1',
        lastNumber: 1,
        prefix: 'F'
      })
      expect(result).toMatch(/^F-\d{4}-000001$/)
    })

    it('should increment existing counter', async () => {
      mockPb.mockCollection.getFirstListItem.mockResolvedValue({
        id: 'counter1',
        lastNumber: 5
      })
      mockPb.mockCollection.update.mockResolvedValue({})

      const result = await getNextInvoiceNumber(mockPb as unknown as PocketBase, 'org1')

      expect(mockPb.mockCollection.update).toHaveBeenCalledWith('counter1', { lastNumber: 6 })
      expect(result).toMatch(/^F-\d{4}-000006$/)
    })

    it('should pad numbers to 6 digits', async () => {
      mockPb.mockCollection.getFirstListItem.mockResolvedValue({
        id: 'counter1',
        lastNumber: 99
      })
      mockPb.mockCollection.update.mockResolvedValue({})

      const result = await getNextInvoiceNumber(mockPb as unknown as PocketBase, 'org1')

      expect(result).toMatch(/^F-\d{4}-000100$/)
    })

    it('should include the current year', async () => {
      mockPb.mockCollection.getFirstListItem.mockRejectedValue(new Error('Not found'))
      mockPb.mockCollection.create.mockResolvedValue({})

      const result = await getNextInvoiceNumber(mockPb as unknown as PocketBase, 'org1')
      const year = new Date().getFullYear()

      expect(result).toContain(`F-${year}-`)
    })
  })

  describe('getNextCreditNoteNumber', () => {
    it('should use AV prefix for credit notes', async () => {
      mockPb.mockCollection.getFirstListItem.mockRejectedValue(new Error('Not found'))
      mockPb.mockCollection.create.mockResolvedValue({})

      const result = await getNextCreditNoteNumber(mockPb as unknown as PocketBase, 'org1')

      expect(mockPb.mockCollection.create).toHaveBeenCalledWith(
        expect.objectContaining({ prefix: 'AV' })
      )
      expect(result).toMatch(/^AV-\d{4}-000001$/)
    })

    it('should increment existing credit note counter', async () => {
      mockPb.mockCollection.getFirstListItem.mockResolvedValue({
        id: 'counter2',
        lastNumber: 3
      })
      mockPb.mockCollection.update.mockResolvedValue({})

      const result = await getNextCreditNoteNumber(mockPb as unknown as PocketBase, 'org1')

      expect(result).toMatch(/^AV-\d{4}-000004$/)
    })
  })

  describe('edge cases', () => {
    it('should handle counter with lastNumber=0', async () => {
      mockPb.mockCollection.getFirstListItem.mockResolvedValue({
        id: 'counter1',
        lastNumber: 0
      })
      mockPb.mockCollection.update.mockResolvedValue({})

      const result = await getNextInvoiceNumber(mockPb as unknown as PocketBase, 'org1')

      expect(result).toMatch(/^F-\d{4}-000001$/)
    })
  })
})
