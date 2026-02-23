import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../stripe-service', () => ({
  createStripeService: vi.fn()
}))

import { createStripeService } from '../stripe-service'
import { createStripePaymentProvider } from './stripe-provider'

describe('stripe-provider', () => {
  const mockStripeService = {
    createCheckoutSession: vi.fn(),
    createRefund: vi.fn(),
    constructWebhookEvent: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createStripeService).mockReturnValue(mockStripeService as never)
  })

  const createProvider = () =>
    createStripePaymentProvider({
      secretKey: 'sk_test_123',
      webhookSecret: 'whsec_test_123'
    })

  it('should have type stripe', () => {
    const provider = createProvider()
    expect(provider.type).toBe('stripe')
  })

  describe('createCheckout', () => {
    it('should create a checkout session', async () => {
      mockStripeService.createCheckoutSession.mockResolvedValue({
        sessionId: 'cs_test_123',
        url: 'https://checkout.stripe.com/test'
      })

      const provider = createProvider()
      const result = await provider.createCheckout({
        referenceId: 'order-1',
        referenceNumber: 'ORD-001',
        customerEmail: 'test@example.com',
        lineItems: [{ name: 'Ticket', unitAmount: 5000, quantity: 2 }],
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
        metadata: { orderId: 'order-1' },
        currency: 'EUR'
      })

      expect(result.sessionId).toBe('cs_test_123')
      expect(result.redirectUrl).toBe('https://checkout.stripe.com/test')
      expect(mockStripeService.createCheckoutSession).toHaveBeenCalledOnce()
    })
  })

  describe('createRefund', () => {
    it('should create a refund', async () => {
      mockStripeService.createRefund.mockResolvedValue({
        refundId: 're_test_123'
      })

      const provider = createProvider()
      const result = await provider.createRefund('pi_test_123')

      expect(result.refundId).toBe('re_test_123')
      expect(result.status).toBe('succeeded')
    })
  })

  describe('parseWebhookEvent', () => {
    it('should parse checkout.session.completed', async () => {
      mockStripeService.constructWebhookEvent.mockReturnValue({
        id: 'evt_test_123',
        type: 'checkout.session.completed',
        data: {
          object: {
            metadata: { orderId: 'order-1' },
            payment_intent: 'pi_test_123'
          }
        }
      })

      const provider = createProvider()
      const event = await provider.parseWebhookEvent({
        body: '{}',
        headers: { 'stripe-signature': 'sig_test' }
      })

      expect(event.type).toBe('checkout.completed')
      expect(event.eventId).toBe('evt_test_123')
      expect(event.metadata.orderId).toBe('order-1')
      expect(event.paymentReference).toBe('pi_test_123')
    })

    it('should parse checkout.session.expired', async () => {
      mockStripeService.constructWebhookEvent.mockReturnValue({
        id: 'evt_test_456',
        type: 'checkout.session.expired',
        data: {
          object: {
            metadata: { orderId: 'order-2' }
          }
        }
      })

      const provider = createProvider()
      const event = await provider.parseWebhookEvent({
        body: '{}',
        headers: { 'stripe-signature': 'sig_test' }
      })

      expect(event.type).toBe('checkout.expired')
      expect(event.eventId).toBe('evt_test_456')
    })

    it('should parse charge.refunded', async () => {
      mockStripeService.constructWebhookEvent.mockReturnValue({
        id: 'evt_test_789',
        type: 'charge.refunded',
        data: {
          object: {
            metadata: {},
            payment_intent: 'pi_test_789'
          }
        }
      })

      const provider = createProvider()
      const event = await provider.parseWebhookEvent({
        body: '{}',
        headers: { 'stripe-signature': 'sig_test' }
      })

      expect(event.type).toBe('payment.refunded')
      expect(event.paymentReference).toBe('pi_test_789')
    })

    it('should throw on missing stripe-signature', async () => {
      const provider = createProvider()
      await expect(provider.parseWebhookEvent({ body: '{}', headers: {} })).rejects.toThrow(
        'Missing stripe-signature header'
      )
    })

    it('should throw on unhandled event type', async () => {
      mockStripeService.constructWebhookEvent.mockReturnValue({
        id: 'evt_test_unknown',
        type: 'unknown.event',
        data: { object: { metadata: {} } }
      })

      const provider = createProvider()
      await expect(
        provider.parseWebhookEvent({
          body: '{}',
          headers: { 'stripe-signature': 'sig_test' }
        })
      ).rejects.toThrow('Unhandled Stripe event type')
    })
  })
})
