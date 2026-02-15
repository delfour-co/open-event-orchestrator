import { describe, expect, it } from 'vitest'
import {
  createChartWidget,
  createMetricWidget,
  createProgressWidget,
  widgetConfigSchema,
  widgetSizeSchema,
  widgetTypeSchema
} from './widget'

describe('Widget Domain', () => {
  describe('widgetTypeSchema', () => {
    it('should accept valid widget types', () => {
      expect(widgetTypeSchema.parse('metric')).toBe('metric')
      expect(widgetTypeSchema.parse('chart')).toBe('chart')
      expect(widgetTypeSchema.parse('table')).toBe('table')
      expect(widgetTypeSchema.parse('progress')).toBe('progress')
      expect(widgetTypeSchema.parse('list')).toBe('list')
    })

    it('should reject invalid widget types', () => {
      expect(() => widgetTypeSchema.parse('invalid')).toThrow()
    })
  })

  describe('widgetSizeSchema', () => {
    it('should accept valid sizes', () => {
      expect(widgetSizeSchema.parse('small')).toBe('small')
      expect(widgetSizeSchema.parse('medium')).toBe('medium')
      expect(widgetSizeSchema.parse('large')).toBe('large')
      expect(widgetSizeSchema.parse('full')).toBe('full')
    })

    it('should reject invalid sizes', () => {
      expect(() => widgetSizeSchema.parse('tiny')).toThrow()
    })
  })

  describe('widgetConfigSchema', () => {
    it('should validate a complete widget config', () => {
      const config = {
        id: 'widget-1',
        type: 'metric',
        title: 'Revenue',
        size: 'small',
        order: 0,
        dataSource: 'billing.revenue'
      }

      const result = widgetConfigSchema.parse(config)
      expect(result.id).toBe('widget-1')
      expect(result.type).toBe('metric')
      expect(result.title).toBe('Revenue')
    })

    it('should accept optional refreshInterval', () => {
      const config = {
        id: 'widget-1',
        type: 'metric',
        title: 'Revenue',
        size: 'small',
        order: 0,
        dataSource: 'billing.revenue',
        refreshInterval: 60000
      }

      const result = widgetConfigSchema.parse(config)
      expect(result.refreshInterval).toBe(60000)
    })

    it('should reject negative order', () => {
      const config = {
        id: 'widget-1',
        type: 'metric',
        title: 'Revenue',
        size: 'small',
        order: -1,
        dataSource: 'billing.revenue'
      }

      expect(() => widgetConfigSchema.parse(config)).toThrow()
    })
  })

  describe('createMetricWidget', () => {
    it('should create a metric widget with defaults', () => {
      const widget = createMetricWidget('revenue', 'Total Revenue', 'billing.revenue')

      expect(widget.id).toBe('revenue')
      expect(widget.type).toBe('metric')
      expect(widget.title).toBe('Total Revenue')
      expect(widget.size).toBe('small')
      expect(widget.dataSource).toBe('billing.revenue')
      expect(widget.order).toBe(0)
    })

    it('should allow custom size', () => {
      const widget = createMetricWidget('revenue', 'Total Revenue', 'billing.revenue', 'medium')

      expect(widget.size).toBe('medium')
    })
  })

  describe('createProgressWidget', () => {
    it('should create a progress widget with defaults', () => {
      const widget = createProgressWidget('checkin', 'Check-in Progress', 'billing.checkin')

      expect(widget.id).toBe('checkin')
      expect(widget.type).toBe('progress')
      expect(widget.size).toBe('medium')
    })
  })

  describe('createChartWidget', () => {
    it('should create a chart widget with defaults', () => {
      const widget = createChartWidget('sales', 'Sales Over Time', 'billing.salesHistory')

      expect(widget.id).toBe('sales')
      expect(widget.type).toBe('chart')
      expect(widget.size).toBe('large')
    })
  })
})
