import type PocketBase from 'pocketbase'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSponsorMessageRepository } from './sponsor-message-repository'

const createMockPb = () => {
  const mockCollection = vi.fn()
  const mockFiles = {
    getURL: vi.fn().mockReturnValue('https://example.com/attachment.pdf')
  }
  return {
    collection: mockCollection,
    files: mockFiles,
    _mockCollection: mockCollection
  }
}

const makeMessageRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'msg1',
  editionSponsorId: 'es1',
  senderType: 'organizer',
  senderUserId: 'user1',
  senderName: 'Alice',
  subject: 'Welcome',
  content: 'Hello sponsor!',
  attachments: ['file1.pdf'],
  readAt: '',
  created: '2024-06-15T10:00:00Z',
  updated: '2024-06-15T10:00:00Z',
  ...overrides
})

describe('SponsorMessageRepository', () => {
  let mockPb: ReturnType<typeof createMockPb>

  beforeEach(() => {
    mockPb = createMockPb()
  })

  describe('findById', () => {
    it('should return a message when found', async () => {
      const record = makeMessageRecord()
      const mockGetOne = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ getOne: mockGetOne })

      const repo = createSponsorMessageRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('msg1')

      expect(result?.id).toBe('msg1')
      expect(result?.content).toBe('Hello sponsor!')
    })

    it('should return null when not found', async () => {
      const mockGetOne = vi.fn().mockRejectedValue(new Error('Not found'))
      mockPb._mockCollection.mockReturnValue({ getOne: mockGetOne })

      const repo = createSponsorMessageRepository(mockPb as unknown as PocketBase)
      const result = await repo.findById('missing')

      expect(result).toBeNull()
    })
  })

  describe('findByIdWithAttachmentUrls', () => {
    it('should return a message with attachment URLs', async () => {
      const record = makeMessageRecord()
      const mockGetOne = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ getOne: mockGetOne })

      const repo = createSponsorMessageRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByIdWithAttachmentUrls('msg1')

      expect(result?.attachmentUrls).toHaveLength(1)
      expect(result?.attachmentUrls[0]).toBe('https://example.com/attachment.pdf')
    })

    it('should return null when not found', async () => {
      const mockGetOne = vi.fn().mockRejectedValue(new Error('Not found'))
      mockPb._mockCollection.mockReturnValue({ getOne: mockGetOne })

      const repo = createSponsorMessageRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByIdWithAttachmentUrls('missing')

      expect(result).toBeNull()
    })
  })

  describe('findByEditionSponsor', () => {
    it('should return messages sorted by created date', async () => {
      const records = [makeMessageRecord(), makeMessageRecord({ id: 'msg2' })]
      const mockGetFullList = vi.fn().mockResolvedValue(records)
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = createSponsorMessageRepository(mockPb as unknown as PocketBase)
      const result = await repo.findByEditionSponsor('es1')

      expect(result).toHaveLength(2)
      expect(mockGetFullList).toHaveBeenCalledWith(expect.objectContaining({ sort: 'created' }))
    })
  })

  describe('findUnreadByEditionSponsor', () => {
    it('should return unread messages from the opposite sender type', async () => {
      const records = [makeMessageRecord({ senderType: 'sponsor', readAt: null })]
      const mockGetFullList = vi.fn().mockResolvedValue(records)
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = createSponsorMessageRepository(mockPb as unknown as PocketBase)
      const result = await repo.findUnreadByEditionSponsor('es1', 'organizer')

      expect(result).toHaveLength(1)
    })
  })

  describe('countUnreadByEditionSponsor', () => {
    it('should return count of unread messages', async () => {
      const mockGetList = vi.fn().mockResolvedValue({ totalItems: 3 })
      mockPb._mockCollection.mockReturnValue({ getList: mockGetList })

      const repo = createSponsorMessageRepository(mockPb as unknown as PocketBase)
      const result = await repo.countUnreadByEditionSponsor('es1', 'organizer')

      expect(result).toBe(3)
    })
  })

  describe('getUnreadCountsForEdition', () => {
    it('should return zero counts when no edition sponsors', async () => {
      const mockGetFullList = vi.fn().mockResolvedValue([])
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = createSponsorMessageRepository(mockPb as unknown as PocketBase)
      const result = await repo.getUnreadCountsForEdition('ed1', 'organizer')

      expect(result.total).toBe(0)
      expect(result.byEditionSponsor).toEqual({})
    })

    it('should aggregate unread counts by edition sponsor', async () => {
      const editionSponsors = [{ id: 'es1' }, { id: 'es2' }]
      const unreadMessages = [
        { editionSponsorId: 'es1' },
        { editionSponsorId: 'es1' },
        { editionSponsorId: 'es2' }
      ]
      const mockGetFullList = vi
        .fn()
        .mockResolvedValueOnce(editionSponsors)
        .mockResolvedValueOnce(unreadMessages)
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = createSponsorMessageRepository(mockPb as unknown as PocketBase)
      const result = await repo.getUnreadCountsForEdition('ed1', 'organizer')

      expect(result.total).toBe(3)
      expect(result.byEditionSponsor.es1).toBe(2)
      expect(result.byEditionSponsor.es2).toBe(1)
    })
  })

  describe('create', () => {
    it('should create a message via FormData', async () => {
      const record = makeMessageRecord()
      const mockCreate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ create: mockCreate })

      const repo = createSponsorMessageRepository(mockPb as unknown as PocketBase)
      const result = await repo.create({
        editionSponsorId: 'es1',
        senderType: 'organizer',
        senderUserId: 'user1',
        senderName: 'Alice',
        subject: 'Welcome',
        content: 'Hello sponsor!'
      })

      expect(result?.id).toBe('msg1')
      expect(mockCreate).toHaveBeenCalledWith(expect.any(FormData))
    })
  })

  describe('markAsRead', () => {
    it('should set readAt timestamp', async () => {
      const record = makeMessageRecord({ readAt: '2024-06-15T12:00:00Z' })
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const repo = createSponsorMessageRepository(mockPb as unknown as PocketBase)
      const result = await repo.markAsRead('msg1')

      expect(result?.id).toBe('msg1')
      expect(mockUpdate).toHaveBeenCalledWith(
        'msg1',
        expect.objectContaining({ readAt: expect.any(String) })
      )
    })
  })

  describe('markAllAsReadForEditionSponsor', () => {
    it('should mark all unread messages as read and return count', async () => {
      const unread = [{ id: 'msg1' }, { id: 'msg2' }]
      const mockGetFullList = vi.fn().mockResolvedValue(unread)
      const mockUpdate = vi.fn().mockResolvedValue({})
      mockPb._mockCollection.mockReturnValue({
        getFullList: mockGetFullList,
        update: mockUpdate
      })

      const repo = createSponsorMessageRepository(mockPb as unknown as PocketBase)
      const count = await repo.markAllAsReadForEditionSponsor('es1', 'organizer')

      expect(count).toBe(2)
      expect(mockUpdate).toHaveBeenCalledTimes(2)
    })
  })

  describe('delete', () => {
    it('should delete a message', async () => {
      const mockDelete = vi.fn().mockResolvedValue(undefined)
      mockPb._mockCollection.mockReturnValue({ delete: mockDelete })

      const repo = createSponsorMessageRepository(mockPb as unknown as PocketBase)
      await repo.delete('msg1')

      expect(mockDelete).toHaveBeenCalledWith('msg1')
    })
  })

  describe('getAttachmentUrl', () => {
    it('should return the URL for an attachment', () => {
      const repo = createSponsorMessageRepository(mockPb as unknown as PocketBase)
      const message = {
        id: 'msg1',
        editionSponsorId: 'es1',
        senderType: 'organizer' as const,
        senderName: 'Alice',
        content: 'Hello',
        attachments: ['file.pdf'],
        createdAt: new Date(),
        updatedAt: new Date()
      }
      const url = repo.getAttachmentUrl(message, 'file.pdf')

      expect(url).toBe('https://example.com/attachment.pdf')
    })
  })
})
