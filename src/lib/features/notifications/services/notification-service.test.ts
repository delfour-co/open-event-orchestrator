import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Notification } from '../domain'
import type { NotificationRepository } from '../infra'
import { createNotificationService } from './notification-service'

describe('NotificationService', () => {
  const mockUserId = 'user-123'
  const now = new Date()

  const mockNotification: Notification = {
    id: 'notif-1',
    userId: mockUserId,
    type: 'system',
    title: 'Test Notification',
    message: 'Test message',
    isRead: false,
    link: null,
    metadata: null,
    deletedAt: null,
    createdAt: now,
    updatedAt: now
  }

  let mockRepository: NotificationRepository
  let service: ReturnType<typeof createNotificationService>

  beforeEach(() => {
    mockRepository = {
      findById: vi.fn(),
      findByUser: vi.fn(),
      findRecentByUser: vi.fn(),
      countByUser: vi.fn(),
      getUnreadCount: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      markAsRead: vi.fn(),
      markAllAsRead: vi.fn(),
      softDelete: vi.fn(),
      softDeleteOlderThan: vi.fn(),
      permanentlyDelete: vi.fn(),
      cleanupDeleted: vi.fn()
    }

    service = createNotificationService(mockRepository)
  })

  describe('getSummary', () => {
    it('should return unread count and recent notifications', async () => {
      vi.mocked(mockRepository.getUnreadCount).mockResolvedValue(5)
      vi.mocked(mockRepository.findRecentByUser).mockResolvedValue([mockNotification])

      const result = await service.getSummary(mockUserId)

      expect(result.unreadCount).toBe(5)
      expect(result.recentNotifications).toHaveLength(1)
      expect(mockRepository.getUnreadCount).toHaveBeenCalledWith(mockUserId)
      expect(mockRepository.findRecentByUser).toHaveBeenCalledWith(mockUserId, 10)
    })
  })

  describe('getNotifications', () => {
    it('should return paginated notifications', async () => {
      vi.mocked(mockRepository.findByUser).mockResolvedValue({
        items: [mockNotification],
        totalItems: 1,
        totalPages: 1
      })

      const result = await service.getNotifications(mockUserId, { page: 1, perPage: 20 })

      expect(result.items).toHaveLength(1)
      expect(result.totalItems).toBe(1)
      expect(result.currentPage).toBe(1)
      expect(result.hasMore).toBe(false)
    })

    it('should indicate hasMore when there are more pages', async () => {
      vi.mocked(mockRepository.findByUser).mockResolvedValue({
        items: [mockNotification],
        totalItems: 50,
        totalPages: 3
      })

      const result = await service.getNotifications(mockUserId, { page: 1, perPage: 20 })

      expect(result.hasMore).toBe(true)
    })
  })

  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      vi.mocked(mockRepository.getUnreadCount).mockResolvedValue(7)

      const result = await service.getUnreadCount(mockUserId)

      expect(result).toBe(7)
    })
  })

  describe('getStats', () => {
    it('should return notification statistics', async () => {
      vi.mocked(mockRepository.countByUser).mockResolvedValue({
        total: 10,
        unread: 3,
        byType: { system: 5, alert: 2, reminder: 2, action: 1 }
      })

      const result = await service.getStats(mockUserId)

      expect(result.total).toBe(10)
      expect(result.unread).toBe(3)
      expect(result.byType.system).toBe(5)
    })
  })

  describe('createNotification', () => {
    it('should create a notification', async () => {
      vi.mocked(mockRepository.create).mockResolvedValue(mockNotification)

      const result = await service.createNotification({
        userId: mockUserId,
        type: 'system',
        title: 'Test',
        message: 'Test message'
      })

      expect(result.id).toBe('notif-1')
      expect(mockRepository.create).toHaveBeenCalled()
    })
  })

  describe('createSystemNotification', () => {
    it('should create a system notification', async () => {
      vi.mocked(mockRepository.create).mockResolvedValue(mockNotification)

      await service.createSystemNotification(mockUserId, 'Title', 'Message', '/link')

      expect(mockRepository.create).toHaveBeenCalledWith({
        userId: mockUserId,
        type: 'system',
        title: 'Title',
        message: 'Message',
        link: '/link'
      })
    })
  })

  describe('createAlertNotification', () => {
    it('should create an alert notification with metadata', async () => {
      vi.mocked(mockRepository.create).mockResolvedValue({
        ...mockNotification,
        type: 'alert'
      })

      await service.createAlertNotification(
        mockUserId,
        'Alert Title',
        'Alert Message',
        '/alert-link',
        { severity: 'high' }
      )

      expect(mockRepository.create).toHaveBeenCalledWith({
        userId: mockUserId,
        type: 'alert',
        title: 'Alert Title',
        message: 'Alert Message',
        link: '/alert-link',
        metadata: { severity: 'high' }
      })
    })
  })

  describe('createReminderNotification', () => {
    it('should create a reminder notification', async () => {
      vi.mocked(mockRepository.create).mockResolvedValue({
        ...mockNotification,
        type: 'reminder'
      })

      await service.createReminderNotification(mockUserId, 'Reminder', 'Remember this')

      expect(mockRepository.create).toHaveBeenCalledWith({
        userId: mockUserId,
        type: 'reminder',
        title: 'Reminder',
        message: 'Remember this',
        link: undefined
      })
    })
  })

  describe('createActionNotification', () => {
    it('should create an action notification', async () => {
      vi.mocked(mockRepository.create).mockResolvedValue({
        ...mockNotification,
        type: 'action'
      })

      await service.createActionNotification(mockUserId, 'Action Needed', 'Please review')

      expect(mockRepository.create).toHaveBeenCalledWith({
        userId: mockUserId,
        type: 'action',
        title: 'Action Needed',
        message: 'Please review',
        link: undefined,
        metadata: undefined
      })
    })
  })

  describe('markAsRead', () => {
    it('should mark a notification as read', async () => {
      vi.mocked(mockRepository.markAsRead).mockResolvedValue({
        ...mockNotification,
        isRead: true
      })

      const result = await service.markAsRead('notif-1')

      expect(result.isRead).toBe(true)
      expect(mockRepository.markAsRead).toHaveBeenCalledWith('notif-1')
    })
  })

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      vi.mocked(mockRepository.markAllAsRead).mockResolvedValue(5)

      const result = await service.markAllAsRead(mockUserId)

      expect(result).toBe(5)
      expect(mockRepository.markAllAsRead).toHaveBeenCalledWith(mockUserId)
    })
  })

  describe('deleteNotification', () => {
    it('should soft delete a notification', async () => {
      vi.mocked(mockRepository.softDelete).mockResolvedValue({
        ...mockNotification,
        deletedAt: new Date()
      })

      const result = await service.deleteNotification('notif-1')

      expect(result.deletedAt).not.toBeNull()
      expect(mockRepository.softDelete).toHaveBeenCalledWith('notif-1')
    })
  })

  describe('notifyUsers', () => {
    it('should create notifications for multiple users', async () => {
      const userIds = ['user-1', 'user-2', 'user-3']
      vi.mocked(mockRepository.createMany).mockResolvedValue([
        { ...mockNotification, id: 'notif-1', userId: 'user-1' },
        { ...mockNotification, id: 'notif-2', userId: 'user-2' },
        { ...mockNotification, id: 'notif-3', userId: 'user-3' }
      ])

      const result = await service.notifyUsers(userIds, 'system', 'Title', 'Message', '/link')

      expect(result).toHaveLength(3)
      expect(mockRepository.createMany).toHaveBeenCalledWith([
        { userId: 'user-1', type: 'system', title: 'Title', message: 'Message', link: '/link' },
        { userId: 'user-2', type: 'system', title: 'Title', message: 'Message', link: '/link' },
        { userId: 'user-3', type: 'system', title: 'Title', message: 'Message', link: '/link' }
      ])
    })
  })

  describe('cleanup', () => {
    it('should cleanup deleted notifications', async () => {
      vi.mocked(mockRepository.cleanupDeleted).mockResolvedValue(10)

      const result = await service.cleanup()

      expect(result).toBe(10)
      expect(mockRepository.cleanupDeleted).toHaveBeenCalledWith(30)
    })
  })

  describe('with custom config', () => {
    it('should use custom config values', async () => {
      const customService = createNotificationService(mockRepository, {
        maxRecentNotifications: 5,
        permanentDeleteAfterDays: 60
      })

      vi.mocked(mockRepository.getUnreadCount).mockResolvedValue(0)
      vi.mocked(mockRepository.findRecentByUser).mockResolvedValue([])
      vi.mocked(mockRepository.cleanupDeleted).mockResolvedValue(0)

      await customService.getSummary(mockUserId)
      expect(mockRepository.findRecentByUser).toHaveBeenCalledWith(mockUserId, 5)

      await customService.cleanup()
      expect(mockRepository.cleanupDeleted).toHaveBeenCalledWith(60)
    })
  })
})
