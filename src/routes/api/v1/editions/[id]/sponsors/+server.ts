import { hasPermission } from '$lib/features/api/domain'
import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

/**
 * Get Sponsors for Edition
 * GET /api/v1/editions/:id/sponsors
 */
export const GET: RequestHandler = async ({ params, locals, url }) => {
  if (!locals.apiKey) {
    throw error(401, { message: 'API key required' })
  }

  if (!hasPermission(locals.apiKey, 'read:sponsors')) {
    throw error(403, { message: 'Permission denied: read:sponsors required' })
  }

  const { id } = params
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1)
  const perPage = Math.min(100, Math.max(1, Number(url.searchParams.get('per_page')) || 20))
  const confirmedOnly = url.searchParams.get('confirmed') !== 'false'

  // Check edition scope
  if (locals.apiKeyScope?.editionId && locals.apiKeyScope.editionId !== id) {
    throw error(403, { message: 'Access denied: edition not in scope' })
  }

  const filters: string[] = [`editionId = "${id}"`]
  if (confirmedOnly) filters.push('status = "confirmed"')

  const result = await locals.pb.collection('edition_sponsors').getList(page, perPage, {
    filter: filters.join(' && '),
    expand: 'sponsorId,packageId',
    sort: 'packageId.tier'
  })

  return json({
    data: result.items.map((editionSponsor) => {
      const sponsor = editionSponsor.expand?.sponsorId as Record<string, unknown> | undefined
      const pkg = editionSponsor.expand?.packageId as Record<string, unknown> | undefined

      return {
        id: editionSponsor.id,
        status: editionSponsor.status,
        sponsor: sponsor
          ? {
              id: sponsor.id as string,
              name: sponsor.name as string,
              website: (sponsor.website as string) || null,
              description: (sponsor.description as string) || null,
              logo: sponsor.logo
                ? locals.pb.files.getURL(sponsor as { id: string }, sponsor.logo as string)
                : null
            }
          : null,
        package: pkg
          ? {
              id: pkg.id as string,
              name: pkg.name as string,
              tier: pkg.tier as number
            }
          : null
      }
    }),
    meta: {
      page,
      perPage,
      total: result.totalItems,
      totalPages: result.totalPages
    }
  })
}
