import { redirect } from '@sveltejs/kit'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ locals }) => {
  if (!locals.user) {
    throw redirect(303, '/auth/login')
  }

  return {
    user: {
      id: locals.user.id,
      email: locals.user.email,
      name: locals.user.name,
      avatar: locals.user.avatar
    }
  }
}
