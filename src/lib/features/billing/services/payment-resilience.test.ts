import { beforeEach, describe, expect, it, vi } from 'vitest'
import { isAlreadyProcessed, markProcessed } from './payment-resilience'

describe('payment-resilience', () => {
  const mockPb = {
    collection: vi.fn()
  }

  const mockCollection = {
    getList: vi.fn(),
    create: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockPb.collection.mockReturnValue(mockCollection)
  })

  describe('isAlreadyProcessed', () => {
    it('should return true when event exists', async () => {
      mockCollection.getList.mockResolvedValue({
        items: [{ id: '1', eventId: 'evt_123' }]
      })

      const result = await isAlreadyProcessed(mockPb as never, 'evt_123')
      expect(result).toBe(true)
    })

    it('should return false when event not found', async () => {
      mockCollection.getList.mockResolvedValue({ items: [] })

      const result = await isAlreadyProcessed(mockPb as never, 'evt_unknown')
      expect(result).toBe(false)
    })

    it('should return false on error', async () => {
      mockCollection.getList.mockRejectedValue(new Error('DB error'))

      const result = await isAlreadyProcessed(mockPb as never, 'evt_error')
      expect(result).toBe(false)
    })
  })

  describe('markProcessed', () => {
    it('should create a record', async () => {
      mockCollection.create.mockResolvedValue({ id: '1' })

      await markProcessed(mockPb as never, 'evt_123', 'stripe')

      expect(mockCollection.create).toHaveBeenCalledWith({
        eventId: 'evt_123',
        provider: 'stripe',
        processedAt: expect.any(String)
      })
    })

    it('should not throw on duplicate', async () => {
      mockCollection.create.mockRejectedValue(new Error('Unique constraint'))

      await expect(markProcessed(mockPb as never, 'evt_dup', 'stripe')).resolves.toBeUndefined()
    })
  })
})
