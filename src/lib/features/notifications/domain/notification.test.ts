import { describe, expect, it } from 'vitest'
import {
  createNotificationSchema,
  formatNotificationDate,
  getNotificationTypeColor,
  getNotificationTypeIcon,
  getNotificationTypeLabel,
  isDeleted,
  isUnread,
  notificationSchema,
  notificationTypeSchema
} from './notification'

describe('Notification', () => {
  const now = new Date()

  const validNotification = {
    id: 'notif-123',
    userId: 'user-456',
    type: 'system' as const,
    title: 'Test Notification',
    message: 'This is a test notification message',
    isRead: false,
    link: 'https://example.com/link',
    metadata: { key: 'value' },
    deletedAt: null,
    createdAt: now,
    updatedAt: now
  }

  describe('notificationSchema', () => {
    it('should validate a valid notification', () => {
      const result = notificationSchema.safeParse(validNotification)
      expect(result.success).toBe(true)
    })

    it('should validate notification without optional fields', () => {
      const minimal = {
        id: 'notif-123',
        userId: 'user-456',
        type: 'alert',
        title: 'Alert',
        message: 'Alert message',
        isRead: true,
        createdAt: now,
        updatedAt: now
      }
      const result = notificationSchema.safeParse(minimal)
      expect(result.success).toBe(true)
    })

    it('should reject empty title', () => {
      const result = notificationSchema.safeParse({ ...validNotification, title: '' })
      expect(result.success).toBe(false)
    })

    it('should reject empty message', () => {
      const result = notificationSchema.safeParse({ ...validNotification, message: '' })
      expect(result.success).toBe(false)
    })

    it('should reject invalid link URL', () => {
      const result = notificationSchema.safeParse({ ...validNotification, link: 'not-a-url' })
      expect(result.success).toBe(false)
    })

    it('should accept null link', () => {
      const result = notificationSchema.safeParse({ ...validNotification, link: null })
      expect(result.success).toBe(true)
    })
  })

  describe('notificationTypeSchema', () => {
    it('should accept all valid types', () => {
      const types = ['system', 'alert', 'reminder', 'action']
      for (const type of types) {
        const result = notificationTypeSchema.safeParse(type)
        expect(result.success).toBe(true)
      }
    })

    it('should reject invalid type', () => {
      const result = notificationTypeSchema.safeParse('invalid')
      expect(result.success).toBe(false)
    })
  })

  describe('createNotificationSchema', () => {
    it('should validate notification creation data', () => {
      const createData = {
        userId: 'user-456',
        type: 'reminder',
        title: 'Reminder',
        message: 'Remember this'
      }
      const result = createNotificationSchema.safeParse(createData)
      expect(result.success).toBe(true)
    })

    it('should accept optional metadata', () => {
      const createData = {
        userId: 'user-456',
        type: 'action',
        title: 'Action Required',
        message: 'Please take action',
        metadata: { taskId: '123' }
      }
      const result = createNotificationSchema.safeParse(createData)
      expect(result.success).toBe(true)
    })
  })

  describe('helper functions', () => {
    describe('getNotificationTypeLabel', () => {
      it('should return correct label for system', () => {
        expect(getNotificationTypeLabel('system')).toBe('System')
      })

      it('should return correct label for alert', () => {
        expect(getNotificationTypeLabel('alert')).toBe('Alert')
      })

      it('should return correct label for reminder', () => {
        expect(getNotificationTypeLabel('reminder')).toBe('Reminder')
      })

      it('should return correct label for action', () => {
        expect(getNotificationTypeLabel('action')).toBe('Action Required')
      })
    })

    describe('getNotificationTypeColor', () => {
      it('should return blue for system', () => {
        expect(getNotificationTypeColor('system')).toBe('blue')
      })

      it('should return red for alert', () => {
        expect(getNotificationTypeColor('alert')).toBe('red')
      })

      it('should return yellow for reminder', () => {
        expect(getNotificationTypeColor('reminder')).toBe('yellow')
      })

      it('should return purple for action', () => {
        expect(getNotificationTypeColor('action')).toBe('purple')
      })
    })

    describe('getNotificationTypeIcon', () => {
      it('should return correct icon for each type', () => {
        expect(getNotificationTypeIcon('system')).toBe('info')
        expect(getNotificationTypeIcon('alert')).toBe('alert-circle')
        expect(getNotificationTypeIcon('reminder')).toBe('clock')
        expect(getNotificationTypeIcon('action')).toBe('alert-triangle')
      })
    })

    describe('isUnread', () => {
      it('should return true for unread notification', () => {
        expect(isUnread({ ...validNotification, isRead: false })).toBe(true)
      })

      it('should return false for read notification', () => {
        expect(isUnread({ ...validNotification, isRead: true })).toBe(false)
      })
    })

    describe('isDeleted', () => {
      it('should return true for deleted notification', () => {
        expect(isDeleted({ ...validNotification, deletedAt: new Date() })).toBe(true)
      })

      it('should return false for non-deleted notification', () => {
        expect(isDeleted({ ...validNotification, deletedAt: null })).toBe(false)
      })

      it('should return false for undefined deletedAt', () => {
        expect(isDeleted({ ...validNotification, deletedAt: undefined })).toBe(false)
      })
    })

    describe('formatNotificationDate', () => {
      it('should return "Just now" for very recent dates', () => {
        const date = new Date()
        expect(formatNotificationDate(date)).toBe('Just now')
      })

      it('should return minutes ago for recent dates', () => {
        const date = new Date(Date.now() - 5 * 60 * 1000)
        expect(formatNotificationDate(date)).toBe('5m ago')
      })

      it('should return hours ago for dates within a day', () => {
        const date = new Date(Date.now() - 3 * 60 * 60 * 1000)
        expect(formatNotificationDate(date)).toBe('3h ago')
      })

      it('should return days ago for dates within a week', () => {
        const date = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        expect(formatNotificationDate(date)).toBe('2d ago')
      })

      it('should return formatted date for older dates', () => {
        const date = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
        const result = formatNotificationDate(date)
        expect(result).toMatch(/^[A-Z][a-z]{2} \d{1,2}$/)
      })
    })
  })
})
