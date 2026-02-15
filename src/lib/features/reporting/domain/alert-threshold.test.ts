import { describe, expect, it } from 'vitest'
import {
  type AlertLevel,
  type ComparisonOperator,
  alertLevelSchema,
  alertThresholdSchema,
  comparisonOperatorSchema,
  createAlertThresholdSchema,
  evaluateThreshold,
  getAlertLevelColor,
  getAlertLevelLabel,
  getComparisonOperatorLabel,
  getComparisonOperatorSymbol,
  getMetricSourceLabel,
  metricSourceSchema
} from './alert-threshold'

describe('alert-threshold domain', () => {
  describe('schemas', () => {
    it('should validate alert levels', () => {
      expect(alertLevelSchema.parse('info')).toBe('info')
      expect(alertLevelSchema.parse('warning')).toBe('warning')
      expect(alertLevelSchema.parse('critical')).toBe('critical')
      expect(() => alertLevelSchema.parse('invalid')).toThrow()
    })

    it('should validate metric sources', () => {
      expect(metricSourceSchema.parse('cfp_submissions')).toBe('cfp_submissions')
      expect(metricSourceSchema.parse('billing_revenue')).toBe('billing_revenue')
      expect(() => metricSourceSchema.parse('invalid_source')).toThrow()
    })

    it('should validate comparison operators', () => {
      expect(comparisonOperatorSchema.parse('gt')).toBe('gt')
      expect(comparisonOperatorSchema.parse('lte')).toBe('lte')
      expect(() => comparisonOperatorSchema.parse('invalid')).toThrow()
    })

    it('should validate a complete alert threshold', () => {
      const threshold = {
        id: 'threshold-1',
        editionId: 'edition-1',
        name: 'Low ticket sales',
        description: 'Alert when ticket sales are below target',
        metricSource: 'billing_sales',
        operator: 'lt',
        thresholdValue: 100,
        level: 'warning',
        enabled: true,
        notifyByEmail: true,
        notifyInApp: true,
        emailRecipients: ['admin@example.com'],
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const result = alertThresholdSchema.parse(threshold)
      expect(result.id).toBe('threshold-1')
      expect(result.name).toBe('Low ticket sales')
      expect(result.level).toBe('warning')
    })

    it('should validate create alert threshold without id and timestamps', () => {
      const data = {
        editionId: 'edition-1',
        name: 'High conflict count',
        metricSource: 'planning_conflicts',
        operator: 'gt',
        thresholdValue: 5,
        level: 'critical',
        enabled: true,
        notifyByEmail: false,
        notifyInApp: true,
        emailRecipients: []
      }

      const result = createAlertThresholdSchema.parse(data)
      expect(result.name).toBe('High conflict count')
      expect(result.level).toBe('critical')
    })

    it('should reject invalid email recipients', () => {
      const data = {
        editionId: 'edition-1',
        name: 'Test',
        metricSource: 'billing_sales',
        operator: 'gt',
        thresholdValue: 100,
        level: 'info',
        emailRecipients: ['not-an-email']
      }

      expect(() => createAlertThresholdSchema.parse(data)).toThrow()
    })
  })

  describe('getAlertLevelLabel', () => {
    it('should return correct labels', () => {
      expect(getAlertLevelLabel('info')).toBe('Information')
      expect(getAlertLevelLabel('warning')).toBe('Warning')
      expect(getAlertLevelLabel('critical')).toBe('Critical')
    })
  })

  describe('getAlertLevelColor', () => {
    it('should return correct colors', () => {
      expect(getAlertLevelColor('info')).toBe('blue')
      expect(getAlertLevelColor('warning')).toBe('yellow')
      expect(getAlertLevelColor('critical')).toBe('red')
    })
  })

  describe('getMetricSourceLabel', () => {
    it('should return correct labels for all sources', () => {
      expect(getMetricSourceLabel('cfp_submissions')).toBe('CFP - Submissions')
      expect(getMetricSourceLabel('billing_revenue')).toBe('Billing - Revenue')
      expect(getMetricSourceLabel('planning_conflicts')).toBe('Planning - Conflicts')
      expect(getMetricSourceLabel('sponsoring_pipeline')).toBe('Sponsoring - Pipeline')
    })
  })

  describe('getComparisonOperatorLabel', () => {
    it('should return correct labels', () => {
      expect(getComparisonOperatorLabel('gt')).toBe('Greater than')
      expect(getComparisonOperatorLabel('lte')).toBe('Less than or equal')
      expect(getComparisonOperatorLabel('eq')).toBe('Equal to')
    })
  })

  describe('getComparisonOperatorSymbol', () => {
    it('should return correct symbols', () => {
      expect(getComparisonOperatorSymbol('gt')).toBe('>')
      expect(getComparisonOperatorSymbol('gte')).toBe('>=')
      expect(getComparisonOperatorSymbol('lt')).toBe('<')
      expect(getComparisonOperatorSymbol('lte')).toBe('<=')
      expect(getComparisonOperatorSymbol('eq')).toBe('=')
      expect(getComparisonOperatorSymbol('neq')).toBe('!=')
    })
  })

  describe('evaluateThreshold', () => {
    it('should evaluate greater than correctly', () => {
      expect(evaluateThreshold(10, 'gt', 5)).toBe(true)
      expect(evaluateThreshold(5, 'gt', 5)).toBe(false)
      expect(evaluateThreshold(3, 'gt', 5)).toBe(false)
    })

    it('should evaluate greater than or equal correctly', () => {
      expect(evaluateThreshold(10, 'gte', 5)).toBe(true)
      expect(evaluateThreshold(5, 'gte', 5)).toBe(true)
      expect(evaluateThreshold(3, 'gte', 5)).toBe(false)
    })

    it('should evaluate less than correctly', () => {
      expect(evaluateThreshold(3, 'lt', 5)).toBe(true)
      expect(evaluateThreshold(5, 'lt', 5)).toBe(false)
      expect(evaluateThreshold(10, 'lt', 5)).toBe(false)
    })

    it('should evaluate less than or equal correctly', () => {
      expect(evaluateThreshold(3, 'lte', 5)).toBe(true)
      expect(evaluateThreshold(5, 'lte', 5)).toBe(true)
      expect(evaluateThreshold(10, 'lte', 5)).toBe(false)
    })

    it('should evaluate equal correctly', () => {
      expect(evaluateThreshold(5, 'eq', 5)).toBe(true)
      expect(evaluateThreshold(3, 'eq', 5)).toBe(false)
    })

    it('should evaluate not equal correctly', () => {
      expect(evaluateThreshold(3, 'neq', 5)).toBe(true)
      expect(evaluateThreshold(5, 'neq', 5)).toBe(false)
    })
  })
})
