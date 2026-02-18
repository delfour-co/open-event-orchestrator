import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Room, Slot } from '../domain'
import type { RoomRepository, SlotRepository } from '../infra'
import { type ManageRoomsUseCase, createManageRoomsUseCase } from './manage-rooms'

describe('ManageRoomsUseCase', () => {
  let useCase: ManageRoomsUseCase
  let mockRoomRepository: RoomRepository
  let mockSlotRepository: SlotRepository

  const mockRoom: Room = {
    id: 'room-1',
    editionId: 'edition-1',
    name: 'Main Hall',
    capacity: 200,
    floor: 'Ground',
    equipment: ['projector', 'microphone'],
    equipmentNotes: 'Large screen available',
    order: 0,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }

  const mockSlot: Slot = {
    id: 'slot-1',
    editionId: 'edition-1',
    roomId: 'room-1',
    date: new Date('2024-06-15'),
    startTime: '09:00',
    endTime: '10:00',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }

  beforeEach(() => {
    mockRoomRepository = {
      findById: vi.fn(),
      findByEdition: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    }

    mockSlotRepository = {
      findById: vi.fn(),
      findByEdition: vi.fn(),
      findByRoom: vi.fn(),
      findByDate: vi.fn(),
      checkOverlap: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    }

    useCase = createManageRoomsUseCase(mockRoomRepository, mockSlotRepository)
  })

  describe('create', () => {
    it('should create a room with valid input', async () => {
      vi.mocked(mockRoomRepository.create).mockResolvedValue(mockRoom)

      const result = await useCase.create({
        editionId: 'edition-1',
        name: 'Main Hall',
        capacity: 200,
        floor: 'Ground',
        equipment: ['projector', 'microphone'],
        equipmentNotes: 'Large screen available'
      })

      expect(result.success).toBe(true)
      expect(result.room).toEqual(mockRoom)
      expect(mockRoomRepository.create).toHaveBeenCalledWith({
        editionId: 'edition-1',
        name: 'Main Hall',
        capacity: 200,
        floor: 'Ground',
        equipment: ['projector', 'microphone'],
        equipmentNotes: 'Large screen available',
        order: 0
      })
    })

    it('should create a room with minimal input', async () => {
      const minimalRoom = { ...mockRoom, capacity: undefined, floor: undefined }
      vi.mocked(mockRoomRepository.create).mockResolvedValue(minimalRoom)

      const result = await useCase.create({
        editionId: 'edition-1',
        name: 'Small Room'
      })

      expect(result.success).toBe(true)
      expect(mockRoomRepository.create).toHaveBeenCalledWith({
        editionId: 'edition-1',
        name: 'Small Room',
        capacity: undefined,
        floor: undefined,
        equipment: [],
        equipmentNotes: undefined,
        order: 0
      })
    })

    it('should trim whitespace from name', async () => {
      vi.mocked(mockRoomRepository.create).mockResolvedValue(mockRoom)

      await useCase.create({
        editionId: 'edition-1',
        name: '  Main Hall  '
      })

      expect(mockRoomRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Main Hall' })
      )
    })

    it('should filter empty equipment values', async () => {
      vi.mocked(mockRoomRepository.create).mockResolvedValue(mockRoom)

      await useCase.create({
        editionId: 'edition-1',
        name: 'Room',
        equipment: ['projector', '', 'microphone', '']
      })

      expect(mockRoomRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ equipment: ['projector', 'microphone'] })
      )
    })

    it('should return error when name is empty', async () => {
      const result = await useCase.create({
        editionId: 'edition-1',
        name: ''
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Room name is required')
      expect(mockRoomRepository.create).not.toHaveBeenCalled()
    })

    it('should return error when name is whitespace only', async () => {
      const result = await useCase.create({
        editionId: 'edition-1',
        name: '   '
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Room name is required')
    })
  })

  describe('update', () => {
    it('should update a room with valid input', async () => {
      const updatedRoom = { ...mockRoom, name: 'Updated Hall', capacity: 300 }
      vi.mocked(mockRoomRepository.findById).mockResolvedValue(mockRoom)
      vi.mocked(mockRoomRepository.update).mockResolvedValue(updatedRoom)

      const result = await useCase.update({
        id: 'room-1',
        name: 'Updated Hall',
        capacity: 300
      })

      expect(result.success).toBe(true)
      expect(result.room).toEqual(updatedRoom)
      expect(mockRoomRepository.update).toHaveBeenCalledWith({
        id: 'room-1',
        name: 'Updated Hall',
        capacity: 300,
        floor: undefined,
        equipment: [],
        equipmentNotes: undefined
      })
    })

    it('should trim whitespace from update fields', async () => {
      vi.mocked(mockRoomRepository.findById).mockResolvedValue(mockRoom)
      vi.mocked(mockRoomRepository.update).mockResolvedValue(mockRoom)

      await useCase.update({
        id: 'room-1',
        name: '  Updated Hall  ',
        floor: '  First Floor  ',
        equipmentNotes: '  Notes  '
      })

      expect(mockRoomRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Updated Hall',
          floor: 'First Floor',
          equipmentNotes: 'Notes'
        })
      )
    })

    it('should return error when id is missing', async () => {
      const result = await useCase.update({
        id: '',
        name: 'Updated Hall'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Room ID is required')
    })

    it('should return error when name is empty', async () => {
      const result = await useCase.update({
        id: 'room-1',
        name: ''
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Room name is required')
    })

    it('should return error when room not found', async () => {
      vi.mocked(mockRoomRepository.findById).mockResolvedValue(null)

      const result = await useCase.update({
        id: 'nonexistent',
        name: 'Updated Hall'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Room not found')
    })
  })

  describe('delete', () => {
    it('should delete a room with no slots', async () => {
      vi.mocked(mockSlotRepository.findByRoom).mockResolvedValue([])
      vi.mocked(mockRoomRepository.delete).mockResolvedValue(undefined)

      const result = await useCase.delete('room-1')

      expect(result.success).toBe(true)
      expect(mockRoomRepository.delete).toHaveBeenCalledWith('room-1')
    })

    it('should return error when id is missing', async () => {
      const result = await useCase.delete('')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Room ID is required')
      expect(mockRoomRepository.delete).not.toHaveBeenCalled()
    })

    it('should return error when room has existing slots', async () => {
      vi.mocked(mockSlotRepository.findByRoom).mockResolvedValue([mockSlot])

      const result = await useCase.delete('room-1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Cannot delete room with existing slots. Delete slots first.')
      expect(mockRoomRepository.delete).not.toHaveBeenCalled()
    })
  })
})
