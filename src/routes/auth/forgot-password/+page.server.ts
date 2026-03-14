import { forgotPasswordSchema } from '$lib/features/auth/domain'
import { fail } from '@sveltejs/kit'
import type { Actions } from './$types'

export const actions: Actions = {
  default: async ({ request, locals }) => {
    const formData = await request.formData()
    const email = formData.get('email') as string

    const result = forgotPasswordSchema.safeParse({ email })
    if (!result.success) {
      return fail(400, { error: 'Please enter a valid email address' })
    }

    try {
      await locals.pb.collection('users').requestPasswordReset(email)
    } catch {
      // Silently ignore errors to not reveal if email exists
    }

    // Always show success message regardless of whether email exists
    return { success: true }
  }
}
