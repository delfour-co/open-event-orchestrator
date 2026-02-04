import { env } from '$env/dynamic/private'
import type { NotificationType } from '$lib/features/cfp/domain'
import { getNotificationSubject } from '$lib/features/cfp/domain/notification'
import {
  createEmailLogRepository,
  createSpeakerRepository,
  createTalkRepository
} from '$lib/features/cfp/infra'
import {
  type EmailTemplateData,
  createConsoleEmailService,
  createResendEmailService,
  generateEmailHtml,
  generateEmailText
} from '$lib/features/cfp/services'
import type PocketBase from 'pocketbase'

const getEmailService = () => {
  if (env.RESEND_API_KEY) {
    return createResendEmailService(env.RESEND_API_KEY)
  }
  // Fall back to console logging in development
  return createConsoleEmailService()
}

export interface SendCfpNotificationParams {
  pb: PocketBase
  type: NotificationType
  talkId: string
  speakerId: string
  editionId: string
  editionSlug: string
  editionName: string
  eventName: string
  baseUrl: string
}

export async function sendCfpNotification(params: SendCfpNotificationParams): Promise<{
  success: boolean
  error?: string
}> {
  const { pb, type, talkId, speakerId, editionId, editionSlug, editionName, eventName, baseUrl } =
    params

  const speakerRepo = createSpeakerRepository(pb)
  const talkRepo = createTalkRepository(pb)
  const emailLogRepo = createEmailLogRepository(pb)
  const emailService = getEmailService()

  try {
    // Get speaker info
    const speaker = await speakerRepo.findById(speakerId)
    if (!speaker) {
      return { success: false, error: 'Speaker not found' }
    }

    // Get talk info
    const talk = await talkRepo.findById(talkId)
    if (!talk) {
      return { success: false, error: 'Talk not found' }
    }

    // Build template data
    const templateData: EmailTemplateData = {
      speakerName: `${speaker.firstName} ${speaker.lastName}`,
      talkTitle: talk.title,
      editionName,
      eventName,
      cfpUrl: `${baseUrl}/cfp/${editionSlug}/submissions?email=${encodeURIComponent(speaker.email)}`,
      confirmationUrl: `${baseUrl}/cfp/${editionSlug}/submissions?email=${encodeURIComponent(speaker.email)}`
    }

    // Generate email content
    const subject = getNotificationSubject(type, editionName, talk.title)
    const html = generateEmailHtml(type, templateData)
    const text = generateEmailText(type, templateData)

    // Create pending email log
    const emailLog = await emailLogRepo.create({
      talkId,
      speakerId,
      editionId,
      type,
      to: speaker.email,
      subject,
      status: 'pending'
    })

    // Send email
    const result = await emailService.send({
      to: speaker.email,
      subject,
      html,
      text
    })

    // Update email log status
    if (result.success) {
      await emailLogRepo.updateStatus(emailLog.id, 'sent')
      return { success: true }
    }

    await emailLogRepo.updateStatus(emailLog.id, 'failed', result.error)
    return { success: false, error: result.error }
  } catch (err) {
    console.error('Failed to send CFP notification:', err)
    return { success: false, error: String(err) }
  }
}
