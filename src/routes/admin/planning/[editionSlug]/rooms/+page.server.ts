import {
  createManageRoomsUseCase,
  createRoomRepository,
  createSlotRepository
} from '$lib/features/planning'
import { fail } from '@sveltejs/kit'
import type { Actions } from './$types'

export const actions: Actions = {
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
  }
}
