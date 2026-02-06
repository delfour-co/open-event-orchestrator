import { z } from 'zod'
import type { SponsorPackage } from './package'
import type { Sponsor } from './sponsor'

export const sponsorStatusSchema = z.enum([
  'prospect',
  'contacted',
  'negotiating',
  'confirmed',
  'declined',
  'cancelled'
])

export type SponsorStatus = z.infer<typeof sponsorStatusSchema>

export const editionSponsorSchema = z.object({
  id: z.string(),
  editionId: z.string(),
  sponsorId: z.string(),
  packageId: z.string().optional(),
  status: sponsorStatusSchema.default('prospect'),
  confirmedAt: z.date().optional(),
  paidAt: z.date().optional(),
  amount: z.number().min(0).optional(),
  notes: z.string().max(5000).optional(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type EditionSponsor = z.infer<typeof editionSponsorSchema>

export const createEditionSponsorSchema = editionSponsorSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
})

export type CreateEditionSponsor = z.infer<typeof createEditionSponsorSchema>

export const updateEditionSponsorSchema = createEditionSponsorSchema.partial().omit({
  editionId: true,
  sponsorId: true
})

export type UpdateEditionSponsor = z.infer<typeof updateEditionSponsorSchema>

export interface EditionSponsorExpanded extends EditionSponsor {
  sponsor?: Sponsor
  package?: SponsorPackage
}

export interface SponsorStats {
  total: number
  byStatus: Record<SponsorStatus, number>
  confirmed: number
  totalAmount: number
  paidAmount: number
}

export const SPONSOR_STATUS_ORDER: SponsorStatus[] = [
  'prospect',
  'contacted',
  'negotiating',
  'confirmed',
  'declined',
  'cancelled'
]

export const PIPELINE_STATUSES: SponsorStatus[] = [
  'prospect',
  'contacted',
  'negotiating',
  'confirmed'
]

export const getStatusLabel = (status: SponsorStatus): string => {
  const labels: Record<SponsorStatus, string> = {
    prospect: 'Prospect',
    contacted: 'Contacted',
    negotiating: 'Negotiating',
    confirmed: 'Confirmed',
    declined: 'Declined',
    cancelled: 'Cancelled'
  }
  return labels[status]
}

export const getStatusColor = (status: SponsorStatus): string => {
  const colors: Record<SponsorStatus, string> = {
    prospect: 'gray',
    contacted: 'blue',
    negotiating: 'yellow',
    confirmed: 'green',
    declined: 'red',
    cancelled: 'slate'
  }
  return colors[status]
}

export const getStatusBadgeVariant = (
  status: SponsorStatus
): 'default' | 'secondary' | 'destructive' | 'outline' => {
  const variants: Record<SponsorStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    prospect: 'outline',
    contacted: 'secondary',
    negotiating: 'secondary',
    confirmed: 'default',
    declined: 'destructive',
    cancelled: 'outline'
  }
  return variants[status]
}

const VALID_TRANSITIONS: Record<SponsorStatus, SponsorStatus[]> = {
  prospect: ['contacted', 'declined', 'cancelled'],
  contacted: ['negotiating', 'declined', 'cancelled'],
  negotiating: ['confirmed', 'declined', 'cancelled'],
  confirmed: ['cancelled'],
  declined: ['prospect', 'contacted'],
  cancelled: ['prospect']
}

export const canTransitionTo = (from: SponsorStatus, to: SponsorStatus): boolean => {
  if (from === to) return false
  return VALID_TRANSITIONS[from]?.includes(to) ?? false
}

export const getValidTransitions = (from: SponsorStatus): SponsorStatus[] => {
  return VALID_TRANSITIONS[from] ?? []
}

export const isActiveStatus = (status: SponsorStatus): boolean => {
  return ['prospect', 'contacted', 'negotiating', 'confirmed'].includes(status)
}

export const isTerminalStatus = (status: SponsorStatus): boolean => {
  return ['declined', 'cancelled'].includes(status)
}

export const isPipelineStatus = (status: SponsorStatus): boolean => {
  return PIPELINE_STATUSES.includes(status)
}

export const calculateStats = (sponsors: EditionSponsor[]): SponsorStats => {
  const initial: SponsorStats = {
    total: sponsors.length,
    byStatus: {
      prospect: 0,
      contacted: 0,
      negotiating: 0,
      confirmed: 0,
      declined: 0,
      cancelled: 0
    },
    confirmed: 0,
    totalAmount: 0,
    paidAmount: 0
  }

  return sponsors.reduce((stats, sponsor) => {
    stats.byStatus[sponsor.status]++

    if (sponsor.status === 'confirmed') {
      stats.confirmed++
      stats.totalAmount += sponsor.amount ?? 0
      if (sponsor.paidAt) {
        stats.paidAmount += sponsor.amount ?? 0
      }
    }

    return stats
  }, initial)
}

export const groupByStatus = (
  sponsors: EditionSponsorExpanded[]
): Record<SponsorStatus, EditionSponsorExpanded[]> => {
  const groups: Record<SponsorStatus, EditionSponsorExpanded[]> = {
    prospect: [],
    contacted: [],
    negotiating: [],
    confirmed: [],
    declined: [],
    cancelled: []
  }

  for (const sponsor of sponsors) {
    groups[sponsor.status].push(sponsor)
  }

  return groups
}

export const sortByPackageTier = (sponsors: EditionSponsorExpanded[]): EditionSponsorExpanded[] => {
  return [...sponsors].sort((a, b) => {
    const tierA = a.package?.tier ?? 999
    const tierB = b.package?.tier ?? 999
    return tierA - tierB
  })
}
