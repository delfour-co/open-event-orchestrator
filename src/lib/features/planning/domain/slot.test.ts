import { describe, expect, it } from 'vitest'
import { createSlot, getSlotDuration, slotSchema, slotsOverlap, validateSlot } from './slot'

describe('Slot Domain', () => {
  const validSlot = {
    id: 'slot-1',
    editionId: 'edition-1',
    roomId: 'room-1',
    date: new Date('2025-10-15'),
    startTime: '09:00',
    endTime: '09:45',
    createdAt: new Date(),
    updatedAt: new Date()
  }

  describe('slotSchema', () => {
    it('should validate a complete slot', () => {
      const result = slotSchema.safeParse(validSlot)
      expect(result.success).toBe(true)
    })

    it('should reject invalid start time format', () => {
      const result = slotSchema.safeParse({ ...validSlot, startTime: '9:00' })
      expect(result.success).toBe(false)
    })

    it('should reject invalid end time format', () => {
      const result = slotSchema.safeParse({ ...validSlot, endTime: '25:00' })
      expect(result.success).toBe(false)
    })

    it('should accept valid time formats', () => {
      const times = ['00:00', '09:30', '12:00', '18:45', '23:59']
      for (const time of times) {
        const result = slotSchema.safeParse({ ...validSlot, startTime: time, endTime: '23:59' })
        expect(result.success).toBe(true)
      }
    })

    it('should reject invalid hour', () => {
      const result = slotSchema.safeParse({ ...validSlot, startTime: '24:00' })
      expect(result.success).toBe(false)
    })

    it('should reject invalid minutes', () => {
      const result = slotSchema.safeParse({ ...validSlot, startTime: '09:60' })
      expect(result.success).toBe(false)
    })
  })

  describe('createSlot', () => {
    it('should validate create data', () => {
      const createData = {
        editionId: 'edition-1',
        roomId: 'room-1',
        date: new Date('2025-10-15'),
        startTime: '10:00',
        endTime: '11:00'
      }
      const result = createSlot(createData)
      expect(result.startTime).toBe('10:00')
    })

    it('should reject when end time is before start time', () => {
      const createData = {
        editionId: 'edition-1',
        roomId: 'room-1',
        date: new Date('2025-10-15'),
        startTime: '11:00',
        endTime: '10:00'
      }
      expect(() => createSlot(createData)).toThrow()
    })

    it('should reject when end time equals start time', () => {
      const createData = {
        editionId: 'edition-1',
        roomId: 'room-1',
        date: new Date('2025-10-15'),
        startTime: '10:00',
        endTime: '10:00'
      }
      expect(() => createSlot(createData)).toThrow()
    })
  })

  describe('validateSlot', () => {
    it('should return validated slot', () => {
      const result = validateSlot(validSlot)
      expect(result.id).toBe(validSlot.id)
    })

    it('should throw on invalid data', () => {
      expect(() => validateSlot({ ...validSlot, startTime: 'invalid' })).toThrow()
    })
  })

  describe('getSlotDuration', () => {
    it('should calculate duration in minutes', () => {
      const slot = { ...validSlot, startTime: '09:00', endTime: '09:45' }
      expect(getSlotDuration(slot)).toBe(45)
    })

    it('should handle hour boundaries', () => {
      const slot = { ...validSlot, startTime: '09:30', endTime: '10:30' }
      expect(getSlotDuration(slot)).toBe(60)
    })

    it('should handle multi-hour slots', () => {
      const slot = { ...validSlot, startTime: '09:00', endTime: '12:00' }
      expect(getSlotDuration(slot)).toBe(180)
    })

    it('should handle 15-minute slots', () => {
      const slot = { ...validSlot, startTime: '14:00', endTime: '14:15' }
      expect(getSlotDuration(slot)).toBe(15)
    })
  })

  describe('slotsOverlap', () => {
    const baseSlot = {
      ...validSlot,
      date: new Date('2025-10-15'),
      startTime: '10:00',
      endTime: '11:00'
    }

    it('should detect overlapping slots in same room', () => {
      const slot1 = { ...baseSlot, id: 'slot-1' }
      const slot2 = { ...baseSlot, id: 'slot-2', startTime: '10:30', endTime: '11:30' }
      expect(slotsOverlap(slot1, slot2)).toBe(true)
    })

    it('should detect complete overlap', () => {
      const slot1 = { ...baseSlot, id: 'slot-1', startTime: '09:00', endTime: '12:00' }
      const slot2 = { ...baseSlot, id: 'slot-2', startTime: '10:00', endTime: '11:00' }
      expect(slotsOverlap(slot1, slot2)).toBe(true)
    })

    it('should not detect overlap for adjacent slots', () => {
      const slot1 = { ...baseSlot, id: 'slot-1', startTime: '10:00', endTime: '11:00' }
      const slot2 = { ...baseSlot, id: 'slot-2', startTime: '11:00', endTime: '12:00' }
      expect(slotsOverlap(slot1, slot2)).toBe(false)
    })

    it('should not detect overlap for different rooms', () => {
      const slot1 = { ...baseSlot, id: 'slot-1', roomId: 'room-1' }
      const slot2 = {
        ...baseSlot,
        id: 'slot-2',
        roomId: 'room-2',
        startTime: '10:30',
        endTime: '11:30'
      }
      expect(slotsOverlap(slot1, slot2)).toBe(false)
    })

    it('should not detect overlap for different dates', () => {
      const slot1 = { ...baseSlot, id: 'slot-1', date: new Date('2025-10-15') }
      const slot2 = {
        ...baseSlot,
        id: 'slot-2',
        date: new Date('2025-10-16'),
        startTime: '10:30',
        endTime: '11:30'
      }
      expect(slotsOverlap(slot1, slot2)).toBe(false)
    })

    it('should not detect overlap for non-overlapping times', () => {
      const slot1 = { ...baseSlot, id: 'slot-1', startTime: '09:00', endTime: '10:00' }
      const slot2 = { ...baseSlot, id: 'slot-2', startTime: '11:00', endTime: '12:00' }
      expect(slotsOverlap(slot1, slot2)).toBe(false)
    })
  })
})
