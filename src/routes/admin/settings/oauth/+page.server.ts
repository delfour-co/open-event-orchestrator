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
      oauth2Enabled: record?.oauth2Enabled === true,
      google: {
        clientId: (record?.googleOAuthClientId as string) || '',
        hasSecret: !!(record?.googleOAuthClientSecret as string),
        enabled: !!(record?.googleOAuthClientId as string)
      },
      github: {
        clientId: (record?.githubOAuthClientId as string) || '',
        hasSecret: !!(record?.githubOAuthClientSecret as string),
        enabled: !!(record?.githubOAuthClientId as string)
      }
    }
  } catch {
    return {
      oauth2Enabled: false,
      google: { clientId: '', hasSecret: false, enabled: false },
      github: { clientId: '', hasSecret: false, enabled: false }
    }
  }
}

export const actions: Actions = {
  saveOAuth: async ({ request, locals }) => {
    if (!canAccessSettings(locals.user?.role)) {
      throw error(403, 'Access denied')
    }

    const formData = await request.formData()
    const oauth2Enabled = formData.get('oauth2Enabled') === 'true'
    const googleClientId = (formData.get('googleClientId') as string)?.trim() || ''
    const googleClientSecret = (formData.get('googleClientSecret') as string) || ''
    const githubClientId = (formData.get('githubClientId') as string)?.trim() || ''
    const githubClientSecret = (formData.get('githubClientSecret') as string) || ''

    try {
      const records = await locals.pb.collection('app_settings').getList(1, 1)

      // Build update data — only update secret if a new one was provided
      const data: Record<string, unknown> = {
        oauth2Enabled,
        googleOAuthClientId: googleClientId,
        githubOAuthClientId: githubClientId
      }

      if (googleClientSecret) {
        data.googleOAuthClientSecret = googleClientSecret
      }
      if (githubClientSecret) {
        data.githubOAuthClientSecret = githubClientSecret
      }

      if (records.items.length > 0) {
        await locals.pb.collection('app_settings').update(records.items[0].id, data)
      } else {
        if (!googleClientSecret) data.googleOAuthClientSecret = ''
        if (!githubClientSecret) data.githubOAuthClientSecret = ''
        await locals.pb.collection('app_settings').create(data)
      }

      return { success: true }
    } catch (err) {
      console.error('Failed to save OAuth2 settings:', err)
      return fail(500, { error: 'Failed to save OAuth2 settings' })
    }
  }
}
