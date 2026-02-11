import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createContactHistoryService } from './contact-history-service'

const createMockPb = () => {
  const collections: Record<string, ReturnType<typeof createMockCollection>> = {}

  const createMockCollection = () => ({
    getFullList: vi.fn().mockResolvedValue([]),
    getList: vi.fn().mockResolvedValue({ items: [], totalItems: 0 }),
    getOne: vi.fn().mockResolvedValue({}),
    create: vi.fn().mockImplementation((data) =>
      Promise.resolve({
        id: 'new-id',
        ...data,
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      })
    ),
    update: vi.fn().mockImplementation((id, data) =>
      Promise.resolve({
        id,
        ...data,
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      })
    ),
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

describe('ContactHistoryService', () => {
  let pb: ReturnType<typeof createMockPb>
  let service: ReturnType<typeof createContactHistoryService>

  const now = new Date()

  beforeEach(() => {
    vi.clearAllMocks()
    pb = createMockPb()
    service = createContactHistoryService(pb)
  })

  describe('recordParticipation', () => {
    it('should record a participation event', async () => {
      const result = await service.recordParticipation({
        contactId: 'c1',
        eventId: 'evt-1',
        editionId: 'ed-1',
        participationType: 'ticket_purchased',
        relatedEntityId: 'order-1',
        relatedEntityType: 'order'
      })

      expect(result.id).toBeDefined()
      expect(pb.collection('contact_event_participations').create).toHaveBeenCalledWith(
        expect.objectContaining({
          contactId: 'c1',
          eventId: 'evt-1',
          editionId: 'ed-1',
          participationType: 'ticket_purchased',
          relatedEntityId: 'order-1'
        })
      )
    })

    it('should use current date if not provided', async () => {
      await service.recordParticipation({
        contactId: 'c1',
        eventId: 'evt-1',
        editionId: 'ed-1',
        participationType: 'checked_in'
      })

      expect(pb.collection('contact_event_participations').create).toHaveBeenCalledWith(
        expect.objectContaining({
          occurredAt: expect.any(String)
        })
      )
    })
  })

  describe('getParticipationHistory', () => {
    it('should return participation history for contact', async () => {
      pb.collection('contact_event_participations').getFullList.mockResolvedValue([
        {
          id: 'p1',
          contactId: 'c1',
          eventId: 'evt-1',
          editionId: 'ed-1',
          participationType: 'ticket_purchased',
          occurredAt: now.toISOString(),
          created: now.toISOString()
        },
        {
          id: 'p2',
          contactId: 'c1',
          eventId: 'evt-1',
          editionId: 'ed-1',
          participationType: 'checked_in',
          occurredAt: now.toISOString(),
          created: now.toISOString()
        }
      ])

      const result = await service.getParticipationHistory('c1')

      expect(result).toHaveLength(2)
      expect(result[0].participationType).toBe('ticket_purchased')
    })
  })

  describe('getContactTimeline', () => {
    it('should return timeline with event names', async () => {
      pb.collection('contact_event_participations').getFullList.mockResolvedValue([
        {
          id: 'p1',
          contactId: 'c1',
          eventId: 'evt-1',
          editionId: 'ed-1',
          participationType: 'ticket_purchased',
          occurredAt: now.toISOString(),
          created: now.toISOString()
        }
      ])

      pb.collection('events').getOne.mockResolvedValue({ name: 'DevConf' })
      pb.collection('editions').getOne.mockResolvedValue({ name: 'DevConf 2024' })

      const result = await service.getContactTimeline('c1')

      expect(result).toHaveLength(1)
      expect(result[0].eventName).toBe('DevConf')
      expect(result[0].editionName).toBe('DevConf 2024')
      expect(result[0].description).toContain('Purchased Ticket')
    })
  })

  describe('getCrossEventSummary', () => {
    it('should return cross-event summary', async () => {
      pb.collection('contacts').getOne.mockResolvedValue({
        id: 'c1',
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe'
      })

      pb.collection('contact_event_participations').getFullList.mockResolvedValue([
        {
          id: 'p1',
          contactId: 'c1',
          eventId: 'evt-1',
          editionId: 'ed-1',
          participationType: 'ticket_purchased',
          occurredAt: now.toISOString(),
          created: now.toISOString()
        },
        {
          id: 'p2',
          contactId: 'c1',
          eventId: 'evt-2',
          editionId: 'ed-2',
          participationType: 'speaker',
          occurredAt: now.toISOString(),
          created: now.toISOString()
        }
      ])

      const result = await service.getCrossEventSummary('c1')

      expect(result).not.toBeNull()
      expect(result?.totalEvents).toBe(2)
      expect(result?.totalEditions).toBe(2)
      expect(result?.participationTypes).toContain('ticket_purchased')
      expect(result?.participationTypes).toContain('speaker')
    })

    it('should return null for non-existent contact', async () => {
      pb.collection('contacts').getOne.mockRejectedValue(new Error('Not found'))

      const result = await service.getCrossEventSummary('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('findContactByEmail', () => {
    it('should find contacts across events by email', async () => {
      pb.collection('contacts').getFullList.mockResolvedValue([
        { id: 'c1', eventId: 'evt-1' },
        { id: 'c2', eventId: 'evt-2' }
      ])

      pb.collection('contact_edition_links')
        .getFullList.mockResolvedValueOnce([{ editionId: 'ed-1' }])
        .mockResolvedValueOnce([{ editionId: 'ed-2' }])

      const result = await service.findContactByEmail('john@example.com')

      expect(result).toHaveLength(2)
      expect(result[0].eventId).toBe('evt-1')
      expect(result[1].eventId).toBe('evt-2')
    })

    it('should return empty array for unknown email', async () => {
      pb.collection('contacts').getFullList.mockResolvedValue([])

      const result = await service.findContactByEmail('unknown@example.com')

      expect(result).toHaveLength(0)
    })
  })

  describe('getContactsWithMultipleEvents', () => {
    it('should return contacts who attended multiple events', async () => {
      pb.collection('contact_event_participations').getFullList.mockResolvedValue([
        {
          id: 'p1',
          contactId: 'c1',
          eventId: 'evt-1',
          editionId: 'ed-1',
          participationType: 'ticket_purchased',
          occurredAt: now.toISOString(),
          created: now.toISOString()
        },
        {
          id: 'p2',
          contactId: 'c1',
          eventId: 'evt-2',
          editionId: 'ed-2',
          participationType: 'speaker',
          occurredAt: now.toISOString(),
          created: now.toISOString()
        },
        {
          id: 'p3',
          contactId: 'c2',
          eventId: 'evt-1',
          editionId: 'ed-1',
          participationType: 'ticket_purchased',
          occurredAt: now.toISOString(),
          created: now.toISOString()
        }
      ])

      pb.collection('contacts').getOne.mockResolvedValue({
        id: 'c1',
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe'
      })

      const result = await service.getContactsWithMultipleEvents(2)

      expect(result).toHaveLength(1)
      expect(result[0].contactId).toBe('c1')
      expect(result[0].totalEvents).toBe(2)
    })

    it('should sort by loyalty score', async () => {
      pb.collection('contact_event_participations').getFullList.mockResolvedValue([
        {
          id: 'p1',
          contactId: 'c1',
          eventId: 'evt-1',
          editionId: 'ed-1',
          participationType: 'ticket_purchased',
          occurredAt: now.toISOString(),
          created: now.toISOString()
        },
        {
          id: 'p2',
          contactId: 'c1',
          eventId: 'evt-2',
          editionId: 'ed-2',
          participationType: 'ticket_purchased',
          occurredAt: now.toISOString(),
          created: now.toISOString()
        },
        {
          id: 'p3',
          contactId: 'c2',
          eventId: 'evt-1',
          editionId: 'ed-1',
          participationType: 'speaker',
          occurredAt: now.toISOString(),
          created: now.toISOString()
        },
        {
          id: 'p4',
          contactId: 'c2',
          eventId: 'evt-2',
          editionId: 'ed-2',
          participationType: 'speaker',
          occurredAt: now.toISOString(),
          created: now.toISOString()
        }
      ])

      pb.collection('contacts')
        .getOne.mockResolvedValueOnce({
          id: 'c1',
          email: 'john@example.com',
          firstName: 'John',
          lastName: 'Doe'
        })
        .mockResolvedValueOnce({
          id: 'c2',
          email: 'jane@example.com',
          firstName: 'Jane',
          lastName: 'Smith'
        })

      const result = await service.getContactsWithMultipleEvents(2)

      expect(result).toHaveLength(2)
      // Speaker has higher weight, so c2 should have higher loyalty score
      expect(result[0].contactId).toBe('c2')
    })
  })

  describe('getEditionParticipants', () => {
    it('should return participants for an edition', async () => {
      pb.collection('contact_event_participations').getFullList.mockResolvedValue([
        {
          id: 'p1',
          contactId: 'c1',
          eventId: 'evt-1',
          editionId: 'ed-1',
          participationType: 'ticket_purchased',
          occurredAt: now.toISOString(),
          created: now.toISOString()
        },
        {
          id: 'p2',
          contactId: 'c2',
          eventId: 'evt-1',
          editionId: 'ed-1',
          participationType: 'speaker',
          occurredAt: now.toISOString(),
          created: now.toISOString()
        }
      ])

      const result = await service.getEditionParticipants('ed-1')

      expect(result).toHaveLength(2)
    })

    it('should filter by participation type', async () => {
      await service.getEditionParticipants('ed-1', 'speaker')

      expect(pb.collection('contact_event_participations').getFullList).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: expect.stringContaining('speaker')
        })
      )
    })
  })
})
