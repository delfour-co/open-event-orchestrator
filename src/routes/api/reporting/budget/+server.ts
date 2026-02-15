import { createBudgetStatsService } from '$lib/features/budget/services/budget-stats-service'
import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

/**
 * Get Budget Statistics for Reporting Widget
 * GET /api/reporting/budget?editionId={editionId}
 */
export const GET: RequestHandler = async ({ locals, url }) => {
  if (!locals.pb.authStore.isValid) {
    throw error(401, { message: 'Authentication required' })
  }

  const editionId = url.searchParams.get('editionId')
  if (!editionId) {
    throw error(400, { message: 'editionId parameter is required' })
  }

  const transactionLimit = Number(url.searchParams.get('transactionLimit')) || 5

  try {
    const service = createBudgetStatsService(locals.pb)

    const [budgetOverview, cashFlow, categoryExpenses, recentTransactions] = await Promise.all([
      service.getBudgetOverview(editionId),
      service.getCashFlow(editionId),
      service.getExpensesByCategory(editionId),
      service.getRecentTransactions(editionId, transactionLimit)
    ])

    return json({
      data: {
        budgetOverview,
        cashFlow,
        categoryExpenses,
        recentTransactions
      },
      meta: {
        editionId,
        generatedAt: new Date().toISOString()
      }
    })
  } catch (err) {
    console.error('Failed to fetch budget stats:', err)
    throw error(500, { message: 'Failed to fetch budget statistics' })
  }
}
