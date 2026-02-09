import {
  createManageRoomAssignmentsUseCase,
  createManageRoomsUseCase,
  createManageSessionsUseCase,
  createManageSlotsUseCase,
  createManageTracksUseCase,
  createRoomAssignmentRepository,
  createRoomRepository,
  createSessionRepository,
  createSlotRepository,
  createTrackRepository
} from '$lib/features/planning'
import { error, fail } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

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

export const actions: Actions = {
  // ============ ROOMS ============
  createRoom: async ({ request, locals }) => {
    const formData = await request.formData()
    const roomRepo = createRoomRepository(locals.pb)
    const slotRepo = createSlotRepository(locals.pb)
    const useCase = createManageRoomsUseCase(roomRepo, slotRepo)

    try {
      const result = await useCase.create({
        editionId: formData.get('editionId') as string,
        name: formData.get('name') as string,
        capacity: formData.get('capacity')
          ? Number.parseInt(formData.get('capacity') as string, 10)
          : undefined,
        floor: (formData.get('floor') as string) || undefined,
        equipment: formData.getAll('equipment') as string[],
        equipmentNotes: (formData.get('equipmentNotes') as string) || undefined
      })

      if (!result.success) {
        return fail(400, { error: result.error, action: 'createRoom' })
      }
      return { success: true, action: 'createRoom' }
    } catch (err) {
      console.error('Failed to create room:', err)
      return fail(500, { error: 'Failed to create room', action: 'createRoom' })
    }
  },

  updateRoom: async ({ request, locals }) => {
    const formData = await request.formData()
    const roomRepo = createRoomRepository(locals.pb)
    const slotRepo = createSlotRepository(locals.pb)
    const useCase = createManageRoomsUseCase(roomRepo, slotRepo)

    try {
      const result = await useCase.update({
        id: formData.get('id') as string,
        name: formData.get('name') as string,
        capacity: formData.get('capacity')
          ? Number.parseInt(formData.get('capacity') as string, 10)
          : undefined,
        floor: (formData.get('floor') as string) || undefined,
        equipment: formData.getAll('equipment') as string[],
        equipmentNotes: (formData.get('equipmentNotes') as string) || undefined
      })

      if (!result.success) {
        return fail(400, { error: result.error, action: 'updateRoom' })
      }
      return { success: true, action: 'updateRoom' }
    } catch (err) {
      console.error('Failed to update room:', err)
      return fail(500, { error: 'Failed to update room', action: 'updateRoom' })
    }
  },

  deleteRoom: async ({ request, locals }) => {
    const formData = await request.formData()
    const roomRepo = createRoomRepository(locals.pb)
    const slotRepo = createSlotRepository(locals.pb)
    const useCase = createManageRoomsUseCase(roomRepo, slotRepo)

    try {
      const result = await useCase.delete(formData.get('id') as string)
      if (!result.success) {
        return fail(400, { error: result.error, action: 'deleteRoom' })
      }
      return { success: true, action: 'deleteRoom' }
    } catch (err) {
      console.error('Failed to delete room:', err)
      return fail(500, { error: 'Failed to delete room', action: 'deleteRoom' })
    }
  },

  // ============ TRACKS ============
  createTrack: async ({ request, locals }) => {
    const formData = await request.formData()
    const trackRepo = createTrackRepository(locals.pb)
    const sessionRepo = createSessionRepository(locals.pb)
    const useCase = createManageTracksUseCase(trackRepo, sessionRepo)

    try {
      const result = await useCase.create({
        editionId: formData.get('editionId') as string,
        name: formData.get('name') as string,
        color: (formData.get('color') as string) || undefined
      })

      if (!result.success) {
        return fail(400, { error: result.error, action: 'createTrack' })
      }
      return { success: true, action: 'createTrack' }
    } catch (err) {
      console.error('Failed to create track:', err)
      return fail(500, { error: 'Failed to create track', action: 'createTrack' })
    }
  },

  updateTrack: async ({ request, locals }) => {
    const formData = await request.formData()
    const trackRepo = createTrackRepository(locals.pb)
    const sessionRepo = createSessionRepository(locals.pb)
    const useCase = createManageTracksUseCase(trackRepo, sessionRepo)

    try {
      const result = await useCase.update({
        id: formData.get('id') as string,
        name: formData.get('name') as string,
        color: (formData.get('color') as string) || undefined
      })

      if (!result.success) {
        return fail(400, { error: result.error, action: 'updateTrack' })
      }
      return { success: true, action: 'updateTrack' }
    } catch (err) {
      console.error('Failed to update track:', err)
      return fail(500, { error: 'Failed to update track', action: 'updateTrack' })
    }
  },

  deleteTrack: async ({ request, locals }) => {
    const formData = await request.formData()
    const trackRepo = createTrackRepository(locals.pb)
    const sessionRepo = createSessionRepository(locals.pb)
    const useCase = createManageTracksUseCase(trackRepo, sessionRepo)

    try {
      const result = await useCase.delete(formData.get('id') as string)
      if (!result.success) {
        return fail(400, { error: result.error, action: 'deleteTrack' })
      }
      return { success: true, action: 'deleteTrack' }
    } catch (err) {
      console.error('Failed to delete track:', err)
      return fail(500, { error: 'Failed to delete track', action: 'deleteTrack' })
    }
  },

  // ============ SLOTS ============
  createSlot: async ({ request, locals }) => {
    const formData = await request.formData()
    const slotRepo = createSlotRepository(locals.pb)
    const sessionRepo = createSessionRepository(locals.pb)
    const useCase = createManageSlotsUseCase(slotRepo, sessionRepo)

    try {
      const result = await useCase.create({
        editionId: formData.get('editionId') as string,
        roomId: formData.get('roomId') as string,
        date: formData.get('date') as string,
        startTime: formData.get('startTime') as string,
        endTime: formData.get('endTime') as string
      })

      if (!result.success) {
        return fail(400, { error: result.error, action: 'createSlot' })
      }
      return { success: true, action: 'createSlot' }
    } catch (err) {
      console.error('Failed to create slot:', err)
      return fail(500, { error: 'Failed to create slot', action: 'createSlot' })
    }
  },

  updateSlot: async ({ request, locals }) => {
    const formData = await request.formData()
    const slotRepo = createSlotRepository(locals.pb)
    const sessionRepo = createSessionRepository(locals.pb)
    const useCase = createManageSlotsUseCase(slotRepo, sessionRepo)

    try {
      const result = await useCase.update({
        id: formData.get('id') as string,
        roomId: formData.get('roomId') as string,
        date: formData.get('date') as string,
        startTime: formData.get('startTime') as string,
        endTime: formData.get('endTime') as string
      })

      if (!result.success) {
        return fail(400, { error: result.error, action: 'updateSlot' })
      }
      return { success: true, action: 'updateSlot' }
    } catch (err) {
      console.error('Failed to update slot:', err)
      return fail(500, { error: 'Failed to update slot', action: 'updateSlot' })
    }
  },

  deleteSlot: async ({ request, locals }) => {
    const formData = await request.formData()
    const slotRepo = createSlotRepository(locals.pb)
    const sessionRepo = createSessionRepository(locals.pb)
    const useCase = createManageSlotsUseCase(slotRepo, sessionRepo)

    try {
      const result = await useCase.delete(formData.get('id') as string)
      if (!result.success) {
        return fail(400, { error: result.error, action: 'deleteSlot' })
      }
      return { success: true, action: 'deleteSlot' }
    } catch (err) {
      console.error('Failed to delete slot:', err)
      return fail(500, { error: 'Failed to delete slot', action: 'deleteSlot' })
    }
  },

  // ============ SESSIONS ============
  createSession: async ({ request, locals }) => {
    const formData = await request.formData()
    const sessionRepo = createSessionRepository(locals.pb)
    const useCase = createManageSessionsUseCase(sessionRepo)

    try {
      const result = await useCase.create({
        editionId: formData.get('editionId') as string,
        slotId: formData.get('slotId') as string,
        title: formData.get('title') as string,
        type: formData.get('type') as string,
        talkId: (formData.get('talkId') as string) || null,
        trackId: (formData.get('trackId') as string) || null,
        description: (formData.get('description') as string) || null
      })

      if (!result.success) {
        return fail(400, { error: result.error, action: 'createSession' })
      }
      return { success: true, action: 'createSession' }
    } catch (err) {
      console.error('Failed to create session:', err)
      return fail(500, { error: 'Failed to create session', action: 'createSession' })
    }
  },

  updateSession: async ({ request, locals }) => {
    const formData = await request.formData()
    const sessionRepo = createSessionRepository(locals.pb)
    const useCase = createManageSessionsUseCase(sessionRepo)

    try {
      const result = await useCase.update({
        id: formData.get('id') as string,
        title: formData.get('title') as string,
        type: formData.get('type') as string,
        talkId: (formData.get('talkId') as string) || null,
        trackId: (formData.get('trackId') as string) || null,
        description: (formData.get('description') as string) || null
      })

      if (!result.success) {
        return fail(400, { error: result.error, action: 'updateSession' })
      }
      return { success: true, action: 'updateSession' }
    } catch (err) {
      console.error('Failed to update session:', err)
      return fail(500, { error: 'Failed to update session', action: 'updateSession' })
    }
  },

  deleteSession: async ({ request, locals }) => {
    const formData = await request.formData()
    const sessionRepo = createSessionRepository(locals.pb)
    const useCase = createManageSessionsUseCase(sessionRepo)

    try {
      const result = await useCase.delete(formData.get('id') as string)
      if (!result.success) {
        return fail(400, { error: result.error, action: 'deleteSession' })
      }
      return { success: true, action: 'deleteSession' }
    } catch (err) {
      console.error('Failed to delete session:', err)
      return fail(500, { error: 'Failed to delete session', action: 'deleteSession' })
    }
  },

  // ============ ROOM ASSIGNMENTS ============
  createRoomAssignment: async ({ request, locals }) => {
    const formData = await request.formData()
    const roomAssignmentRepo = createRoomAssignmentRepository(locals.pb)
    const useCase = createManageRoomAssignmentsUseCase(roomAssignmentRepo)

    try {
      const result = await useCase.create({
        editionId: formData.get('editionId') as string,
        roomId: formData.get('roomId') as string,
        memberId: formData.get('memberId') as string,
        date: (formData.get('date') as string) || null,
        startTime: (formData.get('startTime') as string) || null,
        endTime: (formData.get('endTime') as string) || null,
        notes: (formData.get('notes') as string) || null
      })

      if (!result.success) {
        return fail(400, { error: result.error, action: 'createRoomAssignment' })
      }
      return { success: true, action: 'createRoomAssignment' }
    } catch (err) {
      console.error('Failed to create room assignment:', err)
      return fail(500, {
        error: 'Failed to create room assignment',
        action: 'createRoomAssignment'
      })
    }
  },

  updateRoomAssignment: async ({ request, locals }) => {
    const formData = await request.formData()
    const roomAssignmentRepo = createRoomAssignmentRepository(locals.pb)
    const useCase = createManageRoomAssignmentsUseCase(roomAssignmentRepo)

    try {
      const result = await useCase.update({
        id: formData.get('id') as string,
        memberId: formData.get('memberId') as string,
        date: (formData.get('date') as string) || null,
        startTime: (formData.get('startTime') as string) || null,
        endTime: (formData.get('endTime') as string) || null,
        notes: (formData.get('notes') as string) || null
      })

      if (!result.success) {
        return fail(400, { error: result.error, action: 'updateRoomAssignment' })
      }
      return { success: true, action: 'updateRoomAssignment' }
    } catch (err) {
      console.error('Failed to update room assignment:', err)
      return fail(500, {
        error: 'Failed to update room assignment',
        action: 'updateRoomAssignment'
      })
    }
  },

  deleteRoomAssignment: async ({ request, locals }) => {
    const formData = await request.formData()
    const roomAssignmentRepo = createRoomAssignmentRepository(locals.pb)
    const useCase = createManageRoomAssignmentsUseCase(roomAssignmentRepo)

    try {
      const result = await useCase.delete(formData.get('id') as string)
      if (!result.success) {
        return fail(400, { error: result.error, action: 'deleteRoomAssignment' })
      }
      return { success: true, action: 'deleteRoomAssignment' }
    } catch (err) {
      console.error('Failed to delete room assignment:', err)
      return fail(500, {
        error: 'Failed to delete room assignment',
        action: 'deleteRoomAssignment'
      })
    }
  }
}
