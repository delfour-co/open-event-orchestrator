import { hasPermission } from '$lib/features/api/domain/api-key'
import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

/**
 * Get Event by ID
 * GET /api/v1/events/:id
 */
export const GET: RequestHandler = async ({ params, locals }) => {
  // Require API key
  if (!locals.apiKey) {
    throw error(401, { message: 'API key required' })
  }

  // Check permission
  if (!hasPermission(locals.apiKey, 'read:events')) {
    throw error(403, { message: 'Permission denied: read:events required' })
  }

  const { id } = params

  try {
    const event = await locals.pb.collection('events').getOne(id, {
      expand: 'organizationId'
    })

    return json({
      data: {
        id: event.id,
        name: event.name,
        slug: event.slug,
        description: event.description || null,
        organizationId: event.organizationId,
        createdAt: event.created,
        updatedAt: event.updated
      }
    })
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'status' in err && err.status === 404) {
      throw error(404, { message: 'Event not found' })
    }
    console.error('Failed to fetch event:', err)
    throw error(500, { message: 'Failed to fetch event' })
  }
}
