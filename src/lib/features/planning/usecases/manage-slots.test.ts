import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Session, Slot } from '../domain'
import type { SessionRepository, SlotRepository } from '../infra'
import { type ManageSlotsUseCase, createManageSlotsUseCase } from './manage-slots'

describe('ManageSlotsUseCase', () => {
  let useCase: ManageSlotsUseCase
  let mockSlotRepository: SlotRepository
  let mockSessionRepository: SessionRepository

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

  const mockSession: Session = {
    id: 'session-1',
    editionId: 'edition-1',
    slotId: 'slot-1',
    title: 'Test Session',
    type: 'talk',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }

  beforeEach(() => {
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

    useCase = createManageSlotsUseCase(mockSlotRepository, mockSessionRepository)
  })

  describe('create', () => {
    it('should create a slot with valid input', async () => {
      vi.mocked(mockSlotRepository.checkOverlap).mockResolvedValue(null)
      vi.mocked(mockSlotRepository.create).mockResolvedValue(mockSlot)

      const result = await useCase.create({
        editionId: 'edition-1',
        roomId: 'room-1',
        date: '2024-06-15',
        startTime: '09:00',
        endTime: '10:00'
      })

      expect(result.success).toBe(true)
      expect(result.slot).toEqual(mockSlot)
      expect(mockSlotRepository.create).toHaveBeenCalledWith({
        editionId: 'edition-1',
        roomId: 'room-1',
        date: new Date('2024-06-15'),
        startTime: '09:00',
        endTime: '10:00'
      })
    })

    it('should return error when room is missing', async () => {
      const result = await useCase.create({
        editionId: 'edition-1',
        roomId: '',
        date: '2024-06-15',
        startTime: '09:00',
        endTime: '10:00'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Room is required')
    })

    it('should return error when date is missing', async () => {
      const result = await useCase.create({
        editionId: 'edition-1',
        roomId: 'room-1',
        date: '',
        startTime: '09:00',
        endTime: '10:00'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Date is required')
    })

    it('should return error when start time is missing', async () => {
      const result = await useCase.create({
        editionId: 'edition-1',
        roomId: 'room-1',
        date: '2024-06-15',
        startTime: '',
        endTime: '10:00'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Start time is required')
    })

    it('should return error when end time is missing', async () => {
      const result = await useCase.create({
        editionId: 'edition-1',
        roomId: 'room-1',
        date: '2024-06-15',
        startTime: '09:00',
        endTime: ''
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('End time is required')
    })

    it('should return error when end time is before start time', async () => {
      const result = await useCase.create({
        editionId: 'edition-1',
        roomId: 'room-1',
        date: '2024-06-15',
        startTime: '10:00',
        endTime: '09:00'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('End time must be after start time')
    })

    it('should return error when end time equals start time', async () => {
      const result = await useCase.create({
        editionId: 'edition-1',
        roomId: 'room-1',
        date: '2024-06-15',
        startTime: '09:00',
        endTime: '09:00'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('End time must be after start time')
    })

    it('should return error when slot overlaps with existing', async () => {
      const overlappingSlot = { ...mockSlot, id: 'slot-2' }
      vi.mocked(mockSlotRepository.checkOverlap).mockResolvedValue(overlappingSlot)

      const result = await useCase.create({
        editionId: 'edition-1',
        roomId: 'room-1',
        date: '2024-06-15',
        startTime: '09:30',
        endTime: '10:30'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Slot overlaps with existing slot (09:00 - 10:00)')
    })
  })

  describe('update', () => {
    it('should update a slot with valid input', async () => {
      const updatedSlot = { ...mockSlot, startTime: '10:00', endTime: '11:00' }
      vi.mocked(mockSlotRepository.findById).mockResolvedValue(mockSlot)
      vi.mocked(mockSlotRepository.checkOverlap).mockResolvedValue(null)
      vi.mocked(mockSlotRepository.update).mockResolvedValue(updatedSlot)

      const result = await useCase.update({
        id: 'slot-1',
        roomId: 'room-1',
        date: '2024-06-15',
        startTime: '10:00',
        endTime: '11:00'
      })

      expect(result.success).toBe(true)
      expect(result.slot).toEqual(updatedSlot)
    })

    it('should return error when id is missing', async () => {
      const result = await useCase.update({
        id: '',
        roomId: 'room-1',
        date: '2024-06-15',
        startTime: '09:00',
        endTime: '10:00'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Slot ID is required')
    })

    it('should return error when room is missing', async () => {
      const result = await useCase.update({
        id: 'slot-1',
        roomId: '',
        date: '2024-06-15',
        startTime: '09:00',
        endTime: '10:00'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Room is required')
    })

    it('should return error when date is missing', async () => {
      const result = await useCase.update({
        id: 'slot-1',
        roomId: 'room-1',
        date: '',
        startTime: '09:00',
        endTime: '10:00'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Date is required')
    })

    it('should return error when times are invalid', async () => {
      const result = await useCase.update({
        id: 'slot-1',
        roomId: 'room-1',
        date: '2024-06-15',
        startTime: '11:00',
        endTime: '10:00'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('End time must be after start time')
    })

    it('should return error when slot not found', async () => {
      vi.mocked(mockSlotRepository.findById).mockResolvedValue(null)

      const result = await useCase.update({
        id: 'nonexistent',
        roomId: 'room-1',
        date: '2024-06-15',
        startTime: '09:00',
        endTime: '10:00'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Slot not found')
    })

    it('should return error when update creates overlap', async () => {
      const overlappingSlot = { ...mockSlot, id: 'slot-2', startTime: '10:30', endTime: '11:30' }
      vi.mocked(mockSlotRepository.findById).mockResolvedValue(mockSlot)
      vi.mocked(mockSlotRepository.checkOverlap).mockResolvedValue(overlappingSlot)

      const result = await useCase.update({
        id: 'slot-1',
        roomId: 'room-1',
        date: '2024-06-15',
        startTime: '10:00',
        endTime: '11:00'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Slot overlaps with existing slot (10:30 - 11:30)')
    })

    it('should pass slot id to checkOverlap for self-exclusion', async () => {
      vi.mocked(mockSlotRepository.findById).mockResolvedValue(mockSlot)
      vi.mocked(mockSlotRepository.checkOverlap).mockResolvedValue(null)
      vi.mocked(mockSlotRepository.update).mockResolvedValue(mockSlot)

      await useCase.update({
        id: 'slot-1',
        roomId: 'room-1',
        date: '2024-06-15',
        startTime: '09:30',
        endTime: '10:30'
      })

      expect(mockSlotRepository.checkOverlap).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'slot-1' })
      )
    })
  })

  describe('delete', () => {
    it('should delete a slot with no session', async () => {
      vi.mocked(mockSessionRepository.findBySlot).mockResolvedValue(null)
      vi.mocked(mockSlotRepository.delete).mockResolvedValue(undefined)

      const result = await useCase.delete('slot-1')

      expect(result.success).toBe(true)
      expect(mockSlotRepository.delete).toHaveBeenCalledWith('slot-1')
    })

    it('should return error when id is missing', async () => {
      const result = await useCase.delete('')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Slot ID is required')
      expect(mockSlotRepository.delete).not.toHaveBeenCalled()
    })

    it('should return error when slot has existing session', async () => {
      vi.mocked(mockSessionRepository.findBySlot).mockResolvedValue(mockSession)

      const result = await useCase.delete('slot-1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Cannot delete slot with existing session. Remove session first.')
      expect(mockSlotRepository.delete).not.toHaveBeenCalled()
    })
  })
})
