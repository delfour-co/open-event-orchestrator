import { z } from 'zod'
import { budgetCurrencySchema } from './budget'

export const quoteLineItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().min(1),
  unitPrice: z.number().min(0)
})

export type QuoteLineItem = z.infer<typeof quoteLineItemSchema>

export const quoteStatusSchema = z.enum(['draft', 'sent', 'accepted', 'rejected', 'expired'])
export type QuoteStatus = z.infer<typeof quoteStatusSchema>

export const budgetQuoteSchema = z.object({
  id: z.string(),
  editionId: z.string(),
  quoteNumber: z.string(),
  vendor: z.string().min(1).max(200),
  vendorEmail: z.string().email().optional(),
  vendorAddress: z.string().max(500).optional(),
  description: z.string().max(1000).optional(),
  items: z.array(quoteLineItemSchema).min(1),
  totalAmount: z.number().min(0),
  currency: budgetCurrencySchema.default('EUR'),
  status: quoteStatusSchema.default('draft'),
  validUntil: z.date().optional(),
  notes: z.string().max(2000).optional(),
  transactionId: z.string().optional(),
  sentAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type BudgetQuote = z.infer<typeof budgetQuoteSchema>

export const createQuoteSchema = budgetQuoteSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  quoteNumber: true,
  transactionId: true,
  sentAt: true
})
export type CreateQuote = z.infer<typeof createQuoteSchema>

export const updateQuoteSchema = createQuoteSchema.partial().omit({ editionId: true })
export type UpdateQuote = z.infer<typeof updateQuoteSchema>

export const calculateQuoteTotal = (items: QuoteLineItem[]): number => {
  return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
}

export const getQuoteStatusLabel = (status: QuoteStatus): string => {
  const labels: Record<QuoteStatus, string> = {
    draft: 'Draft',
    sent: 'Sent',
    accepted: 'Accepted',
    rejected: 'Rejected',
    expired: 'Expired'
  }
  return labels[status]
}

export const getQuoteStatusColor = (status: QuoteStatus): string => {
  const colors: Record<QuoteStatus, string> = {
    draft: 'yellow',
    sent: 'blue',
    accepted: 'green',
    rejected: 'red',
    expired: 'gray'
  }
  return colors[status]
}

export const canEditQuote = (status: QuoteStatus): boolean => {
  return status === 'draft'
}

export const canSendQuote = (status: QuoteStatus): boolean => {
  return status === 'draft'
}

export const canConvertQuote = (status: QuoteStatus): boolean => {
  return status === 'accepted'
}

export const generateQuoteNumber = (editionSlug: string, sequence: number): string => {
  return `QT-${editionSlug.toUpperCase().slice(0, 8)}-${String(sequence).padStart(4, '0')}`
}
