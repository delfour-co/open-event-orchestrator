import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Session, Track } from '../domain'
import type { SessionRepository, TrackRepository } from '../infra'
import { type ManageTracksUseCase, createManageTracksUseCase } from './manage-tracks'

describe('ManageTracksUseCase', () => {
  let useCase: ManageTracksUseCase
  let mockTrackRepository: TrackRepository
  let mockSessionRepository: SessionRepository

  const mockTrack: Track = {
    id: 'track-1',
    editionId: 'edition-1',
    name: 'Frontend',
    color: '#3b82f6',
    order: 0,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }

  const mockSession: Session = {
    id: 'session-1',
    editionId: 'edition-1',
    slotId: 'slot-1',
    title: 'React Hooks',
    type: 'talk',
    trackId: 'track-1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }

  beforeEach(() => {
    mockTrackRepository = {
      findById: vi.fn(),
      findByEdition: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    }

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

    useCase = createManageTracksUseCase(mockTrackRepository, mockSessionRepository)
  })

  describe('create', () => {
    it('should create a track with valid input', async () => {
      vi.mocked(mockTrackRepository.create).mockResolvedValue(mockTrack)

      const result = await useCase.create({
        editionId: 'edition-1',
        name: 'Frontend',
        color: '#3b82f6'
      })

      expect(result.success).toBe(true)
      expect(result.track).toEqual(mockTrack)
      expect(mockTrackRepository.create).toHaveBeenCalledWith({
        editionId: 'edition-1',
        name: 'Frontend',
        color: '#3b82f6',
        order: 0
      })
    })

    it('should create a track with default color', async () => {
      const trackWithDefaultColor = { ...mockTrack, color: '#6b7280' }
      vi.mocked(mockTrackRepository.create).mockResolvedValue(trackWithDefaultColor)

      const result = await useCase.create({
        editionId: 'edition-1',
        name: 'Backend'
      })

      expect(result.success).toBe(true)
      expect(mockTrackRepository.create).toHaveBeenCalledWith({
        editionId: 'edition-1',
        name: 'Backend',
        color: '#6b7280',
        order: 0
      })
    })

    it('should trim whitespace from name', async () => {
      vi.mocked(mockTrackRepository.create).mockResolvedValue(mockTrack)

      await useCase.create({
        editionId: 'edition-1',
        name: '  Frontend  '
      })

      expect(mockTrackRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Frontend' })
      )
    })

    it('should return error when name is empty', async () => {
      const result = await useCase.create({
        editionId: 'edition-1',
        name: ''
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Track name is required')
      expect(mockTrackRepository.create).not.toHaveBeenCalled()
    })

    it('should return error when name is whitespace only', async () => {
      const result = await useCase.create({
        editionId: 'edition-1',
        name: '   '
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Track name is required')
    })
  })

  describe('update', () => {
    it('should update a track with valid input', async () => {
      const updatedTrack = { ...mockTrack, name: 'Frontend Dev', color: '#ef4444' }
      vi.mocked(mockTrackRepository.findById).mockResolvedValue(mockTrack)
      vi.mocked(mockTrackRepository.update).mockResolvedValue(updatedTrack)

      const result = await useCase.update({
        id: 'track-1',
        name: 'Frontend Dev',
        color: '#ef4444'
      })

      expect(result.success).toBe(true)
      expect(result.track).toEqual(updatedTrack)
      expect(mockTrackRepository.update).toHaveBeenCalledWith({
        id: 'track-1',
        name: 'Frontend Dev',
        color: '#ef4444'
      })
    })

    it('should use default color when not provided', async () => {
      vi.mocked(mockTrackRepository.findById).mockResolvedValue(mockTrack)
      vi.mocked(mockTrackRepository.update).mockResolvedValue(mockTrack)

      await useCase.update({
        id: 'track-1',
        name: 'Updated Track'
      })

      expect(mockTrackRepository.update).toHaveBeenCalledWith({
        id: 'track-1',
        name: 'Updated Track',
        color: '#6b7280'
      })
    })

    it('should trim whitespace from name', async () => {
      vi.mocked(mockTrackRepository.findById).mockResolvedValue(mockTrack)
      vi.mocked(mockTrackRepository.update).mockResolvedValue(mockTrack)

      await useCase.update({
        id: 'track-1',
        name: '  Updated Track  '
      })

      expect(mockTrackRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Updated Track' })
      )
    })

    it('should return error when id is missing', async () => {
      const result = await useCase.update({
        id: '',
        name: 'Test'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Track ID is required')
    })

    it('should return error when name is empty', async () => {
      const result = await useCase.update({
        id: 'track-1',
        name: ''
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Track name is required')
    })

    it('should return error when name is whitespace only', async () => {
      const result = await useCase.update({
        id: 'track-1',
        name: '   '
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Track name is required')
    })

    it('should return error when track not found', async () => {
      vi.mocked(mockTrackRepository.findById).mockResolvedValue(null)

      const result = await useCase.update({
        id: 'nonexistent',
        name: 'Updated Track'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Track not found')
    })
  })

  describe('delete', () => {
    it('should delete a track with no sessions', async () => {
      vi.mocked(mockSessionRepository.findByTrack).mockResolvedValue([])
      vi.mocked(mockTrackRepository.delete).mockResolvedValue(undefined)

      const result = await useCase.delete('track-1')

      expect(result.success).toBe(true)
      expect(mockTrackRepository.delete).toHaveBeenCalledWith('track-1')
    })

    it('should return error when id is missing', async () => {
      const result = await useCase.delete('')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Track ID is required')
      expect(mockTrackRepository.delete).not.toHaveBeenCalled()
    })

    it('should return error when track has existing sessions', async () => {
      vi.mocked(mockSessionRepository.findByTrack).mockResolvedValue([mockSession])

      const result = await useCase.delete('track-1')

      expect(result.success).toBe(false)
      expect(result.error).toBe(
        'Cannot delete track with existing sessions. Remove track from sessions first.'
      )
      expect(mockTrackRepository.delete).not.toHaveBeenCalled()
    })

    it('should delete track with multiple sessions removed', async () => {
      vi.mocked(mockSessionRepository.findByTrack).mockResolvedValue([])
      vi.mocked(mockTrackRepository.delete).mockResolvedValue(undefined)

      const result = await useCase.delete('track-1')

      expect(result.success).toBe(true)
    })
  })
})
