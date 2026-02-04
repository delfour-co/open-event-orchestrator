import { error, fail } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

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

  // Get organization ID from edition -> event -> organization
  const event = await locals.pb.collection('events').getOne(edition.eventId as string)
  const organizationId = event.organizationId as string

  // Load rooms, tracks, slots, sessions, accepted talks, and organization members in parallel
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
      // Load accepted talks with speaker information expanded
      locals.pb
        .collection('talks')
        .getFullList({
          filter: `editionId = "${editionId}" && (status = "accepted" || status = "confirmed")`,
          expand: 'speakerIds',
          sort: 'title'
        }),
      // Load formats for duration information
      locals.pb
        .collection('formats')
        .getFullList({
          filter: `editionId = "${editionId}"`,
          sort: 'order,name'
        }),
      // Load organization members for room assignments
      locals.pb
        .collection('organization_members')
        .getFullList({
          filter: `organizationId = "${organizationId}"`,
          expand: 'userId'
        }),
      // Load room assignments for this edition
      locals.pb
        .collection('room_assignments')
        .getFullList({
          filter: `editionId = "${editionId}"`,
          expand: 'memberId,memberId.userId'
        })
    ])

  // Create a map of formats by ID for easy lookup
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
    // Accepted talks available for scheduling
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
    // Organization members available for room assignments
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
    // Room assignments
    roomAssignments: roomAssignments.map((a) => {
      const member = a.expand?.memberId as
        | (Record<string, unknown> & { expand?: Record<string, unknown> })
        | undefined
      const user = member?.expand?.userId as Record<string, unknown> | undefined
      return {
        id: a.id as string,
        roomId: a.roomId as string,
        memberId: a.memberId as string,
        memberName: user ? (user.name as string) : 'Unknown',
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
    const name = formData.get('name') as string
    const capacity = formData.get('capacity') as string
    const floor = formData.get('floor') as string
    const equipment = formData.getAll('equipment') as string[]
    const equipmentNotes = formData.get('equipmentNotes') as string
    const editionId = formData.get('editionId') as string

    if (!name || name.trim().length === 0) {
      return fail(400, { error: 'Room name is required', action: 'createRoom' })
    }

    try {
      await locals.pb.collection('rooms').create({
        editionId,
        name: name.trim(),
        capacity: capacity ? Number.parseInt(capacity, 10) : null,
        floor: floor?.trim() || null,
        equipment: equipment.filter((e) => e),
        equipmentNotes: equipmentNotes?.trim() || null,
        order: 0
      })

      return { success: true, action: 'createRoom' }
    } catch (err) {
      console.error('Failed to create room:', err)
      return fail(500, { error: 'Failed to create room', action: 'createRoom' })
    }
  },

  updateRoom: async ({ request, locals }) => {
    const formData = await request.formData()
    const id = formData.get('id') as string
    const name = formData.get('name') as string
    const capacity = formData.get('capacity') as string
    const floor = formData.get('floor') as string
    const equipment = formData.getAll('equipment') as string[]
    const equipmentNotes = formData.get('equipmentNotes') as string

    if (!id) {
      return fail(400, { error: 'Room ID is required', action: 'updateRoom' })
    }
    if (!name || name.trim().length === 0) {
      return fail(400, { error: 'Room name is required', action: 'updateRoom' })
    }

    try {
      await locals.pb.collection('rooms').update(id, {
        name: name.trim(),
        capacity: capacity ? Number.parseInt(capacity, 10) : null,
        floor: floor?.trim() || null,
        equipment: equipment.filter((e) => e),
        equipmentNotes: equipmentNotes?.trim() || null
      })

      return { success: true, action: 'updateRoom' }
    } catch (err) {
      console.error('Failed to update room:', err)
      return fail(500, { error: 'Failed to update room', action: 'updateRoom' })
    }
  },

  deleteRoom: async ({ request, locals }) => {
    const formData = await request.formData()
    const id = formData.get('id') as string

    if (!id) {
      return fail(400, { error: 'Room ID is required', action: 'deleteRoom' })
    }

    try {
      // Check if room has slots
      const slots = await locals.pb.collection('slots').getList(1, 1, {
        filter: `roomId = "${id}"`
      })

      if (slots.items.length > 0) {
        return fail(400, {
          error: 'Cannot delete room with existing slots. Delete slots first.',
          action: 'deleteRoom'
        })
      }

      await locals.pb.collection('rooms').delete(id)
      return { success: true, action: 'deleteRoom' }
    } catch (err) {
      console.error('Failed to delete room:', err)
      return fail(500, { error: 'Failed to delete room', action: 'deleteRoom' })
    }
  },

  // ============ TRACKS ============
  createTrack: async ({ request, locals }) => {
    const formData = await request.formData()
    const name = formData.get('name') as string
    const color = formData.get('color') as string
    const editionId = formData.get('editionId') as string

    if (!name || name.trim().length === 0) {
      return fail(400, { error: 'Track name is required', action: 'createTrack' })
    }

    try {
      await locals.pb.collection('tracks').create({
        editionId,
        name: name.trim(),
        color: color || '#6b7280',
        order: 0
      })

      return { success: true, action: 'createTrack' }
    } catch (err) {
      console.error('Failed to create track:', err)
      return fail(500, { error: 'Failed to create track', action: 'createTrack' })
    }
  },

  updateTrack: async ({ request, locals }) => {
    const formData = await request.formData()
    const id = formData.get('id') as string
    const name = formData.get('name') as string
    const color = formData.get('color') as string

    if (!id) {
      return fail(400, { error: 'Track ID is required', action: 'updateTrack' })
    }
    if (!name || name.trim().length === 0) {
      return fail(400, { error: 'Track name is required', action: 'updateTrack' })
    }

    try {
      await locals.pb.collection('tracks').update(id, {
        name: name.trim(),
        color: color || '#6b7280'
      })

      return { success: true, action: 'updateTrack' }
    } catch (err) {
      console.error('Failed to update track:', err)
      return fail(500, { error: 'Failed to update track', action: 'updateTrack' })
    }
  },

  deleteTrack: async ({ request, locals }) => {
    const formData = await request.formData()
    const id = formData.get('id') as string

    if (!id) {
      return fail(400, { error: 'Track ID is required', action: 'deleteTrack' })
    }

    try {
      // Check if track has sessions
      const sessions = await locals.pb.collection('sessions').getList(1, 1, {
        filter: `trackId = "${id}"`
      })

      if (sessions.items.length > 0) {
        return fail(400, {
          error: 'Cannot delete track with existing sessions. Remove track from sessions first.',
          action: 'deleteTrack'
        })
      }

      await locals.pb.collection('tracks').delete(id)
      return { success: true, action: 'deleteTrack' }
    } catch (err) {
      console.error('Failed to delete track:', err)
      return fail(500, { error: 'Failed to delete track', action: 'deleteTrack' })
    }
  },

  // ============ SLOTS ============
  createSlot: async ({ request, locals }) => {
    const formData = await request.formData()
    const roomId = formData.get('roomId') as string
    const date = formData.get('date') as string
    const startTime = formData.get('startTime') as string
    const endTime = formData.get('endTime') as string
    const editionId = formData.get('editionId') as string

    if (!roomId) {
      return fail(400, { error: 'Room is required', action: 'createSlot' })
    }
    if (!date) {
      return fail(400, { error: 'Date is required', action: 'createSlot' })
    }
    if (!startTime) {
      return fail(400, { error: 'Start time is required', action: 'createSlot' })
    }
    if (!endTime) {
      return fail(400, { error: 'End time is required', action: 'createSlot' })
    }
    if (startTime >= endTime) {
      return fail(400, { error: 'End time must be after start time', action: 'createSlot' })
    }

    try {
      // Check for overlapping slots
      const existingSlots = await locals.pb.collection('slots').getFullList({
        filter: `roomId = "${roomId}" && date ~ "${date}"`
      })

      for (const existing of existingSlots) {
        const existingStart = existing.startTime as string
        const existingEnd = existing.endTime as string
        if (startTime < existingEnd && endTime > existingStart) {
          return fail(400, {
            error: `Slot overlaps with existing slot (${existingStart} - ${existingEnd})`,
            action: 'createSlot'
          })
        }
      }

      await locals.pb.collection('slots').create({
        editionId,
        roomId,
        date: new Date(date).toISOString(),
        startTime,
        endTime
      })

      return { success: true, action: 'createSlot' }
    } catch (err) {
      console.error('Failed to create slot:', err)
      return fail(500, { error: 'Failed to create slot', action: 'createSlot' })
    }
  },

  updateSlot: async ({ request, locals }) => {
    const formData = await request.formData()
    const id = formData.get('id') as string
    const roomId = formData.get('roomId') as string
    const date = formData.get('date') as string
    const startTime = formData.get('startTime') as string
    const endTime = formData.get('endTime') as string

    if (!id) {
      return fail(400, { error: 'Slot ID is required', action: 'updateSlot' })
    }
    if (!roomId) {
      return fail(400, { error: 'Room is required', action: 'updateSlot' })
    }
    if (!date) {
      return fail(400, { error: 'Date is required', action: 'updateSlot' })
    }
    if (!startTime) {
      return fail(400, { error: 'Start time is required', action: 'updateSlot' })
    }
    if (!endTime) {
      return fail(400, { error: 'End time is required', action: 'updateSlot' })
    }
    if (startTime >= endTime) {
      return fail(400, { error: 'End time must be after start time', action: 'updateSlot' })
    }

    try {
      // Check for overlapping slots (excluding self)
      const existingSlots = await locals.pb.collection('slots').getFullList({
        filter: `roomId = "${roomId}" && date ~ "${date}" && id != "${id}"`
      })

      for (const existing of existingSlots) {
        const existingStart = existing.startTime as string
        const existingEnd = existing.endTime as string
        if (startTime < existingEnd && endTime > existingStart) {
          return fail(400, {
            error: `Slot overlaps with existing slot (${existingStart} - ${existingEnd})`,
            action: 'updateSlot'
          })
        }
      }

      await locals.pb.collection('slots').update(id, {
        roomId,
        date: new Date(date).toISOString(),
        startTime,
        endTime
      })

      return { success: true, action: 'updateSlot' }
    } catch (err) {
      console.error('Failed to update slot:', err)
      return fail(500, { error: 'Failed to update slot', action: 'updateSlot' })
    }
  },

  deleteSlot: async ({ request, locals }) => {
    const formData = await request.formData()
    const id = formData.get('id') as string

    if (!id) {
      return fail(400, { error: 'Slot ID is required', action: 'deleteSlot' })
    }

    try {
      // Check if slot has sessions
      const sessions = await locals.pb.collection('sessions').getList(1, 1, {
        filter: `slotId = "${id}"`
      })

      if (sessions.items.length > 0) {
        return fail(400, {
          error: 'Cannot delete slot with existing session. Remove session first.',
          action: 'deleteSlot'
        })
      }

      await locals.pb.collection('slots').delete(id)
      return { success: true, action: 'deleteSlot' }
    } catch (err) {
      console.error('Failed to delete slot:', err)
      return fail(500, { error: 'Failed to delete slot', action: 'deleteSlot' })
    }
  },

  // ============ SESSIONS ============
  createSession: async ({ request, locals }) => {
    const formData = await request.formData()
    const editionId = formData.get('editionId') as string
    const slotId = formData.get('slotId') as string
    const title = formData.get('title') as string
    const type = formData.get('type') as string
    const talkId = formData.get('talkId') as string | null
    const trackId = formData.get('trackId') as string | null
    const description = formData.get('description') as string | null

    // Validate required fields
    if (!editionId) {
      return fail(400, { error: 'Edition ID is required', action: 'createSession' })
    }
    if (!slotId) {
      return fail(400, { error: 'Slot is required', action: 'createSession' })
    }
    if (!title || title.trim().length === 0) {
      return fail(400, { error: 'Session title is required', action: 'createSession' })
    }
    if (!type) {
      return fail(400, { error: 'Session type is required', action: 'createSession' })
    }

    // Validate session type
    const validTypes = [
      'talk',
      'workshop',
      'keynote',
      'panel',
      'break',
      'lunch',
      'networking',
      'registration',
      'other'
    ]
    if (!validTypes.includes(type)) {
      return fail(400, { error: 'Invalid session type', action: 'createSession' })
    }

    try {
      // Check if slot already has a session
      const existingSessions = await locals.pb.collection('sessions').getList(1, 1, {
        filter: `slotId = "${slotId}"`
      })

      if (existingSessions.items.length > 0) {
        return fail(400, {
          error: 'This slot already has a session assigned. Delete the existing session first.',
          action: 'createSession'
        })
      }

      // If a talk is being assigned, check if it's already scheduled elsewhere
      if (talkId) {
        const talkSessions = await locals.pb.collection('sessions').getList(1, 1, {
          filter: `talkId = "${talkId}"`
        })

        if (talkSessions.items.length > 0) {
          return fail(400, {
            error: 'This talk is already scheduled in another session.',
            action: 'createSession'
          })
        }
      }

      // Create the session
      await locals.pb.collection('sessions').create({
        editionId,
        slotId,
        title: title.trim(),
        type,
        talkId: talkId || null,
        trackId: trackId || null,
        description: description?.trim() || null
      })

      return { success: true, action: 'createSession' }
    } catch (err) {
      console.error('Failed to create session:', err)
      return fail(500, { error: 'Failed to create session', action: 'createSession' })
    }
  },

  updateSession: async ({ request, locals }) => {
    const formData = await request.formData()
    const id = formData.get('id') as string
    const title = formData.get('title') as string
    const type = formData.get('type') as string
    const talkId = formData.get('talkId') as string | null
    const trackId = formData.get('trackId') as string | null
    const description = formData.get('description') as string | null

    // Validate required fields
    if (!id) {
      return fail(400, { error: 'Session ID is required', action: 'updateSession' })
    }
    if (!title || title.trim().length === 0) {
      return fail(400, { error: 'Session title is required', action: 'updateSession' })
    }
    if (!type) {
      return fail(400, { error: 'Session type is required', action: 'updateSession' })
    }

    // Validate session type
    const validTypes = [
      'talk',
      'workshop',
      'keynote',
      'panel',
      'break',
      'lunch',
      'networking',
      'registration',
      'other'
    ]
    if (!validTypes.includes(type)) {
      return fail(400, { error: 'Invalid session type', action: 'updateSession' })
    }

    try {
      // Get the current session to check for existing talk assignment
      const currentSession = await locals.pb.collection('sessions').getOne(id)

      // If assigning a new talk, check if it's already scheduled elsewhere
      if (talkId && talkId !== currentSession.talkId) {
        const talkSessions = await locals.pb.collection('sessions').getList(1, 1, {
          filter: `talkId = "${talkId}" && id != "${id}"`
        })

        if (talkSessions.items.length > 0) {
          return fail(400, {
            error: 'This talk is already scheduled in another session.',
            action: 'updateSession'
          })
        }
      }

      // Update the session
      await locals.pb.collection('sessions').update(id, {
        title: title.trim(),
        type,
        talkId: talkId || null,
        trackId: trackId || null,
        description: description?.trim() || null
      })

      return { success: true, action: 'updateSession' }
    } catch (err) {
      console.error('Failed to update session:', err)
      return fail(500, { error: 'Failed to update session', action: 'updateSession' })
    }
  },

  deleteSession: async ({ request, locals }) => {
    const formData = await request.formData()
    const id = formData.get('id') as string

    if (!id) {
      return fail(400, { error: 'Session ID is required', action: 'deleteSession' })
    }

    try {
      await locals.pb.collection('sessions').delete(id)
      return { success: true, action: 'deleteSession' }
    } catch (err) {
      console.error('Failed to delete session:', err)
      return fail(500, { error: 'Failed to delete session', action: 'deleteSession' })
    }
  },

  // ============ ROOM ASSIGNMENTS ============
  createRoomAssignment: async ({ request, locals }) => {
    const formData = await request.formData()
    const editionId = formData.get('editionId') as string
    const roomId = formData.get('roomId') as string
    const memberId = formData.get('memberId') as string
    const date = formData.get('date') as string | null
    const startTime = formData.get('startTime') as string | null
    const endTime = formData.get('endTime') as string | null
    const notes = formData.get('notes') as string | null

    if (!editionId) {
      return fail(400, { error: 'Edition ID is required', action: 'createRoomAssignment' })
    }
    if (!roomId) {
      return fail(400, { error: 'Room is required', action: 'createRoomAssignment' })
    }
    if (!memberId) {
      return fail(400, { error: 'Team member is required', action: 'createRoomAssignment' })
    }

    try {
      await locals.pb.collection('room_assignments').create({
        editionId,
        roomId,
        memberId,
        date: date ? new Date(date).toISOString() : null,
        startTime: startTime || null,
        endTime: endTime || null,
        notes: notes?.trim() || null
      })

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
    const id = formData.get('id') as string
    const memberId = formData.get('memberId') as string
    const date = formData.get('date') as string | null
    const startTime = formData.get('startTime') as string | null
    const endTime = formData.get('endTime') as string | null
    const notes = formData.get('notes') as string | null

    if (!id) {
      return fail(400, { error: 'Assignment ID is required', action: 'updateRoomAssignment' })
    }
    if (!memberId) {
      return fail(400, { error: 'Team member is required', action: 'updateRoomAssignment' })
    }

    try {
      await locals.pb.collection('room_assignments').update(id, {
        memberId,
        date: date ? new Date(date).toISOString() : null,
        startTime: startTime || null,
        endTime: endTime || null,
        notes: notes?.trim() || null
      })

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
    const id = formData.get('id') as string

    if (!id) {
      return fail(400, { error: 'Assignment ID is required', action: 'deleteRoomAssignment' })
    }

    try {
      await locals.pb.collection('room_assignments').delete(id)
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
