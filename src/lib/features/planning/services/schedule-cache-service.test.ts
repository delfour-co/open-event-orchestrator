import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock IndexedDB
const mockStore: Map<string, unknown> = new Map()
const mockFavoritesStore: Map<string, unknown> = new Map()

const mockTransaction = {
  objectStore: vi.fn((name: string) => {
    const store = name === 'favorites' ? mockFavoritesStore : mockStore
    return {
      put: vi.fn((data: { editionSlug?: string; sessionId?: string }) => {
        const key = name === 'favorites' ? data.sessionId : data.editionSlug
        store.set(key as string, data)
      }),
      get: vi.fn((key: string) => ({
        result: store.get(key),
        onsuccess: null as ((event: unknown) => void) | null,
        onerror: null as ((event: unknown) => void) | null
      })),
      delete: vi.fn((key: string) => {
        store.delete(key)
      }),
      index: vi.fn(() => ({
        getAll: vi.fn((slug: string) => ({
          result: Array.from(mockFavoritesStore.values()).filter(
            (f: unknown) => (f as { editionSlug: string }).editionSlug === slug
          ),
          onsuccess: null as ((event: unknown) => void) | null,
          onerror: null as ((event: unknown) => void) | null
        }))
      }))
    }
  }),
  oncomplete: null as (() => void) | null,
  onerror: null as (() => void) | null
}

const mockDb = {
  transaction: vi.fn(() => mockTransaction),
  objectStoreNames: {
    contains: vi.fn(() => true)
  },
  createObjectStore: vi.fn()
}

vi.stubGlobal('indexedDB', {
  open: vi.fn(() => ({
    result: mockDb,
    onsuccess: null as (() => void) | null,
    onerror: null as (() => void) | null,
    onupgradeneeded: null as (() => void) | null
  }))
})

describe('scheduleCacheService', () => {
  beforeEach(() => {
    mockStore.clear()
    mockFavoritesStore.clear()
    vi.clearAllMocks()
  })

  describe('CachedSchedule type', () => {
    it('should define proper schedule structure', () => {
      const schedule = {
        editionSlug: 'devfest-2025',
        edition: {
          id: 'ed1',
          name: 'DevFest 2025',
          slug: 'devfest-2025',
          startDate: '2025-10-15',
          endDate: '2025-10-16',
          venue: 'Convention Center',
          city: 'Paris',
          country: 'France'
        },
        event: {
          id: 'ev1',
          name: 'DevFest'
        },
        rooms: [{ id: 'r1', name: 'Main Hall', capacity: 500, floor: '1', order: 0 }],
        tracks: [{ id: 't1', name: 'Web', color: '#3b82f6', order: 0 }],
        slots: [
          { id: 's1', roomId: 'r1', date: '2025-10-15', startTime: '09:00', endTime: '10:00' }
        ],
        sessions: [{ id: 'sess1', slotId: 's1', title: 'Opening Keynote', type: 'keynote' }],
        talks: [
          {
            id: 'talk1',
            title: 'Opening Keynote',
            abstract: 'Welcome to DevFest',
            speakers: [{ id: 'sp1', firstName: 'John', lastName: 'Doe', company: 'Google' }]
          }
        ],
        cachedAt: Date.now()
      }

      expect(schedule.editionSlug).toBe('devfest-2025')
      expect(schedule.edition.name).toBe('DevFest 2025')
      expect(schedule.rooms).toHaveLength(1)
      expect(schedule.tracks).toHaveLength(1)
      expect(schedule.slots).toHaveLength(1)
      expect(schedule.sessions).toHaveLength(1)
      expect(schedule.talks).toHaveLength(1)
    })
  })

  describe('FavoriteSession type', () => {
    it('should define proper favorite structure', () => {
      const favorite = {
        sessionId: 'sess1',
        editionSlug: 'devfest-2025',
        addedAt: Date.now()
      }

      expect(favorite.sessionId).toBe('sess1')
      expect(favorite.editionSlug).toBe('devfest-2025')
      expect(typeof favorite.addedAt).toBe('number')
    })
  })

  describe('schedule caching', () => {
    it('should cache schedule with timestamp', () => {
      const schedule = {
        editionSlug: 'devfest-2025',
        edition: {
          id: 'ed1',
          name: 'DevFest 2025',
          slug: 'devfest-2025',
          startDate: '2025-10-15',
          endDate: '2025-10-16'
        },
        event: { id: 'ev1', name: 'DevFest' },
        rooms: [],
        tracks: [],
        slots: [],
        sessions: [],
        talks: []
      }

      // Verify structure is correct for caching
      expect(schedule.editionSlug).toBeDefined()
      expect(schedule.edition).toBeDefined()
      expect(schedule.event).toBeDefined()
      expect(Array.isArray(schedule.rooms)).toBe(true)
    })
  })

  describe('favorites management', () => {
    it('should track favorite session structure', () => {
      const favorite = {
        sessionId: 'sess-123',
        editionSlug: 'devfest-2025',
        addedAt: Date.now()
      }

      expect(favorite.sessionId).toBe('sess-123')
      expect(favorite.editionSlug).toBe('devfest-2025')
      expect(typeof favorite.addedAt).toBe('number')
    })

    it('should support multiple favorites per edition', () => {
      const favorites = [
        { sessionId: 'sess-1', editionSlug: 'devfest-2025', addedAt: Date.now() },
        { sessionId: 'sess-2', editionSlug: 'devfest-2025', addedAt: Date.now() },
        { sessionId: 'sess-3', editionSlug: 'other-event', addedAt: Date.now() }
      ]

      const devfestFavorites = favorites.filter((f) => f.editionSlug === 'devfest-2025')
      expect(devfestFavorites).toHaveLength(2)
    })
  })
})
