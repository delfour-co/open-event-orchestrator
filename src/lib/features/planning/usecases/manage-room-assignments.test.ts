import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { RoomAssignment } from '../domain'
import type { RoomAssignmentRepository } from '../infra'
import {
  type ManageRoomAssignmentsUseCase,
  createManageRoomAssignmentsUseCase
} from './manage-room-assignments'

describe('ManageRoomAssignmentsUseCase', () => {
  let useCase: ManageRoomAssignmentsUseCase
  let mockRoomAssignmentRepository: RoomAssignmentRepository

  const mockAssignment: RoomAssignment = {
    id: 'assignment-1',
    editionId: 'edition-1',
    roomId: 'room-1',
    memberId: 'member-1',
    date: new Date('2024-06-15'),
    startTime: '09:00',
    endTime: '12:00',
    notes: 'Morning shift',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }

  beforeEach(() => {
    mockRoomAssignmentRepository = {
      findById: vi.fn(),
      findByEdition: vi.fn(),
      findByRoom: vi.fn(),
      findByMember: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    }

    useCase = createManageRoomAssignmentsUseCase(mockRoomAssignmentRepository)
  })

  describe('create', () => {
    it('should create an assignment with all fields', async () => {
      vi.mocked(mockRoomAssignmentRepository.create).mockResolvedValue(mockAssignment)

      const result = await useCase.create({
        editionId: 'edition-1',
        roomId: 'room-1',
        memberId: 'member-1',
        date: '2024-06-15',
        startTime: '09:00',
        endTime: '12:00',
        notes: '  Morning shift  '
      })

      expect(result.success).toBe(true)
      expect(result.assignment).toEqual(mockAssignment)
      expect(mockRoomAssignmentRepository.create).toHaveBeenCalledWith({
        editionId: 'edition-1',
        roomId: 'room-1',
        memberId: 'member-1',
        date: new Date('2024-06-15'),
        startTime: '09:00',
        endTime: '12:00',
        notes: 'Morning shift'
      })
    })

    it('should create an assignment with minimal fields', async () => {
      const minimalAssignment = {
        ...mockAssignment,
        date: undefined,
        startTime: undefined,
        endTime: undefined,
        notes: undefined
      }
      vi.mocked(mockRoomAssignmentRepository.create).mockResolvedValue(minimalAssignment)

      const result = await useCase.create({
        editionId: 'edition-1',
        roomId: 'room-1',
        memberId: 'member-1'
      })

      expect(result.success).toBe(true)
      expect(mockRoomAssignmentRepository.create).toHaveBeenCalledWith({
        editionId: 'edition-1',
        roomId: 'room-1',
        memberId: 'member-1',
        date: undefined,
        startTime: undefined,
        endTime: undefined,
        notes: undefined
      })
    })

    it('should handle null values for optional fields', async () => {
      vi.mocked(mockRoomAssignmentRepository.create).mockResolvedValue(mockAssignment)

      await useCase.create({
        editionId: 'edition-1',
        roomId: 'room-1',
        memberId: 'member-1',
        date: null,
        startTime: null,
        endTime: null,
        notes: null
      })

      expect(mockRoomAssignmentRepository.create).toHaveBeenCalledWith({
        editionId: 'edition-1',
        roomId: 'room-1',
        memberId: 'member-1',
        date: undefined,
        startTime: undefined,
        endTime: undefined,
        notes: undefined
      })
    })

    it('should trim notes whitespace', async () => {
      vi.mocked(mockRoomAssignmentRepository.create).mockResolvedValue(mockAssignment)

      await useCase.create({
        editionId: 'edition-1',
        roomId: 'room-1',
        memberId: 'member-1',
        notes: '  Important notes  '
      })

      expect(mockRoomAssignmentRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ notes: 'Important notes' })
      )
    })

    it('should return error when edition ID is missing', async () => {
      const result = await useCase.create({
        editionId: '',
        roomId: 'room-1',
        memberId: 'member-1'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Edition ID is required')
      expect(mockRoomAssignmentRepository.create).not.toHaveBeenCalled()
    })

    it('should return error when room is missing', async () => {
      const result = await useCase.create({
        editionId: 'edition-1',
        roomId: '',
        memberId: 'member-1'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Room is required')
    })

    it('should return error when team member is missing', async () => {
      const result = await useCase.create({
        editionId: 'edition-1',
        roomId: 'room-1',
        memberId: ''
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Team member is required')
    })
  })

  describe('update', () => {
    it('should update an assignment with all fields', async () => {
      const updatedAssignment = {
        ...mockAssignment,
        startTime: '10:00',
        endTime: '14:00',
        notes: 'Updated shift'
      }
      vi.mocked(mockRoomAssignmentRepository.findById).mockResolvedValue(mockAssignment)
      vi.mocked(mockRoomAssignmentRepository.update).mockResolvedValue(updatedAssignment)

      const result = await useCase.update({
        id: 'assignment-1',
        memberId: 'member-1',
        date: '2024-06-15',
        startTime: '10:00',
        endTime: '14:00',
        notes: '  Updated shift  '
      })

      expect(result.success).toBe(true)
      expect(result.assignment).toEqual(updatedAssignment)
      expect(mockRoomAssignmentRepository.update).toHaveBeenCalledWith({
        id: 'assignment-1',
        memberId: 'member-1',
        date: new Date('2024-06-15'),
        startTime: '10:00',
        endTime: '14:00',
        notes: 'Updated shift'
      })
    })

    it('should update an assignment with minimal fields', async () => {
      vi.mocked(mockRoomAssignmentRepository.findById).mockResolvedValue(mockAssignment)
      vi.mocked(mockRoomAssignmentRepository.update).mockResolvedValue(mockAssignment)

      const result = await useCase.update({
        id: 'assignment-1',
        memberId: 'member-2'
      })

      expect(result.success).toBe(true)
      expect(mockRoomAssignmentRepository.update).toHaveBeenCalledWith({
        id: 'assignment-1',
        memberId: 'member-2',
        date: undefined,
        startTime: undefined,
        endTime: undefined,
        notes: undefined
      })
    })

    it('should handle null values for optional fields', async () => {
      vi.mocked(mockRoomAssignmentRepository.findById).mockResolvedValue(mockAssignment)
      vi.mocked(mockRoomAssignmentRepository.update).mockResolvedValue(mockAssignment)

      await useCase.update({
        id: 'assignment-1',
        memberId: 'member-1',
        date: null,
        startTime: null,
        endTime: null,
        notes: null
      })

      expect(mockRoomAssignmentRepository.update).toHaveBeenCalledWith({
        id: 'assignment-1',
        memberId: 'member-1',
        date: undefined,
        startTime: undefined,
        endTime: undefined,
        notes: undefined
      })
    })

    it('should return error when id is missing', async () => {
      const result = await useCase.update({
        id: '',
        memberId: 'member-1'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Assignment ID is required')
    })

    it('should return error when team member is missing', async () => {
      const result = await useCase.update({
        id: 'assignment-1',
        memberId: ''
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Team member is required')
    })

    it('should return error when assignment not found', async () => {
      vi.mocked(mockRoomAssignmentRepository.findById).mockResolvedValue(null)

      const result = await useCase.update({
        id: 'nonexistent',
        memberId: 'member-1'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Assignment not found')
    })
  })

  describe('delete', () => {
    it('should delete an existing assignment', async () => {
      vi.mocked(mockRoomAssignmentRepository.findById).mockResolvedValue(mockAssignment)
      vi.mocked(mockRoomAssignmentRepository.delete).mockResolvedValue(undefined)

      const result = await useCase.delete('assignment-1')

      expect(result.success).toBe(true)
      expect(mockRoomAssignmentRepository.delete).toHaveBeenCalledWith('assignment-1')
    })

    it('should return error when id is missing', async () => {
      const result = await useCase.delete('')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Assignment ID is required')
      expect(mockRoomAssignmentRepository.delete).not.toHaveBeenCalled()
    })

    it('should return error when assignment not found', async () => {
      vi.mocked(mockRoomAssignmentRepository.findById).mockResolvedValue(null)

      const result = await useCase.delete('nonexistent')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Assignment not found')
      expect(mockRoomAssignmentRepository.delete).not.toHaveBeenCalled()
    })
  })
})
