import { createSponsorTokenService } from '$lib/features/sponsoring/services'
import { error, redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params, url, locals }) => {
  const { editionSlug } = params
  const token = url.searchParams.get('token')

  if (!token) {
    throw error(400, 'Token is required')
  }

  // Validate the edition exists
  const editions = await locals.pb.collection('editions').getList(1, 1, {
    filter: `slug = "${editionSlug}"`
  })

  if (editions.items.length === 0) {
    throw error(404, 'Edition not found')
  }

  // Validate token
  const tokenService = createSponsorTokenService(locals.pb)
  const result = await tokenService.validateToken(token)

  if (!result.valid || !result.editionSponsor) {
    throw error(403, result.error || 'Invalid or expired token')
  }

  // Redirect to portal with token
  throw redirect(302, `/sponsor/${editionSlug}/portal?token=${token}`)
}
