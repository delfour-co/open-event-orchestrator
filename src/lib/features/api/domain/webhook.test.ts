import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  SECRET_LENGTH,
  WEBHOOK_EVENTS,
  type Webhook,
  type WebhookDelivery,
  type WebhookEventType,
  type WebhookScope,
  calculateNextRetryTime,
  createWebhookDeliverySchema,
  createWebhookSchema,
  generateWebhookSecret,
  getNextRetryDelay,
  getWebhookEventCategory,
  getWebhookEventLabel,
  groupWebhookEventsByCategory,
  isWebhookActive,
  shouldRetry,
  updateWebhookSchema,
  webhookDeliverySchema,
  webhookEventSchema,
  webhookMatchesEvent,
  webhookMatchesScope,
  webhookSchema
} from './webhook'

describe('Webhook Domain', () => {
  const now = new Date('2024-06-15T12:00:00Z')

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(now)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const validWebhook: Webhook = {
    id: 'wh123',
    name: 'Test Webhook',
    url: 'https://example.com/webhook',
    secret: 'a'.repeat(32),
    organizationId: 'org123',
    eventId: 'evt123',
    editionId: 'ed123',
    events: ['order.completed', 'ticket.checked_in'],
    isActive: true,
    headers: { 'X-Custom-Header': 'value' },
    retryCount: 3,
    createdBy: 'user123',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-06-01T00:00:00Z')
  }

  const validDelivery: WebhookDelivery = {
    id: 'del123',
    webhookId: 'wh123',
    event: 'order.completed',
    payload: { orderId: 'ord123', amount: 100 },
    statusCode: 200,
    responseBody: '{"ok":true}',
    attempt: 1,
    deliveredAt: new Date('2024-06-15T12:00:00Z'),
    createdAt: new Date('2024-06-15T11:59:00Z')
  }

  describe('WEBHOOK_EVENTS', () => {
    it('should contain all expected events', () => {
      expect(WEBHOOK_EVENTS).toContain('talk.submitted')
      expect(WEBHOOK_EVENTS).toContain('talk.accepted')
      expect(WEBHOOK_EVENTS).toContain('talk.rejected')
      expect(WEBHOOK_EVENTS).toContain('order.created')
      expect(WEBHOOK_EVENTS).toContain('order.completed')
      expect(WEBHOOK_EVENTS).toContain('order.refunded')
      expect(WEBHOOK_EVENTS).toContain('ticket.checked_in')
      expect(WEBHOOK_EVENTS).toContain('sponsor.confirmed')
    })

    it('should have exactly 8 events', () => {
      expect(WEBHOOK_EVENTS).toHaveLength(8)
    })
  })

  describe('webhookEventSchema', () => {
    it('should accept valid event types', () => {
      for (const event of WEBHOOK_EVENTS) {
        const result = webhookEventSchema.safeParse(event)
        expect(result.success).toBe(true)
      }
    })

    it('should reject invalid event types', () => {
      const result = webhookEventSchema.safeParse('invalid.event')
      expect(result.success).toBe(false)
    })
  })

  describe('webhookSchema', () => {
    it('should validate a complete webhook', () => {
      const result = webhookSchema.safeParse(validWebhook)
      expect(result.success).toBe(true)
    })

    it('should validate webhook without optional fields', () => {
      const minimal = {
        id: 'wh123',
        name: 'Test',
        url: 'https://example.com/hook',
        secret: 'a'.repeat(32),
        events: ['order.completed'],
        isActive: true,
        retryCount: 3,
        createdBy: 'user123',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      const result = webhookSchema.safeParse(minimal)
      expect(result.success).toBe(true)
    })

    it('should reject invalid URL', () => {
      const invalid = { ...validWebhook, url: 'not-a-url' }
      const result = webhookSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should reject empty name', () => {
      const invalid = { ...validWebhook, name: '' }
      const result = webhookSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should reject name over 100 characters', () => {
      const invalid = { ...validWebhook, name: 'a'.repeat(101) }
      const result = webhookSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should reject secret shorter than 32 characters', () => {
      const invalid = { ...validWebhook, secret: 'short' }
      const result = webhookSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should reject empty events array', () => {
      const invalid = { ...validWebhook, events: [] }
      const result = webhookSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should reject negative retry count', () => {
      const invalid = { ...validWebhook, retryCount: -1 }
      const result = webhookSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })

    it('should reject retry count over 10', () => {
      const invalid = { ...validWebhook, retryCount: 11 }
      const result = webhookSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })
  })

  describe('createWebhookSchema', () => {
    it('should omit id and timestamps', () => {
      const createData = {
        name: 'New Webhook',
        url: 'https://example.com/hook',
        secret: 'a'.repeat(32),
        events: ['order.completed'] as WebhookEventType[],
        isActive: true,
        retryCount: 3,
        createdBy: 'user123'
      }
      const result = createWebhookSchema.safeParse(createData)
      expect(result.success).toBe(true)
    })
  })

  describe('updateWebhookSchema', () => {
    it('should allow partial updates', () => {
      const result = updateWebhookSchema.safeParse({ name: 'Updated Name' })
      expect(result.success).toBe(true)
    })

    it('should allow updating isActive only', () => {
      const result = updateWebhookSchema.safeParse({ isActive: false })
      expect(result.success).toBe(true)
    })
  })

  describe('webhookDeliverySchema', () => {
    it('should validate a complete delivery', () => {
      const result = webhookDeliverySchema.safeParse(validDelivery)
      expect(result.success).toBe(true)
    })

    it('should validate pending delivery without response', () => {
      const pending = {
        id: 'del123',
        webhookId: 'wh123',
        event: 'order.completed',
        payload: { orderId: 'ord123' },
        attempt: 1,
        createdAt: new Date()
      }
      const result = webhookDeliverySchema.safeParse(pending)
      expect(result.success).toBe(true)
    })

    it('should validate failed delivery with error', () => {
      const failed = {
        ...validDelivery,
        statusCode: 500,
        deliveredAt: undefined,
        error: 'Connection refused'
      }
      const result = webhookDeliverySchema.safeParse(failed)
      expect(result.success).toBe(true)
    })
  })

  describe('createWebhookDeliverySchema', () => {
    it('should accept valid create data', () => {
      const createData = {
        webhookId: 'wh123',
        event: 'order.completed' as WebhookEventType,
        payload: { orderId: 'ord123' },
        attempt: 1
      }
      const result = createWebhookDeliverySchema.safeParse(createData)
      expect(result.success).toBe(true)
    })
  })

  describe('SECRET_LENGTH', () => {
    it('should be 32', () => {
      expect(SECRET_LENGTH).toBe(32)
    })
  })

  describe('generateWebhookSecret', () => {
    it('should generate secret of correct length', () => {
      const secret = generateWebhookSecret()
      expect(secret).toHaveLength(SECRET_LENGTH)
    })

    it('should generate alphanumeric characters only', () => {
      const secret = generateWebhookSecret()
      expect(secret).toMatch(/^[A-Za-z0-9]+$/)
    })

    it('should generate unique secrets', () => {
      const secrets = new Set<string>()
      for (let i = 0; i < 100; i++) {
        secrets.add(generateWebhookSecret())
      }
      expect(secrets.size).toBe(100)
    })
  })

  describe('isWebhookActive', () => {
    it('should return true for active webhook', () => {
      expect(isWebhookActive(validWebhook)).toBe(true)
    })

    it('should return false for inactive webhook', () => {
      const inactive = { ...validWebhook, isActive: false }
      expect(isWebhookActive(inactive)).toBe(false)
    })
  })

  describe('webhookMatchesEvent', () => {
    it('should return true when webhook subscribes to event', () => {
      expect(webhookMatchesEvent(validWebhook, 'order.completed')).toBe(true)
      expect(webhookMatchesEvent(validWebhook, 'ticket.checked_in')).toBe(true)
    })

    it('should return false when webhook does not subscribe to event', () => {
      expect(webhookMatchesEvent(validWebhook, 'talk.submitted')).toBe(false)
      expect(webhookMatchesEvent(validWebhook, 'order.refunded')).toBe(false)
    })
  })

  describe('webhookMatchesScope', () => {
    it('should match when scopes are equal', () => {
      const scope: WebhookScope = {
        organizationId: 'org123',
        eventId: 'evt123',
        editionId: 'ed123'
      }
      expect(webhookMatchesScope(validWebhook, scope)).toBe(true)
    })

    it('should match when webhook has no scope restrictions', () => {
      const webhookNoScope = {
        ...validWebhook,
        organizationId: undefined,
        eventId: undefined,
        editionId: undefined
      }
      const scope: WebhookScope = {
        organizationId: 'any-org',
        editionId: 'any-edition'
      }
      expect(webhookMatchesScope(webhookNoScope, scope)).toBe(true)
    })

    it('should not match when editionId differs', () => {
      const scope: WebhookScope = {
        organizationId: 'org123',
        editionId: 'different-edition'
      }
      expect(webhookMatchesScope(validWebhook, scope)).toBe(false)
    })

    it('should not match when eventId differs', () => {
      const scope: WebhookScope = {
        eventId: 'different-event'
      }
      expect(webhookMatchesScope(validWebhook, scope)).toBe(false)
    })

    it('should not match when organizationId differs', () => {
      const scope: WebhookScope = {
        organizationId: 'different-org'
      }
      expect(webhookMatchesScope(validWebhook, scope)).toBe(false)
    })

    it('should match when scope fields are undefined', () => {
      const scope: WebhookScope = {}
      expect(webhookMatchesScope(validWebhook, scope)).toBe(true)
    })
  })

  describe('shouldRetry', () => {
    it('should return true when under max retries and not delivered', () => {
      const delivery: WebhookDelivery = {
        ...validDelivery,
        attempt: 1,
        deliveredAt: undefined
      }
      expect(shouldRetry(delivery, 3)).toBe(true)
    })

    it('should return false when at max retries', () => {
      const delivery: WebhookDelivery = {
        ...validDelivery,
        attempt: 3,
        deliveredAt: undefined
      }
      expect(shouldRetry(delivery, 3)).toBe(false)
    })

    it('should return false when already delivered', () => {
      const delivery: WebhookDelivery = {
        ...validDelivery,
        attempt: 1,
        deliveredAt: new Date()
      }
      expect(shouldRetry(delivery, 3)).toBe(false)
    })
  })

  describe('getNextRetryDelay', () => {
    it('should return 1 minute for first retry', () => {
      expect(getNextRetryDelay(1)).toBe(60_000)
    })

    it('should return 5 minutes for second retry', () => {
      expect(getNextRetryDelay(2)).toBe(300_000)
    })

    it('should return 30 minutes for third retry', () => {
      expect(getNextRetryDelay(3)).toBe(1_800_000)
    })

    it('should cap at 30 minutes for higher attempts', () => {
      expect(getNextRetryDelay(4)).toBe(1_800_000)
      expect(getNextRetryDelay(10)).toBe(1_800_000)
    })
  })

  describe('calculateNextRetryTime', () => {
    it('should calculate correct retry time', () => {
      const nextRetry = calculateNextRetryTime(1)
      expect(nextRetry.getTime()).toBe(now.getTime() + 60_000)
    })

    it('should use exponential backoff', () => {
      const retry1 = calculateNextRetryTime(1)
      const retry2 = calculateNextRetryTime(2)
      const retry3 = calculateNextRetryTime(3)

      expect(retry1.getTime()).toBe(now.getTime() + 60_000)
      expect(retry2.getTime()).toBe(now.getTime() + 300_000)
      expect(retry3.getTime()).toBe(now.getTime() + 1_800_000)
    })
  })

  describe('getWebhookEventLabel', () => {
    it('should return human-readable labels', () => {
      expect(getWebhookEventLabel('talk.submitted')).toBe('Talk Submitted')
      expect(getWebhookEventLabel('order.completed')).toBe('Order Completed')
      expect(getWebhookEventLabel('ticket.checked_in')).toBe('Ticket Checked In')
    })
  })

  describe('getWebhookEventCategory', () => {
    it('should categorize talk events as CFP', () => {
      expect(getWebhookEventCategory('talk.submitted')).toBe('CFP')
      expect(getWebhookEventCategory('talk.accepted')).toBe('CFP')
      expect(getWebhookEventCategory('talk.rejected')).toBe('CFP')
    })

    it('should categorize order events as Billing', () => {
      expect(getWebhookEventCategory('order.created')).toBe('Billing')
      expect(getWebhookEventCategory('order.completed')).toBe('Billing')
      expect(getWebhookEventCategory('order.refunded')).toBe('Billing')
    })

    it('should categorize ticket events as Tickets', () => {
      expect(getWebhookEventCategory('ticket.checked_in')).toBe('Tickets')
    })

    it('should categorize sponsor events as Sponsoring', () => {
      expect(getWebhookEventCategory('sponsor.confirmed')).toBe('Sponsoring')
    })
  })

  describe('groupWebhookEventsByCategory', () => {
    it('should group events by category', () => {
      const groups = groupWebhookEventsByCategory()

      expect(groups.CFP).toContain('talk.submitted')
      expect(groups.CFP).toContain('talk.accepted')
      expect(groups.CFP).toContain('talk.rejected')
      expect(groups.Billing).toContain('order.created')
      expect(groups.Billing).toContain('order.completed')
      expect(groups.Billing).toContain('order.refunded')
      expect(groups.Tickets).toContain('ticket.checked_in')
      expect(groups.Sponsoring).toContain('sponsor.confirmed')
    })

    it('should include all events', () => {
      const groups = groupWebhookEventsByCategory()
      const allGroupedEvents = Object.values(groups).flat()
      expect(allGroupedEvents).toHaveLength(WEBHOOK_EVENTS.length)
    })
  })
})
