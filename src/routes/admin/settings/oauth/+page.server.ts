import { env as publicEnv } from '$env/dynamic/public'
import { canAccessSettings } from '$lib/server/permissions'
import { error, fail } from '@sveltejs/kit'
import PocketBaseClient from 'pocketbase'
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
    const pbAdminEmail = (formData.get('pbAdminEmail') as string)?.trim() || ''
    const pbAdminPassword = (formData.get('pbAdminPassword') as string) || ''

    try {
      // Save to app_settings (for our getAvailableProviders to read)
      const records = await locals.pb.collection('app_settings').getList(1, 1)
      const data: Record<string, unknown> = {
        oauth2Enabled,
        googleOAuthClientId: googleClientId,
        githubOAuthClientId: githubClientId
      }
      if (googleClientSecret) data.googleOAuthClientSecret = googleClientSecret
      if (githubClientSecret) data.githubOAuthClientSecret = githubClientSecret

      if (records.items.length > 0) {
        await locals.pb.collection('app_settings').update(records.items[0].id, data)
      } else {
        if (!googleClientSecret) data.googleOAuthClientSecret = ''
        if (!githubClientSecret) data.githubOAuthClientSecret = ''
        await locals.pb.collection('app_settings').create(data)
      }

      // Sync to PocketBase internal settings (requires PB superuser auth)
      if (pbAdminEmail && pbAdminPassword) {
        try {
          const adminPb = new PocketBaseClient(
            publicEnv.PUBLIC_POCKETBASE_URL || 'http://localhost:8090'
          )

          await adminPb.collection('_superusers').authWithPassword(pbAdminEmail, pbAdminPassword)

          // Get current PB settings
          const currentSettings = await adminPb.settings.getAll()
          const currentProviders = (currentSettings.oauth2?.providers || []) as Array<
            Record<string, unknown>
          >

          // Build providers array
          const providers: Array<Record<string, unknown>> = currentProviders.filter(
            (p) => p.name !== 'google' && p.name !== 'github'
          )

          // Get final secrets (new or existing from app_settings)
          const updatedRecords = await locals.pb.collection('app_settings').getList(1, 1)
          const updatedRecord = updatedRecords.items[0]

          if (googleClientId) {
            providers.push({
              name: 'google',
              displayName: 'Google',
              clientId: googleClientId,
              clientSecret: (updatedRecord?.googleOAuthClientSecret as string) || '',
              authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
              tokenUrl: 'https://oauth2.googleapis.com/token',
              userApiUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
              pkce: true
            })
          }

          if (githubClientId) {
            providers.push({
              name: 'github',
              displayName: 'GitHub',
              clientId: githubClientId,
              clientSecret: (updatedRecord?.githubOAuthClientSecret as string) || '',
              authUrl: 'https://github.com/login/oauth/authorize',
              tokenUrl: 'https://github.com/login/oauth/access_token',
              userApiUrl: 'https://api.github.com/user'
            })
          }

          await adminPb.settings.update({
            oauth2: {
              enabled: oauth2Enabled,
              providers
            }
          })
        } catch (err) {
          console.error('Failed to sync OAuth to PocketBase:', err)
          return fail(400, {
            error: 'Settings saved but PocketBase sync failed. Check your PB superuser password.',
            success: false
          })
        }
      }

      return { success: true }
    } catch (err) {
      console.error('Failed to save OAuth2 settings:', err)
      return fail(500, { error: 'Failed to save OAuth2 settings' })
    }
  }
}
