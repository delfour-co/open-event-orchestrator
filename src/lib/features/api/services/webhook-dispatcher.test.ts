import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Webhook, WebhookDelivery, WebhookEventType } from '../domain'
import { createWebhookDispatcher } from './webhook-dispatcher'

// Mock the repository modules
vi.mock('../infra/webhook-repository', () => ({
  createWebhookRepository: vi.fn()
}))

vi.mock('../infra/webhook-delivery-repository', () => ({
  createWebhookDeliveryRepository: vi.fn()
}))

// Mock fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

import { createWebhookDeliveryRepository } from '../infra/webhook-delivery-repository'
import { createWebhookRepository } from '../infra/webhook-repository'

describe('WebhookDispatcher', () => {
  let mockPb: unknown
  let mockWebhookRepo: {
    findById: ReturnType<typeof vi.fn>
    findByScope: ReturnType<typeof vi.fn>
  }
  let mockDeliveryRepo: {
    create: ReturnType<typeof vi.fn>
    findById: ReturnType<typeof vi.fn>
    findByWebhook: ReturnType<typeof vi.fn>
    findPendingRetries: ReturnType<typeof vi.fn>
    markDelivered: ReturnType<typeof vi.fn>
    markFailed: ReturnType<typeof vi.fn>
    countByWebhook: ReturnType<typeof vi.fn>
    updateResult: ReturnType<typeof vi.fn>
  }
  let dispatcher: ReturnType<typeof createWebhookDispatcher>

  const createMockWebhook = (overrides?: Partial<Webhook>): Webhook => ({
    id: 'webhook-1',
    name: 'Test Webhook',
    url: 'https://example.com/webhook',
    secret: 'a'.repeat(32),
    events: ['talk.submitted'] as WebhookEventType[],
    isActive: true,
    retryCount: 3,
    createdBy: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  })

  const createMockDelivery = (overrides?: Partial<WebhookDelivery>): WebhookDelivery => ({
    id: 'delivery-1',
    webhookId: 'webhook-1',
    event: 'talk.submitted',
    payload: { event: 'talk.submitted', timestamp: '2025-01-01T00:00:00Z', data: {} },
    attempt: 1,
    createdAt: new Date(),
    ...overrides
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mockPb = {}
    mockWebhookRepo = {
      findById: vi.fn(),
      findByScope: vi.fn()
    }
    mockDeliveryRepo = {
      create: vi.fn(),
      findById: vi.fn(),
      findByWebhook: vi.fn(),
      findPendingRetries: vi.fn(),
      markDelivered: vi.fn(),
      markFailed: vi.fn(),
      countByWebhook: vi.fn(),
      updateResult: vi.fn()
    }

    vi.mocked(createWebhookRepository).mockReturnValue(
      mockWebhookRepo as unknown as ReturnType<typeof createWebhookRepository>
    )
    vi.mocked(createWebhookDeliveryRepository).mockReturnValue(
      mockDeliveryRepo as unknown as ReturnType<typeof createWebhookDeliveryRepository>
    )

    dispatcher = createWebhookDispatcher(mockPb as never)
  })

  describe('signPayload', () => {
    it('should generate HMAC-SHA256 signature', () => {
      const payload = '{"event":"talk.submitted"}'
      const secret = 'test-secret-key-32-chars-long!!'

      const signature = dispatcher.signPayload(payload, secret)

      expect(signature).toMatch(/^[a-f0-9]{64}$/)
    })

    it('should generate consistent signatures for same input', () => {
      const payload = '{"data":"test"}'
      const secret = 'consistent-secret-32-characters!'

      const sig1 = dispatcher.signPayload(payload, secret)
      const sig2 = dispatcher.signPayload(payload, secret)

      expect(sig1).toBe(sig2)
    })

    it('should generate different signatures for different secrets', () => {
      const payload = '{"data":"test"}'

      const sig1 = dispatcher.signPayload(payload, 'secret-one-32-characters-long!!')
      const sig2 = dispatcher.signPayload(payload, 'secret-two-32-characters-long!!')

      expect(sig1).not.toBe(sig2)
    })
  })

  describe('dispatch', () => {
    it('should dispatch webhooks to matching endpoints', async () => {
      const webhook = createMockWebhook()
      const delivery = createMockDelivery()

      mockWebhookRepo.findByScope.mockResolvedValue([webhook])
      mockDeliveryRepo.create.mockResolvedValue(delivery)
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: vi.fn().mockResolvedValue('{"success":true}')
      })

      const results = await dispatcher.dispatch(
        'talk.submitted',
        { talkId: 'talk-1' },
        { organizationId: 'org-1' }
      )

      expect(results).toHaveLength(1)
      expect(results[0].success).toBe(true)
      expect(results[0].statusCode).toBe(200)
      expect(mockDeliveryRepo.markDelivered).toHaveBeenCalledWith(
        'delivery-1',
        200,
        '{"success":true}'
      )
    })

    it('should not dispatch to webhooks that do not match event', async () => {
      const webhook = createMockWebhook({ events: ['order.created'] })

      mockWebhookRepo.findByScope.mockResolvedValue([webhook])

      const results = await dispatcher.dispatch(
        'talk.submitted',
        { talkId: 'talk-1' },
        { organizationId: 'org-1' }
      )

      expect(results).toHaveLength(0)
      expect(mockDeliveryRepo.create).not.toHaveBeenCalled()
    })

    it('should mark delivery as failed on HTTP error', async () => {
      const webhook = createMockWebhook()
      const delivery = createMockDelivery()

      mockWebhookRepo.findByScope.mockResolvedValue([webhook])
      mockDeliveryRepo.create.mockResolvedValue(delivery)
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: vi.fn().mockResolvedValue('Server error')
      })

      const results = await dispatcher.dispatch(
        'talk.submitted',
        { talkId: 'talk-1' },
        { organizationId: 'org-1' }
      )

      expect(results[0].success).toBe(false)
      expect(results[0].error).toContain('HTTP 500')
      expect(mockDeliveryRepo.markFailed).toHaveBeenCalled()
    })

    it('should handle network errors gracefully', async () => {
      const webhook = createMockWebhook()
      const delivery = createMockDelivery()

      mockWebhookRepo.findByScope.mockResolvedValue([webhook])
      mockDeliveryRepo.create.mockResolvedValue(delivery)
      mockFetch.mockRejectedValue(new Error('Network error'))

      const results = await dispatcher.dispatch(
        'talk.submitted',
        { talkId: 'talk-1' },
        { organizationId: 'org-1' }
      )

      expect(results[0].success).toBe(false)
      expect(results[0].error).toBe('Network error')
    })

    it('should dispatch to multiple matching webhooks', async () => {
      const webhook1 = createMockWebhook({ id: 'wh-1' })
      const webhook2 = createMockWebhook({ id: 'wh-2' })
      const delivery1 = createMockDelivery({ id: 'del-1', webhookId: 'wh-1' })
      const delivery2 = createMockDelivery({ id: 'del-2', webhookId: 'wh-2' })

      mockWebhookRepo.findByScope.mockResolvedValue([webhook1, webhook2])
      mockDeliveryRepo.create.mockResolvedValueOnce(delivery1).mockResolvedValueOnce(delivery2)
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: vi.fn().mockResolvedValue('')
      })

      const results = await dispatcher.dispatch(
        'talk.submitted',
        { talkId: 'talk-1' },
        { organizationId: 'org-1' }
      )

      expect(results).toHaveLength(2)
      expect(results[0].webhookId).toBe('wh-1')
      expect(results[1].webhookId).toBe('wh-2')
    })

    it('should include custom headers from webhook config', async () => {
      const webhook = createMockWebhook({
        headers: { 'X-Custom-Header': 'custom-value' }
      })
      const delivery = createMockDelivery()

      mockWebhookRepo.findByScope.mockResolvedValue([webhook])
      mockDeliveryRepo.create.mockResolvedValue(delivery)
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: vi.fn().mockResolvedValue('')
      })

      await dispatcher.dispatch('talk.submitted', { talkId: 'talk-1' }, { organizationId: 'org-1' })

      expect(mockFetch).toHaveBeenCalledWith(
        webhook.url,
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Custom-Header': 'custom-value'
          })
        })
      )
    })
  })

  describe('processDelivery', () => {
    it('should process a pending delivery successfully', async () => {
      const webhook = createMockWebhook()
      const delivery = createMockDelivery()

      mockDeliveryRepo.findById.mockResolvedValue(delivery)
      mockWebhookRepo.findById.mockResolvedValue(webhook)
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: vi.fn().mockResolvedValue('OK')
      })

      const result = await dispatcher.processDelivery('delivery-1')

      expect(result.success).toBe(true)
      expect(result.statusCode).toBe(200)
      expect(mockDeliveryRepo.markDelivered).toHaveBeenCalled()
    })

    it('should return error when delivery not found', async () => {
      mockDeliveryRepo.findById.mockResolvedValue(null)

      const result = await dispatcher.processDelivery('non-existent')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Delivery not found')
    })

    it('should return success for already delivered deliveries', async () => {
      const delivery = createMockDelivery({
        deliveredAt: new Date(),
        statusCode: 200
      })

      mockDeliveryRepo.findById.mockResolvedValue(delivery)

      const result = await dispatcher.processDelivery('delivery-1')

      expect(result.success).toBe(true)
      expect(result.statusCode).toBe(200)
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should fail when webhook not found', async () => {
      const delivery = createMockDelivery()

      mockDeliveryRepo.findById.mockResolvedValue(delivery)
      mockWebhookRepo.findById.mockResolvedValue(null)

      const result = await dispatcher.processDelivery('delivery-1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Webhook not found')
      expect(mockDeliveryRepo.markFailed).toHaveBeenCalledWith('delivery-1', 'Webhook not found')
    })

    it('should fail when webhook is inactive', async () => {
      const webhook = createMockWebhook({ isActive: false })
      const delivery = createMockDelivery()

      mockDeliveryRepo.findById.mockResolvedValue(delivery)
      mockWebhookRepo.findById.mockResolvedValue(webhook)

      const result = await dispatcher.processDelivery('delivery-1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Webhook is inactive')
    })

    it('should schedule retry on failure when retries remaining', async () => {
      const webhook = createMockWebhook({ retryCount: 3 })
      const delivery = createMockDelivery({ attempt: 1 })

      mockDeliveryRepo.findById.mockResolvedValue(delivery)
      mockWebhookRepo.findById.mockResolvedValue(webhook)
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: vi.fn().mockResolvedValue('')
      })

      await dispatcher.processDelivery('delivery-1')

      expect(mockDeliveryRepo.markFailed).toHaveBeenCalledWith(
        'delivery-1',
        expect.any(String),
        expect.any(Date),
        2
      )
    })
  })

  describe('processPendingRetries', () => {
    it('should process all pending retries', async () => {
      const webhook = createMockWebhook()
      const deliveries = [createMockDelivery({ id: 'del-1' }), createMockDelivery({ id: 'del-2' })]

      mockDeliveryRepo.findPendingRetries.mockResolvedValue(deliveries)
      mockDeliveryRepo.findById.mockResolvedValue(deliveries[0])
      mockWebhookRepo.findById.mockResolvedValue(webhook)
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: vi.fn().mockResolvedValue('')
      })

      const results = await dispatcher.processPendingRetries()

      expect(results).toHaveLength(2)
    })

    it('should return empty array when no pending retries', async () => {
      mockDeliveryRepo.findPendingRetries.mockResolvedValue([])

      const results = await dispatcher.processPendingRetries()

      expect(results).toHaveLength(0)
    })
  })

  describe('getDeliveryHistory', () => {
    it('should return delivery history for webhook', async () => {
      const deliveries = [createMockDelivery(), createMockDelivery({ id: 'del-2' })]
      mockDeliveryRepo.findByWebhook.mockResolvedValue(deliveries)

      const result = await dispatcher.getDeliveryHistory('webhook-1')

      expect(result).toEqual(deliveries)
      expect(mockDeliveryRepo.findByWebhook).toHaveBeenCalledWith('webhook-1', 1, 50)
    })

    it('should support pagination', async () => {
      mockDeliveryRepo.findByWebhook.mockResolvedValue([])

      await dispatcher.getDeliveryHistory('webhook-1', 2, 25)

      expect(mockDeliveryRepo.findByWebhook).toHaveBeenCalledWith('webhook-1', 2, 25)
    })
  })

  describe('getDeliveryStats', () => {
    it('should return delivery statistics', async () => {
      const stats = { total: 100, delivered: 95, failed: 5 }
      mockDeliveryRepo.countByWebhook.mockResolvedValue(stats)

      const result = await dispatcher.getDeliveryStats('webhook-1')

      expect(result).toEqual(stats)
      expect(mockDeliveryRepo.countByWebhook).toHaveBeenCalledWith('webhook-1')
    })
  })

  describe('retryDelivery', () => {
    it('should retry a failed delivery', async () => {
      const webhook = createMockWebhook()
      const delivery = createMockDelivery({
        error: 'Previous error',
        attempt: 2
      })

      mockDeliveryRepo.findById.mockResolvedValue(delivery)
      mockWebhookRepo.findById.mockResolvedValue(webhook)
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: vi.fn().mockResolvedValue('')
      })

      const result = await dispatcher.retryDelivery('delivery-1')

      expect(result.success).toBe(true)
      expect(mockDeliveryRepo.updateResult).toHaveBeenCalledWith('delivery-1', {
        attempt: 1,
        error: undefined,
        nextRetryAt: undefined
      })
    })

    it('should return error when delivery not found', async () => {
      mockDeliveryRepo.findById.mockResolvedValue(null)

      const result = await dispatcher.retryDelivery('non-existent')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Delivery not found')
    })
  })

  describe('HTTP request handling', () => {
    it('should send correct headers with signature', async () => {
      const webhook = createMockWebhook()
      const delivery = createMockDelivery()

      mockWebhookRepo.findByScope.mockResolvedValue([webhook])
      mockDeliveryRepo.create.mockResolvedValue(delivery)
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: vi.fn().mockResolvedValue('')
      })

      await dispatcher.dispatch('talk.submitted', { talkId: 'talk-1' }, { organizationId: 'org-1' })

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/webhook',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-OEO-Signature': expect.stringMatching(/^sha256=[a-f0-9]{64}$/),
            'X-OEO-Event': 'talk.submitted',
            'X-OEO-Timestamp': expect.any(String)
          })
        })
      )
    })

    it('should truncate long response bodies', async () => {
      const webhook = createMockWebhook()
      const delivery = createMockDelivery()
      const longResponse = 'x'.repeat(15000)

      mockWebhookRepo.findByScope.mockResolvedValue([webhook])
      mockDeliveryRepo.create.mockResolvedValue(delivery)
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: vi.fn().mockResolvedValue(longResponse)
      })

      await dispatcher.dispatch('talk.submitted', { talkId: 'talk-1' }, { organizationId: 'org-1' })

      expect(mockDeliveryRepo.markDelivered).toHaveBeenCalledWith(
        'delivery-1',
        200,
        expect.stringContaining('... (truncated)')
      )
    })
  })
})
