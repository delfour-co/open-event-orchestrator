import { createSyncContactsUseCase } from '$lib/features/crm/usecases'
import { error, fail } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

const PER_PAGE = 20

export const load: PageServerLoad = async ({ locals, url }) => {
  const membership = await locals.pb.collection('organization_members').getList(1, 1, {
    filter: `userId = "${locals.user?.id}"`
  })
  if (membership.items.length === 0) throw error(404, 'No organization found')
  const organizationId = membership.items[0].organizationId as string

  const search = url.searchParams.get('search') || ''
  const source = url.searchParams.get('source') || ''
  const page = Math.max(1, Number.parseInt(url.searchParams.get('page') || '1', 10))

  // Build filter
  const filters: string[] = [`organizationId = "${organizationId}"`]
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
    filter: `organizationId = "${organizationId}"`,
    fields: 'id,source'
  })

  let speakers = 0
  let attendees = 0
  let manual = 0
  for (const c of allContacts) {
    if (c.source === 'speaker') speakers++
    else if (c.source === 'attendee') attendees++
    else if (c.source === 'manual') manual++
  }

  return {
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
      manual
    }
  }
}

export const actions: Actions = {
  deleteContact: async ({ request, locals }) => {
    const formData = await request.formData()
    const contactId = formData.get('contactId') as string

    if (!contactId) {
      return fail(400, { error: 'Contact ID is required' })
    }

    try {
      // Delete related consents
      const consents = await locals.pb.collection('consents').getFullList({
        filter: `contactId = "${contactId}"`
      })
      for (const consent of consents) {
        await locals.pb.collection('consents').delete(consent.id)
      }

      // Delete related edition links
      const links = await locals.pb.collection('contact_edition_links').getFullList({
        filter: `contactId = "${contactId}"`
      })
      for (const link of links) {
        await locals.pb.collection('contact_edition_links').delete(link.id)
      }

      await locals.pb.collection('contacts').delete(contactId)
      return { success: true, action: 'deleteContact' }
    } catch (err) {
      console.error('Failed to delete contact:', err)
      return fail(500, { error: 'Failed to delete contact' })
    }
  },

  syncContacts: async ({ locals }) => {
    const membership = await locals.pb.collection('organization_members').getList(1, 1, {
      filter: `userId = "${locals.user?.id}"`
    })
    if (membership.items.length === 0) {
      return fail(404, { error: 'No organization found' })
    }
    const organizationId = membership.items[0].organizationId as string

    try {
      const syncContacts = createSyncContactsUseCase(locals.pb)
      const result = await syncContacts(organizationId)
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
