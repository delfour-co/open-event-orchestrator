import {
  getHelloAssoSettings,
  saveHelloAssoSettings,
  testHelloAssoConnection
} from '$lib/server/app-settings'
import { canAccessSettings } from '$lib/server/permissions'
import { error, fail } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
  if (!canAccessSettings(locals.user?.role)) {
    throw error(403, 'Access denied')
  }

  const settings = await getHelloAssoSettings(locals.pb)

  return {
    helloasso: {
      hasClientId: !!settings.helloassoClientId,
      clientIdMasked: maskKey(settings.helloassoClientId),
      hasClientSecret: !!settings.helloassoClientSecret,
      clientSecretMasked: maskKey(settings.helloassoClientSecret),
      orgSlug: settings.helloassoOrgSlug,
      helloassoEnabled: settings.helloassoEnabled,
      helloassoSandbox: settings.helloassoSandbox
    }
  }
}

function maskKey(key: string): string {
  if (!key || key.length < 8) return '••••••••'
  return `${key.slice(0, 4)}••••••••${key.slice(-4)}`
}

export const actions: Actions = {
  save: async ({ request, locals }) => {
    if (!canAccessSettings(locals.user?.role)) {
      throw error(403, 'Access denied')
    }

    const formData = await request.formData()
    const helloassoClientId = (formData.get('helloassoClientId') as string)?.trim() || ''
    const helloassoClientSecret = (formData.get('helloassoClientSecret') as string)?.trim() || ''
    const helloassoOrgSlug = (formData.get('helloassoOrgSlug') as string)?.trim() || ''
    const helloassoEnabled = formData.get('helloassoEnabled') === 'true'
    const helloassoSandbox = formData.get('helloassoSandbox') === 'true'

    const settings: Partial<{
      helloassoClientId: string
      helloassoClientSecret: string
      helloassoOrgSlug: string
      helloassoEnabled: boolean
      helloassoSandbox: boolean
    }> = {
      helloassoEnabled,
      helloassoSandbox
    }

    if (helloassoClientId) settings.helloassoClientId = helloassoClientId
    if (helloassoClientSecret) settings.helloassoClientSecret = helloassoClientSecret
    if (helloassoOrgSlug) settings.helloassoOrgSlug = helloassoOrgSlug

    try {
      await saveHelloAssoSettings(locals.pb, settings)
      return { success: true, action: 'save' }
    } catch (err) {
      console.error('Failed to save HelloAsso settings:', err)
      return fail(500, { error: 'Failed to save settings' })
    }
  },

  test: async ({ request, locals }) => {
    if (!canAccessSettings(locals.user?.role)) {
      throw error(403, 'Access denied')
    }

    const formData = await request.formData()
    let clientId = (formData.get('helloassoClientId') as string)?.trim() || ''
    let clientSecret = (formData.get('helloassoClientSecret') as string)?.trim() || ''
    let orgSlug = (formData.get('helloassoOrgSlug') as string)?.trim() || ''
    const sandbox = (formData.get('helloassoSandbox') as string) !== 'false'

    // Fallback to stored settings
    if (!clientId || !clientSecret || !orgSlug) {
      const existing = await getHelloAssoSettings(locals.pb)
      clientId = clientId || existing.helloassoClientId
      clientSecret = clientSecret || existing.helloassoClientSecret
      orgSlug = orgSlug || existing.helloassoOrgSlug
    }

    if (!clientId || !clientSecret || !orgSlug) {
      return fail(400, {
        error: 'Client ID, Client Secret, and Organization Slug are required',
        action: 'test'
      })
    }

    const result = await testHelloAssoConnection(clientId, clientSecret, orgSlug, sandbox)

    if (result.success) {
      return { success: true, action: 'test', message: result.message }
    }

    return fail(400, { error: result.message, action: 'test' })
  }
}
