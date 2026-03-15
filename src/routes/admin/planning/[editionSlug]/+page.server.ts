import { createManageSessionsUseCase, createSessionRepository } from '$lib/features/planning'
import { fail } from '@sveltejs/kit'
import type { Actions } from './$types'

export const actions: Actions = {
  // ============ SESSIONS (create/update for schedule grid) ============
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

  // ============ DRAG & DROP ============
  moveSession: async ({ request, locals }) => {
    const formData = await request.formData()
    const sessionId = formData.get('sessionId') as string
    const targetSlotId = formData.get('targetSlotId') as string
    const sessionRepo = createSessionRepository(locals.pb)

    try {
      const existingSession = await sessionRepo.findBySlot(targetSlotId)
      if (existingSession) {
        return fail(400, {
          error: 'Target slot is already occupied. Remove the existing session first.',
          action: 'moveSession'
        })
      }

      const session = await sessionRepo.findById(sessionId)
      if (!session) {
        return fail(404, { error: 'Session not found', action: 'moveSession' })
      }

      await locals.pb.collection('sessions').update(sessionId, {
        slotId: targetSlotId
      })

      return { success: true, action: 'moveSession' }
    } catch (err) {
      console.error('Failed to move session:', err)
      return fail(500, { error: 'Failed to move session', action: 'moveSession' })
    }
  },

  swapSessions: async ({ request, locals }) => {
    const formData = await request.formData()
    const sessionId = formData.get('sessionId') as string
    const targetSlotId = formData.get('targetSlotId') as string
    const sessionRepo = createSessionRepository(locals.pb)

    try {
      const draggedSession = await sessionRepo.findById(sessionId)
      if (!draggedSession) {
        return fail(404, { error: 'Dragged session not found', action: 'swapSessions' })
      }

      const targetSession = await sessionRepo.findBySlot(targetSlotId)

      if (targetSession) {
        const originalSlotId = draggedSession.slotId
        await locals.pb.collection('sessions').update(targetSession.id, {
          slotId: originalSlotId
        })
      }

      await locals.pb.collection('sessions').update(sessionId, {
        slotId: targetSlotId
      })

      return { success: true, action: 'swapSessions' }
    } catch (err) {
      console.error('Failed to swap sessions:', err)
      return fail(500, { error: 'Failed to swap sessions', action: 'swapSessions' })
    }
  }
}
