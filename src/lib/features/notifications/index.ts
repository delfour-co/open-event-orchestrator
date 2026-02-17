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

// Infrastructure
export {
  createNotificationRepository,
  type NotificationCountResult,
  type NotificationListOptions,
  type NotificationRepository
} from './infra'

// Services
export {
  createNotificationService,
  type NotificationService,
  type NotificationServiceConfig,
  type NotificationSummary,
  type PaginatedNotifications
} from './services'

// UI Components
export {
  NotificationBell,
  NotificationDropdown,
  NotificationFilters,
  NotificationItem,
  NotificationList
} from './ui'
