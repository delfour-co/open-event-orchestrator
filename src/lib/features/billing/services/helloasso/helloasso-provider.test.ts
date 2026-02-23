import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { HelloAssoApiClient } from './api-client'
import { createHelloAssoPaymentProvider } from './helloasso-provider'

describe('helloasso-provider', () => {
  const mockApiClient: HelloAssoApiClient = {
    createCheckoutIntent: vi.fn(),
    getCheckoutIntent: vi.fn(),
    getOrder: vi.fn(),
    getPayment: vi.fn(),
    refundPayment: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  const createProvider = () => createHelloAssoPaymentProvider(mockApiClient)

  it('should have type helloasso', () => {
    const provider = createProvider()
    expect(provider.type).toBe('helloasso')
  })

  describe('createCheckout', () => {
    it('should create a checkout intent', async () => {
      vi.mocked(mockApiClient.createCheckoutIntent).mockResolvedValue({
        id: 12345,
        redirectUrl: 'https://www.helloasso.com/checkout/test'
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

      expect(result.sessionId).toBe('12345')
      expect(result.redirectUrl).toBe('https://www.helloasso.com/checkout/test')
    })

    it('should reject non-EUR currency', async () => {
      const provider = createProvider()
      await expect(
        provider.createCheckout({
          referenceId: 'order-1',
          referenceNumber: 'ORD-001',
          customerEmail: 'test@example.com',
          lineItems: [{ name: 'Ticket', unitAmount: 5000, quantity: 1 }],
          successUrl: 'https://example.com/success',
          cancelUrl: 'https://example.com/cancel',
          metadata: {},
          currency: 'USD'
        })
      ).rejects.toThrow('HelloAsso only supports EUR currency')
    })
  })

  describe('createRefund', () => {
    it('should create a refund', async () => {
      vi.mocked(mockApiClient.getPayment).mockResolvedValue({
        id: 123,
        amount: 5000,
        state: 'Authorized'
      } as never)
      vi.mocked(mockApiClient.refundPayment).mockResolvedValue(undefined as never)

      const provider = createProvider()
      const result = await provider.createRefund('123')

      expect(result.refundId).toBe('ha-refund-123')
      expect(result.status).toBe('pending')
    })

    it('should reject invalid payment reference', async () => {
      const provider = createProvider()
      await expect(provider.createRefund('not-a-number')).rejects.toThrow(
        'Invalid HelloAsso payment reference'
      )
    })
  })

  describe('parseWebhookEvent', () => {
    it('should parse Payment event', async () => {
      vi.mocked(mockApiClient.getPayment).mockResolvedValue({
        id: 456,
        amount: 5000,
        state: 'Authorized'
      } as never)

      const provider = createProvider()
      const event = await provider.parseWebhookEvent({
        body: JSON.stringify({
          eventType: 'Payment',
          data: { id: 456, metadata: { orderId: 'order-1' } }
        }),
        headers: {}
      })

      expect(event.type).toBe('checkout.completed')
      expect(event.eventId).toBe('ha-payment-456')
      expect(event.metadata.orderId).toBe('order-1')
      expect(event.paymentReference).toBe('456')
    })

    it('should parse Order event', async () => {
      vi.mocked(mockApiClient.getOrder).mockResolvedValue({
        id: 789,
        formSlug: 'test',
        formType: 'Checkout',
        payments: []
      } as never)

      const provider = createProvider()
      const event = await provider.parseWebhookEvent({
        body: JSON.stringify({
          eventType: 'Order',
          data: { id: 789, metadata: {} }
        }),
        headers: {}
      })

      expect(event.type).toBe('checkout.completed')
      expect(event.eventId).toBe('ha-order-789')
    })

    it('should parse PaymentRefund event', async () => {
      const provider = createProvider()
      const event = await provider.parseWebhookEvent({
        body: JSON.stringify({
          eventType: 'PaymentRefund',
          data: { id: 456, metadata: {} }
        }),
        headers: {}
      })

      expect(event.type).toBe('payment.refunded')
      expect(event.eventId).toBe('ha-refund-456')
    })

    it('should throw on unhandled event type', async () => {
      const provider = createProvider()
      await expect(
        provider.parseWebhookEvent({
          body: JSON.stringify({
            eventType: 'Unknown',
            data: { metadata: {} }
          }),
          headers: {}
        })
      ).rejects.toThrow('Unhandled HelloAsso event type')
    })

    it('should throw when API verification fails', async () => {
      vi.mocked(mockApiClient.getPayment).mockRejectedValue(new Error('Not found'))

      const provider = createProvider()
      await expect(
        provider.parseWebhookEvent({
          body: JSON.stringify({
            eventType: 'Payment',
            data: { id: 999, metadata: {} }
          }),
          headers: {}
        })
      ).rejects.toThrow('HelloAsso webhook verification failed')
    })
  })
})
