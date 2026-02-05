import { z } from 'zod'

export const currencySchema = z.enum(['EUR', 'USD', 'GBP'])

export type Currency = z.infer<typeof currencySchema>

export const ticketTypeSchema = z.object({
  id: z.string(),
  editionId: z.string(),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  price: z.number().int().min(0),
  currency: currencySchema.default('EUR'),
  quantity: z.number().int().min(0),
  quantitySold: z.number().int().min(0).default(0),
  salesStartDate: z.date().optional(),
  salesEndDate: z.date().optional(),
  isActive: z.boolean().default(true),
  order: z.number().int().default(0),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type TicketType = z.infer<typeof ticketTypeSchema>

export const createTicketTypeSchema = ticketTypeSchema.omit({
  id: true,
  quantitySold: true,
  createdAt: true,
  updatedAt: true
})

export type CreateTicketType = z.infer<typeof createTicketTypeSchema>

export const updateTicketTypeSchema = createTicketTypeSchema.partial()

export type UpdateTicketType = z.infer<typeof updateTicketTypeSchema>

export const isFreeTicket = (ticketType: TicketType): boolean => {
  return ticketType.price === 0
}

export const isTicketAvailable = (ticketType: TicketType): boolean => {
  if (!ticketType.isActive) return false

  const now = new Date()
  if (ticketType.salesStartDate && now < ticketType.salesStartDate) return false
  if (ticketType.salesEndDate && now > ticketType.salesEndDate) return false

  return remainingTickets(ticketType) > 0
}

export const remainingTickets = (ticketType: TicketType): number => {
  return ticketType.quantity - ticketType.quantitySold
}

export const formatPrice = (priceInCents: number, currency: Currency): string => {
  const amount = priceInCents / 100
  const formatter = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency
  })
  return formatter.format(amount)
}
