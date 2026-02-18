import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Session } from '../domain'
import type { SessionRepository } from '../infra'
import { type ManageSessionsUseCase, createManageSessionsUseCase } from './manage-sessions'

describe('ManageSessionsUseCase', () => {
  let useCase: ManageSessionsUseCase
  let mockSessionRepository: SessionRepository

  const mockSession: Session = {
    id: 'session-1',
    editionId: 'edition-1',
    slotId: 'slot-1',
    title: 'Introduction to TypeScript',
    type: 'talk',
    talkId: 'talk-1',
    trackId: 'track-1',
    description: 'A beginner-friendly talk',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }

  beforeEach(() => {
    mockSessionRepository = {
      findById: vi.fn(),
      findByEdition: vi.fn(),
      findBySlot: vi.fn(),
      findByTalk: vi.fn(),
      findByTrack: vi.fn(),
      isSlotOccupied: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    }

    useCase = createManageSessionsUseCase(mockSessionRepository)
  })

  describe('create', () => {
    it('should create a session with valid input', async () => {
      vi.mocked(mockSessionRepository.isSlotOccupied).mockResolvedValue(false)
      vi.mocked(mockSessionRepository.findByTalk).mockResolvedValue(null)
      vi.mocked(mockSessionRepository.create).mockResolvedValue(mockSession)

      const result = await useCase.create({
        editionId: 'edition-1',
        slotId: 'slot-1',
        title: 'Introduction to TypeScript',
        type: 'talk',
        talkId: 'talk-1',
        trackId: 'track-1',
        description: 'A beginner-friendly talk'
      })

      expect(result.success).toBe(true)
      expect(result.session).toEqual(mockSession)
      expect(mockSessionRepository.create).toHaveBeenCalledWith({
        editionId: 'edition-1',
        slotId: 'slot-1',
        title: 'Introduction to TypeScript',
        type: 'talk',
        talkId: 'talk-1',
        trackId: 'track-1',
        description: 'A beginner-friendly talk'
      })
    })

    it('should create a break session without talk', async () => {
      const breakSession = { ...mockSession, type: 'break' as const, talkId: undefined }
      vi.mocked(mockSessionRepository.isSlotOccupied).mockResolvedValue(false)
      vi.mocked(mockSessionRepository.create).mockResolvedValue(breakSession)

      const result = await useCase.create({
        editionId: 'edition-1',
        slotId: 'slot-1',
        title: 'Coffee Break',
        type: 'break'
      })

      expect(result.success).toBe(true)
      expect(result.session?.type).toBe('break')
    })

    it('should trim whitespace from title and description', async () => {
      vi.mocked(mockSessionRepository.isSlotOccupied).mockResolvedValue(false)
      vi.mocked(mockSessionRepository.create).mockResolvedValue(mockSession)

      await useCase.create({
        editionId: 'edition-1',
        slotId: 'slot-1',
        title: '  Introduction to TypeScript  ',
        type: 'talk',
        description: '  A beginner-friendly talk  '
      })

      expect(mockSessionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Introduction to TypeScript',
          description: 'A beginner-friendly talk'
        })
      )
    })

    it('should return error when edition ID is missing', async () => {
      const result = await useCase.create({
        editionId: '',
        slotId: 'slot-1',
        title: 'Test Session',
        type: 'talk'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Edition ID is required')
    })

    it('should return error when slot is missing', async () => {
      const result = await useCase.create({
        editionId: 'edition-1',
        slotId: '',
        title: 'Test Session',
        type: 'talk'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Slot is required')
    })

    it('should return error when title is empty', async () => {
      const result = await useCase.create({
        editionId: 'edition-1',
        slotId: 'slot-1',
        title: '',
        type: 'talk'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Session title is required')
    })

    it('should return error when title is whitespace only', async () => {
      const result = await useCase.create({
        editionId: 'edition-1',
        slotId: 'slot-1',
        title: '   ',
        type: 'talk'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Session title is required')
    })

    it('should return error when type is missing', async () => {
      const result = await useCase.create({
        editionId: 'edition-1',
        slotId: 'slot-1',
        title: 'Test Session',
        type: ''
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Session type is required')
    })

    it('should return error for invalid session type', async () => {
      const result = await useCase.create({
        editionId: 'edition-1',
        slotId: 'slot-1',
        title: 'Test Session',
        type: 'invalid-type'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid session type')
    })

    it('should return error when slot is already occupied', async () => {
      vi.mocked(mockSessionRepository.isSlotOccupied).mockResolvedValue(true)

      const result = await useCase.create({
        editionId: 'edition-1',
        slotId: 'slot-1',
        title: 'Test Session',
        type: 'talk'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe(
        'This slot already has a session assigned. Delete the existing session first.'
      )
    })

    it('should return error when talk is already scheduled', async () => {
      vi.mocked(mockSessionRepository.isSlotOccupied).mockResolvedValue(false)
      vi.mocked(mockSessionRepository.findByTalk).mockResolvedValue(mockSession)

      const result = await useCase.create({
        editionId: 'edition-1',
        slotId: 'slot-2',
        title: 'Test Session',
        type: 'talk',
        talkId: 'talk-1'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('This talk is already scheduled in another session.')
    })

    it('should validate all session types', async () => {
      const validTypes = [
        'talk',
        'workshop',
        'keynote',
        'panel',
        'break',
        'lunch',
        'networking',
        'registration',
        'other'
      ]

      for (const type of validTypes) {
        vi.mocked(mockSessionRepository.isSlotOccupied).mockResolvedValue(false)
        vi.mocked(mockSessionRepository.create).mockResolvedValue({
          ...mockSession,
          type
        } as Session)

        const result = await useCase.create({
          editionId: 'edition-1',
          slotId: 'slot-1',
          title: 'Test Session',
          type
        })

        expect(result.success).toBe(true)
      }
    })
  })

  describe('update', () => {
    it('should update a session with valid input', async () => {
      const updatedSession = { ...mockSession, title: 'Advanced TypeScript' }
      vi.mocked(mockSessionRepository.findById).mockResolvedValue(mockSession)
      vi.mocked(mockSessionRepository.update).mockResolvedValue(updatedSession)

      const result = await useCase.update({
        id: 'session-1',
        title: 'Advanced TypeScript',
        type: 'talk'
      })

      expect(result.success).toBe(true)
      expect(result.session).toEqual(updatedSession)
    })

    it('should trim whitespace from updated fields', async () => {
      vi.mocked(mockSessionRepository.findById).mockResolvedValue(mockSession)
      vi.mocked(mockSessionRepository.update).mockResolvedValue(mockSession)

      await useCase.update({
        id: 'session-1',
        title: '  Advanced TypeScript  ',
        type: 'talk',
        description: '  Updated description  '
      })

      expect(mockSessionRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Advanced TypeScript',
          description: 'Updated description'
        })
      )
    })

    it('should return error when id is missing', async () => {
      const result = await useCase.update({
        id: '',
        title: 'Test',
        type: 'talk'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Session ID is required')
    })

    it('should return error when title is empty', async () => {
      const result = await useCase.update({
        id: 'session-1',
        title: '',
        type: 'talk'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Session title is required')
    })

    it('should return error when type is missing', async () => {
      const result = await useCase.update({
        id: 'session-1',
        title: 'Test',
        type: ''
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Session type is required')
    })

    it('should return error for invalid session type', async () => {
      const result = await useCase.update({
        id: 'session-1',
        title: 'Test',
        type: 'invalid'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid session type')
    })

    it('should return error when session not found', async () => {
      vi.mocked(mockSessionRepository.findById).mockResolvedValue(null)

      const result = await useCase.update({
        id: 'nonexistent',
        title: 'Test',
        type: 'talk'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Session not found')
    })

    it('should return error when assigning already scheduled talk', async () => {
      const anotherSession = { ...mockSession, id: 'session-2', talkId: 'talk-2' }
      vi.mocked(mockSessionRepository.findById).mockResolvedValue(mockSession)
      vi.mocked(mockSessionRepository.findByTalk).mockResolvedValue(anotherSession)

      const result = await useCase.update({
        id: 'session-1',
        title: 'Test',
        type: 'talk',
        talkId: 'talk-2'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('This talk is already scheduled in another session.')
    })

    it('should allow updating with same talk assignment', async () => {
      vi.mocked(mockSessionRepository.findById).mockResolvedValue(mockSession)
      vi.mocked(mockSessionRepository.findByTalk).mockResolvedValue(mockSession) // Same session
      vi.mocked(mockSessionRepository.update).mockResolvedValue(mockSession)

      const result = await useCase.update({
        id: 'session-1',
        title: 'Updated Title',
        type: 'talk',
        talkId: 'talk-1' // Same talk as current
      })

      expect(result.success).toBe(true)
    })
  })

  describe('delete', () => {
    it('should delete an existing session', async () => {
      vi.mocked(mockSessionRepository.findById).mockResolvedValue(mockSession)
      vi.mocked(mockSessionRepository.delete).mockResolvedValue(undefined)

      const result = await useCase.delete('session-1')

      expect(result.success).toBe(true)
      expect(mockSessionRepository.delete).toHaveBeenCalledWith('session-1')
    })

    it('should return error when id is missing', async () => {
      const result = await useCase.delete('')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Session ID is required')
      expect(mockSessionRepository.delete).not.toHaveBeenCalled()
    })

    it('should return error when session not found', async () => {
      vi.mocked(mockSessionRepository.findById).mockResolvedValue(null)

      const result = await useCase.delete('nonexistent')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Session not found')
      expect(mockSessionRepository.delete).not.toHaveBeenCalled()
    })
  })
})
