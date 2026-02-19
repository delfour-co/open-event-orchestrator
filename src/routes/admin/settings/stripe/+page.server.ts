import {
  getStripeSettings,
  maskStripeKey,
  saveStripeSettings,
  testStripeConnection
} from '$lib/server/app-settings'
import { canAccessSettings } from '$lib/server/permissions'
import { error, fail } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
  if (!canAccessSettings(locals.user?.role)) {
    throw error(403, 'Access denied')
  }

  const settings = await getStripeSettings(locals.pb)

  return {
    stripe: {
      hasSecretKey: !!settings.stripeSecretKey,
      secretKeyMasked: maskStripeKey(settings.stripeSecretKey),
      hasPublishableKey: !!settings.stripePublishableKey,
      publishableKeyMasked: maskStripeKey(settings.stripePublishableKey),
      hasWebhookSecret: !!settings.stripeWebhookSecret,
      webhookSecretMasked: maskStripeKey(settings.stripeWebhookSecret),
      stripeEnabled: settings.stripeEnabled,
      mode: settings.mode,
      isConfigured: settings.isConfigured,
      isLocalMock: settings.isLocalMock
    }
  }
}

export const actions: Actions = {
  save: async ({ request, locals }) => {
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
          error: 'Invalid secret key format. Must start with sk_test_ or sk_live_'
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
          error: 'Invalid publishable key format. Must start with pk_test_ or pk_live_'
        })
      }
      settings.stripePublishableKey = stripePublishableKey
    }

    if (stripeWebhookSecret) {
      // Validate webhook secret format
      if (!stripeWebhookSecret.startsWith('whsec_')) {
        return fail(400, { error: 'Invalid webhook secret format. Must start with whsec_' })
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
          error: `Mode mismatch: secret key is ${secretMode} but publishable key is ${publishableMode}`
        })
      }
    }

    try {
      await saveStripeSettings(locals.pb, settings)
      return { success: true, action: 'save' }
    } catch (err) {
      console.error('Failed to save Stripe settings:', err)
      return fail(500, { error: 'Failed to save settings' })
    }
  },

  test: async ({ request, locals }) => {
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
      return fail(400, { error: 'Secret key is required to test connection', action: 'test' })
    }

    const existing = await getStripeSettings(locals.pb)
    const result = await testStripeConnection(secretKey, existing.stripeApiBase || undefined)

    if (result.success) {
      return {
        success: true,
        action: 'test',
        message: result.message,
        accountId: result.accountId
      }
    }

    return fail(400, { error: result.message, action: 'test' })
  }
}
