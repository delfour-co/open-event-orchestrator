import type PocketBase from 'pocketbase'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createCfpSettingsRepository } from './cfp-settings-repository'

const createMockPb = () => {
  const mockCollection = {
    getFirstListItem: vi.fn(),
    create: vi.fn(),
    update: vi.fn()
  }
  return { collection: vi.fn(() => mockCollection), mockCollection }
}

const MOCK_RECORD = {
  id: 'settings1',
  editionId: 'edition1',
  cfpOpenDate: '2024-01-01T00:00:00Z',
  cfpCloseDate: '2024-03-01T00:00:00Z',
  introText: 'Submit your talks!',
  maxSubmissionsPerSpeaker: 5,
  maxSubmissionsPerCoSpeaker: 3,
  limitReachedMessage: 'Limit reached',
  allowLimitExceptionRequest: true,
  requireAbstract: true,
  requireDescription: false,
  allowCoSpeakers: true,
  anonymousReview: false,
  revealSpeakersAfterDecision: true,
  reviewMode: 'stars',
  created: '2024-01-01T00:00:00Z',
  updated: '2024-01-01T00:00:00Z'
}

describe('CfpSettingsRepository', () => {
  let mockPb: ReturnType<typeof createMockPb>

  beforeEach(() => {
    mockPb = createMockPb()
    vi.clearAllMocks()
  })

  const getRepo = () => createCfpSettingsRepository(mockPb as unknown as PocketBase)

  describe('findByEdition', () => {
    it('should return settings when found', async () => {
      mockPb.mockCollection.getFirstListItem.mockResolvedValue(MOCK_RECORD)
      const result = await getRepo().findByEdition('edition1')

      expect(mockPb.collection).toHaveBeenCalledWith('cfp_settings')
      expect(result?.id).toBe('settings1')
      expect(result?.maxSubmissionsPerSpeaker).toBe(5)
    })

    it('should return null when not found', async () => {
      mockPb.mockCollection.getFirstListItem.mockRejectedValue(new Error('Not found'))
      const result = await getRepo().findByEdition('nonexistent')
      expect(result).toBeNull()
    })
  })

  describe('create', () => {
    it('should create settings with serialized dates', async () => {
      mockPb.mockCollection.create.mockResolvedValue(MOCK_RECORD)
      const openDate = new Date('2024-01-01')

      await getRepo().create({
        editionId: 'edition1',
        cfpOpenDate: openDate,
        maxSubmissionsPerSpeaker: 5,
        requireAbstract: true,
        requireDescription: false,
        allowCoSpeakers: true,
        anonymousReview: false,
        revealSpeakersAfterDecision: true,
        reviewMode: 'stars'
      })

      expect(mockPb.mockCollection.create).toHaveBeenCalledWith(
        expect.objectContaining({
          editionId: 'edition1',
          cfpOpenDate: openDate.toISOString(),
          maxSubmissionsPerSpeaker: 5
        })
      )
    })

    it('should handle missing optional dates', async () => {
      mockPb.mockCollection.create.mockResolvedValue(MOCK_RECORD)

      await getRepo().create({
        editionId: 'edition1',
        maxSubmissionsPerSpeaker: 3,
        requireAbstract: true,
        requireDescription: false,
        allowCoSpeakers: true,
        anonymousReview: false,
        revealSpeakersAfterDecision: true,
        reviewMode: 'stars'
      })

      expect(mockPb.mockCollection.create).toHaveBeenCalledWith(
        expect.objectContaining({
          cfpOpenDate: null,
          cfpCloseDate: null
        })
      )
    })
  })

  describe('update', () => {
    it('should update only provided fields', async () => {
      mockPb.mockCollection.update.mockResolvedValue({ ...MOCK_RECORD, anonymousReview: true })
      await getRepo().update({ id: 'settings1', anonymousReview: true })

      expect(mockPb.mockCollection.update).toHaveBeenCalledWith('settings1', {
        anonymousReview: true
      })
    })

    it('should serialize date fields', async () => {
      const newDate = new Date('2024-06-01')
      mockPb.mockCollection.update.mockResolvedValue(MOCK_RECORD)
      await getRepo().update({ id: 'settings1', cfpOpenDate: newDate })

      const callArgs = mockPb.mockCollection.update.mock.calls[0][1] as Record<string, unknown>
      expect(callArgs.cfpOpenDate).toBe(newDate.toISOString())
    })

    it('should not include unset fields', async () => {
      mockPb.mockCollection.update.mockResolvedValue(MOCK_RECORD)
      await getRepo().update({ id: 'settings1', maxSubmissionsPerSpeaker: 10 })

      const callArgs = mockPb.mockCollection.update.mock.calls[0][1] as Record<string, unknown>
      expect(callArgs).toEqual({ maxSubmissionsPerSpeaker: 10 })
    })
  })

  describe('upsert', () => {
    it('should update when settings exist', async () => {
      mockPb.mockCollection.getFirstListItem.mockResolvedValue(MOCK_RECORD)
      mockPb.mockCollection.update.mockResolvedValue({ ...MOCK_RECORD, anonymousReview: true })

      const result = await getRepo().upsert('edition1', { anonymousReview: true })

      expect(mockPb.mockCollection.update).toHaveBeenCalled()
      expect(result.anonymousReview).toBe(true)
    })

    it('should create when settings do not exist', async () => {
      mockPb.mockCollection.getFirstListItem.mockRejectedValue(new Error('Not found'))
      mockPb.mockCollection.create.mockResolvedValue(MOCK_RECORD)

      const result = await getRepo().upsert('edition1', { anonymousReview: true })

      expect(mockPb.mockCollection.create).toHaveBeenCalledWith(
        expect.objectContaining({
          editionId: 'edition1',
          anonymousReview: true
        })
      )
      expect(result.id).toBe('settings1')
    })

    it('should use sensible defaults when creating', async () => {
      mockPb.mockCollection.getFirstListItem.mockRejectedValue(new Error('Not found'))
      mockPb.mockCollection.create.mockResolvedValue(MOCK_RECORD)

      await getRepo().upsert('edition1', {})

      expect(mockPb.mockCollection.create).toHaveBeenCalledWith(
        expect.objectContaining({
          maxSubmissionsPerSpeaker: 3,
          requireAbstract: true,
          requireDescription: false,
          allowCoSpeakers: true,
          anonymousReview: false,
          reviewMode: 'stars'
        })
      )
    })
  })

  describe('mapping', () => {
    it('should map all fields correctly including dates', async () => {
      mockPb.mockCollection.getFirstListItem.mockResolvedValue(MOCK_RECORD)
      const result = await getRepo().findByEdition('edition1')

      expect(result?.cfpOpenDate).toBeInstanceOf(Date)
      expect(result?.cfpCloseDate).toBeInstanceOf(Date)
      expect(result?.introText).toBe('Submit your talks!')
      expect(result?.maxSubmissionsPerCoSpeaker).toBe(3)
      expect(result?.limitReachedMessage).toBe('Limit reached')
      expect(result?.allowLimitExceptionRequest).toBe(true)
      expect(result?.reviewMode).toBe('stars')
      expect(result?.createdAt).toBeInstanceOf(Date)
    })

    it('should handle missing optional fields with defaults', async () => {
      mockPb.mockCollection.getFirstListItem.mockResolvedValue({
        id: 'settings2',
        editionId: 'edition1',
        cfpOpenDate: null,
        cfpCloseDate: null,
        introText: '',
        maxSubmissionsPerSpeaker: 0,
        maxSubmissionsPerCoSpeaker: 0,
        limitReachedMessage: '',
        allowLimitExceptionRequest: false,
        requireAbstract: true,
        requireDescription: false,
        allowCoSpeakers: true,
        anonymousReview: false,
        revealSpeakersAfterDecision: true,
        reviewMode: '',
        created: '2024-01-01T00:00:00Z',
        updated: '2024-01-01T00:00:00Z'
      })
      const result = await getRepo().findByEdition('edition1')

      expect(result?.cfpOpenDate).toBeUndefined()
      expect(result?.cfpCloseDate).toBeUndefined()
      expect(result?.introText).toBeUndefined()
      expect(result?.maxSubmissionsPerSpeaker).toBe(3)
      expect(result?.reviewMode).toBe('stars')
    })
  })
})
