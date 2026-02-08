import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  API_KEY_EXPIRY_DAYS,
  API_KEY_LENGTH,
  API_KEY_PREFIX,
  type ApiKey,
  type ApiKeyPermission,
  DEFAULT_RATE_LIMIT,
  apiKeyPermissions,
  apiKeySchema,
  createApiKeySchema,
  getApiKeyExpiryDate,
  getDaysUntilExpiry,
  getPermissionLabel,
  groupPermissionsByType,
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
  isApiKeyExpired,
  isApiKeyExpiringSoon,
  isApiKeyValid,
  matchesScope,
  updateApiKeySchema
} from './api-key'

describe('ApiKey Domain', () => {
  const now = new Date('2024-06-15T12:00:00Z')

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(now)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const validApiKey: ApiKey = {
    id: 'key123',
    name: 'Test API Key',
    keyHash: 'a'.repeat(64),
    keyPrefix: 'oeo_live_abc',
    organizationId: 'org123',
    eventId: undefined,
    editionId: undefined,
    permissions: ['read:events', 'read:editions'],
    rateLimit: 60,
    lastUsedAt: new Date('2024-06-14T12:00:00Z'),
    expiresAt: new Date('2025-06-15T12:00:00Z'),
    isActive: true,
    createdBy: 'user123',
    createdAt: new Date('2024-01-01T12:00:00Z'),
    updatedAt: new Date('2024-01-01T12:00:00Z')
  }

  describe('constants', () => {
    it('should have correct API_KEY_PREFIX', () => {
      expect(API_KEY_PREFIX).toBe('oeo_')
    })

    it('should have correct API_KEY_LENGTH', () => {
      expect(API_KEY_LENGTH).toBe(32)
    })

    it('should have correct API_KEY_EXPIRY_DAYS', () => {
      expect(API_KEY_EXPIRY_DAYS).toBe(365)
    })

    it('should have correct DEFAULT_RATE_LIMIT', () => {
      expect(DEFAULT_RATE_LIMIT).toBe(60)
    })
  })

  describe('apiKeyPermissions', () => {
    it('should contain all expected permissions', () => {
      expect(apiKeyPermissions).toContain('read:organizations')
      expect(apiKeyPermissions).toContain('read:events')
      expect(apiKeyPermissions).toContain('read:editions')
      expect(apiKeyPermissions).toContain('read:speakers')
      expect(apiKeyPermissions).toContain('read:talks')
      expect(apiKeyPermissions).toContain('read:sessions')
      expect(apiKeyPermissions).toContain('read:schedule')
      expect(apiKeyPermissions).toContain('read:ticket-types')
      expect(apiKeyPermissions).toContain('read:sponsors')
      expect(apiKeyPermissions).toContain('write:orders')
    })

    it('should have 10 permissions', () => {
      expect(apiKeyPermissions.length).toBe(10)
    })
  })

  describe('apiKeySchema', () => {
    it('should validate a complete API key', () => {
      const result = apiKeySchema.safeParse(validApiKey)
      expect(result.success).toBe(true)
    })

    it('should validate API key without optional fields', () => {
      const minimalKey = {
        ...validApiKey,
        organizationId: undefined,
        eventId: undefined,
        editionId: undefined,
        lastUsedAt: undefined,
        expiresAt: undefined
      }
      const result = apiKeySchema.safeParse(minimalKey)
      expect(result.success).toBe(true)
    })

    it('should reject empty name', () => {
      const invalid = { ...validApiKey, name: '' }
      const result = apiKeySchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should reject name longer than 100 characters', () => {
      const invalid = { ...validApiKey, name: 'a'.repeat(101) }
      const result = apiKeySchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should reject invalid keyPrefix length', () => {
      const invalid = { ...validApiKey, keyPrefix: 'short' }
      const result = apiKeySchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should reject invalid permission', () => {
      const invalid = { ...validApiKey, permissions: ['invalid:permission'] }
      const result = apiKeySchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should reject rateLimit less than 1', () => {
      const invalid = { ...validApiKey, rateLimit: 0 }
      const result = apiKeySchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })
  })

  describe('createApiKeySchema', () => {
    it('should validate create input', () => {
      const createData = {
        name: 'My API Key',
        organizationId: 'org123',
        permissions: ['read:events', 'read:editions'] as ApiKeyPermission[]
      }
      const result = createApiKeySchema.safeParse(createData)
      expect(result.success).toBe(true)
    })

    it('should require at least one permission', () => {
      const invalid = {
        name: 'My API Key',
        permissions: []
      }
      const result = createApiKeySchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should apply default rateLimit', () => {
      const createData = {
        name: 'My API Key',
        permissions: ['read:events'] as ApiKeyPermission[]
      }
      const result = createApiKeySchema.safeParse(createData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.rateLimit).toBe(DEFAULT_RATE_LIMIT)
      }
    })
  })

  describe('updateApiKeySchema', () => {
    it('should validate partial update', () => {
      const updateData = { name: 'Updated Name' }
      const result = updateApiKeySchema.safeParse(updateData)
      expect(result.success).toBe(true)
    })

    it('should validate permissions update', () => {
      const updateData = { permissions: ['read:speakers'] as ApiKeyPermission[] }
      const result = updateApiKeySchema.safeParse(updateData)
      expect(result.success).toBe(true)
    })

    it('should reject empty permissions array', () => {
      const invalid = { permissions: [] }
      const result = updateApiKeySchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })
  })

  describe('isApiKeyExpired', () => {
    it('should return false for non-expired key', () => {
      expect(isApiKeyExpired(validApiKey)).toBe(false)
    })

    it('should return true for expired key', () => {
      const expired = { ...validApiKey, expiresAt: new Date('2024-01-01T12:00:00Z') }
      expect(isApiKeyExpired(expired)).toBe(true)
    })

    it('should return false for key without expiry', () => {
      const noExpiry = { ...validApiKey, expiresAt: undefined }
      expect(isApiKeyExpired(noExpiry)).toBe(false)
    })
  })

  describe('isApiKeyValid', () => {
    it('should return true for active non-expired key', () => {
      expect(isApiKeyValid(validApiKey)).toBe(true)
    })

    it('should return false for inactive key', () => {
      const inactive = { ...validApiKey, isActive: false }
      expect(isApiKeyValid(inactive)).toBe(false)
    })

    it('should return false for expired key', () => {
      const expired = { ...validApiKey, expiresAt: new Date('2024-01-01T12:00:00Z') }
      expect(isApiKeyValid(expired)).toBe(false)
    })

    it('should return false for inactive expired key', () => {
      const invalid = {
        ...validApiKey,
        isActive: false,
        expiresAt: new Date('2024-01-01T12:00:00Z')
      }
      expect(isApiKeyValid(invalid)).toBe(false)
    })
  })

  describe('getApiKeyExpiryDate', () => {
    it('should return date API_KEY_EXPIRY_DAYS in future by default', () => {
      const expiry = getApiKeyExpiryDate()
      const expected = new Date(now)
      expected.setDate(expected.getDate() + API_KEY_EXPIRY_DAYS)
      expect(expiry.getTime()).toBe(expected.getTime())
    })

    it('should return date with custom days', () => {
      const expiry = getApiKeyExpiryDate(30)
      const expected = new Date(now)
      expected.setDate(expected.getDate() + 30)
      expect(expiry.getTime()).toBe(expected.getTime())
    })
  })

  describe('getDaysUntilExpiry', () => {
    it('should return correct days until expiry', () => {
      const days = getDaysUntilExpiry(validApiKey)
      expect(days).toBe(365)
    })

    it('should return null for key without expiry', () => {
      const noExpiry = { ...validApiKey, expiresAt: undefined }
      expect(getDaysUntilExpiry(noExpiry)).toBe(null)
    })

    it('should return negative for expired key', () => {
      const expired = { ...validApiKey, expiresAt: new Date('2024-06-10T12:00:00Z') }
      const days = getDaysUntilExpiry(expired)
      expect(days).toBeLessThan(0)
    })
  })

  describe('isApiKeyExpiringSoon', () => {
    it('should return true when expiring within threshold', () => {
      const expiringSoon = { ...validApiKey, expiresAt: new Date('2024-07-10T12:00:00Z') }
      expect(isApiKeyExpiringSoon(expiringSoon, 30)).toBe(true)
    })

    it('should return false when not expiring soon', () => {
      expect(isApiKeyExpiringSoon(validApiKey, 30)).toBe(false)
    })

    it('should return false for already expired key', () => {
      const expired = { ...validApiKey, expiresAt: new Date('2024-06-10T12:00:00Z') }
      expect(isApiKeyExpiringSoon(expired, 30)).toBe(false)
    })

    it('should return false for key without expiry', () => {
      const noExpiry = { ...validApiKey, expiresAt: undefined }
      expect(isApiKeyExpiringSoon(noExpiry)).toBe(false)
    })

    it('should use default threshold of 30 days', () => {
      const expiringSoon = { ...validApiKey, expiresAt: new Date('2024-07-10T12:00:00Z') }
      expect(isApiKeyExpiringSoon(expiringSoon)).toBe(true)
    })
  })

  describe('hasPermission', () => {
    it('should return true if key has permission', () => {
      expect(hasPermission(validApiKey, 'read:events')).toBe(true)
    })

    it('should return false if key lacks permission', () => {
      expect(hasPermission(validApiKey, 'read:speakers')).toBe(false)
    })
  })

  describe('hasAnyPermission', () => {
    it('should return true if key has any of the permissions', () => {
      expect(hasAnyPermission(validApiKey, ['read:events', 'read:speakers'])).toBe(true)
    })

    it('should return false if key has none of the permissions', () => {
      expect(hasAnyPermission(validApiKey, ['read:speakers', 'read:talks'])).toBe(false)
    })
  })

  describe('hasAllPermissions', () => {
    it('should return true if key has all permissions', () => {
      expect(hasAllPermissions(validApiKey, ['read:events', 'read:editions'])).toBe(true)
    })

    it('should return false if key lacks any permission', () => {
      expect(hasAllPermissions(validApiKey, ['read:events', 'read:speakers'])).toBe(false)
    })
  })

  describe('matchesScope', () => {
    it('should match when editionId matches', () => {
      const keyWithEdition = { ...validApiKey, editionId: 'ed123' }
      expect(matchesScope(keyWithEdition, { editionId: 'ed123' })).toBe(true)
    })

    it('should not match when editionId differs', () => {
      const keyWithEdition = { ...validApiKey, editionId: 'ed123' }
      expect(matchesScope(keyWithEdition, { editionId: 'ed456' })).toBe(false)
    })

    it('should match when eventId matches', () => {
      const keyWithEvent = { ...validApiKey, eventId: 'ev123' }
      expect(matchesScope(keyWithEvent, { eventId: 'ev123' })).toBe(true)
    })

    it('should match when organizationId matches', () => {
      expect(matchesScope(validApiKey, { organizationId: 'org123' })).toBe(true)
    })

    it('should match when key has no scope restrictions', () => {
      const unscoped = {
        ...validApiKey,
        organizationId: undefined,
        eventId: undefined,
        editionId: undefined
      }
      expect(matchesScope(unscoped, { organizationId: 'any' })).toBe(true)
    })
  })

  describe('getPermissionLabel', () => {
    it('should return correct label for read:organizations', () => {
      expect(getPermissionLabel('read:organizations')).toBe('Read Organizations')
    })

    it('should return correct label for write:orders', () => {
      expect(getPermissionLabel('write:orders')).toBe('Create Orders')
    })
  })

  describe('groupPermissionsByType', () => {
    it('should group permissions by read/write', () => {
      const permissions: ApiKeyPermission[] = ['read:events', 'read:speakers', 'write:orders']
      const grouped = groupPermissionsByType(permissions)
      expect(grouped.read).toEqual(['read:events', 'read:speakers'])
      expect(grouped.write).toEqual(['write:orders'])
    })

    it('should handle empty arrays', () => {
      const grouped = groupPermissionsByType([])
      expect(grouped.read).toEqual([])
      expect(grouped.write).toEqual([])
    })
  })
})
