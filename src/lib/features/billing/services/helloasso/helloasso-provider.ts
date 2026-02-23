import type {
  CheckoutResult,
  CreateCheckoutInput,
  PaymentEvent,
  PaymentProvider,
  RefundResult
} from '../payment-providers/types'
import type { HelloAssoApiClient } from './api-client'

export const createHelloAssoPaymentProvider = (
  apiClient: HelloAssoApiClient
): PaymentProvider => ({
  type: 'helloasso',

  async createCheckout(input: CreateCheckoutInput): Promise<CheckoutResult> {
    if (input.currency.toUpperCase() !== 'EUR') {
      throw new Error('HelloAsso only supports EUR currency')
    }

    const totalAmount = input.lineItems.reduce(
      (sum, item) => sum + item.unitAmount * item.quantity,
      0
    )

    const itemName = input.lineItems.map((i) => i.name).join(', ')

    const result = await apiClient.createCheckoutIntent({
      totalAmount,
      itemName,
      backUrl: input.cancelUrl,
      errorUrl: input.cancelUrl,
      returnUrl: input.successUrl,
      containsDonation: false,
      payer: { email: input.customerEmail },
      metadata: input.metadata
    })

    return {
      sessionId: String(result.id),
      redirectUrl: result.redirectUrl
    }
  },

  async createRefund(paymentReference: string): Promise<RefundResult> {
    const paymentId = Number(paymentReference)
    if (Number.isNaN(paymentId)) {
      throw new Error(`Invalid HelloAsso payment reference: ${paymentReference}`)
    }

    const payment = await apiClient.getPayment(paymentId)
    await apiClient.refundPayment(paymentId, payment.amount)

    return {
      refundId: `ha-refund-${paymentId}`,
      status: 'pending'
    }
  },

  async parseWebhookEvent(request): Promise<PaymentEvent> {
    const payload =
      typeof request.body === 'string' ? JSON.parse(request.body) : JSON.parse(request.body.toString())

    const eventType = payload.eventType as string
    const data = payload.data as Record<string, unknown>

    // HelloAsso doesn't use HMAC signatures — we verify via API call
    const metadata = (data.metadata as Record<string, string>) || {}
    const paymentId = data.id ? String(data.id) : undefined

    // Verify the payment/order via API before trusting the webhook
    if (paymentId && (eventType === 'Payment' || eventType === 'Order')) {
      try {
        if (eventType === 'Payment') {
          await apiClient.getPayment(Number(paymentId))
        } else {
          await apiClient.getOrder(Number(paymentId))
        }
      } catch {
        throw new Error(`HelloAsso webhook verification failed for ${eventType} #${paymentId}`)
      }
    }

    switch (eventType) {
      case 'Payment':
      case 'Order':
        return {
          type: 'checkout.completed',
          eventId: `ha-${eventType.toLowerCase()}-${paymentId || Date.now()}`,
          metadata,
          paymentReference: paymentId
        }
      case 'PaymentRefund':
        return {
          type: 'payment.refunded',
          eventId: `ha-refund-${paymentId || Date.now()}`,
          metadata,
          paymentReference: paymentId
        }
      default:
        throw new Error(`Unhandled HelloAsso event type: ${eventType}`)
    }
  }
})
