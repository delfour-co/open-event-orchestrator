import { sortByPackageTier } from '$lib/features/sponsoring/domain'
import {
  createEditionSponsorRepository,
  createPackageRepository,
  createSponsorRepository
} from '$lib/features/sponsoring/infra'
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

  // Get event info for the page
  const event = await locals.pb.collection('events').getOne(edition.eventId as string)

  const sponsorRepo = createSponsorRepository(locals.pb)
  const packageRepo = createPackageRepository(locals.pb)
  const editionSponsorRepo = createEditionSponsorRepository(locals.pb)

  // Get confirmed sponsors with their packages
  const confirmedSponsors = await editionSponsorRepo.findConfirmed(editionId)

  // Get packages for grouping
  const packages = await packageRepo.findActiveByEdition(editionId)

  // Build logo URLs and sort by tier
  const sponsorsWithLogos = sortByPackageTier(confirmedSponsors).map((es) => ({
    ...es,
    sponsor: es.sponsor
      ? {
          ...es.sponsor,
          logoUrl: es.sponsor.logo ? sponsorRepo.getLogoUrl(es.sponsor) : null,
          logoThumbUrl: es.sponsor.logo ? sponsorRepo.getLogoThumbUrl(es.sponsor, '400x400') : null
        }
      : undefined
  }))

  // Group sponsors by package tier
  const sponsorsByTier: {
    package: (typeof packages)[0] | null
    sponsors: typeof sponsorsWithLogos
  }[] = packages
    .map((pkg) => ({
      package: pkg,
      sponsors: sponsorsWithLogos.filter((s) => s.packageId === pkg.id)
    }))
    .filter((group) => group.sponsors.length > 0)

  // Sponsors without a package (at the end)
  const sponsorsWithoutPackage = sponsorsWithLogos.filter((s) => !s.packageId)
  if (sponsorsWithoutPackage.length > 0) {
    sponsorsByTier.push({
      package: null,
      sponsors: sponsorsWithoutPackage
    })
  }

  return {
    edition: {
      id: editionId,
      name: edition.name as string,
      slug: edition.slug as string,
      year: edition.year as number
    },
    event: {
      name: event.name as string
    },
    sponsorsByTier,
    totalSponsors: confirmedSponsors.length
  }
}
