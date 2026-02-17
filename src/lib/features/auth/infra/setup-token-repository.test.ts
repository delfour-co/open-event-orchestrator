import * as fs from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSetupTokenRepository } from './setup-token-repository'

vi.mock('node:fs')

describe('createSetupTokenRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('create', () => {
    it('creates token file with token data', async () => {
      const repo = createSetupTokenRepository()
      const token = 'a'.repeat(48)
      const expiresAt = new Date(Date.now() + 86400000)

      const result = await repo.create(token, expiresAt)

      expect(fs.writeFileSync).toHaveBeenCalledTimes(1)
      expect(result.token).toBe(token)
      expect(result.expiresAt.getTime()).toBe(expiresAt.getTime())
      expect(result.used).toBe(false)
      expect(result.id).toBeDefined()
    })

    it('generates unique id for token', async () => {
      const repo = createSetupTokenRepository()
      const token = 'b'.repeat(48)
      const expiresAt = new Date(Date.now() + 86400000)

      const result = await repo.create(token, expiresAt)

      expect(result.id).toMatch(/^[a-z0-9]+$/)
      expect(result.id.length).toBeGreaterThan(0)
    })
  })

  describe('findByToken', () => {
    it('returns token when file exists and token matches', async () => {
      const storedToken = {
        id: 'token-123',
        token: 'a'.repeat(48),
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        used: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      vi.mocked(fs.existsSync).mockReturnValue(true)
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(storedToken))

      const repo = createSetupTokenRepository()
      const result = await repo.findByToken(storedToken.token)

      expect(result).not.toBeNull()
      expect(result?.token).toBe(storedToken.token)
      expect(result?.id).toBe(storedToken.id)
    })

    it('returns null when file does not exist', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false)

      const repo = createSetupTokenRepository()
      const result = await repo.findByToken('nonexistent')

      expect(result).toBeNull()
    })

    it('returns null when token does not match', async () => {
      const storedToken = {
        id: 'token-123',
        token: 'a'.repeat(48),
        expiresAt: new Date().toISOString(),
        used: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      vi.mocked(fs.existsSync).mockReturnValue(true)
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(storedToken))

      const repo = createSetupTokenRepository()
      const result = await repo.findByToken('different-token')

      expect(result).toBeNull()
    })

    it('parses dates correctly', async () => {
      const storedToken = {
        id: 'token-123',
        token: 'a'.repeat(48),
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        used: false,
        usedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      vi.mocked(fs.existsSync).mockReturnValue(true)
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(storedToken))

      const repo = createSetupTokenRepository()
      const result = await repo.findByToken(storedToken.token)

      expect(result?.expiresAt).toBeInstanceOf(Date)
      expect(result?.createdAt).toBeInstanceOf(Date)
      expect(result?.updatedAt).toBeInstanceOf(Date)
      expect(result?.usedAt).toBeInstanceOf(Date)
    })
  })

  describe('markAsUsed', () => {
    it('marks token as used with timestamp', async () => {
      const storedToken = {
        id: 'token-123',
        token: 'a'.repeat(48),
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        used: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      vi.mocked(fs.existsSync).mockReturnValue(true)
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(storedToken))

      const repo = createSetupTokenRepository()
      const result = await repo.markAsUsed('token-123')

      expect(result.used).toBe(true)
      expect(result.usedAt).toBeInstanceOf(Date)
      expect(fs.writeFileSync).toHaveBeenCalled()
    })

    it('throws when token id does not match', async () => {
      const storedToken = {
        id: 'token-123',
        token: 'a'.repeat(48),
        expiresAt: new Date().toISOString(),
        used: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      vi.mocked(fs.existsSync).mockReturnValue(true)
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(storedToken))

      const repo = createSetupTokenRepository()

      await expect(repo.markAsUsed('wrong-id')).rejects.toThrow('Token not found')
    })
  })

  describe('deleteExpired', () => {
    it('deletes file when token is expired', async () => {
      const storedToken = {
        id: 'token-123',
        token: 'a'.repeat(48),
        expiresAt: new Date(Date.now() - 86400000).toISOString(), // Expired
        used: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      vi.mocked(fs.existsSync).mockReturnValue(true)
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(storedToken))

      const repo = createSetupTokenRepository()
      const count = await repo.deleteExpired()

      expect(count).toBe(1)
      expect(fs.unlinkSync).toHaveBeenCalled()
    })

    it('deletes file when token is used', async () => {
      const storedToken = {
        id: 'token-123',
        token: 'a'.repeat(48),
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        used: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      vi.mocked(fs.existsSync).mockReturnValue(true)
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(storedToken))

      const repo = createSetupTokenRepository()
      const count = await repo.deleteExpired()

      expect(count).toBe(1)
      expect(fs.unlinkSync).toHaveBeenCalled()
    })

    it('returns 0 when no file exists', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false)

      const repo = createSetupTokenRepository()
      const count = await repo.deleteExpired()

      expect(count).toBe(0)
      expect(fs.unlinkSync).not.toHaveBeenCalled()
    })

    it('returns 0 when token is still valid', async () => {
      const storedToken = {
        id: 'token-123',
        token: 'a'.repeat(48),
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        used: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      vi.mocked(fs.existsSync).mockReturnValue(true)
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(storedToken))

      const repo = createSetupTokenRepository()
      const count = await repo.deleteExpired()

      expect(count).toBe(0)
      expect(fs.unlinkSync).not.toHaveBeenCalled()
    })
  })

  describe('hasValidToken', () => {
    it('returns true when valid token exists', async () => {
      const storedToken = {
        id: 'token-123',
        token: 'a'.repeat(48),
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        used: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      vi.mocked(fs.existsSync).mockReturnValue(true)
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(storedToken))

      const repo = createSetupTokenRepository()
      const result = await repo.hasValidToken()

      expect(result).toBe(true)
    })

    it('returns false when no file exists', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false)

      const repo = createSetupTokenRepository()
      const result = await repo.hasValidToken()

      expect(result).toBe(false)
    })

    it('returns false when token is expired', async () => {
      const storedToken = {
        id: 'token-123',
        token: 'a'.repeat(48),
        expiresAt: new Date(Date.now() - 86400000).toISOString(),
        used: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      vi.mocked(fs.existsSync).mockReturnValue(true)
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(storedToken))

      const repo = createSetupTokenRepository()
      const result = await repo.hasValidToken()

      expect(result).toBe(false)
    })

    it('returns false when token is used', async () => {
      const storedToken = {
        id: 'token-123',
        token: 'a'.repeat(48),
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        used: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      vi.mocked(fs.existsSync).mockReturnValue(true)
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(storedToken))

      const repo = createSetupTokenRepository()
      const result = await repo.hasValidToken()

      expect(result).toBe(false)
    })
  })

  describe('deleteAll', () => {
    it('deletes the token file', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true)

      const repo = createSetupTokenRepository()
      await repo.deleteAll()

      expect(fs.unlinkSync).toHaveBeenCalled()
    })

    it('does nothing when file does not exist', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false)

      const repo = createSetupTokenRepository()
      await repo.deleteAll()

      expect(fs.unlinkSync).not.toHaveBeenCalled()
    })
  })
})
