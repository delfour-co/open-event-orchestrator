import {
  createEditionSponsorRepository,
  createPackageRepository,
  createSponsorInquiryRepository,
  createSponsorRepository
} from '$lib/features/sponsoring/infra'
import { error, fail, redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params, locals }) => {
  const { editionSlug, id } = params

  const editions = await locals.pb.collection('editions').getList(1, 1, {
    filter: `slug = "${editionSlug}"`
  })

  if (editions.items.length === 0) {
    throw error(404, 'Edition not found')
  }

  const edition = editions.items[0]
  const editionId = edition.id as string

  const inquiryRepo = createSponsorInquiryRepository(locals.pb)
  const packageRepo = createPackageRepository(locals.pb)

  const [inquiry, packages] = await Promise.all([
    inquiryRepo.findById(id),
    packageRepo.findByEdition(editionId)
  ])

  if (!inquiry) {
    throw error(404, 'Inquiry not found')
  }

  // Verify inquiry belongs to this edition
  if (inquiry.editionId !== editionId) {
    throw error(404, 'Inquiry not found')
  }

  // Get interested package details if available
  const interestedPackage = inquiry.interestedPackageId
    ? packages.find((p) => p.id === inquiry.interestedPackageId)
    : undefined

  return {
    edition: {
      id: editionId,
      name: edition.name as string,
      slug: edition.slug as string,
      startDate: new Date(edition.startDate as string),
      endDate: new Date(edition.endDate as string)
    },
    inquiry,
    interestedPackage,
    packages
  }
}

export const actions: Actions = {
  markContacted: async ({ request, locals }) => {
    const formData = await request.formData()
    const id = formData.get('id') as string

    if (!id) {
      return fail(400, { error: 'Inquiry ID is required', action: 'markContacted' })
    }

    try {
      const inquiryRepo = createSponsorInquiryRepository(locals.pb)
      await inquiryRepo.updateStatus(id, 'contacted')

      return { success: true, action: 'markContacted' }
    } catch (err) {
      console.error('Failed to mark as contacted:', err)
      return fail(500, { error: 'Failed to update status', action: 'markContacted' })
    }
  },

  convert: async ({ request, locals, params }) => {
    const formData = await request.formData()
    const id = formData.get('id') as string

    if (!id) {
      return fail(400, { error: 'Inquiry ID is required', action: 'convert' })
    }

    try {
      const inquiryRepo = createSponsorInquiryRepository(locals.pb)
      const sponsorRepo = createSponsorRepository(locals.pb)
      const editionSponsorRepo = createEditionSponsorRepository(locals.pb)

      // Get the inquiry
      const inquiry = await inquiryRepo.findById(id)
      if (!inquiry) {
        return fail(404, { error: 'Inquiry not found', action: 'convert' })
      }

      // Get organization ID from edition
      const editions = await locals.pb.collection('editions').getList(1, 1, {
        filter: `slug = "${params.editionSlug}"`
      })
      if (editions.items.length === 0) {
        return fail(404, { error: 'Edition not found', action: 'convert' })
      }
      const edition = editions.items[0]
      const event = await locals.pb.collection('events').getOne(edition.eventId as string)
      const organizationId = event.organizationId as string

      // Create Sponsor
      const sponsor = await sponsorRepo.create({
        organizationId,
        name: inquiry.companyName,
        contactName: inquiry.contactName,
        contactEmail: inquiry.contactEmail,
        contactPhone: inquiry.contactPhone
      })

      // Create EditionSponsor with status "prospect"
      await editionSponsorRepo.create({
        editionId: inquiry.editionId,
        sponsorId: sponsor.id,
        packageId: inquiry.interestedPackageId,
        status: 'prospect'
      })

      // Update inquiry status to "converted"
      await inquiryRepo.updateStatus(id, 'converted')

      // Redirect to the dashboard to see the new sponsor in pipeline
      throw redirect(303, `/admin/sponsoring/${params.editionSlug}`)
    } catch (err) {
      if (err instanceof Response) {
        throw err
      }
      console.error('Failed to convert inquiry:', err)
      return fail(500, { error: 'Failed to convert inquiry', action: 'convert' })
    }
  },

  reject: async ({ request, locals }) => {
    const formData = await request.formData()
    const id = formData.get('id') as string

    if (!id) {
      return fail(400, { error: 'Inquiry ID is required', action: 'reject' })
    }

    try {
      const inquiryRepo = createSponsorInquiryRepository(locals.pb)
      await inquiryRepo.updateStatus(id, 'rejected')

      return { success: true, action: 'reject' }
    } catch (err) {
      console.error('Failed to reject inquiry:', err)
      return fail(500, { error: 'Failed to update status', action: 'reject' })
    }
  },

  delete: async ({ request, locals, params }) => {
    const formData = await request.formData()
    const id = formData.get('id') as string

    if (!id) {
      return fail(400, { error: 'Inquiry ID is required', action: 'delete' })
    }

    try {
      const inquiryRepo = createSponsorInquiryRepository(locals.pb)
      await inquiryRepo.delete(id)

      // Redirect back to list
      throw redirect(303, `/admin/sponsoring/${params.editionSlug}/inquiries`)
    } catch (err) {
      if (err instanceof Response) {
        throw err
      }
      console.error('Failed to delete inquiry:', err)
      return fail(500, { error: 'Failed to delete inquiry', action: 'delete' })
    }
  }
}
