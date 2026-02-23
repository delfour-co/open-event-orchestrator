import { createStripeService } from '../stripe-service'
import type {
  CheckoutResult,
  CreateCheckoutInput,
  PaymentEvent,
  PaymentProvider,
  RefundResult
} from './types'

export interface StripeProviderConfig {
  secretKey: string
  webhookSecret: string
  apiBase?: string
}

export const createStripePaymentProvider = (config: StripeProviderConfig): PaymentProvider => {
  const stripeService = createStripeService(config.secretKey, config.apiBase)

  return {
    type: 'stripe',

    async createCheckout(input: CreateCheckoutInput): Promise<CheckoutResult> {
      const result = await stripeService.createCheckoutSession({
        orderId: input.referenceId,
        orderNumber: input.referenceNumber,
        customerEmail: input.customerEmail,
        lineItems: input.lineItems.map((item) => ({
          name: item.name,
          unitAmount: item.unitAmount,
          quantity: item.quantity,
          currency: input.currency
        })),
        successUrl: input.successUrl,
        cancelUrl: input.cancelUrl,
        metadata: input.metadata
      })

      return {
        sessionId: result.sessionId,
        redirectUrl: result.url
      }
    },

    async createRefund(paymentReference: string): Promise<RefundResult> {
      const result = await stripeService.createRefund(paymentReference)
      return {
        refundId: result.refundId,
        status: 'succeeded'
      }
    },

    async parseWebhookEvent(request): Promise<PaymentEvent> {
      const signature = request.headers['stripe-signature']
      if (!signature) {
        throw new Error('Missing stripe-signature header')
      }

      const event = stripeService.constructWebhookEvent(
        request.body,
        signature,
        config.webhookSecret
      )

      const session = event.data.object as unknown as Record<string, unknown>
      const metadata = (session.metadata as Record<string, string>) || {}

      let paymentReference: string | undefined
      if (typeof session.payment_intent === 'string') {
        paymentReference = session.payment_intent
      } else if (
        session.payment_intent &&
        typeof (session.payment_intent as Record<string, unknown>).id === 'string'
      ) {
        paymentReference = (session.payment_intent as Record<string, unknown>).id as string
      }

      switch (event.type) {
        case 'checkout.session.completed':
          return {
            type: 'checkout.completed',
            eventId: event.id,
            metadata,
            paymentReference
          }
        case 'checkout.session.expired':
          return {
            type: 'checkout.expired',
            eventId: event.id,
            metadata
          }
        case 'charge.refunded':
          return {
            type: 'payment.refunded',
            eventId: event.id,
            metadata,
            paymentReference: (session.payment_intent as string) || undefined
          }
        default:
          throw new Error(`Unhandled Stripe event type: ${event.type}`)
      }
    }
  }
}
