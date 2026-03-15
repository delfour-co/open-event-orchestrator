import type PocketBase from 'pocketbase'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSegmentRepository } from './segment-repository'

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

const makeSegmentRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'seg1',
  eventId: 'evt1',
  editionId: 'ed1',
  name: 'VIP Segment',
  description: 'VIP contacts',
  criteria: { match: 'all', rules: [{ field: 'tags', operator: 'contains', value: 'vip' }] },
  isStatic: false,
  contactCount: 25,
  created: '2024-01-01T00:00:00Z',
  updated: '2024-01-02T00:00:00Z',
  ...overrides
})

describe('SegmentRepository', () => {
  let mockPb: ReturnType<typeof createMockPb>

  beforeEach(() => {
    mockPb = createMockPb()
  })

  describe('findById', () => {
    it('should return segment when found', async () => {
      const record = makeSegmentRecord()
      mockPb._mockCollection.mockReturnValue({
        getOne: vi.fn().mockResolvedValue(record)
      })

      const repo = createSegmentRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('seg1')

      expect(result).not.toBeNull()
      expect(result?.id).toBe('seg1')
      expect(result?.name).toBe('VIP Segment')
      expect(result?.contactCount).toBe(25)
      expect(result?.criteria.match).toBe('all')
    })

    it('should return null when not found', async () => {
      mockPb._mockCollection.mockReturnValue({
        getOne: vi.fn().mockRejectedValue(new Error('Not found'))
      })

      const repo = createSegmentRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('nonexistent')

      expect(result).toBeNull()
    })

    it('should parse criteria from JSON string', async () => {
      const record = makeSegmentRecord({
        criteria:
          '{"match":"any","rules":[{"field":"source","operator":"equals","value":"import"}]}'
      })
      mockPb._mockCollection.mockReturnValue({
        getOne: vi.fn().mockResolvedValue(record)
      })

      const repo = createSegmentRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('seg1')

      expect(result?.criteria.match).toBe('any')
      expect(result?.criteria.rules).toHaveLength(1)
    })

    it('should return default criteria when invalid string', async () => {
      const record = makeSegmentRecord({ criteria: 'invalid' })
      mockPb._mockCollection.mockReturnValue({
        getOne: vi.fn().mockResolvedValue(record)
      })

      const repo = createSegmentRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('seg1')

      expect(result?.criteria).toEqual({ match: 'all', rules: [] })
    })

    it('should return default criteria when null', async () => {
      const record = makeSegmentRecord({ criteria: null })
      mockPb._mockCollection.mockReturnValue({
        getOne: vi.fn().mockResolvedValue(record)
      })

      const repo = createSegmentRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('seg1')

      expect(result?.criteria).toEqual({ match: 'all', rules: [] })
    })
  })

  describe('findByEvent', () => {
    it('should return segments filtered by eventId', async () => {
      const records = [makeSegmentRecord({ id: 'seg1' }), makeSegmentRecord({ id: 'seg2' })]
      const mockGetFullList = vi.fn().mockResolvedValue(records)
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = createSegmentRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByEvent('evt1')

      expect(result).toHaveLength(2)
      expect(mockGetFullList).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: expect.stringContaining('evt1'),
          sort: '-created'
        })
      )
    })

    it('should return empty array when no segments', async () => {
      mockPb._mockCollection.mockReturnValue({
        getFullList: vi.fn().mockResolvedValue([])
      })

      const repo = createSegmentRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByEvent('evt-empty')

      expect(result).toEqual([])
    })
  })

  describe('create', () => {
    it('should create a segment and stringify criteria', async () => {
      const record = makeSegmentRecord()
      const mockCreate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ create: mockCreate })

      const criteria = { match: 'all' as const, rules: [] }
      const repo = createSegmentRepository(mockPb as unknown as PocketBase)
      const result = await repo.create({
        eventId: 'evt1',
        name: 'VIP Segment',
        criteria
      } as never)

      expect(mockPb._mockCollection).toHaveBeenCalledWith('segments')
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          criteria: JSON.stringify(criteria),
          contactCount: 0
        })
      )
      expect(result.id).toBe('seg1')
    })

    it('should default contactCount to 0', async () => {
      const record = makeSegmentRecord()
      const mockCreate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ create: mockCreate })

      const repo = createSegmentRepository(mockPb as unknown as PocketBase)
      await repo.create({
        eventId: 'evt1',
        name: 'Segment',
        criteria: { match: 'all', rules: [] }
      } as never)

      expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ contactCount: 0 }))
    })
  })

  describe('update', () => {
    it('should update segment and stringify criteria when provided', async () => {
      const record = makeSegmentRecord()
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const newCriteria = { match: 'any' as const, rules: [] }
      const repo = createSegmentRepository(mockPb as unknown as PocketBase)
      await repo.update('seg1', { criteria: newCriteria } as never)

      expect(mockUpdate).toHaveBeenCalledWith(
        'seg1',
        expect.objectContaining({ criteria: JSON.stringify(newCriteria) })
      )
    })

    it('should update without stringifying when criteria not provided', async () => {
      const record = makeSegmentRecord({ name: 'Updated' })
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const repo = createSegmentRepository(mockPb as unknown as PocketBase)
      await repo.update('seg1', { name: 'Updated' } as never)

      const updateCall = mockUpdate.mock.calls[0][1]
      expect(updateCall.name).toBe('Updated')
    })
  })

  describe('updateContactCount', () => {
    it('should update contact count', async () => {
      const mockUpdate = vi.fn().mockResolvedValue(makeSegmentRecord())
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const repo = createSegmentRepository(mockPb as unknown as PocketBase)
      await repo.updateContactCount('seg1', 42)

      expect(mockUpdate).toHaveBeenCalledWith('seg1', { contactCount: 42 })
    })

    it('should set contact count to zero', async () => {
      const mockUpdate = vi.fn().mockResolvedValue(makeSegmentRecord())
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const repo = createSegmentRepository(mockPb as unknown as PocketBase)
      await repo.updateContactCount('seg1', 0)

      expect(mockUpdate).toHaveBeenCalledWith('seg1', { contactCount: 0 })
    })
  })

  describe('delete', () => {
    it('should delete segment by id', async () => {
      const mockDelete = vi.fn().mockResolvedValue(undefined)
      mockPb._mockCollection.mockReturnValue({ delete: mockDelete })

      const repo = createSegmentRepository(mockPb as unknown as PocketBase)
      await repo.delete('seg1')

      expect(mockPb._mockCollection).toHaveBeenCalledWith('segments')
      expect(mockDelete).toHaveBeenCalledWith('seg1')
    })
  })
})
