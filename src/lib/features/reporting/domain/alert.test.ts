import { describe, expect, it } from 'vitest'
import {
  alertSchema,
  alertStatusSchema,
  canAcknowledgeAlert,
  canDismissAlert,
  canResolveAlert,
  createAlertSchema,
  formatAlertMessage,
  getAlertStatusColor,
  getAlertStatusLabel,
  isAlertActionable
} from './alert'

describe('alert domain', () => {
  describe('schemas', () => {
    it('should validate alert statuses', () => {
      expect(alertStatusSchema.parse('active')).toBe('active')
      expect(alertStatusSchema.parse('acknowledged')).toBe('acknowledged')
      expect(alertStatusSchema.parse('resolved')).toBe('resolved')
      expect(alertStatusSchema.parse('dismissed')).toBe('dismissed')
      expect(() => alertStatusSchema.parse('invalid')).toThrow()
    })

    it('should validate a complete alert', () => {
      const alert = {
        id: 'alert-1',
        editionId: 'edition-1',
        thresholdId: 'threshold-1',
        title: 'Low ticket sales alert',
        message: 'Ticket sales are below the target threshold',
        level: 'warning',
        metricSource: 'billing_sales',
        currentValue: 50,
        thresholdValue: 100,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const result = alertSchema.parse(alert)
      expect(result.id).toBe('alert-1')
      expect(result.title).toBe('Low ticket sales alert')
      expect(result.status).toBe('active')
    })

    it('should validate alert with acknowledgement info', () => {
      const alert = {
        id: 'alert-1',
        editionId: 'edition-1',
        thresholdId: 'threshold-1',
        title: 'Test alert',
        message: 'Test message',
        level: 'info',
        metricSource: 'cfp_submissions',
        currentValue: 10,
        thresholdValue: 5,
        status: 'acknowledged',
        acknowledgedBy: 'user-1',
        acknowledgedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const result = alertSchema.parse(alert)
      expect(result.status).toBe('acknowledged')
      expect(result.acknowledgedBy).toBe('user-1')
    })

    it('should validate create alert without id and status fields', () => {
      const data = {
        editionId: 'edition-1',
        thresholdId: 'threshold-1',
        title: 'New alert',
        message: 'Alert message',
        level: 'critical',
        metricSource: 'planning_conflicts',
        currentValue: 10,
        thresholdValue: 5
      }

      const result = createAlertSchema.parse(data)
      expect(result.title).toBe('New alert')
      expect(result.level).toBe('critical')
    })
  })

  describe('getAlertStatusLabel', () => {
    it('should return correct labels', () => {
      expect(getAlertStatusLabel('active')).toBe('Active')
      expect(getAlertStatusLabel('acknowledged')).toBe('Acknowledged')
      expect(getAlertStatusLabel('resolved')).toBe('Resolved')
      expect(getAlertStatusLabel('dismissed')).toBe('Dismissed')
    })
  })

  describe('getAlertStatusColor', () => {
    it('should return correct colors', () => {
      expect(getAlertStatusColor('active')).toBe('red')
      expect(getAlertStatusColor('acknowledged')).toBe('yellow')
      expect(getAlertStatusColor('resolved')).toBe('green')
      expect(getAlertStatusColor('dismissed')).toBe('gray')
    })
  })

  describe('canAcknowledgeAlert', () => {
    it('should return true for active alerts', () => {
      expect(canAcknowledgeAlert('active')).toBe(true)
    })

    it('should return false for non-active alerts', () => {
      expect(canAcknowledgeAlert('acknowledged')).toBe(false)
      expect(canAcknowledgeAlert('resolved')).toBe(false)
      expect(canAcknowledgeAlert('dismissed')).toBe(false)
    })
  })

  describe('canResolveAlert', () => {
    it('should return true for active and acknowledged alerts', () => {
      expect(canResolveAlert('active')).toBe(true)
      expect(canResolveAlert('acknowledged')).toBe(true)
    })

    it('should return false for resolved and dismissed alerts', () => {
      expect(canResolveAlert('resolved')).toBe(false)
      expect(canResolveAlert('dismissed')).toBe(false)
    })
  })

  describe('canDismissAlert', () => {
    it('should return true for active and acknowledged alerts', () => {
      expect(canDismissAlert('active')).toBe(true)
      expect(canDismissAlert('acknowledged')).toBe(true)
    })

    it('should return false for resolved and dismissed alerts', () => {
      expect(canDismissAlert('resolved')).toBe(false)
      expect(canDismissAlert('dismissed')).toBe(false)
    })
  })

  describe('isAlertActionable', () => {
    it('should return true for active and acknowledged alerts', () => {
      expect(isAlertActionable('active')).toBe(true)
      expect(isAlertActionable('acknowledged')).toBe(true)
    })

    it('should return false for resolved and dismissed alerts', () => {
      expect(isAlertActionable('resolved')).toBe(false)
      expect(isAlertActionable('dismissed')).toBe(false)
    })
  })

  describe('formatAlertMessage', () => {
    it('should format message without unit', () => {
      const message = formatAlertMessage('Low sales', 50, '<', 100)
      expect(message).toBe('Low sales: Current value (50) is < threshold (100)')
    })

    it('should format message with unit', () => {
      const message = formatAlertMessage('Budget variance', 15, '>', 10, '%')
      expect(message).toBe('Budget variance: Current value (15%) is > threshold (10%)')
    })

    it('should handle decimal values', () => {
      const message = formatAlertMessage('Rate', 0.75, '<', 0.8)
      expect(message).toBe('Rate: Current value (0.75) is < threshold (0.8)')
    })
  })
})
