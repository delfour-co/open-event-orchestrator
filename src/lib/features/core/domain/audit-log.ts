import { z } from 'zod'

export const auditActionSchema = z.enum([
  'login',
  'logout',
  'password_change',
  'profile_update',
  '2fa_enable',
  '2fa_disable',
  'org_create',
  'org_update',
  'org_delete',
  'member_add',
  'member_remove',
  'member_role_change',
  'event_create',
  'event_update',
  'event_delete',
  'edition_create',
  'edition_update',
  'edition_delete',
  'settings_change',
  'invitation_send',
  'invitation_accept'
])

export type AuditAction = z.infer<typeof auditActionSchema>

export const auditEntityTypeSchema = z.enum([
  'user',
  'organization',
  'event',
  'edition',
  'member',
  'invitation',
  'settings'
])

export type AuditEntityType = z.infer<typeof auditEntityTypeSchema>

export const auditLogSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  userId: z.string().optional(),
  userName: z.string().optional(),
  action: auditActionSchema,
  entityType: auditEntityTypeSchema.optional(),
  entityId: z.string().optional(),
  entityName: z.string().optional(),
  details: z.record(z.unknown()).optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  created: z.date()
})

export type AuditLog = z.infer<typeof auditLogSchema>

export const auditLogFiltersSchema = z.object({
  action: auditActionSchema.optional(),
  userId: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional()
})

export type AuditLogFilters = z.infer<typeof auditLogFiltersSchema>

export interface PaginatedAuditLogs {
  items: AuditLog[]
  page: number
  perPage: number
  totalItems: number
  totalPages: number
}

export const AUDIT_RETENTION_DAYS = 90

export function getAuditActionLabel(action: AuditAction): string {
  const labels: Record<AuditAction, string> = {
    login: 'Login',
    logout: 'Logout',
    password_change: 'Password Changed',
    profile_update: 'Profile Updated',
    '2fa_enable': '2FA Enabled',
    '2fa_disable': '2FA Disabled',
    org_create: 'Organization Created',
    org_update: 'Organization Updated',
    org_delete: 'Organization Deleted',
    member_add: 'Member Added',
    member_remove: 'Member Removed',
    member_role_change: 'Member Role Changed',
    event_create: 'Event Created',
    event_update: 'Event Updated',
    event_delete: 'Event Deleted',
    edition_create: 'Edition Created',
    edition_update: 'Edition Updated',
    edition_delete: 'Edition Deleted',
    settings_change: 'Settings Changed',
    invitation_send: 'Invitation Sent',
    invitation_accept: 'Invitation Accepted'
  }
  return labels[action]
}

export function getAuditActionColor(action: AuditAction): string {
  if (action.includes('delete') || action === 'member_remove') return 'red'
  if (action.includes('create') || action === 'member_add' || action === 'invitation_accept')
    return 'green'
  if (action === 'login' || action === 'logout') return 'blue'
  if (action.includes('2fa')) return 'purple'
  return 'gray'
}
