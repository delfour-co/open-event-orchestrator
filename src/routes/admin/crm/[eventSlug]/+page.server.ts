import {
  createConsentRepository,
  createContactEditionLinkRepository
} from '$lib/features/crm/infra'
import { createSyncContactsUseCase } from '$lib/features/crm/usecases'
import { error, fail } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

const PER_PAGE = 20

export const load: PageServerLoad = async ({ locals, url, params }) => {
  const events = await locals.pb.collection('events').getList(1, 1, {
    filter: `slug = "${params.eventSlug}"`
  })
  if (events.items.length === 0) throw error(404, 'Event not found')
  const event = events.items[0]
  const eventId = event.id as string

  const search = url.searchParams.get('search') || ''
  const source = url.searchParams.get('source') || ''
  const page = Math.max(1, Number.parseInt(url.searchParams.get('page') || '1', 10))

  // Build filter
  const filters: string[] = [`eventId = "${eventId}"`]
  if (search) {
    filters.push(
      `(firstName ~ "${search}" || lastName ~ "${search}" || email ~ "${search}" || company ~ "${search}")`
    )
  }
  if (source) {
    filters.push(`source = "${source}"`)
  }

  const contacts = await locals.pb.collection('contacts').getList(page, PER_PAGE, {
    filter: filters.join(' && '),
    sort: '-created'
  })

  // Load stats
  const allContacts = await locals.pb.collection('contacts').getFullList({
    filter: `eventId = "${eventId}"`,
    fields: 'id,source'
  })

  let speakers = 0
  let attendees = 0
  let sponsors = 0
  let manual = 0
  for (const c of allContacts) {
    if (c.source === 'speaker') speakers++
    else if (c.source === 'attendee') attendees++
    else if (c.source === 'sponsor') sponsors++
    else if (c.source === 'manual') manual++
  }

  return {
    eventSlug: params.eventSlug,
    eventName: event.name as string,
    eventId,
    contacts: contacts.items.map((c) => ({
      id: c.id as string,
      firstName: c.firstName as string,
      lastName: c.lastName as string,
      email: c.email as string,
      company: (c.company as string) || '',
      source: c.source as string,
      tags: (c.tags as string[]) || [],
      createdAt: new Date(c.created as string)
    })),
    totalItems: contacts.totalItems,
    totalPages: contacts.totalPages,
    currentPage: page,
    search,
    source,
    stats: {
      total: allContacts.length,
      speakers,
      attendees,
      sponsors,
      manual
    }
  }
}

export const actions: Actions = {
  createContact: async ({ request, locals, params }) => {
    const formData = await request.formData()
    const firstName = (formData.get('firstName') as string)?.trim()
    const lastName = (formData.get('lastName') as string)?.trim()
    const email = (formData.get('email') as string)?.trim()
    const company = (formData.get('company') as string)?.trim() || ''
    const jobTitle = (formData.get('jobTitle') as string)?.trim() || ''
    const phone = (formData.get('phone') as string)?.trim() || ''
    const source = (formData.get('source') as string) || 'manual'
    const tags = (formData.get('tags') as string)?.trim() || ''
    const notes = (formData.get('notes') as string)?.trim() || ''

    if (!firstName) {
      return fail(400, { error: 'First name is required', action: 'createContact' })
    }
    if (!lastName) {
      return fail(400, { error: 'Last name is required', action: 'createContact' })
    }
    if (!email) {
      return fail(400, { error: 'Email is required', action: 'createContact' })
    }

    const events = await locals.pb.collection('events').getList(1, 1, {
      filter: `slug = "${params.eventSlug}"`
    })
    if (events.items.length === 0) {
      return fail(404, { error: 'Event not found', action: 'createContact' })
    }
    const eventId = events.items[0].id as string

    // Check for duplicate email
    const existing = await locals.pb.collection('contacts').getList(1, 1, {
      filter: `eventId = "${eventId}" && email = "${email}"`
    })
    if (existing.items.length > 0) {
      return fail(400, {
        error: 'A contact with this email already exists for this event',
        action: 'createContact'
      })
    }

    try {
      const parsedTags = tags
        ? tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : []

      await locals.pb.collection('contacts').create({
        eventId,
        firstName,
        lastName,
        email,
        company,
        jobTitle,
        phone,
        source,
        tags: JSON.stringify(parsedTags),
        notes
      })

      return { success: true, action: 'createContact' }
    } catch (err) {
      console.error('Failed to create contact:', err)
      return fail(500, { error: 'Failed to create contact', action: 'createContact' })
    }
  },

  deleteContact: async ({ request, locals }) => {
    const formData = await request.formData()
    const contactId = formData.get('contactId') as string

    if (!contactId) {
      return fail(400, { error: 'Contact ID is required' })
    }

    try {
      const consentRepo = createConsentRepository(locals.pb)
      const linkRepo = createContactEditionLinkRepository(locals.pb)

      // Delete related consents and edition links via repositories
      await consentRepo.deleteByContact(contactId)

      const links = await linkRepo.findByContact(contactId)
      for (const link of links) {
        await linkRepo.delete(link.id)
      }

      await locals.pb.collection('contacts').delete(contactId)
      return { success: true, action: 'deleteContact' }
    } catch (err) {
      console.error('Failed to delete contact:', err)
      return fail(500, { error: 'Failed to delete contact' })
    }
  },

  syncContacts: async ({ locals, params }) => {
    const events = await locals.pb.collection('events').getList(1, 1, {
      filter: `slug = "${params.eventSlug}"`
    })
    if (events.items.length === 0) {
      return fail(404, { error: 'Event not found' })
    }
    const eventId = events.items[0].id as string

    try {
      const syncContacts = createSyncContactsUseCase(locals.pb)
      const result = await syncContacts(eventId)
      return {
        success: true,
        action: 'syncContacts',
        syncResult: {
          created: result.created,
          updated: result.updated,
          linked: result.linked,
          errors: result.errors
        }
      }
    } catch (err) {
      console.error('Failed to sync contacts:', err)
      return fail(500, { error: 'Failed to sync contacts' })
    }
  }
}
