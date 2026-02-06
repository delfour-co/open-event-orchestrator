import { env } from '$env/dynamic/public'
import type { SponsorStatus } from '$lib/features/sponsoring/domain'
import {
  createEditionSponsorRepository,
  createPackageRepository,
  createSponsorRepository
} from '$lib/features/sponsoring/infra'
import { createSponsorTokenService } from '$lib/features/sponsoring/services'
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

  // Get organization for sponsor management
  const event = await locals.pb.collection('events').getOne(edition.eventId as string)
  const organizationId = event.organizationId as string

  const sponsorRepo = createSponsorRepository(locals.pb)
  const packageRepo = createPackageRepository(locals.pb)
  const editionSponsorRepo = createEditionSponsorRepository(locals.pb)

  const [sponsors, packages, editionSponsors, stats] = await Promise.all([
    sponsorRepo.findByOrganization(organizationId),
    packageRepo.findByEdition(editionId),
    editionSponsorRepo.findByEditionWithExpand(editionId),
    editionSponsorRepo.getStats(editionId)
  ])

  // Build logo URLs for sponsors
  const sponsorsWithLogos = sponsors.map((s) => ({
    ...s,
    logoUrl: sponsorRepo.getLogoThumbUrl(s, '100x100')
  }))

  // Build logo URLs for edition sponsors
  const editionSponsorsWithLogos = editionSponsors.map((es) => ({
    ...es,
    sponsor: es.sponsor
      ? {
          ...es.sponsor,
          logoUrl: es.sponsor.logo ? sponsorRepo.getLogoThumbUrl(es.sponsor, '100x100') : null
        }
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
    sponsors: sponsorsWithLogos,
    packages,
    editionSponsors: editionSponsorsWithLogos,
    stats
  }
}

export const actions: Actions = {
  createSponsor: async ({ request, locals }) => {
    const formData = await request.formData()
    const organizationId = formData.get('organizationId') as string
    const name = formData.get('name') as string
    const website = formData.get('website') as string
    const contactName = formData.get('contactName') as string
    const contactEmail = formData.get('contactEmail') as string
    const contactPhone = formData.get('contactPhone') as string
    const description = formData.get('description') as string
    const notes = formData.get('notes') as string

    if (!organizationId) {
      return fail(400, { error: 'Organization ID is required', action: 'createSponsor' })
    }
    if (!name || name.trim().length === 0) {
      return fail(400, { error: 'Name is required', action: 'createSponsor' })
    }

    try {
      const sponsorRepo = createSponsorRepository(locals.pb)
      await sponsorRepo.create({
        organizationId,
        name: name.trim(),
        website: website?.trim() || undefined,
        contactName: contactName?.trim() || undefined,
        contactEmail: contactEmail?.trim() || undefined,
        contactPhone: contactPhone?.trim() || undefined,
        description: description?.trim() || undefined,
        notes: notes?.trim() || undefined
      })

      return { success: true, action: 'createSponsor' }
    } catch (err) {
      console.error('Failed to create sponsor:', err)
      return fail(500, { error: 'Failed to create sponsor', action: 'createSponsor' })
    }
  },

  updateSponsor: async ({ request, locals }) => {
    const formData = await request.formData()
    const id = formData.get('id') as string
    const name = formData.get('name') as string
    const website = formData.get('website') as string
    const contactName = formData.get('contactName') as string
    const contactEmail = formData.get('contactEmail') as string
    const contactPhone = formData.get('contactPhone') as string
    const description = formData.get('description') as string
    const notes = formData.get('notes') as string

    if (!id) {
      return fail(400, { error: 'Sponsor ID is required', action: 'updateSponsor' })
    }
    if (!name || name.trim().length === 0) {
      return fail(400, { error: 'Name is required', action: 'updateSponsor' })
    }

    try {
      const sponsorRepo = createSponsorRepository(locals.pb)
      await sponsorRepo.update(id, {
        name: name.trim(),
        website: website?.trim() || undefined,
        contactName: contactName?.trim() || undefined,
        contactEmail: contactEmail?.trim() || undefined,
        contactPhone: contactPhone?.trim() || undefined,
        description: description?.trim() || undefined,
        notes: notes?.trim() || undefined
      })

      return { success: true, action: 'updateSponsor' }
    } catch (err) {
      console.error('Failed to update sponsor:', err)
      return fail(500, { error: 'Failed to update sponsor', action: 'updateSponsor' })
    }
  },

  deleteSponsor: async ({ request, locals }) => {
    const formData = await request.formData()
    const id = formData.get('id') as string

    if (!id) {
      return fail(400, { error: 'Sponsor ID is required', action: 'deleteSponsor' })
    }

    try {
      // Check if sponsor has edition links
      const editionSponsorRepo = createEditionSponsorRepository(locals.pb)
      const links = await editionSponsorRepo.findBySponsor(id)

      if (links.length > 0) {
        return fail(400, {
          error: 'Cannot delete a sponsor that is linked to editions. Remove the links first.',
          action: 'deleteSponsor'
        })
      }

      const sponsorRepo = createSponsorRepository(locals.pb)
      await sponsorRepo.delete(id)

      return { success: true, action: 'deleteSponsor' }
    } catch (err) {
      console.error('Failed to delete sponsor:', err)
      return fail(500, { error: 'Failed to delete sponsor', action: 'deleteSponsor' })
    }
  },

  addSponsorToEdition: async ({ request, locals }) => {
    const formData = await request.formData()
    const editionId = formData.get('editionId') as string
    const sponsorId = formData.get('sponsorId') as string
    const packageId = formData.get('packageId') as string
    const status = (formData.get('status') as SponsorStatus) || 'prospect'
    const amount = formData.get('amount') as string
    const notes = formData.get('notes') as string

    if (!editionId || !sponsorId) {
      return fail(400, {
        error: 'Edition and sponsor IDs are required',
        action: 'addSponsorToEdition'
      })
    }

    try {
      const editionSponsorRepo = createEditionSponsorRepository(locals.pb)

      // Check if sponsor is already linked
      const existing = await editionSponsorRepo.findByEditionAndSponsor(editionId, sponsorId)
      if (existing) {
        return fail(400, {
          error: 'Sponsor is already added to this edition',
          action: 'addSponsorToEdition'
        })
      }

      await editionSponsorRepo.create({
        editionId,
        sponsorId,
        packageId: packageId || undefined,
        status,
        amount: amount ? Number(amount) : undefined,
        notes: notes?.trim() || undefined
      })

      return { success: true, action: 'addSponsorToEdition' }
    } catch (err) {
      console.error('Failed to add sponsor to edition:', err)
      return fail(500, { error: 'Failed to add sponsor to edition', action: 'addSponsorToEdition' })
    }
  },

  updateEditionSponsor: async ({ request, locals }) => {
    const formData = await request.formData()
    const id = formData.get('id') as string
    const packageId = formData.get('packageId') as string
    const status = formData.get('status') as SponsorStatus
    const amount = formData.get('amount') as string
    const notes = formData.get('notes') as string
    const paidAt = formData.get('paidAt') as string

    if (!id) {
      return fail(400, { error: 'Edition sponsor ID is required', action: 'updateEditionSponsor' })
    }

    try {
      const editionSponsorRepo = createEditionSponsorRepository(locals.pb)
      await editionSponsorRepo.update(id, {
        packageId: packageId || undefined,
        status,
        amount: amount ? Number(amount) : undefined,
        notes: notes?.trim() || undefined,
        paidAt: paidAt ? new Date(paidAt) : undefined
      })

      return { success: true, action: 'updateEditionSponsor' }
    } catch (err) {
      console.error('Failed to update edition sponsor:', err)
      return fail(500, {
        error: 'Failed to update edition sponsor',
        action: 'updateEditionSponsor'
      })
    }
  },

  updateStatus: async ({ request, locals }) => {
    const formData = await request.formData()
    const id = formData.get('id') as string
    const status = formData.get('status') as SponsorStatus

    if (!id || !status) {
      return fail(400, { error: 'ID and status are required', action: 'updateStatus' })
    }

    try {
      const editionSponsorRepo = createEditionSponsorRepository(locals.pb)
      await editionSponsorRepo.updateStatus(id, status)

      return { success: true, action: 'updateStatus' }
    } catch (err) {
      console.error('Failed to update status:', err)
      return fail(500, { error: 'Failed to update status', action: 'updateStatus' })
    }
  },

  removeFromEdition: async ({ request, locals }) => {
    const formData = await request.formData()
    const id = formData.get('id') as string

    if (!id) {
      return fail(400, { error: 'Edition sponsor ID is required', action: 'removeFromEdition' })
    }

    try {
      const editionSponsorRepo = createEditionSponsorRepository(locals.pb)
      await editionSponsorRepo.delete(id)

      return { success: true, action: 'removeFromEdition' }
    } catch (err) {
      console.error('Failed to remove sponsor from edition:', err)
      return fail(500, {
        error: 'Failed to remove sponsor from edition',
        action: 'removeFromEdition'
      })
    }
  },

  generatePortalLink: async ({ request, locals, params }) => {
    const formData = await request.formData()
    const editionSponsorId = formData.get('editionSponsorId') as string

    if (!editionSponsorId) {
      return fail(400, { error: 'Edition sponsor ID is required', action: 'generatePortalLink' })
    }

    try {
      const tokenService = createSponsorTokenService(locals.pb)
      const baseUrl =
        env.PUBLIC_POCKETBASE_URL?.replace(':8090', ':5173') || 'http://localhost:5173'
      const portalUrl = await tokenService.generatePortalLink(
        editionSponsorId,
        params.editionSlug,
        baseUrl
      )

      return { success: true, action: 'generatePortalLink', portalUrl }
    } catch (err) {
      console.error('Failed to generate portal link:', err)
      return fail(500, { error: 'Failed to generate portal link', action: 'generatePortalLink' })
    }
  }
}
