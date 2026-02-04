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
    }))
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
  }
}
