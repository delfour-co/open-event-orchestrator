import type PocketBase from 'pocketbase'

const ROLE_PRIORITY: Record<string, number> = {
  admin: 3,
  organizer: 2,
  reviewer: 1
}

/**
 * Process pending organization invitations for a user.
 * Called after login or registration to automatically add the user
 * to organizations they've been invited to.
 */
export async function processPendingInvitations(
  pb: PocketBase,
  userId: string,
  userEmail: string
): Promise<number> {
  let acceptedCount = 0
  let highestRole: string | null = null

  try {
    // Find all pending invitations for this email
    const invitations = await pb.collection('organization_invitations').getFullList({
      filter: `email="${userEmail}" && status="pending"`
    })

    const now = new Date()

    for (const invitation of invitations) {
      // Check if invitation has expired
      const expiresAt = invitation.expiresAt ? new Date(invitation.expiresAt as string) : null
      if (expiresAt && expiresAt < now) {
        // Mark as expired
        await pb.collection('organization_invitations').update(invitation.id, {
          status: 'expired'
        })
        continue
      }

      // Check if user is already a member of this organization
      try {
        await pb
          .collection('organization_members')
          .getFirstListItem(`organizationId="${invitation.organizationId}" && userId="${userId}"`)
        // Already a member, mark invitation as accepted
        await pb.collection('organization_invitations').update(invitation.id, {
          status: 'accepted'
        })
        continue
      } catch {
        // Not a member, proceed to add
      }

      const role = invitation.role as string

      // Add user to organization
      await pb.collection('organization_members').create({
        organizationId: invitation.organizationId,
        userId: userId,
        role
      })

      // Track highest role for user profile update
      if (!highestRole || (ROLE_PRIORITY[role] || 0) > (ROLE_PRIORITY[highestRole] || 0)) {
        highestRole = role
      }

      // Mark invitation as accepted
      await pb.collection('organization_invitations').update(invitation.id, {
        status: 'accepted'
      })

      acceptedCount++
    }

    // Update user role to the highest granted role
    if (highestRole) {
      const currentUser = await pb.collection('users').getOne(userId)
      const currentRole = currentUser.role as string | undefined
      if (!currentRole || (ROLE_PRIORITY[highestRole] || 0) > (ROLE_PRIORITY[currentRole] || 0)) {
        await pb.collection('users').update(userId, { role: highestRole })
      }
    }
  } catch (error) {
    // Log error but don't fail the login/registration
    console.error('Error processing pending invitations:', error)
  }

  return acceptedCount
}
