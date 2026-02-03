import { z } from 'zod'

export const talkStatusSchema = z.enum([
  'draft',
  'submitted',
  'under_review',
  'accepted',
  'rejected',
  'confirmed',
  'declined',
  'withdrawn'
])

export type TalkStatus = z.infer<typeof talkStatusSchema>

export const languageSchema = z.enum(['fr', 'en'])

export type Language = z.infer<typeof languageSchema>

export const talkLevelSchema = z.enum(['beginner', 'intermediate', 'advanced'])

export type TalkLevel = z.infer<typeof talkLevelSchema>

export const talkSchema = z.object({
  id: z.string(),
  editionId: z.string(),
  title: z.string().min(5).max(200),
  abstract: z.string().min(50).max(500),
  description: z.string().max(5000).optional(),
  categoryId: z.string().optional(),
  formatId: z.string().optional(),
  language: languageSchema,
  level: talkLevelSchema.optional(),
  speakerIds: z.array(z.string()).min(1).max(5),
  status: talkStatusSchema.default('draft'),
  submittedAt: z.date().optional(),
  notes: z.string().max(2000).optional(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type Talk = z.infer<typeof talkSchema>

export const createTalkSchema = talkSchema.omit({
  id: true,
  status: true,
  submittedAt: true,
  createdAt: true,
  updatedAt: true
})

export type CreateTalk = z.infer<typeof createTalkSchema>

export const updateTalkSchema = createTalkSchema.partial()

export type UpdateTalk = z.infer<typeof updateTalkSchema>

export const submitTalkSchema = talkSchema.pick({
  title: true,
  abstract: true,
  description: true,
  categoryId: true,
  formatId: true,
  language: true,
  level: true
})

export type SubmitTalk = z.infer<typeof submitTalkSchema>

export const canEditTalk = (status: TalkStatus): boolean => {
  return ['draft', 'submitted'].includes(status)
}

export const canWithdrawTalk = (status: TalkStatus): boolean => {
  return ['submitted', 'under_review', 'accepted', 'confirmed'].includes(status)
}

export const canConfirmTalk = (status: TalkStatus): boolean => {
  return status === 'accepted'
}

export const canDeclineTalk = (status: TalkStatus): boolean => {
  return status === 'accepted'
}

export const getStatusLabel = (status: TalkStatus): string => {
  const labels: Record<TalkStatus, string> = {
    draft: 'Draft',
    submitted: 'Submitted',
    under_review: 'Under Review',
    accepted: 'Accepted',
    rejected: 'Rejected',
    confirmed: 'Confirmed',
    declined: 'Declined',
    withdrawn: 'Withdrawn'
  }
  return labels[status]
}

export const getStatusColor = (status: TalkStatus): string => {
  const colors: Record<TalkStatus, string> = {
    draft: 'gray',
    submitted: 'blue',
    under_review: 'yellow',
    accepted: 'green',
    rejected: 'red',
    confirmed: 'emerald',
    declined: 'orange',
    withdrawn: 'slate'
  }
  return colors[status]
}
