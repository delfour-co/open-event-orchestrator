import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Segment } from '../domain'
import { createSegmentSyncService } from './segment-sync-service'

// Mock the evaluate-segment usecase
vi.mock('../usecases/evaluate-segment', () => ({
  createEvaluateSegmentUseCase: vi.fn()
}))

import { createEvaluateSegmentUseCase } from '../usecases/evaluate-segment'

const createMockPb = () => {
  const collections: Record<string, ReturnType<typeof createMockCollection>> = {}

  const createMockCollection = () => ({
    getFullList: vi.fn().mockResolvedValue([]),
    getList: vi.fn().mockResolvedValue({ items: [] }),
    create: vi.fn().mockResolvedValue({ id: 'new-id' }),
    update: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({})
  })

  return {
    collection: vi.fn((name: string) => {
      if (!collections[name]) {
        collections[name] = createMockCollection()
      }
      return collections[name]
    }),
    _collections: collections
    // biome-ignore lint/suspicious/noExplicitAny: mock PocketBase
  } as any
}

describe('SegmentSyncService', () => {
  let pb: ReturnType<typeof createMockPb>
  let service: ReturnType<typeof createSegmentSyncService>
  let mockEvaluate: ReturnType<typeof vi.fn>

  const now = new Date()
  const makeSegment = (overrides: Partial<Segment> = {}): Segment => ({
    id: 'seg-001',
    eventId: 'evt-001',
    name: 'Test Segment',
    criteria: { match: 'all', rules: [] },
    isStatic: false,
    contactCount: 0,
    createdAt: now,
    updatedAt: now,
    ...overrides
  })

  beforeEach(() => {
    vi.clearAllMocks()
    pb = createMockPb()
    mockEvaluate = vi.fn().mockResolvedValue([])
    vi.mocked(createEvaluateSegmentUseCase).mockReturnValue(mockEvaluate)
    service = createSegmentSyncService(pb)
  })

  describe('syncSegment', () => {
    it('should create memberships for new contacts', async () => {
      const segment = makeSegment()
      mockEvaluate.mockResolvedValue(['c1', 'c2', 'c3'])
      pb.collection('segment_memberships').getFullList.mockResolvedValue([])

      const result = await service.syncSegment(segment)

      expect(result.joined).toBe(3)
      expect(result.left).toBe(0)
      expect(result.currentCount).toBe(3)
      expect(pb.collection('segment_memberships').create).toHaveBeenCalledTimes(3)
    })

    it('should mark memberships as inactive for contacts that left', async () => {
      const segment = makeSegment()
      mockEvaluate.mockResolvedValue(['c1'])
      pb.collection('segment_memberships').getFullList.mockResolvedValue([
        { id: 'm1', contactId: 'c1' },
        { id: 'm2', contactId: 'c2' },
        { id: 'm3', contactId: 'c3' }
      ])

      const result = await service.syncSegment(segment)

      expect(result.joined).toBe(0)
      expect(result.left).toBe(2)
      expect(pb.collection('segment_memberships').update).toHaveBeenCalledTimes(2)
    })

    it('should handle both joins and leaves', async () => {
      const segment = makeSegment()
      mockEvaluate.mockResolvedValue(['c1', 'c3', 'c4'])
      pb.collection('segment_memberships').getFullList.mockResolvedValue([
        { id: 'm1', contactId: 'c1' },
        { id: 'm2', contactId: 'c2' }
      ])

      const result = await service.syncSegment(segment)

      expect(result.joined).toBe(2) // c3, c4
      expect(result.left).toBe(1) // c2
      expect(result.previousCount).toBe(2)
      expect(result.currentCount).toBe(3)
    })

    it('should update segment contact count', async () => {
      const segment = makeSegment({ id: 'seg-123' })
      mockEvaluate.mockResolvedValue(['c1', 'c2'])
      pb.collection('segment_memberships').getFullList.mockResolvedValue([])

      await service.syncSegment(segment)

      expect(pb.collection('segments').update).toHaveBeenCalledWith('seg-123', {
        contactCount: 2
      })
    })

    it('should return empty changes when no changes', async () => {
      const segment = makeSegment()
      mockEvaluate.mockResolvedValue(['c1', 'c2'])
      pb.collection('segment_memberships').getFullList.mockResolvedValue([
        { id: 'm1', contactId: 'c1' },
        { id: 'm2', contactId: 'c2' }
      ])

      const result = await service.syncSegment(segment)

      expect(result.joined).toBe(0)
      expect(result.left).toBe(0)
      expect(result.changes).toHaveLength(0)
    })
  })

  describe('getSegmentMembers', () => {
    it('should return active member contact IDs', async () => {
      pb.collection('segment_memberships').getFullList.mockResolvedValue([
        { id: 'm1', contactId: 'c1' },
        { id: 'm2', contactId: 'c2' }
      ])

      const members = await service.getSegmentMembers('seg-1')

      expect(members).toEqual(['c1', 'c2'])
    })
  })

  describe('getContactSegments', () => {
    it('should return segment IDs for a contact', async () => {
      pb.collection('segment_memberships').getFullList.mockResolvedValue([
        { id: 'm1', segmentId: 'seg-1' },
        { id: 'm2', segmentId: 'seg-2' }
      ])

      const segments = await service.getContactSegments('c1')

      expect(segments).toEqual(['seg-1', 'seg-2'])
    })
  })

  describe('isContactInSegment', () => {
    it('should return true if contact is in segment', async () => {
      pb.collection('segment_memberships').getList.mockResolvedValue({
        items: [{ id: 'm1' }]
      })

      const result = await service.isContactInSegment('c1', 'seg-1')

      expect(result).toBe(true)
    })

    it('should return false if contact is not in segment', async () => {
      pb.collection('segment_memberships').getList.mockResolvedValue({
        items: []
      })

      const result = await service.isContactInSegment('c1', 'seg-1')

      expect(result).toBe(false)
    })
  })
})
