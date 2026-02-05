import { registerSchema } from '$lib/features/auth/domain'
import { processPendingInvitations } from '$lib/server/invitations'
import { fail, redirect } from '@sveltejs/kit'
import type { Actions } from './$types'

export const actions: Actions = {
  default: async ({ request, locals }) => {
    const formData = await request.formData()
    const data = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      passwordConfirm: formData.get('passwordConfirm') as string
    }

    const result = registerSchema.safeParse(data)
    if (!result.success) {
      const errors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        errors[issue.path[0] as string] = issue.message
      }
      return fail(400, { errors })
    }

    try {
      await locals.pb.collection('users').create({
        name: data.name,
        email: data.email,
        password: data.password,
        passwordConfirm: data.passwordConfirm
      })

      // Auto login after registration
      const authData = await locals.pb
        .collection('users')
        .authWithPassword(data.email, data.password)

      // Process any pending organization invitations
      const accepted = await processPendingInvitations(locals.pb, authData.record.id, data.email)

      // Refresh auth to pick up updated role
      if (accepted > 0) {
        await locals.pb.collection('users').authRefresh()
      }
    } catch (err) {
      console.error('Registration error:', err)
      const pbError = err as { response?: { data?: Record<string, { message: string }> } }
      if (pbError.response?.data?.email) {
        return fail(400, { errors: { email: 'Email already exists' } })
      }
      return fail(500, { error: 'Failed to create account' })
    }

    throw redirect(303, '/admin')
  }
}
