import type { NotificationType } from '../domain/notification'

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
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
    console.log('===========================')
    return { success: true }
  }
})

export const createResendEmailService = (apiKey: string): EmailService => ({
  async send(options: EmailOptions) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'CFP <cfp@notifications.example.com>',
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text
        })
      })

      if (!response.ok) {
        const error = await response.text()
        return { success: false, error }
      }

      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  }
})

export const generateEmailHtml = (type: NotificationType, data: EmailTemplateData): string => {
  const templates: Record<NotificationType, string> = {
    submission_confirmed: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Submission Confirmed</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #2563eb;">Thank you for your submission!</h1>
  <p>Dear ${data.speakerName},</p>
  <p>We have received your talk submission <strong>"${data.talkTitle}"</strong> for <strong>${data.editionName}</strong>.</p>
  <p>Our team will review your proposal and get back to you soon.</p>
  <p>You can view and manage your submissions here:</p>
  <p><a href="${data.cfpUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View My Submissions</a></p>
  <p>Best regards,<br>The ${data.eventName} Team</p>
</body>
</html>`,

    talk_accepted: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Talk Accepted</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #16a34a;">Congratulations! Your talk has been accepted!</h1>
  <p>Dear ${data.speakerName},</p>
  <p>We are thrilled to inform you that your talk <strong>"${data.talkTitle}"</strong> has been accepted for <strong>${data.editionName}</strong>!</p>
  <p>Please confirm your participation by clicking the button below:</p>
  <p><a href="${data.confirmationUrl}" style="display: inline-block; background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Confirm My Participation</a></p>
  <p>We look forward to seeing you at the event!</p>
  <p>Best regards,<br>The ${data.eventName} Team</p>
</body>
</html>`,

    talk_rejected: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Talk Status Update</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #64748b;">Thank you for your submission</h1>
  <p>Dear ${data.speakerName},</p>
  <p>Thank you for submitting your talk <strong>"${data.talkTitle}"</strong> to <strong>${data.editionName}</strong>.</p>
  <p>After careful consideration, we regret to inform you that we were unable to include your talk in this year's program. We received many excellent proposals, and the selection process was challenging.</p>
  <p>We encourage you to submit again for future editions!</p>
  <p>Best regards,<br>The ${data.eventName} Team</p>
</body>
</html>`,

    confirmation_reminder: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmation Reminder</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #f59e0b;">Please confirm your participation</h1>
  <p>Dear ${data.speakerName},</p>
  <p>This is a friendly reminder that your talk <strong>"${data.talkTitle}"</strong> has been accepted for <strong>${data.editionName}</strong>, but we haven't received your confirmation yet.</p>
  <p>Please confirm your participation as soon as possible:</p>
  <p><a href="${data.confirmationUrl}" style="display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Confirm My Participation</a></p>
  <p>Best regards,<br>The ${data.eventName} Team</p>
</body>
</html>`,

    cfp_closing_reminder: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CFP Closing Soon</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #dc2626;">CFP Closing Soon!</h1>
  <p>Dear ${data.speakerName},</p>
  <p>This is a reminder that the Call for Papers for <strong>${data.editionName}</strong> is closing on <strong>${data.cfpDeadline}</strong>.</p>
  <p>Don't miss your chance to submit a talk!</p>
  <p><a href="${data.cfpUrl}" style="display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Submit a Talk Now</a></p>
  <p>Best regards,<br>The ${data.eventName} Team</p>
</body>
</html>`,

    cospeaker_invitation: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Co-Speaker Invitation</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #8b5cf6;">You've Been Invited as a Co-Speaker!</h1>
  <p>Dear ${data.speakerName},</p>
  <p>You have been invited to co-present the talk <strong>"${data.talkTitle}"</strong> at <strong>${data.editionName}</strong>.</p>
  <p>Click the button below to view the talk and accept or decline this invitation:</p>
  <p><a href="${data.confirmationUrl}" style="display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Invitation</a></p>
  <p>Best regards,<br>The ${data.eventName} Team</p>
</body>
</html>`
  }

  return templates[type]
}

export const generateEmailText = (type: NotificationType, data: EmailTemplateData): string => {
  const templates: Record<NotificationType, string> = {
    submission_confirmed: `
Thank you for your submission!

Dear ${data.speakerName},

We have received your talk submission "${data.talkTitle}" for ${data.editionName}.

Our team will review your proposal and get back to you soon.

You can view and manage your submissions here: ${data.cfpUrl}

Best regards,
The ${data.eventName} Team`,

    talk_accepted: `
Congratulations! Your talk has been accepted!

Dear ${data.speakerName},

We are thrilled to inform you that your talk "${data.talkTitle}" has been accepted for ${data.editionName}!

Please confirm your participation here: ${data.confirmationUrl}

We look forward to seeing you at the event!

Best regards,
The ${data.eventName} Team`,

    talk_rejected: `
Thank you for your submission

Dear ${data.speakerName},

Thank you for submitting your talk "${data.talkTitle}" to ${data.editionName}.

After careful consideration, we regret to inform you that we were unable to include your talk in this year's program. We received many excellent proposals, and the selection process was challenging.

We encourage you to submit again for future editions!

Best regards,
The ${data.eventName} Team`,

    confirmation_reminder: `
Please confirm your participation

Dear ${data.speakerName},

This is a friendly reminder that your talk "${data.talkTitle}" has been accepted for ${data.editionName}, but we haven't received your confirmation yet.

Please confirm your participation here: ${data.confirmationUrl}

Best regards,
The ${data.eventName} Team`,

    cfp_closing_reminder: `
CFP Closing Soon!

Dear ${data.speakerName},

This is a reminder that the Call for Papers for ${data.editionName} is closing on ${data.cfpDeadline}.

Don't miss your chance to submit a talk: ${data.cfpUrl}

Best regards,
The ${data.eventName} Team`,

    cospeaker_invitation: `
You've Been Invited as a Co-Speaker!

Dear ${data.speakerName},

You have been invited to co-present the talk "${data.talkTitle}" at ${data.editionName}.

Click here to view the talk and accept or decline this invitation: ${data.confirmationUrl}

Best regards,
The ${data.eventName} Team`
  }

  return templates[type].trim()
}
