import { z } from 'zod'
import type { EditionSponsorExpanded } from './edition-sponsor'
import type { Benefit } from './package'

export const deliverableStatusSchema = z.enum(['pending', 'in_progress', 'delivered'])

export type DeliverableStatus = z.infer<typeof deliverableStatusSchema>

export const sponsorDeliverableSchema = z.object({
  id: z.string(),
  editionSponsorId: z.string(),
  benefitName: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  status: deliverableStatusSchema.default('pending'),
  dueDate: z.date().optional(),
  deliveredAt: z.date().optional(),
  notes: z.string().max(5000).optional(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type SponsorDeliverable = z.infer<typeof sponsorDeliverableSchema>

export const createDeliverableSchema = sponsorDeliverableSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
})

export type CreateDeliverable = z.infer<typeof createDeliverableSchema>

export const updateDeliverableSchema = createDeliverableSchema.partial().omit({
  editionSponsorId: true
})

export type UpdateDeliverable = z.infer<typeof updateDeliverableSchema>

export interface SponsorDeliverableExpanded extends SponsorDeliverable {
  editionSponsor?: EditionSponsorExpanded
}

export interface DeliverableStats {
  total: number
  byStatus: Record<DeliverableStatus, number>
  pending: number
  inProgress: number
  delivered: number
  overdue: number
  completionRate: number
}

export const DELIVERABLE_STATUS_ORDER: DeliverableStatus[] = ['pending', 'in_progress', 'delivered']

export const getDeliverableStatusLabel = (status: DeliverableStatus): string => {
  const labels: Record<DeliverableStatus, string> = {
    pending: 'Pending',
    in_progress: 'In Progress',
    delivered: 'Delivered'
  }
  return labels[status]
}

export const getDeliverableStatusColor = (status: DeliverableStatus): string => {
  const colors: Record<DeliverableStatus, string> = {
    pending: 'gray',
    in_progress: 'blue',
    delivered: 'green'
  }
  return colors[status]
}

export const getDeliverableStatusBadgeVariant = (
  status: DeliverableStatus
): 'default' | 'secondary' | 'destructive' | 'outline' => {
  const variants: Record<DeliverableStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    pending: 'outline',
    in_progress: 'secondary',
    delivered: 'default'
  }
  return variants[status]
}

const VALID_STATUS_TRANSITIONS: Record<DeliverableStatus, DeliverableStatus[]> = {
  pending: ['in_progress', 'delivered'],
  in_progress: ['pending', 'delivered'],
  delivered: ['in_progress', 'pending']
}

export const canTransitionDeliverableTo = (
  from: DeliverableStatus,
  to: DeliverableStatus
): boolean => {
  if (from === to) return false
  return VALID_STATUS_TRANSITIONS[from]?.includes(to) ?? false
}

export const getValidDeliverableTransitions = (from: DeliverableStatus): DeliverableStatus[] => {
  return VALID_STATUS_TRANSITIONS[from] ?? []
}

export const isDeliverableOverdue = (deliverable: SponsorDeliverable): boolean => {
  if (!deliverable.dueDate) return false
  if (deliverable.status === 'delivered') return false
  return new Date() > deliverable.dueDate
}

export const isDeliverableDueSoon = (
  deliverable: SponsorDeliverable,
  daysThreshold = 7
): boolean => {
  if (!deliverable.dueDate) return false
  if (deliverable.status === 'delivered') return false
  const now = new Date()
  const threshold = new Date(now.getTime() + daysThreshold * 24 * 60 * 60 * 1000)
  return deliverable.dueDate <= threshold && deliverable.dueDate > now
}

export const calculateDeliverableStats = (deliverables: SponsorDeliverable[]): DeliverableStats => {
  const now = new Date()
  const initial: DeliverableStats = {
    total: deliverables.length,
    byStatus: {
      pending: 0,
      in_progress: 0,
      delivered: 0
    },
    pending: 0,
    inProgress: 0,
    delivered: 0,
    overdue: 0,
    completionRate: 0
  }

  const stats = deliverables.reduce((acc, d) => {
    acc.byStatus[d.status]++

    if (d.status === 'pending') acc.pending++
    if (d.status === 'in_progress') acc.inProgress++
    if (d.status === 'delivered') acc.delivered++

    if (d.dueDate && d.status !== 'delivered' && now > d.dueDate) {
      acc.overdue++
    }

    return acc
  }, initial)

  stats.completionRate =
    stats.total > 0 ? Math.round((stats.delivered / stats.total) * 100 * 100) / 100 : 0

  return stats
}

export const groupDeliverablesByStatus = (
  deliverables: SponsorDeliverable[]
): Record<DeliverableStatus, SponsorDeliverable[]> => {
  const groups: Record<DeliverableStatus, SponsorDeliverable[]> = {
    pending: [],
    in_progress: [],
    delivered: []
  }

  for (const deliverable of deliverables) {
    groups[deliverable.status].push(deliverable)
  }

  return groups
}

export const sortDeliverablesByDueDate = (
  deliverables: SponsorDeliverable[]
): SponsorDeliverable[] => {
  return [...deliverables].sort((a, b) => {
    if (!a.dueDate && !b.dueDate) return 0
    if (!a.dueDate) return 1
    if (!b.dueDate) return -1
    return a.dueDate.getTime() - b.dueDate.getTime()
  })
}

export const createDeliverablesFromBenefits = (
  editionSponsorId: string,
  benefits: Benefit[],
  defaultDueDate?: Date
): CreateDeliverable[] => {
  return benefits
    .filter((b) => b.included)
    .map((benefit) => ({
      editionSponsorId,
      benefitName: benefit.name,
      status: 'pending' as const,
      dueDate: defaultDueDate
    }))
}
