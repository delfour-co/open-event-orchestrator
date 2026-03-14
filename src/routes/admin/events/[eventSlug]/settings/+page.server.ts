import { writeAuditLog } from '$lib/server/audit-log-service'
import { canAccessSettings } from '$lib/server/permissions'
import { fail, isRedirect, redirect } from '@sveltejs/kit'
import type { Actions } from './$types'

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

      writeAuditLog(locals.pb, {
        organizationId: event.organizationId as string,
        userId: locals.user?.id,
        userName: locals.user?.name as string,
        action: 'event_update',
        entityType: 'event',
        entityId: event.id,
        entityName: name,
        details: { field: 'general' },
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
        userAgent: request.headers.get('user-agent') || ''
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

  deleteEvent: async ({ request, locals, params }) => {
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

      writeAuditLog(locals.pb, {
        organizationId: event.organizationId as string,
        userId: locals.user?.id,
        userName: locals.user?.name as string,
        action: 'event_delete',
        entityType: 'event',
        entityId: event.id,
        entityName: event.name as string,
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
        userAgent: request.headers.get('user-agent') || ''
      })

      throw redirect(303, '/admin/events')
    } catch (e) {
      if (isRedirect(e)) throw e // Re-throw redirects
      console.error('Failed to delete event:', e)
      return fail(500, { error: 'Failed to delete event' })
    }
  }
}
