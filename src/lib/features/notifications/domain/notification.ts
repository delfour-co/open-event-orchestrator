import { z } from 'zod'

export const NOTIFICATION_TYPES = ['system', 'alert', 'reminder', 'action'] as const

export const notificationTypeSchema = z.enum(NOTIFICATION_TYPES)

export type NotificationType = z.infer<typeof notificationTypeSchema>

export const notificationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: notificationTypeSchema,
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  isRead: z.boolean().default(false),
  link: z.string().url().optional().nullable(),
  metadata: z.record(z.unknown()).optional().nullable(),
  deletedAt: z.date().optional().nullable(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type Notification = z.infer<typeof notificationSchema>

export const createNotificationSchema = notificationSchema.omit({
  id: true,
  isRead: true,
  deletedAt: true,
  createdAt: true,
  updatedAt: true
})

export type CreateNotification = z.infer<typeof createNotificationSchema>

export const updateNotificationSchema = notificationSchema.partial().pick({
  isRead: true,
  deletedAt: true
})

export type UpdateNotification = z.infer<typeof updateNotificationSchema>

export const getNotificationTypeLabel = (type: NotificationType): string => {
  const labels: Record<NotificationType, string> = {
    system: 'System',
    alert: 'Alert',
    reminder: 'Reminder',
    action: 'Action Required'
  }
  return labels[type]
}

export const getNotificationTypeColor = (type: NotificationType): string => {
  const colors: Record<NotificationType, string> = {
    system: 'blue',
    alert: 'red',
    reminder: 'yellow',
    action: 'purple'
  }
  return colors[type]
}

export const getNotificationTypeIcon = (type: NotificationType): string => {
  const icons: Record<NotificationType, string> = {
    system: 'info',
    alert: 'alert-circle',
    reminder: 'clock',
    action: 'alert-triangle'
  }
  return icons[type]
}

export const isUnread = (notification: Notification): boolean => {
  return !notification.isRead
}

export const isDeleted = (notification: Notification): boolean => {
  return notification.deletedAt !== null && notification.deletedAt !== undefined
}

export const formatNotificationDate = (date: Date): string => {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMinutes < 1) {
    return 'Just now'
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`
  }
  if (diffHours < 24) {
    return `${diffHours}h ago`
  }
  if (diffDays < 7) {
    return `${diffDays}d ago`
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}
