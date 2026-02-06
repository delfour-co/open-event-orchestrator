import type PocketBase from 'pocketbase'
import { type SponsorToken, buildPortalUrl, isTokenValid } from '../domain'
import type { EditionSponsorExpanded } from '../domain'
import { createEditionSponsorRepository } from '../infra/edition-sponsor-repository'
import { createSponsorTokenRepository } from '../infra/sponsor-token-repository'

export interface ValidateTokenResult {
  valid: boolean
  editionSponsor?: EditionSponsorExpanded
  token?: SponsorToken
  error?: string
}

export const createSponsorTokenService = (pb: PocketBase) => {
  const tokenRepo = createSponsorTokenRepository(pb)
  const editionSponsorRepo = createEditionSponsorRepository(pb)

  return {
    async generatePortalLink(
      editionSponsorId: string,
      editionSlug: string,
      baseUrl: string
    ): Promise<string> {
      // Check for existing valid token
      let token = await tokenRepo.findValidByEditionSponsor(editionSponsorId)

      // Create new token if none exists
      if (!token) {
        token = await tokenRepo.create(editionSponsorId)
      }

      return buildPortalUrl(baseUrl, editionSlug, token.token)
    },

    async validateToken(tokenString: string): Promise<ValidateTokenResult> {
      const token = await tokenRepo.findByToken(tokenString)

      if (!token) {
        return { valid: false, error: 'Token not found' }
      }

      if (!isTokenValid(token)) {
        return { valid: false, error: 'Token has expired' }
      }

      const editionSponsor = await editionSponsorRepo.findByIdWithExpand(token.editionSponsorId)

      if (!editionSponsor) {
        return { valid: false, error: 'Sponsor not found' }
      }

      // Update last used timestamp
      await tokenRepo.updateLastUsed(token.id)

      return { valid: true, editionSponsor, token }
    },

    async refreshToken(editionSponsorId: string, expiryDays?: number): Promise<SponsorToken> {
      return tokenRepo.refreshToken(editionSponsorId, expiryDays)
    },

    async getOrCreateToken(editionSponsorId: string): Promise<SponsorToken> {
      const existing = await tokenRepo.findValidByEditionSponsor(editionSponsorId)
      if (existing) {
        return existing
      }
      return tokenRepo.create(editionSponsorId)
    },

    async revokeToken(editionSponsorId: string): Promise<void> {
      await tokenRepo.deleteByEditionSponsor(editionSponsorId)
    }
  }
}

export type SponsorTokenService = ReturnType<typeof createSponsorTokenService>
