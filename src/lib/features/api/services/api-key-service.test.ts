import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ApiKey, CreateApiKey } from '../domain'
import { createApiKeyService } from './api-key-service'

// Mock the repository module
vi.mock('../infra', () => ({
  createApiKeyRepository: vi.fn()
}))

import { createApiKeyRepository } from '../infra'

describe('ApiKeyService', () => {
  let mockPb: unknown
  let mockRepo: {
    create: ReturnType<typeof vi.fn>
    validateKey: ReturnType<typeof vi.fn>
    revoke: ReturnType<typeof vi.fn>
    reactivate: ReturnType<typeof vi.fn>
    delete: ReturnType<typeof vi.fn>
    findAllByOrganization: ReturnType<typeof vi.fn>
    findAllByEvent: ReturnType<typeof vi.fn>
    findAllByEdition: ReturnType<typeof vi.fn>
    findById: ReturnType<typeof vi.fn>
  }
  let apiKeyService: ReturnType<typeof createApiKeyService>

  const createMockApiKey = (overrides?: Partial<ApiKey>): ApiKey => ({
    id: 'key-1',
    name: 'Test Key',
    keyHash: 'hash123',
    keyPrefix: 'oeo_live_ab',
    permissions: ['read:events', 'read:editions'],
    rateLimit: 60,
    isActive: true,
    createdBy: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  })

  beforeEach(() => {
    mockPb = {}
    mockRepo = {
      create: vi.fn(),
      validateKey: vi.fn(),
      revoke: vi.fn(),
      reactivate: vi.fn(),
      delete: vi.fn(),
      findAllByOrganization: vi.fn(),
      findAllByEvent: vi.fn(),
      findAllByEdition: vi.fn(),
      findById: vi.fn()
    }

    vi.mocked(createApiKeyRepository).mockReturnValue(
      mockRepo as unknown as ReturnType<typeof createApiKeyRepository>
    )

    apiKeyService = createApiKeyService(mockPb as never)
  })

  describe('generate', () => {
    it('should generate a new API key', async () => {
      const input: CreateApiKey = {
        name: 'Test Key',
        permissions: ['read:events'],
        rateLimit: 60
      }
      const mockKey = createMockApiKey()
      const plainTextKey = 'oeo_live_abc123xyz'

      mockRepo.create.mockResolvedValue({ apiKey: mockKey, plainTextKey })

      const result = await apiKeyService.generate(input, 'user-1')

      expect(result.apiKey).toEqual(mockKey)
      expect(result.plainTextKey).toBe(plainTextKey)
      expect(mockRepo.create).toHaveBeenCalledWith(input, 'user-1')
    })
  })

  describe('validate', () => {
    it('should return valid result for active key', async () => {
      const mockKey = createMockApiKey({ organizationId: 'org-1' })

      mockRepo.validateKey.mockResolvedValue({ valid: true, apiKey: mockKey })

      const result = await apiKeyService.validate('oeo_live_abc123')

      expect(result.valid).toBe(true)
      expect(result.apiKey).toEqual(mockKey)
      expect(result.scope).toEqual({
        organizationId: 'org-1',
        eventId: undefined,
        editionId: undefined
      })
    })

    it('should return invalid for non-existent key', async () => {
      mockRepo.validateKey.mockResolvedValue({ valid: false, error: 'Key not found' })

      const result = await apiKeyService.validate('invalid_key')

      expect(result.valid).toBe(false)
      expect(result.error).toBe('Key not found')
    })

    it('should return invalid for inactive key', async () => {
      const mockKey = createMockApiKey({ isActive: false })

      mockRepo.validateKey.mockResolvedValue({ valid: true, apiKey: mockKey })

      const result = await apiKeyService.validate('oeo_live_abc123')

      expect(result.valid).toBe(false)
      expect(result.error).toBe('API key is not valid')
    })

    it('should return invalid for expired key', async () => {
      const mockKey = createMockApiKey({
        expiresAt: new Date(Date.now() - 1000)
      })

      mockRepo.validateKey.mockResolvedValue({ valid: true, apiKey: mockKey })

      const result = await apiKeyService.validate('oeo_live_abc123')

      expect(result.valid).toBe(false)
      expect(result.error).toBe('API key is not valid')
    })
  })

  describe('revoke', () => {
    it('should revoke an API key', async () => {
      mockRepo.revoke.mockResolvedValue(undefined)

      await apiKeyService.revoke('key-1')

      expect(mockRepo.revoke).toHaveBeenCalledWith('key-1')
    })
  })

  describe('reactivate', () => {
    it('should reactivate an API key', async () => {
      mockRepo.reactivate.mockResolvedValue(undefined)

      await apiKeyService.reactivate('key-1')

      expect(mockRepo.reactivate).toHaveBeenCalledWith('key-1')
    })
  })

  describe('delete', () => {
    it('should delete an API key', async () => {
      mockRepo.delete.mockResolvedValue(undefined)

      await apiKeyService.delete('key-1')

      expect(mockRepo.delete).toHaveBeenCalledWith('key-1')
    })
  })

  describe('listByOrganization', () => {
    it('should list API keys by organization', async () => {
      const mockKeys = [createMockApiKey(), createMockApiKey({ id: 'key-2' })]

      mockRepo.findAllByOrganization.mockResolvedValue(mockKeys)

      const result = await apiKeyService.listByOrganization('org-1')

      expect(result).toEqual(mockKeys)
      expect(mockRepo.findAllByOrganization).toHaveBeenCalledWith('org-1')
    })
  })

  describe('listByEvent', () => {
    it('should list API keys by event', async () => {
      const mockKeys = [createMockApiKey()]

      mockRepo.findAllByEvent.mockResolvedValue(mockKeys)

      const result = await apiKeyService.listByEvent('event-1')

      expect(result).toEqual(mockKeys)
      expect(mockRepo.findAllByEvent).toHaveBeenCalledWith('event-1')
    })
  })

  describe('listByEdition', () => {
    it('should list API keys by edition', async () => {
      const mockKeys = [createMockApiKey()]

      mockRepo.findAllByEdition.mockResolvedValue(mockKeys)

      const result = await apiKeyService.listByEdition('edition-1')

      expect(result).toEqual(mockKeys)
      expect(mockRepo.findAllByEdition).toHaveBeenCalledWith('edition-1')
    })
  })

  describe('getById', () => {
    it('should get API key by id', async () => {
      const mockKey = createMockApiKey()

      mockRepo.findById.mockResolvedValue(mockKey)

      const result = await apiKeyService.getById('key-1')

      expect(result).toEqual(mockKey)
      expect(mockRepo.findById).toHaveBeenCalledWith('key-1')
    })

    it('should return null when key not found', async () => {
      mockRepo.findById.mockResolvedValue(null)

      const result = await apiKeyService.getById('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('checkPermission', () => {
    it('should return true when key has permission', () => {
      const apiKey = createMockApiKey({ permissions: ['read:events', 'read:editions'] })

      expect(apiKeyService.checkPermission(apiKey, 'read:events')).toBe(true)
    })

    it('should return false when key lacks permission', () => {
      const apiKey = createMockApiKey({ permissions: ['read:events'] })

      expect(apiKeyService.checkPermission(apiKey, 'read:speakers')).toBe(false)
    })
  })

  describe('checkScope', () => {
    it('should return true when key has no scope restrictions', () => {
      const apiKey = createMockApiKey()

      expect(apiKeyService.checkScope(apiKey, { organizationId: 'org-1' })).toBe(true)
    })

    it('should return true when scope matches', () => {
      const apiKey = createMockApiKey({ organizationId: 'org-1' })

      expect(apiKeyService.checkScope(apiKey, { organizationId: 'org-1' })).toBe(true)
    })

    it('should return false when scope does not match', () => {
      const apiKey = createMockApiKey({ organizationId: 'org-1' })

      expect(apiKeyService.checkScope(apiKey, { organizationId: 'org-2' })).toBe(false)
    })
  })

  describe('checkAccess', () => {
    it('should allow access when all checks pass', async () => {
      const apiKey = createMockApiKey({
        permissions: ['read:events'],
        organizationId: 'org-1'
      })

      const result = await apiKeyService.checkAccess(apiKey, 'read:events', {
        organizationId: 'org-1'
      })

      expect(result.allowed).toBe(true)
    })

    it('should deny access for inactive key', async () => {
      const apiKey = createMockApiKey({ isActive: false })

      const result = await apiKeyService.checkAccess(apiKey, 'read:events', {
        organizationId: 'org-1'
      })

      expect(result.allowed).toBe(false)
      expect(result.error).toContain('not valid')
    })

    it('should deny access for missing permission', async () => {
      const apiKey = createMockApiKey({ permissions: ['read:events'] })

      const result = await apiKeyService.checkAccess(apiKey, 'read:speakers', {
        organizationId: 'org-1'
      })

      expect(result.allowed).toBe(false)
      expect(result.error).toContain('Missing permission')
    })

    it('should deny access for mismatched scope', async () => {
      const apiKey = createMockApiKey({
        permissions: ['read:events'],
        organizationId: 'org-1'
      })

      const result = await apiKeyService.checkAccess(apiKey, 'read:events', {
        organizationId: 'org-2'
      })

      expect(result.allowed).toBe(false)
      expect(result.error).toContain('does not have access')
    })
  })
})
