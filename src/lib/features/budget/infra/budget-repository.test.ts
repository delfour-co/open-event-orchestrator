import type PocketBase from 'pocketbase'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createBudgetRepository } from './budget-repository'

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

const makeBudgetRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'budget1',
  editionId: 'edition1',
  totalBudget: 50000,
  currency: 'EUR',
  status: 'draft',
  notes: 'Some notes',
  created: '2024-01-01T00:00:00Z',
  updated: '2024-01-02T00:00:00Z',
  ...overrides
})

describe('BudgetRepository', () => {
  let mockPb: ReturnType<typeof createMockPb>

  beforeEach(() => {
    mockPb = createMockPb()
  })

  describe('findByEdition', () => {
    it('should return budget when found', async () => {
      const record = makeBudgetRecord()
      const mockGetList = vi.fn().mockResolvedValue({ items: [record] })
      mockPb._mockCollection.mockReturnValue({ getList: mockGetList })

      const repo = createBudgetRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByEdition('edition1')

      expect(result).not.toBeNull()
      expect(result?.id).toBe('budget1')
      expect(result?.editionId).toBe('edition1')
      expect(result?.totalBudget).toBe(50000)
      expect(mockGetList).toHaveBeenCalledWith(
        1,
        1,
        expect.objectContaining({ filter: expect.stringContaining('edition1') })
      )
    })

    it('should return null when no budget found', async () => {
      const mockGetList = vi.fn().mockResolvedValue({ items: [] })
      mockPb._mockCollection.mockReturnValue({ getList: mockGetList })

      const repo = createBudgetRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByEdition('nonexistent')

      expect(result).toBeNull()
    })

    it('should return null on error', async () => {
      const mockGetList = vi.fn().mockRejectedValue(new Error('fail'))
      mockPb._mockCollection.mockReturnValue({ getList: mockGetList })

      const repo = createBudgetRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByEdition('edition1')

      expect(result).toBeNull()
    })
  })

  describe('findById', () => {
    it('should return budget by id', async () => {
      const record = makeBudgetRecord()
      const mockGetOne = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ getOne: mockGetOne })

      const repo = createBudgetRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('budget1')

      expect(result?.id).toBe('budget1')
      expect(result?.currency).toBe('EUR')
      expect(mockGetOne).toHaveBeenCalledWith('budget1')
    })

    it('should return null when not found', async () => {
      const mockGetOne = vi.fn().mockRejectedValue(new Error('not found'))
      mockPb._mockCollection.mockReturnValue({ getOne: mockGetOne })

      const repo = createBudgetRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('create', () => {
    it('should create a budget with provided values', async () => {
      const record = makeBudgetRecord()
      const mockCreate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ create: mockCreate })

      const repo = createBudgetRepository(mockPb as unknown as PocketBase)
      const result = await repo.create({
        editionId: 'edition1',
        totalBudget: 50000,
        currency: 'EUR',
        status: 'draft',
        notes: 'Some notes'
      })

      expect(result.id).toBe('budget1')
      expect(result.totalBudget).toBe(50000)
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          editionId: 'edition1',
          totalBudget: 50000,
          currency: 'EUR'
        })
      )
    })

    it('should use default values for optional fields', async () => {
      const record = makeBudgetRecord({ currency: 'EUR', status: 'draft', notes: null })
      const mockCreate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ create: mockCreate })

      const repo = createBudgetRepository(mockPb as unknown as PocketBase)
      await repo.create({ editionId: 'edition1', totalBudget: 1000 })

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          currency: 'EUR',
          status: 'draft',
          notes: null
        })
      )
    })
  })

  describe('update', () => {
    it('should update only provided fields', async () => {
      const record = makeBudgetRecord({ totalBudget: 75000 })
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const repo = createBudgetRepository(mockPb as unknown as PocketBase)
      const result = await repo.update('budget1', { totalBudget: 75000 })

      expect(result.totalBudget).toBe(75000)
      expect(mockUpdate).toHaveBeenCalledWith('budget1', { totalBudget: 75000 })
    })

    it('should update status field', async () => {
      const record = makeBudgetRecord({ status: 'approved' })
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const repo = createBudgetRepository(mockPb as unknown as PocketBase)
      const result = await repo.update('budget1', { status: 'approved' })

      expect(result.status).toBe('approved')
    })
  })

  describe('delete', () => {
    it('should delete a budget by id', async () => {
      const mockDelete = vi.fn().mockResolvedValue(undefined)
      mockPb._mockCollection.mockReturnValue({ delete: mockDelete })

      const repo = createBudgetRepository(mockPb as unknown as PocketBase)
      await repo.delete('budget1')

      expect(mockDelete).toHaveBeenCalledWith('budget1')
    })
  })
})
