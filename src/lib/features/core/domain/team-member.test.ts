import { describe, expect, it } from 'vitest'
import {
  DEFAULT_TEAMS,
  SOCIAL_ICONS,
  createTeamMemberSchema,
  generateSlug,
  getSocialIcon,
  socialLinkSchema,
  teamMemberSchema,
  updateTeamMemberSchema
} from './team-member'

describe('Team Member Domain', () => {
  describe('socialLinkSchema', () => {
    it('should validate a valid social link', () => {
      const validSocial = {
        name: 'Twitter',
        icon: 'twitter',
        url: 'https://twitter.com/johndoe'
      }
      expect(() => socialLinkSchema.parse(validSocial)).not.toThrow()
    })

    it('should reject empty name', () => {
      const invalid = {
        name: '',
        icon: 'twitter',
        url: 'https://twitter.com/johndoe'
      }
      expect(() => socialLinkSchema.parse(invalid)).toThrow()
    })

    it('should reject invalid URL', () => {
      const invalid = {
        name: 'Twitter',
        icon: 'twitter',
        url: 'not-a-url'
      }
      expect(() => socialLinkSchema.parse(invalid)).toThrow()
    })
  })

  describe('teamMemberSchema', () => {
    const validMember = {
      id: 'member-1',
      editionId: 'edition-1',
      slug: 'john-doe',
      name: 'John Doe',
      team: 'Core Team',
      role: 'Event Manager',
      bio: 'A passionate event organizer',
      photo: 'photo.jpg',
      photoUrl: 'https://example.com/photo.jpg',
      socials: [
        {
          name: 'Twitter',
          icon: 'twitter',
          url: 'https://twitter.com/johndoe'
        }
      ],
      displayOrder: 1,
      created: new Date(),
      updated: new Date()
    }

    it('should validate a valid team member', () => {
      expect(() => teamMemberSchema.parse(validMember)).not.toThrow()
    })

    it('should validate a minimal team member', () => {
      const minimal = {
        id: 'member-1',
        editionId: 'edition-1',
        slug: 'john-doe',
        name: 'John Doe',
        socials: [],
        displayOrder: 0,
        created: new Date(),
        updated: new Date()
      }
      expect(() => teamMemberSchema.parse(minimal)).not.toThrow()
    })

    it('should reject empty name', () => {
      const invalid = { ...validMember, name: '' }
      expect(() => teamMemberSchema.parse(invalid)).toThrow()
    })

    it('should reject name longer than 200 characters', () => {
      const invalid = { ...validMember, name: 'a'.repeat(201) }
      expect(() => teamMemberSchema.parse(invalid)).toThrow()
    })

    it('should reject invalid slug format', () => {
      const invalid = { ...validMember, slug: 'Invalid Slug!' }
      expect(() => teamMemberSchema.parse(invalid)).toThrow()
    })

    it('should reject slug shorter than 2 characters', () => {
      const invalid = { ...validMember, slug: 'a' }
      expect(() => teamMemberSchema.parse(invalid)).toThrow()
    })

    it('should reject negative display order', () => {
      const invalid = { ...validMember, displayOrder: -1 }
      expect(() => teamMemberSchema.parse(invalid)).toThrow()
    })

    it('should allow empty photoUrl', () => {
      const valid = { ...validMember, photoUrl: '' }
      expect(() => teamMemberSchema.parse(valid)).not.toThrow()
    })
  })

  describe('createTeamMemberSchema', () => {
    it('should validate create input without id and timestamps', () => {
      const createInput = {
        editionId: 'edition-1',
        slug: 'john-doe',
        name: 'John Doe',
        team: 'Core Team',
        socials: [],
        displayOrder: 0
      }
      expect(() => createTeamMemberSchema.parse(createInput)).not.toThrow()
    })
  })

  describe('updateTeamMemberSchema', () => {
    it('should allow partial updates', () => {
      const updateInput = { name: 'Jane Doe' }
      expect(() => updateTeamMemberSchema.parse(updateInput)).not.toThrow()
    })

    it('should allow empty update', () => {
      expect(() => updateTeamMemberSchema.parse({})).not.toThrow()
    })
  })

  describe('generateSlug', () => {
    it('should generate lowercase slug', () => {
      expect(generateSlug('John Doe')).toBe('john-doe')
    })

    it('should remove accents', () => {
      expect(generateSlug('José García')).toBe('jose-garcia')
    })

    it('should replace special characters with dashes', () => {
      expect(generateSlug('John@Doe#123')).toBe('john-doe-123')
    })

    it('should remove leading and trailing dashes', () => {
      expect(generateSlug('---John Doe---')).toBe('john-doe')
    })

    it('should collapse multiple dashes', () => {
      expect(generateSlug('John    Doe')).toBe('john-doe')
    })

    it('should handle unicode characters', () => {
      expect(generateSlug('François Müller')).toBe('francois-muller')
    })
  })

  describe('getSocialIcon', () => {
    it('should return twitter icon for Twitter', () => {
      expect(getSocialIcon('Twitter')).toBe('twitter')
    })

    it('should return twitter icon for X', () => {
      expect(getSocialIcon('X')).toBe('twitter')
    })

    it('should return linkedin icon for LinkedIn', () => {
      expect(getSocialIcon('LinkedIn')).toBe('linkedin')
    })

    it('should return github icon for GitHub', () => {
      expect(getSocialIcon('GitHub')).toBe('github')
    })

    it('should be case insensitive', () => {
      expect(getSocialIcon('TWITTER')).toBe('twitter')
      expect(getSocialIcon('linkedin')).toBe('linkedin')
    })

    it('should return link for unknown social networks', () => {
      expect(getSocialIcon('MySpace')).toBe('link')
    })

    it('should trim whitespace', () => {
      expect(getSocialIcon('  twitter  ')).toBe('twitter')
    })
  })

  describe('SOCIAL_ICONS', () => {
    it('should have common social networks', () => {
      expect(SOCIAL_ICONS).toHaveProperty('twitter')
      expect(SOCIAL_ICONS).toHaveProperty('linkedin')
      expect(SOCIAL_ICONS).toHaveProperty('github')
      expect(SOCIAL_ICONS).toHaveProperty('youtube')
      expect(SOCIAL_ICONS).toHaveProperty('instagram')
    })
  })

  describe('DEFAULT_TEAMS', () => {
    it('should include common team names', () => {
      expect(DEFAULT_TEAMS).toContain('Core Team')
      expect(DEFAULT_TEAMS).toContain('Organizers')
      expect(DEFAULT_TEAMS).toContain('Volunteers')
      expect(DEFAULT_TEAMS).toContain('Staff')
    })

    it('should be an array of strings', () => {
      expect(Array.isArray(DEFAULT_TEAMS)).toBe(true)
      for (const team of DEFAULT_TEAMS) {
        expect(typeof team).toBe('string')
      }
    })
  })
})
