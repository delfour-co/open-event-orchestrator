import { createConsentRepository } from '$lib/features/crm/infra'
import { error } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params, locals }) => {
  const { token } = params

  const contacts = await locals.pb.collection('contacts').getList(1, 1, {
    filter: `unsubscribeToken = "${token}"`
  })

  if (contacts.items.length === 0) {
    throw error(404, 'Invalid or expired unsubscribe link')
  }

  const contact = contacts.items[0]
  const consentRepo = createConsentRepository(locals.pb)
  const consent = await consentRepo.findByContactAndType(contact.id as string, 'marketing_email')

  return {
    contactEmail: contact.email as string,
    contactFirstName: (contact.firstName as string) || '',
    alreadyUnsubscribed: consent?.status === 'withdrawn'
  }
}

export const actions: Actions = {
  default: async ({ params, locals }) => {
    const { token } = params

    const contacts = await locals.pb.collection('contacts').getList(1, 1, {
      filter: `unsubscribeToken = "${token}"`
    })

    if (contacts.items.length === 0) {
      throw error(404, 'Invalid or expired unsubscribe link')
    }

    const contact = contacts.items[0]
    const consentRepo = createConsentRepository(locals.pb)

    // Check if consent exists
    const existing = await consentRepo.findByContactAndType(contact.id as string, 'marketing_email')

    if (existing) {
      await consentRepo.update(existing.id, {
        status: 'withdrawn',
        withdrawnAt: new Date(),
        source: 'form'
      })
    } else {
      await consentRepo.create({
        contactId: contact.id as string,
        type: 'marketing_email',
        status: 'withdrawn',
        withdrawnAt: new Date(),
        source: 'form'
      })
    }

    return { success: true }
  }
}
