import type PocketBase from 'pocketbase'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSecretLinkRepository } from './secret-link-repository'

vi.mock('../domain/secret-link', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../domain/secret-link')>()
  return {
    ...actual,
    generateSecretToken: vi.fn().mockReturnValue('cfp_mock_token_12345678901234567890')
  }
})

const createMockPb = () => {
  const mockCollection = {
    getOne: vi.fn(),
    getFullList: vi.fn(),
    getFirstListItem: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }
  return { collection: vi.fn(() => mockCollection), mockCollection }
}

const MOCK_RECORD = {
  id: 'link1',
  editionId: 'edition1',
  token: 'cfp_abcdefghijklmnopqrstuvwxyz123456',
  name: 'VIP Speaker Link',
  description: 'For invited speakers',
  expiresAt: '2024-12-31T23:59:59Z',
  maxSubmissions: 5,
  usedSubmissions: 2,
  isActive: true,
  createdBy: 'user1',
  created: '2024-01-01T00:00:00Z',
  updated: '2024-01-01T00:00:00Z'
}

describe('SecretLinkRepository', () => {
  let mockPb: ReturnType<typeof createMockPb>

  beforeEach(() => {
    mockPb = createMockPb()
    vi.clearAllMocks()
  })

  const getRepo = () => createSecretLinkRepository(mockPb as unknown as PocketBase)

  describe('findById', () => {
    it('should return a secret link when found', async () => {
      mockPb.mockCollection.getOne.mockResolvedValue(MOCK_RECORD)
      const result = await getRepo().findById('link1')

      expect(mockPb.collection).toHaveBeenCalledWith('secret_links')
      expect(result?.id).toBe('link1')
      expect(result?.token).toBe('cfp_abcdefghijklmnopqrstuvwxyz123456')
    })

    it('should return null when not found', async () => {
      mockPb.mockCollection.getOne.mockRejectedValue(new Error('Not found'))
      const result = await getRepo().findById('nonexistent')
      expect(result).toBeNull()
    })
  })

  describe('findByToken', () => {
    it('should return a link by token', async () => {
      mockPb.mockCollection.getFirstListItem.mockResolvedValue(MOCK_RECORD)
      const result = await getRepo().findByToken('cfp_abcdefghijklmnopqrstuvwxyz123456')

      expect(result?.token).toBe('cfp_abcdefghijklmnopqrstuvwxyz123456')
    })

    it('should return null when not found', async () => {
      mockPb.mockCollection.getFirstListItem.mockRejectedValue(new Error('Not found'))
      const result = await getRepo().findByToken('cfp_invalid')
      expect(result).toBeNull()
    })
  })

  describe('findByEdition', () => {
    it('should return links for an edition sorted by -created', async () => {
      mockPb.mockCollection.getFullList.mockResolvedValue([MOCK_RECORD])
      const result = await getRepo().findByEdition('edition1')

      expect(mockPb.mockCollection.getFullList).toHaveBeenCalledWith({
        filter: expect.any(String),
        sort: '-created'
      })
      expect(result).toHaveLength(1)
    })
  })

  describe('create', () => {
    it('should create a link with generated token', async () => {
      mockPb.mockCollection.create.mockResolvedValue(MOCK_RECORD)
      const result = await getRepo().create({
        editionId: 'edition1',
        name: 'VIP Link',
        isActive: true,
        createdBy: 'user1'
      })

      expect(mockPb.mockCollection.create).toHaveBeenCalledWith(
        expect.objectContaining({
          editionId: 'edition1',
          token: expect.any(String),
          usedSubmissions: 0,
          isActive: true
        })
      )
      expect(result.id).toBe('link1')
    })

    it('should handle optional fields', async () => {
      mockPb.mockCollection.create.mockResolvedValue(MOCK_RECORD)
      await getRepo().create({
        editionId: 'edition1',
        isActive: true,
        createdBy: 'user1'
      })

      expect(mockPb.mockCollection.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: null,
          description: null,
          expiresAt: null,
          maxSubmissions: null
        })
      )
    })
  })

  describe('update', () => {
    it('should update specified fields only', async () => {
      mockPb.mockCollection.update.mockResolvedValue({ ...MOCK_RECORD, name: 'Updated' })
      await getRepo().update({ id: 'link1', name: 'Updated' })

      expect(mockPb.mockCollection.update).toHaveBeenCalledWith('link1', { name: 'Updated' })
    })

    it('should serialize expiresAt date', async () => {
      const expiresAt = new Date('2025-06-01')
      mockPb.mockCollection.update.mockResolvedValue(MOCK_RECORD)
      await getRepo().update({ id: 'link1', expiresAt })

      const callArgs = mockPb.mockCollection.update.mock.calls[0][1] as Record<string, unknown>
      expect(callArgs.expiresAt).toBe(expiresAt.toISOString())
    })

    it('should handle null expiresAt', async () => {
      mockPb.mockCollection.update.mockResolvedValue(MOCK_RECORD)
      await getRepo().update({ id: 'link1', expiresAt: null })

      const callArgs = mockPb.mockCollection.update.mock.calls[0][1] as Record<string, unknown>
      expect(callArgs.expiresAt).toBeNull()
    })
  })

  describe('delete', () => {
    it('should delete the link', async () => {
      mockPb.mockCollection.delete.mockResolvedValue(undefined)
      await getRepo().delete('link1')
      expect(mockPb.mockCollection.delete).toHaveBeenCalledWith('link1')
    })
  })

  describe('incrementUsage', () => {
    it('should increment usedSubmissions by 1', async () => {
      mockPb.mockCollection.getOne.mockResolvedValue(MOCK_RECORD)
      mockPb.mockCollection.update.mockResolvedValue({ ...MOCK_RECORD, usedSubmissions: 3 })

      const result = await getRepo().incrementUsage('link1')

      expect(mockPb.mockCollection.update).toHaveBeenCalledWith('link1', { usedSubmissions: 3 })
      expect(result.usedSubmissions).toBe(3)
    })

    it('should throw when link not found', async () => {
      mockPb.mockCollection.getOne.mockRejectedValue(new Error('Not found'))

      await expect(getRepo().incrementUsage('nonexistent')).rejects.toThrow('Secret link not found')
    })
  })

  describe('mapping', () => {
    it('should map all fields correctly', async () => {
      mockPb.mockCollection.getOne.mockResolvedValue(MOCK_RECORD)
      const result = await getRepo().findById('link1')

      expect(result?.name).toBe('VIP Speaker Link')
      expect(result?.description).toBe('For invited speakers')
      expect(result?.expiresAt).toBeInstanceOf(Date)
      expect(result?.maxSubmissions).toBe(5)
      expect(result?.usedSubmissions).toBe(2)
      expect(result?.isActive).toBe(true)
      expect(result?.createdBy).toBe('user1')
      expect(result?.createdAt).toBeInstanceOf(Date)
    })

    it('should handle missing optional fields', async () => {
      mockPb.mockCollection.getOne.mockResolvedValue({
        ...MOCK_RECORD,
        name: '',
        description: '',
        expiresAt: null,
        maxSubmissions: 0,
        usedSubmissions: 0
      })
      const result = await getRepo().findById('link1')

      expect(result?.name).toBeUndefined()
      expect(result?.description).toBeUndefined()
      expect(result?.expiresAt).toBeUndefined()
      expect(result?.maxSubmissions).toBeUndefined()
      expect(result?.usedSubmissions).toBe(0)
    })
  })
})
