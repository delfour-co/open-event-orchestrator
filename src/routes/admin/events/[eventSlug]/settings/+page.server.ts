import { fail, redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals, params }) => {
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
          : 'Unknown Organization'
      },
      editionsCount: editions.length
    }
  } catch {
    throw redirect(303, '/admin/events')
  }
}

export const actions: Actions = {
  updateEvent: async ({ request, locals, params }) => {
    const formData = await request.formData()
    const name = formData.get('name') as string
    const slug = formData.get('slug') as string
    const description = formData.get('description') as string
    const website = formData.get('website') as string
    const defaultVenue = formData.get('defaultVenue') as string
    const defaultCity = formData.get('defaultCity') as string
    const defaultCountry = formData.get('defaultCountry') as string

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
        defaultCountry: defaultCountry || null
      })

      // If slug changed, redirect to new URL
      if (slug !== params.eventSlug) {
        throw redirect(303, `/admin/events/${slug}/settings`)
      }

      return { success: true, message: 'Event updated successfully' }
    } catch (e) {
      if (e instanceof Response) throw e // Re-throw redirects
      console.error('Failed to update event:', e)
      return fail(500, { error: 'Failed to update event' })
    }
  },

  deleteEvent: async ({ locals, params }) => {
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
      if (e instanceof Response) throw e // Re-throw redirects
      console.error('Failed to delete event:', e)
      return fail(500, { error: 'Failed to delete event' })
    }
  }
}
