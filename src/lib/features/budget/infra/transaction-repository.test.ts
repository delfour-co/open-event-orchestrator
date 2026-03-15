import type PocketBase from 'pocketbase'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createTransactionRepository } from './transaction-repository'

vi.mock('$lib/server/safe-filter', () => ({
  safeFilter: (strings: TemplateStringsArray, ...values: string[]) =>
    strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), ''),
  filterIn: (field: string, values: string[]) => values.map((v) => `${field} = "${v}"`).join(' || ')
}))

const createMockPb = () => {
  const mockCollection = vi.fn()
  return {
    collection: mockCollection,
    _mockCollection: mockCollection
  }
}

const makeTransactionRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'tx1',
  categoryId: 'cat1',
  type: 'expense',
  amount: 500,
  description: 'Office supplies',
  vendor: 'Staples',
  invoiceNumber: 'INV-001',
  date: '2024-03-01T00:00:00Z',
  status: 'paid',
  created: '2024-01-01T00:00:00Z',
  updated: '2024-01-02T00:00:00Z',
  ...overrides
})

describe('TransactionRepository', () => {
  let mockPb: ReturnType<typeof createMockPb>

  beforeEach(() => {
    mockPb = createMockPb()
  })

  describe('findByCategory', () => {
    it('should return transactions for a category', async () => {
      const records = [makeTransactionRecord()]
      const mockGetFullList = vi.fn().mockResolvedValue(records)
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = createTransactionRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByCategory('cat1')

      expect(result).toHaveLength(1)
      expect(result[0].description).toBe('Office supplies')
      expect(mockGetFullList).toHaveBeenCalledWith(expect.objectContaining({ sort: '-date' }))
    })
  })

  describe('findByBudget', () => {
    it('should return transactions for multiple category ids', async () => {
      const records = [
        makeTransactionRecord(),
        makeTransactionRecord({ id: 'tx2', categoryId: 'cat2' })
      ]
      const mockGetFullList = vi.fn().mockResolvedValue(records)
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = createTransactionRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByBudget(['cat1', 'cat2'])

      expect(result).toHaveLength(2)
    })

    it('should return empty array for empty category ids', async () => {
      const repo = createTransactionRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByBudget([])

      expect(result).toHaveLength(0)
    })
  })

  describe('findById', () => {
    it('should return transaction by id', async () => {
      const record = makeTransactionRecord()
      const mockGetOne = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ getOne: mockGetOne })

      const repo = createTransactionRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('tx1')

      expect(result?.vendor).toBe('Staples')
      expect(result?.status).toBe('paid')
    })

    it('should return null when not found', async () => {
      const mockGetOne = vi.fn().mockRejectedValue(new Error('not found'))
      mockPb._mockCollection.mockReturnValue({ getOne: mockGetOne })

      const repo = createTransactionRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('create', () => {
    it('should create a transaction', async () => {
      const record = makeTransactionRecord()
      const mockCreate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ create: mockCreate })

      const repo = createTransactionRepository(mockPb as unknown as PocketBase)
      const result = await repo.create({
        categoryId: 'cat1',
        type: 'expense',
        amount: 500,
        description: 'Office supplies',
        vendor: 'Staples',
        date: new Date('2024-03-01'),
        status: 'paid'
      })

      expect(result.amount).toBe(500)
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          categoryId: 'cat1',
          type: 'expense',
          amount: 500
        })
      )
    })

    it('should use default status when not provided', async () => {
      const record = makeTransactionRecord({ status: 'pending' })
      const mockCreate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ create: mockCreate })

      const repo = createTransactionRepository(mockPb as unknown as PocketBase)
      await repo.create({
        categoryId: 'cat1',
        type: 'expense',
        amount: 100,
        description: 'Test',
        date: new Date()
      })

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'pending'
        })
      )
    })
  })

  describe('update', () => {
    it('should update only provided fields', async () => {
      const record = makeTransactionRecord({ amount: 750 })
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const repo = createTransactionRepository(mockPb as unknown as PocketBase)
      const result = await repo.update('tx1', { amount: 750 })

      expect(result.amount).toBe(750)
      expect(mockUpdate).toHaveBeenCalledWith('tx1', { amount: 750 })
    })

    it('should convert date to ISO string', async () => {
      const record = makeTransactionRecord()
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const date = new Date('2024-06-15')
      const repo = createTransactionRepository(mockPb as unknown as PocketBase)
      await repo.update('tx1', { date })

      expect(mockUpdate).toHaveBeenCalledWith('tx1', { date: date.toISOString() })
    })
  })

  describe('delete', () => {
    it('should delete a transaction by id', async () => {
      const mockDelete = vi.fn().mockResolvedValue(undefined)
      mockPb._mockCollection.mockReturnValue({ delete: mockDelete })

      const repo = createTransactionRepository(mockPb as unknown as PocketBase)
      await repo.delete('tx1')

      expect(mockDelete).toHaveBeenCalledWith('tx1')
    })
  })

  describe('countByCategory', () => {
    it('should return count of transactions in a category', async () => {
      const mockGetList = vi.fn().mockResolvedValue({ totalItems: 7 })
      mockPb._mockCollection.mockReturnValue({ getList: mockGetList })

      const repo = createTransactionRepository(mockPb as unknown as PocketBase)
      const result = await repo.countByCategory('cat1')

      expect(result).toBe(7)
    })
  })

  describe('sumByCategory', () => {
    it('should sum amounts for matching transactions', async () => {
      const records = [{ amount: 100 }, { amount: 250 }, { amount: 150 }]
      const mockGetFullList = vi.fn().mockResolvedValue(records)
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = createTransactionRepository(mockPb as unknown as PocketBase)
      const result = await repo.sumByCategory('cat1', 'expense', 'paid')

      expect(result).toBe(500)
    })

    it('should return 0 when no transactions match', async () => {
      const mockGetFullList = vi.fn().mockResolvedValue([])
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = createTransactionRepository(mockPb as unknown as PocketBase)
      const result = await repo.sumByCategory('cat1', 'income')

      expect(result).toBe(0)
    })
  })
})
