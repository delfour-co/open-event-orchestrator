import { z } from 'zod'

export const checklistItemStatuses = [
  'pending',
  'approved',
  'ordered',
  'paid',
  'cancelled'
] as const
export const checklistItemPriorities = ['low', 'medium', 'high'] as const

export const checklistItemStatusSchema = z.enum(checklistItemStatuses)
export const checklistItemPrioritySchema = z.enum(checklistItemPriorities)

export type ChecklistItemStatus = z.infer<typeof checklistItemStatusSchema>
export type ChecklistItemPriority = z.infer<typeof checklistItemPrioritySchema>

export const budgetChecklistItemSchema = z.object({
  id: z.string(),
  editionId: z.string(),
  categoryId: z.string().optional(),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  estimatedAmount: z.number().int().min(0).default(0),
  status: checklistItemStatusSchema.default('pending'),
  priority: checklistItemPrioritySchema.default('medium'),
  dueDate: z.date().optional(),
  assignee: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
  order: z.number().int().min(0).default(0),
  transactionId: z.string().optional(),
  createdBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type BudgetChecklistItem = z.infer<typeof budgetChecklistItemSchema>

export const createChecklistItemSchema = budgetChecklistItemSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
})

export type CreateChecklistItem = z.infer<typeof createChecklistItemSchema>

export const updateChecklistItemSchema = createChecklistItemSchema.partial().omit({
  editionId: true,
  createdBy: true
})

export type UpdateChecklistItem = z.infer<typeof updateChecklistItemSchema>

export const getChecklistStatusLabel = (status: ChecklistItemStatus): string => {
  const labels: Record<ChecklistItemStatus, string> = {
    pending: 'Pending',
    approved: 'Approved',
    ordered: 'Ordered',
    paid: 'Paid',
    cancelled: 'Cancelled'
  }
  return labels[status]
}

export const getChecklistStatusColor = (status: ChecklistItemStatus): string => {
  const colors: Record<ChecklistItemStatus, string> = {
    pending: 'yellow',
    approved: 'blue',
    ordered: 'purple',
    paid: 'green',
    cancelled: 'gray'
  }
  return colors[status]
}

export const getPriorityLabel = (priority: ChecklistItemPriority): string => {
  const labels: Record<ChecklistItemPriority, string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High'
  }
  return labels[priority]
}

export const getPriorityColor = (priority: ChecklistItemPriority): string => {
  const colors: Record<ChecklistItemPriority, string> = {
    low: 'gray',
    medium: 'yellow',
    high: 'red'
  }
  return colors[priority]
}

export const canEditChecklistItem = (status: ChecklistItemStatus): boolean => {
  return status !== 'paid' && status !== 'cancelled'
}

export const canConvertToTransaction = (
  status: ChecklistItemStatus,
  transactionId?: string
): boolean => {
  return status === 'approved' && !transactionId
}

export const canCancelChecklistItem = (status: ChecklistItemStatus): boolean => {
  return status !== 'paid' && status !== 'cancelled'
}

export const getNextStatuses = (currentStatus: ChecklistItemStatus): ChecklistItemStatus[] => {
  const transitions: Record<ChecklistItemStatus, ChecklistItemStatus[]> = {
    pending: ['approved', 'cancelled'],
    approved: ['ordered', 'paid', 'cancelled'],
    ordered: ['paid', 'cancelled'],
    paid: [],
    cancelled: ['pending']
  }
  return transitions[currentStatus]
}
