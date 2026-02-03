import { z } from 'zod'

export const notificationTypeSchema = z.enum([
  'submission_confirmed',
  'talk_accepted',
  'talk_rejected',
  'confirmation_reminder',
  'cfp_closing_reminder'
])

export type NotificationType = z.infer<typeof notificationTypeSchema>

export const emailLogSchema = z.object({
  id: z.string(),
  talkId: z.string().optional(),
  speakerId: z.string(),
  editionId: z.string(),
  type: notificationTypeSchema,
  to: z.string().email(),
  subject: z.string(),
  sentAt: z.date(),
  status: z.enum(['sent', 'failed', 'pending']),
  error: z.string().optional()
})

export type EmailLog = z.infer<typeof emailLogSchema>

export const createEmailLogSchema = emailLogSchema.omit({
  id: true,
  sentAt: true
})

export type CreateEmailLog = z.infer<typeof createEmailLogSchema>

export const getNotificationTypeLabel = (type: NotificationType): string => {
  const labels: Record<NotificationType, string> = {
    submission_confirmed: 'Submission Confirmed',
    talk_accepted: 'Talk Accepted',
    talk_rejected: 'Talk Rejected',
    confirmation_reminder: 'Confirmation Reminder',
    cfp_closing_reminder: 'CFP Closing Reminder'
  }
  return labels[type]
}

export const getNotificationSubject = (
  type: NotificationType,
  editionName: string,
  talkTitle?: string
): string => {
  const subjects: Record<NotificationType, string> = {
    submission_confirmed: `[${editionName}] Your talk submission has been received`,
    talk_accepted: `[${editionName}] Congratulations! Your talk "${talkTitle}" has been accepted`,
    talk_rejected: `[${editionName}] Update on your talk submission "${talkTitle}"`,
    confirmation_reminder: `[${editionName}] Please confirm your participation for "${talkTitle}"`,
    cfp_closing_reminder: `[${editionName}] CFP closing soon - Submit your talk!`
  }
  return subjects[type]
}
