import { describe, expect, it } from 'vitest'
import {
  canConfirmTalk,
  canDeclineTalk,
  canEditTalk,
  canWithdrawTalk,
  createTalkSchema,
  getStatusColor,
  getStatusLabel,
  talkSchema,
  talkStatusSchema
} from './talk'

describe('Talk', () => {
  const validTalk = {
    id: 'talk-123',
    editionId: 'ed-456',
    title: 'Introduction to SvelteKit',
    abstract:
      'Learn the basics of SvelteKit and how to build modern web applications with this amazing framework.',
    description: 'A detailed talk about SvelteKit',
    categoryId: 'cat-789',
    formatId: 'fmt-101',
    language: 'en' as const,
    level: 'intermediate' as const,
    speakerIds: ['spk-111'],
    status: 'submitted' as const,
    submittedAt: new Date(),
    notes: 'Please schedule in the morning',
    createdAt: new Date(),
    updatedAt: new Date()
  }

  describe('talkSchema', () => {
    it('should validate a valid talk', () => {
      const result = talkSchema.safeParse(validTalk)
      expect(result.success).toBe(true)
    })

    it('should validate talk with minimal required fields', () => {
      const minimal = {
        id: 'talk-123',
        editionId: 'ed-456',
        title: 'My Talk Title Here',
        abstract:
          'A detailed abstract that is at least 50 characters long to meet the minimum requirement.',
        language: 'fr',
        speakerIds: ['spk-111'],
        createdAt: new Date(),
        updatedAt: new Date()
      }
      const result = talkSchema.safeParse(minimal)
      expect(result.success).toBe(true)
    })

    it('should reject title shorter than 5 characters', () => {
      const result = talkSchema.safeParse({ ...validTalk, title: 'Test' })
      expect(result.success).toBe(false)
    })

    it('should reject title longer than 200 characters', () => {
      const result = talkSchema.safeParse({
        ...validTalk,
        title: 'A'.repeat(201)
      })
      expect(result.success).toBe(false)
    })

    it('should reject abstract shorter than 50 characters', () => {
      const result = talkSchema.safeParse({
        ...validTalk,
        abstract: 'Too short'
      })
      expect(result.success).toBe(false)
    })

    it('should reject abstract longer than 500 characters', () => {
      const result = talkSchema.safeParse({
        ...validTalk,
        abstract: 'A'.repeat(501)
      })
      expect(result.success).toBe(false)
    })

    it('should reject empty speakerIds', () => {
      const result = talkSchema.safeParse({
        ...validTalk,
        speakerIds: []
      })
      expect(result.success).toBe(false)
    })

    it('should reject more than 5 speakers', () => {
      const result = talkSchema.safeParse({
        ...validTalk,
        speakerIds: ['1', '2', '3', '4', '5', '6']
      })
      expect(result.success).toBe(false)
    })

    it('should accept multiple speakers up to 5', () => {
      const result = talkSchema.safeParse({
        ...validTalk,
        speakerIds: ['1', '2', '3', '4', '5']
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid language', () => {
      const result = talkSchema.safeParse({
        ...validTalk,
        language: 'de'
      })
      expect(result.success).toBe(false)
    })

    it('should reject invalid level', () => {
      const result = talkSchema.safeParse({
        ...validTalk,
        level: 'expert'
      })
      expect(result.success).toBe(false)
    })
  })

  describe('talkStatusSchema', () => {
    it('should accept all valid statuses', () => {
      const statuses = [
        'draft',
        'submitted',
        'under_review',
        'accepted',
        'rejected',
        'confirmed',
        'declined',
        'withdrawn'
      ]
      for (const status of statuses) {
        const result = talkStatusSchema.safeParse(status)
        expect(result.success).toBe(true)
      }
    })

    it('should reject invalid status', () => {
      const result = talkStatusSchema.safeParse('pending')
      expect(result.success).toBe(false)
    })
  })

  describe('createTalkSchema', () => {
    it('should validate talk creation data', () => {
      const createData = {
        editionId: 'ed-456',
        title: 'My New Talk',
        abstract:
          'A detailed abstract that is at least 50 characters long to meet the minimum requirement.',
        language: 'en',
        speakerIds: ['spk-111']
      }
      const result = createTalkSchema.safeParse(createData)
      expect(result.success).toBe(true)
    })
  })

  describe('status helpers', () => {
    describe('canEditTalk', () => {
      it('should allow editing drafts', () => {
        expect(canEditTalk('draft')).toBe(true)
      })

      it('should allow editing submitted talks', () => {
        expect(canEditTalk('submitted')).toBe(true)
      })

      it('should not allow editing accepted talks', () => {
        expect(canEditTalk('accepted')).toBe(false)
      })

      it('should not allow editing rejected talks', () => {
        expect(canEditTalk('rejected')).toBe(false)
      })
    })

    describe('canWithdrawTalk', () => {
      it('should allow withdrawing submitted talks', () => {
        expect(canWithdrawTalk('submitted')).toBe(true)
      })

      it('should allow withdrawing accepted talks', () => {
        expect(canWithdrawTalk('accepted')).toBe(true)
      })

      it('should not allow withdrawing drafts', () => {
        expect(canWithdrawTalk('draft')).toBe(false)
      })

      it('should not allow withdrawing rejected talks', () => {
        expect(canWithdrawTalk('rejected')).toBe(false)
      })
    })

    describe('canConfirmTalk', () => {
      it('should allow confirming accepted talks', () => {
        expect(canConfirmTalk('accepted')).toBe(true)
      })

      it('should not allow confirming submitted talks', () => {
        expect(canConfirmTalk('submitted')).toBe(false)
      })
    })

    describe('canDeclineTalk', () => {
      it('should allow declining accepted talks', () => {
        expect(canDeclineTalk('accepted')).toBe(true)
      })

      it('should not allow declining submitted talks', () => {
        expect(canDeclineTalk('submitted')).toBe(false)
      })
    })

    describe('getStatusLabel', () => {
      it('should return correct label for draft', () => {
        expect(getStatusLabel('draft')).toBe('Draft')
      })

      it('should return correct label for under_review', () => {
        expect(getStatusLabel('under_review')).toBe('Under Review')
      })
    })

    describe('getStatusColor', () => {
      it('should return gray for draft', () => {
        expect(getStatusColor('draft')).toBe('gray')
      })

      it('should return green for accepted', () => {
        expect(getStatusColor('accepted')).toBe('green')
      })

      it('should return red for rejected', () => {
        expect(getStatusColor('rejected')).toBe('red')
      })
    })
  })
})
