import { hasPermission } from '$lib/features/api/domain'
import { filterAnd, filterEquals } from '$lib/server/safe-filter'
import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

/**
 * List Editions
 * GET /api/v1/editions
 */
export const GET: RequestHandler = async ({ locals, url }) => {
  if (!locals.apiKey) {
    throw error(401, { message: 'API key required' })
  }

  if (!hasPermission(locals.apiKey, 'read:editions')) {
    throw error(403, { message: 'Permission denied: read:editions required' })
  }

  const page = Math.max(1, Number(url.searchParams.get('page')) || 1)
  const perPage = Math.min(100, Math.max(1, Number(url.searchParams.get('per_page')) || 20))

  const eventId = url.searchParams.get('event_id')
  const status = url.searchParams.get('status')

  const filters: string[] = []

  if (eventId) filters.push(filterEquals('eventId', eventId))
  if (status) filters.push(filterEquals('status', status))
  if (locals.apiKeyScope?.editionId) filters.push(filterEquals('id', locals.apiKeyScope.editionId))
  if (locals.apiKeyScope?.eventId) filters.push(filterEquals('eventId', locals.apiKeyScope.eventId))

  const filter = filterAnd(...filters)

  const result = await locals.pb.collection('editions').getList(page, perPage, {
    filter,
    sort: '-startDate',
    expand: 'eventId'
  })

  return json({
    data: result.items.map((edition) => ({
      id: edition.id,
      name: edition.name,
      slug: edition.slug,
      year: edition.year,
      startDate: edition.startDate,
      endDate: edition.endDate,
      venue: edition.venue || null,
      city: edition.city || null,
      country: edition.country || null,
      status: edition.status,
      eventId: edition.eventId,
      createdAt: edition.created,
      updatedAt: edition.updated
    })),
    meta: {
      page,
      perPage,
      total: result.totalItems,
      totalPages: result.totalPages
    }
  })
}
