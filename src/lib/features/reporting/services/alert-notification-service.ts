import type { EmailService } from '../../cfp/services/email-service'
import type { Alert } from '../domain/alert'
import {
  getAlertLevelColor,
  getAlertLevelLabel,
  getMetricSourceLabel
} from '../domain/alert-threshold'

export type AlertNotificationConfig = {
  appName: string
  appUrl: string
}

export type InAppNotification = {
  id: string
  alertId: string
  title: string
  message: string
  level: string
  read: boolean
  createdAt: Date
}

export type AlertEmailData = {
  recipientName: string
  alert: Alert
  editionName: string
  dashboardUrl: string
}

/**
 * Generate HTML email content for an alert notification
 */
export const generateAlertEmailHtml = (
  data: AlertEmailData,
  config: AlertNotificationConfig
): string => {
  const levelColor = getLevelColorHex(data.alert.level)
  const levelLabel = getAlertLevelLabel(data.alert.level)
  const sourceLabel = getMetricSourceLabel(data.alert.metricSource)

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Alert: ${data.alert.title}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="border-left: 4px solid ${levelColor}; padding-left: 16px; margin-bottom: 20px;">
    <span style="background: ${levelColor}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">
      ${levelLabel.toUpperCase()}
    </span>
    <h1 style="color: ${levelColor}; margin: 16px 0 8px 0;">${data.alert.title}</h1>
    <p style="color: #666; margin: 0;">${sourceLabel} - ${data.editionName}</p>
  </div>

  <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
    <p style="margin: 0;"><strong>Current Value:</strong> ${data.alert.currentValue}</p>
    <p style="margin: 8px 0 0 0;"><strong>Threshold:</strong> ${data.alert.thresholdValue}</p>
  </div>

  <p>${data.alert.message}</p>

  <p>
    <a href="${data.dashboardUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
      View Dashboard
    </a>
  </p>

  <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">

  <p style="color: #666; font-size: 12px;">
    This alert was triggered by ${config.appName}.<br>
    You can manage your alert settings in the <a href="${data.dashboardUrl}/alerts">dashboard</a>.
  </p>
</body>
</html>`
}

/**
 * Generate plain text email content for an alert notification
 */
export const generateAlertEmailText = (
  data: AlertEmailData,
  config: AlertNotificationConfig
): string => {
  const levelLabel = getAlertLevelLabel(data.alert.level)
  const sourceLabel = getMetricSourceLabel(data.alert.metricSource)

  return `
[${levelLabel.toUpperCase()}] ${data.alert.title}

${sourceLabel} - ${data.editionName}

Current Value: ${data.alert.currentValue}
Threshold: ${data.alert.thresholdValue}

${data.alert.message}

View Dashboard: ${data.dashboardUrl}

---
This alert was triggered by ${config.appName}.
You can manage your alert settings in the dashboard: ${data.dashboardUrl}/alerts
`.trim()
}

const getLevelColorHex = (level: string): string => {
  const colors: Record<string, string> = {
    info: '#3b82f6',
    warning: '#f59e0b',
    critical: '#ef4444'
  }
  return colors[level] || '#6b7280'
}

/**
 * Create the alert notification service
 */
export const createAlertNotificationService = (
  emailService: EmailService,
  config: AlertNotificationConfig
) => {
  // In-memory store for in-app notifications (would be persisted in production)
  const inAppNotifications: Map<string, InAppNotification[]> = new Map()

  return {
    /**
     * Send email notification for an alert
     */
    async sendEmailNotification(
      recipients: string[],
      data: AlertEmailData
    ): Promise<{ success: boolean; failedRecipients: string[] }> {
      const failedRecipients: string[] = []

      for (const recipient of recipients) {
        const result = await emailService.send({
          to: recipient,
          subject: `[${getAlertLevelLabel(data.alert.level)}] ${data.alert.title} - ${data.editionName}`,
          html: generateAlertEmailHtml(data, config),
          text: generateAlertEmailText(data, config)
        })

        if (!result.success) {
          failedRecipients.push(recipient)
        }
      }

      return {
        success: failedRecipients.length === 0,
        failedRecipients
      }
    },

    /**
     * Create in-app notification for an alert
     */
    createInAppNotification(userId: string, alert: Alert): InAppNotification {
      const notification: InAppNotification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        alertId: alert.id,
        title: alert.title,
        message: alert.message,
        level: alert.level,
        read: false,
        createdAt: new Date()
      }

      const userNotifications = inAppNotifications.get(userId) || []
      userNotifications.unshift(notification)
      inAppNotifications.set(userId, userNotifications)

      return notification
    },

    /**
     * Get in-app notifications for a user
     */
    getInAppNotifications(
      userId: string,
      options?: { unreadOnly?: boolean; limit?: number }
    ): InAppNotification[] {
      let notifications = inAppNotifications.get(userId) || []

      if (options?.unreadOnly) {
        notifications = notifications.filter((n) => !n.read)
      }

      if (options?.limit) {
        notifications = notifications.slice(0, options.limit)
      }

      return notifications
    },

    /**
     * Mark notification as read
     */
    markAsRead(userId: string, notificationId: string): boolean {
      const notifications = inAppNotifications.get(userId)
      if (!notifications) return false

      const notification = notifications.find((n) => n.id === notificationId)
      if (!notification) return false

      notification.read = true
      return true
    },

    /**
     * Mark all notifications as read for a user
     */
    markAllAsRead(userId: string): number {
      const notifications = inAppNotifications.get(userId)
      if (!notifications) return 0

      let count = 0
      for (const notification of notifications) {
        if (!notification.read) {
          notification.read = true
          count++
        }
      }

      return count
    },

    /**
     * Get unread notification count for a user
     */
    getUnreadCount(userId: string): number {
      const notifications = inAppNotifications.get(userId) || []
      return notifications.filter((n) => !n.read).length
    },

    /**
     * Clear all notifications for a user
     */
    clearNotifications(userId: string): void {
      inAppNotifications.delete(userId)
    }
  }
}

export type AlertNotificationService = ReturnType<typeof createAlertNotificationService>
