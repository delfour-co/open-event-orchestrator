import { z } from 'zod'

export const campaignStatusSchema = z.enum(['draft', 'scheduled', 'sending', 'sent', 'cancelled'])
export type CampaignStatus = z.infer<typeof campaignStatusSchema>

export const emailCampaignSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string().min(1).max(100),
  templateId: z.string().optional(),
  segmentId: z.string().optional(),
  subject: z.string().min(1).max(200),
  bodyHtml: z.string(),
  bodyText: z.string(),
  status: campaignStatusSchema.default('draft'),
  scheduledAt: z.date().optional(),
  sentAt: z.date().optional(),
  totalRecipients: z.number().int().min(0).default(0),
  totalSent: z.number().int().min(0).default(0),
  totalFailed: z.number().int().min(0).default(0),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type EmailCampaign = z.infer<typeof emailCampaignSchema>

export type CreateEmailCampaign = Omit<
  EmailCampaign,
  'id' | 'totalRecipients' | 'totalSent' | 'totalFailed' | 'createdAt' | 'updatedAt'
>

export const canEditCampaign = (status: CampaignStatus): boolean =>
  status === 'draft' || status === 'scheduled'

export const canSendCampaign = (status: CampaignStatus): boolean => status === 'draft'

export const canScheduleCampaign = (status: CampaignStatus): boolean => status === 'draft'

export const canCancelCampaign = (status: CampaignStatus): boolean =>
  status === 'scheduled' || status === 'sending'

export const isCampaignComplete = (status: CampaignStatus): boolean =>
  status === 'sent' || status === 'cancelled'

export const campaignSuccessRate = (campaign: EmailCampaign): number => {
  if (campaign.totalRecipients === 0) return 0
  return Math.round((campaign.totalSent / campaign.totalRecipients) * 100)
}
