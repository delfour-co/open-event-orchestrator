import {
  getHelloAssoSettings,
  getStripeSettings,
  isHelloAssoConfigured,
  isStripeConfigured
} from '$lib/server/app-settings'
import type PocketBase from 'pocketbase'
import { createHelloAssoApiClient } from '../helloasso/api-client'
import { createHelloAssoPaymentProvider } from '../helloasso/helloasso-provider'
import { createHelloAssoTokenManager } from '../helloasso/token-manager'
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
      const haSettings = await getHelloAssoSettings(pb)
      if (!isHelloAssoConfigured(haSettings)) {
        return createNoneProvider()
      }
      const tokenManager = createHelloAssoTokenManager(
        haSettings.helloassoClientId,
        haSettings.helloassoClientSecret,
        haSettings.helloassoApiBase
      )
      const apiClient = createHelloAssoApiClient(
        tokenManager,
        haSettings.helloassoOrgSlug,
        haSettings.helloassoApiBase
      )
      return createHelloAssoPaymentProvider(apiClient)
    }

    case 'none':
      return createNoneProvider()

    default:
      return createNoneProvider()
  }
}
