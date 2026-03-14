import { env } from '$env/dynamic/public'
import { processPendingInvitations } from '$lib/server/invitations'
import { error, redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params, locals }) => {
  const { token } = params

  try {
    // Find invitation by token
    const invitation = await locals.pb
      .collection('organization_invitations')
      .getFirstListItem(`token="${token}" && status="pending"`, {
        expand: 'organizationId'
      })

    // Check expiry
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
      const pbUrl = env.PUBLIC_POCKETBASE_URL || 'http://localhost:8090'
      logoUrl = `${pbUrl}/api/files/organizations/${org.id}/${org.logo}`
    }

    // If user is already logged in, auto-accept
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
      logoUrl
    }
  } catch (e) {
    if (e && typeof e === 'object' && 'status' in e) throw e // Re-throw HTTP errors and redirects
    throw error(404, 'Invalid invitation link')
  }
}
