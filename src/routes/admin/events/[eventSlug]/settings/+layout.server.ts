import { env } from '$env/dynamic/public'
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
      .getFirstListItem(`slug="${params.eventSlug}"`, {
        expand: 'organizationId'
      })

    // Count editions for this event
    const editions = await locals.pb.collection('editions').getFullList({
      filter: `eventId="${event.id}"`
    })

    const pbUrl = env.PUBLIC_POCKETBASE_URL || 'http://localhost:8090'
    let logoUrl: string | null = null
    let bannerUrl: string | null = null
    if (event.logo) {
      logoUrl = `${pbUrl}/api/files/events/${event.id}/${event.logo}`
    }
    if (event.banner) {
      bannerUrl = `${pbUrl}/api/files/events/${event.id}/${event.banner}`
    }

    return {
      event: {
        id: event.id as string,
        name: event.name as string,
        slug: event.slug as string,
        description: (event.description as string) || '',
        website: (event.website as string) || '',
        defaultVenue: (event.defaultVenue as string) || '',
        defaultCity: (event.defaultCity as string) || '',
        defaultCountry: (event.defaultCountry as string) || '',
        organizationId: event.organizationId as string,
        organizationName: event.expand?.organizationId
          ? ((event.expand.organizationId as Record<string, unknown>).name as string)
          : 'Unknown Organization',
        primaryColor: (event.primaryColor as string) || '',
        secondaryColor: (event.secondaryColor as string) || '',
        twitter: (event.twitter as string) || '',
        linkedin: (event.linkedin as string) || '',
        hashtag: (event.hashtag as string) || '',
        contactEmail: (event.contactEmail as string) || '',
        codeOfConductUrl: (event.codeOfConductUrl as string) || '',
        privacyPolicyUrl: (event.privacyPolicyUrl as string) || '',
        timezone: (event.timezone as string) || '',
        logo: (event.logo as string) || '',
        banner: (event.banner as string) || '',
        logoUrl,
        bannerUrl
      },
      editionsCount: editions.length
    }
  } catch {
    throw redirect(303, '/admin/events')
  }
}
