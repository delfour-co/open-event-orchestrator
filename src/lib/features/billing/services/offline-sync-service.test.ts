import { beforeEach, describe, expect, it, vi } from 'vitest'
import { offlineSyncService } from './offline-sync-service'
import { type CachedTicket, type PendingCheckIn, ticketCacheService } from './ticket-cache-service'

// Mock the ticket cache service
vi.mock('./ticket-cache-service', () => ({
  ticketCacheService: {
    cacheTickets: vi.fn(),
    getTicket: vi.fn(),
    getTicketsByEdition: vi.fn(),
    updateTicketStatus: vi.fn(),
    clearEditionCache: vi.fn(),
    getCacheStats: vi.fn(),
    addPendingCheckIn: vi.fn(),
    getPendingCheckIns: vi.fn(),
    markCheckInSynced: vi.fn(),
    cleanupSyncedCheckIns: vi.fn(),
    isCheckedInOffline: vi.fn()
  }
}))

const makeTicket = (overrides: Partial<CachedTicket> = {}): CachedTicket => ({
  ticketNumber: 'TKT-TEST-123',
  editionId: 'ed-1',
  attendeeFirstName: 'John',
  attendeeLastName: 'Doe',
  attendeeEmail: 'john@example.com',
  status: 'valid',
  cachedAt: Date.now(),
  ...overrides
})

const makePendingCheckIn = (overrides: Partial<PendingCheckIn> = {}): PendingCheckIn => ({
  id: 'pending-1',
  ticketNumber: 'TKT-TEST-123',
  editionId: 'ed-1',
  checkedInAt: new Date().toISOString(),
  checkedInBy: 'user-1',
  synced: false,
  createdAt: Date.now(),
  ...overrides
})

describe('offlineSyncService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('isOnline', () => {
    it('should return navigator.onLine value', () => {
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true })
      expect(offlineSyncService.isOnline()).toBe(true)

      Object.defineProperty(navigator, 'onLine', { value: false, writable: true })
      expect(offlineSyncService.isOnline()).toBe(false)
    })
  })

  describe('checkInOffline', () => {
    it('should return error when ticket not in cache', async () => {
      vi.mocked(ticketCacheService.getTicket).mockResolvedValue(null)

      const result = await offlineSyncService.checkInOffline('TKT-UNKNOWN', 'ed-1', 'user-1')

      expect(result.success).toBe(false)
      expect(result.offline).toBe(true)
      expect(result.error).toBe('Ticket not found in offline cache')
    })

    it('should return error when ticket is for different edition', async () => {
      vi.mocked(ticketCacheService.getTicket).mockResolvedValue(makeTicket({ editionId: 'ed-2' }))

      const result = await offlineSyncService.checkInOffline('TKT-TEST-123', 'ed-1', 'user-1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('This ticket is for a different edition')
    })

    it('should return error when ticket is already used', async () => {
      vi.mocked(ticketCacheService.getTicket).mockResolvedValue(makeTicket({ status: 'used' }))

      const result = await offlineSyncService.checkInOffline('TKT-TEST-123', 'ed-1', 'user-1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Ticket already used')
    })

    it('should return error when ticket is cancelled', async () => {
      vi.mocked(ticketCacheService.getTicket).mockResolvedValue(makeTicket({ status: 'cancelled' }))

      const result = await offlineSyncService.checkInOffline('TKT-TEST-123', 'ed-1', 'user-1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Ticket has been cancelled')
    })

    it('should return error when ticket already checked in offline', async () => {
      vi.mocked(ticketCacheService.getTicket).mockResolvedValue(makeTicket())
      vi.mocked(ticketCacheService.isCheckedInOffline).mockResolvedValue(true)

      const result = await offlineSyncService.checkInOffline('TKT-TEST-123', 'ed-1', 'user-1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Ticket already scanned (pending sync)')
    })

    it('should successfully check in a valid ticket offline', async () => {
      const ticket = makeTicket()
      vi.mocked(ticketCacheService.getTicket).mockResolvedValue(ticket)
      vi.mocked(ticketCacheService.isCheckedInOffline).mockResolvedValue(false)
      vi.mocked(ticketCacheService.updateTicketStatus).mockResolvedValue()
      vi.mocked(ticketCacheService.addPendingCheckIn).mockResolvedValue('pending-1')

      const result = await offlineSyncService.checkInOffline('TKT-TEST-123', 'ed-1', 'user-1')

      expect(result.success).toBe(true)
      expect(result.offline).toBe(true)
      expect(result.ticket?.status).toBe('used')
      expect(ticketCacheService.updateTicketStatus).toHaveBeenCalledWith('TKT-TEST-123', 'used')
      expect(ticketCacheService.addPendingCheckIn).toHaveBeenCalledWith(
        expect.objectContaining({
          ticketNumber: 'TKT-TEST-123',
          editionId: 'ed-1',
          checkedInBy: 'user-1'
        })
      )
    })
  })

  describe('syncPendingCheckIns', () => {
    it('should return empty result when no pending check-ins', async () => {
      vi.mocked(ticketCacheService.getPendingCheckIns).mockResolvedValue([])

      const result = await offlineSyncService.syncPendingCheckIns('http://localhost')

      expect(result).toEqual({ synced: 0, failed: 0, errors: [] })
    })

    it('should sync pending check-ins successfully', async () => {
      const pending = [makePendingCheckIn()]
      vi.mocked(ticketCacheService.getPendingCheckIns).mockResolvedValue(pending)

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })

      const result = await offlineSyncService.syncPendingCheckIns('http://localhost')

      expect(result.synced).toBe(1)
      expect(result.failed).toBe(0)
      expect(ticketCacheService.markCheckInSynced).toHaveBeenCalledWith('pending-1')
    })

    it('should handle sync failures', async () => {
      const pending = [makePendingCheckIn()]
      vi.mocked(ticketCacheService.getPendingCheckIns).mockResolvedValue(pending)

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Server error' })
      })

      const result = await offlineSyncService.syncPendingCheckIns('http://localhost')

      expect(result.synced).toBe(0)
      expect(result.failed).toBe(1)
      expect(result.errors).toContain('TKT-TEST-123: Server error')
    })

    it('should mark as synced if ticket already used on server', async () => {
      const pending = [makePendingCheckIn()]
      vi.mocked(ticketCacheService.getPendingCheckIns).mockResolvedValue(pending)

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Ticket already used' })
      })

      const result = await offlineSyncService.syncPendingCheckIns('http://localhost')

      expect(result.synced).toBe(1)
      expect(result.failed).toBe(0)
      expect(ticketCacheService.markCheckInSynced).toHaveBeenCalledWith('pending-1')
    })

    it('should handle network errors', async () => {
      const pending = [makePendingCheckIn()]
      vi.mocked(ticketCacheService.getPendingCheckIns).mockResolvedValue(pending)

      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      const result = await offlineSyncService.syncPendingCheckIns('http://localhost')

      expect(result.synced).toBe(0)
      expect(result.failed).toBe(1)
      expect(result.errors).toContain('TKT-TEST-123: Network error')
    })
  })

  describe('getPendingCount', () => {
    it('should return count of pending check-ins', async () => {
      vi.mocked(ticketCacheService.getPendingCheckIns).mockResolvedValue([
        makePendingCheckIn(),
        makePendingCheckIn({ id: 'pending-2' })
      ])

      const count = await offlineSyncService.getPendingCount()

      expect(count).toBe(2)
    })
  })
})
