import { writeAuditLog } from '$lib/server/audit-log-service'
import { getEventBus } from '$lib/server/event-bus'
import { sendInvitationEmail } from '$lib/server/invitation-notifications'
import type {
  PBOrganizationInvitationRecord,
  PBOrganizationMemberRecord,
  PBOrganizationRecord
} from '$lib/server/pb-types'
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
        .getFirstListItem<PBOrganizationRecord>(`slug="${params.orgSlug}"`)

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
          organizationName: organization.name,
          role,
          invitedByName,
          acceptUrl,
          logoUrl,
          primaryColor: organization.primaryColor || undefined
        })

        writeAuditLog(locals.pb, {
          organizationId: organization.id,
          userId: locals.user?.id,
          userName: locals.user?.name ?? '',
          action: 'invitation_send',
          entityType: 'invitation',
          entityId: email,
          entityName: email,
          details: { role },
          ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
          userAgent: request.headers.get('user-agent') || ''
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
        organizationName: organization.name,
        userName: user.name,
        userEmail: email,
        role,
        timestamp: new Date()
      })

      writeAuditLog(locals.pb, {
        organizationId: organization.id,
        userId: locals.user?.id,
        userName: locals.user?.name ?? '',
        action: 'member_add',
        entityType: 'member',
        entityId: user.id,
        entityName: user.name,
        details: { role, email },
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
        userAgent: request.headers.get('user-agent') || ''
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

  updateMemberRole: async ({ request, locals, params }) => {
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
      const member = await locals.pb
        .collection('organization_members')
        .getOne<PBOrganizationMemberRecord>(memberId)
      await locals.pb.collection('organization_members').update(memberId, { role })

      const organization = await locals.pb
        .collection('organizations')
        .getFirstListItem<PBOrganizationRecord>(`slug="${params.orgSlug}"`)

      writeAuditLog(locals.pb, {
        organizationId: organization.id,
        userId: locals.user?.id,
        userName: locals.user?.name ?? '',
        action: 'member_role_change',
        entityType: 'member',
        entityId: memberId,
        entityName: member.userId,
        details: { newRole: role },
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
        userAgent: request.headers.get('user-agent') || ''
      })

      return { success: true, message: 'Member role updated' }
    } catch (e) {
      console.error('Failed to update member role:', e)
      return fail(500, { error: 'Failed to update member role' })
    }
  },

  removeMember: async ({ request, locals, params }) => {
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
      const member = await locals.pb
        .collection('organization_members')
        .getOne<PBOrganizationMemberRecord>(memberId)
      await locals.pb.collection('organization_members').delete(memberId)

      const organization = await locals.pb
        .collection('organizations')
        .getFirstListItem<PBOrganizationRecord>(`slug="${params.orgSlug}"`)

      writeAuditLog(locals.pb, {
        organizationId: organization.id,
        userId: locals.user?.id,
        userName: locals.user?.name ?? '',
        action: 'member_remove',
        entityType: 'member',
        entityId: memberId,
        entityName: member.userId,
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
        userAgent: request.headers.get('user-agent') || ''
      })

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
      const invitation = await locals.pb
        .collection('organization_invitations')
        .getOne<PBOrganizationInvitationRecord>(invitationId)
      const organization = await locals.pb
        .collection('organizations')
        .getFirstListItem<PBOrganizationRecord>(`slug="${params.orgSlug}"`)

      // Generate new token if not present
      const { generateInvitationToken } = await import('$lib/features/core/domain/invitation')
      let token = invitation.token
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
        email: invitation.email,
        organizationName: organization.name,
        role: invitation.role,
        invitedByName,
        acceptUrl,
        logoUrl,
        primaryColor: organization.primaryColor || undefined
      })

      writeAuditLog(locals.pb, {
        organizationId: organization.id,
        userId: locals.user?.id,
        userName: locals.user?.name ?? '',
        action: 'invitation_send',
        entityType: 'invitation',
        entityId: invitationId,
        entityName: invitation.email,
        details: { resend: true },
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
        userAgent: request.headers.get('user-agent') || ''
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
        .getFirstListItem<PBOrganizationRecord>(`slug="${params.orgSlug}"`)
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
          organizationName: organization.name,
          role: row.role,
          invitedByName,
          acceptUrl,
          logoUrl,
          primaryColor: organization.primaryColor || undefined
        })
        sentCount++
      }

      let message = `${sentCount} invitation(s) sent`
      if (skipCount > 0) message += `, ${skipCount} skipped (already pending)`
      if (errors.length > 0) message += `, ${errors.length} line(s) had errors`

      if (sentCount > 0) {
        writeAuditLog(locals.pb, {
          organizationId: organization.id,
          userId: locals.user?.id,
          userName: locals.user?.name ?? '',
          action: 'invitation_send',
          entityType: 'invitation',
          entityName: 'bulk invite',
          details: { sentCount, skipCount, errorCount: errors.length },
          ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
          userAgent: request.headers.get('user-agent') || ''
        })
      }

      return { success: true, message }
    } catch (e) {
      console.error('Failed to bulk invite:', e)
      return fail(500, { error: 'Failed to process bulk invitations' })
    }
  }
}
