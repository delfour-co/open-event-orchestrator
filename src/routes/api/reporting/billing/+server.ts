import { createBillingStatsService } from '$lib/features/billing/services'
import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

/**
 * Get Billing Statistics for Edition
 * GET /api/reporting/billing?editionId=xxx
 */
export const GET: RequestHandler = async ({ url, locals }) => {
  const editionId = url.searchParams.get('editionId')
  const days = Math.min(90, Math.max(1, Number(url.searchParams.get('days')) || 30))
  const lowStockThreshold = Math.max(1, Number(url.searchParams.get('lowStockThreshold')) || 10)

  if (!editionId) {
    throw error(400, { message: 'editionId parameter is required' })
  }

  if (!locals.pb.authStore.isValid) {
    throw error(401, { message: 'Authentication required' })
  }

  try {
    const statsService = createBillingStatsService(locals.pb)

    const [salesStats, revenueByTicketType, salesTrend, lowStockAlerts] = await Promise.all([
      statsService.getSalesStats(editionId),
      statsService.getRevenueByTicketType(editionId),
      statsService.getSalesTrend(editionId, days),
      statsService.getLowStockAlerts(editionId, lowStockThreshold)
    ])

    return json({
      data: {
        sales: salesStats,
        revenueByTicketType,
        trend: salesTrend,
        lowStockAlerts
      },
      meta: {
        editionId,
        days,
        lowStockThreshold,
        timestamp: new Date().toISOString()
      }
    })
  } catch (err) {
    console.error('Error fetching billing stats:', err)
    throw error(500, { message: 'Failed to fetch billing statistics' })
  }
}
