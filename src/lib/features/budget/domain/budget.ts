import { z } from 'zod'

export const budgetCurrencySchema = z.enum(['EUR', 'USD', 'GBP'])

export type BudgetCurrency = z.infer<typeof budgetCurrencySchema>

export const budgetStatusSchema = z.enum(['draft', 'approved', 'closed'])

export type BudgetStatus = z.infer<typeof budgetStatusSchema>

export const editionBudgetSchema = z.object({
  id: z.string(),
  editionId: z.string(),
  totalBudget: z.number().min(0),
  currency: budgetCurrencySchema.default('EUR'),
  status: budgetStatusSchema.default('draft'),
  notes: z.string().max(5000).optional(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type EditionBudget = z.infer<typeof editionBudgetSchema>

export const createBudgetSchema = editionBudgetSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
})

export type CreateBudget = z.infer<typeof createBudgetSchema>

export const updateBudgetSchema = createBudgetSchema.partial().omit({ editionId: true })

export type UpdateBudget = z.infer<typeof updateBudgetSchema>

export const getBudgetStatusLabel = (status: BudgetStatus): string => {
  const labels: Record<BudgetStatus, string> = {
    draft: 'Draft',
    approved: 'Approved',
    closed: 'Closed'
  }
  return labels[status]
}

export const getBudgetStatusColor = (status: BudgetStatus): string => {
  const colors: Record<BudgetStatus, string> = {
    draft: 'yellow',
    approved: 'green',
    closed: 'gray'
  }
  return colors[status]
}

export const canEditBudget = (status: BudgetStatus): boolean => {
  return status !== 'closed'
}

export const formatBudgetAmount = (amount: number, currency: BudgetCurrency): string => {
  const formatter = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency
  })
  return formatter.format(amount)
}
