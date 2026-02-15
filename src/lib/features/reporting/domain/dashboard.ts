import { z } from 'zod'
import { type WidgetConfig, widgetConfigSchema } from './widget'

export const dashboardLayoutSchema = z.enum(['grid', 'list', 'compact'])

export type DashboardLayout = z.infer<typeof dashboardLayoutSchema>

export const refreshIntervalSchema = z.enum(['off', '30s', '1m', '5m', '15m'])

export type RefreshInterval = z.infer<typeof refreshIntervalSchema>

export const REFRESH_INTERVAL_MS: Record<RefreshInterval, number | null> = {
  off: null,
  '30s': 30000,
  '1m': 60000,
  '5m': 300000,
  '15m': 900000
}

export const dashboardConfigSchema = z.object({
  id: z.string(),
  userId: z.string(),
  editionId: z.string(),
  layout: dashboardLayoutSchema,
  refreshInterval: refreshIntervalSchema,
  widgets: z.array(widgetConfigSchema),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type DashboardConfig = z.infer<typeof dashboardConfigSchema>

export type Dashboard = {
  id: string
  userId: string
  editionId: string
  layout: DashboardLayout
  refreshInterval: RefreshInterval
  widgets: WidgetConfig[]
  createdAt: Date
  updatedAt: Date
}

export type CreateDashboardInput = {
  userId: string
  editionId: string
  layout?: DashboardLayout
  refreshInterval?: RefreshInterval
  widgets?: WidgetConfig[]
}

export type UpdateDashboardInput = {
  layout?: DashboardLayout
  refreshInterval?: RefreshInterval
  widgets?: WidgetConfig[]
}

export const createDefaultDashboard = (userId: string, editionId: string): Dashboard => ({
  id: crypto.randomUUID(),
  userId,
  editionId,
  layout: 'grid',
  refreshInterval: 'off',
  widgets: [],
  createdAt: new Date(),
  updatedAt: new Date()
})

export const createDashboard = (input: CreateDashboardInput): Dashboard => ({
  id: crypto.randomUUID(),
  userId: input.userId,
  editionId: input.editionId,
  layout: input.layout ?? 'grid',
  refreshInterval: input.refreshInterval ?? 'off',
  widgets: input.widgets ?? [],
  createdAt: new Date(),
  updatedAt: new Date()
})

export const updateDashboard = (dashboard: Dashboard, input: UpdateDashboardInput): Dashboard => ({
  ...dashboard,
  layout: input.layout ?? dashboard.layout,
  refreshInterval: input.refreshInterval ?? dashboard.refreshInterval,
  widgets: input.widgets ?? dashboard.widgets,
  updatedAt: new Date()
})

export const addWidgetToDashboard = (dashboard: Dashboard, widget: WidgetConfig): Dashboard => ({
  ...dashboard,
  widgets: [...dashboard.widgets, { ...widget, order: dashboard.widgets.length }],
  updatedAt: new Date()
})

export const removeWidgetFromDashboard = (dashboard: Dashboard, widgetId: string): Dashboard => ({
  ...dashboard,
  widgets: dashboard.widgets
    .filter((w) => w.id !== widgetId)
    .map((w, index) => ({ ...w, order: index })),
  updatedAt: new Date()
})

export const reorderWidgets = (dashboard: Dashboard, widgetIds: string[]): Dashboard => {
  const widgetMap = new Map(dashboard.widgets.map((w) => [w.id, w]))
  const reorderedWidgets = widgetIds
    .map((id, index) => {
      const widget = widgetMap.get(id)
      return widget ? { ...widget, order: index } : null
    })
    .filter((w): w is WidgetConfig => w !== null)

  return {
    ...dashboard,
    widgets: reorderedWidgets,
    updatedAt: new Date()
  }
}
