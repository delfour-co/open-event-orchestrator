import type { PaymentProvider } from './types'

export const createNoneProvider = (): PaymentProvider => ({
  type: 'none',

  async createCheckout(): Promise<never> {
    throw new Error(
      'No payment provider configured. Please configure a payment provider in settings.'
    )
  },

  async createRefund(): Promise<never> {
    throw new Error('No payment provider configured. Cannot process refund.')
  },

  async parseWebhookEvent(): Promise<never> {
    throw new Error('No payment provider configured. Cannot parse webhook events.')
  }
})
