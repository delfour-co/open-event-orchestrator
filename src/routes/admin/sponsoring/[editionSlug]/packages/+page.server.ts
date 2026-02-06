import { type Benefit, DEFAULT_BENEFITS } from '$lib/features/sponsoring/domain'
import { createPackageRepository } from '$lib/features/sponsoring/infra'
import { error, fail } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

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

  const packageRepo = createPackageRepository(locals.pb)
  const packages = await packageRepo.findByEdition(editionId)

  // Get sponsor counts per package
  const packageStats = await Promise.all(
    packages.map(async (pkg) => ({
      id: pkg.id,
      sponsorCount: await packageRepo.countSponsorsByPackage(pkg.id)
    }))
  )

  const packagesWithStats = packages.map((pkg) => ({
    ...pkg,
    sponsorCount: packageStats.find((s) => s.id === pkg.id)?.sponsorCount ?? 0
  }))

  return {
    edition: {
      id: editionId,
      name: edition.name as string,
      slug: edition.slug as string,
      startDate: new Date(edition.startDate as string),
      endDate: new Date(edition.endDate as string)
    },
    packages: packagesWithStats,
    defaultBenefits: DEFAULT_BENEFITS
  }
}

export const actions: Actions = {
  createPackage: async ({ request, locals }) => {
    const formData = await request.formData()
    const editionId = formData.get('editionId') as string
    const name = formData.get('name') as string
    const tier = formData.get('tier') as string
    const price = formData.get('price') as string
    const currency = formData.get('currency') as string
    const maxSponsors = formData.get('maxSponsors') as string
    const description = formData.get('description') as string
    const benefitsJson = formData.get('benefits') as string

    if (!editionId) {
      return fail(400, { error: 'Edition ID is required', action: 'createPackage' })
    }
    if (!name || name.trim().length === 0) {
      return fail(400, { error: 'Name is required', action: 'createPackage' })
    }
    if (!tier || Number.isNaN(Number(tier)) || Number(tier) < 1) {
      return fail(400, { error: 'Valid tier number is required', action: 'createPackage' })
    }

    let benefits: Benefit[] = []
    if (benefitsJson) {
      try {
        benefits = JSON.parse(benefitsJson)
      } catch {
        benefits = []
      }
    }

    try {
      const packageRepo = createPackageRepository(locals.pb)
      await packageRepo.create({
        editionId,
        name: name.trim(),
        tier: Number(tier),
        price: Number(price) || 0,
        currency: (currency as 'EUR' | 'USD' | 'GBP') || 'EUR',
        maxSponsors: maxSponsors ? Number(maxSponsors) : undefined,
        benefits,
        description: description?.trim() || undefined,
        isActive: true
      })

      return { success: true, action: 'createPackage' }
    } catch (err) {
      console.error('Failed to create package:', err)
      return fail(500, { error: 'Failed to create package', action: 'createPackage' })
    }
  },

  updatePackage: async ({ request, locals }) => {
    const formData = await request.formData()
    const id = formData.get('id') as string
    const name = formData.get('name') as string
    const tier = formData.get('tier') as string
    const price = formData.get('price') as string
    const currency = formData.get('currency') as string
    const maxSponsors = formData.get('maxSponsors') as string
    const description = formData.get('description') as string
    const benefitsJson = formData.get('benefits') as string
    const isActive = formData.get('isActive') as string

    if (!id) {
      return fail(400, { error: 'Package ID is required', action: 'updatePackage' })
    }
    if (!name || name.trim().length === 0) {
      return fail(400, { error: 'Name is required', action: 'updatePackage' })
    }

    let benefits: Benefit[] | undefined
    if (benefitsJson) {
      try {
        benefits = JSON.parse(benefitsJson)
      } catch {
        benefits = undefined
      }
    }

    try {
      const packageRepo = createPackageRepository(locals.pb)
      await packageRepo.update(id, {
        name: name.trim(),
        tier: Number(tier),
        price: Number(price) || 0,
        currency: (currency as 'EUR' | 'USD' | 'GBP') || 'EUR',
        maxSponsors: maxSponsors ? Number(maxSponsors) : undefined,
        benefits,
        description: description?.trim() || undefined,
        isActive: isActive === 'true'
      })

      return { success: true, action: 'updatePackage' }
    } catch (err) {
      console.error('Failed to update package:', err)
      return fail(500, { error: 'Failed to update package', action: 'updatePackage' })
    }
  },

  deletePackage: async ({ request, locals }) => {
    const formData = await request.formData()
    const id = formData.get('id') as string

    if (!id) {
      return fail(400, { error: 'Package ID is required', action: 'deletePackage' })
    }

    try {
      const packageRepo = createPackageRepository(locals.pb)

      // Check if package has sponsors
      const sponsorCount = await packageRepo.countSponsorsByPackage(id)
      if (sponsorCount > 0) {
        return fail(400, {
          error: 'Cannot delete a package that has sponsors assigned. Reassign sponsors first.',
          action: 'deletePackage'
        })
      }

      await packageRepo.delete(id)

      return { success: true, action: 'deletePackage' }
    } catch (err) {
      console.error('Failed to delete package:', err)
      return fail(500, { error: 'Failed to delete package', action: 'deletePackage' })
    }
  },

  toggleActive: async ({ request, locals }) => {
    const formData = await request.formData()
    const id = formData.get('id') as string
    const isActive = formData.get('isActive') as string

    if (!id) {
      return fail(400, { error: 'Package ID is required', action: 'toggleActive' })
    }

    try {
      const packageRepo = createPackageRepository(locals.pb)
      await packageRepo.update(id, { isActive: isActive === 'true' })

      return { success: true, action: 'toggleActive' }
    } catch (err) {
      console.error('Failed to toggle package status:', err)
      return fail(500, { error: 'Failed to update package', action: 'toggleActive' })
    }
  }
}
