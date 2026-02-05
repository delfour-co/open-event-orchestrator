import { describe, expect, it } from 'vitest'
import { linkHasRole, linkIsAttendee, linkIsSpeaker } from './contact-edition-link'
import type { ContactEditionLink } from './contact-edition-link'

describe('ContactEditionLink', () => {
  const now = new Date()

  const makeLink = (overrides: Partial<ContactEditionLink> = {}): ContactEditionLink => ({
    id: 'cel-001',
    contactId: 'ct-001',
    editionId: 'ed-001',
    roles: [],
    createdAt: now,
    updatedAt: now,
    ...overrides
  })

  describe('linkHasRole', () => {
    it('should return true if role is in roles array', () => {
      const link = makeLink({ roles: ['speaker', 'attendee'] })
      expect(linkHasRole(link, 'speaker')).toBe(true)
    })

    it('should return false if role is not in roles array', () => {
      const link = makeLink({ roles: ['attendee'] })
      expect(linkHasRole(link, 'speaker')).toBe(false)
    })

    it('should return false for empty roles array', () => {
      const link = makeLink({ roles: [] })
      expect(linkHasRole(link, 'organizer')).toBe(false)
    })
  })

  describe('linkIsSpeaker', () => {
    it('should return true when roles includes speaker', () => {
      const link = makeLink({ roles: ['speaker'] })
      expect(linkIsSpeaker(link)).toBe(true)
    })

    it('should return true when roles includes speaker among others', () => {
      const link = makeLink({ roles: ['attendee', 'speaker', 'volunteer'] })
      expect(linkIsSpeaker(link)).toBe(true)
    })

    it('should return false when roles does not include speaker', () => {
      const link = makeLink({ roles: ['attendee', 'volunteer'] })
      expect(linkIsSpeaker(link)).toBe(false)
    })

    it('should return false for empty roles', () => {
      const link = makeLink({ roles: [] })
      expect(linkIsSpeaker(link)).toBe(false)
    })
  })

  describe('linkIsAttendee', () => {
    it('should return true when roles includes attendee', () => {
      const link = makeLink({ roles: ['attendee'] })
      expect(linkIsAttendee(link)).toBe(true)
    })

    it('should return true when roles includes attendee among others', () => {
      const link = makeLink({ roles: ['speaker', 'attendee'] })
      expect(linkIsAttendee(link)).toBe(true)
    })

    it('should return false when roles does not include attendee', () => {
      const link = makeLink({ roles: ['speaker', 'organizer'] })
      expect(linkIsAttendee(link)).toBe(false)
    })

    it('should return false for empty roles', () => {
      const link = makeLink({ roles: [] })
      expect(linkIsAttendee(link)).toBe(false)
    })
  })
})
