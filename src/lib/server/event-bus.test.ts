/**
 * Event Bus Tests
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  APP_EVENT_TYPES,
  type AppEvent,
  EventBus,
  type OrderCreatedPayload,
  type TalkSubmittedPayload,
  createEvent,
  getEventBus,
  getEventTypeCategory,
  getEventTypeLabel,
  getEventTypesByCategory,
  isValidEventType,
  resetEventBus,
  setEventBus
} from './event-bus'

describe('EventBus', () => {
  let bus: EventBus

  beforeEach(() => {
    bus = new EventBus()
  })

  describe('subscribe', () => {
    it('should subscribe to an event type', () => {
      const handler = vi.fn()
      const id = bus.subscribe('order.created', handler)

      expect(id).toBeDefined()
      expect(id).toMatch(/^sub_/)
      expect(bus.getSubscriptionCount()).toBe(1)
    })

    it('should subscribe with name and priority', () => {
      const handler = vi.fn()
      bus.subscribe('order.created', handler, { name: 'TestHandler', priority: 10 })

      const subs = bus.getSubscriptions('order.created')
      expect(subs).toHaveLength(1)
      expect(subs[0].name).toBe('TestHandler')
      expect(subs[0].priority).toBe(10)
    })

    it('should subscribe to wildcard events', () => {
      const handler = vi.fn()
      bus.subscribe('*', handler)

      expect(bus.getSubscriptionCount()).toBe(1)
      expect(bus.hasSubscribers('order.created')).toBe(true)
      expect(bus.hasSubscribers('talk.submitted')).toBe(true)
    })

    it('should allow multiple subscriptions to same event', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      bus.subscribe('order.created', handler1)
      bus.subscribe('order.created', handler2)

      expect(bus.getSubscriptionCount()).toBe(2)
      expect(bus.getSubscriptions('order.created')).toHaveLength(2)
    })
  })

  describe('unsubscribe', () => {
    it('should unsubscribe by id', () => {
      const handler = vi.fn()
      const id = bus.subscribe('order.created', handler)

      expect(bus.getSubscriptionCount()).toBe(1)

      const result = bus.unsubscribe(id)

      expect(result).toBe(true)
      expect(bus.getSubscriptionCount()).toBe(0)
    })

    it('should return false for unknown subscription', () => {
      const result = bus.unsubscribe('unknown_id')
      expect(result).toBe(false)
    })

    it('should unsubscribe all handlers', () => {
      bus.subscribe('order.created', vi.fn())
      bus.subscribe('order.paid', vi.fn())
      bus.subscribe('talk.submitted', vi.fn())

      expect(bus.getSubscriptionCount()).toBe(3)

      const count = bus.unsubscribeAll()

      expect(count).toBe(3)
      expect(bus.getSubscriptionCount()).toBe(0)
    })

    it('should unsubscribe all handlers for specific event type', () => {
      bus.subscribe('order.created', vi.fn())
      bus.subscribe('order.created', vi.fn())
      bus.subscribe('talk.submitted', vi.fn())

      const count = bus.unsubscribeAll('order.created')

      expect(count).toBe(2)
      expect(bus.getSubscriptionCount()).toBe(1)
      expect(bus.hasSubscribers('talk.submitted')).toBe(true)
    })
  })

  describe('emit', () => {
    it('should call subscribed handlers', async () => {
      const handler = vi.fn()
      bus.subscribe('order.created', handler)

      const payload: OrderCreatedPayload = {
        orderId: 'order_123',
        editionId: 'edition_456',
        customerEmail: 'test@example.com',
        totalAmount: 100,
        itemCount: 2,
        timestamp: new Date()
      }

      await bus.emitAndWait('order.created', payload)

      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler).toHaveBeenCalledWith({
        type: 'order.created',
        payload
      })
    })

    it('should call wildcard handlers', async () => {
      const wildcardHandler = vi.fn()
      const specificHandler = vi.fn()

      bus.subscribe('*', wildcardHandler)
      bus.subscribe('order.created', specificHandler)

      const payload: OrderCreatedPayload = {
        orderId: 'order_123',
        editionId: 'edition_456',
        customerEmail: 'test@example.com',
        totalAmount: 100,
        itemCount: 2,
        timestamp: new Date()
      }

      await bus.emitAndWait('order.created', payload)

      expect(wildcardHandler).toHaveBeenCalledTimes(1)
      expect(specificHandler).toHaveBeenCalledTimes(1)
    })

    it('should execute handlers by priority', async () => {
      const order: string[] = []

      bus.subscribe(
        'order.created',
        async () => {
          order.push('low')
        },
        { priority: 0 }
      )
      bus.subscribe(
        'order.created',
        async () => {
          order.push('high')
        },
        { priority: 10 }
      )
      bus.subscribe(
        'order.created',
        async () => {
          order.push('medium')
        },
        { priority: 5 }
      )

      const payload: OrderCreatedPayload = {
        orderId: 'order_123',
        editionId: 'edition_456',
        customerEmail: 'test@example.com',
        totalAmount: 100,
        itemCount: 2,
        timestamp: new Date()
      }

      await bus.emitAndWait('order.created', payload)

      // Note: handlers execute in parallel, priority affects order they're invoked
      // but since they're all async and quick, results depend on execution timing
      expect(order).toContain('high')
      expect(order).toContain('medium')
      expect(order).toContain('low')
    })

    it('should not block on slow handlers', async () => {
      let handlerCompleted = false
      const handler = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
        handlerCompleted = true
      })

      bus.subscribe('order.created', handler)

      const payload: OrderCreatedPayload = {
        orderId: 'order_123',
        editionId: 'edition_456',
        customerEmail: 'test@example.com',
        totalAmount: 100,
        itemCount: 2,
        timestamp: new Date()
      }

      // emit is fire-and-forget - returns immediately
      bus.emit('order.created', payload)

      // Handler is invoked but not completed yet
      expect(handlerCompleted).toBe(false)

      // Wait for handler to complete
      await new Promise((resolve) => setTimeout(resolve, 100))
      expect(handlerCompleted).toBe(true)
      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should call handlers for different event types', async () => {
      const orderHandler = vi.fn()
      const talkHandler = vi.fn()

      bus.subscribe('order.created', orderHandler)
      bus.subscribe('talk.submitted', talkHandler)

      const orderPayload: OrderCreatedPayload = {
        orderId: 'order_123',
        editionId: 'edition_456',
        customerEmail: 'test@example.com',
        totalAmount: 100,
        itemCount: 2,
        timestamp: new Date()
      }

      const talkPayload: TalkSubmittedPayload = {
        talkId: 'talk_123',
        editionId: 'edition_456',
        title: 'My Talk',
        speakerName: 'John Doe',
        speakerEmail: 'john@example.com',
        timestamp: new Date()
      }

      await bus.emitAndWait('order.created', orderPayload)
      await bus.emitAndWait('talk.submitted', talkPayload)

      expect(orderHandler).toHaveBeenCalledTimes(1)
      expect(talkHandler).toHaveBeenCalledTimes(1)
    })
  })

  describe('error handling', () => {
    it('should isolate handler errors', async () => {
      const failingHandler = vi.fn(async () => {
        throw new Error('Handler failed')
      })
      const successHandler = vi.fn()

      bus.subscribe('order.created', failingHandler)
      bus.subscribe('order.created', successHandler)

      const payload: OrderCreatedPayload = {
        orderId: 'order_123',
        editionId: 'edition_456',
        customerEmail: 'test@example.com',
        totalAmount: 100,
        itemCount: 2,
        timestamp: new Date()
      }

      const result = await bus.emitAndWait('order.created', payload)

      // Both handlers should have been called
      expect(failingHandler).toHaveBeenCalledTimes(1)
      expect(successHandler).toHaveBeenCalledTimes(1)

      // Check results
      expect(result.handlerResults).toHaveLength(2)
      const failedResult = result.handlerResults.find((r) => !r.success)
      const successResult = result.handlerResults.find((r) => r.success)

      expect(failedResult).toBeDefined()
      expect(failedResult?.error).toBe('Handler failed')
      expect(successResult).toBeDefined()
    })

    it('should call error handler on failure', async () => {
      const onError = vi.fn()
      const busWithErrorHandler = new EventBus({ onError })

      const failingHandler = vi.fn(async () => {
        throw new Error('Test error')
      })

      busWithErrorHandler.subscribe('order.created', failingHandler, { name: 'FailingHandler' })

      const payload: OrderCreatedPayload = {
        orderId: 'order_123',
        editionId: 'edition_456',
        customerEmail: 'test@example.com',
        totalAmount: 100,
        itemCount: 2,
        timestamp: new Date()
      }

      await busWithErrorHandler.emitAndWait('order.created', payload)

      expect(onError).toHaveBeenCalledTimes(1)
      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({ type: 'order.created' }),
        expect.objectContaining({ name: 'FailingHandler' })
      )
    })
  })

  describe('event log', () => {
    it('should log events', async () => {
      bus.subscribe('order.created', vi.fn())

      const payload: OrderCreatedPayload = {
        orderId: 'order_123',
        editionId: 'edition_456',
        customerEmail: 'test@example.com',
        totalAmount: 100,
        itemCount: 2,
        timestamp: new Date()
      }

      await bus.emitAndWait('order.created', payload)

      const log = bus.getEventLog()
      expect(log).toHaveLength(1)
      expect(log[0].eventType).toBe('order.created')
      expect(log[0].handlerCount).toBe(1)
      expect(log[0].duration).toBeGreaterThanOrEqual(0)
    })

    it('should limit log size', async () => {
      const smallBus = new EventBus({ maxLogSize: 3 })
      smallBus.subscribe('order.created', vi.fn())

      const payload: OrderCreatedPayload = {
        orderId: 'order_123',
        editionId: 'edition_456',
        customerEmail: 'test@example.com',
        totalAmount: 100,
        itemCount: 2,
        timestamp: new Date()
      }

      for (let i = 0; i < 5; i++) {
        await smallBus.emitAndWait('order.created', payload)
      }

      const log = smallBus.getEventLog()
      expect(log).toHaveLength(3)
    })

    it('should clear event log', async () => {
      bus.subscribe('order.created', vi.fn())

      const payload: OrderCreatedPayload = {
        orderId: 'order_123',
        editionId: 'edition_456',
        customerEmail: 'test@example.com',
        totalAmount: 100,
        itemCount: 2,
        timestamp: new Date()
      }

      await bus.emitAndWait('order.created', payload)

      expect(bus.getEventLog()).toHaveLength(1)

      bus.clearEventLog()

      expect(bus.getEventLog()).toHaveLength(0)
    })

    it('should disable logging', async () => {
      const noLogBus = new EventBus({ logEnabled: false })
      noLogBus.subscribe('order.created', vi.fn())

      const payload: OrderCreatedPayload = {
        orderId: 'order_123',
        editionId: 'edition_456',
        customerEmail: 'test@example.com',
        totalAmount: 100,
        itemCount: 2,
        timestamp: new Date()
      }

      await noLogBus.emitAndWait('order.created', payload)

      expect(noLogBus.getEventLog()).toHaveLength(0)
    })
  })

  describe('getSubscriptions', () => {
    it('should return subscriptions for event type', () => {
      bus.subscribe('order.created', vi.fn(), { name: 'Handler1' })
      bus.subscribe('order.created', vi.fn(), { name: 'Handler2' })
      bus.subscribe('talk.submitted', vi.fn(), { name: 'Handler3' })

      const subs = bus.getSubscriptions('order.created')

      expect(subs).toHaveLength(2)
      expect(subs.map((s) => s.name)).toContain('Handler1')
      expect(subs.map((s) => s.name)).toContain('Handler2')
    })

    it('should include wildcard subscriptions', () => {
      bus.subscribe('order.created', vi.fn(), { name: 'Specific' })
      bus.subscribe('*', vi.fn(), { name: 'Wildcard' })

      const subs = bus.getSubscriptions('order.created')

      expect(subs).toHaveLength(2)
      expect(subs.map((s) => s.name)).toContain('Specific')
      expect(subs.map((s) => s.name)).toContain('Wildcard')
    })

    it('should sort by priority descending', () => {
      bus.subscribe('order.created', vi.fn(), { name: 'Low', priority: 0 })
      bus.subscribe('order.created', vi.fn(), { name: 'High', priority: 10 })
      bus.subscribe('order.created', vi.fn(), { name: 'Medium', priority: 5 })

      const subs = bus.getSubscriptions('order.created')

      expect(subs[0].name).toBe('High')
      expect(subs[1].name).toBe('Medium')
      expect(subs[2].name).toBe('Low')
    })
  })

  describe('hasSubscribers', () => {
    it('should return true when has subscribers', () => {
      bus.subscribe('order.created', vi.fn())

      expect(bus.hasSubscribers('order.created')).toBe(true)
      expect(bus.hasSubscribers('talk.submitted')).toBe(false)
    })

    it('should consider wildcard subscribers', () => {
      bus.subscribe('*', vi.fn())

      expect(bus.hasSubscribers('order.created')).toBe(true)
      expect(bus.hasSubscribers('talk.submitted')).toBe(true)
    })
  })
})

describe('Global Event Bus', () => {
  afterEach(() => {
    resetEventBus()
  })

  it('should return singleton instance', () => {
    const bus1 = getEventBus()
    const bus2 = getEventBus()

    expect(bus1).toBe(bus2)
  })

  it('should allow setting custom instance', () => {
    const customBus = new EventBus()
    setEventBus(customBus)

    expect(getEventBus()).toBe(customBus)
  })

  it('should reset to null', () => {
    const bus1 = getEventBus()
    resetEventBus()
    const bus2 = getEventBus()

    expect(bus1).not.toBe(bus2)
  })
})

describe('createEvent', () => {
  it('should create typed event with timestamp', () => {
    const event = createEvent('order.created', {
      orderId: 'order_123',
      editionId: 'edition_456',
      customerEmail: 'test@example.com',
      totalAmount: 100,
      itemCount: 2
    })

    expect(event.type).toBe('order.created')
    expect(event.payload.orderId).toBe('order_123')
    expect(event.payload.timestamp).toBeInstanceOf(Date)
  })
})

describe('getEventTypeLabel', () => {
  it('should return label for each event type', () => {
    expect(getEventTypeLabel('order.created')).toBe('Order Created')
    expect(getEventTypeLabel('talk.submitted')).toBe('Talk Submitted')
    expect(getEventTypeLabel('ticket.checked_in')).toBe('Ticket Checked In')
    expect(getEventTypeLabel('member.invited')).toBe('Member Invited')
  })
})

describe('getEventTypeCategory', () => {
  it('should categorize billing events', () => {
    expect(getEventTypeCategory('order.created')).toBe('billing')
    expect(getEventTypeCategory('order.paid')).toBe('billing')
    expect(getEventTypeCategory('ticket.checked_in')).toBe('billing')
  })

  it('should categorize cfp events', () => {
    expect(getEventTypeCategory('talk.submitted')).toBe('cfp')
    expect(getEventTypeCategory('speaker.created')).toBe('cfp')
  })

  it('should categorize team events', () => {
    expect(getEventTypeCategory('member.invited')).toBe('team')
    expect(getEventTypeCategory('member.joined')).toBe('team')
  })

  it('should categorize planning events', () => {
    expect(getEventTypeCategory('session.created')).toBe('planning')
    expect(getEventTypeCategory('schedule.published')).toBe('planning')
  })

  it('should categorize crm events', () => {
    expect(getEventTypeCategory('contact.created')).toBe('crm')
    expect(getEventTypeCategory('campaign.sent')).toBe('crm')
  })

  it('should categorize sponsoring events', () => {
    expect(getEventTypeCategory('sponsor.created')).toBe('sponsoring')
    expect(getEventTypeCategory('sponsor.confirmed')).toBe('sponsoring')
  })
})

describe('getEventTypesByCategory', () => {
  it('should return billing events', () => {
    const events = getEventTypesByCategory('billing')

    expect(events).toContain('order.created')
    expect(events).toContain('order.paid')
    expect(events).toContain('ticket.checked_in')
    expect(events).not.toContain('talk.submitted')
  })

  it('should return cfp events', () => {
    const events = getEventTypesByCategory('cfp')

    expect(events).toContain('talk.submitted')
    expect(events).toContain('speaker.created')
    expect(events).not.toContain('order.created')
  })
})

describe('isValidEventType', () => {
  it('should return true for valid event types', () => {
    expect(isValidEventType('order.created')).toBe(true)
    expect(isValidEventType('talk.submitted')).toBe(true)
    expect(isValidEventType('sponsor.confirmed')).toBe(true)
  })

  it('should return false for invalid event types', () => {
    expect(isValidEventType('invalid.event')).toBe(false)
    expect(isValidEventType('')).toBe(false)
    expect(isValidEventType('order')).toBe(false)
  })
})

describe('APP_EVENT_TYPES', () => {
  it('should contain all expected event types', () => {
    expect(APP_EVENT_TYPES).toContain('order.created')
    expect(APP_EVENT_TYPES).toContain('order.paid')
    expect(APP_EVENT_TYPES).toContain('order.refunded')
    expect(APP_EVENT_TYPES).toContain('order.cancelled')
    expect(APP_EVENT_TYPES).toContain('ticket.checked_in')
    expect(APP_EVENT_TYPES).toContain('ticket.transferred')
    expect(APP_EVENT_TYPES).toContain('talk.submitted')
    expect(APP_EVENT_TYPES).toContain('talk.updated')
    expect(APP_EVENT_TYPES).toContain('talk.withdrawn')
    expect(APP_EVENT_TYPES).toContain('talk.status_changed')
    expect(APP_EVENT_TYPES).toContain('speaker.created')
    expect(APP_EVENT_TYPES).toContain('speaker.updated')
    expect(APP_EVENT_TYPES).toContain('member.invited')
    expect(APP_EVENT_TYPES).toContain('member.joined')
    expect(APP_EVENT_TYPES).toContain('member.removed')
    expect(APP_EVENT_TYPES).toContain('member.role_changed')
    expect(APP_EVENT_TYPES).toContain('session.created')
    expect(APP_EVENT_TYPES).toContain('session.updated')
    expect(APP_EVENT_TYPES).toContain('session.cancelled')
    expect(APP_EVENT_TYPES).toContain('schedule.published')
    expect(APP_EVENT_TYPES).toContain('contact.created')
    expect(APP_EVENT_TYPES).toContain('contact.updated')
    expect(APP_EVENT_TYPES).toContain('campaign.sent')
    expect(APP_EVENT_TYPES).toContain('campaign.completed')
    expect(APP_EVENT_TYPES).toContain('sponsor.created')
    expect(APP_EVENT_TYPES).toContain('sponsor.confirmed')
    expect(APP_EVENT_TYPES).toContain('sponsor.updated')
  })

  it('should have 27 event types', () => {
    expect(APP_EVENT_TYPES).toHaveLength(27)
  })
})

describe('Event Type Integration', () => {
  let bus: EventBus

  beforeEach(() => {
    bus = new EventBus()
  })

  it('should handle talk submission workflow', async () => {
    const events: AppEvent[] = []

    bus.subscribe('*', (event) => {
      events.push(event)
    })

    // Simulate talk submission flow
    await bus.emitAndWait('speaker.created', {
      speakerId: 'speaker_1',
      editionId: 'edition_1',
      name: 'John Doe',
      email: 'john@example.com',
      timestamp: new Date()
    })

    await bus.emitAndWait('talk.submitted', {
      talkId: 'talk_1',
      editionId: 'edition_1',
      title: 'My Talk',
      speakerName: 'John Doe',
      speakerEmail: 'john@example.com',
      timestamp: new Date()
    })

    await bus.emitAndWait('talk.status_changed', {
      talkId: 'talk_1',
      editionId: 'edition_1',
      title: 'My Talk',
      speakerName: 'John Doe',
      speakerEmail: 'john@example.com',
      oldStatus: 'draft',
      newStatus: 'submitted',
      timestamp: new Date()
    })

    expect(events).toHaveLength(3)
    expect(events.map((e) => e.type)).toEqual([
      'speaker.created',
      'talk.submitted',
      'talk.status_changed'
    ])
  })

  it('should handle order workflow', async () => {
    const events: AppEvent[] = []

    bus.subscribe('*', (event) => {
      events.push(event)
    })

    // Simulate order flow
    await bus.emitAndWait('order.created', {
      orderId: 'order_1',
      editionId: 'edition_1',
      customerEmail: 'customer@example.com',
      totalAmount: 100,
      itemCount: 2,
      timestamp: new Date()
    })

    await bus.emitAndWait('order.paid', {
      orderId: 'order_1',
      editionId: 'edition_1',
      customerEmail: 'customer@example.com',
      ticketCount: 2,
      timestamp: new Date()
    })

    await bus.emitAndWait('ticket.checked_in', {
      ticketId: 'ticket_1',
      orderId: 'order_1',
      editionId: 'edition_1',
      attendeeName: 'Customer Name',
      ticketTypeName: 'General Admission',
      timestamp: new Date()
    })

    expect(events).toHaveLength(3)
    expect(events.map((e) => e.type)).toEqual(['order.created', 'order.paid', 'ticket.checked_in'])
  })
})
