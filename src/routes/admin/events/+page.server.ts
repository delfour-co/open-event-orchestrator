import { writeAuditLog } from '$lib/server/audit-log-service'
import { canManageEvents } from '$lib/server/permissions'
import { safeFilter } from '$lib/server/safe-filter'
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
        endDate: new Date(ed.endDate as string),
        venue: (ed.venue as string) || '',
        city: (ed.city as string) || '',
        country: (ed.country as string) || ''
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
      const created = await locals.pb.collection('events').create({
        organizationId,
        name,
        slug,
        description
      })

      writeAuditLog(locals.pb, {
        organizationId,
        userId: locals.user?.id,
        userName: locals.user?.name as string,
        action: 'event_create',
        entityType: 'event',
        entityId: created.id,
        entityName: name,
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
        userAgent: request.headers.get('user-agent') || ''
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
      const created = await locals.pb.collection('editions').create({
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

      // Get the event to find the organizationId
      const event = await locals.pb.collection('events').getOne(eventId)

      writeAuditLog(locals.pb, {
        organizationId: event.organizationId as string,
        userId: locals.user?.id,
        userName: locals.user?.name as string,
        action: 'edition_create',
        entityType: 'edition',
        entityId: created.id,
        entityName: name,
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
        userAgent: request.headers.get('user-agent') || ''
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
      await Promise.all(
        editions.map((edition) => locals.pb.collection('editions').delete(edition.id))
      )
      // Get the event before deleting to capture org and name
      const event = await locals.pb.collection('events').getOne(eventId)

      // Then delete the event
      await locals.pb.collection('events').delete(eventId)

      writeAuditLog(locals.pb, {
        organizationId: event.organizationId as string,
        userId: locals.user?.id,
        userName: locals.user?.name as string,
        action: 'event_delete',
        entityType: 'event',
        entityId: eventId,
        entityName: event.name as string,
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
        userAgent: request.headers.get('user-agent') || ''
      })

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
      const edition = await locals.pb.collection('editions').getOne(editionId)
      const event = await locals.pb.collection('events').getOne(edition.eventId as string)

      await locals.pb.collection('editions').delete(editionId)

      writeAuditLog(locals.pb, {
        organizationId: event.organizationId as string,
        userId: locals.user?.id,
        userName: locals.user?.name as string,
        action: 'edition_delete',
        entityType: 'edition',
        entityId: editionId,
        entityName: edition.name as string,
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
        userAgent: request.headers.get('user-agent') || ''
      })

      return { success: true }
    } catch (e) {
      console.error('Failed to delete edition:', e)
      return fail(500, { error: 'Failed to delete edition' })
    }
  },

  duplicateEdition: async ({ request, locals }) => {
    const userRole = locals.user?.role as string | undefined
    if (!canManageEvents(userRole)) {
      return fail(403, { error: 'Permission denied' })
    }

    const formData = await request.formData()
    const sourceEditionId = formData.get('sourceEditionId') as string
    const newName = formData.get('name') as string
    const newSlug = formData.get('slug') as string
    const newYear = Number(formData.get('year'))
    const newStartDate = formData.get('startDate') as string
    const newEndDate = formData.get('endDate') as string

    if (!sourceEditionId || !newName || !newSlug || !newYear || !newStartDate || !newEndDate) {
      return fail(400, { error: 'All fields are required' })
    }

    try {
      const source = await locals.pb.collection('editions').getOne(sourceEditionId)

      // Create new edition
      const newEdition = await locals.pb.collection('editions').create({
        eventId: source.eventId,
        name: newName,
        slug: newSlug,
        year: newYear,
        status: 'draft',
        startDate: newStartDate,
        endDate: newEndDate,
        venue: source.venue || '',
        city: source.city || '',
        country: source.country || ''
      })

      // Copy related entities in parallel
      const [categories, formats, rooms, tracks] = await Promise.all([
        locals.pb
          .collection('categories')
          .getFullList({ filter: safeFilter`editionId = ${sourceEditionId}` }),
        locals.pb
          .collection('formats')
          .getFullList({ filter: safeFilter`editionId = ${sourceEditionId}` }),
        locals.pb
          .collection('rooms')
          .getFullList({ filter: safeFilter`editionId = ${sourceEditionId}` }),
        locals.pb
          .collection('tracks')
          .getFullList({ filter: safeFilter`editionId = ${sourceEditionId}` })
      ])

      await Promise.all([
        ...categories.map((c) =>
          locals.pb.collection('categories').create({
            editionId: newEdition.id,
            name: c.name,
            description: c.description || '',
            color: c.color || ''
          })
        ),
        ...formats.map((f) =>
          locals.pb.collection('formats').create({
            editionId: newEdition.id,
            name: f.name,
            description: f.description || '',
            duration: f.duration || 30
          })
        ),
        ...rooms.map((r) =>
          locals.pb.collection('rooms').create({
            editionId: newEdition.id,
            name: r.name,
            capacity: r.capacity || 0,
            description: r.description || ''
          })
        ),
        ...tracks.map((t) =>
          locals.pb.collection('tracks').create({
            editionId: newEdition.id,
            name: t.name,
            description: t.description || '',
            color: t.color || ''
          })
        )
      ])

      // Copy ticket types
      try {
        const ticketTypes = await locals.pb
          .collection('ticket_types')
          .getFullList({ filter: safeFilter`editionId = ${sourceEditionId}` })
        await Promise.all(
          ticketTypes.map((tt) =>
            locals.pb.collection('ticket_types').create({
              editionId: newEdition.id,
              name: tt.name,
              description: tt.description || '',
              price: tt.price || 0,
              currency: tt.currency || 'EUR',
              maxQuantity: tt.maxQuantity || 100,
              maxPerOrder: tt.maxPerOrder || 10,
              available: false
            })
          )
        )
      } catch {
        /* ticket_types might not exist */
      }

      // Copy sponsor packages
      try {
        const packages = await locals.pb
          .collection('sponsor_packages')
          .getFullList({ filter: safeFilter`editionId = ${sourceEditionId}` })
        await Promise.all(
          packages.map((pkg) =>
            locals.pb.collection('sponsor_packages').create({
              editionId: newEdition.id,
              name: pkg.name,
              description: pkg.description || '',
              price: pkg.price || 0,
              currency: pkg.currency || 'EUR',
              maxSponsors: pkg.maxSponsors || 0,
              benefits: pkg.benefits || '',
              displayOrder: pkg.displayOrder || 0
            })
          )
        )
      } catch {
        /* sponsor_packages might not exist */
      }

      // Audit log
      const event = await locals.pb.collection('events').getOne(source.eventId as string)

      writeAuditLog(locals.pb, {
        organizationId: event.organizationId as string,
        userId: locals.user?.id,
        userName: locals.user?.name as string,
        action: 'edition_create',
        entityType: 'edition',
        entityId: newEdition.id,
        entityName: newName,
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
        userAgent: request.headers.get('user-agent') || ''
      })

      return { success: true, message: `Edition "${newName}" created` }
    } catch (err) {
      console.error('Failed to duplicate edition:', err)
      return fail(500, { error: 'Failed to duplicate edition' })
    }
  }
}
