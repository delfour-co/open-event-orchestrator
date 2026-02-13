/**
 * IndexedDB-based schedule cache for offline attendee PWA
 */

const DB_NAME = 'oeo-attendee'
const DB_VERSION = 1
const SCHEDULE_STORE = 'schedule'
const FAVORITES_STORE = 'favorites'

export interface CachedSchedule {
  editionSlug: string
  edition: {
    id: string
    name: string
    slug: string
    startDate: string
    endDate: string
    venue?: string
    city?: string
    country?: string
  }
  event: {
    id: string
    name: string
  }
  rooms: Array<{
    id: string
    name: string
    capacity?: number
    floor?: string
    order: number
  }>
  tracks: Array<{
    id: string
    name: string
    color: string
    order: number
  }>
  slots: Array<{
    id: string
    roomId: string
    date: string
    startTime: string
    endTime: string
  }>
  sessions: Array<{
    id: string
    slotId: string
    talkId?: string
    trackId?: string
    title: string
    type: string
    description?: string
  }>
  talks: Array<{
    id: string
    title: string
    abstract: string
    speakers: Array<{
      id: string
      firstName: string
      lastName: string
      company?: string
      bio?: string
      photoUrl?: string
    }>
  }>
  cachedAt: number
}

export interface FavoriteSession {
  sessionId: string
  editionSlug: string
  addedAt: number
}

let dbPromise: Promise<IDBDatabase> | null = null

const openDb = (): Promise<IDBDatabase> => {
  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Schedule store
      if (!db.objectStoreNames.contains(SCHEDULE_STORE)) {
        db.createObjectStore(SCHEDULE_STORE, { keyPath: 'editionSlug' })
      }

      // Favorites store
      if (!db.objectStoreNames.contains(FAVORITES_STORE)) {
        const favoritesStore = db.createObjectStore(FAVORITES_STORE, { keyPath: 'sessionId' })
        favoritesStore.createIndex('editionSlug', 'editionSlug', { unique: false })
      }
    }
  })

  return dbPromise
}

export const scheduleCacheService = {
  /**
   * Cache schedule data for offline access
   */
  async cacheSchedule(schedule: Omit<CachedSchedule, 'cachedAt'>): Promise<void> {
    const db = await openDb()
    const tx = db.transaction(SCHEDULE_STORE, 'readwrite')
    const store = tx.objectStore(SCHEDULE_STORE)

    store.put({ ...schedule, cachedAt: Date.now() })

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  },

  /**
   * Get cached schedule by edition slug
   */
  async getSchedule(editionSlug: string): Promise<CachedSchedule | null> {
    const db = await openDb()
    const tx = db.transaction(SCHEDULE_STORE, 'readonly')
    const store = tx.objectStore(SCHEDULE_STORE)

    return new Promise((resolve, reject) => {
      const request = store.get(editionSlug)
      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  },

  /**
   * Clear cached schedule for an edition
   */
  async clearSchedule(editionSlug: string): Promise<void> {
    const db = await openDb()
    const tx = db.transaction(SCHEDULE_STORE, 'readwrite')
    const store = tx.objectStore(SCHEDULE_STORE)

    store.delete(editionSlug)

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  },

  /**
   * Get cache stats
   */
  async getCacheStats(
    editionSlug: string
  ): Promise<{ cached: boolean; lastUpdated: number | null }> {
    const schedule = await this.getSchedule(editionSlug)

    return {
      cached: !!schedule,
      lastUpdated: schedule?.cachedAt || null
    }
  },

  /**
   * Add a session to favorites
   */
  async addFavorite(sessionId: string, editionSlug: string): Promise<void> {
    const db = await openDb()
    const tx = db.transaction(FAVORITES_STORE, 'readwrite')
    const store = tx.objectStore(FAVORITES_STORE)

    const favorite: FavoriteSession = {
      sessionId,
      editionSlug,
      addedAt: Date.now()
    }

    store.put(favorite)

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  },

  /**
   * Remove a session from favorites
   */
  async removeFavorite(sessionId: string): Promise<void> {
    const db = await openDb()
    const tx = db.transaction(FAVORITES_STORE, 'readwrite')
    const store = tx.objectStore(FAVORITES_STORE)

    store.delete(sessionId)

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  },

  /**
   * Check if a session is favorited
   */
  async isFavorite(sessionId: string): Promise<boolean> {
    const db = await openDb()
    const tx = db.transaction(FAVORITES_STORE, 'readonly')
    const store = tx.objectStore(FAVORITES_STORE)

    return new Promise((resolve, reject) => {
      const request = store.get(sessionId)
      request.onsuccess = () => resolve(!!request.result)
      request.onerror = () => reject(request.error)
    })
  },

  /**
   * Get all favorites for an edition
   */
  async getFavorites(editionSlug: string): Promise<string[]> {
    const db = await openDb()
    const tx = db.transaction(FAVORITES_STORE, 'readonly')
    const store = tx.objectStore(FAVORITES_STORE)
    const index = store.index('editionSlug')

    return new Promise((resolve, reject) => {
      const request = index.getAll(editionSlug)
      request.onsuccess = () => {
        const favorites = (request.result || []) as FavoriteSession[]
        resolve(favorites.map((f) => f.sessionId))
      }
      request.onerror = () => reject(request.error)
    })
  },

  /**
   * Clear all favorites for an edition
   */
  async clearFavorites(editionSlug: string): Promise<void> {
    const favorites = await this.getFavorites(editionSlug)
    const db = await openDb()
    const tx = db.transaction(FAVORITES_STORE, 'readwrite')
    const store = tx.objectStore(FAVORITES_STORE)

    for (const sessionId of favorites) {
      store.delete(sessionId)
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  },

  /**
   * Toggle favorite status
   */
  async toggleFavorite(sessionId: string, editionSlug: string): Promise<boolean> {
    const isFav = await this.isFavorite(sessionId)
    if (isFav) {
      await this.removeFavorite(sessionId)
      return false
    }
    await this.addFavorite(sessionId, editionSlug)
    return true
  }
}
