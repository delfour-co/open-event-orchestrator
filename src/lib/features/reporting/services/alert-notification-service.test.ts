import { describe, expect, it, vi } from 'vitest'
import type { Alert } from '../domain/alert'
import {
  type AlertEmailData,
  type AlertNotificationConfig,
  createAlertNotificationService,
  generateAlertEmailHtml,
  generateAlertEmailText
} from './alert-notification-service'

describe('alert-notification-service', () => {
  const config: AlertNotificationConfig = {
    appName: 'Event Orchestrator',
    appUrl: 'https://app.example.com'
  }

  const createAlert = (overrides: Partial<Alert> = {}): Alert => ({
    id: 'alert-1',
    editionId: 'edition-1',
    thresholdId: 'threshold-1',
    title: 'Low Ticket Sales',
    message: 'Current value (50) is < threshold (100)',
    level: 'warning',
    metricSource: 'billing_sales',
    currentValue: 50,
    thresholdValue: 100,
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  })

  const createEmailData = (overrides: Partial<AlertEmailData> = {}): AlertEmailData => ({
    recipientName: 'John Doe',
    alert: createAlert(),
    editionName: 'Tech Conference 2025',
    dashboardUrl: 'https://app.example.com/admin/reporting/tech-conf-2025',
    ...overrides
  })

  describe('generateAlertEmailHtml', () => {
    it('should generate HTML with alert details', () => {
      const data = createEmailData()
      const html = generateAlertEmailHtml(data, config)

      expect(html).toContain('Low Ticket Sales')
      expect(html).toContain('Tech Conference 2025')
      expect(html).toContain('50')
      expect(html).toContain('100')
      expect(html).toContain('WARNING')
      expect(html).toContain('View Dashboard')
    })

    it('should use correct color for warning level', () => {
      const data = createEmailData({
        alert: createAlert({ level: 'warning' })
      })
      const html = generateAlertEmailHtml(data, config)

      expect(html).toContain('#f59e0b')
    })

    it('should use correct color for critical level', () => {
      const data = createEmailData({
        alert: createAlert({ level: 'critical' })
      })
      const html = generateAlertEmailHtml(data, config)

      expect(html).toContain('#ef4444')
    })

    it('should use correct color for info level', () => {
      const data = createEmailData({
        alert: createAlert({ level: 'info' })
      })
      const html = generateAlertEmailHtml(data, config)

      expect(html).toContain('#3b82f6')
    })

    it('should include dashboard URL', () => {
      const data = createEmailData()
      const html = generateAlertEmailHtml(data, config)

      expect(html).toContain(data.dashboardUrl)
    })
  })

  describe('generateAlertEmailText', () => {
    it('should generate plain text with alert details', () => {
      const data = createEmailData()
      const text = generateAlertEmailText(data, config)

      expect(text).toContain('Low Ticket Sales')
      expect(text).toContain('Tech Conference 2025')
      expect(text).toContain('Current Value: 50')
      expect(text).toContain('Threshold: 100')
      expect(text).toContain('[WARNING]')
    })

    it('should include dashboard URL', () => {
      const data = createEmailData()
      const text = generateAlertEmailText(data, config)

      expect(text).toContain(data.dashboardUrl)
    })

    it('should include app name', () => {
      const data = createEmailData()
      const text = generateAlertEmailText(data, config)

      expect(text).toContain(config.appName)
    })
  })

  describe('createAlertNotificationService', () => {
    const createMockEmailService = () => ({
      send: vi.fn().mockResolvedValue({ success: true })
    })

    describe('sendEmailNotification', () => {
      it('should send emails to all recipients', async () => {
        const emailService = createMockEmailService()
        const service = createAlertNotificationService(emailService, config)
        const data = createEmailData()

        const result = await service.sendEmailNotification(
          ['user1@example.com', 'user2@example.com'],
          data
        )

        expect(emailService.send).toHaveBeenCalledTimes(2)
        expect(result.success).toBe(true)
        expect(result.failedRecipients).toHaveLength(0)
      })

      it('should track failed recipients', async () => {
        const emailService = {
          send: vi
            .fn()
            .mockResolvedValueOnce({ success: true })
            .mockResolvedValueOnce({ success: false, error: 'SMTP error' })
        }
        const service = createAlertNotificationService(emailService, config)
        const data = createEmailData()

        const result = await service.sendEmailNotification(
          ['user1@example.com', 'user2@example.com'],
          data
        )

        expect(result.success).toBe(false)
        expect(result.failedRecipients).toEqual(['user2@example.com'])
      })

      it('should include alert level in subject', async () => {
        const emailService = createMockEmailService()
        const service = createAlertNotificationService(emailService, config)
        const data = createEmailData({
          alert: createAlert({ level: 'critical' })
        })

        await service.sendEmailNotification(['user@example.com'], data)

        expect(emailService.send).toHaveBeenCalledWith(
          expect.objectContaining({
            subject: expect.stringContaining('Critical')
          })
        )
      })
    })

    describe('in-app notifications', () => {
      it('should create in-app notification', () => {
        const emailService = createMockEmailService()
        const service = createAlertNotificationService(emailService, config)
        const alert = createAlert()

        const notification = service.createInAppNotification('user-1', alert)

        expect(notification.alertId).toBe(alert.id)
        expect(notification.title).toBe(alert.title)
        expect(notification.level).toBe(alert.level)
        expect(notification.read).toBe(false)
      })

      it('should get notifications for user', () => {
        const emailService = createMockEmailService()
        const service = createAlertNotificationService(emailService, config)

        service.createInAppNotification('user-1', createAlert({ id: 'a1' }))
        service.createInAppNotification('user-1', createAlert({ id: 'a2' }))
        service.createInAppNotification('user-2', createAlert({ id: 'a3' }))

        const user1Notifications = service.getInAppNotifications('user-1')
        const user2Notifications = service.getInAppNotifications('user-2')

        expect(user1Notifications).toHaveLength(2)
        expect(user2Notifications).toHaveLength(1)
      })

      it('should filter unread notifications', () => {
        const emailService = createMockEmailService()
        const service = createAlertNotificationService(emailService, config)

        const notif1 = service.createInAppNotification('user-1', createAlert({ id: 'a1' }))
        service.createInAppNotification('user-1', createAlert({ id: 'a2' }))

        service.markAsRead('user-1', notif1.id)

        const unreadOnly = service.getInAppNotifications('user-1', { unreadOnly: true })
        expect(unreadOnly).toHaveLength(1)
      })

      it('should limit notifications', () => {
        const emailService = createMockEmailService()
        const service = createAlertNotificationService(emailService, config)

        for (let i = 0; i < 10; i++) {
          service.createInAppNotification('user-1', createAlert({ id: `a${i}` }))
        }

        const limited = service.getInAppNotifications('user-1', { limit: 5 })
        expect(limited).toHaveLength(5)
      })

      it('should mark notification as read', () => {
        const emailService = createMockEmailService()
        const service = createAlertNotificationService(emailService, config)

        const notification = service.createInAppNotification('user-1', createAlert())
        expect(service.getUnreadCount('user-1')).toBe(1)

        const success = service.markAsRead('user-1', notification.id)
        expect(success).toBe(true)
        expect(service.getUnreadCount('user-1')).toBe(0)
      })

      it('should mark all notifications as read', () => {
        const emailService = createMockEmailService()
        const service = createAlertNotificationService(emailService, config)

        for (let i = 0; i < 5; i++) {
          service.createInAppNotification('user-1', createAlert({ id: `a${i}` }))
        }

        expect(service.getUnreadCount('user-1')).toBe(5)

        const count = service.markAllAsRead('user-1')
        expect(count).toBe(5)
        expect(service.getUnreadCount('user-1')).toBe(0)
      })

      it('should return false when marking non-existent notification', () => {
        const emailService = createMockEmailService()
        const service = createAlertNotificationService(emailService, config)

        const success = service.markAsRead('user-1', 'non-existent')
        expect(success).toBe(false)
      })

      it('should clear all notifications for user', () => {
        const emailService = createMockEmailService()
        const service = createAlertNotificationService(emailService, config)

        service.createInAppNotification('user-1', createAlert())
        service.createInAppNotification('user-1', createAlert())

        service.clearNotifications('user-1')

        expect(service.getInAppNotifications('user-1')).toHaveLength(0)
      })

      it('should get unread count', () => {
        const emailService = createMockEmailService()
        const service = createAlertNotificationService(emailService, config)

        service.createInAppNotification('user-1', createAlert({ id: 'a1' }))
        service.createInAppNotification('user-1', createAlert({ id: 'a2' }))
        service.createInAppNotification('user-1', createAlert({ id: 'a3' }))

        expect(service.getUnreadCount('user-1')).toBe(3)
        expect(service.getUnreadCount('user-2')).toBe(0)
      })
    })
  })
})
