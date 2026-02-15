import { z } from 'zod'
import { alertLevelSchema, metricSourceSchema } from './alert-threshold'

export const alertStatusSchema = z.enum(['active', 'acknowledged', 'resolved', 'dismissed'])

export type AlertStatus = z.infer<typeof alertStatusSchema>

export const alertSchema = z.object({
  id: z.string(),
  editionId: z.string(),
  thresholdId: z.string(),
  title: z.string(),
  message: z.string(),
  level: alertLevelSchema,
  metricSource: metricSourceSchema,
  currentValue: z.number(),
  thresholdValue: z.number(),
  status: alertStatusSchema.default('active'),
  acknowledgedBy: z.string().optional(),
  acknowledgedAt: z.date().optional(),
  resolvedAt: z.date().optional(),
  dismissedBy: z.string().optional(),
  dismissedAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type Alert = z.infer<typeof alertSchema>

export const createAlertSchema = alertSchema.omit({
  id: true,
  status: true,
  acknowledgedBy: true,
  acknowledgedAt: true,
  resolvedAt: true,
  dismissedBy: true,
  dismissedAt: true,
  createdAt: true,
  updatedAt: true
})

export type CreateAlert = z.infer<typeof createAlertSchema>

export const getAlertStatusLabel = (status: AlertStatus): string => {
  const labels: Record<AlertStatus, string> = {
    active: 'Active',
    acknowledged: 'Acknowledged',
    resolved: 'Resolved',
    dismissed: 'Dismissed'
  }
  return labels[status]
}

export const getAlertStatusColor = (status: AlertStatus): string => {
  const colors: Record<AlertStatus, string> = {
    active: 'red',
    acknowledged: 'yellow',
    resolved: 'green',
    dismissed: 'gray'
  }
  return colors[status]
}

export const canAcknowledgeAlert = (status: AlertStatus): boolean => {
  return status === 'active'
}

export const canResolveAlert = (status: AlertStatus): boolean => {
  return status === 'active' || status === 'acknowledged'
}

export const canDismissAlert = (status: AlertStatus): boolean => {
  return status === 'active' || status === 'acknowledged'
}

export const isAlertActionable = (status: AlertStatus): boolean => {
  return status === 'active' || status === 'acknowledged'
}

export const formatAlertMessage = (
  thresholdName: string,
  currentValue: number,
  operatorSymbol: string,
  thresholdValue: number,
  unit?: string
): string => {
  const formattedCurrent = unit ? `${currentValue}${unit}` : currentValue.toString()
  const formattedThreshold = unit ? `${thresholdValue}${unit}` : thresholdValue.toString()
  return `${thresholdName}: Current value (${formattedCurrent}) is ${operatorSymbol} threshold (${formattedThreshold})`
}
