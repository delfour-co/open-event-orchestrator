import { describe, expect, it } from 'vitest'
import { categorySchema, createCategorySchema } from './category'

describe('Category', () => {
  const validCategory = {
    id: 'cat-123',
    editionId: 'ed-456',
    name: 'Web Development',
    description: 'All things web',
    color: '#FF5733',
    order: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  describe('categorySchema', () => {
    it('should validate a valid category', () => {
      const result = categorySchema.safeParse(validCategory)
      expect(result.success).toBe(true)
    })

    it('should validate category without optional fields', () => {
      const minimal = {
        id: 'cat-123',
        editionId: 'ed-456',
        name: 'Web',
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      const result = categorySchema.safeParse(minimal)
      expect(result.success).toBe(true)
    })

    it('should reject name shorter than 2 characters', () => {
      const result = categorySchema.safeParse({ ...validCategory, name: 'A' })
      expect(result.success).toBe(false)
    })

    it('should reject name longer than 50 characters', () => {
      const result = categorySchema.safeParse({
        ...validCategory,
        name: 'A'.repeat(51)
      })
      expect(result.success).toBe(false)
    })

    it('should reject invalid color format', () => {
      const result = categorySchema.safeParse({
        ...validCategory,
        color: 'red'
      })
      expect(result.success).toBe(false)
    })

    it('should accept valid hex color', () => {
      const result = categorySchema.safeParse({
        ...validCategory,
        color: '#ABCDEF'
      })
      expect(result.success).toBe(true)
    })

    it('should reject negative order', () => {
      const result = categorySchema.safeParse({
        ...validCategory,
        order: -1
      })
      expect(result.success).toBe(false)
    })
  })

  describe('createCategorySchema', () => {
    it('should validate category creation data', () => {
      const createData = {
        editionId: 'ed-456',
        name: 'Mobile',
        description: 'Mobile development',
        color: '#00FF00',
        order: 2
      }
      const result = createCategorySchema.safeParse(createData)
      expect(result.success).toBe(true)
    })

    it('should reject if editionId is missing', () => {
      const result = createCategorySchema.safeParse({
        name: 'Mobile'
      })
      expect(result.success).toBe(false)
    })
  })
})
