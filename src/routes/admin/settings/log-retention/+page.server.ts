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
      auditLogRetentionDays: (record?.auditLogRetentionDays as number) || 90,
      apiLogRetentionDays: (record?.apiLogRetentionDays as number) || 30
    }
  } catch {
    return {
      auditLogRetentionDays: 90,
      apiLogRetentionDays: 30
    }
  }
}

export const actions: Actions = {
  save: async ({ request, locals }) => {
    if (!canAccessSettings(locals.user?.role)) {
      throw error(403, 'Access denied')
    }

    const formData = await request.formData()
    const auditLogRetentionDays = Number.parseInt(
      (formData.get('auditLogRetentionDays') as string) || '90',
      10
    )
    const apiLogRetentionDays = Number.parseInt(
      (formData.get('apiLogRetentionDays') as string) || '30',
      10
    )

    if (auditLogRetentionDays < 1) {
      return fail(400, { error: 'Audit log retention must be at least 1 day' })
    }

    if (apiLogRetentionDays < 1) {
      return fail(400, { error: 'API log retention must be at least 1 day' })
    }

    try {
      const records = await locals.pb.collection('app_settings').getList(1, 1)
      const data: Record<string, unknown> = {
        auditLogRetentionDays,
        apiLogRetentionDays
      }

      if (records.items.length > 0) {
        await locals.pb.collection('app_settings').update(records.items[0].id, data)
      } else {
        await locals.pb.collection('app_settings').create(data)
      }

      return { success: true }
    } catch (err) {
      console.error('Failed to save log retention settings:', err)
      return fail(500, { error: 'Failed to save log retention settings' })
    }
  }
}
