import type PocketBase from 'pocketbase'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createBudgetTemplateRepository } from './budget-template-repository'

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

const makeTemplateRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'tmpl1',
  name: 'Conference Budget',
  description: 'Standard conference template',
  eventType: 'conference',
  isGlobal: true,
  organizationId: null,
  items: JSON.stringify([
    { name: 'Venue', estimatedAmount: 5000, category: 'venue', isVariable: false, priority: 'high' }
  ]),
  usageCount: 3,
  createdBy: 'user1',
  created: '2024-01-01T00:00:00Z',
  updated: '2024-01-02T00:00:00Z',
  ...overrides
})

describe('BudgetTemplateRepository', () => {
  let mockPb: ReturnType<typeof createMockPb>

  beforeEach(() => {
    mockPb = createMockPb()
  })

  describe('findAll', () => {
    it('should return all templates', async () => {
      const records = [makeTemplateRecord()]
      const mockGetFullList = vi.fn().mockResolvedValue(records)
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = createBudgetTemplateRepository(mockPb as unknown as PocketBase)
      const result = await repo.findAll()

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Conference Budget')
      expect(result[0].items).toHaveLength(1)
      expect(mockGetFullList).toHaveBeenCalledWith(
        expect.objectContaining({ sort: '-usageCount,name' })
      )
    })
  })

  describe('findGlobal', () => {
    it('should return only global templates', async () => {
      const records = [makeTemplateRecord()]
      const mockGetFullList = vi.fn().mockResolvedValue(records)
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = createBudgetTemplateRepository(mockPb as unknown as PocketBase)
      const result = await repo.findGlobal()

      expect(result).toHaveLength(1)
      expect(result[0].isGlobal).toBe(true)
    })
  })

  describe('findByOrganization', () => {
    it('should return org-specific and global templates', async () => {
      const records = [
        makeTemplateRecord(),
        makeTemplateRecord({ id: 'tmpl2', isGlobal: false, organizationId: 'org1' })
      ]
      const mockGetFullList = vi.fn().mockResolvedValue(records)
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = createBudgetTemplateRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByOrganization('org1')

      expect(result).toHaveLength(2)
    })
  })

  describe('findByEventType', () => {
    it('should return templates for a specific event type', async () => {
      const records = [makeTemplateRecord()]
      const mockGetFullList = vi.fn().mockResolvedValue(records)
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = createBudgetTemplateRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByEventType('conference')

      expect(result).toHaveLength(1)
      expect(result[0].eventType).toBe('conference')
    })
  })

  describe('findById', () => {
    it('should return template by id', async () => {
      const record = makeTemplateRecord()
      const mockGetOne = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ getOne: mockGetOne })

      const repo = createBudgetTemplateRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('tmpl1')

      expect(result?.name).toBe('Conference Budget')
      expect(result?.usageCount).toBe(3)
    })

    it('should return null when not found', async () => {
      const mockGetOne = vi.fn().mockRejectedValue(new Error('not found'))
      mockPb._mockCollection.mockReturnValue({ getOne: mockGetOne })

      const repo = createBudgetTemplateRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('nonexistent')

      expect(result).toBeNull()
    })

    it('should parse items from array format', async () => {
      const record = makeTemplateRecord({
        items: [
          {
            name: 'Catering',
            estimatedAmount: 3000,
            category: 'food',
            isVariable: true,
            priority: 'medium'
          }
        ]
      })
      const mockGetOne = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ getOne: mockGetOne })

      const repo = createBudgetTemplateRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('tmpl1')

      expect(result?.items).toHaveLength(1)
      expect(result?.items[0].name).toBe('Catering')
    })
  })

  describe('create', () => {
    it('should create a template', async () => {
      const record = makeTemplateRecord()
      const mockCreate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ create: mockCreate })

      const repo = createBudgetTemplateRepository(mockPb as unknown as PocketBase)
      const result = await repo.create({
        name: 'Conference Budget',
        eventType: 'conference',
        isGlobal: true,
        items: [
          {
            name: 'Venue',
            estimatedAmount: 5000,
            category: 'venue',
            isVariable: false,
            priority: 'high'
          }
        ],
        createdBy: 'user1'
      })

      expect(result.name).toBe('Conference Budget')
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Conference Budget',
          usageCount: 0
        })
      )
    })
  })

  describe('update', () => {
    it('should update only provided fields', async () => {
      const record = makeTemplateRecord({ name: 'Updated Name' })
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const repo = createBudgetTemplateRepository(mockPb as unknown as PocketBase)
      const result = await repo.update('tmpl1', { name: 'Updated Name' })

      expect(result.name).toBe('Updated Name')
    })

    it('should stringify items in update data', async () => {
      const record = makeTemplateRecord()
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const items = [
        {
          name: 'New Item',
          estimatedAmount: 1000,
          category: 'misc',
          isVariable: false,
          priority: 'low' as const
        }
      ]
      const repo = createBudgetTemplateRepository(mockPb as unknown as PocketBase)
      await repo.update('tmpl1', { items })

      expect(mockUpdate).toHaveBeenCalledWith('tmpl1', { items: JSON.stringify(items) })
    })
  })

  describe('incrementUsageCount', () => {
    it('should increment usage count by 1', async () => {
      const record = makeTemplateRecord({ usageCount: 5 })
      const mockGetOne = vi.fn().mockResolvedValue(record)
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ getOne: mockGetOne, update: mockUpdate })

      const repo = createBudgetTemplateRepository(mockPb as unknown as PocketBase)
      await repo.incrementUsageCount('tmpl1')

      expect(mockUpdate).toHaveBeenCalledWith('tmpl1', { usageCount: 6 })
    })
  })

  describe('delete', () => {
    it('should delete a template by id', async () => {
      const mockDelete = vi.fn().mockResolvedValue(undefined)
      mockPb._mockCollection.mockReturnValue({ delete: mockDelete })

      const repo = createBudgetTemplateRepository(mockPb as unknown as PocketBase)
      await repo.delete('tmpl1')

      expect(mockDelete).toHaveBeenCalledWith('tmpl1')
    })
  })

  describe('count', () => {
    it('should return total number of templates', async () => {
      const mockGetList = vi.fn().mockResolvedValue({ totalItems: 10 })
      mockPb._mockCollection.mockReturnValue({ getList: mockGetList })

      const repo = createBudgetTemplateRepository(mockPb as unknown as PocketBase)
      const result = await repo.count()

      expect(result).toBe(10)
    })
  })
})
