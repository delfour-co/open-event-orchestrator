import { getEmailService } from '$lib/server/app-settings'
import type PocketBase from 'pocketbase'

export interface SendInvitationEmailParams {
  pb: PocketBase
  email: string
  organizationName: string
  role: string
  invitedByName: string
  registerUrl: string
}

export async function sendInvitationEmail(
  params: SendInvitationEmailParams
): Promise<{ success: boolean; error?: string }> {
  const { pb, email, organizationName, role, invitedByName, registerUrl } = params

  const emailService = await getEmailService(pb)

  const subject = `You've been invited to join ${organizationName}`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Organization Invitation</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #2563eb;">You've been invited!</h1>
  <p>Hello,</p>
  <p><strong>${invitedByName}</strong> has invited you to join <strong>${organizationName}</strong> as <strong>${role}</strong>.</p>
  <p>To accept this invitation, create an account or sign in with the email address <strong>${email}</strong>:</p>
  <p><a href="${registerUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Join ${organizationName}</a></p>
  <p style="color: #64748b; font-size: 14px;">This invitation will expire in 30 days.</p>
  <p>Best regards,<br>The Open Event Orchestrator Team</p>
</body>
</html>`

  const text = `You've been invited!

Hello,

${invitedByName} has invited you to join ${organizationName} as ${role}.

To accept this invitation, create an account or sign in with the email address ${email}:

${registerUrl}

This invitation will expire in 30 days.

Best regards,
The Open Event Orchestrator Team`

  try {
    const result = await emailService.send({ to: email, subject, html, text })
    return result
  } catch (err) {
    console.error('Failed to send invitation email:', err)
    return { success: false, error: String(err) }
  }
}
