import { createSponsorRepository } from '$lib/features/sponsoring/infra'
import { createSponsorTokenService } from '$lib/features/sponsoring/services'
import { getSponsorToken } from '$lib/server/token-cookies'
import { error, fail } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params, url, locals, cookies }) => {
  const { editionSlug } = params
  // Get token from cookie or URL (backwards compatibility)
  const token = getSponsorToken(cookies, url, editionSlug)

  if (!token) {
    throw error(400, 'Token is required')
  }

  // Get edition
  const editions = await locals.pb.collection('editions').getList(1, 1, {
    filter: `slug = "${editionSlug}"`
  })

  if (editions.items.length === 0) {
    throw error(404, 'Edition not found')
  }

  const edition = editions.items[0]

  // Get event info
  const event = await locals.pb.collection('events').getOne(edition.eventId as string)

  // Validate token
  const tokenService = createSponsorTokenService(locals.pb)
  const result = await tokenService.validateToken(token)

  if (!result.valid || !result.editionSponsor) {
    throw error(403, result.error || 'Invalid or expired token')
  }

  const sponsorRepo = createSponsorRepository(locals.pb)
  const logoUrl = result.editionSponsor.sponsor
    ? sponsorRepo.getLogoUrl(result.editionSponsor.sponsor)
    : null

  return {
    token,
    edition: {
      id: edition.id as string,
      name: edition.name as string,
      slug: edition.slug as string,
      year: edition.year as number
    },
    event: {
      name: event.name as string
    },
    editionSponsor: {
      ...result.editionSponsor,
      sponsor: result.editionSponsor.sponsor
        ? {
            ...result.editionSponsor.sponsor,
            logoUrl
          }
        : undefined
    }
  }
}

export const actions: Actions = {
  updateProfile: async ({ request, url, locals, cookies, params }) => {
    const formData = await request.formData()
    // Token can come from cookie, URL params or form data (for backwards compatibility)
    const token =
      getSponsorToken(cookies, url, params.editionSlug) || (formData.get('token') as string)
    const sponsorId = formData.get('sponsorId') as string
    const name = formData.get('name') as string
    const website = formData.get('website') as string
    const description = formData.get('description') as string
    const contactName = formData.get('contactName') as string
    const contactEmail = formData.get('contactEmail') as string
    const contactPhone = formData.get('contactPhone') as string

    if (!token) {
      return fail(400, { error: 'Token is required', action: 'updateProfile' })
    }

    // Validate token
    const tokenService = createSponsorTokenService(locals.pb)
    const result = await tokenService.validateToken(token)

    if (!result.valid || !result.editionSponsor) {
      return fail(403, { error: 'Invalid or expired token', action: 'updateProfile' })
    }

    // Verify the sponsor ID matches
    if (result.editionSponsor.sponsorId !== sponsorId) {
      return fail(403, { error: 'Unauthorized', action: 'updateProfile' })
    }

    try {
      const sponsorRepo = createSponsorRepository(locals.pb)
      await sponsorRepo.update(sponsorId, {
        name: name?.trim() || undefined,
        website: website?.trim() || undefined,
        description: description?.trim() || undefined,
        contactName: contactName?.trim() || undefined,
        contactEmail: contactEmail?.trim() || undefined,
        contactPhone: contactPhone?.trim() || undefined
      })

      return { success: true, action: 'updateProfile' }
    } catch (err) {
      console.error('Failed to update sponsor profile:', err)
      return fail(500, { error: 'Failed to update profile', action: 'updateProfile' })
    }
  },

  uploadLogo: async ({ request, url, locals, cookies, params }) => {
    const formData = await request.formData()
    // Token can come from cookie, URL params or form data (for backwards compatibility)
    const token =
      getSponsorToken(cookies, url, params.editionSlug) || (formData.get('token') as string)
    const sponsorId = formData.get('sponsorId') as string
    const logo = formData.get('logo') as File

    if (!token) {
      return fail(400, { error: 'Token is required', action: 'uploadLogo' })
    }

    if (!logo || logo.size === 0) {
      return fail(400, { error: 'Logo file is required', action: 'uploadLogo' })
    }

    // Validate token
    const tokenService = createSponsorTokenService(locals.pb)
    const result = await tokenService.validateToken(token)

    if (!result.valid || !result.editionSponsor) {
      return fail(403, { error: 'Invalid or expired token', action: 'uploadLogo' })
    }

    // Verify the sponsor ID matches
    if (result.editionSponsor.sponsorId !== sponsorId) {
      return fail(403, { error: 'Unauthorized', action: 'uploadLogo' })
    }

    try {
      const sponsorRepo = createSponsorRepository(locals.pb)
      await sponsorRepo.updateLogo(sponsorId, logo)

      return { success: true, action: 'uploadLogo' }
    } catch (err) {
      console.error('Failed to upload logo:', err)
      return fail(500, { error: 'Failed to upload logo', action: 'uploadLogo' })
    }
  },

  removeLogo: async ({ request, url, locals, cookies, params }) => {
    const formData = await request.formData()
    // Token can come from cookie, URL params or form data (for backwards compatibility)
    const token =
      getSponsorToken(cookies, url, params.editionSlug) || (formData.get('token') as string)
    const sponsorId = formData.get('sponsorId') as string

    if (!token) {
      return fail(400, { error: 'Token is required', action: 'removeLogo' })
    }

    // Validate token
    const tokenService = createSponsorTokenService(locals.pb)
    const result = await tokenService.validateToken(token)

    if (!result.valid || !result.editionSponsor) {
      return fail(403, { error: 'Invalid or expired token', action: 'removeLogo' })
    }

    // Verify the sponsor ID matches
    if (result.editionSponsor.sponsorId !== sponsorId) {
      return fail(403, { error: 'Unauthorized', action: 'removeLogo' })
    }

    try {
      const sponsorRepo = createSponsorRepository(locals.pb)
      await sponsorRepo.removeLogo(sponsorId)

      return { success: true, action: 'removeLogo' }
    } catch (err) {
      console.error('Failed to remove logo:', err)
      return fail(500, { error: 'Failed to remove logo', action: 'removeLogo' })
    }
  }
}
