import type PocketBase from 'pocketbase'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSponsorTokenService } from './sponsor-token-service'

// Mock the repositories
vi.mock('../infra/sponsor-token-repository', () => ({
  createSponsorTokenRepository: vi.fn()
}))

vi.mock('../infra/edition-sponsor-repository', () => ({
  createEditionSponsorRepository: vi.fn()
}))

import { createEditionSponsorRepository } from '../infra/edition-sponsor-repository'
import { createSponsorTokenRepository } from '../infra/sponsor-token-repository'

describe('SponsorTokenService', () => {
  let mockPb: PocketBase
  let mockTokenRepo: ReturnType<typeof vi.fn>
  let mockEditionSponsorRepo: ReturnType<typeof vi.fn>
  let service: ReturnType<typeof createSponsorTokenService>

  const mockToken = {
    id: 'token-1',
    editionSponsorId: 'es-1',
    token: 'abc123def456',
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    createdAt: new Date(),
    updatedAt: new Date()
  }

  const mockEditionSponsor = {
    id: 'es-1',
    editionId: 'edition-1',
    sponsorId: 'sponsor-1',
    status: 'confirmed',
    sponsor: {
      id: 'sponsor-1',
      name: 'Acme Corp',
      contactEmail: 'john@acme.com'
    }
  }

  beforeEach(() => {
    mockPb = {} as PocketBase

    mockTokenRepo = {
      findByToken: vi.fn(),
      findValidByEditionSponsor: vi.fn(),
      create: vi.fn(),
      updateLastUsed: vi.fn(),
      refreshToken: vi.fn(),
      deleteByEditionSponsor: vi.fn()
    }

    mockEditionSponsorRepo = {
      findByIdWithExpand: vi.fn()
    }

    vi.mocked(createSponsorTokenRepository).mockReturnValue(mockTokenRepo)
    vi.mocked(createEditionSponsorRepository).mockReturnValue(mockEditionSponsorRepo)

    service = createSponsorTokenService(mockPb)
  })

  describe('generatePortalLink', () => {
    it('should return existing valid token link', async () => {
      mockTokenRepo.findValidByEditionSponsor.mockResolvedValue(mockToken)

      const result = await service.generatePortalLink(
        'es-1',
        'tech-conf-2024',
        'https://example.com'
      )

      expect(result).toBe('https://example.com/sponsor/tech-conf-2024/portal?token=abc123def456')
      expect(mockTokenRepo.create).not.toHaveBeenCalled()
    })

    it('should create new token when none exists', async () => {
      mockTokenRepo.findValidByEditionSponsor.mockResolvedValue(null)
      mockTokenRepo.create.mockResolvedValue(mockToken)

      const result = await service.generatePortalLink(
        'es-1',
        'tech-conf-2024',
        'https://example.com'
      )

      expect(mockTokenRepo.create).toHaveBeenCalledWith('es-1')
      expect(result).toContain('abc123def456')
    })
  })

  describe('validateToken', () => {
    it('should return valid result for valid token', async () => {
      mockTokenRepo.findByToken.mockResolvedValue(mockToken)
      mockEditionSponsorRepo.findByIdWithExpand.mockResolvedValue(mockEditionSponsor)

      const result = await service.validateToken('abc123def456')

      expect(result.valid).toBe(true)
      expect(result.editionSponsor).toEqual(mockEditionSponsor)
      expect(result.token).toEqual(mockToken)
      expect(mockTokenRepo.updateLastUsed).toHaveBeenCalledWith('token-1')
    })

    it('should return invalid for non-existent token', async () => {
      mockTokenRepo.findByToken.mockResolvedValue(null)

      const result = await service.validateToken('invalid-token')

      expect(result.valid).toBe(false)
      expect(result.error).toBe('Token not found')
    })

    it('should return invalid for expired token', async () => {
      const expiredToken = {
        ...mockToken,
        expiresAt: new Date(Date.now() - 1000) // Expired
      }
      mockTokenRepo.findByToken.mockResolvedValue(expiredToken)

      const result = await service.validateToken('abc123def456')

      expect(result.valid).toBe(false)
      expect(result.error).toBe('Token has expired')
    })

    it('should return invalid when sponsor not found', async () => {
      mockTokenRepo.findByToken.mockResolvedValue(mockToken)
      mockEditionSponsorRepo.findByIdWithExpand.mockResolvedValue(null)

      const result = await service.validateToken('abc123def456')

      expect(result.valid).toBe(false)
      expect(result.error).toBe('Sponsor not found')
    })
  })

  describe('refreshToken', () => {
    it('should call repository to refresh token', async () => {
      const newToken = { ...mockToken, token: 'newtoken123' }
      mockTokenRepo.refreshToken.mockResolvedValue(newToken)

      const result = await service.refreshToken('es-1', 60)

      expect(mockTokenRepo.refreshToken).toHaveBeenCalledWith('es-1', 60)
      expect(result.token).toBe('newtoken123')
    })
  })

  describe('getOrCreateToken', () => {
    it('should return existing valid token', async () => {
      mockTokenRepo.findValidByEditionSponsor.mockResolvedValue(mockToken)

      const result = await service.getOrCreateToken('es-1')

      expect(result).toEqual(mockToken)
      expect(mockTokenRepo.create).not.toHaveBeenCalled()
    })

    it('should create new token when none exists', async () => {
      mockTokenRepo.findValidByEditionSponsor.mockResolvedValue(null)
      mockTokenRepo.create.mockResolvedValue(mockToken)

      const result = await service.getOrCreateToken('es-1')

      expect(mockTokenRepo.create).toHaveBeenCalledWith('es-1')
      expect(result).toEqual(mockToken)
    })
  })

  describe('revokeToken', () => {
    it('should call repository to delete token', async () => {
      mockTokenRepo.deleteByEditionSponsor.mockResolvedValue(undefined)

      await service.revokeToken('es-1')

      expect(mockTokenRepo.deleteByEditionSponsor).toHaveBeenCalledWith('es-1')
    })
  })
})
