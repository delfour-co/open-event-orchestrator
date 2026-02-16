import { createSponsorInquiryRepository } from '$lib/features/sponsoring/infra'
import { createPackageRepository } from '$lib/features/sponsoring/infra'
import { error, fail } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params, locals }) => {
  const { editionSlug } = params

  // Get edition
  const editions = await locals.pb.collection('editions').getList(1, 1, {
    filter: `slug = "${editionSlug}"`
  })

  if (editions.items.length === 0) {
    throw error(404, 'Edition not found')
  }

  const editionRecord = editions.items[0]
  const edition = {
    id: editionRecord.id as string,
    name: editionRecord.name as string,
    slug: editionRecord.slug as string,
    year: editionRecord.year as number
  }

  // Get event info
  let eventName = edition.name
  if (editionRecord.eventId) {
    try {
      const event = await locals.pb.collection('events').getOne(editionRecord.eventId as string)
      eventName = event.name as string
    } catch {
      // Use edition name as fallback
    }
  }

  // Get active packages
  const packageRepo = createPackageRepository(locals.pb)
  const packages = await packageRepo.findActiveByEdition(edition.id)

  return {
    edition,
    eventName,
    packages: packages.map((pkg) => ({
      id: pkg.id,
      name: pkg.name,
      tier: pkg.tier
    }))
  }
}

export const actions: Actions = {
  submit: async ({ request, locals, params }) => {
    const formData = await request.formData()

    // Honeypot check
    const honeypot = formData.get('website_url') as string
    if (honeypot) {
      // Bot detected, silently accept
      return { success: true }
    }

    const companyName = (formData.get('companyName') as string)?.trim()
    const contactName = (formData.get('contactName') as string)?.trim()
    const contactEmail = (formData.get('contactEmail') as string)?.trim()
    const contactPhone = (formData.get('contactPhone') as string)?.trim()
    const message = (formData.get('message') as string)?.trim()
    const interestedPackageId = (formData.get('interestedPackageId') as string) || undefined

    // Validation
    if (!companyName) {
      return fail(400, {
        error: 'Company name is required',
        values: {
          companyName,
          contactName,
          contactEmail,
          contactPhone,
          message,
          interestedPackageId
        }
      })
    }

    if (!contactName) {
      return fail(400, {
        error: 'Contact name is required',
        values: {
          companyName,
          contactName,
          contactEmail,
          contactPhone,
          message,
          interestedPackageId
        }
      })
    }

    if (!contactEmail) {
      return fail(400, {
        error: 'Email is required',
        values: {
          companyName,
          contactName,
          contactEmail,
          contactPhone,
          message,
          interestedPackageId
        }
      })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(contactEmail)) {
      return fail(400, {
        error: 'Please enter a valid email address',
        values: {
          companyName,
          contactName,
          contactEmail,
          contactPhone,
          message,
          interestedPackageId
        }
      })
    }

    if (!message) {
      return fail(400, {
        error: 'Message is required',
        values: {
          companyName,
          contactName,
          contactEmail,
          contactPhone,
          message,
          interestedPackageId
        }
      })
    }

    // Get edition
    const editions = await locals.pb.collection('editions').getList(1, 1, {
      filter: `slug = "${params.editionSlug}"`
    })

    if (editions.items.length === 0) {
      throw error(404, 'Edition not found')
    }

    const editionId = editions.items[0].id as string

    try {
      const inquiryRepo = createSponsorInquiryRepository(locals.pb)
      await inquiryRepo.create({
        editionId,
        companyName,
        contactName,
        contactEmail,
        contactPhone: contactPhone || undefined,
        message,
        interestedPackageId: interestedPackageId || undefined
      })

      return { success: true }
    } catch (err) {
      console.error('Failed to create sponsor inquiry:', err)
      return fail(500, {
        error: 'Failed to submit inquiry. Please try again.',
        values: {
          companyName,
          contactName,
          contactEmail,
          contactPhone,
          message,
          interestedPackageId
        }
      })
    }
  }
}
