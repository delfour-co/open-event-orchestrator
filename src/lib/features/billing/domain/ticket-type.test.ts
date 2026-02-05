import { describe, expect, it } from 'vitest'
import {
  createTicketTypeSchema,
  formatPrice,
  isFreeTicket,
  isTicketAvailable,
  remainingTickets,
  ticketTypeSchema
} from './ticket-type'

describe('TicketType', () => {
  const now = new Date()
  const pastDate = new Date(now.getTime() - 86400000)
  const futureDate = new Date(now.getTime() + 86400000)

  const validTicketType = {
    id: 'tt-123',
    editionId: 'ed-456',
    name: 'Early Bird',
    description: 'Discounted early bird ticket',
    price: 4900,
    currency: 'EUR' as const,
    quantity: 100,
    quantitySold: 25,
    salesStartDate: pastDate,
    salesEndDate: futureDate,
    isActive: true,
    order: 0,
    createdAt: now,
    updatedAt: now
  }

  describe('ticketTypeSchema', () => {
    it('should validate a valid ticket type', () => {
      const result = ticketTypeSchema.safeParse(validTicketType)
      expect(result.success).toBe(true)
    })

    it('should validate with minimal required fields', () => {
      const minimal = {
        id: 'tt-123',
        editionId: 'ed-456',
        name: 'Standard',
        price: 0,
        currency: 'EUR',
        quantity: 50,
        createdAt: now,
        updatedAt: now
      }
      const result = ticketTypeSchema.safeParse(minimal)
      expect(result.success).toBe(true)
    })

    it('should reject empty name', () => {
      const result = ticketTypeSchema.safeParse({ ...validTicketType, name: '' })
      expect(result.success).toBe(false)
    })

    it('should reject negative price', () => {
      const result = ticketTypeSchema.safeParse({ ...validTicketType, price: -100 })
      expect(result.success).toBe(false)
    })

    it('should reject non-integer price', () => {
      const result = ticketTypeSchema.safeParse({ ...validTicketType, price: 49.99 })
      expect(result.success).toBe(false)
    })

    it('should reject invalid currency', () => {
      const result = ticketTypeSchema.safeParse({ ...validTicketType, currency: 'JPY' })
      expect(result.success).toBe(false)
    })

    it('should reject negative quantity', () => {
      const result = ticketTypeSchema.safeParse({ ...validTicketType, quantity: -1 })
      expect(result.success).toBe(false)
    })
  })

  describe('createTicketTypeSchema', () => {
    it('should validate creation data', () => {
      const createData = {
        editionId: 'ed-456',
        name: 'Standard',
        price: 2900,
        currency: 'EUR',
        quantity: 200,
        isActive: true
      }
      const result = createTicketTypeSchema.safeParse(createData)
      expect(result.success).toBe(true)
    })
  })

  describe('isFreeTicket', () => {
    it('should return true for free ticket', () => {
      expect(isFreeTicket({ ...validTicketType, price: 0 })).toBe(true)
    })

    it('should return false for paid ticket', () => {
      expect(isFreeTicket(validTicketType)).toBe(false)
    })
  })

  describe('isTicketAvailable', () => {
    it('should return true for active ticket with remaining quantity', () => {
      expect(isTicketAvailable(validTicketType)).toBe(true)
    })

    it('should return false for inactive ticket', () => {
      expect(isTicketAvailable({ ...validTicketType, isActive: false })).toBe(false)
    })

    it('should return false when sold out', () => {
      expect(isTicketAvailable({ ...validTicketType, quantitySold: 100 })).toBe(false)
    })

    it('should return false before sales start', () => {
      expect(isTicketAvailable({ ...validTicketType, salesStartDate: futureDate })).toBe(false)
    })

    it('should return false after sales end', () => {
      expect(isTicketAvailable({ ...validTicketType, salesEndDate: pastDate })).toBe(false)
    })
  })

  describe('remainingTickets', () => {
    it('should calculate remaining tickets', () => {
      expect(remainingTickets(validTicketType)).toBe(75)
    })

    it('should return 0 when sold out', () => {
      expect(remainingTickets({ ...validTicketType, quantitySold: 100 })).toBe(0)
    })
  })

  describe('formatPrice', () => {
    it('should format EUR price', () => {
      const formatted = formatPrice(4900, 'EUR')
      expect(formatted).toContain('49')
      expect(formatted).toContain('€')
    })

    it('should format free price', () => {
      const formatted = formatPrice(0, 'EUR')
      expect(formatted).toContain('0')
    })

    it('should format USD price', () => {
      const formatted = formatPrice(9999, 'USD')
      expect(formatted).toContain('99')
      expect(formatted).toContain('$')
    })
  })
})
