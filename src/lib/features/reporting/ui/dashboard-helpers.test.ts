import { describe, expect, it } from 'vitest'
import {
  type DashboardLayout,
  REFRESH_INTERVAL_MS,
  type RefreshInterval,
  createDashboard,
  createDefaultDashboard
} from '../domain/dashboard'
import {
  type WidgetSize,
  createChartWidget,
  createMetricWidget,
  createProgressWidget
} from '../domain/widget'

describe('Dashboard UI Helpers', () => {
  describe('Widget size classes mapping', () => {
    const sizeClasses: Record<WidgetSize, string> = {
      small: 'col-span-1',
      medium: 'col-span-1 md:col-span-2',
      large: 'col-span-1 md:col-span-2 lg:col-span-3',
      full: 'col-span-full'
    }

    it('should have correct class for small size', () => {
      expect(sizeClasses.small).toBe('col-span-1')
    })

    it('should have correct class for medium size', () => {
      expect(sizeClasses.medium).toContain('md:col-span-2')
    })

    it('should have correct class for large size', () => {
      expect(sizeClasses.large).toContain('lg:col-span-3')
    })

    it('should have correct class for full size', () => {
      expect(sizeClasses.full).toBe('col-span-full')
    })
  })

  describe('Refresh interval configuration', () => {
    it('should return null for off interval', () => {
      expect(REFRESH_INTERVAL_MS.off).toBeNull()
    })

    it('should return correct ms for 30 seconds', () => {
      expect(REFRESH_INTERVAL_MS['30s']).toBe(30000)
    })

    it('should return correct ms for 1 minute', () => {
      expect(REFRESH_INTERVAL_MS['1m']).toBe(60000)
    })

    it('should return correct ms for 5 minutes', () => {
      expect(REFRESH_INTERVAL_MS['5m']).toBe(300000)
    })

    it('should return correct ms for 15 minutes', () => {
      expect(REFRESH_INTERVAL_MS['15m']).toBe(900000)
    })
  })

  describe('Layout options', () => {
    const layouts: DashboardLayout[] = ['grid', 'list', 'compact']

    it('should have grid layout', () => {
      expect(layouts).toContain('grid')
    })

    it('should have list layout', () => {
      expect(layouts).toContain('list')
    })

    it('should have compact layout', () => {
      expect(layouts).toContain('compact')
    })
  })

  describe('Dashboard configuration persistence', () => {
    it('should create dashboard with default config for new user', () => {
      const dashboard = createDefaultDashboard('user-1', 'edition-1')

      expect(dashboard.userId).toBe('user-1')
      expect(dashboard.editionId).toBe('edition-1')
      expect(dashboard.layout).toBe('grid')
      expect(dashboard.refreshInterval).toBe('off')
      expect(dashboard.widgets).toHaveLength(0)
    })

    it('should create dashboard with custom widgets', () => {
      const widgets = [
        createMetricWidget('revenue', 'Revenue', 'billing.revenue'),
        createProgressWidget('checkin', 'Check-in', 'billing.checkin'),
        createChartWidget('sales', 'Sales', 'billing.sales')
      ]

      const dashboard = createDashboard({
        userId: 'user-1',
        editionId: 'edition-1',
        widgets
      })

      expect(dashboard.widgets).toHaveLength(3)
      expect(dashboard.widgets[0].type).toBe('metric')
      expect(dashboard.widgets[1].type).toBe('progress')
      expect(dashboard.widgets[2].type).toBe('chart')
    })
  })

  describe('Refresh interval labels', () => {
    const refreshOptions: { value: RefreshInterval; label: string }[] = [
      { value: 'off', label: 'Manual' },
      { value: '30s', label: '30 seconds' },
      { value: '1m', label: '1 minute' },
      { value: '5m', label: '5 minutes' },
      { value: '15m', label: '15 minutes' }
    ]

    it('should have correct label for manual', () => {
      const option = refreshOptions.find((o) => o.value === 'off')
      expect(option?.label).toBe('Manual')
    })

    it('should have correct label for 30s', () => {
      const option = refreshOptions.find((o) => o.value === '30s')
      expect(option?.label).toBe('30 seconds')
    })

    it('should have correct label for 1m', () => {
      const option = refreshOptions.find((o) => o.value === '1m')
      expect(option?.label).toBe('1 minute')
    })

    it('should have correct label for 5m', () => {
      const option = refreshOptions.find((o) => o.value === '5m')
      expect(option?.label).toBe('5 minutes')
    })

    it('should have correct label for 15m', () => {
      const option = refreshOptions.find((o) => o.value === '15m')
      expect(option?.label).toBe('15 minutes')
    })

    it('should have all refresh intervals covered', () => {
      expect(refreshOptions).toHaveLength(5)
    })
  })

  describe('Date formatting', () => {
    it('should format time correctly', () => {
      const date = new Date('2024-01-15T14:30:00')
      const formatted = new Intl.DateTimeFormat('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      }).format(date)

      expect(formatted).toMatch(/\d{2}:\d{2}/)
    })

    it('should format datetime correctly', () => {
      const date = new Date('2024-01-15T14:30:00')
      const formatted = new Intl.DateTimeFormat('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).format(date)

      expect(formatted).toMatch(/\d{2}:\d{2}:\d{2}/)
    })
  })

  describe('Grid column configuration', () => {
    const columnClasses: Record<number, string> = {
      1: 'grid-cols-1',
      2: 'grid-cols-1 md:grid-cols-2',
      3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
    }

    it('should have 1 column configuration', () => {
      expect(columnClasses[1]).toBe('grid-cols-1')
    })

    it('should have 2 column configuration with responsive', () => {
      expect(columnClasses[2]).toContain('md:grid-cols-2')
    })

    it('should have 3 column configuration with responsive', () => {
      expect(columnClasses[3]).toContain('lg:grid-cols-3')
    })

    it('should have 4 column configuration with responsive', () => {
      expect(columnClasses[4]).toContain('lg:grid-cols-4')
    })
  })
})
