import { canAccessSettings } from '$lib/server/permissions'
import { error, fail } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
  if (!canAccessSettings(locals.user?.role)) {
    throw error(403, 'Access denied')
  }

  try {
    const records = await locals.pb.collection('app_settings').getList(1, 1)
    const record = records.items[0]

    return {
      rateLimitRequests: (record?.rateLimitRequests as number) || 100,
      rateLimitWindowSeconds: (record?.rateLimitWindowSeconds as number) || 60
    }
  } catch {
    return {
      rateLimitRequests: 100,
      rateLimitWindowSeconds: 60
    }
  }
}

export const actions: Actions = {
  save: async ({ request, locals }) => {
    if (!canAccessSettings(locals.user?.role)) {
      throw error(403, 'Access denied')
    }

    const formData = await request.formData()
    const rateLimitRequests = Number.parseInt(
      (formData.get('rateLimitRequests') as string) || '100',
      10
    )
    const rateLimitWindowSeconds = Number.parseInt(
      (formData.get('rateLimitWindowSeconds') as string) || '60',
      10
    )

    if (rateLimitRequests < 1) {
      return fail(400, { error: 'Requests per window must be at least 1' })
    }

    if (rateLimitWindowSeconds < 1) {
      return fail(400, { error: 'Window duration must be at least 1 second' })
    }

    try {
      const records = await locals.pb.collection('app_settings').getList(1, 1)
      const data: Record<string, unknown> = {
        rateLimitRequests,
        rateLimitWindowSeconds
      }

      if (records.items.length > 0) {
        await locals.pb.collection('app_settings').update(records.items[0].id, data)
      } else {
        await locals.pb.collection('app_settings').create(data)
      }

      return { success: true }
    } catch (err) {
      console.error('Failed to save rate limiting settings:', err)
      return fail(500, { error: 'Failed to save rate limiting settings' })
    }
  }
}
