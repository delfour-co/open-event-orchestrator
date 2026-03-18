import type PocketBase from 'pocketbase'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createCategoryRepository } from './category-repository'

vi.mock('$lib/server/safe-filter', () => ({
  safeFilter: (strings: TemplateStringsArray, ...values: unknown[]) =>
    strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), '')
}))

const createMockPb = () => {
  const mockCollection = {
    getOne: vi.fn(),
    getFullList: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }
  return { collection: vi.fn(() => mockCollection), mockCollection }
}

const MOCK_RECORD = {
  id: 'cat1',
  editionId: 'edition1',
  name: 'Web',
  description: 'Web development',
  color: '#FF0000',
  order: 1,
  created: '2024-01-01T00:00:00Z',
  updated: '2024-01-01T00:00:00Z'
}

describe('CategoryRepository', () => {
  let mockPb: ReturnType<typeof createMockPb>

  beforeEach(() => {
    mockPb = createMockPb()
    vi.clearAllMocks()
  })

  const getRepo = () => createCategoryRepository(mockPb as unknown as PocketBase)

  describe('findById', () => {
    it('should return a category when found', async () => {
      mockPb.mockCollection.getOne.mockResolvedValue(MOCK_RECORD)
      const result = await getRepo().findById('cat1')

      expect(mockPb.collection).toHaveBeenCalledWith('categories')
      expect(result?.id).toBe('cat1')
      expect(result?.name).toBe('Web')
    })

    it('should return null when not found', async () => {
      mockPb.mockCollection.getOne.mockRejectedValue(new Error('Not found'))
      const result = await getRepo().findById('nonexistent')
      expect(result).toBeNull()
    })
  })

  describe('findByEdition', () => {
    it('should return categories sorted by order', async () => {
      mockPb.mockCollection.getFullList.mockResolvedValue([MOCK_RECORD])
      const result = await getRepo().findByEdition('edition1')

      expect(mockPb.mockCollection.getFullList).toHaveBeenCalledWith({
        filter: expect.any(String),
        sort: 'order'
      })
      expect(result).toHaveLength(1)
      expect(result[0].editionId).toBe('edition1')
    })

    it('should return empty array when no categories', async () => {
      mockPb.mockCollection.getFullList.mockResolvedValue([])
      const result = await getRepo().findByEdition('edition1')
      expect(result).toHaveLength(0)
    })
  })

  describe('create', () => {
    it('should create a category with default order', async () => {
      mockPb.mockCollection.create.mockResolvedValue(MOCK_RECORD)
      await getRepo().create({ editionId: 'edition1', name: 'Web', order: 0 })

      expect(mockPb.mockCollection.create).toHaveBeenCalledWith(
        expect.objectContaining({ order: 0 })
      )
    })

    it('should use provided order', async () => {
      mockPb.mockCollection.create.mockResolvedValue(MOCK_RECORD)
      await getRepo().create({ editionId: 'edition1', name: 'Web', order: 5 })

      expect(mockPb.mockCollection.create).toHaveBeenCalledWith(
        expect.objectContaining({ order: 5 })
      )
    })
  })

  describe('update', () => {
    it('should update a category', async () => {
      mockPb.mockCollection.update.mockResolvedValue({ ...MOCK_RECORD, name: 'Mobile' })
      const result = await getRepo().update('cat1', { name: 'Mobile' })

      expect(mockPb.mockCollection.update).toHaveBeenCalledWith('cat1', { name: 'Mobile' })
      expect(result.name).toBe('Mobile')
    })
  })

  describe('delete', () => {
    it('should delete the category', async () => {
      mockPb.mockCollection.delete.mockResolvedValue(undefined)
      await getRepo().delete('cat1')
      expect(mockPb.mockCollection.delete).toHaveBeenCalledWith('cat1')
    })
  })

  describe('mapping', () => {
    it('should map all fields correctly', async () => {
      mockPb.mockCollection.getOne.mockResolvedValue(MOCK_RECORD)
      const result = await getRepo().findById('cat1')

      expect(result?.description).toBe('Web development')
      expect(result?.color).toBe('#FF0000')
      expect(result?.order).toBe(1)
      expect(result?.createdAt).toBeInstanceOf(Date)
      expect(result?.updatedAt).toBeInstanceOf(Date)
    })
  })
})
