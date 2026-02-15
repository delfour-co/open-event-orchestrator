/**
 * Sponsoring Statistics API
 * GET /api/reporting/sponsoring?editionId=xxx
 *
 * Returns sponsoring statistics for an edition.
 */

import { createSponsoringStatsService } from '$lib/features/sponsoring/services/sponsoring-stats-service'
import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ url, locals }) => {
  // Require authentication
  if (!locals.pb.authStore.isValid) {
    throw error(401, { message: 'Authentication required' })
  }

  const editionId = url.searchParams.get('editionId')
  if (!editionId) {
    throw error(400, { message: 'editionId query parameter is required' })
  }

  try {
    // Verify edition exists and user has access
    await locals.pb.collection('editions').getOne(editionId)

    const statsService = createSponsoringStatsService(locals.pb)
    const stats = await statsService.getStats(editionId)

    return json({ data: stats })
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'status' in err && err.status === 404) {
      throw error(404, { message: 'Edition not found' })
    }
    throw err
  }
}
