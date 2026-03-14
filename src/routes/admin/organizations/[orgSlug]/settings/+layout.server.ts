import { env } from '$env/dynamic/public'
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

    const pbUrl = env.PUBLIC_POCKETBASE_URL || 'http://localhost:8090'
    let logoUrl: string | null = null
    if (organization.logo) {
      logoUrl = `${pbUrl}/api/files/organizations/${organization.id}/${organization.logo}`
    }

    return {
      organization: {
        id: organization.id as string,
        name: organization.name as string,
        slug: organization.slug as string,
        description: (organization.description as string) || '',
        website: (organization.website as string) || '',
        contactEmail: (organization.contactEmail as string) || '',
        vatRate: (organization.vatRate as number) ?? 20,
        legalName: (organization.legalName as string) || '',
        legalForm: (organization.legalForm as string) || '',
        rcsNumber: (organization.rcsNumber as string) || '',
        shareCapital: (organization.shareCapital as string) || '',
        siret: (organization.siret as string) || '',
        vatNumber: (organization.vatNumber as string) || '',
        address: (organization.address as string) || '',
        city: (organization.city as string) || '',
        postalCode: (organization.postalCode as string) || '',
        country: (organization.country as string) || '',
        primaryColor: (organization.primaryColor as string) || '',
        secondaryColor: (organization.secondaryColor as string) || '',
        twitter: (organization.twitter as string) || '',
        linkedin: (organization.linkedin as string) || '',
        github: (organization.github as string) || '',
        youtube: (organization.youtube as string) || '',
        timezone: (organization.timezone as string) || '',
        defaultLocale: (organization.defaultLocale as string) || '',
        logo: (organization.logo as string) || '',
        ownerId: (organization.ownerId as string) || null,
        ownerName: organization.expand?.ownerId
          ? ((organization.expand.ownerId as Record<string, unknown>).name as string)
          : null
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
