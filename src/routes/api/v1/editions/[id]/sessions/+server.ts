import { hasPermission } from '$lib/features/api/domain'
import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

/**
 * Get Sessions for Edition
 * GET /api/v1/editions/:id/sessions
 */
export const GET: RequestHandler = async ({ params, locals, url }) => {
  if (!locals.apiKey) {
    throw error(401, { message: 'API key required' })
  }

  if (!hasPermission(locals.apiKey, 'read:sessions')) {
    throw error(403, { message: 'Permission denied: read:sessions required' })
  }

  const { id } = params
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1)
  const perPage = Math.min(100, Math.max(1, Number(url.searchParams.get('per_page')) || 20))
  const type = url.searchParams.get('type')
  const trackId = url.searchParams.get('track_id')

  // Check edition scope
  if (locals.apiKeyScope?.editionId && locals.apiKeyScope.editionId !== id) {
    throw error(403, { message: 'Access denied: edition not in scope' })
  }

  const filters: string[] = [`editionId = "${id}"`]
  if (type) filters.push(`type = "${type}"`)
  if (trackId) filters.push(`trackId = "${trackId}"`)

  const result = await locals.pb.collection('sessions').getList(page, perPage, {
    filter: filters.join(' && '),
    sort: 'created',
    expand: 'slotId,talkId,trackId'
  })

  return json({
    data: result.items.map((session) => ({
      id: session.id,
      title: session.title,
      description: session.description || null,
      type: session.type,
      slotId: session.slotId || null,
      talkId: session.talkId || null,
      trackId: session.trackId || null,
      createdAt: session.created,
      updatedAt: session.updated
    })),
    meta: {
      page,
      perPage,
      total: result.totalItems,
      totalPages: result.totalPages
    }
  })
}
