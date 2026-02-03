import { describe, expect, it } from 'vitest'
import { createSpeakerSchema, getSpeakerFullName, speakerSchema } from './speaker'

describe('Speaker', () => {
  const validSpeaker = {
    id: 'spk-123',
    userId: 'usr-456',
    email: 'jane@example.com',
    firstName: 'Jane',
    lastName: 'Doe',
    bio: 'Senior developer at Acme Corp',
    company: 'Acme Corp',
    jobTitle: 'Senior Developer',
    photoUrl: 'https://example.com/photo.jpg',
    twitter: 'janedoe',
    linkedin: 'https://linkedin.com/in/janedoe',
    github: 'janedoe',
    city: 'Paris',
    country: 'France',
    createdAt: new Date(),
    updatedAt: new Date()
  }

  describe('speakerSchema', () => {
    it('should validate a valid speaker', () => {
      const result = speakerSchema.safeParse(validSpeaker)
      expect(result.success).toBe(true)
    })

    it('should validate speaker with only required fields', () => {
      const minimal = {
        id: 'spk-123',
        email: 'jane@example.com',
        firstName: 'Jane',
        lastName: 'Doe',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      const result = speakerSchema.safeParse(minimal)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const result = speakerSchema.safeParse({
        ...validSpeaker,
        email: 'not-an-email'
      })
      expect(result.success).toBe(false)
    })

    it('should reject empty firstName', () => {
      const result = speakerSchema.safeParse({
        ...validSpeaker,
        firstName: ''
      })
      expect(result.success).toBe(false)
    })

    it('should reject firstName longer than 50 characters', () => {
      const result = speakerSchema.safeParse({
        ...validSpeaker,
        firstName: 'A'.repeat(51)
      })
      expect(result.success).toBe(false)
    })

    it('should reject bio longer than 2000 characters', () => {
      const result = speakerSchema.safeParse({
        ...validSpeaker,
        bio: 'A'.repeat(2001)
      })
      expect(result.success).toBe(false)
    })

    it('should reject invalid photoUrl', () => {
      const result = speakerSchema.safeParse({
        ...validSpeaker,
        photoUrl: 'not-a-url'
      })
      expect(result.success).toBe(false)
    })

    it('should reject invalid linkedin URL', () => {
      const result = speakerSchema.safeParse({
        ...validSpeaker,
        linkedin: 'not-a-url'
      })
      expect(result.success).toBe(false)
    })
  })

  describe('createSpeakerSchema', () => {
    it('should validate speaker creation data', () => {
      const createData = {
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Smith',
        bio: 'Developer advocate'
      }
      const result = createSpeakerSchema.safeParse(createData)
      expect(result.success).toBe(true)
    })

    it('should reject if email is missing', () => {
      const result = createSpeakerSchema.safeParse({
        firstName: 'John',
        lastName: 'Smith'
      })
      expect(result.success).toBe(false)
    })
  })

  describe('getSpeakerFullName', () => {
    it('should return full name', () => {
      const result = getSpeakerFullName({ firstName: 'Jane', lastName: 'Doe' })
      expect(result).toBe('Jane Doe')
    })

    it('should handle single name', () => {
      const result = getSpeakerFullName({ firstName: 'Madonna', lastName: '' })
      expect(result).toBe('Madonna')
    })

    it('should trim outer whitespace', () => {
      const result = getSpeakerFullName({ firstName: 'Jane', lastName: 'Doe' })
      expect(result).toBe('Jane Doe')
    })
  })
})
