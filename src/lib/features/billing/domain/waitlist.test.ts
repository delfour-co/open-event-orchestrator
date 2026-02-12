/**
 * Waitlist Domain Tests
 */

import { describe, expect, it } from 'vitest'
import {
  type WaitlistEntry,
  buildNotificationContext,
  calculatePurchaseWindowEnd,
  calculateWaitlistStats,
  canCancelEntry,
  canJoinWaitlist,
  exportWaitlistToCsv,
  formatNotificationDate,
  formatQueuePosition,
  getEntriesToNotify,
  getEntryFullName,
  getExpiredEntries,
  getNextPosition,
  getNotifiedEntries,
  getRemainingPurchaseTime,
  getWaitingEntries,
  getWaitlistEmailSubject,
  getWaitlistStatusColor,
  getWaitlistStatusLabel,
  hasPurchaseWindowExpired,
  isActiveEntry,
  isCancelled,
  isExpired,
  isInPurchaseWindow,
  isNotified,
  isPurchased,
  isWaiting,
  sortByPosition,
  validateCreateWaitlistEntry,
  validateWaitlistEntry
} from './waitlist'

// Test fixtures
const createEntry = (overrides?: Partial<WaitlistEntry>): WaitlistEntry => ({
  id: 'waitlist-001',
  editionId: 'edition-001',
  ticketTypeId: 'ticket-001',
  email: 'john@example.com',
  firstName: 'John',
  lastName: 'Doe',
  quantity: 1,
  status: 'waiting',
  position: 1,
  createdAt: new Date('2025-06-01T10:00:00Z'),
  updatedAt: new Date('2025-06-01T10:00:00Z'),
  ...overrides
})

describe('Status Check Functions', () => {
  describe('isWaiting', () => {
    it('should return true for waiting status', () => {
      const entry = createEntry({ status: 'waiting' })
      expect(isWaiting(entry)).toBe(true)
    })

    it('should return false for other statuses', () => {
      expect(isWaiting(createEntry({ status: 'notified' }))).toBe(false)
      expect(isWaiting(createEntry({ status: 'purchased' }))).toBe(false)
    })
  })

  describe('isNotified', () => {
    it('should return true for notified status', () => {
      const entry = createEntry({ status: 'notified' })
      expect(isNotified(entry)).toBe(true)
    })
  })

  describe('isPurchased', () => {
    it('should return true for purchased status', () => {
      const entry = createEntry({ status: 'purchased' })
      expect(isPurchased(entry)).toBe(true)
    })
  })

  describe('isExpired', () => {
    it('should return true for expired status', () => {
      const entry = createEntry({ status: 'expired' })
      expect(isExpired(entry)).toBe(true)
    })
  })

  describe('isCancelled', () => {
    it('should return true for cancelled status', () => {
      const entry = createEntry({ status: 'cancelled' })
      expect(isCancelled(entry)).toBe(true)
    })
  })

  describe('isActiveEntry', () => {
    it('should return true for waiting entries', () => {
      expect(isActiveEntry(createEntry({ status: 'waiting' }))).toBe(true)
    })

    it('should return true for notified entries', () => {
      expect(isActiveEntry(createEntry({ status: 'notified' }))).toBe(true)
    })

    it('should return false for other statuses', () => {
      expect(isActiveEntry(createEntry({ status: 'purchased' }))).toBe(false)
      expect(isActiveEntry(createEntry({ status: 'expired' }))).toBe(false)
      expect(isActiveEntry(createEntry({ status: 'cancelled' }))).toBe(false)
    })
  })

  describe('isInPurchaseWindow', () => {
    it('should return true when in purchase window', () => {
      const futureDate = new Date()
      futureDate.setHours(futureDate.getHours() + 12)

      const entry = createEntry({
        status: 'notified',
        purchaseWindowEnd: futureDate
      })
      expect(isInPurchaseWindow(entry)).toBe(true)
    })

    it('should return false when purchase window expired', () => {
      const pastDate = new Date()
      pastDate.setHours(pastDate.getHours() - 1)

      const entry = createEntry({
        status: 'notified',
        purchaseWindowEnd: pastDate
      })
      expect(isInPurchaseWindow(entry)).toBe(false)
    })

    it('should return false for non-notified entries', () => {
      const entry = createEntry({
        status: 'waiting',
        purchaseWindowEnd: new Date()
      })
      expect(isInPurchaseWindow(entry)).toBe(false)
    })
  })

  describe('hasPurchaseWindowExpired', () => {
    it('should return true when window has expired', () => {
      const pastDate = new Date()
      pastDate.setHours(pastDate.getHours() - 1)

      const entry = createEntry({
        status: 'notified',
        purchaseWindowEnd: pastDate
      })
      expect(hasPurchaseWindowExpired(entry)).toBe(true)
    })

    it('should return false when window has not expired', () => {
      const futureDate = new Date()
      futureDate.setHours(futureDate.getHours() + 12)

      const entry = createEntry({
        status: 'notified',
        purchaseWindowEnd: futureDate
      })
      expect(hasPurchaseWindowExpired(entry)).toBe(false)
    })
  })
})

describe('Queue Management Functions', () => {
  describe('getNextPosition', () => {
    it('should return 1 for empty list', () => {
      expect(getNextPosition([])).toBe(1)
    })

    it('should return max position + 1', () => {
      const entries = [
        createEntry({ position: 1 }),
        createEntry({ position: 3 }),
        createEntry({ position: 2 })
      ]
      expect(getNextPosition(entries)).toBe(4)
    })
  })

  describe('sortByPosition', () => {
    it('should sort entries by position', () => {
      const entries = [
        createEntry({ position: 3 }),
        createEntry({ position: 1 }),
        createEntry({ position: 2 })
      ]

      const sorted = sortByPosition(entries)

      expect(sorted[0].position).toBe(1)
      expect(sorted[1].position).toBe(2)
      expect(sorted[2].position).toBe(3)
    })
  })

  describe('getWaitingEntries', () => {
    it('should return only waiting entries sorted by position', () => {
      const entries = [
        createEntry({ id: '1', position: 2, status: 'waiting' }),
        createEntry({ id: '2', position: 1, status: 'notified' }),
        createEntry({ id: '3', position: 3, status: 'waiting' })
      ]

      const waiting = getWaitingEntries(entries)

      expect(waiting).toHaveLength(2)
      expect(waiting[0].position).toBe(2)
      expect(waiting[1].position).toBe(3)
    })
  })

  describe('getNotifiedEntries', () => {
    it('should return only notified entries', () => {
      const entries = [
        createEntry({ id: '1', status: 'waiting' }),
        createEntry({ id: '2', status: 'notified' }),
        createEntry({ id: '3', status: 'notified' })
      ]

      const notified = getNotifiedEntries(entries)

      expect(notified).toHaveLength(2)
    })
  })

  describe('getExpiredEntries', () => {
    it('should return entries with expired purchase window', () => {
      const pastDate = new Date()
      pastDate.setHours(pastDate.getHours() - 1)

      const futureDate = new Date()
      futureDate.setHours(futureDate.getHours() + 12)

      const entries = [
        createEntry({ id: '1', status: 'notified', purchaseWindowEnd: pastDate }),
        createEntry({ id: '2', status: 'notified', purchaseWindowEnd: futureDate }),
        createEntry({ id: '3', status: 'waiting' })
      ]

      const expired = getExpiredEntries(entries)

      expect(expired).toHaveLength(1)
      expect(expired[0].id).toBe('1')
    })
  })

  describe('getEntriesToNotify', () => {
    it('should return entries up to available tickets', () => {
      const entries = [
        createEntry({ id: '1', position: 1, status: 'waiting', quantity: 2 }),
        createEntry({ id: '2', position: 2, status: 'waiting', quantity: 2 }),
        createEntry({ id: '3', position: 3, status: 'waiting', quantity: 2 })
      ]

      const toNotify = getEntriesToNotify(entries, 4, 10)

      expect(toNotify).toHaveLength(2)
      expect(toNotify[0].id).toBe('1')
      expect(toNotify[1].id).toBe('2')
    })

    it('should respect max batch size', () => {
      const entries = [
        createEntry({ id: '1', position: 1, status: 'waiting', quantity: 1 }),
        createEntry({ id: '2', position: 2, status: 'waiting', quantity: 1 }),
        createEntry({ id: '3', position: 3, status: 'waiting', quantity: 1 })
      ]

      const toNotify = getEntriesToNotify(entries, 10, 2)

      expect(toNotify).toHaveLength(2)
    })

    it('should skip entries already notified', () => {
      const entries = [
        createEntry({ id: '1', position: 1, status: 'notified', quantity: 1 }),
        createEntry({ id: '2', position: 2, status: 'waiting', quantity: 1 })
      ]

      const toNotify = getEntriesToNotify(entries, 10, 10)

      expect(toNotify).toHaveLength(1)
      expect(toNotify[0].id).toBe('2')
    })
  })
})

describe('Display Functions', () => {
  describe('getWaitlistStatusLabel', () => {
    it('should return correct labels', () => {
      expect(getWaitlistStatusLabel('waiting')).toBe('Waiting')
      expect(getWaitlistStatusLabel('notified')).toBe('Notified')
      expect(getWaitlistStatusLabel('purchased')).toBe('Purchased')
      expect(getWaitlistStatusLabel('expired')).toBe('Expired')
      expect(getWaitlistStatusLabel('cancelled')).toBe('Cancelled')
    })
  })

  describe('getWaitlistStatusColor', () => {
    it('should return correct colors', () => {
      expect(getWaitlistStatusColor('waiting')).toBe('yellow')
      expect(getWaitlistStatusColor('notified')).toBe('blue')
      expect(getWaitlistStatusColor('purchased')).toBe('green')
      expect(getWaitlistStatusColor('expired')).toBe('gray')
      expect(getWaitlistStatusColor('cancelled')).toBe('red')
    })
  })

  describe('formatQueuePosition', () => {
    it('should format ordinal numbers correctly', () => {
      expect(formatQueuePosition(1)).toBe('1st')
      expect(formatQueuePosition(2)).toBe('2nd')
      expect(formatQueuePosition(3)).toBe('3rd')
      expect(formatQueuePosition(4)).toBe('4th')
      expect(formatQueuePosition(11)).toBe('11th')
      expect(formatQueuePosition(21)).toBe('21th')
    })
  })

  describe('getEntryFullName', () => {
    it('should return full name', () => {
      const entry = createEntry({ firstName: 'John', lastName: 'Doe' })
      expect(getEntryFullName(entry)).toBe('John Doe')
    })
  })
})

describe('Time Calculation Functions', () => {
  describe('calculatePurchaseWindowEnd', () => {
    it('should add hours to notified time', () => {
      const notifiedAt = new Date('2025-06-15T10:00:00Z')
      const windowEnd = calculatePurchaseWindowEnd(notifiedAt, 24)

      expect(windowEnd.getTime()).toBe(new Date('2025-06-16T10:00:00Z').getTime())
    })

    it('should use default 24 hours', () => {
      const notifiedAt = new Date('2025-06-15T10:00:00Z')
      const windowEnd = calculatePurchaseWindowEnd(notifiedAt)

      expect(windowEnd.getTime()).toBe(new Date('2025-06-16T10:00:00Z').getTime())
    })
  })

  describe('getRemainingPurchaseTime', () => {
    it('should return remaining time when window active', () => {
      const futureDate = new Date()
      futureDate.setHours(futureDate.getHours() + 2)
      futureDate.setMinutes(futureDate.getMinutes() + 30)

      const entry = createEntry({
        status: 'notified',
        purchaseWindowEnd: futureDate
      })

      const result = getRemainingPurchaseTime(entry)

      expect(result.hasTime).toBe(true)
      expect(result.hours).toBe(2)
      expect(result.minutes).toBeGreaterThanOrEqual(29)
    })

    it('should return expired when window passed', () => {
      const pastDate = new Date()
      pastDate.setHours(pastDate.getHours() - 1)

      const entry = createEntry({
        status: 'notified',
        purchaseWindowEnd: pastDate
      })

      const result = getRemainingPurchaseTime(entry)

      expect(result.hasTime).toBe(false)
      expect(result.formatted).toBe('Expired')
    })

    it('should handle no purchase window', () => {
      const entry = createEntry({ status: 'notified' })

      const result = getRemainingPurchaseTime(entry)

      expect(result.hasTime).toBe(false)
      expect(result.formatted).toBe('No window')
    })
  })

  describe('formatNotificationDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2025-06-15T14:30:00Z')
      const formatted = formatNotificationDate(date)

      expect(formatted).toContain('Jun')
      expect(formatted).toContain('15')
    })
  })
})

describe('Statistics Functions', () => {
  describe('calculateWaitlistStats', () => {
    it('should calculate correct statistics', () => {
      const entries = [
        createEntry({ id: '1', status: 'waiting', quantity: 2 }),
        createEntry({ id: '2', status: 'notified', quantity: 1 }),
        createEntry({
          id: '3',
          status: 'purchased',
          quantity: 2,
          notifiedAt: new Date(),
          purchasedAt: new Date()
        }),
        createEntry({ id: '4', status: 'expired', quantity: 1, notifiedAt: new Date() }),
        createEntry({ id: '5', status: 'cancelled', quantity: 1 })
      ]

      const stats = calculateWaitlistStats(entries)

      expect(stats.totalEntries).toBe(5)
      expect(stats.waiting).toBe(1)
      expect(stats.notified).toBe(1)
      expect(stats.purchased).toBe(1)
      expect(stats.expired).toBe(1)
      expect(stats.cancelled).toBe(1)
      expect(stats.totalTicketsRequested).toBe(7)
    })

    it('should calculate conversion rate', () => {
      const entries = [
        createEntry({ id: '1', status: 'purchased', notifiedAt: new Date() }),
        createEntry({ id: '2', status: 'expired', notifiedAt: new Date() })
      ]

      const stats = calculateWaitlistStats(entries)

      expect(stats.conversionRate).toBe(50)
    })

    it('should handle empty list', () => {
      const stats = calculateWaitlistStats([])

      expect(stats.totalEntries).toBe(0)
      expect(stats.conversionRate).toBe(0)
    })
  })
})

describe('Eligibility Functions', () => {
  describe('canJoinWaitlist', () => {
    it('should allow joining when not on waitlist', () => {
      const result = canJoinWaitlist('new@example.com', 'ticket-001', [], 5)

      expect(result.allowed).toBe(true)
    })

    it('should deny if already on waitlist for same ticket type', () => {
      const existingEntries = [
        createEntry({ email: 'john@example.com', ticketTypeId: 'ticket-001', status: 'waiting' })
      ]

      const result = canJoinWaitlist('john@example.com', 'ticket-001', existingEntries, 5)

      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('Already on waitlist')
    })

    it('should allow joining for different ticket type', () => {
      const existingEntries = [
        createEntry({ email: 'john@example.com', ticketTypeId: 'ticket-001', status: 'waiting' })
      ]

      const result = canJoinWaitlist('john@example.com', 'ticket-002', existingEntries, 5)

      expect(result.allowed).toBe(true)
    })

    it('should deny if max entries reached', () => {
      const existingEntries = [
        createEntry({
          id: '1',
          email: 'john@example.com',
          ticketTypeId: 'ticket-001',
          status: 'waiting'
        }),
        createEntry({
          id: '2',
          email: 'john@example.com',
          ticketTypeId: 'ticket-002',
          status: 'waiting'
        })
      ]

      const result = canJoinWaitlist('john@example.com', 'ticket-003', existingEntries, 2)

      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('Maximum')
    })

    it('should not count cancelled entries toward limit', () => {
      const existingEntries = [
        createEntry({ email: 'john@example.com', ticketTypeId: 'ticket-001', status: 'cancelled' })
      ]

      const result = canJoinWaitlist('john@example.com', 'ticket-001', existingEntries, 1)

      expect(result.allowed).toBe(true)
    })

    it('should be case-insensitive for email', () => {
      const existingEntries = [
        createEntry({ email: 'John@Example.com', ticketTypeId: 'ticket-001', status: 'waiting' })
      ]

      const result = canJoinWaitlist('john@example.com', 'ticket-001', existingEntries, 5)

      expect(result.allowed).toBe(false)
    })
  })

  describe('canCancelEntry', () => {
    it('should allow cancelling waiting entries', () => {
      const entry = createEntry({ status: 'waiting' })
      expect(canCancelEntry(entry)).toBe(true)
    })

    it('should allow cancelling notified entries', () => {
      const entry = createEntry({ status: 'notified' })
      expect(canCancelEntry(entry)).toBe(true)
    })

    it('should not allow cancelling purchased entries', () => {
      const entry = createEntry({ status: 'purchased' })
      expect(canCancelEntry(entry)).toBe(false)
    })

    it('should not allow cancelling expired entries', () => {
      const entry = createEntry({ status: 'expired' })
      expect(canCancelEntry(entry)).toBe(false)
    })
  })
})

describe('Notification Functions', () => {
  describe('getWaitlistEmailSubject', () => {
    it('should return available subject', () => {
      const subject = getWaitlistEmailSubject('available', 'VIP Pass')
      expect(subject).toBe('Tickets available: VIP Pass')
    })

    it('should return reminder subject', () => {
      const subject = getWaitlistEmailSubject('reminder', 'VIP Pass')
      expect(subject).toContain('Reminder')
    })

    it('should return expired subject', () => {
      const subject = getWaitlistEmailSubject('expired', 'VIP Pass')
      expect(subject).toContain('expired')
    })
  })

  describe('buildNotificationContext', () => {
    it('should build context object', () => {
      const entry = createEntry({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        quantity: 2,
        position: 5
      })

      const context = buildNotificationContext(
        entry,
        'VIP Pass',
        'https://example.com/buy',
        'Tech Conf'
      )

      expect(context.firstName).toBe('John')
      expect(context.fullName).toBe('John Doe')
      expect(context.ticketTypeName).toBe('VIP Pass')
      expect(context.quantity).toBe('2')
      expect(context.position).toBe('5th')
      expect(context.purchaseUrl).toBe('https://example.com/buy')
      expect(context.eventName).toBe('Tech Conf')
    })
  })
})

describe('Export Functions', () => {
  describe('exportWaitlistToCsv', () => {
    it('should export entries to CSV format', () => {
      const entries = [
        createEntry({
          position: 1,
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          status: 'waiting'
        }),
        createEntry({
          position: 2,
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          status: 'notified'
        })
      ]

      const csv = exportWaitlistToCsv(entries)

      expect(csv).toContain('Position')
      expect(csv).toContain('First Name')
      expect(csv).toContain('John')
      expect(csv).toContain('Doe')
      expect(csv).toContain('Waiting')
      expect(csv).toContain('Jane')
      expect(csv).toContain('Notified')
    })

    it('should sort by position', () => {
      const entries = [
        createEntry({ position: 2, firstName: 'Jane' }),
        createEntry({ position: 1, firstName: 'John' })
      ]

      const csv = exportWaitlistToCsv(entries)
      const lines = csv.split('\n')

      // John should come first (position 1)
      expect(lines[1]).toContain('John')
    })
  })
})

describe('Validation Functions', () => {
  describe('validateWaitlistEntry', () => {
    it('should validate correct entry', () => {
      const entry = createEntry()
      expect(() => validateWaitlistEntry(entry)).not.toThrow()
    })

    it('should reject invalid email', () => {
      expect(() =>
        validateWaitlistEntry({
          ...createEntry(),
          email: 'not-an-email'
        })
      ).toThrow()
    })

    it('should reject invalid status', () => {
      expect(() =>
        validateWaitlistEntry({
          ...createEntry(),
          status: 'invalid'
        })
      ).toThrow()
    })
  })

  describe('validateCreateWaitlistEntry', () => {
    it('should validate create input', () => {
      const input = {
        editionId: 'edition-001',
        ticketTypeId: 'ticket-001',
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        quantity: 2
      }

      const result = validateCreateWaitlistEntry(input)

      expect(result.email).toBe('john@example.com')
      expect(result.quantity).toBe(2)
    })

    it('should apply default quantity', () => {
      const input = {
        editionId: 'edition-001',
        ticketTypeId: 'ticket-001',
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe'
      }

      const result = validateCreateWaitlistEntry(input)

      expect(result.quantity).toBe(1)
    })

    it('should reject quantity over max', () => {
      expect(() =>
        validateCreateWaitlistEntry({
          editionId: 'edition-001',
          ticketTypeId: 'ticket-001',
          email: 'john@example.com',
          firstName: 'John',
          lastName: 'Doe',
          quantity: 15
        })
      ).toThrow()
    })
  })
})
