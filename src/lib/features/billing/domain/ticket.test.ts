import { describe, expect, it } from 'vitest'
import {
  canCancelTicket,
  canCheckInTicket,
  createTicketSchema,
  generateTicketNumber,
  getTicketStatusColor,
  getTicketStatusLabel,
  isTicketUsed,
  ticketSchema,
  ticketStatusSchema
} from './ticket'

describe('Ticket', () => {
  const now = new Date()

  const validTicket = {
    id: 'tkt-123',
    orderId: 'ord-456',
    ticketTypeId: 'tt-789',
    editionId: 'ed-101',
    attendeeEmail: 'jane@example.com',
    attendeeFirstName: 'Jane',
    attendeeLastName: 'Doe',
    ticketNumber: 'TKT-ABC123-XYZ9AB',
    qrCode: 'data:image/png;base64,abc',
    status: 'valid' as const,
    createdAt: now,
    updatedAt: now
  }

  describe('ticketSchema', () => {
    it('should validate a valid ticket', () => {
      const result = ticketSchema.safeParse(validTicket)
      expect(result.success).toBe(true)
    })

    it('should validate ticket with check-in data', () => {
      const withCheckIn = {
        ...validTicket,
        status: 'used',
        checkedInAt: now,
        checkedInBy: 'user-123'
      }
      const result = ticketSchema.safeParse(withCheckIn)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const result = ticketSchema.safeParse({ ...validTicket, attendeeEmail: 'invalid' })
      expect(result.success).toBe(false)
    })

    it('should reject empty first name', () => {
      const result = ticketSchema.safeParse({ ...validTicket, attendeeFirstName: '' })
      expect(result.success).toBe(false)
    })
  })

  describe('ticketStatusSchema', () => {
    it('should accept all valid statuses', () => {
      const statuses = ['valid', 'used', 'cancelled']
      for (const status of statuses) {
        const result = ticketStatusSchema.safeParse(status)
        expect(result.success).toBe(true)
      }
    })

    it('should reject invalid status', () => {
      const result = ticketStatusSchema.safeParse('expired')
      expect(result.success).toBe(false)
    })
  })

  describe('createTicketSchema', () => {
    it('should validate ticket creation data', () => {
      const createData = {
        orderId: 'ord-456',
        ticketTypeId: 'tt-789',
        editionId: 'ed-101',
        attendeeEmail: 'jane@example.com',
        attendeeFirstName: 'Jane',
        attendeeLastName: 'Doe'
      }
      const result = createTicketSchema.safeParse(createData)
      expect(result.success).toBe(true)
    })
  })

  describe('status helpers', () => {
    describe('canCheckInTicket', () => {
      it('should allow checking in valid tickets', () => {
        expect(canCheckInTicket('valid')).toBe(true)
      })

      it('should not allow checking in used tickets', () => {
        expect(canCheckInTicket('used')).toBe(false)
      })

      it('should not allow checking in cancelled tickets', () => {
        expect(canCheckInTicket('cancelled')).toBe(false)
      })
    })

    describe('canCancelTicket', () => {
      it('should allow cancelling valid tickets', () => {
        expect(canCancelTicket('valid')).toBe(true)
      })

      it('should not allow cancelling used tickets', () => {
        expect(canCancelTicket('used')).toBe(false)
      })
    })

    describe('isTicketUsed', () => {
      it('should return true for used tickets', () => {
        expect(isTicketUsed('used')).toBe(true)
      })

      it('should return false for valid tickets', () => {
        expect(isTicketUsed('valid')).toBe(false)
      })
    })

    describe('getTicketStatusLabel', () => {
      it('should return correct label for valid', () => {
        expect(getTicketStatusLabel('valid')).toBe('Valid')
      })

      it('should return correct label for used', () => {
        expect(getTicketStatusLabel('used')).toBe('Used')
      })
    })

    describe('getTicketStatusColor', () => {
      it('should return green for valid', () => {
        expect(getTicketStatusColor('valid')).toBe('green')
      })

      it('should return blue for used', () => {
        expect(getTicketStatusColor('used')).toBe('blue')
      })

      it('should return gray for cancelled', () => {
        expect(getTicketStatusColor('cancelled')).toBe('gray')
      })
    })
  })

  describe('generateTicketNumber', () => {
    it('should generate a string starting with TKT-', () => {
      const number = generateTicketNumber()
      expect(number).toMatch(/^TKT-[A-Z0-9]+-[A-Z0-9]+$/)
    })

    it('should generate unique numbers', () => {
      const numbers = new Set(Array.from({ length: 10 }, () => generateTicketNumber()))
      expect(numbers.size).toBe(10)
    })
  })
})
