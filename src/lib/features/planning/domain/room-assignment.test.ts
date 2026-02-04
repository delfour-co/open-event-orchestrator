import { describe, expect, it } from 'vitest'
import {
  createRoomAssignment,
  roomAssignmentSchema,
  validateRoomAssignment
} from './room-assignment'

describe('RoomAssignment Domain', () => {
  const validAssignment = {
    id: 'assignment-1',
    roomId: 'room-1',
    memberId: 'member-1',
    editionId: 'edition-1',
    date: new Date('2025-10-15'),
    startTime: '09:00',
    endTime: '17:00',
    notes: 'Responsible for AV equipment setup',
    createdAt: new Date(),
    updatedAt: new Date()
  }

  describe('roomAssignmentSchema', () => {
    it('should validate a complete room assignment', () => {
      const result = roomAssignmentSchema.safeParse(validAssignment)
      expect(result.success).toBe(true)
    })

    it('should validate an assignment with minimal fields', () => {
      const minimalAssignment = {
        id: 'assignment-1',
        roomId: 'room-1',
        memberId: 'member-1',
        editionId: 'edition-1',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      const result = roomAssignmentSchema.safeParse(minimalAssignment)
      expect(result.success).toBe(true)
    })

    it('should accept optional date field', () => {
      const { date, ...assignmentWithoutDate } = validAssignment
      const result = roomAssignmentSchema.safeParse(assignmentWithoutDate)
      expect(result.success).toBe(true)
    })

    it('should accept optional startTime field', () => {
      const { startTime, ...assignmentWithoutStartTime } = validAssignment
      const result = roomAssignmentSchema.safeParse(assignmentWithoutStartTime)
      expect(result.success).toBe(true)
    })

    it('should accept optional endTime field', () => {
      const { endTime, ...assignmentWithoutEndTime } = validAssignment
      const result = roomAssignmentSchema.safeParse(assignmentWithoutEndTime)
      expect(result.success).toBe(true)
    })

    it('should accept optional notes field', () => {
      const { notes, ...assignmentWithoutNotes } = validAssignment
      const result = roomAssignmentSchema.safeParse(assignmentWithoutNotes)
      expect(result.success).toBe(true)
    })
  })

  describe('time format validation', () => {
    it('should accept valid time format HH:MM', () => {
      const result = roomAssignmentSchema.safeParse({
        ...validAssignment,
        startTime: '14:30',
        endTime: '18:45'
      })
      expect(result.success).toBe(true)
    })

    it('should accept time with single digit hour', () => {
      const result = roomAssignmentSchema.safeParse({
        ...validAssignment,
        startTime: '9:00',
        endTime: '5:30'
      })
      expect(result.success).toBe(true)
    })

    it('should accept midnight and end of day times', () => {
      const result = roomAssignmentSchema.safeParse({
        ...validAssignment,
        startTime: '00:00',
        endTime: '23:59'
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid time format without colon', () => {
      const result = roomAssignmentSchema.safeParse({
        ...validAssignment,
        startTime: '1430'
      })
      expect(result.success).toBe(false)
    })

    it('should reject invalid hour value', () => {
      const result = roomAssignmentSchema.safeParse({
        ...validAssignment,
        startTime: '25:00'
      })
      expect(result.success).toBe(false)
    })

    it('should reject invalid minute value', () => {
      const result = roomAssignmentSchema.safeParse({
        ...validAssignment,
        startTime: '14:60'
      })
      expect(result.success).toBe(false)
    })

    it('should reject time with seconds', () => {
      const result = roomAssignmentSchema.safeParse({
        ...validAssignment,
        startTime: '14:30:00'
      })
      expect(result.success).toBe(false)
    })

    it('should reject time with AM/PM format', () => {
      const result = roomAssignmentSchema.safeParse({
        ...validAssignment,
        startTime: '2:30 PM'
      })
      expect(result.success).toBe(false)
    })
  })

  describe('notes length limit', () => {
    it('should accept notes within limit', () => {
      const result = roomAssignmentSchema.safeParse({
        ...validAssignment,
        notes: 'Short note'
      })
      expect(result.success).toBe(true)
    })

    it('should accept notes at exactly 500 characters', () => {
      const result = roomAssignmentSchema.safeParse({
        ...validAssignment,
        notes: 'a'.repeat(500)
      })
      expect(result.success).toBe(true)
    })

    it('should reject notes over 500 characters', () => {
      const result = roomAssignmentSchema.safeParse({
        ...validAssignment,
        notes: 'a'.repeat(501)
      })
      expect(result.success).toBe(false)
    })
  })

  describe('createRoomAssignment', () => {
    it('should validate create data without id and timestamps', () => {
      const createData = {
        roomId: 'room-1',
        memberId: 'member-1',
        editionId: 'edition-1',
        date: new Date('2025-10-15'),
        startTime: '09:00',
        endTime: '17:00',
        notes: 'Morning shift'
      }
      const result = createRoomAssignment(createData)
      expect(result.roomId).toBe('room-1')
      expect(result.memberId).toBe('member-1')
      expect(result.editionId).toBe('edition-1')
      expect(result.startTime).toBe('09:00')
    })

    it('should validate create data with minimal fields', () => {
      const createData = {
        roomId: 'room-1',
        memberId: 'member-1',
        editionId: 'edition-1'
      }
      const result = createRoomAssignment(createData)
      expect(result.roomId).toBe('room-1')
      expect(result.memberId).toBe('member-1')
      expect(result.editionId).toBe('edition-1')
    })

    it('should reject create data with missing roomId', () => {
      expect(() =>
        createRoomAssignment({
          memberId: 'member-1',
          editionId: 'edition-1'
        })
      ).toThrow()
    })

    it('should reject create data with missing memberId', () => {
      expect(() =>
        createRoomAssignment({
          roomId: 'room-1',
          editionId: 'edition-1'
        })
      ).toThrow()
    })

    it('should reject create data with missing editionId', () => {
      expect(() =>
        createRoomAssignment({
          roomId: 'room-1',
          memberId: 'member-1'
        })
      ).toThrow()
    })
  })

  describe('validateRoomAssignment', () => {
    it('should return validated room assignment', () => {
      const result = validateRoomAssignment(validAssignment)
      expect(result.id).toBe(validAssignment.id)
      expect(result.roomId).toBe(validAssignment.roomId)
      expect(result.memberId).toBe(validAssignment.memberId)
      expect(result.editionId).toBe(validAssignment.editionId)
    })

    it('should throw on invalid data', () => {
      expect(() =>
        validateRoomAssignment({
          ...validAssignment,
          startTime: 'invalid'
        })
      ).toThrow()
    })

    it('should throw on missing required fields', () => {
      expect(() =>
        validateRoomAssignment({
          id: 'assignment-1',
          createdAt: new Date(),
          updatedAt: new Date()
        })
      ).toThrow()
    })
  })
})
