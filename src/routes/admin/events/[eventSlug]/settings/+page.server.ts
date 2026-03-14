import { env } from '$env/dynamic/public'
import { validateImageFile } from '$lib/server/file-validation'
import { canAccessSettings } from '$lib/server/permissions'
import { error, fail, isRedirect, redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals, params }) => {
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

export const actions: Actions = {
  updateEvent: async ({ request, locals, params }) => {
    // Check permission
    const userRole = locals.user?.role as string | undefined
    if (!canAccessSettings(userRole)) {
      return fail(403, { error: 'You do not have permission to modify event settings' })
    }

    const formData = await request.formData()
    const name = formData.get('name') as string
    const slug = formData.get('slug') as string
    const description = formData.get('description') as string
    const website = formData.get('website') as string
    const defaultVenue = formData.get('defaultVenue') as string
    const defaultCity = formData.get('defaultCity') as string
    const defaultCountry = formData.get('defaultCountry') as string
    const primaryColor = formData.get('primaryColor') as string
    const secondaryColor = formData.get('secondaryColor') as string
    const twitter = formData.get('twitter') as string
    const linkedin = formData.get('linkedin') as string
    const hashtag = formData.get('hashtag') as string
    const contactEmail = formData.get('contactEmail') as string
    const codeOfConductUrl = formData.get('codeOfConductUrl') as string
    const privacyPolicyUrl = formData.get('privacyPolicyUrl') as string
    const timezone = formData.get('timezone') as string

    if (!name || !slug) {
      return fail(400, { error: 'Name and slug are required' })
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return fail(400, { error: 'Slug must only contain lowercase letters, numbers, and hyphens' })
    }

    try {
      const event = await locals.pb
        .collection('events')
        .getFirstListItem(`slug="${params.eventSlug}"`)

      // Check if slug is being changed and if new slug already exists
      if (slug !== params.eventSlug) {
        try {
          await locals.pb.collection('events').getFirstListItem(`slug="${slug}"`)
          return fail(400, { error: 'An event with this slug already exists' })
        } catch {
          // Slug is available
        }
      }

      await locals.pb.collection('events').update(event.id, {
        name,
        slug,
        description: description || null,
        website: website || null,
        defaultVenue: defaultVenue || null,
        defaultCity: defaultCity || null,
        defaultCountry: defaultCountry || null,
        primaryColor: primaryColor || null,
        secondaryColor: secondaryColor || null,
        twitter: twitter || null,
        linkedin: linkedin || null,
        hashtag: hashtag || null,
        contactEmail: contactEmail || null,
        codeOfConductUrl: codeOfConductUrl || null,
        privacyPolicyUrl: privacyPolicyUrl || null,
        timezone: timezone || null
      })

      // If slug changed, redirect to new URL
      if (slug !== params.eventSlug) {
        throw redirect(303, `/admin/events/${slug}/settings`)
      }

      return { success: true, message: 'Event updated successfully' }
    } catch (e) {
      if (isRedirect(e)) throw e // Re-throw redirects
      console.error('Failed to update event:', e)
      return fail(500, { error: 'Failed to update event' })
    }
  },

  uploadLogo: async ({ request, locals, params }) => {
    const userRole = locals.user?.role as string | undefined
    if (!canAccessSettings(userRole)) {
      return fail(403, { error: 'You do not have permission to modify event settings' })
    }

    const formData = await request.formData()
    const logo = formData.get('logo') as File

    if (!logo || logo.size === 0) {
      return fail(400, { error: 'Logo file is required' })
    }

    const validation = validateImageFile(logo, { maxSizeMB: 5 })
    if (!validation.valid) {
      return fail(400, { error: validation.error })
    }

    try {
      const event = await locals.pb
        .collection('events')
        .getFirstListItem(`slug="${params.eventSlug}"`)

      const uploadFormData = new FormData()
      uploadFormData.append('logo', logo)

      await locals.pb.collection('events').update(event.id, uploadFormData)

      return { success: true, message: 'Logo uploaded successfully' }
    } catch (e) {
      console.error('Failed to upload logo:', e)
      return fail(500, { error: 'Failed to upload logo' })
    }
  },

  removeLogo: async ({ locals, params }) => {
    const userRole = locals.user?.role as string | undefined
    if (!canAccessSettings(userRole)) {
      return fail(403, { error: 'You do not have permission to modify event settings' })
    }

    try {
      const event = await locals.pb
        .collection('events')
        .getFirstListItem(`slug="${params.eventSlug}"`)

      await locals.pb.collection('events').update(event.id, { logo: null })

      return { success: true, message: 'Logo removed successfully' }
    } catch (e) {
      console.error('Failed to remove logo:', e)
      return fail(500, { error: 'Failed to remove logo' })
    }
  },

  uploadBanner: async ({ request, locals, params }) => {
    const userRole = locals.user?.role as string | undefined
    if (!canAccessSettings(userRole)) {
      return fail(403, { error: 'You do not have permission to modify event settings' })
    }

    const formData = await request.formData()
    const banner = formData.get('banner') as File

    if (!banner || banner.size === 0) {
      return fail(400, { error: 'Banner file is required' })
    }

    const validation = validateImageFile(banner, { maxSizeMB: 5 })
    if (!validation.valid) {
      return fail(400, { error: validation.error })
    }

    try {
      const event = await locals.pb
        .collection('events')
        .getFirstListItem(`slug="${params.eventSlug}"`)

      const uploadFormData = new FormData()
      uploadFormData.append('banner', banner)

      await locals.pb.collection('events').update(event.id, uploadFormData)

      return { success: true, message: 'Banner uploaded successfully' }
    } catch (e) {
      console.error('Failed to upload banner:', e)
      return fail(500, { error: 'Failed to upload banner' })
    }
  },

  removeBanner: async ({ locals, params }) => {
    const userRole = locals.user?.role as string | undefined
    if (!canAccessSettings(userRole)) {
      return fail(403, { error: 'You do not have permission to modify event settings' })
    }

    try {
      const event = await locals.pb
        .collection('events')
        .getFirstListItem(`slug="${params.eventSlug}"`)

      await locals.pb.collection('events').update(event.id, { banner: null })

      return { success: true, message: 'Banner removed successfully' }
    } catch (e) {
      console.error('Failed to remove banner:', e)
      return fail(500, { error: 'Failed to remove banner' })
    }
  },

  deleteEvent: async ({ locals, params }) => {
    // Check permission
    const userRole = locals.user?.role as string | undefined
    if (!canAccessSettings(userRole)) {
      return fail(403, { error: 'You do not have permission to delete events' })
    }

    try {
      const event = await locals.pb
        .collection('events')
        .getFirstListItem(`slug="${params.eventSlug}"`)

      // Check if event has editions
      const editions = await locals.pb.collection('editions').getFullList({
        filter: `eventId="${event.id}"`
      })

      if (editions.length > 0) {
        return fail(400, {
          error: `Cannot delete event with ${editions.length} edition(s). Delete editions first.`
        })
      }

      await locals.pb.collection('events').delete(event.id)
      throw redirect(303, '/admin/events')
    } catch (e) {
      if (isRedirect(e)) throw e // Re-throw redirects
      console.error('Failed to delete event:', e)
      return fail(500, { error: 'Failed to delete event' })
    }
  }
}
