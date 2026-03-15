import type PocketBase from 'pocketbase'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createOrderItemRepository } from './order-item-repository'

vi.mock('$lib/server/safe-filter', () => ({
  safeFilter: (strings: TemplateStringsArray, ...values: unknown[]) =>
    strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), '')
}))

const createMockPb = () => {
  const mockCollection = {
    getOne: vi.fn(),
    getFullList: vi.fn(),
    create: vi.fn()
  }
  return { collection: vi.fn(() => mockCollection), mockCollection }
}

const MOCK_RECORD = {
  id: 'item1',
  orderId: 'order1',
  ticketTypeId: 'tt1',
  ticketTypeName: 'VIP',
  quantity: 2,
  unitPrice: 50,
  totalPrice: 100,
  created: '2024-01-01T00:00:00Z',
  updated: '2024-01-01T00:00:00Z'
}

describe('OrderItemRepository', () => {
  let mockPb: ReturnType<typeof createMockPb>

  beforeEach(() => {
    mockPb = createMockPb()
    vi.clearAllMocks()
  })

  const getRepo = () => createOrderItemRepository(mockPb as unknown as PocketBase)

  describe('findById', () => {
    it('should return an order item when found', async () => {
      mockPb.mockCollection.getOne.mockResolvedValue(MOCK_RECORD)
      const result = await getRepo().findById('item1')

      expect(mockPb.collection).toHaveBeenCalledWith('order_items')
      expect(result?.id).toBe('item1')
      expect(result?.ticketTypeName).toBe('VIP')
      expect(result?.totalPrice).toBe(100)
    })

    it('should return null when not found', async () => {
      mockPb.mockCollection.getOne.mockRejectedValue(new Error('Not found'))
      const result = await getRepo().findById('nonexistent')
      expect(result).toBeNull()
    })
  })

  describe('findByOrder', () => {
    it('should return items for an order', async () => {
      mockPb.mockCollection.getFullList.mockResolvedValue([MOCK_RECORD])
      const result = await getRepo().findByOrder('order1')

      expect(mockPb.mockCollection.getFullList).toHaveBeenCalledWith({
        filter: expect.any(String),
        sort: 'created'
      })
      expect(result).toHaveLength(1)
      expect(result[0].orderId).toBe('order1')
    })
  })

  describe('create', () => {
    it('should create an order item', async () => {
      mockPb.mockCollection.create.mockResolvedValue(MOCK_RECORD)
      const result = await getRepo().create({
        orderId: 'order1',
        ticketTypeId: 'tt1',
        ticketTypeName: 'VIP',
        quantity: 2,
        unitPrice: 50,
        totalPrice: 100
      })

      expect(result.id).toBe('item1')
      expect(result.quantity).toBe(2)
    })
  })

  describe('mapping', () => {
    it('should map dates correctly', async () => {
      mockPb.mockCollection.getOne.mockResolvedValue(MOCK_RECORD)
      const result = await getRepo().findById('item1')

      expect(result?.createdAt).toBeInstanceOf(Date)
      expect(result?.updatedAt).toBeInstanceOf(Date)
    })
  })
})
