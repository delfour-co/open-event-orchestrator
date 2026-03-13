import { beforeEach, describe, expect, it, vi } from 'vitest'
import { type SessionReminder, reminderService } from './reminder-service'

describe('reminderService', () => {
  let store: Record<string, string>

  beforeEach(() => {
    store = {}
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = value
      },
      removeItem: (key: string) => {
        delete store[key]
      }
    })
  })

  const baseReminder: SessionReminder = {
    sessionId: 'session-1',
    sessionTitle: 'Introduction to TypeScript',
    roomName: 'Room A',
    startTime: '2026-06-15T10:00:00',
    reminderMinutes: 15,
    editionSlug: 'conf-2026',
    enabled: true
  }

  describe('setReminder and getReminder', () => {
    it('stores and retrieves a reminder', () => {
      reminderService.setReminder(baseReminder)
      const result = reminderService.getReminder('session-1')
      expect(result).toEqual(baseReminder)
    })

    it('returns null for non-existent reminder', () => {
      expect(reminderService.getReminder('non-existent')).toBeNull()
    })

    it('overwrites an existing reminder', () => {
      reminderService.setReminder(baseReminder)
      const updated = { ...baseReminder, reminderMinutes: 30 }
      reminderService.setReminder(updated)
      expect(reminderService.getReminder('session-1')?.reminderMinutes).toBe(30)
    })
  })

  describe('removeReminder', () => {
    it('removes an existing reminder', () => {
      reminderService.setReminder(baseReminder)
      reminderService.removeReminder('session-1')
      expect(reminderService.getReminder('session-1')).toBeNull()
    })

    it('does not throw when removing non-existent reminder', () => {
      expect(() => reminderService.removeReminder('non-existent')).not.toThrow()
    })
  })

  describe('getAllReminders', () => {
    it('returns empty array when no reminders', () => {
      expect(reminderService.getAllReminders()).toEqual([])
    })

    it('returns all stored reminders', () => {
      reminderService.setReminder(baseReminder)
      reminderService.setReminder({
        ...baseReminder,
        sessionId: 'session-2',
        sessionTitle: 'Advanced TS'
      })
      expect(reminderService.getAllReminders()).toHaveLength(2)
    })
  })

  describe('getEnabledReminders', () => {
    it('returns only enabled reminders', () => {
      reminderService.setReminder(baseReminder)
      reminderService.setReminder({ ...baseReminder, sessionId: 'session-2', enabled: false })
      const enabled = reminderService.getEnabledReminders()
      expect(enabled).toHaveLength(1)
      expect(enabled[0].sessionId).toBe('session-1')
    })
  })

  describe('hasReminder', () => {
    it('returns true for enabled reminder', () => {
      reminderService.setReminder(baseReminder)
      expect(reminderService.hasReminder('session-1')).toBe(true)
    })

    it('returns false for disabled reminder', () => {
      reminderService.setReminder({ ...baseReminder, enabled: false })
      expect(reminderService.hasReminder('session-1')).toBe(false)
    })

    it('returns false for non-existent reminder', () => {
      expect(reminderService.hasReminder('non-existent')).toBe(false)
    })
  })

  describe('defaultReminderMinutes', () => {
    it('returns 15 by default', () => {
      expect(reminderService.getDefaultReminderMinutes()).toBe(15)
    })

    it('stores and retrieves a custom default', () => {
      reminderService.setDefaultReminderMinutes(30)
      expect(reminderService.getDefaultReminderMinutes()).toBe(30)
    })

    it('returns 15 for invalid stored value', () => {
      store['oeo-reminder-default-minutes'] = 'invalid'
      expect(reminderService.getDefaultReminderMinutes()).toBe(15)
    })

    it('returns 15 for non-standard minute values', () => {
      store['oeo-reminder-default-minutes'] = '45'
      expect(reminderService.getDefaultReminderMinutes()).toBe(15)
    })
  })

  describe('isNotificationSupported', () => {
    it('returns false when Notification is not available', () => {
      vi.stubGlobal('Notification', undefined)
      vi.stubGlobal('navigator', { serviceWorker: {} })
      expect(reminderService.isNotificationSupported()).toBe(false)
    })

    it('returns true when Notification and serviceWorker are available', () => {
      vi.stubGlobal('Notification', { permission: 'default' })
      vi.stubGlobal('navigator', { serviceWorker: {} })
      expect(reminderService.isNotificationSupported()).toBe(true)
    })
  })

  describe('getNotificationPermission', () => {
    it('returns denied when Notification is not available', () => {
      vi.stubGlobal('Notification', undefined)
      expect(reminderService.getNotificationPermission()).toBe('denied')
    })

    it('returns current permission', () => {
      vi.stubGlobal('Notification', { permission: 'granted' })
      expect(reminderService.getNotificationPermission()).toBe('granted')
    })
  })

  describe('localStorage error handling', () => {
    it('returns empty state when localStorage has invalid JSON', () => {
      store['oeo-session-reminders'] = 'not-json'
      expect(reminderService.getAllReminders()).toEqual([])
    })
  })
})
