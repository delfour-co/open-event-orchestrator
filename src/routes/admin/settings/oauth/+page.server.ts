import { env } from '$env/dynamic/private'
import { env as publicEnv } from '$env/dynamic/public'
import { canAccessSettings } from '$lib/server/permissions'
import { error, fail } from '@sveltejs/kit'
import PocketBaseClient from 'pocketbase'
import type { Actions, PageServerLoad } from './$types'

async function getAdminPb(): Promise<PocketBaseClient> {
  const pb = new PocketBaseClient(publicEnv.PUBLIC_POCKETBASE_URL || 'http://localhost:8090')
  await pb
    .collection('_superusers')
    .authWithPassword(env.PB_ADMIN_EMAIL || '', env.PB_ADMIN_PASSWORD || '')
  return pb
}

export const load: PageServerLoad = async ({ locals }) => {
  if (!canAccessSettings(locals.user?.role)) {
    throw error(403, 'Access denied')
  }

  try {
    const adminPb = await getAdminPb()
    const settings = await adminPb.settings.getAll()

    // Extract OAuth2 provider configs (hide secrets)
    const providers = (settings.oauth2?.providers || []) as Array<{
      name: string
      clientId: string
      clientSecret: string
      enabled: boolean
    }>

    const google = providers.find((p) => p.name === 'google')
    const github = providers.find((p) => p.name === 'github')

    return {
      oauth2Enabled: settings.oauth2?.enabled ?? false,
      google: {
        clientId: google?.clientId || '',
        hasSecret: !!google?.clientSecret,
        enabled: !!google?.clientId
      },
      github: {
        clientId: github?.clientId || '',
        hasSecret: !!github?.clientSecret,
        enabled: !!github?.clientId
      }
    }
  } catch (err) {
    console.error('Failed to load OAuth2 settings:', err)
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
      const adminPb = await getAdminPb()
      const currentSettings = await adminPb.settings.getAll()
      const currentProviders = (currentSettings.oauth2?.providers || []) as Array<
        Record<string, unknown>
      >

      // Build providers array — keep existing providers, update google and github
      const providers: Array<Record<string, unknown>> = currentProviders.filter(
        (p) => p.name !== 'google' && p.name !== 'github'
      )

      if (googleClientId) {
        // If no new secret provided, keep the existing one
        const existingGoogle = currentProviders.find((p) => p.name === 'google')
        const secret = googleClientSecret || (existingGoogle?.clientSecret as string) || ''

        providers.push({
          name: 'google',
          displayName: 'Google',
          clientId: googleClientId,
          clientSecret: secret,
          authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
          tokenUrl: 'https://oauth2.googleapis.com/token',
          userApiUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
          pkce: true
        })
      }

      if (githubClientId) {
        const existingGithub = currentProviders.find((p) => p.name === 'github')
        const secret = githubClientSecret || (existingGithub?.clientSecret as string) || ''

        providers.push({
          name: 'github',
          displayName: 'GitHub',
          clientId: githubClientId,
          clientSecret: secret,
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

      return { success: true }
    } catch (err) {
      console.error('Failed to save OAuth2 settings:', err)
      return fail(500, { error: 'Failed to save OAuth2 settings' })
    }
  }
}
