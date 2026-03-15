import {
  createManageRoomAssignmentsUseCase,
  createRoomAssignmentRepository
} from '$lib/features/planning'
import { fail } from '@sveltejs/kit'
import type { Actions } from './$types'

export const actions: Actions = {
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
