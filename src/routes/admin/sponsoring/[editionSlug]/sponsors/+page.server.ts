import { createSponsorRepository } from '$lib/features/sponsoring/infra'
import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params, locals }) => {
  const { editionSlug } = params

  const editions = await locals.pb.collection('editions').getList(1, 1, {
    filter: `slug = "${editionSlug}"`
  })

  if (editions.items.length === 0) {
    throw error(404, 'Edition not found')
  }

  const edition = editions.items[0]
  const editionId = edition.id as string

  // Get organization for sponsor management
  const event = await locals.pb.collection('events').getOne(edition.eventId as string)
  const organizationId = event.organizationId as string

  const sponsorRepo = createSponsorRepository(locals.pb)
  const sponsors = await sponsorRepo.findByOrganization(organizationId)

  // Build logo URLs
  const sponsorsWithLogos = sponsors.map((s) => ({
    ...s,
    logoUrl: sponsorRepo.getLogoThumbUrl(s, '100x100')
  }))

  return {
    edition: {
      id: editionId,
      name: edition.name as string,
      slug: edition.slug as string,
      startDate: new Date(edition.startDate as string),
      endDate: new Date(edition.endDate as string)
    },
    sponsors: sponsorsWithLogos
  }
}
