import { error } from '@sveltejs/kit'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ params, locals }) => {
  const { editionSlug } = params

  const editions = await locals.pb.collection('editions').getList(1, 1, {
    filter: `slug = "${editionSlug}"`
  })

  if (editions.items.length === 0) {
    throw error(404, 'Edition not found')
  }

  const edition = editions.items[0]
  const editionId = edition.id as string

  const event = await locals.pb.collection('events').getOne(edition.eventId as string)
  const organizationId = event.organizationId as string

  const [rooms, tracks, slots, sessions, acceptedTalks, formats, orgMembers, roomAssignments] =
    await Promise.all([
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
      }),
      locals.pb.collection('talks').getFullList({
        filter: `editionId = "${editionId}" && (status = "accepted" || status = "confirmed")`,
        expand: 'speakerIds',
        sort: 'title'
      }),
      locals.pb.collection('formats').getFullList({
        filter: `editionId = "${editionId}"`,
        sort: 'order,name'
      }),
      locals.pb.collection('organization_members').getFullList({
        filter: `organizationId = "${organizationId}"`,
        expand: 'userId'
      }),
      locals.pb.collection('room_assignments').getFullList({
        filter: `editionId = "${editionId}"`
      })
    ])

  const formatsMap = new Map(formats.map((f) => [f.id, f]))

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
      equipment: (r.equipment as string[]) || [],
      equipmentNotes: r.equipmentNotes as string | undefined,
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
    })),
    acceptedTalks: acceptedTalks.map((t) => {
      const format = t.formatId ? formatsMap.get(t.formatId as string) : null
      const expandedSpeakers = t.expand?.speakerIds as Array<Record<string, unknown>> | undefined
      return {
        id: t.id as string,
        title: t.title as string,
        abstract: t.abstract as string,
        status: t.status as string,
        formatId: t.formatId as string | undefined,
        duration: format ? (format.duration as number) : undefined,
        speakers: expandedSpeakers
          ? expandedSpeakers.map((s) => ({
              id: s.id as string,
              firstName: s.firstName as string,
              lastName: s.lastName as string,
              company: s.company as string | undefined
            }))
          : []
      }
    }),
    formats: formats.map((f) => ({
      id: f.id as string,
      name: f.name as string,
      duration: f.duration as number
    })),
    organizationMembers: orgMembers.map((m) => {
      const user = m.expand?.userId as Record<string, unknown> | undefined
      return {
        id: m.id as string,
        role: m.role as string,
        userId: m.userId as string,
        userName: user ? (user.name as string) : 'Unknown',
        userEmail: user ? (user.email as string) : ''
      }
    }),
    roomAssignments: roomAssignments.map((a) => {
      const member = orgMembers.find((m) => m.id === a.memberId)
      const user = member?.expand?.userId as Record<string, unknown> | undefined
      const memberName = user ? (user.name as string) : 'Unknown'
      return {
        id: a.id as string,
        roomId: a.roomId as string,
        memberId: a.memberId as string,
        memberName,
        date: a.date ? new Date(a.date as string) : undefined,
        startTime: a.startTime as string | undefined,
        endTime: a.endTime as string | undefined,
        notes: a.notes as string | undefined
      }
    })
  }
}
