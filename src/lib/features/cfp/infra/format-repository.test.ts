import type PocketBase from 'pocketbase'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFormatRepository } from './format-repository'

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
  id: 'fmt1',
  editionId: 'edition1',
  name: 'Lightning Talk',
  description: '5 minute talk',
  duration: 5,
  order: 1,
  created: '2024-01-01T00:00:00Z',
  updated: '2024-01-01T00:00:00Z'
}

describe('FormatRepository', () => {
  let mockPb: ReturnType<typeof createMockPb>

  beforeEach(() => {
    mockPb = createMockPb()
    vi.clearAllMocks()
  })

  const getRepo = () => createFormatRepository(mockPb as unknown as PocketBase)

  describe('findById', () => {
    it('should return a format when found', async () => {
      mockPb.mockCollection.getOne.mockResolvedValue(MOCK_RECORD)
      const result = await getRepo().findById('fmt1')

      expect(mockPb.collection).toHaveBeenCalledWith('formats')
      expect(result?.id).toBe('fmt1')
      expect(result?.name).toBe('Lightning Talk')
      expect(result?.duration).toBe(5)
    })

    it('should return null when not found', async () => {
      mockPb.mockCollection.getOne.mockRejectedValue(new Error('Not found'))
      const result = await getRepo().findById('nonexistent')
      expect(result).toBeNull()
    })
  })

  describe('findByEdition', () => {
    it('should return formats sorted by order', async () => {
      mockPb.mockCollection.getFullList.mockResolvedValue([MOCK_RECORD])
      const result = await getRepo().findByEdition('edition1')

      expect(mockPb.mockCollection.getFullList).toHaveBeenCalledWith({
        filter: expect.any(String),
        sort: 'order'
      })
      expect(result).toHaveLength(1)
    })
  })

  describe('create', () => {
    it('should create a format with default order 0', async () => {
      mockPb.mockCollection.create.mockResolvedValue(MOCK_RECORD)
      await getRepo().create({
        editionId: 'edition1',
        name: 'Workshop',
        duration: 120
      })

      expect(mockPb.mockCollection.create).toHaveBeenCalledWith(
        expect.objectContaining({ order: 0 })
      )
    })

    it('should use provided order', async () => {
      mockPb.mockCollection.create.mockResolvedValue(MOCK_RECORD)
      await getRepo().create({
        editionId: 'edition1',
        name: 'Workshop',
        duration: 120,
        order: 3
      })

      expect(mockPb.mockCollection.create).toHaveBeenCalledWith(
        expect.objectContaining({ order: 3 })
      )
    })
  })

  describe('update', () => {
    it('should update a format', async () => {
      mockPb.mockCollection.update.mockResolvedValue({ ...MOCK_RECORD, name: 'Keynote' })
      const result = await getRepo().update('fmt1', { name: 'Keynote' })

      expect(mockPb.mockCollection.update).toHaveBeenCalledWith('fmt1', { name: 'Keynote' })
      expect(result.name).toBe('Keynote')
    })
  })

  describe('delete', () => {
    it('should delete the format', async () => {
      mockPb.mockCollection.delete.mockResolvedValue(undefined)
      await getRepo().delete('fmt1')
      expect(mockPb.mockCollection.delete).toHaveBeenCalledWith('fmt1')
    })
  })

  describe('mapping', () => {
    it('should map all fields correctly', async () => {
      mockPb.mockCollection.getOne.mockResolvedValue(MOCK_RECORD)
      const result = await getRepo().findById('fmt1')

      expect(result?.editionId).toBe('edition1')
      expect(result?.description).toBe('5 minute talk')
      expect(result?.duration).toBe(5)
      expect(result?.order).toBe(1)
      expect(result?.createdAt).toBeInstanceOf(Date)
      expect(result?.updatedAt).toBeInstanceOf(Date)
    })
  })
})
