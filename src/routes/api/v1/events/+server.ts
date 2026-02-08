import { hasPermission } from '$lib/features/api/domain/api-key'
import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

/**
 * List Events
 * GET /api/v1/events
 */
export const GET: RequestHandler = async ({ locals, url }) => {
  // Require API key
  if (!locals.apiKey) {
    throw error(401, { message: 'API key required' })
  }

  // Check permission
  if (!hasPermission(locals.apiKey, 'read:events')) {
    throw error(403, { message: 'Permission denied: read:events required' })
  }

  // Pagination
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1)
  const perPage = Math.min(100, Math.max(1, Number(url.searchParams.get('per_page')) || 20))

  // Optional filter by organization
  const organizationId = url.searchParams.get('organization_id')

  try {
    const filter = organizationId ? `organizationId = "${organizationId}"` : ''

    const result = await locals.pb.collection('events').getList(page, perPage, {
      sort: '-created',
      filter,
      expand: 'organizationId'
    })

    return json({
      data: result.items.map((event) => ({
        id: event.id,
        name: event.name,
        slug: event.slug,
        description: event.description || null,
        organizationId: event.organizationId,
        createdAt: event.created,
        updatedAt: event.updated
      })),
      meta: {
        page,
        perPage,
        total: result.totalItems,
        totalPages: result.totalPages
      }
    })
  } catch (err) {
    console.error('Failed to fetch events:', err)
    throw error(500, { message: 'Failed to fetch events' })
  }
}
