import { buildFileUrl } from '$lib/server/file-url'
import type { PBEventRecord } from '$lib/server/pb-types'
import { canAccessSettings } from '$lib/server/permissions'
import { error, redirect } from '@sveltejs/kit'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ locals, params }) => {
  // Check permission - reviewers cannot access event settings
  const userRole = locals.user?.role as string | undefined
  if (!canAccessSettings(userRole)) {
    throw error(403, 'You do not have permission to access event settings')
  }
  try {
    const event = await locals.pb
      .collection('events')
      .getFirstListItem<PBEventRecord>(`slug="${params.eventSlug}"`, {
        expand: 'organizationId'
      })

    // Count editions for this event
    const editions = await locals.pb.collection('editions').getFullList({
      filter: `eventId="${event.id}"`
    })

    let logoUrl: string | null = null
    let bannerUrl: string | null = null
    if (event.logo) {
      logoUrl = buildFileUrl('events', event.id, event.logo)
    }
    if (event.banner) {
      bannerUrl = buildFileUrl('events', event.id, event.banner)
    }

    return {
      event: {
        id: event.id,
        name: event.name,
        slug: event.slug,
        description: event.description || '',
        website: event.website || '',
        defaultVenue: event.defaultVenue || '',
        defaultCity: event.defaultCity || '',
        defaultCountry: event.defaultCountry || '',
        organizationId: event.organizationId,
        organizationName: event.expand?.organizationId
          ? event.expand.organizationId.name
          : 'Unknown Organization',
        primaryColor: event.primaryColor || '',
        secondaryColor: event.secondaryColor || '',
        twitter: event.twitter || '',
        linkedin: event.linkedin || '',
        hashtag: event.hashtag || '',
        contactEmail: event.contactEmail || '',
        codeOfConductUrl: event.codeOfConductUrl || '',
        privacyPolicyUrl: event.privacyPolicyUrl || '',
        timezone: event.timezone || '',
        logo: event.logo || '',
        banner: event.banner || '',
        logoUrl,
        bannerUrl
      },
      editionsCount: editions.length
    }
  } catch {
    throw redirect(303, '/admin/events')
  }
}
