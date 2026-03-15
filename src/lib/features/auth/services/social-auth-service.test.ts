import type PocketBase from 'pocketbase'
import { describe, expect, it, vi } from 'vitest'
import {
  getAvailableProviders,
  getLinkedAccounts,
  getProviderLabel,
  unlinkAccount
} from './social-auth-service'

function createMockPb(overrides: Record<string, unknown> = {}): PocketBase {
  return {
    collection: vi.fn().mockReturnValue({
      getList: vi.fn(),
      getFirstListItem: vi.fn(),
      listExternalAuths: vi.fn(),
      unlinkExternalAuth: vi.fn(),
      ...overrides
    })
  } as unknown as PocketBase
}

describe('Social Auth Service', () => {
  describe('getAvailableProviders', () => {
    it('should return providers when oauth2 is enabled and configured', async () => {
      const mockPb = createMockPb({
        getList: vi.fn().mockResolvedValue({
          items: [
            {
              oauth2Enabled: true,
              googleOAuthClientId: 'google-client-id',
              githubOAuthClientId: 'github-client-id'
            }
          ]
        })
      })

      const result = await getAvailableProviders(mockPb)

      expect(result).toEqual(['google', 'github'])
      expect(mockPb.collection).toHaveBeenCalledWith('app_settings')
    })

    it('should return only google when only google is configured', async () => {
      const mockPb = createMockPb({
        getList: vi.fn().mockResolvedValue({
          items: [
            {
              oauth2Enabled: true,
              googleOAuthClientId: 'google-client-id',
              githubOAuthClientId: ''
            }
          ]
        })
      })

      const result = await getAvailableProviders(mockPb)

      expect(result).toEqual(['google'])
    })

    it('should return empty array when oauth2 is disabled', async () => {
      const mockPb = createMockPb({
        getList: vi.fn().mockResolvedValue({
          items: [
            {
              oauth2Enabled: false,
              googleOAuthClientId: 'google-client-id',
              githubOAuthClientId: 'github-client-id'
            }
          ]
        })
      })

      const result = await getAvailableProviders(mockPb)

      expect(result).toEqual([])
    })

    it('should return empty array when no settings exist', async () => {
      const mockPb = createMockPb({
        getList: vi.fn().mockResolvedValue({ items: [] })
      })

      const result = await getAvailableProviders(mockPb)

      expect(result).toEqual([])
    })

    it('should return empty array on error', async () => {
      const mockPb = createMockPb({
        getList: vi.fn().mockRejectedValue(new Error('DB error'))
      })

      const result = await getAvailableProviders(mockPb)

      expect(result).toEqual([])
    })
  })

  describe('getProviderLabel', () => {
    it('should return Google for google provider', () => {
      expect(getProviderLabel('google')).toBe('Google')
    })

    it('should return GitHub for github provider', () => {
      expect(getProviderLabel('github')).toBe('GitHub')
    })

    it('should return the raw provider name for unknown providers', () => {
      expect(getProviderLabel('gitlab')).toBe('gitlab')
    })
  })

  describe('getLinkedAccounts', () => {
    it('should return mapped linked accounts', async () => {
      const mockPb = createMockPb({
        listExternalAuths: vi.fn().mockResolvedValue([
          { id: 'auth1', provider: 'google', providerId: 'g-123', extra: 'data' },
          { id: 'auth2', provider: 'github', providerId: 'gh-456', extra: 'data' }
        ])
      })

      const result = await getLinkedAccounts(mockPb, 'user-id')

      expect(result).toEqual([
        { id: 'auth1', provider: 'google', providerId: 'g-123' },
        { id: 'auth2', provider: 'github', providerId: 'gh-456' }
      ])
    })

    it('should return empty array on error', async () => {
      const mockPb = createMockPb({
        listExternalAuths: vi.fn().mockRejectedValue(new Error('Not found'))
      })

      const result = await getLinkedAccounts(mockPb, 'user-id')

      expect(result).toEqual([])
    })
  })

  describe('unlinkAccount', () => {
    it('should unlink account successfully', async () => {
      const mockPb = createMockPb({
        unlinkExternalAuth: vi.fn().mockResolvedValue(undefined)
      })

      const result = await unlinkAccount(mockPb, 'user-id', 'google')

      expect(result).toEqual({ success: true })
    })

    it('should handle unlink failure', async () => {
      const mockPb = createMockPb({
        unlinkExternalAuth: vi.fn().mockRejectedValue(new Error('Failed'))
      })

      const result = await unlinkAccount(mockPb, 'user-id', 'google')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to unlink account')
    })
  })
})
