import { z } from 'zod'

export const auditActionSchema = z.enum([
  'create',
  'update',
  'delete',
  'status_change',
  'send',
  'accept',
  'reject',
  'convert',
  'submit',
  'approve',
  'mark_paid'
])

export type AuditAction = z.infer<typeof auditActionSchema>

export const auditEntityTypeSchema = z.enum([
  'transaction',
  'quote',
  'invoice',
  'reimbursement',
  'category',
  'budget'
])

export type AuditEntityType = z.infer<typeof auditEntityTypeSchema>

export const financialAuditLogSchema = z.object({
  id: z.string(),
  editionId: z.string(),
  userId: z.string().optional(),
  action: auditActionSchema,
  entityType: auditEntityTypeSchema,
  entityId: z.string(),
  entityReference: z.string().optional(),
  oldValue: z.record(z.unknown()).optional(),
  newValue: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
  created: z.date()
})

export type FinancialAuditLog = z.infer<typeof financialAuditLogSchema>

export const createAuditLogSchema = financialAuditLogSchema.omit({
  id: true,
  created: true
})

export type CreateAuditLog = z.infer<typeof createAuditLogSchema>

export const auditLogFiltersSchema = z.object({
  action: auditActionSchema.optional(),
  entityType: auditEntityTypeSchema.optional(),
  userId: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  search: z.string().optional()
})

export type AuditLogFilters = z.infer<typeof auditLogFiltersSchema>

export interface PaginatedAuditLogs {
  items: FinancialAuditLog[]
  page: number
  perPage: number
  totalItems: number
  totalPages: number
}

export const getActionLabel = (action: AuditAction): string => {
  const labels: Record<AuditAction, string> = {
    create: 'Created',
    update: 'Updated',
    delete: 'Deleted',
    status_change: 'Status Changed',
    send: 'Sent',
    accept: 'Accepted',
    reject: 'Rejected',
    convert: 'Converted',
    submit: 'Submitted',
    approve: 'Approved',
    mark_paid: 'Marked Paid'
  }
  return labels[action]
}

export const getActionColor = (action: AuditAction): string => {
  const colors: Record<AuditAction, string> = {
    create: 'green',
    update: 'blue',
    delete: 'red',
    status_change: 'purple',
    send: 'cyan',
    accept: 'green',
    reject: 'red',
    convert: 'orange',
    submit: 'blue',
    approve: 'green',
    mark_paid: 'green'
  }
  return colors[action]
}

export const getEntityTypeLabel = (type: AuditEntityType): string => {
  const labels: Record<AuditEntityType, string> = {
    transaction: 'Transaction',
    quote: 'Quote',
    invoice: 'Invoice',
    reimbursement: 'Reimbursement',
    category: 'Category',
    budget: 'Budget'
  }
  return labels[type]
}

export const extractAmount = (value: Record<string, unknown> | undefined): number | null => {
  if (!value) return null
  if (typeof value.amount === 'number') return value.amount
  if (typeof value.totalAmount === 'number') return value.totalAmount
  if (typeof value.total === 'number') return value.total
  return null
}

export const buildAuditDescription = (log: FinancialAuditLog): string => {
  const entityLabel = getEntityTypeLabel(log.entityType)
  const actionLabel = getActionLabel(log.action)

  let description = `${actionLabel} ${entityLabel.toLowerCase()}`

  if (log.entityReference) {
    description += ` ${log.entityReference}`
  }

  const newAmount = extractAmount(log.newValue)
  const oldAmount = extractAmount(log.oldValue)

  if (
    log.action === 'update' &&
    oldAmount !== null &&
    newAmount !== null &&
    oldAmount !== newAmount
  ) {
    description += ` (amount: ${formatCurrency(oldAmount)} → ${formatCurrency(newAmount)})`
  } else if (newAmount !== null && log.action === 'create') {
    description += ` for ${formatCurrency(newAmount)}`
  }

  if (log.action === 'status_change' && log.oldValue?.status && log.newValue?.status) {
    description += ` (${log.oldValue.status} → ${log.newValue.status})`
  }

  return description
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount)
}

export const sanitizeForAudit = (data: Record<string, unknown>): Record<string, unknown> => {
  const sensitiveKeys = [
    'password',
    'token',
    'secret',
    'apiKey',
    'api_key',
    'accessToken',
    'refreshToken'
  ]
  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(data)) {
    if (sensitiveKeys.some((k) => key.toLowerCase().includes(k.toLowerCase()))) {
      result[key] = '[REDACTED]'
    } else if (typeof value === 'string' && value.length > 1000) {
      result[key] = `${value.substring(0, 1000)}...`
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      result[key] = sanitizeForAudit(value as Record<string, unknown>)
    } else {
      result[key] = value
    }
  }

  return result
}
