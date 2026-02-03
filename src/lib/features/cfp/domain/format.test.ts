import { describe, expect, it } from 'vitest'
import { createFormatSchema, formatSchema } from './format'

describe('Format', () => {
  const validFormat = {
    id: 'fmt-123',
    editionId: 'ed-456',
    name: 'Conference Talk',
    description: 'Standard conference talk',
    duration: 45,
    order: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  describe('formatSchema', () => {
    it('should validate a valid format', () => {
      const result = formatSchema.safeParse(validFormat)
      expect(result.success).toBe(true)
    })

    it('should validate format without optional fields', () => {
      const minimal = {
        id: 'fmt-123',
        editionId: 'ed-456',
        name: 'Lightning',
        duration: 15,
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      const result = formatSchema.safeParse(minimal)
      expect(result.success).toBe(true)
    })

    it('should reject name shorter than 2 characters', () => {
      const result = formatSchema.safeParse({ ...validFormat, name: 'A' })
      expect(result.success).toBe(false)
    })

    it('should reject duration less than 5 minutes', () => {
      const result = formatSchema.safeParse({ ...validFormat, duration: 4 })
      expect(result.success).toBe(false)
    })

    it('should reject duration more than 480 minutes', () => {
      const result = formatSchema.safeParse({ ...validFormat, duration: 481 })
      expect(result.success).toBe(false)
    })

    it('should accept minimum valid duration', () => {
      const result = formatSchema.safeParse({ ...validFormat, duration: 5 })
      expect(result.success).toBe(true)
    })

    it('should accept maximum valid duration', () => {
      const result = formatSchema.safeParse({ ...validFormat, duration: 480 })
      expect(result.success).toBe(true)
    })

    it('should reject non-integer duration', () => {
      const result = formatSchema.safeParse({ ...validFormat, duration: 45.5 })
      expect(result.success).toBe(false)
    })
  })

  describe('createFormatSchema', () => {
    it('should validate format creation data', () => {
      const createData = {
        editionId: 'ed-456',
        name: 'Workshop',
        description: 'Hands-on workshop',
        duration: 180,
        order: 3
      }
      const result = createFormatSchema.safeParse(createData)
      expect(result.success).toBe(true)
    })

    it('should reject if duration is missing', () => {
      const result = createFormatSchema.safeParse({
        editionId: 'ed-456',
        name: 'Workshop'
      })
      expect(result.success).toBe(false)
    })
  })
})
