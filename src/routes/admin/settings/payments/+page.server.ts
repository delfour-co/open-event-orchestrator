import {
  getHelloAssoSettings,
  getStripeSettings,
  maskStripeKey,
  saveHelloAssoSettings,
  saveStripeSettings,
  testHelloAssoConnection,
  testStripeConnection
} from '$lib/server/app-settings'
import { canAccessSettings } from '$lib/server/permissions'
import { error, fail } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

function maskKey(key: string): string {
  if (!key || key.length < 8) return '••••••••'
  return `${key.slice(0, 4)}••••••••${key.slice(-4)}`
}

export const load: PageServerLoad = async ({ locals }) => {
  if (!canAccessSettings(locals.user?.role)) {
    throw error(403, 'Access denied')
  }

  const [stripeSettings, helloassoSettings] = await Promise.all([
    getStripeSettings(locals.pb),
    getHelloAssoSettings(locals.pb)
  ])

  return {
    stripe: {
      hasSecretKey: !!stripeSettings.stripeSecretKey,
      secretKeyMasked: maskStripeKey(stripeSettings.stripeSecretKey),
      hasPublishableKey: !!stripeSettings.stripePublishableKey,
      publishableKeyMasked: maskStripeKey(stripeSettings.stripePublishableKey),
      hasWebhookSecret: !!stripeSettings.stripeWebhookSecret,
      webhookSecretMasked: maskStripeKey(stripeSettings.stripeWebhookSecret),
      stripeEnabled: stripeSettings.stripeEnabled,
      mode: stripeSettings.mode,
      isConfigured: stripeSettings.isConfigured,
      isLocalMock: stripeSettings.isLocalMock
    },
    helloasso: {
      hasClientId: !!helloassoSettings.helloassoClientId,
      clientIdMasked: maskKey(helloassoSettings.helloassoClientId),
      hasClientSecret: !!helloassoSettings.helloassoClientSecret,
      clientSecretMasked: maskKey(helloassoSettings.helloassoClientSecret),
      orgSlug: helloassoSettings.helloassoOrgSlug,
      helloassoEnabled: helloassoSettings.helloassoEnabled,
      helloassoSandbox: helloassoSettings.helloassoSandbox
    }
  }
}

export const actions: Actions = {
  saveStripe: async ({ request, locals }) => {
    if (!canAccessSettings(locals.user?.role)) {
      throw error(403, 'Access denied')
    }

    const formData = await request.formData()
    const stripeSecretKey = (formData.get('stripeSecretKey') as string)?.trim() || ''
    const stripePublishableKey = (formData.get('stripePublishableKey') as string)?.trim() || ''
    const stripeWebhookSecret = (formData.get('stripeWebhookSecret') as string)?.trim() || ''
    const stripeEnabled = formData.get('stripeEnabled') === 'true'

    // Get existing settings to preserve unchanged values
    const existing = await getStripeSettings(locals.pb)

    // Prepare settings, keeping existing values if new ones are empty
    const settings: {
      stripeSecretKey?: string
      stripePublishableKey?: string
      stripeWebhookSecret?: string
      stripeEnabled: boolean
    } = {
      stripeEnabled
    }

    // Only update keys if provided (non-empty)
    if (stripeSecretKey) {
      // Validate secret key format
      if (!stripeSecretKey.startsWith('sk_test_') && !stripeSecretKey.startsWith('sk_live_')) {
        return fail(400, {
          error: 'Invalid secret key format. Must start with sk_test_ or sk_live_',
          provider: 'stripe'
        })
      }
      settings.stripeSecretKey = stripeSecretKey
    }

    if (stripePublishableKey) {
      // Validate publishable key format
      if (
        !stripePublishableKey.startsWith('pk_test_') &&
        !stripePublishableKey.startsWith('pk_live_')
      ) {
        return fail(400, {
          error: 'Invalid publishable key format. Must start with pk_test_ or pk_live_',
          provider: 'stripe'
        })
      }
      settings.stripePublishableKey = stripePublishableKey
    }

    if (stripeWebhookSecret) {
      // Validate webhook secret format
      if (!stripeWebhookSecret.startsWith('whsec_')) {
        return fail(400, {
          error: 'Invalid webhook secret format. Must start with whsec_',
          provider: 'stripe'
        })
      }
      settings.stripeWebhookSecret = stripeWebhookSecret
    }

    // Check mode consistency
    const secretKeyToCheck = settings.stripeSecretKey || existing.stripeSecretKey
    const publishableKeyToCheck = settings.stripePublishableKey || existing.stripePublishableKey

    if (secretKeyToCheck && publishableKeyToCheck) {
      const secretMode = secretKeyToCheck.startsWith('sk_live_') ? 'live' : 'test'
      const publishableMode = publishableKeyToCheck.startsWith('pk_live_') ? 'live' : 'test'

      if (secretMode !== publishableMode) {
        return fail(400, {
          error: `Mode mismatch: secret key is ${secretMode} but publishable key is ${publishableMode}`,
          provider: 'stripe'
        })
      }
    }

    try {
      await saveStripeSettings(locals.pb, settings)
      return { success: true, action: 'save', provider: 'stripe' }
    } catch (err) {
      console.error('Failed to save Stripe settings:', err)
      return fail(500, { error: 'Failed to save settings', provider: 'stripe' })
    }
  },

  testStripe: async ({ request, locals }) => {
    if (!canAccessSettings(locals.user?.role)) {
      throw error(403, 'Access denied')
    }

    const formData = await request.formData()
    let secretKey = (formData.get('stripeSecretKey') as string)?.trim() || ''

    // If no key provided in form, use stored one
    if (!secretKey) {
      const existing = await getStripeSettings(locals.pb)
      secretKey = existing.stripeSecretKey
    }

    if (!secretKey) {
      return fail(400, {
        error: 'Secret key is required to test connection',
        action: 'test',
        provider: 'stripe'
      })
    }

    const existing = await getStripeSettings(locals.pb)
    const result = await testStripeConnection(secretKey, existing.stripeApiBase || undefined)

    if (result.success) {
      return {
        success: true,
        action: 'test',
        provider: 'stripe',
        message: result.message,
        accountId: result.accountId
      }
    }

    return fail(400, { error: result.message, action: 'test', provider: 'stripe' })
  },

  saveHelloAsso: async ({ request, locals }) => {
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
      return { success: true, action: 'save', provider: 'helloasso' }
    } catch (err) {
      console.error('Failed to save HelloAsso settings:', err)
      return fail(500, { error: 'Failed to save settings', provider: 'helloasso' })
    }
  },

  testHelloAsso: async ({ request, locals }) => {
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
        action: 'test',
        provider: 'helloasso'
      })
    }

    const result = await testHelloAssoConnection(clientId, clientSecret, orgSlug, sandbox)

    if (result.success) {
      return { success: true, action: 'test', provider: 'helloasso', message: result.message }
    }

    return fail(400, { error: result.message, action: 'test', provider: 'helloasso' })
  }
}
