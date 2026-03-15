import {
  createManageSlotsUseCase,
  createSessionRepository,
  createSlotRepository
} from '$lib/features/planning'
import { fail } from '@sveltejs/kit'
import type { Actions } from './$types'

export const actions: Actions = {
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
  }
}
