import { describe, expect, it } from 'vitest'
import {
  REFRESH_INTERVAL_MS,
  addWidgetToDashboard,
  createDashboard,
  createDefaultDashboard,
  dashboardConfigSchema,
  dashboardLayoutSchema,
  refreshIntervalSchema,
  removeWidgetFromDashboard,
  reorderWidgets,
  updateDashboard
} from './dashboard'
import { createMetricWidget } from './widget'

describe('Dashboard Domain', () => {
  describe('dashboardLayoutSchema', () => {
    it('should accept valid layouts', () => {
      expect(dashboardLayoutSchema.parse('grid')).toBe('grid')
      expect(dashboardLayoutSchema.parse('list')).toBe('list')
      expect(dashboardLayoutSchema.parse('compact')).toBe('compact')
    })

    it('should reject invalid layouts', () => {
      expect(() => dashboardLayoutSchema.parse('invalid')).toThrow()
    })
  })

  describe('refreshIntervalSchema', () => {
    it('should accept valid intervals', () => {
      expect(refreshIntervalSchema.parse('off')).toBe('off')
      expect(refreshIntervalSchema.parse('30s')).toBe('30s')
      expect(refreshIntervalSchema.parse('1m')).toBe('1m')
      expect(refreshIntervalSchema.parse('5m')).toBe('5m')
      expect(refreshIntervalSchema.parse('15m')).toBe('15m')
    })

    it('should reject invalid intervals', () => {
      expect(() => refreshIntervalSchema.parse('2m')).toThrow()
    })
  })

  describe('REFRESH_INTERVAL_MS', () => {
    it('should have correct millisecond values', () => {
      expect(REFRESH_INTERVAL_MS.off).toBeNull()
      expect(REFRESH_INTERVAL_MS['30s']).toBe(30000)
      expect(REFRESH_INTERVAL_MS['1m']).toBe(60000)
      expect(REFRESH_INTERVAL_MS['5m']).toBe(300000)
      expect(REFRESH_INTERVAL_MS['15m']).toBe(900000)
    })
  })

  describe('createDefaultDashboard', () => {
    it('should create a dashboard with default values', () => {
      const dashboard = createDefaultDashboard('user-1', 'edition-1')

      expect(dashboard.userId).toBe('user-1')
      expect(dashboard.editionId).toBe('edition-1')
      expect(dashboard.layout).toBe('grid')
      expect(dashboard.refreshInterval).toBe('off')
      expect(dashboard.widgets).toEqual([])
      expect(dashboard.id).toBeDefined()
      expect(dashboard.createdAt).toBeInstanceOf(Date)
      expect(dashboard.updatedAt).toBeInstanceOf(Date)
    })
  })

  describe('createDashboard', () => {
    it('should create a dashboard with provided values', () => {
      const widget = createMetricWidget('revenue', 'Revenue', 'billing.revenue')
      const dashboard = createDashboard({
        userId: 'user-1',
        editionId: 'edition-1',
        layout: 'list',
        refreshInterval: '5m',
        widgets: [widget]
      })

      expect(dashboard.layout).toBe('list')
      expect(dashboard.refreshInterval).toBe('5m')
      expect(dashboard.widgets).toHaveLength(1)
    })

    it('should use defaults for optional values', () => {
      const dashboard = createDashboard({
        userId: 'user-1',
        editionId: 'edition-1'
      })

      expect(dashboard.layout).toBe('grid')
      expect(dashboard.refreshInterval).toBe('off')
      expect(dashboard.widgets).toEqual([])
    })
  })

  describe('updateDashboard', () => {
    it('should update dashboard layout', () => {
      const dashboard = createDefaultDashboard('user-1', 'edition-1')
      const updated = updateDashboard(dashboard, { layout: 'compact' })

      expect(updated.layout).toBe('compact')
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(dashboard.updatedAt.getTime())
    })

    it('should update refresh interval', () => {
      const dashboard = createDefaultDashboard('user-1', 'edition-1')
      const updated = updateDashboard(dashboard, { refreshInterval: '1m' })

      expect(updated.refreshInterval).toBe('1m')
    })

    it('should preserve unchanged values', () => {
      const dashboard = createDefaultDashboard('user-1', 'edition-1')
      const updated = updateDashboard(dashboard, { layout: 'list' })

      expect(updated.refreshInterval).toBe(dashboard.refreshInterval)
      expect(updated.userId).toBe(dashboard.userId)
    })
  })

  describe('addWidgetToDashboard', () => {
    it('should add a widget with correct order', () => {
      const dashboard = createDefaultDashboard('user-1', 'edition-1')
      const widget = createMetricWidget('revenue', 'Revenue', 'billing.revenue')
      const updated = addWidgetToDashboard(dashboard, widget)

      expect(updated.widgets).toHaveLength(1)
      expect(updated.widgets[0].order).toBe(0)
    })

    it('should increment order for subsequent widgets', () => {
      let dashboard = createDefaultDashboard('user-1', 'edition-1')
      const widget1 = createMetricWidget('revenue', 'Revenue', 'billing.revenue')
      const widget2 = createMetricWidget('tickets', 'Tickets', 'billing.tickets')

      dashboard = addWidgetToDashboard(dashboard, widget1)
      dashboard = addWidgetToDashboard(dashboard, widget2)

      expect(dashboard.widgets).toHaveLength(2)
      expect(dashboard.widgets[0].order).toBe(0)
      expect(dashboard.widgets[1].order).toBe(1)
    })
  })

  describe('removeWidgetFromDashboard', () => {
    it('should remove a widget by id', () => {
      let dashboard = createDefaultDashboard('user-1', 'edition-1')
      const widget = createMetricWidget('revenue', 'Revenue', 'billing.revenue')
      dashboard = addWidgetToDashboard(dashboard, widget)
      const updated = removeWidgetFromDashboard(dashboard, 'revenue')

      expect(updated.widgets).toHaveLength(0)
    })

    it('should reorder remaining widgets after removal', () => {
      let dashboard = createDefaultDashboard('user-1', 'edition-1')
      const widget1 = createMetricWidget('w1', 'Widget 1', 'source1')
      const widget2 = createMetricWidget('w2', 'Widget 2', 'source2')
      const widget3 = createMetricWidget('w3', 'Widget 3', 'source3')

      dashboard = addWidgetToDashboard(dashboard, widget1)
      dashboard = addWidgetToDashboard(dashboard, widget2)
      dashboard = addWidgetToDashboard(dashboard, widget3)
      const updated = removeWidgetFromDashboard(dashboard, 'w2')

      expect(updated.widgets).toHaveLength(2)
      expect(updated.widgets[0].id).toBe('w1')
      expect(updated.widgets[0].order).toBe(0)
      expect(updated.widgets[1].id).toBe('w3')
      expect(updated.widgets[1].order).toBe(1)
    })
  })

  describe('reorderWidgets', () => {
    it('should reorder widgets based on provided ids', () => {
      let dashboard = createDefaultDashboard('user-1', 'edition-1')
      const widget1 = createMetricWidget('w1', 'Widget 1', 'source1')
      const widget2 = createMetricWidget('w2', 'Widget 2', 'source2')
      const widget3 = createMetricWidget('w3', 'Widget 3', 'source3')

      dashboard = addWidgetToDashboard(dashboard, widget1)
      dashboard = addWidgetToDashboard(dashboard, widget2)
      dashboard = addWidgetToDashboard(dashboard, widget3)

      const reordered = reorderWidgets(dashboard, ['w3', 'w1', 'w2'])

      expect(reordered.widgets[0].id).toBe('w3')
      expect(reordered.widgets[0].order).toBe(0)
      expect(reordered.widgets[1].id).toBe('w1')
      expect(reordered.widgets[1].order).toBe(1)
      expect(reordered.widgets[2].id).toBe('w2')
      expect(reordered.widgets[2].order).toBe(2)
    })

    it('should skip invalid widget ids', () => {
      let dashboard = createDefaultDashboard('user-1', 'edition-1')
      const widget1 = createMetricWidget('w1', 'Widget 1', 'source1')
      dashboard = addWidgetToDashboard(dashboard, widget1)

      const reordered = reorderWidgets(dashboard, ['invalid', 'w1'])

      expect(reordered.widgets).toHaveLength(1)
      expect(reordered.widgets[0].id).toBe('w1')
    })
  })

  describe('dashboardConfigSchema', () => {
    it('should validate a complete dashboard config', () => {
      const config = {
        id: 'dashboard-1',
        userId: 'user-1',
        editionId: 'edition-1',
        layout: 'grid',
        refreshInterval: '5m',
        widgets: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const result = dashboardConfigSchema.parse(config)
      expect(result.id).toBe('dashboard-1')
      expect(result.layout).toBe('grid')
    })
  })
})
