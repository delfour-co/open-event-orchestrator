import { createManageSessionsUseCase, createSessionRepository } from '$lib/features/planning'
import { fail } from '@sveltejs/kit'
import type { Actions } from './$types'

export const actions: Actions = {
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
  }
}
