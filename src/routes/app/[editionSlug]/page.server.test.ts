import { describe, expect, it, vi } from 'vitest'

// Result type for successful load
interface LoadResult {
  edition: Record<string, unknown>
  event: Record<string, unknown>
  appSettings: Record<string, unknown> | null
  feedbackSettings: Record<string, unknown> | null
  rooms: Array<Record<string, unknown>>
  tracks: Array<Record<string, unknown>>
  slots: Array<Record<string, unknown>>
  sessions: Array<Record<string, unknown>>
  talks: Array<Record<string, unknown>>
}

// Mock the modules
vi.mock('$lib/features/app/infra', () => ({
  AppSettingsRepository: vi.fn().mockImplementation(() => ({
    getByEdition: vi.fn().mockResolvedValue(null),
    getFileUrl: vi.fn().mockReturnValue(undefined)
  }))
}))

vi.mock('$lib/features/feedback/infra', () => ({
  FeedbackSettingsRepository: vi.fn().mockImplementation(() => ({
    getByEdition: vi.fn().mockResolvedValue(null)
  }))
}))

// Helper to create mock PocketBase
const createMockPb = (overrides: {
  editions?: { items: Array<Record<string, unknown>>; totalItems: number }
  event?: Record<string, unknown> | null
  rooms?: Array<Record<string, unknown>>
  tracks?: Array<Record<string, unknown>>
  slots?: Array<Record<string, unknown>>
  sessions?: Array<Record<string, unknown>>
  talks?: Array<Record<string, unknown>>
}) => {
  const {
    editions,
    event,
    rooms = [],
    tracks = [],
    slots = [],
    sessions = [],
    talks = []
  } = overrides

  return {
    collection: vi.fn((name: string) => {
      if (name === 'editions') {
        return {
          getList: vi.fn().mockResolvedValue(editions ?? { items: [], totalItems: 0 })
        }
      }
      if (name === 'events') {
        return {
          getOne: event
            ? vi.fn().mockResolvedValue(event)
            : vi.fn().mockRejectedValue(new Error('Missing required record id'))
        }
      }
      if (name === 'rooms') {
        return { getFullList: vi.fn().mockResolvedValue(rooms) }
      }
      if (name === 'tracks') {
        return { getFullList: vi.fn().mockResolvedValue(tracks) }
      }
      if (name === 'slots') {
        return { getFullList: vi.fn().mockResolvedValue(slots) }
      }
      if (name === 'sessions') {
        return { getFullList: vi.fn().mockResolvedValue(sessions) }
      }
      if (name === 'talks') {
        return { getFullList: vi.fn().mockResolvedValue(talks) }
      }
      return { getFullList: vi.fn().mockResolvedValue([]) }
    })
  }
}

describe('Attendee App Page Server', () => {
  describe('load function', () => {
    it('throws 404 when edition is not found', async () => {
      const { load } = await import('./+page.server')

      const mockPb = createMockPb({
        editions: { items: [], totalItems: 0 }
      })

      await expect(
        load({
          params: { editionSlug: 'non-existent' },
          locals: { pb: mockPb }
        } as unknown as Parameters<typeof load>[0])
      ).rejects.toMatchObject({
        status: 404,
        body: { message: 'Edition not found' }
      })
    })

    it('throws 404 when edition is not published', async () => {
      const { load } = await import('./+page.server')

      const mockPb = createMockPb({
        editions: {
          items: [
            {
              id: 'ed-123',
              name: 'DevFest 2025',
              slug: 'devfest-2025',
              status: 'draft',
              eventId: 'evt-123'
            }
          ],
          totalItems: 1
        }
      })

      await expect(
        load({
          params: { editionSlug: 'devfest-2025' },
          locals: { pb: mockPb }
        } as unknown as Parameters<typeof load>[0])
      ).rejects.toMatchObject({
        status: 404,
        body: { message: 'Schedule not available' }
      })
    })

    it('throws 500 when edition has no eventId', async () => {
      const { load } = await import('./+page.server')

      const mockPb = createMockPb({
        editions: {
          items: [
            {
              id: 'ed-123',
              name: 'DevFest 2025',
              slug: 'devfest-2025',
              status: 'published',
              eventId: null // Missing eventId
            }
          ],
          totalItems: 1
        }
      })

      await expect(
        load({
          params: { editionSlug: 'devfest-2025' },
          locals: { pb: mockPb }
        } as unknown as Parameters<typeof load>[0])
      ).rejects.toMatchObject({
        status: 500,
        body: { message: 'Edition has no associated event' }
      })
    })

    it('throws 500 when edition has empty eventId', async () => {
      const { load } = await import('./+page.server')

      const mockPb = createMockPb({
        editions: {
          items: [
            {
              id: 'ed-123',
              name: 'DevFest 2025',
              slug: 'devfest-2025',
              status: 'published',
              eventId: '' // Empty eventId
            }
          ],
          totalItems: 1
        }
      })

      await expect(
        load({
          params: { editionSlug: 'devfest-2025' },
          locals: { pb: mockPb }
        } as unknown as Parameters<typeof load>[0])
      ).rejects.toMatchObject({
        status: 500,
        body: { message: 'Edition has no associated event' }
      })
    })

    it('loads edition data successfully', async () => {
      const { load } = await import('./+page.server')

      const mockPb = createMockPb({
        editions: {
          items: [
            {
              id: 'ed-123',
              name: 'DevFest Paris 2025',
              slug: 'devfest-paris-2025',
              status: 'published',
              eventId: 'evt-456',
              startDate: '2025-10-15',
              endDate: '2025-10-16',
              venue: 'Palais des Congrès',
              city: 'Paris',
              country: 'France'
            }
          ],
          totalItems: 1
        },
        event: {
          id: 'evt-456',
          name: 'DevFest Paris'
        },
        rooms: [{ id: 'room-1', name: 'Amphi A', capacity: 500, order: 1 }],
        tracks: [{ id: 'track-1', name: 'Web', color: '#3b82f6', order: 1 }],
        slots: [
          {
            id: 'slot-1',
            roomId: 'room-1',
            date: '2025-10-15',
            startTime: '09:00',
            endTime: '10:00'
          }
        ],
        sessions: [
          {
            id: 'session-1',
            slotId: 'slot-1',
            title: 'Keynote',
            type: 'keynote'
          }
        ]
      })

      const result = (await load({
        params: { editionSlug: 'devfest-paris-2025' },
        locals: { pb: mockPb }
      } as unknown as Parameters<typeof load>[0])) as LoadResult

      expect(result.edition).toEqual({
        id: 'ed-123',
        name: 'DevFest Paris 2025',
        slug: 'devfest-paris-2025',
        startDate: '2025-10-15',
        endDate: '2025-10-16',
        venue: 'Palais des Congrès',
        city: 'Paris',
        country: 'France'
      })

      expect(result.event).toEqual({
        id: 'evt-456',
        name: 'DevFest Paris'
      })

      expect(result.rooms).toHaveLength(1)
      expect(result.tracks).toHaveLength(1)
      expect(result.slots).toHaveLength(1)
      expect(result.sessions).toHaveLength(1)
    })

    it('loads talks with expanded speakers', async () => {
      const { load } = await import('./+page.server')

      const mockPb = createMockPb({
        editions: {
          items: [
            {
              id: 'ed-123',
              name: 'DevFest 2025',
              slug: 'devfest-2025',
              status: 'published',
              eventId: 'evt-456'
            }
          ],
          totalItems: 1
        },
        event: { id: 'evt-456', name: 'DevFest' },
        sessions: [
          {
            id: 'session-1',
            slotId: 'slot-1',
            talkId: 'talk-1',
            title: 'Advanced TypeScript'
          }
        ],
        talks: [
          {
            id: 'talk-1',
            title: 'Advanced TypeScript',
            abstract: 'Deep dive into TypeScript',
            expand: {
              speakerIds: [
                {
                  id: 'speaker-1',
                  firstName: 'John',
                  lastName: 'Doe',
                  company: 'Tech Corp',
                  bio: 'Speaker bio'
                }
              ]
            }
          }
        ]
      })

      const result = (await load({
        params: { editionSlug: 'devfest-2025' },
        locals: { pb: mockPb }
      } as unknown as Parameters<typeof load>[0])) as LoadResult

      expect(result.talks).toHaveLength(1)
      expect(result.talks[0]).toEqual({
        id: 'talk-1',
        title: 'Advanced TypeScript',
        abstract: 'Deep dive into TypeScript',
        speakers: [
          {
            id: 'speaker-1',
            firstName: 'John',
            lastName: 'Doe',
            company: 'Tech Corp',
            bio: 'Speaker bio',
            photoUrl: undefined
          }
        ]
      })
    })
  })
})
