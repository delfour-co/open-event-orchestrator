import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params, locals }) => {
  const { editionSlug } = params

  // Get the edition
  const editions = await locals.pb.collection('editions').getList(1, 1, {
    filter: `slug = "${editionSlug}"`
  })

  if (editions.items.length === 0) {
    throw error(404, 'Edition not found')
  }

  const edition = editions.items[0]
  const editionId = edition.id as string

  // Load rooms, tracks, slots, and sessions in parallel
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

  return {
    edition: {
      id: editionId,
      name: edition.name as string,
      slug: edition.slug as string,
      startDate: new Date(edition.startDate as string),
      endDate: new Date(edition.endDate as string)
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
    slots: slots.map((s) => ({
      id: s.id as string,
      roomId: s.roomId as string,
      date: new Date(s.date as string),
      startTime: s.startTime as string,
      endTime: s.endTime as string
    })),
    sessions: sessions.map((s) => ({
      id: s.id as string,
      slotId: s.slotId as string,
      talkId: s.talkId as string | undefined,
      trackId: s.trackId as string | undefined,
      title: s.title as string,
      type: (s.type as string) || 'talk'
    }))
  }
}
