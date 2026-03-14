import { getEmailService } from '$lib/server/app-settings'
import {
  DEFAULT_BRANDING,
  type EmailBranding,
  emailButton,
  textFooter,
  wrapEmail
} from '$lib/server/email-branding'
import type PocketBase from 'pocketbase'

export interface SendInvitationEmailParams {
  pb: PocketBase
  email: string
  organizationName: string
  role: string
  invitedByName: string
  acceptUrl: string
  logoUrl?: string
  primaryColor?: string
}

export async function sendInvitationEmail(
  params: SendInvitationEmailParams
): Promise<{ success: boolean; error?: string }> {
  const { pb, email, organizationName, role, invitedByName, acceptUrl, logoUrl, primaryColor } =
    params

  const emailService = await getEmailService(pb)
  const subject = `You've been invited to join ${organizationName}`

  const branding: EmailBranding = {
    ...DEFAULT_BRANDING,
    orgName: organizationName,
    logoUrl,
    primaryColor: primaryColor || DEFAULT_BRANDING.primaryColor
  }

  const bodyHtml = `<p style="margin-top: 0;">Hello,</p>

    <p><strong>${invitedByName}</strong> has invited you to join <strong>${organizationName}</strong> as <strong>${role}</strong>.</p>

    <p>Click the button below to accept the invitation:</p>

    ${emailButton(branding, 'Accept Invitation', acceptUrl)}

    <p style="color: #64748b; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: ${branding.primaryColor}; font-size: 14px;">${acceptUrl}</p>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;">

    <p style="color: #64748b; font-size: 14px; margin-bottom: 0;">
      <strong>Note:</strong> This invitation will expire in 30 days. If you didn't expect this invitation, you can safely ignore this email.
    </p>`

  const html = wrapEmail(branding, "You're Invited!", bodyHtml)

  const text = `You're Invited!

Hello,

${invitedByName} has invited you to join ${organizationName} as ${role}.

Accept the invitation: ${acceptUrl}

This invitation will expire in 30 days.

${textFooter(branding)}`

  try {
    const result = await emailService.send({ to: email, subject, html, text })
    return result
  } catch (err) {
    console.error('Failed to send invitation email:', err)
    return { success: false, error: String(err) }
  }
}
