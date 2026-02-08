import { hasPermission } from '$lib/features/api/domain'
import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

/**
 * Get Edition by ID
 * GET /api/v1/editions/:id
 */
export const GET: RequestHandler = async ({ params, locals }) => {
  if (!locals.apiKey) {
    throw error(401, { message: 'API key required' })
  }

  if (!hasPermission(locals.apiKey, 'read:editions')) {
    throw error(403, { message: 'Permission denied: read:editions required' })
  }

  const { id } = params

  // Check scope
  if (locals.apiKeyScope?.editionId && locals.apiKeyScope.editionId !== id) {
    throw error(403, { message: 'Access denied: edition not in scope' })
  }

  try {
    const edition = await locals.pb.collection('editions').getOne(id, {
      expand: 'eventId'
    })

    // Check event scope
    if (locals.apiKeyScope?.eventId && edition.eventId !== locals.apiKeyScope.eventId) {
      throw error(403, { message: 'Access denied: edition not in scope' })
    }

    return json({
      data: {
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
      }
    })
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'status' in err && err.status === 404) {
      throw error(404, { message: 'Edition not found' })
    }
    throw err
  }
}
