import { processPendingInvitations } from '$lib/server/invitations'
import { fail, redirect } from '@sveltejs/kit'
import type { Actions } from './$types'

export const actions: Actions = {
  default: async ({ request, locals, url }) => {
    const formData = await request.formData()
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const redirectTo = formData.get('redirect') as string | null

    if (!email || !password) {
      return fail(400, { error: 'Email and password are required' })
    }

    try {
      const authData = await locals.pb.collection('users').authWithPassword(email, password)

      // Process any pending organization invitations
      const accepted = await processPendingInvitations(locals.pb, authData.record.id, email)

      // Refresh auth to pick up updated role
      if (accepted > 0) {
        await locals.pb.collection('users').authRefresh()
      }
    } catch {
      return fail(401, { error: 'Invalid email or password' })
    }

    // Validate redirect URL - only allow internal paths
    let targetUrl = '/admin'
    if (redirectTo?.startsWith('/') && !redirectTo.startsWith('//')) {
      targetUrl = redirectTo
    } else {
      // Check URL query param as fallback
      const queryRedirect = url.searchParams.get('redirect')
      if (queryRedirect?.startsWith('/') && !queryRedirect.startsWith('//')) {
        targetUrl = queryRedirect
      }
    }

    throw redirect(303, targetUrl)
  }
}
