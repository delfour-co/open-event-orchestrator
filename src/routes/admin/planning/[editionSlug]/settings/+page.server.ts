import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ parent, locals }) => {
  const parentData = await parent()
  const editionId = parentData.edition.id

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
    stats: {
      totalRooms: rooms.totalItems,
      totalTracks: tracks.totalItems,
      totalSlots: slots.totalItems,
      totalSessions: sessions.totalItems
    }
  }
}
