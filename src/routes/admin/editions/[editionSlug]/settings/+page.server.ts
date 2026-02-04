import { canAccessSettings } from '$lib/server/permissions'
import { error, fail, redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals, params }) => {
  // Check permission - reviewers cannot access edition settings
  const userRole = locals.user?.role as string | undefined
  if (!canAccessSettings(userRole)) {
    throw error(403, 'You do not have permission to access edition settings')
  }
  try {
    const edition = await locals.pb
      .collection('editions')
      .getFirstListItem(`slug="${params.editionSlug}"`, {
        expand: 'eventId'
      })

    return {
      edition: {
        id: edition.id as string,
        name: edition.name as string,
        slug: edition.slug as string,
        year: edition.year as number,
        startDate: new Date(edition.startDate as string),
        endDate: new Date(edition.endDate as string),
        venue: (edition.venue as string) || '',
        city: (edition.city as string) || '',
        country: (edition.country as string) || '',
        status: edition.status as string,
        eventId: edition.eventId as string,
        eventName: edition.expand?.eventId
          ? ((edition.expand.eventId as Record<string, unknown>).name as string)
          : 'Unknown Event'
      }
    }
  } catch {
    throw redirect(303, '/admin/events')
  }
}

export const actions: Actions = {
  updateEdition: async ({ request, locals, params }) => {
    const formData = await request.formData()
    const name = formData.get('name') as string
    const startDate = formData.get('startDate') as string
    const endDate = formData.get('endDate') as string
    const venue = formData.get('venue') as string
    const city = formData.get('city') as string
    const country = formData.get('country') as string

    if (!name || !startDate || !endDate) {
      return fail(400, { error: 'Name and dates are required' })
    }

    // Validate dates
    if (new Date(endDate) <= new Date(startDate)) {
      return fail(400, { error: 'End date must be after start date' })
    }

    try {
      const edition = await locals.pb
        .collection('editions')
        .getFirstListItem(`slug="${params.editionSlug}"`)

      await locals.pb.collection('editions').update(edition.id, {
        name,
        startDate,
        endDate,
        venue: venue || null,
        city: city || null,
        country: country || null
      })
      return { success: true, message: 'Edition details updated' }
    } catch (e) {
      console.error('Failed to update edition:', e)
      return fail(500, { error: 'Failed to update edition' })
    }
  },

  updateStatus: async ({ request, locals, params }) => {
    const formData = await request.formData()
    const status = formData.get('status') as string

    if (!status || !['draft', 'published', 'archived'].includes(status)) {
      return fail(400, { error: 'Invalid status' })
    }

    try {
      const edition = await locals.pb
        .collection('editions')
        .getFirstListItem(`slug="${params.editionSlug}"`)

      await locals.pb.collection('editions').update(edition.id, { status })
      return { success: true, message: `Status updated to ${status}` }
    } catch (e) {
      console.error('Failed to update status:', e)
      return fail(500, { error: 'Failed to update status' })
    }
  }
}
