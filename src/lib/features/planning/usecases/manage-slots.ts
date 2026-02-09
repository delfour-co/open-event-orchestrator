import type { CreateSlot, Slot, UpdateSlot } from '../domain'
import type { SessionRepository, SlotRepository } from '../infra'

export interface CreateSlotInput {
  editionId: string
  roomId: string
  date: string
  startTime: string
  endTime: string
}

export interface UpdateSlotInput {
  id: string
  roomId: string
  date: string
  startTime: string
  endTime: string
}

export interface ManageSlotsResult {
  success: boolean
  slot?: Slot
  error?: string
}

export const createManageSlotsUseCase = (
  slotRepository: SlotRepository,
  sessionRepository: SessionRepository
) => {
  const validateTimeRange = (startTime: string, endTime: string): string | null => {
    if (startTime >= endTime) {
      return 'End time must be after start time'
    }
    return null
  }

  return {
    async create(input: CreateSlotInput): Promise<ManageSlotsResult> {
      if (!input.roomId) {
        return { success: false, error: 'Room is required' }
      }
      if (!input.date) {
        return { success: false, error: 'Date is required' }
      }
      if (!input.startTime) {
        return { success: false, error: 'Start time is required' }
      }
      if (!input.endTime) {
        return { success: false, error: 'End time is required' }
      }

      const timeError = validateTimeRange(input.startTime, input.endTime)
      if (timeError) {
        return { success: false, error: timeError }
      }

      const createData: CreateSlot = {
        editionId: input.editionId,
        roomId: input.roomId,
        date: new Date(input.date),
        startTime: input.startTime,
        endTime: input.endTime
      }

      // Check for overlapping slots
      const overlappingSlot = await slotRepository.checkOverlap({
        ...createData,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      if (overlappingSlot) {
        return {
          success: false,
          error: `Slot overlaps with existing slot (${overlappingSlot.startTime} - ${overlappingSlot.endTime})`
        }
      }

      const slot = await slotRepository.create(createData)
      return { success: true, slot }
    },

    async update(input: UpdateSlotInput): Promise<ManageSlotsResult> {
      if (!input.id) {
        return { success: false, error: 'Slot ID is required' }
      }
      if (!input.roomId) {
        return { success: false, error: 'Room is required' }
      }
      if (!input.date) {
        return { success: false, error: 'Date is required' }
      }
      if (!input.startTime) {
        return { success: false, error: 'Start time is required' }
      }
      if (!input.endTime) {
        return { success: false, error: 'End time is required' }
      }

      const timeError = validateTimeRange(input.startTime, input.endTime)
      if (timeError) {
        return { success: false, error: timeError }
      }

      const existing = await slotRepository.findById(input.id)
      if (!existing) {
        return { success: false, error: 'Slot not found' }
      }

      // Check for overlapping slots (excluding self)
      const overlappingSlot = await slotRepository.checkOverlap({
        id: input.id,
        editionId: existing.editionId,
        roomId: input.roomId,
        date: new Date(input.date),
        startTime: input.startTime,
        endTime: input.endTime,
        createdAt: existing.createdAt,
        updatedAt: new Date()
      })

      if (overlappingSlot) {
        return {
          success: false,
          error: `Slot overlaps with existing slot (${overlappingSlot.startTime} - ${overlappingSlot.endTime})`
        }
      }

      const updateData: UpdateSlot = {
        id: input.id,
        roomId: input.roomId,
        date: new Date(input.date),
        startTime: input.startTime,
        endTime: input.endTime
      }

      const slot = await slotRepository.update(updateData)
      return { success: true, slot }
    },

    async delete(id: string): Promise<ManageSlotsResult> {
      if (!id) {
        return { success: false, error: 'Slot ID is required' }
      }

      const session = await sessionRepository.findBySlot(id)
      if (session) {
        return {
          success: false,
          error: 'Cannot delete slot with existing session. Remove session first.'
        }
      }

      await slotRepository.delete(id)
      return { success: true }
    }
  }
}

export type ManageSlotsUseCase = ReturnType<typeof createManageSlotsUseCase>
