import { resetPasswordSchema } from '$lib/features/auth/domain'
import { fail, redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params, locals }) => {
  const { token } = params

  // Verify token exists and is valid
  try {
    const record = await locals.pb
      .collection('password_reset_tokens')
      .getFirstListItem(`token="${token}" && used=false`)

    const expiresAt = new Date(record.expiresAt as string)
    if (expiresAt < new Date()) {
      return { error: 'expired' }
    }

    return { tokenValid: true }
  } catch {
    return { error: 'invalid' }
  }
}

export const actions: Actions = {
  default: async ({ request, locals, params }) => {
    const formData = await request.formData()
    const password = formData.get('password') as string
    const passwordConfirm = formData.get('passwordConfirm') as string
    const token = params.token

    const result = resetPasswordSchema.safeParse({ token, password, passwordConfirm })
    if (!result.success) {
      const errors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        errors[issue.path[0] as string] = issue.message
      }
      return fail(400, { errors })
    }

    try {
      // Find the token record
      const record = await locals.pb
        .collection('password_reset_tokens')
        .getFirstListItem(`token="${token}" && used=false`)

      // Check expiry
      const expiresAt = new Date(record.expiresAt as string)
      if (expiresAt < new Date()) {
        return fail(400, { error: 'invalid_token' })
      }

      const userId = record.userId as string

      // Update the user's password
      await locals.pb.collection('users').update(userId, {
        password,
        passwordConfirm
      })

      // Mark token as used
      await locals.pb.collection('password_reset_tokens').update(record.id, { used: true })
    } catch (err) {
      console.error('Password reset error:', err)
      return fail(400, { error: 'invalid_token' })
    }

    throw redirect(303, '/auth/login?resetSuccess=true')
  }
}
