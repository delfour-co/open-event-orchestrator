import type { CreateRoomAssignment, RoomAssignment } from '../domain'
import type { RoomAssignmentRepository, UpdateRoomAssignment } from '../infra'

export interface CreateRoomAssignmentInput {
  editionId: string
  roomId: string
  memberId: string
  date?: string | null
  startTime?: string | null
  endTime?: string | null
  notes?: string | null
}

export interface UpdateRoomAssignmentInput {
  id: string
  memberId: string
  date?: string | null
  startTime?: string | null
  endTime?: string | null
  notes?: string | null
}

export interface ManageRoomAssignmentsResult {
  success: boolean
  assignment?: RoomAssignment
  error?: string
}

export const createManageRoomAssignmentsUseCase = (
  roomAssignmentRepository: RoomAssignmentRepository
) => {
  return {
    async create(input: CreateRoomAssignmentInput): Promise<ManageRoomAssignmentsResult> {
      if (!input.editionId) {
        return { success: false, error: 'Edition ID is required' }
      }
      if (!input.roomId) {
        return { success: false, error: 'Room is required' }
      }
      if (!input.memberId) {
        return { success: false, error: 'Team member is required' }
      }

      const createData: CreateRoomAssignment = {
        editionId: input.editionId,
        roomId: input.roomId,
        memberId: input.memberId,
        date: input.date ? new Date(input.date) : undefined,
        startTime: input.startTime || undefined,
        endTime: input.endTime || undefined,
        notes: input.notes?.trim() || undefined
      }

      const assignment = await roomAssignmentRepository.create(createData)
      return { success: true, assignment }
    },

    async update(input: UpdateRoomAssignmentInput): Promise<ManageRoomAssignmentsResult> {
      if (!input.id) {
        return { success: false, error: 'Assignment ID is required' }
      }
      if (!input.memberId) {
        return { success: false, error: 'Team member is required' }
      }

      const existing = await roomAssignmentRepository.findById(input.id)
      if (!existing) {
        return { success: false, error: 'Assignment not found' }
      }

      const updateData: UpdateRoomAssignment = {
        id: input.id,
        memberId: input.memberId,
        date: input.date ? new Date(input.date) : undefined,
        startTime: input.startTime || undefined,
        endTime: input.endTime || undefined,
        notes: input.notes?.trim() || undefined
      }

      const assignment = await roomAssignmentRepository.update(updateData)
      return { success: true, assignment }
    },

    async delete(id: string): Promise<ManageRoomAssignmentsResult> {
      if (!id) {
        return { success: false, error: 'Assignment ID is required' }
      }

      const existing = await roomAssignmentRepository.findById(id)
      if (!existing) {
        return { success: false, error: 'Assignment not found' }
      }

      await roomAssignmentRepository.delete(id)
      return { success: true }
    }
  }
}

export type ManageRoomAssignmentsUseCase = ReturnType<typeof createManageRoomAssignmentsUseCase>
