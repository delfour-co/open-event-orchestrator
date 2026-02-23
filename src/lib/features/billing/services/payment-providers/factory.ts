import { getStripeSettings, isStripeConfigured } from '$lib/server/app-settings'
import type PocketBase from 'pocketbase'
import { createNoneProvider } from './none-provider'
import { createStripePaymentProvider } from './stripe-provider'
import type { PaymentProvider, PaymentProviderType } from './types'

export async function getActivePaymentProviderType(pb: PocketBase): Promise<PaymentProviderType> {
  try {
    const records = await pb.collection('app_settings').getList(1, 1)
    if (records.items.length > 0) {
      const provider = records.items[0].activePaymentProvider as string
      if (provider === 'helloasso' || provider === 'stripe' || provider === 'none') {
        return provider
      }
    }
  } catch {
    // Fall through to default
  }
  return 'stripe'
}

export async function getPaymentProvider(pb: PocketBase): Promise<PaymentProvider> {
  const providerType = await getActivePaymentProviderType(pb)

  switch (providerType) {
    case 'stripe': {
      const stripeSettings = await getStripeSettings(pb)
      if (!isStripeConfigured(stripeSettings)) {
        return createNoneProvider()
      }
      return createStripePaymentProvider({
        secretKey: stripeSettings.stripeSecretKey,
        webhookSecret: stripeSettings.stripeWebhookSecret,
        apiBase: stripeSettings.stripeApiBase || undefined
      })
    }

    case 'helloasso': {
      // HelloAsso provider will be implemented in Phase 3
      throw new Error('HelloAsso provider not yet implemented')
    }

    case 'none':
      return createNoneProvider()

    default:
      return createNoneProvider()
  }
}
