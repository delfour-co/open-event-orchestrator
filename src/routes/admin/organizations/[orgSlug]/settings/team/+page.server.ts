import { getEventBus } from '$lib/server/event-bus'
import { sendInvitationEmail } from '$lib/server/invitation-notifications'
import { canAccessSettings } from '$lib/server/permissions'
import { fail } from '@sveltejs/kit'
import type { Actions } from './$types'

export const actions: Actions = {
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
        // User doesn't exist - create an invitation with token
        const { generateInvitationToken } = await import('$lib/features/core/domain/invitation')
        const token = generateInvitationToken()
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 30) // Expires in 30 days

        await locals.pb.collection('organization_invitations').create({
          organizationId: organization.id,
          email,
          role,
          status: 'pending',
          token,
          invitedBy: locals.pb.authStore.record?.id || null,
          expiresAt: expiresAt.toISOString(),
          lastSentAt: new Date().toISOString()
        })

        const invitedByName = locals.user?.name || 'A team member'
        const acceptUrl = `${url.origin}/auth/invite/${token}`
        const logoUrl = organization.logo
          ? `${url.origin}/api/files/organizations/${organization.id}/${organization.logo}`
          : undefined
        await sendInvitationEmail({
          pb: locals.pb,
          email,
          organizationName: organization.name as string,
          role,
          invitedByName,
          acceptUrl,
          logoUrl,
          primaryColor: (organization.primaryColor as string) || undefined
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

      // Emit member.joined event
      getEventBus().emit('member.joined', {
        userId: user.id,
        organizationId: organization.id,
        organizationName: organization.name as string,
        userName: user.name,
        userEmail: email,
        role,
        timestamp: new Date()
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

  resendInvitation: async ({ request, locals, params, url }) => {
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
      const invitation = await locals.pb.collection('organization_invitations').getOne(invitationId)
      const organization = await locals.pb
        .collection('organizations')
        .getFirstListItem(`slug="${params.orgSlug}"`)

      // Generate new token if not present
      const { generateInvitationToken } = await import('$lib/features/core/domain/invitation')
      let token = invitation.token as string
      if (!token) {
        token = generateInvitationToken()
      }

      // Update lastSentAt and token
      await locals.pb.collection('organization_invitations').update(invitationId, {
        lastSentAt: new Date().toISOString(),
        token
      })

      const invitedByName = locals.user?.name || 'A team member'
      const acceptUrl = `${url.origin}/auth/invite/${token}`
      const logoUrl = organization.logo
        ? `${url.origin}/api/files/organizations/${organization.id}/${organization.logo}`
        : undefined

      await sendInvitationEmail({
        pb: locals.pb,
        email: invitation.email as string,
        organizationName: organization.name as string,
        role: invitation.role as string,
        invitedByName,
        acceptUrl,
        logoUrl,
        primaryColor: (organization.primaryColor as string) || undefined
      })

      return { success: true, message: `Invitation resent to ${invitation.email}` }
    } catch (e) {
      console.error('Failed to resend invitation:', e)
      return fail(500, { error: 'Failed to resend invitation' })
    }
  },

  bulkInvite: async ({ request, locals, params, url }) => {
    const userRole = locals.user?.role as string | undefined
    if (!canAccessSettings(userRole)) {
      return fail(403, { error: 'You do not have permission to manage invitations' })
    }

    const formData = await request.formData()
    const csvContent = formData.get('csv') as string

    if (!csvContent?.trim()) {
      return fail(400, { error: 'CSV content is required' })
    }

    const { parseInvitationCsv, generateInvitationToken } = await import(
      '$lib/features/core/domain/invitation'
    )
    const { rows, errors } = parseInvitationCsv(csvContent)

    if (errors.length > 0 && rows.length === 0) {
      return fail(400, {
        error: `CSV parsing errors: ${errors.map((e) => `Line ${e.line}: ${e.message}`).join('; ')}`
      })
    }

    try {
      const organization = await locals.pb
        .collection('organizations')
        .getFirstListItem(`slug="${params.orgSlug}"`)
      const invitedByName = locals.user?.name || 'A team member'
      let sentCount = 0
      let skipCount = 0

      for (const row of rows) {
        // Check for existing pending invitation
        try {
          await locals.pb
            .collection('organization_invitations')
            .getFirstListItem(
              `organizationId="${organization.id}" && email="${row.email}" && status="pending"`
            )
          skipCount++
          continue
        } catch {
          /* No existing invitation */
        }

        const token = generateInvitationToken()
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 30)

        await locals.pb.collection('organization_invitations').create({
          organizationId: organization.id,
          email: row.email,
          role: row.role,
          status: 'pending',
          token,
          invitedBy: locals.pb.authStore.record?.id || null,
          expiresAt: expiresAt.toISOString(),
          lastSentAt: new Date().toISOString()
        })

        const acceptUrl = `${url.origin}/auth/invite/${token}`
        const logoUrl = organization.logo
          ? `${url.origin}/api/files/organizations/${organization.id}/${organization.logo}`
          : undefined
        await sendInvitationEmail({
          pb: locals.pb,
          email: row.email,
          organizationName: organization.name as string,
          role: row.role,
          invitedByName,
          acceptUrl,
          logoUrl,
          primaryColor: (organization.primaryColor as string) || undefined
        })
        sentCount++
      }

      let message = `${sentCount} invitation(s) sent`
      if (skipCount > 0) message += `, ${skipCount} skipped (already pending)`
      if (errors.length > 0) message += `, ${errors.length} line(s) had errors`

      return { success: true, message }
    } catch (e) {
      console.error('Failed to bulk invite:', e)
      return fail(500, { error: 'Failed to process bulk invitations' })
    }
  }
}
