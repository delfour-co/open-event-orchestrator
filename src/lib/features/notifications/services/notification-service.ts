import type { CreateNotification, Notification, NotificationType } from '../domain'
import type { NotificationListOptions, NotificationRepository } from '../infra'

export interface NotificationServiceConfig {
  maxRecentNotifications?: number
  softDeleteAfterDays?: number
  permanentDeleteAfterDays?: number
}

const DEFAULT_CONFIG: Required<NotificationServiceConfig> = {
  maxRecentNotifications: 10,
  softDeleteAfterDays: 90,
  permanentDeleteAfterDays: 30
}

export interface NotificationSummary {
  unreadCount: number
  recentNotifications: Notification[]
}

export interface PaginatedNotifications {
  items: Notification[]
  totalItems: number
  totalPages: number
  currentPage: number
  hasMore: boolean
}

export const createNotificationService = (
  repository: NotificationRepository,
  config: NotificationServiceConfig = {}
) => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }

  return {
    /**
     * Get notification summary for header display (unread count + recent items)
     */
    async getSummary(userId: string): Promise<NotificationSummary> {
      const [unreadCount, recentNotifications] = await Promise.all([
        repository.getUnreadCount(userId),
        repository.findRecentByUser(userId, finalConfig.maxRecentNotifications)
      ])

      return {
        unreadCount,
        recentNotifications
      }
    },

    /**
     * Get paginated notifications for the full notifications page
     */
    async getNotifications(
      userId: string,
      options: NotificationListOptions & { page?: number; perPage?: number } = {}
    ): Promise<PaginatedNotifications> {
      const page = options.page ?? 1
      const perPage = options.perPage ?? 20

      const result = await repository.findByUser(userId, {
        ...options,
        page,
        perPage
      })

      return {
        items: result.items,
        totalItems: result.totalItems,
        totalPages: result.totalPages,
        currentPage: page,
        hasMore: page < result.totalPages
      }
    },

    /**
     * Get a single notification by ID
     */
    async getNotification(id: string): Promise<Notification | null> {
      return repository.findById(id)
    },

    /**
     * Get unread count for badge display
     */
    async getUnreadCount(userId: string): Promise<number> {
      return repository.getUnreadCount(userId)
    },

    /**
     * Get notification statistics for a user
     */
    async getStats(userId: string): Promise<{
      total: number
      unread: number
      byType: Record<NotificationType, number>
    }> {
      return repository.countByUser(userId)
    },

    /**
     * Create a new notification
     */
    async createNotification(data: CreateNotification): Promise<Notification> {
      return repository.create(data)
    },

    /**
     * Create multiple notifications (e.g., for batch operations)
     */
    async createNotifications(data: CreateNotification[]): Promise<Notification[]> {
      return repository.createMany(data)
    },

    /**
     * Create a system notification
     */
    async createSystemNotification(
      userId: string,
      title: string,
      message: string,
      link?: string
    ): Promise<Notification> {
      return repository.create({
        userId,
        type: 'system',
        title,
        message,
        link
      })
    },

    /**
     * Create an alert notification
     */
    async createAlertNotification(
      userId: string,
      title: string,
      message: string,
      link?: string,
      metadata?: Record<string, unknown>
    ): Promise<Notification> {
      return repository.create({
        userId,
        type: 'alert',
        title,
        message,
        link,
        metadata
      })
    },

    /**
     * Create a reminder notification
     */
    async createReminderNotification(
      userId: string,
      title: string,
      message: string,
      link?: string
    ): Promise<Notification> {
      return repository.create({
        userId,
        type: 'reminder',
        title,
        message,
        link
      })
    },

    /**
     * Create an action required notification
     */
    async createActionNotification(
      userId: string,
      title: string,
      message: string,
      link?: string,
      metadata?: Record<string, unknown>
    ): Promise<Notification> {
      return repository.create({
        userId,
        type: 'action',
        title,
        message,
        link,
        metadata
      })
    },

    /**
     * Mark a notification as read
     */
    async markAsRead(id: string): Promise<Notification> {
      return repository.markAsRead(id)
    },

    /**
     * Mark all notifications as read for a user
     */
    async markAllAsRead(userId: string): Promise<number> {
      return repository.markAllAsRead(userId)
    },

    /**
     * Soft delete a notification
     */
    async deleteNotification(id: string): Promise<Notification> {
      return repository.softDelete(id)
    },

    /**
     * Delete old notifications (soft delete)
     */
    async deleteOldNotifications(userId: string): Promise<number> {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - finalConfig.softDeleteAfterDays)
      return repository.softDeleteOlderThan(userId, cutoffDate)
    },

    /**
     * Cleanup permanently deleted notifications
     */
    async cleanup(): Promise<number> {
      return repository.cleanupDeleted(finalConfig.permanentDeleteAfterDays)
    },

    /**
     * Notify multiple users at once
     */
    async notifyUsers(
      userIds: string[],
      type: NotificationType,
      title: string,
      message: string,
      link?: string
    ): Promise<Notification[]> {
      const notifications = userIds.map((userId) => ({
        userId,
        type,
        title,
        message,
        link
      }))
      return repository.createMany(notifications)
    }
  }
}

export type NotificationService = ReturnType<typeof createNotificationService>
