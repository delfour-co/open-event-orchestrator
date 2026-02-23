export type PaymentProviderType = 'stripe' | 'helloasso' | 'none'

export interface CreateCheckoutInput {
  referenceId: string
  referenceNumber: string
  customerEmail: string
  lineItems: PaymentLineItem[]
  successUrl: string
  cancelUrl: string
  metadata: Record<string, string>
  currency: string
}

export interface PaymentLineItem {
  name: string
  unitAmount: number
  quantity: number
}

export interface CheckoutResult {
  sessionId: string
  redirectUrl: string
  expiresAt?: Date
}

export interface RefundResult {
  refundId: string
  status: 'succeeded' | 'pending' | 'failed'
}

export interface PaymentEvent {
  type: 'checkout.completed' | 'checkout.expired' | 'payment.refunded'
  eventId: string
  metadata: Record<string, string>
  paymentReference?: string
}

export interface PaymentProvider {
  readonly type: PaymentProviderType
  createCheckout(input: CreateCheckoutInput): Promise<CheckoutResult>
  createRefund(paymentReference: string): Promise<RefundResult>
  parseWebhookEvent(request: {
    body: string | Buffer
    headers: Record<string, string>
  }): Promise<PaymentEvent>
}
