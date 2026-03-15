import { buildFileUrl } from '$lib/server/file-url'
import { processPendingInvitations } from '$lib/server/invitations'
import { error, fail, redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params, locals }) => {
  const { token } = params

  try {
    const invitation = await locals.pb
      .collection('organization_invitations')
      .getFirstListItem(`token="${token}" && status="pending"`, {
        expand: 'organizationId'
      })

    const expiresAt = invitation.expiresAt ? new Date(invitation.expiresAt as string) : null
    if (expiresAt && expiresAt < new Date()) {
      await locals.pb
        .collection('organization_invitations')
        .update(invitation.id, { status: 'expired' })
      throw error(410, 'This invitation has expired')
    }

    const org = invitation.expand?.organizationId as Record<string, unknown> | undefined
    const organizationName = org ? (org.name as string) : 'the organization'

    let logoUrl: string | undefined
    if (org?.logo) {
      logoUrl = buildFileUrl('organizations', org.id as string, org.logo as string)
    }

    // If user is already logged in, auto-accept and redirect
    if (locals.user) {
      const accepted = await processPendingInvitations(
        locals.pb,
        locals.user.id,
        locals.user.email as string
      )
      if (accepted > 0) {
        await locals.pb.collection('users').authRefresh()
      }
      throw redirect(303, '/admin')
    }

    return {
      organizationName,
      role: invitation.role as string,
      email: invitation.email as string,
      token,
      logoUrl,
      userExists: false
    }
  } catch (e) {
    if (e && typeof e === 'object' && 'status' in e) throw e
    throw error(404, 'Invalid invitation link')
  }
}

export const actions: Actions = {
  // Accept invitation — either create account or login
  default: async ({ request, locals, params }) => {
    const { token } = params
    const formData = await request.formData()
    const mode = formData.get('mode') as string // 'register' or 'login'
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
      return fail(400, { error: 'Email and password are required' })
    }

    if (mode === 'register') {
      // Create new account
      const name = formData.get('name') as string
      const passwordConfirm = formData.get('passwordConfirm') as string

      if (!name) {
        return fail(400, { error: 'Name is required' })
      }

      if (password !== passwordConfirm) {
        return fail(400, { error: 'Passwords do not match' })
      }

      if (password.length < 8) {
        return fail(400, { error: 'Password must be at least 8 characters' })
      }

      try {
        await locals.pb.collection('users').create({
          name,
          email,
          password,
          passwordConfirm
        })
      } catch (err) {
        console.error('Registration error:', err)
        const pbError = err as { response?: { data?: Record<string, { message: string }> } }
        if (pbError.response?.data?.email) {
          return fail(400, { error: 'Email already exists' })
        }
        return fail(500, { error: 'Failed to create account' })
      }
    }

    // Login (for both new and existing accounts)
    try {
      const authData = await locals.pb.collection('users').authWithPassword(email, password)

      // Process pending invitations (including this one)
      const accepted = await processPendingInvitations(locals.pb, authData.record.id, email)

      if (accepted > 0) {
        await locals.pb.collection('users').authRefresh()
      }
    } catch {
      return fail(401, { error: 'Invalid password' })
    }

    throw redirect(303, '/admin')
  }
}
