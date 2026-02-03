import { fail, redirect } from '@sveltejs/kit'
import type { Actions } from './$types'

export const actions: Actions = {
  default: async ({ request, locals }) => {
    const formData = await request.formData()
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
      return fail(400, { error: 'Email and password are required' })
    }

    try {
      await locals.pb.collection('users').authWithPassword(email, password)
    } catch {
      return fail(401, { error: 'Invalid email or password' })
    }

    throw redirect(303, '/admin')
  }
}
