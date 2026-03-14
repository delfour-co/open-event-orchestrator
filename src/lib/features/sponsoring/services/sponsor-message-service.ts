import type { EmailService } from '$lib/features/cfp/services/email-service'
import {
  DEFAULT_BRANDING,
  type EmailBranding,
  emailButton,
  textFooter,
  wrapEmail
} from '$lib/server/email-branding'
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
  data: MessageEmailTemplateData,
  branding: EmailBranding = DEFAULT_BRANDING
): string => {
  const isFromOrganizer = senderType === 'organizer'
  const buttonUrl = isFromOrganizer ? data.portalUrl : data.adminUrl
  const buttonText = isFromOrganizer ? 'View in Sponsor Portal' : 'View in Admin'

  const bodyContent = `
    <p>Dear ${data.recipientName},</p>
    <p>You have received a new message regarding <strong>${data.eventName}</strong> sponsorship${!isFromOrganizer ? ` from ${data.sponsorName}` : ''}.</p>

    <div style="background: #f8f9fa; border-left: 4px solid ${branding.primaryColor}; padding: 16px; margin: 20px 0;">
      <p style="margin: 0 0 8px 0; font-weight: 600;">${data.senderName}</p>
      <p style="margin: 0; white-space: pre-wrap;">${data.messagePreview}${data.messagePreview.length >= 200 ? '...' : ''}</p>
    </div>

    ${buttonUrl ? emailButton(branding, buttonText, buttonUrl) : ''}

    <p>Best regards,<br>The ${data.eventName} Team</p>`

  return wrapEmail(branding, `New Message${data.subject ? `: ${data.subject}` : ''}`, bodyContent)
}

const generateMessageEmailText = (
  senderType: 'organizer' | 'sponsor',
  data: MessageEmailTemplateData,
  branding: EmailBranding = DEFAULT_BRANDING
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

${textFooter(branding)}
`.trim()
}
