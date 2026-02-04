import { describe, expect, it } from 'vitest'
import { createTrack, trackSchema, validateTrack } from './track'

describe('Track Domain', () => {
  const validTrack = {
    id: 'track-1',
    editionId: 'edition-1',
    name: 'Web Development',
    color: '#3b82f6',
    description: 'All things web',
    order: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  describe('trackSchema', () => {
    it('should validate a complete track', () => {
      const result = trackSchema.safeParse(validTrack)
      expect(result.success).toBe(true)
    })

    it('should validate a track with minimal fields', () => {
      const minimalTrack = {
        id: 'track-1',
        editionId: 'edition-1',
        name: 'Track A',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      const result = trackSchema.safeParse(minimalTrack)
      expect(result.success).toBe(true)
    })

    it('should reject empty name', () => {
      const result = trackSchema.safeParse({ ...validTrack, name: '' })
      expect(result.success).toBe(false)
    })

    it('should reject name over 100 characters', () => {
      const result = trackSchema.safeParse({ ...validTrack, name: 'a'.repeat(101) })
      expect(result.success).toBe(false)
    })

    it('should reject invalid color format', () => {
      const result = trackSchema.safeParse({ ...validTrack, color: 'red' })
      expect(result.success).toBe(false)
    })

    it('should reject color without hash', () => {
      const result = trackSchema.safeParse({ ...validTrack, color: '3b82f6' })
      expect(result.success).toBe(false)
    })

    it('should accept valid hex colors', () => {
      const colors = ['#000000', '#FFFFFF', '#3b82f6', '#ABC123']
      for (const color of colors) {
        const result = trackSchema.safeParse({ ...validTrack, color })
        expect(result.success).toBe(true)
      }
    })

    it('should default color to gray', () => {
      const { color, ...trackWithoutColor } = validTrack
      const result = trackSchema.parse(trackWithoutColor)
      expect(result.color).toBe('#6b7280')
    })

    it('should default order to 0', () => {
      const { order, ...trackWithoutOrder } = validTrack
      const result = trackSchema.parse(trackWithoutOrder)
      expect(result.order).toBe(0)
    })
  })

  describe('validateTrack', () => {
    it('should return validated track', () => {
      const result = validateTrack(validTrack)
      expect(result.id).toBe(validTrack.id)
      expect(result.name).toBe(validTrack.name)
    })

    it('should throw on invalid data', () => {
      expect(() => validateTrack({ ...validTrack, color: 'invalid' })).toThrow()
    })
  })

  describe('createTrack', () => {
    it('should validate create data without id and timestamps', () => {
      const createData = {
        editionId: 'edition-1',
        name: 'New Track',
        color: '#ff0000'
      }
      const result = createTrack(createData)
      expect(result.name).toBe('New Track')
      expect(result.color).toBe('#ff0000')
    })

    it('should reject create data with missing name', () => {
      expect(() => createTrack({ editionId: 'edition-1' })).toThrow()
    })
  })
})
