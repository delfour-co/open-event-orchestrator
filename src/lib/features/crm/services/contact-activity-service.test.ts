import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createContactActivityService } from './contact-activity-service'

const createMockPb = () => {
  const collections: Record<string, ReturnType<typeof createMockCollection>> = {}

  const createMockCollection = () => ({
    getFullList: vi.fn().mockResolvedValue([]),
    getList: vi.fn().mockResolvedValue({ items: [], totalItems: 0 }),
    getOne: vi.fn().mockResolvedValue({}),
    create: vi.fn().mockImplementation((data) =>
      Promise.resolve({
        id: 'new-activity-id',
        ...data,
        created: new Date().toISOString()
      })
    ),
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

describe('ContactActivityService', () => {
  let pb: ReturnType<typeof createMockPb>
  let service: ReturnType<typeof createContactActivityService>

  beforeEach(() => {
    vi.clearAllMocks()
    pb = createMockPb()
    service = createContactActivityService(pb)
  })

  describe('record', () => {
    it('should create a new activity record', async () => {
      const result = await service.record({
        contactId: 'c1',
        eventId: 'evt-1',
        type: 'email_opened',
        description: 'Opened campaign "Newsletter"'
      })

      expect(pb.collection('contact_activities').create).toHaveBeenCalledWith(
        expect.objectContaining({
          contactId: 'c1',
          eventId: 'evt-1',
          type: 'email_opened',
          description: 'Opened campaign "Newsletter"'
        })
      )
      expect(result.id).toBe('new-activity-id')
      expect(result.type).toBe('email_opened')
    })

    it('should handle optional fields', async () => {
      await service.record({
        contactId: 'c1',
        type: 'contact_created',
        description: 'Contact created'
      })

      expect(pb.collection('contact_activities').create).toHaveBeenCalledWith(
        expect.objectContaining({
          eventId: '',
          editionId: '',
          metadata: {}
        })
      )
    })

    it('should include metadata when provided', async () => {
      await service.record({
        contactId: 'c1',
        type: 'email_clicked',
        description: 'Clicked link',
        metadata: { url: 'https://example.com', linkId: 'link-1' }
      })

      expect(pb.collection('contact_activities').create).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: { url: 'https://example.com', linkId: 'link-1' }
        })
      )
    })
  })

  describe('getByContact', () => {
    it('should fetch activities for a contact', async () => {
      const now = new Date()
      pb.collection('contact_activities').getList.mockResolvedValue({
        items: [
          {
            id: 'act-1',
            contactId: 'c1',
            type: 'email_opened',
            description: 'Opened email',
            created: now.toISOString()
          }
        ],
        totalItems: 1
      })

      const result = await service.getByContact({ contactId: 'c1' })

      expect(result.activities).toHaveLength(1)
      expect(result.total).toBe(1)
      expect(result.activities[0].type).toBe('email_opened')
    })

    it('should filter by activity types', async () => {
      await service.getByContact({
        contactId: 'c1',
        types: ['email_opened', 'email_clicked']
      })

      expect(pb.collection('contact_activities').getList).toHaveBeenCalledWith(
        1,
        50,
        expect.objectContaining({
          filter: expect.stringContaining('email_opened')
        })
      )
    })

    it('should filter by date range', async () => {
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-31')

      await service.getByContact({
        contactId: 'c1',
        startDate,
        endDate
      })

      expect(pb.collection('contact_activities').getList).toHaveBeenCalledWith(
        1,
        50,
        expect.objectContaining({
          filter: expect.stringContaining('created >=')
        })
      )
    })

    it('should support pagination', async () => {
      await service.getByContact({
        contactId: 'c1',
        page: 2,
        perPage: 20
      })

      expect(pb.collection('contact_activities').getList).toHaveBeenCalledWith(
        2,
        20,
        expect.any(Object)
      )
    })
  })

  describe('getRecent', () => {
    it('should fetch recent activities', async () => {
      const now = new Date()
      pb.collection('contact_activities').getList.mockResolvedValue({
        items: [
          {
            id: 'act-1',
            contactId: 'c1',
            type: 'ticket_purchased',
            description: 'Purchased ticket',
            created: now.toISOString()
          }
        ],
        totalItems: 1
      })

      const result = await service.getRecent({ limit: 10 })

      expect(result).toHaveLength(1)
      expect(pb.collection('contact_activities').getList).toHaveBeenCalledWith(
        1,
        10,
        expect.any(Object)
      )
    })

    it('should filter by event', async () => {
      await service.getRecent({ eventId: 'evt-1' })

      expect(pb.collection('contact_activities').getList).toHaveBeenCalledWith(
        1,
        50,
        expect.objectContaining({
          filter: expect.stringContaining('evt-1')
        })
      )
    })

    it('should filter by types', async () => {
      await service.getRecent({ types: ['ticket_purchased', 'ticket_checked_in'] })

      expect(pb.collection('contact_activities').getList).toHaveBeenCalledWith(
        1,
        50,
        expect.objectContaining({
          filter: expect.stringContaining('ticket_purchased')
        })
      )
    })
  })

  describe('getEngagementScore', () => {
    it('should calculate score from activities', async () => {
      const now = new Date()
      pb.collection('contact_activities').getFullList.mockResolvedValue([
        {
          id: '1',
          contactId: 'c1',
          type: 'email_opened',
          description: 'Opened',
          created: now.toISOString()
        },
        {
          id: '2',
          contactId: 'c1',
          type: 'ticket_purchased',
          description: 'Bought',
          created: now.toISOString()
        }
      ])

      const result = await service.getEngagementScore('c1')

      expect(result.contactId).toBe('c1')
      expect(result.score).toBeGreaterThan(0)
      expect(result.activityCount).toBe(2)
      expect(['active', 'moderate', 'inactive']).toContain(result.level)
    })

    it('should return inactive for no activities', async () => {
      pb.collection('contact_activities').getFullList.mockResolvedValue([])

      const result = await service.getEngagementScore('c1')

      expect(result.score).toBe(0)
      expect(result.level).toBe('inactive')
      expect(result.activityCount).toBe(0)
    })
  })

  describe('getBulkEngagementScores', () => {
    it('should calculate scores for multiple contacts', async () => {
      const now = new Date()
      pb.collection('contact_activities').getFullList.mockResolvedValue([
        {
          id: '1',
          contactId: 'c1',
          type: 'email_opened',
          description: 'Opened',
          created: now.toISOString()
        },
        {
          id: '2',
          contactId: 'c2',
          type: 'ticket_purchased',
          description: 'Bought',
          created: now.toISOString()
        }
      ])

      const result = await service.getBulkEngagementScores(['c1', 'c2', 'c3'])

      expect(result.size).toBe(3)
      expect(result.get('c1')).toBeDefined()
      expect(result.get('c2')).toBeDefined()
      expect(result.get('c3')?.score).toBe(0) // No activities
    })

    it('should return empty map for empty input', async () => {
      const result = await service.getBulkEngagementScores([])

      expect(result.size).toBe(0)
      expect(pb.collection).not.toHaveBeenCalled()
    })
  })
})
