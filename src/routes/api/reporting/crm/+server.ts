import { createCrmStatsService } from '$lib/features/crm/services/crm-stats-service'
import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

/**
 * Get CRM Statistics for Reporting Widget
 * GET /api/reporting/crm?editionId={editionId}
 */
export const GET: RequestHandler = async ({ locals, url }) => {
  if (!locals.pb.authStore.isValid) {
    throw error(401, { message: 'Authentication required' })
  }

  const editionId = url.searchParams.get('editionId')
  if (!editionId) {
    throw error(400, { message: 'editionId parameter is required' })
  }

  const periodDays = Number(url.searchParams.get('periodDays')) || 30

  try {
    const service = createCrmStatsService(locals.pb)

    const [contactStats, campaignStats, engagementStats] = await Promise.all([
      service.getContactStats(editionId, periodDays),
      service.getCampaignStats(editionId),
      service.getEngagementStats(editionId)
    ])

    return json({
      data: {
        contactStats,
        campaignStats,
        engagementStats
      },
      meta: {
        editionId,
        periodDays,
        generatedAt: new Date().toISOString()
      }
    })
  } catch (err) {
    console.error('Failed to fetch CRM stats:', err)
    throw error(500, { message: 'Failed to fetch CRM statistics' })
  }
}
