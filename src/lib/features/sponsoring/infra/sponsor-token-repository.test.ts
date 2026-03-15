import type PocketBase from 'pocketbase'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSponsorTokenRepository } from './sponsor-token-repository'

const createMockPb = () => {
  const mockCollection = vi.fn()
  return {
    collection: mockCollection,
    _mockCollection: mockCollection
  }
}

const makeTokenRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'tok1',
  editionSponsorId: 'es1',
  token: 'abcdef1234567890',
  expiresAt: '2025-06-15T10:00:00Z',
  lastUsedAt: '',
  created: '2024-06-15T10:00:00Z',
  ...overrides
})

describe('SponsorTokenRepository', () => {
  let mockPb: ReturnType<typeof createMockPb>

  beforeEach(() => {
    mockPb = createMockPb()
  })

  describe('findByToken', () => {
    it('should return a token when found', async () => {
      const record = makeTokenRecord()
      const mockGetList = vi.fn().mockResolvedValue({ items: [record] })
      mockPb._mockCollection.mockReturnValue({ getList: mockGetList })

      const repo = createSponsorTokenRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByToken('abcdef1234567890')

      expect(result?.id).toBe('tok1')
      expect(result?.token).toBe('abcdef1234567890')
    })

    it('should return null when no items found', async () => {
      const mockGetList = vi.fn().mockResolvedValue({ items: [] })
      mockPb._mockCollection.mockReturnValue({ getList: mockGetList })

      const repo = createSponsorTokenRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByToken('nonexistent')

      expect(result).toBeNull()
    })

    it('should return null on error', async () => {
      const mockGetList = vi.fn().mockRejectedValue(new Error('fail'))
      mockPb._mockCollection.mockReturnValue({ getList: mockGetList })

      const repo = createSponsorTokenRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByToken('bad')

      expect(result).toBeNull()
    })
  })

  describe('findByEditionSponsor', () => {
    it('should return the most recent token for an edition sponsor', async () => {
      const record = makeTokenRecord()
      const mockGetList = vi.fn().mockResolvedValue({ items: [record] })
      mockPb._mockCollection.mockReturnValue({ getList: mockGetList })

      const repo = createSponsorTokenRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByEditionSponsor('es1')

      expect(result?.editionSponsorId).toBe('es1')
    })

    it('should return null when no tokens exist', async () => {
      const mockGetList = vi.fn().mockResolvedValue({ items: [] })
      mockPb._mockCollection.mockReturnValue({ getList: mockGetList })

      const repo = createSponsorTokenRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByEditionSponsor('es1')

      expect(result).toBeNull()
    })
  })

  describe('findValidByEditionSponsor', () => {
    it('should return a valid non-expired token', async () => {
      const record = makeTokenRecord()
      const mockGetList = vi.fn().mockResolvedValue({ items: [record] })
      mockPb._mockCollection.mockReturnValue({ getList: mockGetList })

      const repo = createSponsorTokenRepository(mockPb as unknown as PocketBase)
      const result = await repo.findValidByEditionSponsor('es1')

      expect(result?.id).toBe('tok1')
    })

    it('should return null when no valid tokens exist', async () => {
      const mockGetList = vi.fn().mockResolvedValue({ items: [] })
      mockPb._mockCollection.mockReturnValue({ getList: mockGetList })

      const repo = createSponsorTokenRepository(mockPb as unknown as PocketBase)
      const result = await repo.findValidByEditionSponsor('es1')

      expect(result).toBeNull()
    })

    it('should return null on error', async () => {
      const mockGetList = vi.fn().mockRejectedValue(new Error('fail'))
      mockPb._mockCollection.mockReturnValue({ getList: mockGetList })

      const repo = createSponsorTokenRepository(mockPb as unknown as PocketBase)
      const result = await repo.findValidByEditionSponsor('es1')

      expect(result).toBeNull()
    })
  })

  describe('create', () => {
    it('should create a token with generated value and expiry', async () => {
      const record = makeTokenRecord()
      const mockCreate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ create: mockCreate })

      const repo = createSponsorTokenRepository(mockPb as unknown as PocketBase)
      const result = await repo.create('es1', 30)

      expect(result?.editionSponsorId).toBe('es1')
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          editionSponsorId: 'es1'
        })
      )
    })

    it('should create a token with default expiry when no days specified', async () => {
      const record = makeTokenRecord()
      const mockCreate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ create: mockCreate })

      const repo = createSponsorTokenRepository(mockPb as unknown as PocketBase)
      const result = await repo.create('es1')

      expect(result?.editionSponsorId).toBe('es1')
    })
  })

  describe('updateLastUsed', () => {
    it('should update the lastUsedAt timestamp', async () => {
      const mockUpdate = vi.fn().mockResolvedValue({})
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const repo = createSponsorTokenRepository(mockPb as unknown as PocketBase)
      await repo.updateLastUsed('tok1')

      expect(mockUpdate).toHaveBeenCalledWith(
        'tok1',
        expect.objectContaining({ lastUsedAt: expect.any(String) })
      )
    })
  })

  describe('delete', () => {
    it('should delete a token', async () => {
      const mockDelete = vi.fn().mockResolvedValue(undefined)
      mockPb._mockCollection.mockReturnValue({ delete: mockDelete })

      const repo = createSponsorTokenRepository(mockPb as unknown as PocketBase)
      await repo.delete('tok1')

      expect(mockDelete).toHaveBeenCalledWith('tok1')
    })
  })

  describe('deleteByEditionSponsor', () => {
    it('should delete all tokens for an edition sponsor', async () => {
      const records = [makeTokenRecord({ id: 'tok1' }), makeTokenRecord({ id: 'tok2' })]
      const mockGetFullList = vi.fn().mockResolvedValue(records)
      const mockDelete = vi.fn().mockResolvedValue(undefined)
      mockPb._mockCollection.mockReturnValue({
        getFullList: mockGetFullList,
        delete: mockDelete
      })

      const repo = createSponsorTokenRepository(mockPb as unknown as PocketBase)
      await repo.deleteByEditionSponsor('es1')

      expect(mockDelete).toHaveBeenCalledTimes(2)
    })
  })

  describe('refreshToken', () => {
    it('should delete existing tokens and create a new one', async () => {
      const records = [makeTokenRecord({ id: 'tok1' })]
      const mockGetFullList = vi.fn().mockResolvedValue(records)
      const mockDelete = vi.fn().mockResolvedValue(undefined)
      const newRecord = makeTokenRecord({ id: 'tok2', token: 'newtoken' })
      const mockCreate = vi.fn().mockResolvedValue(newRecord)
      mockPb._mockCollection.mockReturnValue({
        getFullList: mockGetFullList,
        delete: mockDelete,
        create: mockCreate
      })

      const repo = createSponsorTokenRepository(mockPb as unknown as PocketBase)
      const result = await repo.refreshToken('es1')

      expect(mockDelete).toHaveBeenCalledWith('tok1')
      expect(result?.id).toBe('tok2')
    })
  })
})
