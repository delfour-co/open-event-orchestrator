import { redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const actions: Actions = {
  default: async ({ locals }) => {
    locals.pb.authStore.clear()
    throw redirect(303, '/')
  }
}

export const load: PageServerLoad = async ({ locals }) => {
  locals.pb.authStore.clear()
  throw redirect(303, '/')
}
