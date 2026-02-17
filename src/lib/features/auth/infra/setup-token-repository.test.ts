import { describe, expect, it, vi } from 'vitest'
import { createSetupTokenRepository } from './setup-token-repository'

const createMockPocketBase = () => {
  const mockRecord = {
    id: 'token-123',
    token: 'a'.repeat(48),
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    used: false,
    usedAt: null,
    created: new Date().toISOString(),
    updated: new Date().toISOString()
  }

  return {
    collection: vi.fn().mockReturnValue({
      getFirstListItem: vi.fn().mockResolvedValue(mockRecord),
      getFullList: vi.fn().mockResolvedValue([mockRecord]),
      create: vi.fn().mockResolvedValue(mockRecord),
      update: vi
        .fn()
        .mockResolvedValue({ ...mockRecord, used: true, usedAt: new Date().toISOString() }),
      delete: vi.fn().mockResolvedValue(undefined)
    }),
    mockRecord
  }
}

describe('createSetupTokenRepository', () => {
  describe('create', () => {
    it('creates token with expiration date', async () => {
      const { collection, mockRecord } = createMockPocketBase()
      // biome-ignore lint/suspicious/noExplicitAny: Mock PocketBase for testing
      const repo = createSetupTokenRepository({ collection } as any)

      const token = 'b'.repeat(48)
      const expiresAt = new Date(Date.now() + 86400000)

      const result = await repo.create(token, expiresAt)

      expect(collection().create).toHaveBeenCalledWith({
        token,
        expiresAt: expiresAt.toISOString(),
        used: false
      })
      expect(result.id).toBe(mockRecord.id)
    })
  })

  describe('findByToken', () => {
    it('returns token when found', async () => {
      const { collection, mockRecord } = createMockPocketBase()
      // biome-ignore lint/suspicious/noExplicitAny: Mock PocketBase for testing
      const repo = createSetupTokenRepository({ collection } as any)

      const result = await repo.findByToken(mockRecord.token)

      expect(result).not.toBeNull()
      expect(result?.token).toBe(mockRecord.token)
      expect(collection().getFirstListItem).toHaveBeenCalledWith(`token="${mockRecord.token}"`)
    })

    it('returns null when not found', async () => {
      const pb = {
        collection: vi.fn().mockReturnValue({
          getFirstListItem: vi.fn().mockRejectedValue(new Error('Not found'))
        })
      }
      // biome-ignore lint/suspicious/noExplicitAny: Mock PocketBase for testing
      const repo = createSetupTokenRepository(pb as any)

      const result = await repo.findByToken('nonexistent')

      expect(result).toBeNull()
    })

    it('parses dates correctly', async () => {
      const { collection } = createMockPocketBase()
      // biome-ignore lint/suspicious/noExplicitAny: Mock PocketBase for testing
      const repo = createSetupTokenRepository({ collection } as any)

      const result = await repo.findByToken('a'.repeat(48))

      expect(result?.expiresAt).toBeInstanceOf(Date)
      expect(result?.createdAt).toBeInstanceOf(Date)
      expect(result?.updatedAt).toBeInstanceOf(Date)
    })
  })

  describe('markAsUsed', () => {
    it('marks token as used with timestamp', async () => {
      const { collection } = createMockPocketBase()
      // biome-ignore lint/suspicious/noExplicitAny: Mock PocketBase for testing
      const repo = createSetupTokenRepository({ collection } as any)

      const result = await repo.markAsUsed('token-123')

      expect(collection().update).toHaveBeenCalledWith('token-123', {
        used: true,
        usedAt: expect.any(String)
      })
      expect(result.used).toBe(true)
    })
  })

  describe('deleteExpired', () => {
    it('deletes expired and used tokens', async () => {
      const expiredTokens = [{ id: 'expired-1' }, { id: 'expired-2' }]
      const pb = {
        collection: vi.fn().mockReturnValue({
          getFullList: vi.fn().mockResolvedValue(expiredTokens),
          delete: vi.fn().mockResolvedValue(undefined)
        })
      }
      // biome-ignore lint/suspicious/noExplicitAny: Mock PocketBase for testing
      const repo = createSetupTokenRepository(pb as any)

      const count = await repo.deleteExpired()

      expect(count).toBe(2)
      expect(pb.collection().delete).toHaveBeenCalledTimes(2)
      expect(pb.collection().delete).toHaveBeenCalledWith('expired-1')
      expect(pb.collection().delete).toHaveBeenCalledWith('expired-2')
    })

    it('returns 0 when no expired tokens', async () => {
      const pb = {
        collection: vi.fn().mockReturnValue({
          getFullList: vi.fn().mockResolvedValue([]),
          delete: vi.fn()
        })
      }
      // biome-ignore lint/suspicious/noExplicitAny: Mock PocketBase for testing
      const repo = createSetupTokenRepository(pb as any)

      const count = await repo.deleteExpired()

      expect(count).toBe(0)
      expect(pb.collection().delete).not.toHaveBeenCalled()
    })

    it('returns 0 when getFullList fails', async () => {
      const pb = {
        collection: vi.fn().mockReturnValue({
          getFullList: vi.fn().mockRejectedValue(new Error('Database error'))
        })
      }
      // biome-ignore lint/suspicious/noExplicitAny: Mock PocketBase for testing
      const repo = createSetupTokenRepository(pb as any)

      const count = await repo.deleteExpired()

      expect(count).toBe(0)
    })
  })

  describe('hasValidToken', () => {
    it('returns true when valid token exists', async () => {
      const { collection } = createMockPocketBase()
      // biome-ignore lint/suspicious/noExplicitAny: Mock PocketBase for testing
      const repo = createSetupTokenRepository({ collection } as any)

      const result = await repo.hasValidToken()

      expect(result).toBe(true)
      expect(collection().getFirstListItem).toHaveBeenCalledWith(
        expect.stringContaining('used = false')
      )
    })

    it('returns false when no valid token exists', async () => {
      const pb = {
        collection: vi.fn().mockReturnValue({
          getFirstListItem: vi.fn().mockRejectedValue(new Error('Not found'))
        })
      }
      // biome-ignore lint/suspicious/noExplicitAny: Mock PocketBase for testing
      const repo = createSetupTokenRepository(pb as any)

      const result = await repo.hasValidToken()

      expect(result).toBe(false)
    })
  })
})
