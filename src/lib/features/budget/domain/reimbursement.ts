import { z } from 'zod'
import { budgetCurrencySchema } from './budget'

export const expenseTypeSchema = z.enum(['transport', 'accommodation', 'meals', 'other'])
export type ExpenseType = z.infer<typeof expenseTypeSchema>

export const reimbursementStatusSchema = z.enum([
  'draft',
  'submitted',
  'under_review',
  'approved',
  'rejected',
  'paid'
])
export type ReimbursementStatus = z.infer<typeof reimbursementStatusSchema>

export const reimbursementRequestSchema = z.object({
  id: z.string(),
  editionId: z.string(),
  speakerId: z.string(),
  requestNumber: z.string(),
  status: reimbursementStatusSchema.default('draft'),
  totalAmount: z.number().min(0),
  currency: budgetCurrencySchema.default('EUR'),
  notes: z.string().max(2000).optional(),
  adminNotes: z.string().max(2000).optional(),
  reviewedBy: z.string().optional(),
  reviewedAt: z.date().optional(),
  transactionId: z.string().optional(),
  submittedAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type ReimbursementRequest = z.infer<typeof reimbursementRequestSchema>

export const createReimbursementRequestSchema = reimbursementRequestSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  requestNumber: true,
  transactionId: true,
  reviewedBy: true,
  reviewedAt: true,
  submittedAt: true
})
export type CreateReimbursementRequest = z.infer<typeof createReimbursementRequestSchema>

export const reimbursementItemSchema = z.object({
  id: z.string(),
  requestId: z.string(),
  expenseType: expenseTypeSchema,
  description: z.string().min(1).max(500),
  amount: z.number().min(0),
  date: z.date(),
  receipt: z.string().optional(),
  notes: z.string().max(500).optional(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type ReimbursementItem = z.infer<typeof reimbursementItemSchema>

export const createReimbursementItemSchema = reimbursementItemSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
})
export type CreateReimbursementItem = z.infer<typeof createReimbursementItemSchema>

export const getReimbursementStatusLabel = (status: ReimbursementStatus): string => {
  const labels: Record<ReimbursementStatus, string> = {
    draft: 'Draft',
    submitted: 'Submitted',
    under_review: 'Under Review',
    approved: 'Approved',
    rejected: 'Rejected',
    paid: 'Paid'
  }
  return labels[status]
}

export const getReimbursementStatusColor = (status: ReimbursementStatus): string => {
  const colors: Record<ReimbursementStatus, string> = {
    draft: 'yellow',
    submitted: 'blue',
    under_review: 'orange',
    approved: 'green',
    rejected: 'red',
    paid: 'gray'
  }
  return colors[status]
}

export const getExpenseTypeLabel = (type: ExpenseType): string => {
  const labels: Record<ExpenseType, string> = {
    transport: 'Transport',
    accommodation: 'Accommodation',
    meals: 'Meals',
    other: 'Other'
  }
  return labels[type]
}

export const canSpeakerEdit = (status: ReimbursementStatus): boolean => {
  return status === 'draft'
}

export const canAdminReview = (status: ReimbursementStatus): boolean => {
  return status === 'submitted' || status === 'under_review'
}

export const canMarkAsPaid = (status: ReimbursementStatus): boolean => {
  return status === 'approved'
}

export const calculateTotal = (items: ReimbursementItem[]): number => {
  return items.reduce((sum, item) => sum + item.amount, 0)
}

export const generateReimbursementNumber = (editionSlug: string, sequence: number): string => {
  return `RB-${editionSlug.toUpperCase().slice(0, 8)}-${String(sequence).padStart(4, '0')}`
}
