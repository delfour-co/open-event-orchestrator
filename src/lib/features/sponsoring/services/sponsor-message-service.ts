import type { EmailService } from '$lib/features/cfp/services/email-service'
import type { CreateSponsorMessage, EditionSponsorExpanded, SponsorMessage } from '../domain'
import type { SponsorMessageRepository } from '../infra/sponsor-message-repository'

export interface MessageEmailTemplateData {
  recipientName: string
  senderName: string
  eventName: string
  sponsorName: string
  subject?: string
  messagePreview: string
  portalUrl?: string
  adminUrl?: string
}

export const createSponsorMessageService = (
  messageRepo: SponsorMessageRepository,
  emailService: EmailService
) => ({
  async sendMessage(data: CreateSponsorMessage, attachments: File[] = []): Promise<SponsorMessage> {
    if (attachments.length > 0) {
      return messageRepo.createWithAttachments(data, attachments)
    }
    return messageRepo.create(data)
  },

  async sendMessageWithNotification(
    data: CreateSponsorMessage,
    attachments: File[],
    editionSponsor: EditionSponsorExpanded,
    eventName: string,
    notifyUrl: string
  ): Promise<{ message: SponsorMessage; emailSent: boolean; emailError?: string }> {
    const message = await this.sendMessage(data, attachments)

    // Determine recipient email based on sender type
    let recipientEmail: string | undefined
    let recipientName: string
    let url: string

    if (data.senderType === 'organizer') {
      // Organizer sending to sponsor - notify sponsor
      recipientEmail = editionSponsor.sponsor?.contactEmail
      recipientName =
        editionSponsor.sponsor?.contactName || editionSponsor.sponsor?.name || 'Sponsor'
      url = notifyUrl // portal URL
    } else {
      // Sponsor sending to organizer - would need admin email from settings
      // For now, we skip email notification for sponsor->organizer messages
      // In production, this should fetch the organization's contact email
      return { message, emailSent: false }
    }

    if (!recipientEmail) {
      return { message, emailSent: false, emailError: 'No recipient email available' }
    }

    const emailData: MessageEmailTemplateData = {
      recipientName,
      senderName: data.senderName,
      eventName,
      sponsorName: editionSponsor.sponsor?.name || 'Sponsor',
      subject: data.subject,
      messagePreview: data.content.slice(0, 200),
      portalUrl: url,
      adminUrl: undefined
    }

    const result = await emailService.send({
      to: recipientEmail,
      subject: data.subject
        ? `${eventName} - New message: ${data.subject}`
        : `${eventName} - New message from ${data.senderName}`,
      html: generateMessageEmailHtml(data.senderType, emailData),
      text: generateMessageEmailText(data.senderType, emailData)
    })

    return {
      message,
      emailSent: result.success,
      emailError: result.error
    }
  },

  async markAsRead(messageId: string): Promise<SponsorMessage> {
    return messageRepo.markAsRead(messageId)
  },

  async markAllAsRead(
    editionSponsorId: string,
    forSenderType: 'organizer' | 'sponsor'
  ): Promise<number> {
    return messageRepo.markAllAsReadForEditionSponsor(editionSponsorId, forSenderType)
  }
})

export type SponsorMessageService = ReturnType<typeof createSponsorMessageService>

const generateMessageEmailHtml = (
  senderType: 'organizer' | 'sponsor',
  data: MessageEmailTemplateData
): string => {
  const isFromOrganizer = senderType === 'organizer'
  const buttonUrl = isFromOrganizer ? data.portalUrl : data.adminUrl
  const buttonText = isFromOrganizer ? 'View in Sponsor Portal' : 'View in Admin'

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Message</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #2563eb;">New Message${data.subject ? `: ${data.subject}` : ''}</h1>
  <p>Dear ${data.recipientName},</p>
  <p>You have received a new message regarding <strong>${data.eventName}</strong> sponsorship${!isFromOrganizer ? ` from ${data.sponsorName}` : ''}.</p>

  <div style="background: #f8f9fa; border-left: 4px solid #2563eb; padding: 16px; margin: 20px 0;">
    <p style="margin: 0 0 8px 0; font-weight: 600;">${data.senderName}</p>
    <p style="margin: 0; white-space: pre-wrap;">${data.messagePreview}${data.messagePreview.length >= 200 ? '...' : ''}</p>
  </div>

  ${buttonUrl ? `<p><a href="${buttonUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">${buttonText}</a></p>` : ''}

  <p>Best regards,<br>The ${data.eventName} Team</p>
</body>
</html>`
}

const generateMessageEmailText = (
  senderType: 'organizer' | 'sponsor',
  data: MessageEmailTemplateData
): string => {
  const isFromOrganizer = senderType === 'organizer'
  const buttonUrl = isFromOrganizer ? data.portalUrl : data.adminUrl

  return `
New Message${data.subject ? `: ${data.subject}` : ''}

Dear ${data.recipientName},

You have received a new message regarding ${data.eventName} sponsorship${!isFromOrganizer ? ` from ${data.sponsorName}` : ''}.

From: ${data.senderName}

${data.messagePreview}${data.messagePreview.length >= 200 ? '...' : ''}

${buttonUrl ? `View the full message: ${buttonUrl}` : ''}

Best regards,
The ${data.eventName} Team
`.trim()
}
