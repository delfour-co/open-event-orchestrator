import { z } from 'zod'

export const sponsorInquiryStatusSchema = z.enum(['pending', 'contacted', 'converted', 'rejected'])

export type SponsorInquiryStatus = z.infer<typeof sponsorInquiryStatusSchema>

export const sponsorInquirySchema = z.object({
  id: z.string(),
  editionId: z.string(),
  companyName: z.string().min(1).max(200),
  contactName: z.string().min(1).max(200),
  contactEmail: z.string().email(),
  contactPhone: z.string().max(50).optional(),
  message: z.string().min(1).max(5000),
  interestedPackageId: z.string().optional(),
  status: sponsorInquiryStatusSchema.default('pending'),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type SponsorInquiry = z.infer<typeof sponsorInquirySchema>

export const createSponsorInquirySchema = sponsorInquirySchema.omit({
  id: true,
  status: true,
  createdAt: true,
  updatedAt: true
})

export type CreateSponsorInquiry = z.infer<typeof createSponsorInquirySchema>

export const updateSponsorInquirySchema = z.object({
  status: sponsorInquiryStatusSchema.optional()
})

export type UpdateSponsorInquiry = z.infer<typeof updateSponsorInquirySchema>

export const getStatusLabel = (status: SponsorInquiryStatus): string => {
  const labels: Record<SponsorInquiryStatus, string> = {
    pending: 'Pending',
    contacted: 'Contacted',
    converted: 'Converted',
    rejected: 'Rejected'
  }
  return labels[status]
}

export const getStatusColor = (status: SponsorInquiryStatus): string => {
  const colors: Record<SponsorInquiryStatus, string> = {
    pending: 'yellow',
    contacted: 'blue',
    converted: 'green',
    rejected: 'red'
  }
  return colors[status]
}

export const getStatusBadgeVariant = (
  status: SponsorInquiryStatus
): 'default' | 'secondary' | 'destructive' | 'outline' => {
  const variants: Record<
    SponsorInquiryStatus,
    'default' | 'secondary' | 'destructive' | 'outline'
  > = {
    pending: 'outline',
    contacted: 'secondary',
    converted: 'default',
    rejected: 'destructive'
  }
  return variants[status]
}

export const isPendingInquiry = (inquiry: SponsorInquiry): boolean => {
  return inquiry.status === 'pending'
}

export const isActiveInquiry = (inquiry: SponsorInquiry): boolean => {
  return ['pending', 'contacted'].includes(inquiry.status)
}
