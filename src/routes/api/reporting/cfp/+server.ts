import { createCfpStatsService } from '$lib/features/cfp/services'
import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

/**
 * Get CFP Statistics for Edition
 * GET /api/reporting/cfp?editionId=xxx
 */
export const GET: RequestHandler = async ({ url, locals }) => {
  const editionId = url.searchParams.get('editionId')

  if (!editionId) {
    throw error(400, { message: 'editionId parameter is required' })
  }

  if (!locals.pb.authStore.isValid) {
    throw error(401, { message: 'Authentication required' })
  }

  try {
    const statsService = createCfpStatsService(locals.pb)

    const [submissionStats, reviewStats, acceptanceStats] = await Promise.all([
      statsService.getSubmissionStats(editionId),
      statsService.getReviewStats(editionId),
      statsService.getAcceptanceRate(editionId)
    ])

    return json({
      data: {
        submission: submissionStats,
        review: reviewStats,
        acceptance: acceptanceStats
      },
      meta: {
        editionId,
        timestamp: new Date().toISOString()
      }
    })
  } catch (err) {
    console.error('Error fetching CFP stats:', err)
    throw error(500, { message: 'Failed to fetch CFP statistics' })
  }
}
