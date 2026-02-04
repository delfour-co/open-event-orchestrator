import { describe, expect, it } from 'vitest'
import { createRoom, roomSchema, validateRoom } from './room'

describe('Room Domain', () => {
  const validRoom = {
    id: 'room-1',
    editionId: 'edition-1',
    name: 'Main Hall',
    capacity: 500,
    floor: 'Ground Floor',
    description: 'The main conference hall',
    order: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  describe('roomSchema', () => {
    it('should validate a complete room', () => {
      const result = roomSchema.safeParse(validRoom)
      expect(result.success).toBe(true)
    })

    it('should validate a room with minimal fields', () => {
      const minimalRoom = {
        id: 'room-1',
        editionId: 'edition-1',
        name: 'Room A',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      const result = roomSchema.safeParse(minimalRoom)
      expect(result.success).toBe(true)
    })

    it('should reject empty name', () => {
      const result = roomSchema.safeParse({ ...validRoom, name: '' })
      expect(result.success).toBe(false)
    })

    it('should reject name over 100 characters', () => {
      const result = roomSchema.safeParse({ ...validRoom, name: 'a'.repeat(101) })
      expect(result.success).toBe(false)
    })

    it('should reject negative capacity', () => {
      const result = roomSchema.safeParse({ ...validRoom, capacity: -10 })
      expect(result.success).toBe(false)
    })

    it('should reject zero capacity', () => {
      const result = roomSchema.safeParse({ ...validRoom, capacity: 0 })
      expect(result.success).toBe(false)
    })

    it('should accept undefined capacity', () => {
      const { capacity, ...roomWithoutCapacity } = validRoom
      const result = roomSchema.safeParse(roomWithoutCapacity)
      expect(result.success).toBe(true)
    })

    it('should default order to 0', () => {
      const { order, ...roomWithoutOrder } = validRoom
      const result = roomSchema.parse(roomWithoutOrder)
      expect(result.order).toBe(0)
    })
  })

  describe('validateRoom', () => {
    it('should return validated room', () => {
      const result = validateRoom(validRoom)
      expect(result.id).toBe(validRoom.id)
      expect(result.name).toBe(validRoom.name)
    })

    it('should throw on invalid data', () => {
      expect(() => validateRoom({ ...validRoom, name: '' })).toThrow()
    })
  })

  describe('createRoom', () => {
    it('should validate create data without id and timestamps', () => {
      const createData = {
        editionId: 'edition-1',
        name: 'New Room',
        capacity: 100
      }
      const result = createRoom(createData)
      expect(result.name).toBe('New Room')
      expect(result.capacity).toBe(100)
    })

    it('should reject create data with missing editionId', () => {
      expect(() => createRoom({ name: 'Room' })).toThrow()
    })
  })
})
