import type PocketBase from 'pocketbase'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createCategoryRepository } from './category-repository'

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

const makeCategoryRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'cat1',
  budgetId: 'budget1',
  name: 'Venue',
  plannedAmount: 10000,
  notes: 'Venue rental',
  created: '2024-01-01T00:00:00Z',
  updated: '2024-01-02T00:00:00Z',
  ...overrides
})

describe('CategoryRepository', () => {
  let mockPb: ReturnType<typeof createMockPb>

  beforeEach(() => {
    mockPb = createMockPb()
  })

  describe('findByBudget', () => {
    it('should return categories for a budget', async () => {
      const records = [makeCategoryRecord(), makeCategoryRecord({ id: 'cat2', name: 'Catering' })]
      const mockGetFullList = vi.fn().mockResolvedValue(records)
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = createCategoryRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByBudget('budget1')

      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('Venue')
      expect(mockGetFullList).toHaveBeenCalledWith(expect.objectContaining({ sort: 'name' }))
    })

    it('should return empty array when no categories found', async () => {
      const mockGetFullList = vi.fn().mockResolvedValue([])
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = createCategoryRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByBudget('budget1')

      expect(result).toHaveLength(0)
    })
  })

  describe('findById', () => {
    it('should return category by id', async () => {
      const record = makeCategoryRecord()
      const mockGetOne = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ getOne: mockGetOne })

      const repo = createCategoryRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('cat1')

      expect(result?.id).toBe('cat1')
      expect(result?.plannedAmount).toBe(10000)
    })

    it('should return null when not found', async () => {
      const mockGetOne = vi.fn().mockRejectedValue(new Error('not found'))
      mockPb._mockCollection.mockReturnValue({ getOne: mockGetOne })

      const repo = createCategoryRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('create', () => {
    it('should create a category', async () => {
      const record = makeCategoryRecord()
      const mockCreate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ create: mockCreate })

      const repo = createCategoryRepository(mockPb as unknown as PocketBase)
      const result = await repo.create({
        budgetId: 'budget1',
        name: 'Venue',
        plannedAmount: 10000,
        notes: 'Venue rental'
      })

      expect(result.name).toBe('Venue')
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          budgetId: 'budget1',
          name: 'Venue',
          plannedAmount: 10000
        })
      )
    })

    it('should default plannedAmount to 0 and notes to null', async () => {
      const record = makeCategoryRecord({ plannedAmount: 0, notes: null })
      const mockCreate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ create: mockCreate })

      const repo = createCategoryRepository(mockPb as unknown as PocketBase)
      await repo.create({ budgetId: 'budget1', name: 'Other' })

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          plannedAmount: 0,
          notes: null
        })
      )
    })
  })

  describe('update', () => {
    it('should update only provided fields', async () => {
      const record = makeCategoryRecord({ name: 'Updated Venue' })
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const repo = createCategoryRepository(mockPb as unknown as PocketBase)
      const result = await repo.update('cat1', { name: 'Updated Venue' })

      expect(result.name).toBe('Updated Venue')
      expect(mockUpdate).toHaveBeenCalledWith('cat1', { name: 'Updated Venue' })
    })

    it('should set notes to null when empty string', async () => {
      const record = makeCategoryRecord({ notes: null })
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const repo = createCategoryRepository(mockPb as unknown as PocketBase)
      await repo.update('cat1', { notes: '' })

      expect(mockUpdate).toHaveBeenCalledWith('cat1', { notes: null })
    })
  })

  describe('delete', () => {
    it('should delete a category by id', async () => {
      const mockDelete = vi.fn().mockResolvedValue(undefined)
      mockPb._mockCollection.mockReturnValue({ delete: mockDelete })

      const repo = createCategoryRepository(mockPb as unknown as PocketBase)
      await repo.delete('cat1')

      expect(mockDelete).toHaveBeenCalledWith('cat1')
    })
  })
})
