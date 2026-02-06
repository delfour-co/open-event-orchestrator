import { describe, expect, it } from 'vitest'
import {
  budgetQuoteSchema,
  calculateQuoteTotal,
  canConvertQuote,
  canEditQuote,
  canSendQuote,
  createQuoteSchema,
  generateQuoteNumber,
  getQuoteStatusColor,
  getQuoteStatusLabel,
  quoteLineItemSchema,
  quoteStatusSchema,
  updateQuoteSchema
} from './quote'

describe('BudgetQuote', () => {
  const now = new Date()

  const validLineItem = {
    description: 'Conference room rental',
    quantity: 2,
    unitPrice: 1500
  }

  const validQuote = {
    id: 'qt-123',
    editionId: 'ed-456',
    quoteNumber: 'QT-DEVFEST-0001',
    vendor: 'Palais des Congres',
    vendorEmail: 'contact@palais.fr',
    vendorAddress: '2 Place de la Porte Maillot, Paris',
    description: 'Venue rental for DevFest 2025',
    items: [validLineItem],
    totalAmount: 3000,
    currency: 'EUR' as const,
    status: 'draft' as const,
    validUntil: new Date('2025-12-31'),
    notes: 'Includes AV equipment',
    transactionId: 'tx-789',
    sentAt: now,
    createdAt: now,
    updatedAt: now
  }

  describe('quoteLineItemSchema', () => {
    it('should validate a valid line item', () => {
      const result = quoteLineItemSchema.safeParse(validLineItem)
      expect(result.success).toBe(true)
    })

    it('should reject empty description', () => {
      const result = quoteLineItemSchema.safeParse({
        ...validLineItem,
        description: ''
      })
      expect(result.success).toBe(false)
    })

    it('should reject negative quantity', () => {
      const result = quoteLineItemSchema.safeParse({
        ...validLineItem,
        quantity: -1
      })
      expect(result.success).toBe(false)
    })

    it('should reject zero quantity', () => {
      const result = quoteLineItemSchema.safeParse({
        ...validLineItem,
        quantity: 0
      })
      expect(result.success).toBe(false)
    })

    it('should accept zero unitPrice', () => {
      const result = quoteLineItemSchema.safeParse({
        ...validLineItem,
        unitPrice: 0
      })
      expect(result.success).toBe(true)
    })

    it('should reject negative unitPrice', () => {
      const result = quoteLineItemSchema.safeParse({
        ...validLineItem,
        unitPrice: -10
      })
      expect(result.success).toBe(false)
    })
  })

  describe('budgetQuoteSchema', () => {
    it('should validate a complete quote', () => {
      const result = budgetQuoteSchema.safeParse(validQuote)
      expect(result.success).toBe(true)
    })

    it('should validate a minimal quote', () => {
      const minimal = {
        id: 'qt-123',
        editionId: 'ed-456',
        quoteNumber: 'QT-DEVFEST-0001',
        vendor: 'Test Vendor',
        items: [{ description: 'Item', quantity: 1, unitPrice: 100 }],
        totalAmount: 100,
        createdAt: now,
        updatedAt: now
      }
      const result = budgetQuoteSchema.safeParse(minimal)
      expect(result.success).toBe(true)
    })

    it('should apply default currency and status', () => {
      const minimal = {
        id: 'qt-123',
        editionId: 'ed-456',
        quoteNumber: 'QT-DEVFEST-0001',
        vendor: 'Test Vendor',
        items: [{ description: 'Item', quantity: 1, unitPrice: 100 }],
        totalAmount: 100,
        createdAt: now,
        updatedAt: now
      }
      const result = budgetQuoteSchema.safeParse(minimal)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.currency).toBe('EUR')
        expect(result.data.status).toBe('draft')
      }
    })

    it('should reject empty vendor', () => {
      const result = budgetQuoteSchema.safeParse({
        ...validQuote,
        vendor: ''
      })
      expect(result.success).toBe(false)
    })

    it('should reject invalid vendorEmail', () => {
      const result = budgetQuoteSchema.safeParse({
        ...validQuote,
        vendorEmail: 'not-an-email'
      })
      expect(result.success).toBe(false)
    })

    it('should reject empty items array', () => {
      const result = budgetQuoteSchema.safeParse({
        ...validQuote,
        items: []
      })
      expect(result.success).toBe(false)
    })

    it('should reject negative totalAmount', () => {
      const result = budgetQuoteSchema.safeParse({
        ...validQuote,
        totalAmount: -100
      })
      expect(result.success).toBe(false)
    })

    it('should reject invalid status', () => {
      const result = budgetQuoteSchema.safeParse({
        ...validQuote,
        status: 'pending'
      })
      expect(result.success).toBe(false)
    })
  })

  describe('quoteStatusSchema', () => {
    it('should accept all valid statuses', () => {
      const statuses = ['draft', 'sent', 'accepted', 'rejected', 'expired']
      for (const status of statuses) {
        expect(quoteStatusSchema.safeParse(status).success).toBe(true)
      }
    })

    it('should reject invalid status', () => {
      expect(quoteStatusSchema.safeParse('pending').success).toBe(false)
    })
  })

  describe('createQuoteSchema', () => {
    it('should validate creation data', () => {
      const createData = {
        editionId: 'ed-456',
        vendor: 'Test Vendor',
        items: [{ description: 'Item', quantity: 1, unitPrice: 100 }],
        totalAmount: 100,
        currency: 'EUR',
        status: 'draft'
      }
      const result = createQuoteSchema.safeParse(createData)
      expect(result.success).toBe(true)
    })

    it('should apply default currency and status', () => {
      const createData = {
        editionId: 'ed-456',
        vendor: 'Test Vendor',
        items: [{ description: 'Item', quantity: 1, unitPrice: 100 }],
        totalAmount: 100
      }
      const result = createQuoteSchema.safeParse(createData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.currency).toBe('EUR')
        expect(result.data.status).toBe('draft')
      }
    })
  })

  describe('updateQuoteSchema', () => {
    it('should validate partial update data', () => {
      const result = updateQuoteSchema.safeParse({ vendor: 'New Vendor' })
      expect(result.success).toBe(true)
    })

    it('should validate update with multiple fields', () => {
      const result = updateQuoteSchema.safeParse({
        vendor: 'New Vendor',
        totalAmount: 5000,
        currency: 'USD',
        status: 'sent',
        notes: 'Updated notes'
      })
      expect(result.success).toBe(true)
    })

    it('should validate empty update', () => {
      const result = updateQuoteSchema.safeParse({})
      expect(result.success).toBe(true)
    })

    it('should reject invalid currency in update', () => {
      const result = updateQuoteSchema.safeParse({ currency: 'JPY' })
      expect(result.success).toBe(false)
    })
  })

  describe('calculateQuoteTotal', () => {
    it('should calculate total for multiple items', () => {
      const items = [
        { description: 'Room A', quantity: 2, unitPrice: 1500 },
        { description: 'Room B', quantity: 1, unitPrice: 800 },
        { description: 'AV Equipment', quantity: 3, unitPrice: 200 }
      ]
      expect(calculateQuoteTotal(items)).toBe(4400)
    })

    it('should calculate total for a single item', () => {
      const items = [{ description: 'Room', quantity: 5, unitPrice: 1000 }]
      expect(calculateQuoteTotal(items)).toBe(5000)
    })

    it('should return 0 for empty array', () => {
      expect(calculateQuoteTotal([])).toBe(0)
    })
  })

  describe('getQuoteStatusLabel', () => {
    it('should return correct label for draft', () => {
      expect(getQuoteStatusLabel('draft')).toBe('Draft')
    })

    it('should return correct label for sent', () => {
      expect(getQuoteStatusLabel('sent')).toBe('Sent')
    })

    it('should return correct label for accepted', () => {
      expect(getQuoteStatusLabel('accepted')).toBe('Accepted')
    })

    it('should return correct label for rejected', () => {
      expect(getQuoteStatusLabel('rejected')).toBe('Rejected')
    })

    it('should return correct label for expired', () => {
      expect(getQuoteStatusLabel('expired')).toBe('Expired')
    })
  })

  describe('getQuoteStatusColor', () => {
    it('should return yellow for draft', () => {
      expect(getQuoteStatusColor('draft')).toBe('yellow')
    })

    it('should return blue for sent', () => {
      expect(getQuoteStatusColor('sent')).toBe('blue')
    })

    it('should return green for accepted', () => {
      expect(getQuoteStatusColor('accepted')).toBe('green')
    })

    it('should return red for rejected', () => {
      expect(getQuoteStatusColor('rejected')).toBe('red')
    })

    it('should return gray for expired', () => {
      expect(getQuoteStatusColor('expired')).toBe('gray')
    })
  })

  describe('canEditQuote', () => {
    it('should allow editing draft quote', () => {
      expect(canEditQuote('draft')).toBe(true)
    })

    it('should not allow editing sent quote', () => {
      expect(canEditQuote('sent')).toBe(false)
    })

    it('should not allow editing accepted quote', () => {
      expect(canEditQuote('accepted')).toBe(false)
    })

    it('should not allow editing rejected quote', () => {
      expect(canEditQuote('rejected')).toBe(false)
    })

    it('should not allow editing expired quote', () => {
      expect(canEditQuote('expired')).toBe(false)
    })
  })

  describe('canSendQuote', () => {
    it('should allow sending draft quote', () => {
      expect(canSendQuote('draft')).toBe(true)
    })

    it('should not allow sending sent quote', () => {
      expect(canSendQuote('sent')).toBe(false)
    })

    it('should not allow sending accepted quote', () => {
      expect(canSendQuote('accepted')).toBe(false)
    })

    it('should not allow sending rejected quote', () => {
      expect(canSendQuote('rejected')).toBe(false)
    })

    it('should not allow sending expired quote', () => {
      expect(canSendQuote('expired')).toBe(false)
    })
  })

  describe('canConvertQuote', () => {
    it('should not allow converting draft quote', () => {
      expect(canConvertQuote('draft')).toBe(false)
    })

    it('should not allow converting sent quote', () => {
      expect(canConvertQuote('sent')).toBe(false)
    })

    it('should allow converting accepted quote', () => {
      expect(canConvertQuote('accepted')).toBe(true)
    })

    it('should not allow converting rejected quote', () => {
      expect(canConvertQuote('rejected')).toBe(false)
    })

    it('should not allow converting expired quote', () => {
      expect(canConvertQuote('expired')).toBe(false)
    })
  })

  describe('generateQuoteNumber', () => {
    it('should generate correct format', () => {
      const result = generateQuoteNumber('devfest', 1)
      expect(result).toBe('QT-DEVFEST-0001')
    })

    it('should pad sequence number', () => {
      const result = generateQuoteNumber('conf', 42)
      expect(result).toBe('QT-CONF-0042')
    })

    it('should truncate long slug to 8 characters', () => {
      const result = generateQuoteNumber('verylongeditionslug', 100)
      expect(result).toBe('QT-VERYLONG-0100')
    })

    it('should uppercase the slug', () => {
      const result = generateQuoteNumber('myevent', 5)
      expect(result).toBe('QT-MYEVENT-0005')
    })
  })
})
