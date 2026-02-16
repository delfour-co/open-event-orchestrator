import type { SponsorInquiryStatus } from '$lib/features/sponsoring/domain'
import {
  createEditionSponsorRepository,
  createPackageRepository,
  createSponsorInquiryRepository,
  createSponsorRepository
} from '$lib/features/sponsoring/infra'
import { error, fail } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params, locals, url }) => {
  const { editionSlug } = params
  const statusFilter = url.searchParams.get('status') as SponsorInquiryStatus | null

  const editions = await locals.pb.collection('editions').getList(1, 1, {
    filter: `slug = "${editionSlug}"`
  })

  if (editions.items.length === 0) {
    throw error(404, 'Edition not found')
  }

  const edition = editions.items[0]
  const editionId = edition.id as string

  // Get organization for sponsor creation during conversion
  const event = await locals.pb.collection('events').getOne(edition.eventId as string)
  const organizationId = event.organizationId as string

  const inquiryRepo = createSponsorInquiryRepository(locals.pb)
  const packageRepo = createPackageRepository(locals.pb)

  const [allInquiries, packages] = await Promise.all([
    inquiryRepo.findByEdition(editionId),
    packageRepo.findActiveByEdition(editionId)
  ])

  // Apply status filter if provided
  const inquiries = statusFilter
    ? allInquiries.filter((i) => i.status === statusFilter)
    : allInquiries

  // Count by status for filter badges
  const statusCounts = {
    all: allInquiries.length,
    pending: allInquiries.filter((i) => i.status === 'pending').length,
    contacted: allInquiries.filter((i) => i.status === 'contacted').length,
    converted: allInquiries.filter((i) => i.status === 'converted').length,
    rejected: allInquiries.filter((i) => i.status === 'rejected').length
  }

  // Build package map for interested package display
  const packageMap = new Map(packages.map((p) => [p.id, p]))

  // Enrich inquiries with package name if available
  const inquiriesWithPackage = inquiries.map((inquiry) => ({
    ...inquiry,
    interestedPackageName: inquiry.interestedPackageId
      ? packageMap.get(inquiry.interestedPackageId)?.name
      : undefined
  }))

  return {
    edition: {
      id: editionId,
      name: edition.name as string,
      slug: edition.slug as string,
      startDate: new Date(edition.startDate as string),
      endDate: new Date(edition.endDate as string)
    },
    organizationId,
    inquiries: inquiriesWithPackage,
    packages,
    statusCounts,
    currentFilter: statusFilter
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

      return { success: true, action: 'convert', sponsorId: sponsor.id }
    } catch (err) {
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

  delete: async ({ request, locals }) => {
    const formData = await request.formData()
    const id = formData.get('id') as string

    if (!id) {
      return fail(400, { error: 'Inquiry ID is required', action: 'delete' })
    }

    try {
      const inquiryRepo = createSponsorInquiryRepository(locals.pb)
      await inquiryRepo.delete(id)

      return { success: true, action: 'delete' }
    } catch (err) {
      console.error('Failed to delete inquiry:', err)
      return fail(500, { error: 'Failed to delete inquiry', action: 'delete' })
    }
  }
}
