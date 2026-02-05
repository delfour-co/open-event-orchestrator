import {
  createConsentRepository,
  createContactEditionLinkRepository
} from '$lib/features/crm/infra'
import { error, fail, redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params, locals }) => {
  const { contactId, eventSlug } = params

  // Validate event
  const events = await locals.pb.collection('events').getList(1, 1, {
    filter: `slug = "${eventSlug}"`
  })
  if (events.items.length === 0) throw error(404, 'Event not found')

  let contact: Record<string, unknown>
  try {
    contact = await locals.pb.collection('contacts').getOne(contactId)
  } catch {
    throw error(404, 'Contact not found')
  }

  const consentRepo = createConsentRepository(locals.pb)

  // Load edition links (direct PB call for expand support)
  const editionLinks = await locals.pb.collection('contact_edition_links').getFullList({
    filter: `contactId = "${contactId}"`,
    expand: 'editionId'
  })

  const consents = await consentRepo.findByContact(contactId)

  return {
    eventSlug,
    contact: {
      id: contact.id as string,
      firstName: contact.firstName as string,
      lastName: contact.lastName as string,
      email: contact.email as string,
      company: (contact.company as string) || '',
      jobTitle: (contact.jobTitle as string) || '',
      phone: (contact.phone as string) || '',
      address: (contact.address as string) || '',
      bio: (contact.bio as string) || '',
      photoUrl: (contact.photoUrl as string) || '',
      twitter: (contact.twitter as string) || '',
      linkedin: (contact.linkedin as string) || '',
      github: (contact.github as string) || '',
      city: (contact.city as string) || '',
      country: (contact.country as string) || '',
      source: contact.source as string,
      tags: (contact.tags as string[]) || [],
      notes: (contact.notes as string) || '',
      createdAt: new Date(contact.created as string),
      updatedAt: new Date(contact.updated as string)
    },
    editionLinks: editionLinks.map((link) => {
      const edition = link.expand?.editionId as Record<string, unknown> | undefined
      return {
        id: link.id as string,
        editionId: link.editionId as string,
        editionName: edition ? (edition.name as string) : 'Unknown Edition',
        roles: (link.roles as string[]) || []
      }
    }),
    consents: consents.map((c) => ({
      id: c.id,
      type: c.type,
      status: c.status,
      grantedAt: c.grantedAt,
      withdrawnAt: c.withdrawnAt
    }))
  }
}

export const actions: Actions = {
  updateContact: async ({ request, locals, params }) => {
    const formData = await request.formData()
    const { contactId } = params

    const firstName = formData.get('firstName') as string
    const lastName = formData.get('lastName') as string
    const email = formData.get('email') as string

    if (!firstName || !lastName || !email) {
      return fail(400, { error: 'First name, last name, and email are required' })
    }

    try {
      await locals.pb.collection('contacts').update(contactId, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        company: (formData.get('company') as string)?.trim() || '',
        jobTitle: (formData.get('jobTitle') as string)?.trim() || '',
        phone: (formData.get('phone') as string)?.trim() || '',
        address: (formData.get('address') as string)?.trim() || '',
        bio: (formData.get('bio') as string)?.trim() || '',
        twitter: (formData.get('twitter') as string)?.trim() || '',
        linkedin: (formData.get('linkedin') as string)?.trim() || '',
        github: (formData.get('github') as string)?.trim() || '',
        city: (formData.get('city') as string)?.trim() || '',
        country: (formData.get('country') as string)?.trim() || '',
        notes: (formData.get('notes') as string)?.trim() || ''
      })

      return { success: true, action: 'updateContact' }
    } catch (err) {
      console.error('Failed to update contact:', err)
      return fail(500, { error: 'Failed to update contact' })
    }
  },

  deleteContact: async ({ locals, params }) => {
    const { contactId, eventSlug } = params

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
    } catch (err) {
      console.error('Failed to delete contact:', err)
      return fail(500, { error: 'Failed to delete contact' })
    }

    throw redirect(303, `/admin/crm/${eventSlug}`)
  },

  grantConsent: async ({ request, locals, params }) => {
    const formData = await request.formData()
    const consentType = formData.get('consentType') as string
    const { contactId } = params

    if (!consentType) {
      return fail(400, { error: 'Consent type is required' })
    }

    try {
      const consentRepo = createConsentRepository(locals.pb)
      await consentRepo.grantConsent(
        contactId,
        consentType as 'marketing_email' | 'data_sharing' | 'analytics',
        'manual'
      )

      return { success: true, action: 'grantConsent' }
    } catch (err) {
      console.error('Failed to grant consent:', err)
      return fail(500, { error: 'Failed to grant consent' })
    }
  },

  withdrawConsent: async ({ request, locals, params }) => {
    const formData = await request.formData()
    const consentType = formData.get('consentType') as string
    const { contactId } = params

    if (!consentType) {
      return fail(400, { error: 'Consent type is required' })
    }

    try {
      const consentRepo = createConsentRepository(locals.pb)
      const existing = await consentRepo.findByContactAndType(
        contactId,
        consentType as 'marketing_email' | 'data_sharing' | 'analytics'
      )

      if (existing) {
        await consentRepo.withdrawConsent(
          contactId,
          consentType as 'marketing_email' | 'data_sharing' | 'analytics'
        )
      } else {
        await consentRepo.create({
          contactId,
          type: consentType as 'marketing_email' | 'data_sharing' | 'analytics',
          status: 'withdrawn',
          withdrawnAt: new Date(),
          source: 'manual'
        })
      }

      return { success: true, action: 'withdrawConsent' }
    } catch (err) {
      console.error('Failed to withdraw consent:', err)
      return fail(500, { error: 'Failed to withdraw consent' })
    }
  },

  addTag: async ({ request, locals, params }) => {
    const formData = await request.formData()
    const tag = (formData.get('tag') as string)?.trim()
    const { contactId } = params

    if (!tag) {
      return fail(400, { error: 'Tag is required' })
    }

    try {
      const contact = await locals.pb.collection('contacts').getOne(contactId)
      const tags = (contact.tags as string[]) || []

      if (!tags.includes(tag)) {
        tags.push(tag)
        await locals.pb.collection('contacts').update(contactId, {
          tags: JSON.stringify(tags)
        })
      }

      return { success: true, action: 'addTag' }
    } catch (err) {
      console.error('Failed to add tag:', err)
      return fail(500, { error: 'Failed to add tag' })
    }
  },

  removeTag: async ({ request, locals, params }) => {
    const formData = await request.formData()
    const tag = formData.get('tag') as string
    const { contactId } = params

    if (!tag) {
      return fail(400, { error: 'Tag is required' })
    }

    try {
      const contact = await locals.pb.collection('contacts').getOne(contactId)
      const tags = ((contact.tags as string[]) || []).filter((t) => t !== tag)

      await locals.pb.collection('contacts').update(contactId, {
        tags: JSON.stringify(tags)
      })

      return { success: true, action: 'removeTag' }
    } catch (err) {
      console.error('Failed to remove tag:', err)
      return fail(500, { error: 'Failed to remove tag' })
    }
  }
}
