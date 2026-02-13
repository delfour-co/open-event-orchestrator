/**
 * IndexedDB-based ticket cache for offline scanning
 */

const DB_NAME = 'oeo-scanner'
const DB_VERSION = 1
const TICKETS_STORE = 'tickets'
const PENDING_STORE = 'pending-checkins'

export interface CachedTicket {
  ticketNumber: string
  editionId: string
  attendeeFirstName: string
  attendeeLastName: string
  attendeeEmail: string
  status: 'valid' | 'used' | 'cancelled'
  cachedAt: number
}

export interface PendingCheckIn {
  id: string
  ticketNumber: string
  editionId: string
  checkedInAt: string
  checkedInBy: string
  synced: boolean
  createdAt: number
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

      // Tickets store
      if (!db.objectStoreNames.contains(TICKETS_STORE)) {
        const ticketStore = db.createObjectStore(TICKETS_STORE, { keyPath: 'ticketNumber' })
        ticketStore.createIndex('editionId', 'editionId', { unique: false })
        ticketStore.createIndex('status', 'status', { unique: false })
      }

      // Pending check-ins store
      if (!db.objectStoreNames.contains(PENDING_STORE)) {
        const pendingStore = db.createObjectStore(PENDING_STORE, { keyPath: 'id' })
        pendingStore.createIndex('synced', 'synced', { unique: false })
        pendingStore.createIndex('ticketNumber', 'ticketNumber', { unique: false })
      }
    }
  })

  return dbPromise
}

export const ticketCacheService = {
  /**
   * Cache tickets for offline access
   */
  async cacheTickets(tickets: CachedTicket[]): Promise<void> {
    const db = await openDb()
    const tx = db.transaction(TICKETS_STORE, 'readwrite')
    const store = tx.objectStore(TICKETS_STORE)

    for (const ticket of tickets) {
      store.put({ ...ticket, cachedAt: Date.now() })
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  },

  /**
   * Get a cached ticket by number
   */
  async getTicket(ticketNumber: string): Promise<CachedTicket | null> {
    const db = await openDb()
    const tx = db.transaction(TICKETS_STORE, 'readonly')
    const store = tx.objectStore(TICKETS_STORE)

    return new Promise((resolve, reject) => {
      const request = store.get(ticketNumber)
      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  },

  /**
   * Get all cached tickets for an edition
   */
  async getTicketsByEdition(editionId: string): Promise<CachedTicket[]> {
    const db = await openDb()
    const tx = db.transaction(TICKETS_STORE, 'readonly')
    const store = tx.objectStore(TICKETS_STORE)
    const index = store.index('editionId')

    return new Promise((resolve, reject) => {
      const request = index.getAll(editionId)
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  },

  /**
   * Update ticket status locally (mark as used)
   */
  async updateTicketStatus(
    ticketNumber: string,
    status: 'valid' | 'used' | 'cancelled'
  ): Promise<void> {
    const db = await openDb()
    const tx = db.transaction(TICKETS_STORE, 'readwrite')
    const store = tx.objectStore(TICKETS_STORE)

    return new Promise((resolve, reject) => {
      const getRequest = store.get(ticketNumber)
      getRequest.onsuccess = () => {
        const ticket = getRequest.result
        if (ticket) {
          ticket.status = status
          store.put(ticket)
        }
      }
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  },

  /**
   * Clear all cached tickets for an edition
   */
  async clearEditionCache(editionId: string): Promise<void> {
    const tickets = await this.getTicketsByEdition(editionId)
    const db = await openDb()
    const tx = db.transaction(TICKETS_STORE, 'readwrite')
    const store = tx.objectStore(TICKETS_STORE)

    for (const ticket of tickets) {
      store.delete(ticket.ticketNumber)
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  },

  /**
   * Get cache stats
   */
  async getCacheStats(editionId: string): Promise<{ total: number; lastUpdated: number | null }> {
    const tickets = await this.getTicketsByEdition(editionId)
    const lastUpdated = tickets.reduce((max, t) => Math.max(max, t.cachedAt || 0), 0)

    return {
      total: tickets.length,
      lastUpdated: lastUpdated || null
    }
  },

  /**
   * Add a pending check-in (for offline sync)
   */
  async addPendingCheckIn(
    checkIn: Omit<PendingCheckIn, 'id' | 'synced' | 'createdAt'>
  ): Promise<string> {
    const db = await openDb()
    const tx = db.transaction(PENDING_STORE, 'readwrite')
    const store = tx.objectStore(PENDING_STORE)

    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    const pendingCheckIn: PendingCheckIn = {
      ...checkIn,
      id,
      synced: false,
      createdAt: Date.now()
    }

    store.add(pendingCheckIn)

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(id)
      tx.onerror = () => reject(tx.error)
    })
  },

  /**
   * Get all pending (unsynced) check-ins
   */
  async getPendingCheckIns(): Promise<PendingCheckIn[]> {
    const db = await openDb()
    const tx = db.transaction(PENDING_STORE, 'readonly')
    const store = tx.objectStore(PENDING_STORE)

    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => {
        const allCheckIns = (request.result || []) as PendingCheckIn[]
        resolve(allCheckIns.filter((c) => !c.synced))
      }
      request.onerror = () => reject(request.error)
    })
  },

  /**
   * Mark a pending check-in as synced
   */
  async markCheckInSynced(id: string): Promise<void> {
    const db = await openDb()
    const tx = db.transaction(PENDING_STORE, 'readwrite')
    const store = tx.objectStore(PENDING_STORE)

    return new Promise((resolve, reject) => {
      const getRequest = store.get(id)
      getRequest.onsuccess = () => {
        const checkIn = getRequest.result
        if (checkIn) {
          checkIn.synced = true
          store.put(checkIn)
        }
      }
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  },

  /**
   * Delete synced check-ins older than given age
   */
  async cleanupSyncedCheckIns(maxAgeMs: number = 24 * 60 * 60 * 1000): Promise<void> {
    const db = await openDb()
    const tx = db.transaction(PENDING_STORE, 'readwrite')
    const store = tx.objectStore(PENDING_STORE)

    return new Promise((resolve, reject) => {
      const request = store.openCursor()
      const cutoff = Date.now() - maxAgeMs

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result
        if (cursor) {
          const checkIn = cursor.value as PendingCheckIn
          if (checkIn.synced && checkIn.createdAt < cutoff) {
            cursor.delete()
          }
          cursor.continue()
        }
      }

      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  },

  /**
   * Check if a ticket was already checked in offline
   */
  async isCheckedInOffline(ticketNumber: string): Promise<boolean> {
    const db = await openDb()
    const tx = db.transaction(PENDING_STORE, 'readonly')
    const store = tx.objectStore(PENDING_STORE)
    const index = store.index('ticketNumber')

    return new Promise((resolve, reject) => {
      const request = index.getAll(ticketNumber)
      request.onsuccess = () => {
        const checkIns = request.result || []
        resolve(checkIns.some((c) => !c.synced || c.synced))
      }
      request.onerror = () => reject(request.error)
    })
  }
}
