import { z } from 'zod'

export const widgetTypeSchema = z.enum(['metric', 'chart', 'table', 'progress', 'list'])

export type WidgetType = z.infer<typeof widgetTypeSchema>

export const widgetSizeSchema = z.enum(['small', 'medium', 'large', 'full'])

export type WidgetSize = z.infer<typeof widgetSizeSchema>

export const trendDirectionSchema = z.enum(['up', 'down', 'neutral'])

export type TrendDirection = z.infer<typeof trendDirectionSchema>

export const widgetConfigSchema = z.object({
  id: z.string(),
  type: widgetTypeSchema,
  title: z.string(),
  size: widgetSizeSchema,
  order: z.number().int().min(0),
  dataSource: z.string(),
  refreshInterval: z.number().int().min(0).optional()
})

export type WidgetConfig = z.infer<typeof widgetConfigSchema>

export type MetricData = {
  value: number | string
  label: string
  trend?: {
    direction: TrendDirection
    value: number
    label?: string
  }
  unit?: string
  format?: 'number' | 'currency' | 'percentage'
}

export type ProgressData = {
  current: number
  total: number
  label: string
  unit?: string
}

export type ChartDataPoint = {
  label: string
  value: number
  color?: string
}

export type ChartData = {
  points: ChartDataPoint[]
  type: 'bar' | 'line' | 'pie' | 'donut'
}

export type TableColumn = {
  key: string
  label: string
  align?: 'left' | 'center' | 'right'
}

export type TableData = {
  columns: TableColumn[]
  rows: Record<string, unknown>[]
}

export type ListItem = {
  id: string
  title: string
  subtitle?: string
  value?: string | number
  status?: 'success' | 'warning' | 'error' | 'info'
}

export type ListData = {
  items: ListItem[]
}

export type WidgetData = {
  metric?: MetricData
  progress?: ProgressData
  chart?: ChartData
  table?: TableData
  list?: ListData
  loading?: boolean
  error?: string
  lastUpdated?: Date
}

export type DashboardWidget = WidgetConfig & {
  data: WidgetData
}

export const createMetricWidget = (
  id: string,
  title: string,
  dataSource: string,
  size: WidgetSize = 'small'
): WidgetConfig => ({
  id,
  type: 'metric',
  title,
  size,
  order: 0,
  dataSource
})

export const createProgressWidget = (
  id: string,
  title: string,
  dataSource: string,
  size: WidgetSize = 'medium'
): WidgetConfig => ({
  id,
  type: 'progress',
  title,
  size,
  order: 0,
  dataSource
})

export const createChartWidget = (
  id: string,
  title: string,
  dataSource: string,
  size: WidgetSize = 'large'
): WidgetConfig => ({
  id,
  type: 'chart',
  title,
  size,
  order: 0,
  dataSource
})
