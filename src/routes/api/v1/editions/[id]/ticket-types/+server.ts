import { hasPermission } from '$lib/features/api/domain'
import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

/**
 * Get Ticket Types for Edition
 * GET /api/v1/editions/:id/ticket-types
 */
export const GET: RequestHandler = async ({ params, locals, url }) => {
  if (!locals.apiKey) {
    throw error(401, { message: 'API key required' })
  }

  if (!hasPermission(locals.apiKey, 'read:ticket-types')) {
    throw error(403, { message: 'Permission denied: read:ticket-types required' })
  }

  const { id } = params
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1)
  const perPage = Math.min(100, Math.max(1, Number(url.searchParams.get('per_page')) || 20))
  const activeOnly = url.searchParams.get('active') === 'true'

  // Check edition scope
  if (locals.apiKeyScope?.editionId && locals.apiKeyScope.editionId !== id) {
    throw error(403, { message: 'Access denied: edition not in scope' })
  }

  const filters: string[] = [`editionId = "${id}"`]
  if (activeOnly) filters.push('isActive = true')

  const result = await locals.pb.collection('ticket_types').getList(page, perPage, {
    filter: filters.join(' && '),
    sort: 'order'
  })

  return json({
    data: result.items.map((ticketType) => ({
      id: ticketType.id,
      name: ticketType.name,
      description: ticketType.description || null,
      price: ticketType.price,
      currency: ticketType.currency,
      quantity: ticketType.quantity,
      quantitySold: ticketType.quantitySold || 0,
      quantityAvailable: ticketType.quantity - (ticketType.quantitySold || 0),
      salesStartDate: ticketType.salesStartDate || null,
      salesEndDate: ticketType.salesEndDate || null,
      isActive: ticketType.isActive
    })),
    meta: {
      page,
      perPage,
      total: result.totalItems,
      totalPages: result.totalPages
    }
  })
}
