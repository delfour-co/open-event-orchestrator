import { z } from 'zod'
import type { BudgetCurrency } from './budget'

export const transactionTypeSchema = z.enum(['expense', 'income'])

export type TransactionType = z.infer<typeof transactionTypeSchema>

export const transactionStatusSchema = z.enum(['pending', 'paid', 'cancelled'])

export type TransactionStatus = z.infer<typeof transactionStatusSchema>

export const budgetTransactionSchema = z.object({
  id: z.string(),
  categoryId: z.string(),
  type: transactionTypeSchema,
  amount: z.number().min(0),
  description: z.string().min(1).max(500),
  vendor: z.string().max(200).optional(),
  invoiceNumber: z.string().max(100).optional(),
  date: z.date(),
  status: transactionStatusSchema.default('pending'),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type BudgetTransaction = z.infer<typeof budgetTransactionSchema>

export const createTransactionSchema = budgetTransactionSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
})

export type CreateTransaction = z.infer<typeof createTransactionSchema>

export const updateTransactionSchema = createTransactionSchema.partial().omit({
  categoryId: true
})

export type UpdateTransaction = z.infer<typeof updateTransactionSchema>

export const formatAmount = (amount: number, currency: BudgetCurrency): string => {
  const formatter = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency
  })
  return formatter.format(amount)
}

export const isExpense = (type: TransactionType): boolean => {
  return type === 'expense'
}

export const getTransactionStatusLabel = (status: TransactionStatus): string => {
  const labels: Record<TransactionStatus, string> = {
    pending: 'Pending',
    paid: 'Paid',
    cancelled: 'Cancelled'
  }
  return labels[status]
}

export const getTransactionStatusColor = (status: TransactionStatus): string => {
  const colors: Record<TransactionStatus, string> = {
    pending: 'yellow',
    paid: 'green',
    cancelled: 'gray'
  }
  return colors[status]
}
