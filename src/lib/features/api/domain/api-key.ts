import { z } from 'zod'

export const API_KEY_PREFIX = 'oeo_'
export const API_KEY_LENGTH = 32
export const API_KEY_EXPIRY_DAYS = 365
export const DEFAULT_RATE_LIMIT = 60

export const apiKeyPermissions = [
  'read:organizations',
  'read:events',
  'read:editions',
  'read:speakers',
  'read:talks',
  'read:sessions',
  'read:schedule',
  'read:ticket-types',
  'read:sponsors',
  'write:orders'
] as const

export type ApiKeyPermission = (typeof apiKeyPermissions)[number]

export const apiKeyPermissionSchema = z.enum(apiKeyPermissions)

export const apiKeySchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  keyHash: z.string(),
  keyPrefix: z.string().length(12),
  organizationId: z.string().optional(),
  eventId: z.string().optional(),
  editionId: z.string().optional(),
  permissions: z.array(apiKeyPermissionSchema),
  rateLimit: z.number().int().min(1).default(DEFAULT_RATE_LIMIT),
  lastUsedAt: z.date().optional(),
  expiresAt: z.date().optional(),
  isActive: z.boolean().default(true),
  createdBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type ApiKey = z.infer<typeof apiKeySchema>

export const createApiKeySchema = z.object({
  name: z.string().min(1).max(100),
  organizationId: z.string().optional(),
  eventId: z.string().optional(),
  editionId: z.string().optional(),
  permissions: z.array(apiKeyPermissionSchema).min(1),
  rateLimit: z.number().int().min(1).default(DEFAULT_RATE_LIMIT),
  expiresAt: z.date().optional()
})

export type CreateApiKey = z.infer<typeof createApiKeySchema>

export const updateApiKeySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  permissions: z.array(apiKeyPermissionSchema).min(1).optional(),
  rateLimit: z.number().int().min(1).optional(),
  expiresAt: z.date().optional(),
  isActive: z.boolean().optional()
})

export type UpdateApiKey = z.infer<typeof updateApiKeySchema>

export interface ApiKeyScope {
  organizationId?: string
  eventId?: string
  editionId?: string
}

export const isApiKeyExpired = (apiKey: ApiKey): boolean => {
  if (!apiKey.expiresAt) {
    return false
  }
  return new Date() > apiKey.expiresAt
}

export const isApiKeyValid = (apiKey: ApiKey): boolean => {
  return apiKey.isActive && !isApiKeyExpired(apiKey)
}

export const getApiKeyExpiryDate = (daysFromNow: number = API_KEY_EXPIRY_DAYS): Date => {
  const date = new Date()
  date.setDate(date.getDate() + daysFromNow)
  return date
}

export const getDaysUntilExpiry = (apiKey: ApiKey): number | null => {
  if (!apiKey.expiresAt) {
    return null
  }
  const now = new Date()
  const diff = apiKey.expiresAt.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export const isApiKeyExpiringSoon = (apiKey: ApiKey, thresholdDays = 30): boolean => {
  const daysLeft = getDaysUntilExpiry(apiKey)
  if (daysLeft === null) {
    return false
  }
  return daysLeft > 0 && daysLeft <= thresholdDays
}

export const hasPermission = (apiKey: ApiKey, permission: ApiKeyPermission): boolean => {
  return apiKey.permissions.includes(permission)
}

export const hasAnyPermission = (apiKey: ApiKey, permissions: ApiKeyPermission[]): boolean => {
  return permissions.some((p) => apiKey.permissions.includes(p))
}

export const hasAllPermissions = (apiKey: ApiKey, permissions: ApiKeyPermission[]): boolean => {
  return permissions.every((p) => apiKey.permissions.includes(p))
}

export const matchesScope = (apiKey: ApiKey, scope: ApiKeyScope): boolean => {
  if (apiKey.editionId && scope.editionId) {
    return apiKey.editionId === scope.editionId
  }
  if (apiKey.eventId && scope.eventId) {
    return apiKey.eventId === scope.eventId
  }
  if (apiKey.organizationId && scope.organizationId) {
    return apiKey.organizationId === scope.organizationId
  }
  return true
}

export const getPermissionLabel = (permission: ApiKeyPermission): string => {
  const labels: Record<ApiKeyPermission, string> = {
    'read:organizations': 'Read Organizations',
    'read:events': 'Read Events',
    'read:editions': 'Read Editions',
    'read:speakers': 'Read Speakers',
    'read:talks': 'Read Talks',
    'read:sessions': 'Read Sessions',
    'read:schedule': 'Read Schedule',
    'read:ticket-types': 'Read Ticket Types',
    'read:sponsors': 'Read Sponsors',
    'write:orders': 'Create Orders'
  }
  return labels[permission]
}

export const groupPermissionsByType = (
  permissions: ApiKeyPermission[]
): { read: ApiKeyPermission[]; write: ApiKeyPermission[] } => {
  return {
    read: permissions.filter((p) => p.startsWith('read:')),
    write: permissions.filter((p) => p.startsWith('write:'))
  }
}
