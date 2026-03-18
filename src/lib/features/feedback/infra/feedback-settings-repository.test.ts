import type PocketBase from 'pocketbase'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FeedbackSettingsRepository } from './feedback-settings-repository'

const createMockPb = () => {
  const mockCollection = vi.fn()
  return {
    collection: mockCollection,
    _mockCollection: mockCollection
  }
}

const makeSettingsRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'fs1',
  editionId: 'ed1',
  sessionRatingEnabled: true,
  sessionRatingMode: 'stars',
  sessionCommentRequired: false,
  eventFeedbackEnabled: true,
  feedbackIntroText: 'Please share your feedback',
  created: '2024-06-15T10:00:00Z',
  updated: '2024-06-15T10:00:00Z',
  ...overrides
})

describe('FeedbackSettingsRepository', () => {
  let mockPb: ReturnType<typeof createMockPb>

  beforeEach(() => {
    mockPb = createMockPb()
  })

  describe('create', () => {
    it('should create feedback settings', async () => {
      const record = makeSettingsRecord()
      const mockCreate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ create: mockCreate })

      const repo = new FeedbackSettingsRepository(mockPb as unknown as PocketBase)
      const result = await repo.create({
        editionId: 'ed1',
        sessionRatingEnabled: true,
        sessionRatingMode: 'stars',
        sessionCommentRequired: false,
        eventFeedbackEnabled: true,
        feedbackIntroText: 'Please share your feedback'
      })

      expect(result.id).toBe('fs1')
      expect(result.sessionRatingEnabled).toBe(true)
      expect(result.sessionRatingMode).toBe('stars')
    })

    it('should map all fields correctly', async () => {
      const record = makeSettingsRecord({ sessionCommentRequired: true })
      const mockCreate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ create: mockCreate })

      const repo = new FeedbackSettingsRepository(mockPb as unknown as PocketBase)
      const result = await repo.create({
        editionId: 'ed1',
        sessionRatingEnabled: true,
        sessionRatingMode: 'stars',
        sessionCommentRequired: true,
        eventFeedbackEnabled: true,
        feedbackIntroText: undefined
      })

      expect(result.sessionCommentRequired).toBe(true)
    })
  })

  describe('update', () => {
    it('should update only provided fields', async () => {
      const record = makeSettingsRecord({ sessionRatingEnabled: false })
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const repo = new FeedbackSettingsRepository(mockPb as unknown as PocketBase)
      const result = await repo.update({ id: 'fs1', sessionRatingEnabled: false })

      expect(result.sessionRatingEnabled).toBe(false)
      expect(mockUpdate).toHaveBeenCalledWith(
        'fs1',
        expect.objectContaining({ sessionRatingEnabled: false })
      )
    })

    it('should not include undefined fields', async () => {
      const record = makeSettingsRecord()
      const mockUpdate = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ update: mockUpdate })

      const repo = new FeedbackSettingsRepository(mockPb as unknown as PocketBase)
      await repo.update({ id: 'fs1', sessionRatingMode: 'scale_10' })

      expect(mockUpdate).toHaveBeenCalledWith('fs1', { sessionRatingMode: 'scale_10' })
    })
  })

  describe('delete', () => {
    it('should delete feedback settings', async () => {
      const mockDelete = vi.fn().mockResolvedValue(undefined)
      mockPb._mockCollection.mockReturnValue({ delete: mockDelete })

      const repo = new FeedbackSettingsRepository(mockPb as unknown as PocketBase)
      await repo.delete('fs1')

      expect(mockDelete).toHaveBeenCalledWith('fs1')
    })
  })

  describe('getById', () => {
    it('should return settings when found', async () => {
      const record = makeSettingsRecord()
      const mockGetOne = vi.fn().mockResolvedValue(record)
      mockPb._mockCollection.mockReturnValue({ getOne: mockGetOne })

      const repo = new FeedbackSettingsRepository(mockPb as unknown as PocketBase)
      const result = await repo.getById('fs1')

      expect(result?.id).toBe('fs1')
      expect(result?.editionId).toBe('ed1')
    })

    it('should return null when not found', async () => {
      const mockGetOne = vi.fn().mockRejectedValue(new Error('Not found'))
      mockPb._mockCollection.mockReturnValue({ getOne: mockGetOne })

      const repo = new FeedbackSettingsRepository(mockPb as unknown as PocketBase)
      const result = await repo.getById('missing')

      expect(result).toBeNull()
    })
  })

  describe('getByEdition', () => {
    it('should return settings for an edition', async () => {
      const records = [makeSettingsRecord()]
      const mockGetFullList = vi.fn().mockResolvedValue(records)
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = new FeedbackSettingsRepository(mockPb as unknown as PocketBase)
      const result = await repo.getByEdition('ed1')

      expect(result?.id).toBe('fs1')
    })

    it('should return null when no settings exist for edition', async () => {
      const mockGetFullList = vi.fn().mockResolvedValue([])
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = new FeedbackSettingsRepository(mockPb as unknown as PocketBase)
      const result = await repo.getByEdition('ed1')

      expect(result).toBeNull()
    })

    it('should return null on error', async () => {
      const mockGetFullList = vi.fn().mockRejectedValue(new Error('fail'))
      mockPb._mockCollection.mockReturnValue({ getFullList: mockGetFullList })

      const repo = new FeedbackSettingsRepository(mockPb as unknown as PocketBase)
      const result = await repo.getByEdition('ed1')

      expect(result).toBeNull()
    })
  })
})
