import type { CreateSession, Session, SessionType, UpdateSession } from '../domain'
import type { SessionRepository } from '../infra'

const VALID_SESSION_TYPES: SessionType[] = [
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

export interface CreateSessionInput {
  editionId: string
  slotId: string
  title: string
  type: string
  talkId?: string | null
  trackId?: string | null
  description?: string | null
}

export interface UpdateSessionInput {
  id: string
  title: string
  type: string
  talkId?: string | null
  trackId?: string | null
  description?: string | null
}

export interface ManageSessionsResult {
  success: boolean
  session?: Session
  error?: string
}

export const createManageSessionsUseCase = (sessionRepository: SessionRepository) => {
  const validateSessionType = (type: string): type is SessionType => {
    return VALID_SESSION_TYPES.includes(type as SessionType)
  }

  return {
    async create(input: CreateSessionInput): Promise<ManageSessionsResult> {
      if (!input.editionId) {
        return { success: false, error: 'Edition ID is required' }
      }
      if (!input.slotId) {
        return { success: false, error: 'Slot is required' }
      }
      if (!input.title || input.title.trim().length === 0) {
        return { success: false, error: 'Session title is required' }
      }
      if (!input.type) {
        return { success: false, error: 'Session type is required' }
      }
      if (!validateSessionType(input.type)) {
        return { success: false, error: 'Invalid session type' }
      }

      // Check if slot already has a session
      const isOccupied = await sessionRepository.isSlotOccupied(input.slotId)
      if (isOccupied) {
        return {
          success: false,
          error: 'This slot already has a session assigned. Delete the existing session first.'
        }
      }

      // If a talk is being assigned, check if it's already scheduled elsewhere
      if (input.talkId) {
        const existingSession = await sessionRepository.findByTalk(input.talkId)
        if (existingSession) {
          return {
            success: false,
            error: 'This talk is already scheduled in another session.'
          }
        }
      }

      const createData: CreateSession = {
        editionId: input.editionId,
        slotId: input.slotId,
        title: input.title.trim(),
        type: input.type as SessionType,
        talkId: input.talkId || undefined,
        trackId: input.trackId || undefined,
        description: input.description?.trim() || undefined
      }

      const session = await sessionRepository.create(createData)
      return { success: true, session }
    },

    async update(input: UpdateSessionInput): Promise<ManageSessionsResult> {
      if (!input.id) {
        return { success: false, error: 'Session ID is required' }
      }
      if (!input.title || input.title.trim().length === 0) {
        return { success: false, error: 'Session title is required' }
      }
      if (!input.type) {
        return { success: false, error: 'Session type is required' }
      }
      if (!validateSessionType(input.type)) {
        return { success: false, error: 'Invalid session type' }
      }

      const currentSession = await sessionRepository.findById(input.id)
      if (!currentSession) {
        return { success: false, error: 'Session not found' }
      }

      // If assigning a new talk, check if it's already scheduled elsewhere
      if (input.talkId && input.talkId !== currentSession.talkId) {
        const existingSession = await sessionRepository.findByTalk(input.talkId)
        if (existingSession && existingSession.id !== input.id) {
          return {
            success: false,
            error: 'This talk is already scheduled in another session.'
          }
        }
      }

      const updateData: UpdateSession = {
        id: input.id,
        title: input.title.trim(),
        type: input.type as SessionType,
        talkId: input.talkId || undefined,
        trackId: input.trackId || undefined,
        description: input.description?.trim() || undefined
      }

      const session = await sessionRepository.update(updateData)
      return { success: true, session }
    },

    async delete(id: string): Promise<ManageSessionsResult> {
      if (!id) {
        return { success: false, error: 'Session ID is required' }
      }

      const existing = await sessionRepository.findById(id)
      if (!existing) {
        return { success: false, error: 'Session not found' }
      }

      await sessionRepository.delete(id)
      return { success: true }
    }
  }
}

export type ManageSessionsUseCase = ReturnType<typeof createManageSessionsUseCase>
