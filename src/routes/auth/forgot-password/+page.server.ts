import { randomBytes } from 'node:crypto'
import { forgotPasswordSchema } from '$lib/features/auth/domain'
import { sendPasswordResetEmail } from '$lib/features/auth/services/password-reset-service'
import { fail } from '@sveltejs/kit'
import type { Actions } from './$types'

export const actions: Actions = {
  default: async ({ request, locals, url }) => {
    const formData = await request.formData()
    const email = formData.get('email') as string

    const result = forgotPasswordSchema.safeParse({ email })
    if (!result.success) {
      return fail(400, { error: 'Please enter a valid email address' })
    }

    try {
      // Find user by email
      const user = await locals.pb.collection('users').getFirstListItem(`email="${email}"`)

      // Generate a secure token
      const token = randomBytes(32).toString('hex')
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 1) // 1 hour expiry

      // Store the token
      await locals.pb.collection('password_reset_tokens').create({
        userId: user.id,
        token,
        expiresAt: expiresAt.toISOString(),
        used: false
      })

      // Send branded email via our SMTP service (Mailpit in dev)
      const resetUrl = `${url.origin}/auth/reset-password/${token}`
      await sendPasswordResetEmail({
        pb: locals.pb,
        email,
        name: (user.name as string) || email,
        resetUrl
      })
    } catch {
      // Silently ignore errors to not reveal if email exists
    }

    // Always show success message regardless of whether email exists
    return { success: true }
  }
}
