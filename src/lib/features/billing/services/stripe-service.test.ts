import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CreateCheckoutSessionInput } from './stripe-service'
import { createStripeService } from './stripe-service'

// Mock Stripe
vi.mock('stripe', () => {
  const mockStripe = {
    checkout: {
      sessions: {
        create: vi.fn(),
        retrieve: vi.fn()
      }
    },
    refunds: {
      create: vi.fn()
    },
    webhooks: {
      constructEvent: vi.fn()
    }
  }
  return {
    default: vi.fn(() => mockStripe)
  }
})

import Stripe from 'stripe'

describe('StripeService', () => {
  let stripeService: ReturnType<typeof createStripeService>
  let mockStripeInstance: {
    checkout: {
      sessions: {
        create: ReturnType<typeof vi.fn>
        retrieve: ReturnType<typeof vi.fn>
      }
    }
    refunds: {
      create: ReturnType<typeof vi.fn>
    }
    webhooks: {
      constructEvent: ReturnType<typeof vi.fn>
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    stripeService = createStripeService('sk_test_secret_key')
    mockStripeInstance = vi.mocked(Stripe).mock.results[0].value as typeof mockStripeInstance
  })

  describe('createCheckoutSession', () => {
    const mockInput: CreateCheckoutSessionInput = {
      orderId: 'order-123',
      orderNumber: 'ORD-2025-001',
      customerEmail: 'customer@example.com',
      lineItems: [
        {
          name: 'Conference Ticket',
          unitAmount: 9900,
          quantity: 2,
          currency: 'EUR'
        }
      ],
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel'
    }

    it('should create a checkout session with correct parameters', async () => {
      mockStripeInstance.checkout.sessions.create.mockResolvedValue({
        id: 'cs_test_session_123',
        url: 'https://checkout.stripe.com/pay/cs_test_session_123'
      })

      const result = await stripeService.createCheckoutSession(mockInput)

      expect(result.sessionId).toBe('cs_test_session_123')
      expect(result.url).toBe('https://checkout.stripe.com/pay/cs_test_session_123')
      expect(mockStripeInstance.checkout.sessions.create).toHaveBeenCalledWith({
        payment_method_types: ['card'],
        mode: 'payment',
        customer_email: 'customer@example.com',
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: {
                name: 'Conference Ticket'
              },
              unit_amount: 9900
            },
            quantity: 2
          }
        ],
        metadata: {
          orderId: 'order-123',
          orderNumber: 'ORD-2025-001'
        },
        success_url: 'https://example.com/success',
        cancel_url: 'https://example.com/cancel'
      })
    })

    it('should handle multiple line items', async () => {
      const inputWithMultipleItems: CreateCheckoutSessionInput = {
        ...mockInput,
        lineItems: [
          { name: 'Conference Ticket', unitAmount: 9900, quantity: 1, currency: 'EUR' },
          { name: 'Workshop Pass', unitAmount: 4900, quantity: 1, currency: 'EUR' }
        ]
      }

      mockStripeInstance.checkout.sessions.create.mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/pay/cs_test_123'
      })

      await stripeService.createCheckoutSession(inputWithMultipleItems)

      expect(mockStripeInstance.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: expect.arrayContaining([
            expect.objectContaining({
              price_data: expect.objectContaining({
                product_data: { name: 'Conference Ticket' }
              })
            }),
            expect.objectContaining({
              price_data: expect.objectContaining({
                product_data: { name: 'Workshop Pass' }
              })
            })
          ])
        })
      )
    })

    it('should convert currency to lowercase', async () => {
      const inputWithUppercaseCurrency: CreateCheckoutSessionInput = {
        ...mockInput,
        lineItems: [{ name: 'Ticket', unitAmount: 1000, quantity: 1, currency: 'USD' }]
      }

      mockStripeInstance.checkout.sessions.create.mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/pay/cs_test_123'
      })

      await stripeService.createCheckoutSession(inputWithUppercaseCurrency)

      expect(mockStripeInstance.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: [
            expect.objectContaining({
              price_data: expect.objectContaining({
                currency: 'usd'
              })
            })
          ]
        })
      )
    })

    it('should return empty string when session URL is null', async () => {
      mockStripeInstance.checkout.sessions.create.mockResolvedValue({
        id: 'cs_test_no_url',
        url: null
      })

      const result = await stripeService.createCheckoutSession(mockInput)

      expect(result.url).toBe('')
    })
  })

  describe('retrieveSession', () => {
    it('should retrieve session with payment intent as string', async () => {
      mockStripeInstance.checkout.sessions.retrieve.mockResolvedValue({
        id: 'cs_test_123',
        status: 'complete',
        payment_intent: 'pi_test_intent_123',
        metadata: { orderId: 'order-123' }
      })

      const result = await stripeService.retrieveSession('cs_test_123')

      expect(result.status).toBe('complete')
      expect(result.paymentIntentId).toBe('pi_test_intent_123')
      expect(result.metadata).toEqual({ orderId: 'order-123' })
    })

    it('should retrieve session with payment intent as object', async () => {
      mockStripeInstance.checkout.sessions.retrieve.mockResolvedValue({
        id: 'cs_test_123',
        status: 'complete',
        payment_intent: { id: 'pi_test_object_123' },
        metadata: {}
      })

      const result = await stripeService.retrieveSession('cs_test_123')

      expect(result.paymentIntentId).toBe('pi_test_object_123')
    })

    it('should return null paymentIntentId when not present', async () => {
      mockStripeInstance.checkout.sessions.retrieve.mockResolvedValue({
        id: 'cs_test_123',
        status: 'open',
        payment_intent: null,
        metadata: {}
      })

      const result = await stripeService.retrieveSession('cs_test_123')

      expect(result.paymentIntentId).toBeNull()
    })

    it('should return unknown status when status is undefined', async () => {
      mockStripeInstance.checkout.sessions.retrieve.mockResolvedValue({
        id: 'cs_test_123',
        status: undefined,
        payment_intent: null,
        metadata: {}
      })

      const result = await stripeService.retrieveSession('cs_test_123')

      expect(result.status).toBe('unknown')
    })

    it('should return empty metadata when null', async () => {
      mockStripeInstance.checkout.sessions.retrieve.mockResolvedValue({
        id: 'cs_test_123',
        status: 'complete',
        payment_intent: 'pi_123',
        metadata: null
      })

      const result = await stripeService.retrieveSession('cs_test_123')

      expect(result.metadata).toEqual({})
    })
  })

  describe('createRefund', () => {
    it('should create a refund for a payment intent', async () => {
      mockStripeInstance.refunds.create.mockResolvedValue({
        id: 're_test_refund_123',
        status: 'succeeded'
      })

      const result = await stripeService.createRefund('pi_test_intent_123')

      expect(result.refundId).toBe('re_test_refund_123')
      expect(mockStripeInstance.refunds.create).toHaveBeenCalledWith({
        payment_intent: 'pi_test_intent_123'
      })
    })
  })

  describe('constructWebhookEvent', () => {
    it('should construct webhook event from payload and signature', () => {
      const mockEvent = {
        id: 'evt_test_123',
        type: 'checkout.session.completed',
        data: { object: {} }
      }
      mockStripeInstance.webhooks.constructEvent.mockReturnValue(mockEvent)

      const result = stripeService.constructWebhookEvent(
        '{"test":"payload"}',
        'whsec_test_signature',
        'whsec_test_secret'
      )

      expect(result).toEqual(mockEvent)
      expect(mockStripeInstance.webhooks.constructEvent).toHaveBeenCalledWith(
        '{"test":"payload"}',
        'whsec_test_signature',
        'whsec_test_secret'
      )
    })

    it('should handle Buffer payload', () => {
      const mockEvent = { id: 'evt_test_123', type: 'checkout.session.completed' }
      mockStripeInstance.webhooks.constructEvent.mockReturnValue(mockEvent)
      const bufferPayload = Buffer.from('{"test":"payload"}')

      const result = stripeService.constructWebhookEvent(
        bufferPayload,
        'whsec_signature',
        'whsec_secret'
      )

      expect(result).toEqual(mockEvent)
    })

    it('should throw on invalid signature', () => {
      mockStripeInstance.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Webhook signature verification failed')
      })

      expect(() => stripeService.constructWebhookEvent('payload', 'invalid_sig', 'secret')).toThrow(
        'Webhook signature verification failed'
      )
    })
  })
})
