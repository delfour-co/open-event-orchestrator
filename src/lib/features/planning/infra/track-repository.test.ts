import type PocketBase from 'pocketbase'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createTrackRepository } from './track-repository'

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

const makeTrackRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'track1',
  editionId: 'ed1',
  name: 'Web Track',
  color: '#ff5733',
  description: 'Web technologies track',
  order: 1,
  created: '2024-01-01T00:00:00Z',
  updated: '2024-01-02T00:00:00Z',
  ...overrides
})

describe('TrackRepository', () => {
  let mockPb: ReturnType<typeof createMockPb>

  beforeEach(() => {
    mockPb = createMockPb()
  })

  describe('findById', () => {
    it('should return track when found', async () => {
      const record = makeTrackRecord()
      mockPb._mockCollection.mockReturnValue({
        getOne: vi.fn().mockResolvedValue(record)
      })

      const repo = createTrackRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('track1')

      expect(result).not.toBeNull()
      expect(result?.id).toBe('track1')
      expect(result?.name).toBe('Web Track')
      expect(result?.color).toBe('#ff5733')
    })

    it('should return null when not found', async () => {
      mockPb._mockCollection.mockReturnValue({
        getOne: vi.fn().mockRejectedValue(new Error('Not found'))
      })

      const repo = createTrackRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('nonexistent')

      expect(result).toBeNull()
    })

    it('should default color to gray when empty', async () => {
      const record = makeTrackRecord({ color: '' })
      mockPb._mockCollection.mockReturnValue({
        getOne: vi.fn().mockResolvedValue(record)
      })

      const repo = createTrackRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('track1')

      expect(result?.color).toBe('#6b7280')
    })

    it('should default order to 0 when missing', async () => {
      const record = makeTrackRecord({ order: 0 })
      mockPb._mockCollection.mockReturnValue({
        getOne: vi.fn().mockResolvedValue(record)
      })

      const repo = createTrackRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('track1')

      expect(result?.order).toBe(0)
    })
  })

  describe('findByEdition', () => {
    it('should return tracks sorted by order and name', async () => {
      const records = [
        makeTrackRecord({ id: 'track1', order: 1 }),
        makeTrackRecord({ id: 'track2', order: 2 })
      ]
      const mockGetFullList = vi.fn().mockResolvedValue(records)
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = createTrackRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByEdition('ed1')

      expect(result).toHaveLength(2)
      expect(mockGetFullList).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: expect.stringContaining('ed1'),
          sort: 'order,name'
        })
      )
    })

    it('should return empty array when no tracks', async () => {
      mockPb._mockCollection.mockReturnValue({
        getFullList: vi.fn().mockResolvedValue([])
      })

      const repo = createTrackRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByEdition('ed-empty')

      expect(result).toEqual([])
    })
  })

  describe('create', () => {
    it('should create a track and map the result', async () => {
      const record = makeTrackRecord()
      const mockCreate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ create: mockCreate })

      const repo = createTrackRepository(mockPb as unknown as PocketBase)
      const result = await repo.create({
        editionId: 'ed1',
        name: 'Web Track',
        color: '#ff5733',
        description: 'Web technologies track',
        order: 1
      })

      expect(mockPb._mockCollection).toHaveBeenCalledWith('tracks')
      expect(result.id).toBe('track1')
      expect(result.name).toBe('Web Track')
    })

    it('should default color and order when not provided', async () => {
      const record = makeTrackRecord({ color: '#6b7280', order: 0 })
      const mockCreate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ create: mockCreate })

      const repo = createTrackRepository(mockPb as unknown as PocketBase)
      await repo.create({ editionId: 'ed1', name: 'Track' } as never)

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ color: '#6b7280', order: 0 })
      )
    })

    it('should pass provided color and order', async () => {
      const record = makeTrackRecord()
      const mockCreate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ create: mockCreate })

      const repo = createTrackRepository(mockPb as unknown as PocketBase)
      await repo.create({
        editionId: 'ed1',
        name: 'Track',
        color: '#123456',
        order: 5
      })

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ color: '#123456', order: 5 })
      )
    })
  })

  describe('update', () => {
    it('should update only provided fields', async () => {
      const record = makeTrackRecord({ name: 'Updated Track' })
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const repo = createTrackRepository(mockPb as unknown as PocketBase)
      const result = await repo.update({ id: 'track1', name: 'Updated Track' })

      expect(mockUpdate).toHaveBeenCalledWith('track1', { name: 'Updated Track' })
      expect(result.name).toBe('Updated Track')
    })

    it('should not include undefined fields in update data', async () => {
      const record = makeTrackRecord()
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const repo = createTrackRepository(mockPb as unknown as PocketBase)
      await repo.update({ id: 'track1', color: '#000000' })

      expect(mockUpdate).toHaveBeenCalledWith('track1', { color: '#000000' })
    })

    it('should update all fields when provided', async () => {
      const record = makeTrackRecord()
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const repo = createTrackRepository(mockPb as unknown as PocketBase)
      await repo.update({
        id: 'track1',
        name: 'New',
        color: '#fff',
        description: 'Desc',
        order: 3
      })

      expect(mockUpdate).toHaveBeenCalledWith('track1', {
        name: 'New',
        color: '#fff',
        description: 'Desc',
        order: 3
      })
    })
  })

  describe('delete', () => {
    it('should delete track by id', async () => {
      const mockDelete = vi.fn().mockResolvedValue(undefined)
      mockPb._mockCollection.mockReturnValue({ delete: mockDelete })

      const repo = createTrackRepository(mockPb as unknown as PocketBase)
      await repo.delete('track1')

      expect(mockPb._mockCollection).toHaveBeenCalledWith('tracks')
      expect(mockDelete).toHaveBeenCalledWith('track1')
    })
  })
})
