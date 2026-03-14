import {
  DEFAULT_BRANDING,
  type EmailBranding,
  emailButton,
  textFooter,
  wrapEmail
} from '$lib/server/email-branding'
import nodemailer from 'nodemailer'
import type { NotificationType } from '../domain/notification'

export interface EmailAttachment {
  filename: string
  content: Buffer | Uint8Array
  contentType: string
}

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
  attachments?: EmailAttachment[]
}

export interface EmailService {
  send(options: EmailOptions): Promise<{ success: boolean; error?: string }>
}

export interface EmailTemplateData {
  speakerName: string
  talkTitle?: string
  editionName: string
  eventName: string
  cfpUrl?: string
  confirmationUrl?: string
  cfpDeadline?: string
}

export const createConsoleEmailService = (): EmailService => ({
  async send(options: EmailOptions) {
    console.log('=== Email Sent (Console) ===')
    console.log('To:', options.to)
    console.log('Subject:', options.subject)
    console.log('Body:', options.text || options.html)
    if (options.attachments?.length) {
      console.log('Attachments:', options.attachments.map((a) => a.filename).join(', '))
    }
    console.log('===========================')
    return { success: true }
  }
})

export interface SmtpConfig {
  host: string
  port: number
  user?: string
  pass?: string
  from: string
}

export const createSmtpEmailService = (config: SmtpConfig): EmailService => {
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    ...(config.user && config.pass ? { auth: { user: config.user, pass: config.pass } } : {})
  })

  return {
    async send(options: EmailOptions) {
      try {
        await transporter.sendMail({
          from: config.from,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text,
          attachments: options.attachments?.map((a) => ({
            filename: a.filename,
            content: Buffer.from(a.content),
            contentType: a.contentType
          }))
        })
        return { success: true }
      } catch (err) {
        return { success: false, error: String(err) }
      }
    }
  }
}

export const generateEmailHtml = (
  type: NotificationType,
  data: EmailTemplateData,
  branding: EmailBranding = DEFAULT_BRANDING
): string => {
  const b = branding

  const bodyTemplates: Record<NotificationType, { title: string; body: string }> = {
    submission_confirmed: {
      title: 'Thank you for your submission!',
      body: `
    <p>Dear ${data.speakerName},</p>
    <p>We have received your talk submission <strong>"${data.talkTitle}"</strong> for <strong>${data.editionName}</strong>.</p>
    <p>Our team will review your proposal and get back to you soon.</p>
    <p>You can view and manage your submissions here:</p>
    ${emailButton(b, 'View My Submissions', data.cfpUrl || '#')}
    <p>Best regards,<br>The ${data.eventName} Team</p>`
    },

    talk_accepted: {
      title: 'Congratulations! Your talk has been accepted!',
      body: `
    <p>Dear ${data.speakerName},</p>
    <p>We are thrilled to inform you that your talk <strong>"${data.talkTitle}"</strong> has been accepted for <strong>${data.editionName}</strong>!</p>
    <p>Please confirm your participation by clicking the button below:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.confirmationUrl}" style="display: inline-block; background: #16a34a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Confirm My Participation</a>
    </div>
    <p>We look forward to seeing you at the event!</p>
    <p>Best regards,<br>The ${data.eventName} Team</p>`
    },

    talk_rejected: {
      title: 'Thank you for your submission',
      body: `
    <p>Dear ${data.speakerName},</p>
    <p>Thank you for submitting your talk <strong>"${data.talkTitle}"</strong> to <strong>${data.editionName}</strong>.</p>
    <p>After careful consideration, we regret to inform you that we were unable to include your talk in this year's program. We received many excellent proposals, and the selection process was challenging.</p>
    <p>We encourage you to submit again for future editions!</p>
    <p>Best regards,<br>The ${data.eventName} Team</p>`
    },

    confirmation_reminder: {
      title: 'Please confirm your participation',
      body: `
    <p>Dear ${data.speakerName},</p>
    <p>This is a friendly reminder that your talk <strong>"${data.talkTitle}"</strong> has been accepted for <strong>${data.editionName}</strong>, but we haven't received your confirmation yet.</p>
    <p>Please confirm your participation as soon as possible:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.confirmationUrl}" style="display: inline-block; background: #f59e0b; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Confirm My Participation</a>
    </div>
    <p>Best regards,<br>The ${data.eventName} Team</p>`
    },

    cfp_closing_reminder: {
      title: 'CFP Closing Soon!',
      body: `
    <p>Dear ${data.speakerName},</p>
    <p>This is a reminder that the Call for Papers for <strong>${data.editionName}</strong> is closing on <strong>${data.cfpDeadline}</strong>.</p>
    <p>Don't miss your chance to submit a talk!</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.cfpUrl}" style="display: inline-block; background: #dc2626; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Submit a Talk Now</a>
    </div>
    <p>Best regards,<br>The ${data.eventName} Team</p>`
    },

    cospeaker_invitation: {
      title: "You've Been Invited as a Co-Speaker!",
      body: `
    <p>Dear ${data.speakerName},</p>
    <p>You have been invited to co-present the talk <strong>"${data.talkTitle}"</strong> at <strong>${data.editionName}</strong>.</p>
    <p>Click the button below to view the talk and accept or decline this invitation:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.confirmationUrl}" style="display: inline-block; background: #8b5cf6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">View Invitation</a>
    </div>
    <p>Best regards,<br>The ${data.eventName} Team</p>`
    }
  }

  const { title, body } = bodyTemplates[type]
  return wrapEmail(b, title, body)
}

export const generateEmailText = (
  type: NotificationType,
  data: EmailTemplateData,
  branding: EmailBranding = DEFAULT_BRANDING
): string => {
  const footer = textFooter(branding)

  const templates: Record<NotificationType, string> = {
    submission_confirmed: `
Thank you for your submission!

Dear ${data.speakerName},

We have received your talk submission "${data.talkTitle}" for ${data.editionName}.

Our team will review your proposal and get back to you soon.

You can view and manage your submissions here: ${data.cfpUrl}

Best regards,
The ${data.eventName} Team

${footer}`,

    talk_accepted: `
Congratulations! Your talk has been accepted!

Dear ${data.speakerName},

We are thrilled to inform you that your talk "${data.talkTitle}" has been accepted for ${data.editionName}!

Please confirm your participation here: ${data.confirmationUrl}

We look forward to seeing you at the event!

Best regards,
The ${data.eventName} Team

${footer}`,

    talk_rejected: `
Thank you for your submission

Dear ${data.speakerName},

Thank you for submitting your talk "${data.talkTitle}" to ${data.editionName}.

After careful consideration, we regret to inform you that we were unable to include your talk in this year's program. We received many excellent proposals, and the selection process was challenging.

We encourage you to submit again for future editions!

Best regards,
The ${data.eventName} Team

${footer}`,

    confirmation_reminder: `
Please confirm your participation

Dear ${data.speakerName},

This is a friendly reminder that your talk "${data.talkTitle}" has been accepted for ${data.editionName}, but we haven't received your confirmation yet.

Please confirm your participation here: ${data.confirmationUrl}

Best regards,
The ${data.eventName} Team

${footer}`,

    cfp_closing_reminder: `
CFP Closing Soon!

Dear ${data.speakerName},

This is a reminder that the Call for Papers for ${data.editionName} is closing on ${data.cfpDeadline}.

Don't miss your chance to submit a talk: ${data.cfpUrl}

Best regards,
The ${data.eventName} Team

${footer}`,

    cospeaker_invitation: `
You've Been Invited as a Co-Speaker!

Dear ${data.speakerName},

You have been invited to co-present the talk "${data.talkTitle}" at ${data.editionName}.

Click here to view the talk and accept or decline this invitation: ${data.confirmationUrl}

Best regards,
The ${data.eventName} Team

${footer}`
  }

  return templates[type].trim()
}
