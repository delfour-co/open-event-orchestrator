import { hasPermission } from '$lib/features/api/domain'
import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

/**
 * Get Full Schedule for Edition
 * GET /api/v1/editions/:id/schedule
 */
export const GET: RequestHandler = async ({ params, locals }) => {
  if (!locals.apiKey) {
    throw error(401, { message: 'API key required' })
  }

  if (!hasPermission(locals.apiKey, 'read:schedule')) {
    throw error(403, { message: 'Permission denied: read:schedule required' })
  }

  const { id } = params

  // Check edition scope
  if (locals.apiKeyScope?.editionId && locals.apiKeyScope.editionId !== id) {
    throw error(403, { message: 'Access denied: edition not in scope' })
  }

  // Fetch edition
  const edition = await locals.pb.collection('editions').getOne(id)

  // Fetch all related data
  const [rooms, tracks, slots, sessions, talks, speakers] = await Promise.all([
    locals.pb.collection('rooms').getFullList({ filter: `editionId = "${id}"`, sort: 'order' }),
    locals.pb.collection('tracks').getFullList({ filter: `editionId = "${id}"`, sort: 'order' }),
    locals.pb
      .collection('slots')
      .getFullList({ filter: `editionId = "${id}"`, sort: 'date,startTime' }),
    locals.pb
      .collection('sessions')
      .getFullList({ filter: `editionId = "${id}"`, expand: 'slotId,talkId,trackId' }),
    locals.pb
      .collection('talks')
      .getFullList({ filter: `editionId = "${id}" && status = "accepted"` }),
    locals.pb.collection('speakers').getFullList()
  ])

  // Build speaker map
  const speakerMap = new Map(speakers.map((s) => [s.id, s]))

  // Build schedule structure
  const schedule = {
    edition: {
      id: edition.id,
      name: edition.name,
      startDate: edition.startDate,
      endDate: edition.endDate,
      venue: edition.venue,
      city: edition.city,
      country: edition.country
    },
    rooms: rooms.map((r) => ({
      id: r.id,
      name: r.name,
      capacity: r.capacity,
      floor: r.floor
    })),
    tracks: tracks.map((t) => ({
      id: t.id,
      name: t.name,
      color: t.color,
      description: t.description
    })),
    sessions: sessions.map((session) => {
      const slot = slots.find((s) => s.id === session.slotId)
      const talk = talks.find((t) => t.id === session.talkId)
      const track = tracks.find((t) => t.id === session.trackId)
      const room = slot ? rooms.find((r) => r.id === slot.roomId) : null

      const sessionSpeakers = talk?.speakerIds
        ? (talk.speakerIds as string[])
            .map((sid) => speakerMap.get(sid))
            .filter((s): s is NonNullable<typeof s> => s !== undefined)
        : []

      return {
        id: session.id,
        title: session.title,
        description: session.description,
        type: session.type,
        date: slot?.date || null,
        startTime: slot?.startTime || null,
        endTime: slot?.endTime || null,
        room: room ? { id: room.id, name: room.name } : null,
        track: track ? { id: track.id, name: track.name, color: track.color } : null,
        speakers: sessionSpeakers.map((s) => ({
          id: s.id,
          firstName: s.firstName,
          lastName: s.lastName,
          company: s.company
        }))
      }
    })
  }

  return json({ data: schedule })
}
