import { sendInvitationEmail } from '$lib/server/invitation-notifications'
import { canAccessSettings } from '$lib/server/permissions'
import { error, fail, isRedirect, redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals, params }) => {
  // Check permission - reviewers cannot access organization settings
  const userRole = locals.user?.role as string | undefined
  if (!canAccessSettings(userRole)) {
    throw error(403, 'You do not have permission to access organization settings')
  }
  try {
    const organization = await locals.pb
      .collection('organizations')
      .getFirstListItem(`slug="${params.orgSlug}"`, {
        expand: 'ownerId'
      })

    // Get organization members
    let members: Array<{
      id: string
      userId: string
      name: string
      email: string
      role: string
    }> = []

    try {
      const memberRecords = await locals.pb.collection('organization_members').getFullList({
        filter: `organizationId="${organization.id}"`,
        expand: 'userId'
      })

      members = memberRecords.map((m) => ({
        id: m.id as string,
        userId: m.userId as string,
        name: m.expand?.userId
          ? ((m.expand.userId as Record<string, unknown>).name as string)
          : 'Unknown',
        email: m.expand?.userId
          ? ((m.expand.userId as Record<string, unknown>).email as string)
          : '',
        role: m.role as string
      }))
    } catch {
      // Collection might not exist yet or no members
    }

    // Get pending invitations
    let invitations: Array<{
      id: string
      email: string
      role: string
      createdAt: string
    }> = []

    try {
      const invitationRecords = await locals.pb.collection('organization_invitations').getFullList({
        filter: `organizationId="${organization.id}" && status="pending"`
      })

      invitations = invitationRecords.map((inv) => ({
        id: inv.id as string,
        email: inv.email as string,
        role: inv.role as string,
        createdAt: inv.created as string
      }))
    } catch {
      // Collection might not exist yet
    }

    // Count events for this organization
    const events = await locals.pb.collection('events').getFullList({
      filter: `organizationId="${organization.id}"`
    })

    return {
      organization: {
        id: organization.id as string,
        name: organization.name as string,
        slug: organization.slug as string,
        description: (organization.description as string) || '',
        website: (organization.website as string) || '',
        contactEmail: (organization.contactEmail as string) || '',
        ownerId: (organization.ownerId as string) || null,
        ownerName: organization.expand?.ownerId
          ? ((organization.expand.ownerId as Record<string, unknown>).name as string)
          : null
      },
      members,
      invitations,
      eventsCount: events.length
    }
  } catch {
    throw redirect(303, '/admin/organizations')
  }
}

export const actions: Actions = {
  updateOrganization: async ({ request, locals, params }) => {
    // Check permission
    const userRole = locals.user?.role as string | undefined
    if (!canAccessSettings(userRole)) {
      return fail(403, { error: 'You do not have permission to modify organization settings' })
    }

    const formData = await request.formData()
    const name = formData.get('name') as string
    const slug = formData.get('slug') as string
    const description = formData.get('description') as string
    const website = formData.get('website') as string
    const contactEmail = formData.get('contactEmail') as string

    if (!name || !slug) {
      return fail(400, { error: 'Name and slug are required' })
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return fail(400, { error: 'Slug must only contain lowercase letters, numbers, and hyphens' })
    }

    try {
      const organization = await locals.pb
        .collection('organizations')
        .getFirstListItem(`slug="${params.orgSlug}"`)

      // Check if slug is being changed and if new slug already exists
      if (slug !== params.orgSlug) {
        try {
          await locals.pb.collection('organizations').getFirstListItem(`slug="${slug}"`)
          return fail(400, { error: 'An organization with this slug already exists' })
        } catch {
          // Slug is available
        }
      }

      await locals.pb.collection('organizations').update(organization.id, {
        name,
        slug,
        description: description || null,
        website: website || null,
        contactEmail: contactEmail || null
      })

      // If slug changed, redirect to new URL
      if (slug !== params.orgSlug) {
        throw redirect(303, `/admin/organizations/${slug}/settings`)
      }

      return { success: true, message: 'Organization updated successfully' }
    } catch (e) {
      if (isRedirect(e)) throw e
      console.error('Failed to update organization:', e)
      return fail(500, { error: 'Failed to update organization' })
    }
  },

  addMember: async ({ request, locals, params, url }) => {
    // Check permission
    const userRole = locals.user?.role as string | undefined
    if (!canAccessSettings(userRole)) {
      return fail(403, { error: 'You do not have permission to manage members' })
    }

    const formData = await request.formData()
    const email = formData.get('email') as string
    const role = formData.get('role') as string

    if (!email || !role) {
      return fail(400, { error: 'Email and role are required' })
    }

    if (!['admin', 'organizer', 'reviewer'].includes(role)) {
      return fail(400, { error: 'Invalid role' })
    }

    try {
      const organization = await locals.pb
        .collection('organizations')
        .getFirstListItem(`slug="${params.orgSlug}"`)

      // Check if there's already a pending invitation for this email
      try {
        await locals.pb
          .collection('organization_invitations')
          .getFirstListItem(
            `organizationId="${organization.id}" && email="${email}" && status="pending"`
          )
        return fail(400, { error: 'An invitation is already pending for this email' })
      } catch {
        // No pending invitation, continue
      }

      // Try to find user by email
      let user: { id: string; name: string }
      try {
        user = await locals.pb.collection('users').getFirstListItem(`email="${email}"`)
      } catch {
        // User doesn't exist - create an invitation
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 30) // Expires in 30 days

        await locals.pb.collection('organization_invitations').create({
          organizationId: organization.id,
          email,
          role,
          status: 'pending',
          invitedBy: locals.pb.authStore.record?.id || null,
          expiresAt: expiresAt.toISOString()
        })

        const invitedByName = locals.user?.name || 'A team member'
        await sendInvitationEmail({
          email,
          organizationName: organization.name as string,
          role,
          invitedByName,
          registerUrl: `${url.origin}/auth/register`
        })

        return { success: true, message: `Invitation sent to ${email}` }
      }

      // User exists - check if already a member
      try {
        await locals.pb
          .collection('organization_members')
          .getFirstListItem(`organizationId="${organization.id}" && userId="${user.id}"`)
        return fail(400, { error: 'User is already a member of this organization' })
      } catch {
        // User is not a member, proceed
      }

      // Add user directly as member
      await locals.pb.collection('organization_members').create({
        organizationId: organization.id,
        userId: user.id,
        role
      })

      return { success: true, message: `${user.name} added as ${role}` }
    } catch (e) {
      console.error('Failed to add member:', e)
      return fail(500, { error: 'Failed to add member' })
    }
  },

  cancelInvitation: async ({ request, locals }) => {
    // Check permission
    const userRole = locals.user?.role as string | undefined
    if (!canAccessSettings(userRole)) {
      return fail(403, { error: 'You do not have permission to manage invitations' })
    }

    const formData = await request.formData()
    const invitationId = formData.get('invitationId') as string

    if (!invitationId) {
      return fail(400, { error: 'Invitation ID is required' })
    }

    try {
      await locals.pb.collection('organization_invitations').update(invitationId, {
        status: 'cancelled'
      })
      return { success: true, message: 'Invitation cancelled' }
    } catch (e) {
      console.error('Failed to cancel invitation:', e)
      return fail(500, { error: 'Failed to cancel invitation' })
    }
  },

  updateMemberRole: async ({ request, locals }) => {
    // Check permission
    const userRole = locals.user?.role as string | undefined
    if (!canAccessSettings(userRole)) {
      return fail(403, { error: 'You do not have permission to manage members' })
    }

    const formData = await request.formData()
    const memberId = formData.get('memberId') as string
    const role = formData.get('role') as string

    if (!memberId || !role) {
      return fail(400, { error: 'Member ID and role are required' })
    }

    if (!['admin', 'organizer', 'reviewer'].includes(role)) {
      return fail(400, { error: 'Invalid role' })
    }

    try {
      await locals.pb.collection('organization_members').update(memberId, { role })
      return { success: true, message: 'Member role updated' }
    } catch (e) {
      console.error('Failed to update member role:', e)
      return fail(500, { error: 'Failed to update member role' })
    }
  },

  removeMember: async ({ request, locals }) => {
    // Check permission
    const userRole = locals.user?.role as string | undefined
    if (!canAccessSettings(userRole)) {
      return fail(403, { error: 'You do not have permission to manage members' })
    }

    const formData = await request.formData()
    const memberId = formData.get('memberId') as string

    if (!memberId) {
      return fail(400, { error: 'Member ID is required' })
    }

    try {
      await locals.pb.collection('organization_members').delete(memberId)
      return { success: true, message: 'Member removed' }
    } catch (e) {
      console.error('Failed to remove member:', e)
      return fail(500, { error: 'Failed to remove member' })
    }
  },

  deleteOrganization: async ({ locals, params }) => {
    // Check permission
    const userRole = locals.user?.role as string | undefined
    if (!canAccessSettings(userRole)) {
      return fail(403, { error: 'You do not have permission to delete organizations' })
    }

    try {
      const organization = await locals.pb
        .collection('organizations')
        .getFirstListItem(`slug="${params.orgSlug}"`)

      // Check if organization has events
      const events = await locals.pb.collection('events').getFullList({
        filter: `organizationId="${organization.id}"`
      })

      if (events.length > 0) {
        return fail(400, {
          error: `Cannot delete organization with ${events.length} event(s). Delete events first.`
        })
      }

      // Delete all members first
      const members = await locals.pb.collection('organization_members').getFullList({
        filter: `organizationId="${organization.id}"`
      })

      for (const member of members) {
        await locals.pb.collection('organization_members').delete(member.id)
      }

      await locals.pb.collection('organizations').delete(organization.id)
      throw redirect(303, '/admin/organizations')
    } catch (e) {
      if (isRedirect(e)) throw e
      console.error('Failed to delete organization:', e)
      return fail(500, { error: 'Failed to delete organization' })
    }
  }
}
