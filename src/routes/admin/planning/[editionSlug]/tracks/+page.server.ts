import {
  createManageTracksUseCase,
  createSessionRepository,
  createTrackRepository
} from '$lib/features/planning'
import { fail } from '@sveltejs/kit'
import type { Actions } from './$types'

export const actions: Actions = {
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
  }
}
