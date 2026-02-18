import { getEmailService } from '$lib/server/app-settings'
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

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your email address</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Verify Your Email Address</h1>
  </div>

  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
    <p style="margin-top: 0;">Hello <strong>${name}</strong>,</p>

    <p>Thank you for creating an account with Open Event Orchestrator. To complete your registration, please verify your email address by clicking the button below:</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${verificationUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Verify Email Address</a>
    </div>

    <p style="color: #64748b; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #2563eb; font-size: 14px;">${verificationUrl}</p>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;">

    <p style="color: #64748b; font-size: 14px; margin-bottom: 0;">
      <strong>Note:</strong> This verification link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
    </p>
  </div>

  <div style="text-align: center; padding: 20px; color: #64748b; font-size: 12px;">
    <p style="margin: 0;">Open Event Orchestrator</p>
    <p style="margin: 5px 0;">All-in-one platform for event management</p>
  </div>
</body>
</html>`
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

---
Open Event Orchestrator
All-in-one platform for event management`
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
