import type { CreateRoom, Room, UpdateRoom } from '../domain'
import type { RoomRepository, SlotRepository } from '../infra'

export interface CreateRoomInput {
  editionId: string
  name: string
  capacity?: number
  floor?: string
  equipment?: string[]
  equipmentNotes?: string
}

export interface UpdateRoomInput {
  id: string
  name: string
  capacity?: number
  floor?: string
  equipment?: string[]
  equipmentNotes?: string
}

export interface ManageRoomsResult {
  success: boolean
  room?: Room
  error?: string
}

export const createManageRoomsUseCase = (
  roomRepository: RoomRepository,
  slotRepository: SlotRepository
) => {
  return {
    async create(input: CreateRoomInput): Promise<ManageRoomsResult> {
      if (!input.name || input.name.trim().length === 0) {
        return { success: false, error: 'Room name is required' }
      }

      const createData: CreateRoom = {
        editionId: input.editionId,
        name: input.name.trim(),
        capacity: input.capacity,
        floor: input.floor?.trim(),
        equipment: input.equipment?.filter((e) => e) ?? [],
        equipmentNotes: input.equipmentNotes?.trim(),
        order: 0
      }

      const room = await roomRepository.create(createData)
      return { success: true, room }
    },

    async update(input: UpdateRoomInput): Promise<ManageRoomsResult> {
      if (!input.id) {
        return { success: false, error: 'Room ID is required' }
      }
      if (!input.name || input.name.trim().length === 0) {
        return { success: false, error: 'Room name is required' }
      }

      const existing = await roomRepository.findById(input.id)
      if (!existing) {
        return { success: false, error: 'Room not found' }
      }

      const updateData: UpdateRoom = {
        id: input.id,
        name: input.name.trim(),
        capacity: input.capacity,
        floor: input.floor?.trim(),
        equipment: input.equipment?.filter((e) => e) ?? [],
        equipmentNotes: input.equipmentNotes?.trim()
      }

      const room = await roomRepository.update(updateData)
      return { success: true, room }
    },

    async delete(id: string): Promise<ManageRoomsResult> {
      if (!id) {
        return { success: false, error: 'Room ID is required' }
      }

      const slots = await slotRepository.findByRoom(id)
      if (slots.length > 0) {
        return {
          success: false,
          error: 'Cannot delete room with existing slots. Delete slots first.'
        }
      }

      await roomRepository.delete(id)
      return { success: true }
    }
  }
}

export type ManageRoomsUseCase = ReturnType<typeof createManageRoomsUseCase>
