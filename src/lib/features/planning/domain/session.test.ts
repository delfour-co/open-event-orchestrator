import { describe, expect, it } from 'vitest'
import {
  createSession,
  getSessionTypeColor,
  getSessionTypeLabel,
  isBreakSession,
  requiresTalk,
  sessionSchema,
  sessionTypeSchema,
  validateSession
} from './session'

describe('Session Domain', () => {
  const validSession = {
    id: 'session-1',
    editionId: 'edition-1',
    slotId: 'slot-1',
    talkId: 'talk-1',
    trackId: 'track-1',
    title: 'Building Scalable Apps',
    description: 'A deep dive into scalability',
    type: 'talk' as const,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  describe('sessionTypeSchema', () => {
    it('should accept all valid session types', () => {
      const types = [
        'talk',
        'workshop',
        'keynote',
        'panel',
        'break',
        'lunch',
        'networking',
        'registration',
        'other'
      ]
      for (const type of types) {
        const result = sessionTypeSchema.safeParse(type)
        expect(result.success).toBe(true)
      }
    })

    it('should reject invalid session type', () => {
      const result = sessionTypeSchema.safeParse('invalid')
      expect(result.success).toBe(false)
    })
  })

  describe('sessionSchema', () => {
    it('should validate a complete session', () => {
      const result = sessionSchema.safeParse(validSession)
      expect(result.success).toBe(true)
    })

    it('should validate a session without talkId (break)', () => {
      const breakSession = {
        ...validSession,
        talkId: undefined,
        type: 'break',
        title: 'Coffee Break'
      }
      const result = sessionSchema.safeParse(breakSession)
      expect(result.success).toBe(true)
    })

    it('should validate a session without trackId', () => {
      const { trackId, ...sessionWithoutTrack } = validSession
      const result = sessionSchema.safeParse(sessionWithoutTrack)
      expect(result.success).toBe(true)
    })

    it('should reject empty title', () => {
      const result = sessionSchema.safeParse({ ...validSession, title: '' })
      expect(result.success).toBe(false)
    })

    it('should reject title over 200 characters', () => {
      const result = sessionSchema.safeParse({ ...validSession, title: 'a'.repeat(201) })
      expect(result.success).toBe(false)
    })

    it('should reject description over 2000 characters', () => {
      const result = sessionSchema.safeParse({ ...validSession, description: 'a'.repeat(2001) })
      expect(result.success).toBe(false)
    })

    it('should default type to talk', () => {
      const { type, ...sessionWithoutType } = validSession
      const result = sessionSchema.parse(sessionWithoutType)
      expect(result.type).toBe('talk')
    })
  })

  describe('validateSession', () => {
    it('should return validated session', () => {
      const result = validateSession(validSession)
      expect(result.id).toBe(validSession.id)
      expect(result.title).toBe(validSession.title)
    })

    it('should throw on invalid data', () => {
      expect(() => validateSession({ ...validSession, title: '' })).toThrow()
    })
  })

  describe('createSession', () => {
    it('should validate create data without id and timestamps', () => {
      const createData = {
        editionId: 'edition-1',
        slotId: 'slot-1',
        title: 'New Session',
        type: 'talk' as const
      }
      const result = createSession(createData)
      expect(result.title).toBe('New Session')
    })

    it('should reject create data with missing slotId', () => {
      expect(() =>
        createSession({
          editionId: 'edition-1',
          title: 'Session'
        })
      ).toThrow()
    })
  })

  describe('isBreakSession', () => {
    it('should return true for break types', () => {
      const breakTypes = ['break', 'lunch', 'networking', 'registration']
      for (const type of breakTypes) {
        const session = { ...validSession, type: type as typeof validSession.type }
        expect(isBreakSession(session)).toBe(true)
      }
    })

    it('should return false for non-break types', () => {
      const nonBreakTypes = ['talk', 'workshop', 'keynote', 'panel', 'other']
      for (const type of nonBreakTypes) {
        const session = { ...validSession, type: type as typeof validSession.type }
        expect(isBreakSession(session)).toBe(false)
      }
    })
  })

  describe('requiresTalk', () => {
    it('should return true for talk-requiring types', () => {
      const talkTypes = ['talk', 'workshop', 'keynote', 'panel']
      for (const type of talkTypes) {
        const session = { ...validSession, type: type as typeof validSession.type }
        expect(requiresTalk(session)).toBe(true)
      }
    })

    it('should return false for non-talk types', () => {
      const nonTalkTypes = ['break', 'lunch', 'networking', 'registration', 'other']
      for (const type of nonTalkTypes) {
        const session = { ...validSession, type: type as typeof validSession.type }
        expect(requiresTalk(session)).toBe(false)
      }
    })
  })

  describe('getSessionTypeLabel', () => {
    it('should return correct labels', () => {
      expect(getSessionTypeLabel('talk')).toBe('Talk')
      expect(getSessionTypeLabel('workshop')).toBe('Workshop')
      expect(getSessionTypeLabel('keynote')).toBe('Keynote')
      expect(getSessionTypeLabel('break')).toBe('Break')
      expect(getSessionTypeLabel('lunch')).toBe('Lunch')
    })
  })

  describe('getSessionTypeColor', () => {
    it('should return correct colors', () => {
      expect(getSessionTypeColor('talk')).toBe('blue')
      expect(getSessionTypeColor('workshop')).toBe('purple')
      expect(getSessionTypeColor('keynote')).toBe('orange')
      expect(getSessionTypeColor('break')).toBe('gray')
      expect(getSessionTypeColor('lunch')).toBe('yellow')
    })
  })
})
