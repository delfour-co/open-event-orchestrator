import { canManageEvents } from '$lib/server/permissions'
import { error, fail } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
  // Check permission - reviewers cannot access events management
  const userRole = locals.user?.role as string | undefined
  if (!canManageEvents(userRole)) {
    throw error(403, 'You do not have permission to manage events')
  }
  // Get all organizations
  const organizations = await locals.pb.collection('organizations').getFullList({
    sort: 'name'
  })

  // Get all events with their editions
  const events = await locals.pb.collection('events').getFullList({
    sort: 'name'
  })

  const editions = await locals.pb.collection('editions').getFullList({
    sort: '-year'
  })

  // Map events with their organization and editions
  const eventsWithDetails = events.map((e) => {
    const org = organizations.find((o) => o.id === e.organizationId)
    const eventEditions = editions.filter((ed) => ed.eventId === e.id)

    return {
      id: e.id as string,
      name: e.name as string,
      slug: e.slug as string,
      description: (e.description as string) || '',
      organizationId: e.organizationId as string,
      organizationName: org ? (org.name as string) : 'Unknown',
      editions: eventEditions.map((ed) => ({
        id: ed.id as string,
        name: ed.name as string,
        slug: ed.slug as string,
        year: ed.year as number,
        status: ed.status as string,
        startDate: new Date(ed.startDate as string),
        endDate: new Date(ed.endDate as string)
      }))
    }
  })

  return {
    events: eventsWithDetails,
    organizations: organizations.map((o) => ({
      id: o.id as string,
      name: o.name as string,
      slug: o.slug as string
    }))
  }
}

export const actions: Actions = {
  createEvent: async ({ request, locals }) => {
    // Check permission
    const userRole = locals.user?.role as string | undefined
    if (!canManageEvents(userRole)) {
      return fail(403, { error: 'You do not have permission to manage events' })
    }

    const data = await request.formData()
    const organizationId = data.get('organizationId') as string
    const name = data.get('name') as string
    const slug = data.get('slug') as string
    const description = data.get('description') as string

    if (!organizationId || !name || !slug) {
      return fail(400, { error: 'Organization, name and slug are required' })
    }

    try {
      await locals.pb.collection('events').create({
        organizationId,
        name,
        slug,
        description
      })
      return { success: true }
    } catch (e) {
      console.error('Failed to create event:', e)
      return fail(500, { error: 'Failed to create event' })
    }
  },

  createEdition: async ({ request, locals }) => {
    // Check permission
    const userRole = locals.user?.role as string | undefined
    if (!canManageEvents(userRole)) {
      return fail(403, { error: 'You do not have permission to manage events' })
    }

    const data = await request.formData()
    const eventId = data.get('eventId') as string
    const name = data.get('name') as string
    const slug = data.get('slug') as string
    const year = Number.parseInt(data.get('year') as string)
    const startDate = data.get('startDate') as string
    const endDate = data.get('endDate') as string
    const venue = data.get('venue') as string
    const city = data.get('city') as string
    const country = data.get('country') as string

    if (!eventId || !name || !slug || !year || !startDate || !endDate) {
      return fail(400, { error: 'Event, name, slug, year and dates are required' })
    }

    try {
      await locals.pb.collection('editions').create({
        eventId,
        name,
        slug,
        year,
        startDate,
        endDate,
        venue: venue || undefined,
        city: city || undefined,
        country: country || undefined,
        status: 'draft'
      })
      return { success: true }
    } catch (e) {
      console.error('Failed to create edition:', e)
      return fail(500, { error: 'Failed to create edition' })
    }
  },

  deleteEvent: async ({ request, locals }) => {
    // Check permission
    const userRole = locals.user?.role as string | undefined
    if (!canManageEvents(userRole)) {
      return fail(403, { error: 'You do not have permission to manage events' })
    }

    const data = await request.formData()
    const eventId = data.get('eventId') as string

    if (!eventId) {
      return fail(400, { error: 'Event ID is required' })
    }

    try {
      // First delete all editions of this event
      const editions = await locals.pb
        .collection('editions')
        .getFullList({ filter: `eventId="${eventId}"` })
      for (const edition of editions) {
        await locals.pb.collection('editions').delete(edition.id)
      }
      // Then delete the event
      await locals.pb.collection('events').delete(eventId)
      return { success: true }
    } catch (e) {
      console.error('Failed to delete event:', e)
      return fail(500, { error: 'Failed to delete event' })
    }
  },

  deleteEdition: async ({ request, locals }) => {
    // Check permission
    const userRole = locals.user?.role as string | undefined
    if (!canManageEvents(userRole)) {
      return fail(403, { error: 'You do not have permission to manage events' })
    }

    const data = await request.formData()
    const editionId = data.get('editionId') as string

    if (!editionId) {
      return fail(400, { error: 'Edition ID is required' })
    }

    try {
      await locals.pb.collection('editions').delete(editionId)
      return { success: true }
    } catch (e) {
      console.error('Failed to delete edition:', e)
      return fail(500, { error: 'Failed to delete edition' })
    }
  }
}
