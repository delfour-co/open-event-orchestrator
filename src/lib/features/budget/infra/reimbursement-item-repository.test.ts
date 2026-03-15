import type PocketBase from 'pocketbase'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createReimbursementItemRepository } from './reimbursement-item-repository'

vi.mock('$lib/server/safe-filter', () => ({
  safeFilter: (strings: TemplateStringsArray, ...values: string[]) =>
    strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), '')
}))

const createMockPb = () => {
  const mockCollection = vi.fn()
  return {
    collection: mockCollection,
    _mockCollection: mockCollection,
    files: {
      getURL: vi.fn().mockReturnValue('https://example.com/receipt.jpg')
    }
  }
}

const makeItemRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'item1',
  requestId: 'req1',
  expenseType: 'transport',
  description: 'Train ticket',
  amount: 150,
  date: '2024-03-01T00:00:00Z',
  receipt: 'receipt.jpg',
  notes: 'Round trip',
  created: '2024-01-01T00:00:00Z',
  updated: '2024-01-02T00:00:00Z',
  ...overrides
})

describe('ReimbursementItemRepository', () => {
  let mockPb: ReturnType<typeof createMockPb>

  beforeEach(() => {
    mockPb = createMockPb()
  })

  describe('findByRequest', () => {
    it('should return items for a request', async () => {
      const records = [makeItemRecord(), makeItemRecord({ id: 'item2', description: 'Hotel' })]
      const mockGetFullList = vi.fn().mockResolvedValue(records)
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = createReimbursementItemRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByRequest('req1')

      expect(result).toHaveLength(2)
      expect(result[0].description).toBe('Train ticket')
      expect(mockGetFullList).toHaveBeenCalledWith(expect.objectContaining({ sort: 'date' }))
    })
  })

  describe('findById', () => {
    it('should return item by id', async () => {
      const record = makeItemRecord()
      const mockGetOne = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ getOne: mockGetOne })

      const repo = createReimbursementItemRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('item1')

      expect(result?.expenseType).toBe('transport')
      expect(result?.amount).toBe(150)
    })

    it('should return null when not found', async () => {
      const mockGetOne = vi.fn().mockRejectedValue(new Error('not found'))
      mockPb._mockCollection.mockReturnValue({ getOne: mockGetOne })

      const repo = createReimbursementItemRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('create', () => {
    it('should create an item from FormData', async () => {
      const record = makeItemRecord()
      const mockCreate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ create: mockCreate })

      const formData = new FormData()
      const repo = createReimbursementItemRepository(mockPb as unknown as PocketBase)
      const result = await repo.create(formData)

      expect(result.description).toBe('Train ticket')
      expect(mockCreate).toHaveBeenCalledWith(formData)
    })
  })

  describe('update', () => {
    it('should update an item from FormData', async () => {
      const record = makeItemRecord({ amount: 200 })
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const formData = new FormData()
      const repo = createReimbursementItemRepository(mockPb as unknown as PocketBase)
      const result = await repo.update('item1', formData)

      expect(result.amount).toBe(200)
      expect(mockUpdate).toHaveBeenCalledWith('item1', formData)
    })
  })

  describe('delete', () => {
    it('should delete an item by id', async () => {
      const mockDelete = vi.fn().mockResolvedValue(undefined)
      mockPb._mockCollection.mockReturnValue({ delete: mockDelete })

      const repo = createReimbursementItemRepository(mockPb as unknown as PocketBase)
      await repo.delete('item1')

      expect(mockDelete).toHaveBeenCalledWith('item1')
    })
  })

  describe('getReceiptUrl', () => {
    it('should return receipt URL when receipt exists', () => {
      const repo = createReimbursementItemRepository(mockPb as unknown as PocketBase)
      const url = repo.getReceiptUrl({
        id: 'item1',
        requestId: 'req1',
        expenseType: 'transport',
        description: 'Train',
        amount: 150,
        date: new Date(),
        receipt: 'receipt.jpg',
        createdAt: new Date(),
        updatedAt: new Date()
      })

      expect(url).toBe('https://example.com/receipt.jpg')
    })

    it('should return null when no receipt', () => {
      const repo = createReimbursementItemRepository(mockPb as unknown as PocketBase)
      const url = repo.getReceiptUrl({
        id: 'item1',
        requestId: 'req1',
        expenseType: 'transport',
        description: 'Train',
        amount: 150,
        date: new Date(),
        receipt: undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      expect(url).toBeNull()
    })
  })
})
