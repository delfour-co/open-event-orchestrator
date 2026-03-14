import { getEmailService } from '$lib/server/app-settings'
import type PocketBase from 'pocketbase'

export interface SendPasswordResetEmailParams {
  pb: PocketBase
  email: string
  name: string
  resetUrl: string
}

/**
 * Generate HTML content for password reset email
 */
export function generatePasswordResetEmailHtml(params: {
  name: string
  resetUrl: string
}): string {
  const { name, resetUrl } = params

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Reset Your Password</h1>
  </div>

  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
    <p style="margin-top: 0;">Hello <strong>${name}</strong>,</p>

    <p>We received a request to reset your password for your Open Event Orchestrator account. Click the button below to set a new password:</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Reset Password</a>
    </div>

    <p style="color: #64748b; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #2563eb; font-size: 14px;">${resetUrl}</p>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;">

    <p style="color: #64748b; font-size: 14px; margin-bottom: 0;">
      <strong>Note:</strong> This password reset link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
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
 * Generate plain text content for password reset email
 */
export function generatePasswordResetEmailText(params: {
  name: string
  resetUrl: string
}): string {
  const { name, resetUrl } = params

  return `Reset Your Password

Hello ${name},

We received a request to reset your password for your Open Event Orchestrator account. Click the link below to set a new password:

${resetUrl}

Note: This password reset link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.

---
Open Event Orchestrator
All-in-one platform for event management`
}

/**
 * Send password reset email to user
 */
export async function sendPasswordResetEmail(
  params: SendPasswordResetEmailParams
): Promise<{ success: boolean; error?: string }> {
  const { pb, email, name, resetUrl } = params

  const emailService = await getEmailService(pb)

  const subject = 'Reset your password - Open Event Orchestrator'

  const html = generatePasswordResetEmailHtml({ name, resetUrl })
  const text = generatePasswordResetEmailText({ name, resetUrl })

  try {
    const result = await emailService.send({ to: email, subject, html, text })
    return result
  } catch (err) {
    console.error('Failed to send password reset email:', err)
    return { success: false, error: String(err) }
  }
}

/**
 * Request password reset from PocketBase
 */
export async function requestPasswordReset(
  pb: PocketBase,
  email: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await pb.collection('users').requestPasswordReset(email)
    return { success: true }
  } catch (err) {
    console.error('Failed to request password reset:', err)
    return { success: false, error: String(err) }
  }
}

/**
 * Confirm password reset with token
 */
export async function confirmPasswordReset(
  pb: PocketBase,
  token: string,
  password: string,
  passwordConfirm: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await pb.collection('users').confirmPasswordReset(token, password, passwordConfirm)
    return { success: true }
  } catch (err) {
    console.error('Failed to confirm password reset:', err)
    const pbError = err as { response?: { message?: string } }
    const message = pbError.response?.message || 'Invalid or expired password reset token'
    return { success: false, error: message }
  }
}
