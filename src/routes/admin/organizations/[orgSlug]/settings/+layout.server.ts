import { buildFileUrl } from '$lib/server/file-url'
import type {
  PBOrganizationInvitationRecord,
  PBOrganizationMemberRecord,
  PBOrganizationRecord
} from '$lib/server/pb-types'
import { canAccessSettings } from '$lib/server/permissions'
import { error, redirect } from '@sveltejs/kit'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ locals, params }) => {
  // Check permission - reviewers cannot access organization settings
  const userRole = locals.user?.role as string | undefined
  if (!canAccessSettings(userRole)) {
    throw error(403, 'You do not have permission to access organization settings')
  }
  try {
    const organization = await locals.pb
      .collection('organizations')
      .getFirstListItem<PBOrganizationRecord>(`slug="${params.orgSlug}"`, {
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
      const memberRecords = await locals.pb
        .collection('organization_members')
        .getFullList<PBOrganizationMemberRecord>({
          filter: `organizationId="${organization.id}"`,
          expand: 'userId'
        })

      members = memberRecords.map((m) => ({
        id: m.id,
        userId: m.userId,
        name: m.expand?.userId ? m.expand.userId.name : 'Unknown',
        email: m.expand?.userId ? m.expand.userId.email : '',
        role: m.role
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
      const invitationRecords = await locals.pb
        .collection('organization_invitations')
        .getFullList<PBOrganizationInvitationRecord>({
          filter: `organizationId="${organization.id}" && status="pending"`
        })

      invitations = invitationRecords.map((inv) => ({
        id: inv.id,
        email: inv.email,
        role: inv.role,
        createdAt: inv.created
      }))
    } catch {
      // Collection might not exist yet
    }

    // Count events for this organization
    const events = await locals.pb.collection('events').getFullList({
      filter: `organizationId="${organization.id}"`
    })

    let logoUrl: string | null = null
    if (organization.logo) {
      logoUrl = buildFileUrl('organizations', organization.id, organization.logo)
    }

    return {
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        description: organization.description || '',
        website: organization.website || '',
        contactEmail: organization.contactEmail || '',
        vatRate: organization.vatRate ?? 20,
        legalName: organization.legalName || '',
        legalForm: organization.legalForm || '',
        rcsNumber: organization.rcsNumber || '',
        shareCapital: organization.shareCapital || '',
        siret: organization.siret || '',
        vatNumber: organization.vatNumber || '',
        address: organization.address || '',
        city: organization.city || '',
        postalCode: organization.postalCode || '',
        country: organization.country || '',
        primaryColor: organization.primaryColor || '',
        secondaryColor: organization.secondaryColor || '',
        twitter: organization.twitter || '',
        linkedin: organization.linkedin || '',
        github: organization.github || '',
        youtube: organization.youtube || '',
        timezone: organization.timezone || '',
        defaultLocale: organization.defaultLocale || '',
        logo: organization.logo || '',
        ownerId: organization.ownerId || null,
        ownerName: organization.expand?.ownerId ? organization.expand.ownerId.name : null
      },
      logoUrl,
      members,
      invitations,
      eventsCount: events.length
    }
  } catch {
    throw redirect(303, '/admin/organizations')
  }
}
