import Stripe from 'stripe'

export interface CheckoutLineItem {
  name: string
  unitAmount: number
  quantity: number
  currency: string
}

export interface CreateCheckoutSessionInput {
  orderId: string
  orderNumber: string
  customerEmail: string
  lineItems: CheckoutLineItem[]
  successUrl: string
  cancelUrl: string
  metadata?: Record<string, string>
}

export interface CheckoutSessionResult {
  sessionId: string
  url: string
}

export const createStripeService = (secretKey: string, apiBase?: string) => {
  const opts: Stripe.StripeConfig = {}
  if (apiBase) {
    const url = new URL(apiBase)
    opts.host = url.hostname
    opts.port = Number(url.port) || undefined
    opts.protocol = url.protocol.replace(':', '') as 'http' | 'https'
  }
  const stripe = new Stripe(secretKey, opts)

  return {
    async createCheckoutSession(input: CreateCheckoutSessionInput): Promise<CheckoutSessionResult> {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        customer_email: input.customerEmail,
        line_items: input.lineItems.map((item) => ({
          price_data: {
            currency: item.currency.toLowerCase(),
            product_data: {
              name: item.name
            },
            unit_amount: item.unitAmount
          },
          quantity: item.quantity
        })),
        metadata: {
          orderId: input.orderId,
          orderNumber: input.orderNumber,
          ...input.metadata
        },
        success_url: input.successUrl,
        cancel_url: input.cancelUrl
      })

      return {
        sessionId: session.id,
        url: session.url || ''
      }
    },

    async retrieveSession(sessionId: string): Promise<{
      status: string
      paymentIntentId: string | null
      metadata: Record<string, string>
    }> {
      const session = await stripe.checkout.sessions.retrieve(sessionId)
      return {
        status: session.status || 'unknown',
        paymentIntentId:
          typeof session.payment_intent === 'string'
            ? session.payment_intent
            : session.payment_intent?.id || null,
        metadata: (session.metadata as Record<string, string>) || {}
      }
    },

    async createRefund(paymentIntentId: string): Promise<{ refundId: string }> {
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId
      })
      return { refundId: refund.id }
    },

    constructWebhookEvent(
      payload: string | Buffer,
      signature: string,
      webhookSecret: string
    ): Stripe.Event {
      return stripe.webhooks.constructEvent(payload, signature, webhookSecret)
    }
  }
}

export type StripeService = ReturnType<typeof createStripeService>
