/**
 * Offline sync service for managing check-in synchronization
 */

import { type CachedTicket, ticketCacheService } from './ticket-cache-service'

export interface SyncResult {
  synced: number
  failed: number
  errors: string[]
}

export interface OfflineCheckInResult {
  success: boolean
  offline: boolean
  ticket: CachedTicket | null
  error?: string
}

export const offlineSyncService = {
  /**
   * Check if we're online
   */
  isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true
  },

  /**
   * Download and cache tickets for an edition
   */
  async downloadTickets(editionId: string, apiUrl: string): Promise<{ count: number }> {
    const response = await fetch(`${apiUrl}/api/scan/tickets?editionId=${editionId}`)

    if (!response.ok) {
      throw new Error(`Failed to download tickets: ${response.statusText}`)
    }

    const data = (await response.json()) as { tickets: CachedTicket[] }
    await ticketCacheService.cacheTickets(data.tickets)

    return { count: data.tickets.length }
  },

  /**
   * Perform offline check-in validation
   */
  async checkInOffline(
    ticketNumber: string,
    editionId: string,
    checkedInBy: string
  ): Promise<OfflineCheckInResult> {
    // Try to get ticket from cache
    const ticket = await ticketCacheService.getTicket(ticketNumber)

    if (!ticket) {
      return {
        success: false,
        offline: true,
        ticket: null,
        error: 'Ticket not found in offline cache'
      }
    }

    // Verify edition
    if (ticket.editionId !== editionId) {
      return {
        success: false,
        offline: true,
        ticket,
        error: 'This ticket is for a different edition'
      }
    }

    // Check status
    if (ticket.status === 'used') {
      return {
        success: false,
        offline: true,
        ticket,
        error: 'Ticket already used'
      }
    }

    if (ticket.status === 'cancelled') {
      return {
        success: false,
        offline: true,
        ticket,
        error: 'Ticket has been cancelled'
      }
    }

    // Check if already checked in offline
    const alreadyCheckedIn = await ticketCacheService.isCheckedInOffline(ticketNumber)
    if (alreadyCheckedIn) {
      return {
        success: false,
        offline: true,
        ticket,
        error: 'Ticket already scanned (pending sync)'
      }
    }

    // Update local cache
    await ticketCacheService.updateTicketStatus(ticketNumber, 'used')

    // Add to pending sync queue
    await ticketCacheService.addPendingCheckIn({
      ticketNumber,
      editionId,
      checkedInAt: new Date().toISOString(),
      checkedInBy
    })

    return {
      success: true,
      offline: true,
      ticket: { ...ticket, status: 'used' }
    }
  },

  /**
   * Sync pending check-ins with the server
   */
  async syncPendingCheckIns(apiUrl: string): Promise<SyncResult> {
    const pending = await ticketCacheService.getPendingCheckIns()

    if (pending.length === 0) {
      return { synced: 0, failed: 0, errors: [] }
    }

    let synced = 0
    let failed = 0
    const errors: string[] = []

    for (const checkIn of pending) {
      try {
        const response = await fetch(`${apiUrl}/api/scan/checkin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ticketNumber: checkIn.ticketNumber,
            editionId: checkIn.editionId,
            checkedInAt: checkIn.checkedInAt,
            checkedInBy: checkIn.checkedInBy,
            offlineId: checkIn.id
          })
        })

        if (response.ok) {
          await ticketCacheService.markCheckInSynced(checkIn.id)
          synced++
        } else {
          const data = (await response.json()) as { error?: string }
          // If already checked in on server, mark as synced
          if (data.error?.includes('already used') || data.error?.includes('already checked')) {
            await ticketCacheService.markCheckInSynced(checkIn.id)
            synced++
          } else {
            failed++
            errors.push(`${checkIn.ticketNumber}: ${data.error || 'Unknown error'}`)
          }
        }
      } catch (err) {
        failed++
        errors.push(`${checkIn.ticketNumber}: Network error`)
      }
    }

    // Cleanup old synced check-ins
    await ticketCacheService.cleanupSyncedCheckIns()

    return { synced, failed, errors }
  },

  /**
   * Get count of pending check-ins
   */
  async getPendingCount(): Promise<number> {
    const pending = await ticketCacheService.getPendingCheckIns()
    return pending.length
  },

  /**
   * Register service worker for background sync
   */
  async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      return null
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js')

      // Listen for sync messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'SYNC_CHECKINS') {
          // Trigger sync when service worker requests it
          this.syncPendingCheckIns(window.location.origin)
        }
      })

      return registration
    } catch (err) {
      console.error('Service worker registration failed:', err)
      return null
    }
  },

  /**
   * Request background sync
   */
  async requestSync(): Promise<void> {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }

    const registration = await navigator.serviceWorker.ready

    if ('sync' in registration) {
      try {
        await (
          registration as ServiceWorkerRegistration & {
            sync: { register: (tag: string) => Promise<void> }
          }
        ).sync.register('sync-checkins')
      } catch {
        // Background sync not supported, will sync on next online
      }
    }
  },

  /**
   * Listen for online/offline events
   */
  setupConnectivityListeners(onOnline: () => void, onOffline: () => void): () => void {
    if (typeof window === 'undefined') {
      return () => {}
    }

    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)

    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }
}
