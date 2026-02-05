import { describe, expect, it } from 'vitest'
import {
  canCancelOrder,
  canRefundOrder,
  createOrderSchema,
  generateOrderNumber,
  getOrderStatusColor,
  getOrderStatusLabel,
  isOrderCompleted,
  orderSchema,
  orderStatusSchema
} from './order'

describe('Order', () => {
  const now = new Date()

  const validOrder = {
    id: 'ord-123',
    editionId: 'ed-456',
    orderNumber: 'ORD-ABC123-XYZ9',
    email: 'john@example.com',
    firstName: 'John',
    lastName: 'Doe',
    status: 'pending' as const,
    totalAmount: 9800,
    currency: 'EUR' as const,
    createdAt: now,
    updatedAt: now
  }

  describe('orderSchema', () => {
    it('should validate a valid order', () => {
      const result = orderSchema.safeParse(validOrder)
      expect(result.success).toBe(true)
    })

    it('should validate order with stripe fields', () => {
      const withStripe = {
        ...validOrder,
        stripeSessionId: 'cs_test_123',
        stripePaymentIntentId: 'pi_test_456',
        paidAt: now
      }
      const result = orderSchema.safeParse(withStripe)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const result = orderSchema.safeParse({ ...validOrder, email: 'not-email' })
      expect(result.success).toBe(false)
    })

    it('should reject empty first name', () => {
      const result = orderSchema.safeParse({ ...validOrder, firstName: '' })
      expect(result.success).toBe(false)
    })

    it('should reject negative total amount', () => {
      const result = orderSchema.safeParse({ ...validOrder, totalAmount: -100 })
      expect(result.success).toBe(false)
    })
  })

  describe('orderStatusSchema', () => {
    it('should accept all valid statuses', () => {
      const statuses = ['pending', 'paid', 'cancelled', 'refunded']
      for (const status of statuses) {
        const result = orderStatusSchema.safeParse(status)
        expect(result.success).toBe(true)
      }
    })

    it('should reject invalid status', () => {
      const result = orderStatusSchema.safeParse('processing')
      expect(result.success).toBe(false)
    })
  })

  describe('createOrderSchema', () => {
    it('should validate order creation data', () => {
      const createData = {
        editionId: 'ed-456',
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        totalAmount: 9800,
        currency: 'EUR'
      }
      const result = createOrderSchema.safeParse(createData)
      expect(result.success).toBe(true)
    })
  })

  describe('status helpers', () => {
    describe('canCancelOrder', () => {
      it('should allow cancelling pending orders', () => {
        expect(canCancelOrder('pending')).toBe(true)
      })

      it('should not allow cancelling paid orders', () => {
        expect(canCancelOrder('paid')).toBe(false)
      })

      it('should not allow cancelling already cancelled orders', () => {
        expect(canCancelOrder('cancelled')).toBe(false)
      })
    })

    describe('canRefundOrder', () => {
      it('should allow refunding paid orders', () => {
        expect(canRefundOrder('paid')).toBe(true)
      })

      it('should not allow refunding pending orders', () => {
        expect(canRefundOrder('pending')).toBe(false)
      })
    })

    describe('isOrderCompleted', () => {
      it('should return true for paid orders', () => {
        expect(isOrderCompleted('paid')).toBe(true)
      })

      it('should return false for pending orders', () => {
        expect(isOrderCompleted('pending')).toBe(false)
      })
    })

    describe('getOrderStatusLabel', () => {
      it('should return correct label for pending', () => {
        expect(getOrderStatusLabel('pending')).toBe('Pending')
      })

      it('should return correct label for paid', () => {
        expect(getOrderStatusLabel('paid')).toBe('Paid')
      })
    })

    describe('getOrderStatusColor', () => {
      it('should return yellow for pending', () => {
        expect(getOrderStatusColor('pending')).toBe('yellow')
      })

      it('should return green for paid', () => {
        expect(getOrderStatusColor('paid')).toBe('green')
      })
    })
  })

  describe('generateOrderNumber', () => {
    it('should generate a string starting with ORD-', () => {
      const number = generateOrderNumber()
      expect(number).toMatch(/^ORD-[A-Z0-9]+-[A-Z0-9]+$/)
    })

    it('should generate unique numbers', () => {
      const numbers = new Set(Array.from({ length: 10 }, () => generateOrderNumber()))
      expect(numbers.size).toBe(10)
    })
  })
})
