import { getAvailableSlots, hasAvailableSlots } from '$lib/features/sponsoring/domain'
import { createPackageRepository } from '$lib/features/sponsoring/infra'
import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

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
  const editionId = editionRecord.id as string

  // Get event info
  let eventName = editionRecord.name as string
  try {
    if (editionRecord.eventId) {
      const event = await locals.pb.collection('events').getOne(editionRecord.eventId as string)
      eventName = event.name as string
    }
  } catch {
    // Use edition name as fallback
  }

  // Get active packages for this edition
  const packageRepo = createPackageRepository(locals.pb)

  const packages = await packageRepo.findActiveByEdition(editionId)

  // Get sponsor counts for each package to determine availability
  const packagesWithAvailability = await Promise.all(
    packages.map(async (pkg) => {
      const currentCount = await packageRepo.countSponsorsByPackage(pkg.id)
      return {
        ...pkg,
        currentCount,
        availableSlots: getAvailableSlots(pkg, currentCount),
        hasAvailableSlots: hasAvailableSlots(pkg, currentCount)
      }
    })
  )

  return {
    edition: {
      id: editionId,
      name: editionRecord.name as string,
      slug: editionRecord.slug as string,
      year: editionRecord.year as number
    },
    eventName,
    packages: packagesWithAvailability
  }
}
