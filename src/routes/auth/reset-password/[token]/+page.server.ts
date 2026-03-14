import { resetPasswordSchema } from '$lib/features/auth/domain'
import { fail, redirect } from '@sveltejs/kit'
import type { Actions } from './$types'

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
      // Use PocketBase's built-in token verification and password reset
      await locals.pb.collection('users').confirmPasswordReset(token, password, passwordConfirm)
    } catch {
      return fail(400, { error: 'invalid_token' })
    }

    throw redirect(303, '/auth/login?resetSuccess=true')
  }
}
