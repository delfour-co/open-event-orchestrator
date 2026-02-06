import { z } from 'zod'

export const budgetInvoiceSchema = z.object({
  id: z.string(),
  transactionId: z.string(),
  invoiceNumber: z.string().min(1).max(100),
  file: z.string().optional(),
  issueDate: z.date(),
  dueDate: z.date().optional(),
  amount: z.number().min(0),
  notes: z.string().max(2000).optional(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type BudgetInvoice = z.infer<typeof budgetInvoiceSchema>

export const createInvoiceSchema = budgetInvoiceSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
})
export type CreateInvoice = z.infer<typeof createInvoiceSchema>

export const isOverdue = (invoice: BudgetInvoice): boolean => {
  if (!invoice.dueDate) return false
  return new Date() > invoice.dueDate
}
