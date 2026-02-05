import { describe, expect, it } from 'vitest'
import {
  contactFullName,
  contactHasSocialProfiles,
  contactInitials,
  contactMatchesSearch,
  contactSchema
} from './contact'

describe('Contact', () => {
  const now = new Date()

  const validContact = {
    id: 'ct-001',
    eventId: 'evt-001',
    email: 'alice@example.com',
    firstName: 'Alice',
    lastName: 'Martin',
    company: 'Acme Corp',
    jobTitle: 'Engineer',
    source: 'manual' as const,
    tags: [],
    twitter: 'alicemartin',
    linkedin: 'https://linkedin.com/in/alicemartin',
    github: 'alicemartin',
    createdAt: now,
    updatedAt: now
  }

  describe('contactFullName', () => {
    it('should return "firstName lastName"', () => {
      const result = contactFullName({ firstName: 'Alice', lastName: 'Martin' })
      expect(result).toBe('Alice Martin')
    })

    it('should handle different names', () => {
      const result = contactFullName({ firstName: 'Bob', lastName: 'Dupont' })
      expect(result).toBe('Bob Dupont')
    })
  })

  describe('contactInitials', () => {
    it('should return uppercase initials', () => {
      const result = contactInitials({ firstName: 'Alice', lastName: 'Martin' })
      expect(result).toBe('AM')
    })

    it('should uppercase lowercase initials', () => {
      const result = contactInitials({ firstName: 'alice', lastName: 'martin' })
      expect(result).toBe('AM')
    })
  })

  describe('contactHasSocialProfiles', () => {
    it('should return true if twitter is set', () => {
      const result = contactHasSocialProfiles({
        twitter: 'alice',
        linkedin: undefined,
        github: undefined
      })
      expect(result).toBe(true)
    })

    it('should return true if linkedin is set', () => {
      const result = contactHasSocialProfiles({
        twitter: undefined,
        linkedin: 'https://linkedin.com/in/alice',
        github: undefined
      })
      expect(result).toBe(true)
    })

    it('should return true if github is set', () => {
      const result = contactHasSocialProfiles({
        twitter: undefined,
        linkedin: undefined,
        github: 'alice'
      })
      expect(result).toBe(true)
    })

    it('should return false if none are set', () => {
      const result = contactHasSocialProfiles({
        twitter: undefined,
        linkedin: undefined,
        github: undefined
      })
      expect(result).toBe(false)
    })

    it('should return false if all are empty strings', () => {
      const result = contactHasSocialProfiles({ twitter: '', linkedin: '', github: '' })
      expect(result).toBe(false)
    })
  })

  describe('contactMatchesSearch', () => {
    const contact = {
      firstName: 'Alice',
      lastName: 'Martin',
      email: 'alice@example.com',
      company: 'Acme Corp'
    }

    it('should match on firstName (case insensitive)', () => {
      expect(contactMatchesSearch(contact, 'alice')).toBe(true)
      expect(contactMatchesSearch(contact, 'ALICE')).toBe(true)
    })

    it('should match on lastName (case insensitive)', () => {
      expect(contactMatchesSearch(contact, 'martin')).toBe(true)
      expect(contactMatchesSearch(contact, 'MARTIN')).toBe(true)
    })

    it('should match on email (case insensitive)', () => {
      expect(contactMatchesSearch(contact, 'alice@example')).toBe(true)
    })

    it('should match on company (case insensitive)', () => {
      expect(contactMatchesSearch(contact, 'acme')).toBe(true)
    })

    it('should return false if no field matches', () => {
      expect(contactMatchesSearch(contact, 'unknown')).toBe(false)
    })

    it('should handle contact without company', () => {
      const noCompany = {
        firstName: 'Bob',
        lastName: 'Doe',
        email: 'bob@example.com',
        company: undefined
      }
      expect(contactMatchesSearch(noCompany, 'bob')).toBe(true)
      expect(contactMatchesSearch(noCompany, 'acme')).toBe(false)
    })
  })

  describe('contactSchema', () => {
    it('should validate a valid contact', () => {
      const result = contactSchema.safeParse(validContact)
      expect(result.success).toBe(true)
    })

    it('should reject an invalid email', () => {
      const result = contactSchema.safeParse({ ...validContact, email: 'not-an-email' })
      expect(result.success).toBe(false)
    })

    it('should reject empty firstName', () => {
      const result = contactSchema.safeParse({ ...validContact, firstName: '' })
      expect(result.success).toBe(false)
    })

    it('should reject empty lastName', () => {
      const result = contactSchema.safeParse({ ...validContact, lastName: '' })
      expect(result.success).toBe(false)
    })

    it('should validate with minimal required fields', () => {
      const minimal = {
        id: 'ct-002',
        eventId: 'evt-001',
        email: 'bob@example.com',
        firstName: 'Bob',
        lastName: 'Doe',
        createdAt: now,
        updatedAt: now
      }
      const result = contactSchema.safeParse(minimal)
      expect(result.success).toBe(true)
    })
  })
})
