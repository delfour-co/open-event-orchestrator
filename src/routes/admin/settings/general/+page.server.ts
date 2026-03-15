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
      appName: (record?.appName as string) || '',
      appUrl: (record?.appUrl as string) || ''
    }
  } catch {
    return {
      appName: '',
      appUrl: ''
    }
  }
}

export const actions: Actions = {
  save: async ({ request, locals }) => {
    if (!canAccessSettings(locals.user?.role)) {
      throw error(403, 'Access denied')
    }

    const formData = await request.formData()
    const appName = (formData.get('appName') as string)?.trim() || ''
    const appUrl = (formData.get('appUrl') as string)?.trim() || ''

    try {
      const records = await locals.pb.collection('app_settings').getList(1, 1)
      const data = { appName, appUrl }

      if (records.items.length > 0) {
        await locals.pb.collection('app_settings').update(records.items[0].id, data)
      } else {
        await locals.pb.collection('app_settings').create(data)
      }

      return { success: true }
    } catch (err) {
      console.error('Failed to save application settings:', err)
      return fail(500, { error: 'Failed to save settings' })
    }
  }
}
