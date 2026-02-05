import { describe, expect, it } from 'vitest'
import { calculateItemTotal, createOrderItemSchema, orderItemSchema } from './order-item'

describe('OrderItem', () => {
  const now = new Date()

  const validOrderItem = {
    id: 'oi-123',
    orderId: 'ord-456',
    ticketTypeId: 'tt-789',
    ticketTypeName: 'Early Bird',
    quantity: 2,
    unitPrice: 4900,
    totalPrice: 9800,
    createdAt: now,
    updatedAt: now
  }

  describe('orderItemSchema', () => {
    it('should validate a valid order item', () => {
      const result = orderItemSchema.safeParse(validOrderItem)
      expect(result.success).toBe(true)
    })

    it('should reject quantity less than 1', () => {
      const result = orderItemSchema.safeParse({ ...validOrderItem, quantity: 0 })
      expect(result.success).toBe(false)
    })

    it('should reject negative unit price', () => {
      const result = orderItemSchema.safeParse({ ...validOrderItem, unitPrice: -100 })
      expect(result.success).toBe(false)
    })
  })

  describe('createOrderItemSchema', () => {
    it('should validate creation data', () => {
      const createData = {
        orderId: 'ord-456',
        ticketTypeId: 'tt-789',
        ticketTypeName: 'Early Bird',
        quantity: 2,
        unitPrice: 4900,
        totalPrice: 9800
      }
      const result = createOrderItemSchema.safeParse(createData)
      expect(result.success).toBe(true)
    })
  })

  describe('calculateItemTotal', () => {
    it('should calculate total correctly', () => {
      expect(calculateItemTotal(4900, 2)).toBe(9800)
    })

    it('should return 0 for free items', () => {
      expect(calculateItemTotal(0, 5)).toBe(0)
    })

    it('should handle single quantity', () => {
      expect(calculateItemTotal(2900, 1)).toBe(2900)
    })
  })
})
