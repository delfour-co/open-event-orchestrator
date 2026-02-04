import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ params, locals }) => {
  const { editionSlug } = params

  // Get the edition by slug
  const editions = await locals.pb.collection('editions').getList(1, 1, {
    filter: `slug = "${editionSlug}"`
  })

  if (editions.items.length === 0) {
    throw error(404, 'Edition not found')
  }

  const edition = editions.items[0]

  // Only export published editions
  if (edition.status !== 'published') {
    throw error(404, 'Schedule not available')
  }

  const editionId = edition.id as string

  // Get the event
  const event = await locals.pb.collection('events').getOne(edition.eventId as string)

  // Load all schedule data in parallel
  const [rooms, tracks, slots, sessions] = await Promise.all([
    locals.pb.collection('rooms').getFullList({
      filter: `editionId = "${editionId}"`,
      sort: 'order,name'
    }),
    locals.pb.collection('tracks').getFullList({
      filter: `editionId = "${editionId}"`,
      sort: 'order,name'
    }),
    locals.pb.collection('slots').getFullList({
      filter: `editionId = "${editionId}"`,
      sort: 'date,startTime'
    }),
    locals.pb.collection('sessions').getFullList({
      filter: `editionId = "${editionId}"`
    })
  ])

  // Get talk IDs from sessions that have talks
  const talkIds = sessions.filter((s) => s.talkId).map((s) => s.talkId as string)

  // Load talks with speaker information if there are any
  interface Speaker {
    id: string
    firstName: string
    lastName: string
    company?: string
    bio?: string
  }

  interface Talk {
    id: string
    title: string
    abstract: string
    speakers: Speaker[]
  }

  let talks: Talk[] = []

  if (talkIds.length > 0) {
    const talkRecords = await locals.pb.collection('talks').getFullList({
      filter: talkIds.map((id) => `id = "${id}"`).join(' || '),
      expand: 'speakerIds'
    })

    talks = talkRecords.map((t) => {
      const expandedSpeakers = t.expand?.speakerIds as Array<Record<string, unknown>> | undefined
      return {
        id: t.id as string,
        title: t.title as string,
        abstract: t.abstract as string,
        speakers: expandedSpeakers
          ? expandedSpeakers.map((s) => ({
              id: s.id as string,
              firstName: s.firstName as string,
              lastName: s.lastName as string,
              company: s.company as string | undefined,
              bio: s.bio as string | undefined
            }))
          : []
      }
    })
  }

  // Build the export object
  const scheduleExport = {
    exportedAt: new Date().toISOString(),
    edition: {
      id: editionId,
      name: edition.name as string,
      slug: edition.slug as string,
      startDate: edition.startDate as string,
      endDate: edition.endDate as string,
      venue: edition.venue as string | undefined,
      city: edition.city as string | undefined,
      country: edition.country as string | undefined
    },
    event: {
      id: event.id as string,
      name: event.name as string
    },
    rooms: rooms.map((r) => ({
      id: r.id as string,
      name: r.name as string,
      capacity: r.capacity as number | undefined,
      floor: r.floor as string | undefined,
      order: (r.order as number) || 0
    })),
    tracks: tracks.map((t) => ({
      id: t.id as string,
      name: t.name as string,
      color: (t.color as string) || '#6b7280',
      order: (t.order as number) || 0
    })),
    sessions: sessions.map((s) => {
      const slot = slots.find((sl) => sl.id === s.slotId)
      const room = slot ? rooms.find((r) => r.id === slot.roomId) : null
      const track = s.trackId ? tracks.find((t) => t.id === s.trackId) : null
      const talk = s.talkId ? talks.find((t) => t.id === s.talkId) : null

      return {
        id: s.id as string,
        title: s.title as string,
        description: s.description as string | undefined,
        type: (s.type as string) || 'talk',
        date: slot?.date as string | undefined,
        startTime: slot?.startTime as string | undefined,
        endTime: slot?.endTime as string | undefined,
        room: room
          ? {
              id: room.id as string,
              name: room.name as string
            }
          : null,
        track: track
          ? {
              id: track.id as string,
              name: track.name as string,
              color: track.color as string
            }
          : null,
        speakers: talk?.speakers || []
      }
    })
  }

  const filename = `${editionSlug}-schedule.json`

  return json(scheduleExport, {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`
    }
  })
}
