import { getEmailService } from '$lib/server/app-settings'
import { DEFAULT_BRANDING, emailButton, textFooter, wrapEmail } from '$lib/server/email-branding'
import type PocketBase from 'pocketbase'

export interface SendVerificationEmailParams {
  pb: PocketBase
  email: string
  name: string
  verificationUrl: string
}

/**
 * Generate HTML content for verification email
 */
export function generateVerificationEmailHtml(params: {
  name: string
  verificationUrl: string
}): string {
  const { name, verificationUrl } = params

  const bodyHtml = `<p style="margin-top: 0;">Hello <strong>${name}</strong>,</p>

    <p>Thank you for creating an account with Open Event Orchestrator. To complete your registration, please verify your email address by clicking the button below:</p>

    ${emailButton(DEFAULT_BRANDING, 'Verify Email Address', verificationUrl)}

    <p style="color: #64748b; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: ${DEFAULT_BRANDING.primaryColor}; font-size: 14px;">${verificationUrl}</p>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;">

    <p style="color: #64748b; font-size: 14px; margin-bottom: 0;">
      <strong>Note:</strong> This verification link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
    </p>`

  return wrapEmail(DEFAULT_BRANDING, 'Verify Your Email Address', bodyHtml)
}

/**
 * Generate plain text content for verification email
 */
export function generateVerificationEmailText(params: {
  name: string
  verificationUrl: string
}): string {
  const { name, verificationUrl } = params

  return `Verify Your Email Address

Hello ${name},

Thank you for creating an account with Open Event Orchestrator. To complete your registration, please verify your email address by clicking the link below:

${verificationUrl}

Note: This verification link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.

${textFooter(DEFAULT_BRANDING)}`
}

/**
 * Send verification email to user
 */
export async function sendVerificationEmail(
  params: SendVerificationEmailParams
): Promise<{ success: boolean; error?: string }> {
  const { pb, email, name, verificationUrl } = params

  const emailService = await getEmailService(pb)

  const subject = 'Verify your email address - Open Event Orchestrator'

  const html = generateVerificationEmailHtml({ name, verificationUrl })
  const text = generateVerificationEmailText({ name, verificationUrl })

  try {
    const result = await emailService.send({ to: email, subject, html, text })
    return result
  } catch (err) {
    console.error('Failed to send verification email:', err)
    return { success: false, error: String(err) }
  }
}

/**
 * Request email verification from PocketBase
 * This will trigger PocketBase's built-in verification email
 */
export async function requestEmailVerification(
  pb: PocketBase,
  email: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await pb.collection('users').requestVerification(email)
    return { success: true }
  } catch (err) {
    console.error('Failed to request verification:', err)
    return { success: false, error: String(err) }
  }
}

/**
 * Confirm email verification with token
 */
export async function confirmEmailVerification(
  pb: PocketBase,
  token: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await pb.collection('users').confirmVerification(token)
    return { success: true }
  } catch (err) {
    console.error('Failed to confirm verification:', err)
    const pbError = err as { response?: { message?: string } }
    const message = pbError.response?.message || 'Invalid or expired verification token'
    return { success: false, error: message }
  }
}
