import { confirmEmailVerification } from '$lib/features/auth/services'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params, locals }) => {
  const { token } = params

  if (!token) {
    return {
      success: false,
      error: 'Missing verification token'
    }
  }

  const result = await confirmEmailVerification(locals.pb, token)

  if (result.success) {
    // If user is logged in, refresh their auth to get updated verified status
    if (locals.pb.authStore.isValid) {
      try {
        await locals.pb.collection('users').authRefresh()
      } catch {
        // Ignore refresh errors
      }
    }
  }

  return {
    success: result.success,
    error: result.error
  }
}
