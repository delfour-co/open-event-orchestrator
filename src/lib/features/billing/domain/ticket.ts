import { z } from 'zod'

export const ticketStatusSchema = z.enum(['valid', 'used', 'cancelled'])

export type TicketStatus = z.infer<typeof ticketStatusSchema>

export const ticketSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  ticketTypeId: z.string(),
  editionId: z.string(),
  attendeeEmail: z.string().email(),
  attendeeFirstName: z.string().min(1).max(100),
  attendeeLastName: z.string().min(1).max(100),
  ticketNumber: z.string(),
  qrCode: z.string().optional(),
  status: ticketStatusSchema.default('valid'),
  checkedInAt: z.date().optional(),
  checkedInBy: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type Ticket = z.infer<typeof ticketSchema>

export const createTicketSchema = ticketSchema.omit({
  id: true,
  ticketNumber: true,
  qrCode: true,
  status: true,
  checkedInAt: true,
  checkedInBy: true,
  createdAt: true,
  updatedAt: true
})

export type CreateTicket = z.infer<typeof createTicketSchema>

export const canCheckInTicket = (status: TicketStatus): boolean => {
  return status === 'valid'
}

export const canCancelTicket = (status: TicketStatus): boolean => {
  return status === 'valid'
}

export const isTicketUsed = (status: TicketStatus): boolean => {
  return status === 'used'
}

export const getTicketStatusLabel = (status: TicketStatus): string => {
  const labels: Record<TicketStatus, string> = {
    valid: 'Valid',
    used: 'Used',
    cancelled: 'Cancelled'
  }
  return labels[status]
}

export const getTicketStatusColor = (status: TicketStatus): string => {
  const colors: Record<TicketStatus, string> = {
    valid: 'green',
    used: 'blue',
    cancelled: 'gray'
  }
  return colors[status]
}

export const generateTicketNumber = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `TKT-${timestamp}-${random}`
}
