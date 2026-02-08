import { hasPermission } from '$lib/features/api/domain'
import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

/**
 * Get Speakers for Edition
 * GET /api/v1/editions/:id/speakers
 */
export const GET: RequestHandler = async ({ params, locals, url }) => {
  if (!locals.apiKey) {
    throw error(401, { message: 'API key required' })
  }

  if (!hasPermission(locals.apiKey, 'read:speakers')) {
    throw error(403, { message: 'Permission denied: read:speakers required' })
  }

  const { id } = params
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1)
  const perPage = Math.min(100, Math.max(1, Number(url.searchParams.get('per_page')) || 20))

  // Check edition scope
  if (locals.apiKeyScope?.editionId && locals.apiKeyScope.editionId !== id) {
    throw error(403, { message: 'Access denied: edition not in scope' })
  }

  // Get accepted talks for this edition to find speakers
  const talks = await locals.pb.collection('talks').getFullList({
    filter: `editionId = "${id}" && status = "accepted"`,
    expand: 'speakerIds'
  })

  // Extract unique speaker IDs
  const speakerIds = new Set<string>()
  for (const talk of talks) {
    const ids = talk.speakerIds as string[]
    if (ids) {
      for (const speakerId of ids) {
        speakerIds.add(speakerId)
      }
    }
  }

  if (speakerIds.size === 0) {
    return json({
      data: [],
      meta: { page: 1, perPage, total: 0, totalPages: 0 }
    })
  }

  // Fetch speakers with pagination
  const speakerFilter = [...speakerIds].map((sid) => `id = "${sid}"`).join(' || ')
  const result = await locals.pb.collection('speakers').getList(page, perPage, {
    filter: speakerFilter,
    sort: 'lastName,firstName'
  })

  return json({
    data: result.items.map((speaker) => ({
      id: speaker.id,
      firstName: speaker.firstName,
      lastName: speaker.lastName,
      email: speaker.email,
      bio: speaker.bio || null,
      company: speaker.company || null,
      jobTitle: speaker.jobTitle || null,
      photoUrl: speaker.photoUrl || null,
      twitter: speaker.twitter || null,
      github: speaker.github || null,
      linkedin: speaker.linkedin || null,
      city: speaker.city || null,
      country: speaker.country || null
    })),
    meta: {
      page,
      perPage,
      total: result.totalItems,
      totalPages: result.totalPages
    }
  })
}
