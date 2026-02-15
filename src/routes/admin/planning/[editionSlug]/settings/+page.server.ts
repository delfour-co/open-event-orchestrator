import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params, locals }) => {
  const { editionSlug } = params

  const editions = await locals.pb.collection('editions').getList(1, 1, {
    filter: `slug = "${editionSlug}"`
  })

  if (editions.items.length === 0) {
    throw error(404, 'Edition not found')
  }

  const edition = editions.items[0]
  const editionId = edition.id as string

  // Load stats
  const [rooms, tracks, slots, sessions] = await Promise.all([
    locals.pb.collection('rooms').getList(1, 1, {
      filter: `editionId = "${editionId}"`,
      fields: 'id'
    }),
    locals.pb.collection('tracks').getList(1, 1, {
      filter: `editionId = "${editionId}"`,
      fields: 'id'
    }),
    locals.pb.collection('slots').getList(1, 1, {
      filter: `editionId = "${editionId}"`,
      fields: 'id'
    }),
    locals.pb.collection('sessions').getList(1, 1, {
      filter: `editionId = "${editionId}"`,
      fields: 'id'
    })
  ])

  return {
    edition: {
      id: editionId,
      name: edition.name as string,
      slug: edition.slug as string
    },
    stats: {
      totalRooms: rooms.totalItems,
      totalTracks: tracks.totalItems,
      totalSlots: slots.totalItems,
      totalSessions: sessions.totalItems
    }
  }
}
