import { describe, expect, it } from 'vitest'
import {
  calculateTotal,
  canAdminReview,
  canMarkAsPaid,
  canSpeakerEdit,
  createReimbursementItemSchema,
  createReimbursementRequestSchema,
  expenseTypeSchema,
  generateReimbursementNumber,
  getExpenseTypeLabel,
  getReimbursementStatusColor,
  getReimbursementStatusLabel,
  reimbursementItemSchema,
  reimbursementRequestSchema,
  reimbursementStatusSchema
} from './reimbursement'
import type { ReimbursementItem } from './reimbursement'

describe('Reimbursement', () => {
  const now = new Date()

  const validRequest = {
    id: 'rb-123',
    editionId: 'ed-456',
    speakerId: 'spk-789',
    requestNumber: 'RB-DEVFEST-0001',
    status: 'draft' as const,
    totalAmount: 350,
    currency: 'EUR' as const,
    notes: 'Travel expenses for DevFest',
    adminNotes: 'Approved by admin',
    reviewedBy: 'admin-001',
    reviewedAt: now,
    transactionId: 'tx-123',
    submittedAt: now,
    createdAt: now,
    updatedAt: now
  }

  const validItem = {
    id: 'ri-123',
    requestId: 'rb-123',
    expenseType: 'transport' as const,
    description: 'Train ticket Paris-Lyon',
    amount: 85,
    date: now,
    receipt: 'receipts/train-ticket.pdf',
    notes: 'Round trip',
    createdAt: now,
    updatedAt: now
  }

  describe('reimbursementRequestSchema', () => {
    it('should validate a complete request', () => {
      const result = reimbursementRequestSchema.safeParse(validRequest)
      expect(result.success).toBe(true)
    })

    it('should validate a minimal request', () => {
      const minimal = {
        id: 'rb-123',
        editionId: 'ed-456',
        speakerId: 'spk-789',
        requestNumber: 'RB-DEVFEST-0001',
        totalAmount: 0,
        createdAt: now,
        updatedAt: now
      }
      const result = reimbursementRequestSchema.safeParse(minimal)
      expect(result.success).toBe(true)
    })

    it('should apply default status and currency', () => {
      const minimal = {
        id: 'rb-123',
        editionId: 'ed-456',
        speakerId: 'spk-789',
        requestNumber: 'RB-DEVFEST-0001',
        totalAmount: 100,
        createdAt: now,
        updatedAt: now
      }
      const result = reimbursementRequestSchema.safeParse(minimal)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe('draft')
        expect(result.data.currency).toBe('EUR')
      }
    })

    it('should reject invalid status', () => {
      const result = reimbursementRequestSchema.safeParse({
        ...validRequest,
        status: 'pending'
      })
      expect(result.success).toBe(false)
    })

    it('should reject negative totalAmount', () => {
      const result = reimbursementRequestSchema.safeParse({
        ...validRequest,
        totalAmount: -100
      })
      expect(result.success).toBe(false)
    })
  })

  describe('reimbursementStatusSchema', () => {
    it('should accept all valid statuses', () => {
      const statuses = ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'paid']
      for (const status of statuses) {
        expect(reimbursementStatusSchema.safeParse(status).success).toBe(true)
      }
    })

    it('should reject invalid status', () => {
      expect(reimbursementStatusSchema.safeParse('pending').success).toBe(false)
    })
  })

  describe('createReimbursementRequestSchema', () => {
    it('should validate creation data', () => {
      const createData = {
        editionId: 'ed-456',
        speakerId: 'spk-789',
        totalAmount: 200,
        currency: 'EUR',
        status: 'draft'
      }
      const result = createReimbursementRequestSchema.safeParse(createData)
      expect(result.success).toBe(true)
    })

    it('should apply default status and currency', () => {
      const createData = {
        editionId: 'ed-456',
        speakerId: 'spk-789',
        totalAmount: 200
      }
      const result = createReimbursementRequestSchema.safeParse(createData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe('draft')
        expect(result.data.currency).toBe('EUR')
      }
    })
  })

  describe('reimbursementItemSchema', () => {
    it('should validate a complete item', () => {
      const result = reimbursementItemSchema.safeParse(validItem)
      expect(result.success).toBe(true)
    })

    it('should validate a minimal item', () => {
      const minimal = {
        id: 'ri-123',
        requestId: 'rb-123',
        expenseType: 'transport',
        description: 'Bus ticket',
        amount: 10,
        date: now,
        createdAt: now,
        updatedAt: now
      }
      const result = reimbursementItemSchema.safeParse(minimal)
      expect(result.success).toBe(true)
    })

    it('should reject empty description', () => {
      const result = reimbursementItemSchema.safeParse({
        ...validItem,
        description: ''
      })
      expect(result.success).toBe(false)
    })

    it('should reject description exceeding max length', () => {
      const result = reimbursementItemSchema.safeParse({
        ...validItem,
        description: 'a'.repeat(501)
      })
      expect(result.success).toBe(false)
    })

    it('should reject negative amount', () => {
      const result = reimbursementItemSchema.safeParse({
        ...validItem,
        amount: -50
      })
      expect(result.success).toBe(false)
    })

    it('should reject invalid expenseType', () => {
      const result = reimbursementItemSchema.safeParse({
        ...validItem,
        expenseType: 'entertainment'
      })
      expect(result.success).toBe(false)
    })
  })

  describe('createReimbursementItemSchema', () => {
    it('should validate creation data', () => {
      const createData = {
        requestId: 'rb-123',
        expenseType: 'meals',
        description: 'Dinner',
        amount: 45,
        date: now
      }
      const result = createReimbursementItemSchema.safeParse(createData)
      expect(result.success).toBe(true)
    })
  })

  describe('expenseTypeSchema', () => {
    it('should accept all valid expense types', () => {
      const types = ['transport', 'accommodation', 'meals', 'other']
      for (const type of types) {
        expect(expenseTypeSchema.safeParse(type).success).toBe(true)
      }
    })

    it('should reject invalid expense type', () => {
      expect(expenseTypeSchema.safeParse('entertainment').success).toBe(false)
    })
  })

  describe('getReimbursementStatusLabel', () => {
    it('should return correct label for draft', () => {
      expect(getReimbursementStatusLabel('draft')).toBe('Draft')
    })

    it('should return correct label for submitted', () => {
      expect(getReimbursementStatusLabel('submitted')).toBe('Submitted')
    })

    it('should return correct label for under_review', () => {
      expect(getReimbursementStatusLabel('under_review')).toBe('Under Review')
    })

    it('should return correct label for approved', () => {
      expect(getReimbursementStatusLabel('approved')).toBe('Approved')
    })

    it('should return correct label for rejected', () => {
      expect(getReimbursementStatusLabel('rejected')).toBe('Rejected')
    })

    it('should return correct label for paid', () => {
      expect(getReimbursementStatusLabel('paid')).toBe('Paid')
    })
  })

  describe('getReimbursementStatusColor', () => {
    it('should return yellow for draft', () => {
      expect(getReimbursementStatusColor('draft')).toBe('yellow')
    })

    it('should return blue for submitted', () => {
      expect(getReimbursementStatusColor('submitted')).toBe('blue')
    })

    it('should return orange for under_review', () => {
      expect(getReimbursementStatusColor('under_review')).toBe('orange')
    })

    it('should return green for approved', () => {
      expect(getReimbursementStatusColor('approved')).toBe('green')
    })

    it('should return red for rejected', () => {
      expect(getReimbursementStatusColor('rejected')).toBe('red')
    })

    it('should return gray for paid', () => {
      expect(getReimbursementStatusColor('paid')).toBe('gray')
    })
  })

  describe('getExpenseTypeLabel', () => {
    it('should return correct label for transport', () => {
      expect(getExpenseTypeLabel('transport')).toBe('Transport')
    })

    it('should return correct label for accommodation', () => {
      expect(getExpenseTypeLabel('accommodation')).toBe('Accommodation')
    })

    it('should return correct label for meals', () => {
      expect(getExpenseTypeLabel('meals')).toBe('Meals')
    })

    it('should return correct label for other', () => {
      expect(getExpenseTypeLabel('other')).toBe('Other')
    })
  })

  describe('canSpeakerEdit', () => {
    it('should allow editing draft request', () => {
      expect(canSpeakerEdit('draft')).toBe(true)
    })

    it('should not allow editing submitted request', () => {
      expect(canSpeakerEdit('submitted')).toBe(false)
    })

    it('should not allow editing under_review request', () => {
      expect(canSpeakerEdit('under_review')).toBe(false)
    })

    it('should not allow editing approved request', () => {
      expect(canSpeakerEdit('approved')).toBe(false)
    })

    it('should not allow editing rejected request', () => {
      expect(canSpeakerEdit('rejected')).toBe(false)
    })

    it('should not allow editing paid request', () => {
      expect(canSpeakerEdit('paid')).toBe(false)
    })
  })

  describe('canAdminReview', () => {
    it('should not allow reviewing draft request', () => {
      expect(canAdminReview('draft')).toBe(false)
    })

    it('should allow reviewing submitted request', () => {
      expect(canAdminReview('submitted')).toBe(true)
    })

    it('should allow reviewing under_review request', () => {
      expect(canAdminReview('under_review')).toBe(true)
    })

    it('should not allow reviewing approved request', () => {
      expect(canAdminReview('approved')).toBe(false)
    })

    it('should not allow reviewing rejected request', () => {
      expect(canAdminReview('rejected')).toBe(false)
    })

    it('should not allow reviewing paid request', () => {
      expect(canAdminReview('paid')).toBe(false)
    })
  })

  describe('canMarkAsPaid', () => {
    it('should not allow marking draft as paid', () => {
      expect(canMarkAsPaid('draft')).toBe(false)
    })

    it('should not allow marking submitted as paid', () => {
      expect(canMarkAsPaid('submitted')).toBe(false)
    })

    it('should not allow marking under_review as paid', () => {
      expect(canMarkAsPaid('under_review')).toBe(false)
    })

    it('should allow marking approved as paid', () => {
      expect(canMarkAsPaid('approved')).toBe(true)
    })

    it('should not allow marking rejected as paid', () => {
      expect(canMarkAsPaid('rejected')).toBe(false)
    })

    it('should not allow marking paid as paid', () => {
      expect(canMarkAsPaid('paid')).toBe(false)
    })
  })

  describe('calculateTotal', () => {
    it('should calculate total for multiple items', () => {
      const items: ReimbursementItem[] = [
        { ...validItem, amount: 85 },
        { ...validItem, id: 'ri-124', amount: 120 },
        { ...validItem, id: 'ri-125', amount: 45 }
      ]
      expect(calculateTotal(items)).toBe(250)
    })

    it('should return 0 for empty array', () => {
      expect(calculateTotal([])).toBe(0)
    })

    it('should calculate total for a single item', () => {
      const items: ReimbursementItem[] = [{ ...validItem, amount: 200 }]
      expect(calculateTotal(items)).toBe(200)
    })
  })

  describe('generateReimbursementNumber', () => {
    it('should generate correct format', () => {
      const result = generateReimbursementNumber('devfest', 1)
      expect(result).toBe('RB-DEVFEST-0001')
    })

    it('should pad sequence number', () => {
      const result = generateReimbursementNumber('conf', 42)
      expect(result).toBe('RB-CONF-0042')
    })

    it('should truncate long slug to 8 characters', () => {
      const result = generateReimbursementNumber('verylongeditionslug', 100)
      expect(result).toBe('RB-VERYLONG-0100')
    })

    it('should uppercase the slug', () => {
      const result = generateReimbursementNumber('myevent', 5)
      expect(result).toBe('RB-MYEVENT-0005')
    })
  })
})
