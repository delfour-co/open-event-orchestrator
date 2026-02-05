import { error, fail, redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params, locals }) => {
  const { contactId } = params

  let contact: Record<string, unknown>
  try {
    contact = await locals.pb.collection('contacts').getOne(contactId)
  } catch {
    throw error(404, 'Contact not found')
  }

  // Load edition links with expanded editions
  const editionLinks = await locals.pb.collection('contact_edition_links').getFullList({
    filter: `contactId = "${contactId}"`,
    expand: 'editionId'
  })

  // Load consents
  const consents = await locals.pb.collection('consents').getFullList({
    filter: `contactId = "${contactId}"`,
    sort: 'type'
  })

  return {
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
      id: c.id as string,
      type: c.type as string,
      status: c.status as string,
      grantedAt: c.grantedAt ? new Date(c.grantedAt as string) : undefined,
      withdrawnAt: c.withdrawnAt ? new Date(c.withdrawnAt as string) : undefined
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
    const { contactId } = params

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
    } catch (err) {
      console.error('Failed to delete contact:', err)
      return fail(500, { error: 'Failed to delete contact' })
    }

    throw redirect(303, '/admin/crm')
  },

  grantConsent: async ({ request, locals, params }) => {
    const formData = await request.formData()
    const consentType = formData.get('consentType') as string
    const { contactId } = params

    if (!consentType) {
      return fail(400, { error: 'Consent type is required' })
    }

    try {
      // Check if consent already exists
      const existing = await locals.pb.collection('consents').getList(1, 1, {
        filter: `contactId = "${contactId}" && type = "${consentType}"`
      })

      if (existing.items.length > 0) {
        await locals.pb.collection('consents').update(existing.items[0].id, {
          status: 'granted',
          grantedAt: new Date().toISOString(),
          withdrawnAt: null,
          source: 'manual'
        })
      } else {
        await locals.pb.collection('consents').create({
          contactId,
          type: consentType,
          status: 'granted',
          grantedAt: new Date().toISOString(),
          source: 'manual'
        })
      }

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
      const existing = await locals.pb.collection('consents').getList(1, 1, {
        filter: `contactId = "${contactId}" && type = "${consentType}"`
      })

      if (existing.items.length > 0) {
        await locals.pb.collection('consents').update(existing.items[0].id, {
          status: 'withdrawn',
          withdrawnAt: new Date().toISOString(),
          source: 'manual'
        })
      } else {
        await locals.pb.collection('consents').create({
          contactId,
          type: consentType,
          status: 'withdrawn',
          withdrawnAt: new Date().toISOString(),
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
