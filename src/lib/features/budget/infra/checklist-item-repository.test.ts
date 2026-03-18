import type PocketBase from 'pocketbase'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createChecklistItemRepository } from './checklist-item-repository'

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

const makeChecklistRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'chk1',
  editionId: 'edition1',
  categoryId: 'cat1',
  name: 'Book venue',
  description: 'Reserve the conference hall',
  estimatedAmount: 5000,
  status: 'pending',
  priority: 'high',
  dueDate: '2024-06-01T00:00:00Z',
  assignee: 'user1',
  notes: 'Contact venue manager',
  order: 0,
  transactionId: null,
  createdBy: 'user1',
  created: '2024-01-01T00:00:00Z',
  updated: '2024-01-02T00:00:00Z',
  ...overrides
})

describe('ChecklistItemRepository', () => {
  let mockPb: ReturnType<typeof createMockPb>

  beforeEach(() => {
    mockPb = createMockPb()
  })

  describe('findByEdition', () => {
    it('should return checklist items for an edition', async () => {
      const records = [makeChecklistRecord()]
      const mockGetFullList = vi.fn().mockResolvedValue(records)
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = createChecklistItemRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByEdition('edition1')

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Book venue')
      expect(mockGetFullList).toHaveBeenCalledWith(
        expect.objectContaining({ sort: 'order,created' })
      )
    })
  })

  describe('findByEditionAndStatus', () => {
    it('should return items filtered by status', async () => {
      const records = [makeChecklistRecord({ status: 'approved' })]
      const mockGetFullList = vi.fn().mockResolvedValue(records)
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = createChecklistItemRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByEditionAndStatus('edition1', 'approved')

      expect(result).toHaveLength(1)
      expect(result[0].status).toBe('approved')
    })
  })

  describe('findByCategory', () => {
    it('should return items for a category', async () => {
      const records = [makeChecklistRecord()]
      const mockGetFullList = vi.fn().mockResolvedValue(records)
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = createChecklistItemRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByCategory('cat1')

      expect(result).toHaveLength(1)
    })
  })

  describe('findById', () => {
    it('should return item by id', async () => {
      const record = makeChecklistRecord()
      const mockGetOne = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ getOne: mockGetOne })

      const repo = createChecklistItemRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('chk1')

      expect(result?.priority).toBe('high')
      expect(result?.estimatedAmount).toBe(5000)
    })

    it('should return null when not found', async () => {
      const mockGetOne = vi.fn().mockRejectedValue(new Error('not found'))
      mockPb._mockCollection.mockReturnValue({ getOne: mockGetOne })

      const repo = createChecklistItemRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('create', () => {
    it('should create a checklist item', async () => {
      const record = makeChecklistRecord()
      const mockCreate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ create: mockCreate })

      const repo = createChecklistItemRepository(mockPb as unknown as PocketBase)
      const result = await repo.create({
        editionId: 'edition1',
        name: 'Book venue',
        estimatedAmount: 5000,
        priority: 'high',
        status: 'pending',
        order: 0,
        createdBy: 'user1'
      })

      expect(result.name).toBe('Book venue')
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          editionId: 'edition1',
          name: 'Book venue',
          status: 'pending'
        })
      )
    })
  })

  describe('createMany', () => {
    it('should create multiple items sequentially', async () => {
      const record1 = makeChecklistRecord({ id: 'chk1', name: 'Item 1' })
      const record2 = makeChecklistRecord({ id: 'chk2', name: 'Item 2' })
      const mockCreate = vi.fn().mockResolvedValueOnce(record1).mockResolvedValueOnce(record2)
      mockPb._mockCollection.mockReturnValue({ create: mockCreate })

      const repo = createChecklistItemRepository(mockPb as unknown as PocketBase)
      const result = await repo.createMany([
        {
          editionId: 'edition1',
          name: 'Item 1',
          createdBy: 'user1',
          status: 'pending',
          order: 0,
          priority: 'medium',
          estimatedAmount: 0
        },
        {
          editionId: 'edition1',
          name: 'Item 2',
          createdBy: 'user1',
          status: 'pending',
          order: 1,
          priority: 'medium',
          estimatedAmount: 0
        }
      ])

      expect(result).toHaveLength(2)
      expect(mockCreate).toHaveBeenCalledTimes(2)
    })
  })

  describe('update', () => {
    it('should update only provided fields', async () => {
      const record = makeChecklistRecord({ status: 'approved' })
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const repo = createChecklistItemRepository(mockPb as unknown as PocketBase)
      const result = await repo.update('chk1', { status: 'approved' })

      expect(result.status).toBe('approved')
    })
  })

  describe('updateOrder', () => {
    it('should update the order of an item', async () => {
      const mockUpdate = vi.fn().mockResolvedValue({})
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const repo = createChecklistItemRepository(mockPb as unknown as PocketBase)
      await repo.updateOrder('chk1', 5)

      expect(mockUpdate).toHaveBeenCalledWith('chk1', { order: 5 })
    })
  })

  describe('reorder', () => {
    it('should update order for multiple items', async () => {
      const mockUpdate = vi.fn().mockResolvedValue({})
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const repo = createChecklistItemRepository(mockPb as unknown as PocketBase)
      await repo.reorder([
        { id: 'chk1', order: 0 },
        { id: 'chk2', order: 1 },
        { id: 'chk3', order: 2 }
      ])

      expect(mockUpdate).toHaveBeenCalledTimes(3)
      expect(mockUpdate).toHaveBeenCalledWith('chk2', { order: 1 })
    })
  })

  describe('delete', () => {
    it('should delete an item by id', async () => {
      const mockDelete = vi.fn().mockResolvedValue(undefined)
      mockPb._mockCollection.mockReturnValue({ delete: mockDelete })

      const repo = createChecklistItemRepository(mockPb as unknown as PocketBase)
      await repo.delete('chk1')

      expect(mockDelete).toHaveBeenCalledWith('chk1')
    })
  })

  describe('countByEdition', () => {
    it('should return count of items for an edition', async () => {
      const mockGetList = vi.fn().mockResolvedValue({ totalItems: 12 })
      mockPb._mockCollection.mockReturnValue({ getList: mockGetList })

      const repo = createChecklistItemRepository(mockPb as unknown as PocketBase)
      const result = await repo.countByEdition('edition1')

      expect(result).toBe(12)
    })
  })

  describe('countByStatus', () => {
    it('should return count of items with a specific status', async () => {
      const mockGetList = vi.fn().mockResolvedValue({ totalItems: 5 })
      mockPb._mockCollection.mockReturnValue({ getList: mockGetList })

      const repo = createChecklistItemRepository(mockPb as unknown as PocketBase)
      const result = await repo.countByStatus('edition1', 'approved')

      expect(result).toBe(5)
    })
  })

  describe('sumEstimatedByEdition', () => {
    it('should sum estimated amounts excluding cancelled items', async () => {
      const records = [
        { estimatedAmount: 5000 },
        { estimatedAmount: 3000 },
        { estimatedAmount: 2000 }
      ]
      const mockGetFullList = vi.fn().mockResolvedValue(records)
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = createChecklistItemRepository(mockPb as unknown as PocketBase)
      const result = await repo.sumEstimatedByEdition('edition1')

      expect(result).toBe(10000)
    })
  })

  describe('getNextOrder', () => {
    it('should return next order number', async () => {
      const mockGetList = vi.fn().mockResolvedValue({ items: [{ order: 7 }] })
      mockPb._mockCollection.mockReturnValue({ getList: mockGetList })

      const repo = createChecklistItemRepository(mockPb as unknown as PocketBase)
      const result = await repo.getNextOrder('edition1')

      expect(result).toBe(8)
    })

    it('should return 0 when no items exist', async () => {
      const mockGetList = vi.fn().mockResolvedValue({ items: [] })
      mockPb._mockCollection.mockReturnValue({ getList: mockGetList })

      const repo = createChecklistItemRepository(mockPb as unknown as PocketBase)
      const result = await repo.getNextOrder('edition1')

      expect(result).toBe(0)
    })
  })
})
