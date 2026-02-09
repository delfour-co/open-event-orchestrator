import type { CreateTrack, Track, UpdateTrack } from '../domain'
import type { SessionRepository, TrackRepository } from '../infra'

export interface CreateTrackInput {
  editionId: string
  name: string
  color?: string
}

export interface UpdateTrackInput {
  id: string
  name: string
  color?: string
}

export interface ManageTracksResult {
  success: boolean
  track?: Track
  error?: string
}

export const createManageTracksUseCase = (
  trackRepository: TrackRepository,
  sessionRepository: SessionRepository
) => {
  return {
    async create(input: CreateTrackInput): Promise<ManageTracksResult> {
      if (!input.name || input.name.trim().length === 0) {
        return { success: false, error: 'Track name is required' }
      }

      const createData: CreateTrack = {
        editionId: input.editionId,
        name: input.name.trim(),
        color: input.color || '#6b7280',
        order: 0
      }

      const track = await trackRepository.create(createData)
      return { success: true, track }
    },

    async update(input: UpdateTrackInput): Promise<ManageTracksResult> {
      if (!input.id) {
        return { success: false, error: 'Track ID is required' }
      }
      if (!input.name || input.name.trim().length === 0) {
        return { success: false, error: 'Track name is required' }
      }

      const existing = await trackRepository.findById(input.id)
      if (!existing) {
        return { success: false, error: 'Track not found' }
      }

      const updateData: UpdateTrack = {
        id: input.id,
        name: input.name.trim(),
        color: input.color || '#6b7280'
      }

      const track = await trackRepository.update(updateData)
      return { success: true, track }
    },

    async delete(id: string): Promise<ManageTracksResult> {
      if (!id) {
        return { success: false, error: 'Track ID is required' }
      }

      const sessions = await sessionRepository.findByTrack(id)
      if (sessions.length > 0) {
        return {
          success: false,
          error: 'Cannot delete track with existing sessions. Remove track from sessions first.'
        }
      }

      await trackRepository.delete(id)
      return { success: true }
    }
  }
}

export type ManageTracksUseCase = ReturnType<typeof createManageTracksUseCase>
