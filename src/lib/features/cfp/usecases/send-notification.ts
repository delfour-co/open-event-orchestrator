import type { NotificationType } from '../domain'
import { getNotificationSubject } from '../domain/notification'
import type { EmailLogRepository } from '../infra/email-log-repository'
import type { SpeakerRepository } from '../infra/speaker-repository'
import type { TalkRepository } from '../infra/talk-repository'
import type { EmailService, EmailTemplateData } from '../services/email-service'
import { generateEmailHtml, generateEmailText } from '../services/email-service'

export interface SendNotificationInput {
  type: NotificationType
  talkId?: string
  speakerId: string
  editionId: string
  editionName: string
  eventName: string
  baseUrl: string
}

export interface SendNotificationResult {
  success: boolean
  emailLogId?: string
  error?: string
}

export const createSendNotificationUseCase = (
  emailService: EmailService,
  emailLogRepository: EmailLogRepository,
  speakerRepository: SpeakerRepository,
  talkRepository: TalkRepository
) => {
  return async (input: SendNotificationInput): Promise<SendNotificationResult> => {
    // Get speaker info
    const speaker = await speakerRepository.findById(input.speakerId)
    if (!speaker) {
      return { success: false, error: 'Speaker not found' }
    }

    // Get talk info if provided
    let talkTitle: string | undefined
    if (input.talkId) {
      const talk = await talkRepository.findById(input.talkId)
      if (talk) {
        talkTitle = talk.title
      }
    }

    // Build template data
    const templateData: EmailTemplateData = {
      speakerName: `${speaker.firstName} ${speaker.lastName}`,
      talkTitle,
      editionName: input.editionName,
      eventName: input.eventName,
      cfpUrl: `${input.baseUrl}/cfp/${input.editionId}/submissions?email=${encodeURIComponent(speaker.email)}`,
      confirmationUrl: input.talkId
        ? `${input.baseUrl}/cfp/${input.editionId}/submissions/${input.talkId}/confirm`
        : undefined
    }

    // Generate email content
    const subject = getNotificationSubject(input.type, input.editionName, talkTitle)
    const html = generateEmailHtml(input.type, templateData)
    const text = generateEmailText(input.type, templateData)

    // Create pending email log
    const emailLog = await emailLogRepository.create({
      talkId: input.talkId,
      speakerId: input.speakerId,
      editionId: input.editionId,
      type: input.type,
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
      await emailLogRepository.updateStatus(emailLog.id, 'sent')
      return { success: true, emailLogId: emailLog.id }
    }

    await emailLogRepository.updateStatus(emailLog.id, 'failed', result.error)
    return { success: false, emailLogId: emailLog.id, error: result.error }
  }
}

export type SendNotificationUseCase = ReturnType<typeof createSendNotificationUseCase>
