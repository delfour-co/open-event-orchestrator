// Domain
export {
  NOTIFICATION_TYPES,
  createNotificationSchema,
  formatNotificationDate,
  getNotificationTypeColor,
  getNotificationTypeIcon,
  getNotificationTypeLabel,
  isDeleted,
  isUnread,
  notificationSchema,
  notificationTypeSchema,
  updateNotificationSchema,
  type CreateNotification,
  type Notification,
  type NotificationType,
  type UpdateNotification
} from './domain'

// UI Components
export {
  NotificationBell,
  NotificationDropdown,
  NotificationFilters,
  NotificationItem,
  NotificationList
} from './ui'

// NOTE: Infrastructure and Services are server-only
// Import from '$lib/features/notifications/infra' or '$lib/features/notifications/services' directly in server code
