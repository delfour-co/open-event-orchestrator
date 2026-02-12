/**
 * Event Bus - Internal Event System
 *
 * A lightweight pub/sub event bus for decoupling business logic from integrations.
 * Supports strongly typed events, async non-blocking execution, and centralized logging.
 */

import { z } from 'zod'

// ============================================================================
// Event Types
// ============================================================================

/**
 * All application event types
 */
export const APP_EVENT_TYPES = [
  // Billing events
  'order.created',
  'order.paid',
  'order.refunded',
  'order.cancelled',
  'ticket.checked_in',
  'ticket.transferred',

  // CFP events
  'talk.submitted',
  'talk.updated',
  'talk.withdrawn',
  'talk.status_changed',
  'speaker.created',
  'speaker.updated',

  // Team events
  'member.invited',
  'member.joined',
  'member.removed',
  'member.role_changed',

  // Session events
  'session.created',
  'session.updated',
  'session.cancelled',
  'schedule.published',

  // CRM events
  'contact.created',
  'contact.updated',
  'campaign.sent',
  'campaign.completed',

  // Sponsor events
  'sponsor.created',
  'sponsor.confirmed',
  'sponsor.updated'
] as const

export type AppEventType = (typeof APP_EVENT_TYPES)[number]

// ============================================================================
// Event Payloads
// ============================================================================

/**
 * Base event payload schema
 */
const baseEventPayloadSchema = z.object({
  timestamp: z.date().default(() => new Date()),
  correlationId: z.string().optional(),
  source: z.string().optional()
})

/**
 * Order created event payload
 */
export const orderCreatedPayloadSchema = baseEventPayloadSchema.extend({
  orderId: z.string(),
  editionId: z.string(),
  customerEmail: z.string().email(),
  totalAmount: z.number(),
  itemCount: z.number()
})

export type OrderCreatedPayload = z.infer<typeof orderCreatedPayloadSchema>

/**
 * Order paid event payload
 */
export const orderPaidPayloadSchema = baseEventPayloadSchema.extend({
  orderId: z.string(),
  editionId: z.string(),
  customerEmail: z.string().email(),
  ticketCount: z.number(),
  paymentMethod: z.string().optional()
})

export type OrderPaidPayload = z.infer<typeof orderPaidPayloadSchema>

/**
 * Order refunded event payload
 */
export const orderRefundedPayloadSchema = baseEventPayloadSchema.extend({
  orderId: z.string(),
  editionId: z.string(),
  customerEmail: z.string().email(),
  refundAmount: z.number(),
  reason: z.string().optional()
})

export type OrderRefundedPayload = z.infer<typeof orderRefundedPayloadSchema>

/**
 * Order cancelled event payload
 */
export const orderCancelledPayloadSchema = baseEventPayloadSchema.extend({
  orderId: z.string(),
  editionId: z.string(),
  customerEmail: z.string().email(),
  reason: z.string().optional()
})

export type OrderCancelledPayload = z.infer<typeof orderCancelledPayloadSchema>

/**
 * Ticket checked in event payload
 */
export const ticketCheckedInPayloadSchema = baseEventPayloadSchema.extend({
  ticketId: z.string(),
  orderId: z.string(),
  editionId: z.string(),
  attendeeName: z.string(),
  ticketTypeName: z.string(),
  checkedInBy: z.string().optional()
})

export type TicketCheckedInPayload = z.infer<typeof ticketCheckedInPayloadSchema>

/**
 * Ticket transferred event payload
 */
export const ticketTransferredPayloadSchema = baseEventPayloadSchema.extend({
  ticketId: z.string(),
  orderId: z.string(),
  editionId: z.string(),
  fromEmail: z.string().email(),
  toEmail: z.string().email(),
  toName: z.string()
})

export type TicketTransferredPayload = z.infer<typeof ticketTransferredPayloadSchema>

/**
 * Talk submitted event payload
 */
export const talkSubmittedPayloadSchema = baseEventPayloadSchema.extend({
  talkId: z.string(),
  editionId: z.string(),
  title: z.string(),
  speakerName: z.string(),
  speakerEmail: z.string().email(),
  categoryName: z.string().optional(),
  formatName: z.string().optional()
})

export type TalkSubmittedPayload = z.infer<typeof talkSubmittedPayloadSchema>

/**
 * Talk updated event payload
 */
export const talkUpdatedPayloadSchema = baseEventPayloadSchema.extend({
  talkId: z.string(),
  editionId: z.string(),
  title: z.string(),
  updatedBy: z.string().optional(),
  changedFields: z.array(z.string())
})

export type TalkUpdatedPayload = z.infer<typeof talkUpdatedPayloadSchema>

/**
 * Talk withdrawn event payload
 */
export const talkWithdrawnPayloadSchema = baseEventPayloadSchema.extend({
  talkId: z.string(),
  editionId: z.string(),
  title: z.string(),
  speakerName: z.string(),
  reason: z.string().optional()
})

export type TalkWithdrawnPayload = z.infer<typeof talkWithdrawnPayloadSchema>

/**
 * Talk status changed event payload
 */
export const talkStatusChangedPayloadSchema = baseEventPayloadSchema.extend({
  talkId: z.string(),
  editionId: z.string(),
  title: z.string(),
  speakerName: z.string(),
  speakerEmail: z.string().email(),
  oldStatus: z.string(),
  newStatus: z.string(),
  changedBy: z.string().optional()
})

export type TalkStatusChangedPayload = z.infer<typeof talkStatusChangedPayloadSchema>

/**
 * Speaker created event payload
 */
export const speakerCreatedPayloadSchema = baseEventPayloadSchema.extend({
  speakerId: z.string(),
  editionId: z.string(),
  name: z.string(),
  email: z.string().email(),
  company: z.string().optional()
})

export type SpeakerCreatedPayload = z.infer<typeof speakerCreatedPayloadSchema>

/**
 * Speaker updated event payload
 */
export const speakerUpdatedPayloadSchema = baseEventPayloadSchema.extend({
  speakerId: z.string(),
  editionId: z.string(),
  name: z.string(),
  changedFields: z.array(z.string())
})

export type SpeakerUpdatedPayload = z.infer<typeof speakerUpdatedPayloadSchema>

/**
 * Member invited event payload
 */
export const memberInvitedPayloadSchema = baseEventPayloadSchema.extend({
  invitationId: z.string(),
  organizationId: z.string(),
  organizationName: z.string(),
  email: z.string().email(),
  role: z.string(),
  invitedBy: z.string()
})

export type MemberInvitedPayload = z.infer<typeof memberInvitedPayloadSchema>

/**
 * Member joined event payload
 */
export const memberJoinedPayloadSchema = baseEventPayloadSchema.extend({
  userId: z.string(),
  organizationId: z.string(),
  organizationName: z.string(),
  userName: z.string(),
  userEmail: z.string().email(),
  role: z.string()
})

export type MemberJoinedPayload = z.infer<typeof memberJoinedPayloadSchema>

/**
 * Member removed event payload
 */
export const memberRemovedPayloadSchema = baseEventPayloadSchema.extend({
  userId: z.string(),
  organizationId: z.string(),
  organizationName: z.string(),
  userName: z.string(),
  removedBy: z.string().optional()
})

export type MemberRemovedPayload = z.infer<typeof memberRemovedPayloadSchema>

/**
 * Member role changed event payload
 */
export const memberRoleChangedPayloadSchema = baseEventPayloadSchema.extend({
  userId: z.string(),
  organizationId: z.string(),
  organizationName: z.string(),
  userName: z.string(),
  oldRole: z.string(),
  newRole: z.string(),
  changedBy: z.string().optional()
})

export type MemberRoleChangedPayload = z.infer<typeof memberRoleChangedPayloadSchema>

/**
 * Session created event payload
 */
export const sessionCreatedPayloadSchema = baseEventPayloadSchema.extend({
  sessionId: z.string(),
  editionId: z.string(),
  title: z.string(),
  roomName: z.string().optional(),
  startTime: z.date().optional(),
  speakerNames: z.array(z.string())
})

export type SessionCreatedPayload = z.infer<typeof sessionCreatedPayloadSchema>

/**
 * Session updated event payload
 */
export const sessionUpdatedPayloadSchema = baseEventPayloadSchema.extend({
  sessionId: z.string(),
  editionId: z.string(),
  title: z.string(),
  changedFields: z.array(z.string())
})

export type SessionUpdatedPayload = z.infer<typeof sessionUpdatedPayloadSchema>

/**
 * Session cancelled event payload
 */
export const sessionCancelledPayloadSchema = baseEventPayloadSchema.extend({
  sessionId: z.string(),
  editionId: z.string(),
  title: z.string(),
  reason: z.string().optional()
})

export type SessionCancelledPayload = z.infer<typeof sessionCancelledPayloadSchema>

/**
 * Schedule published event payload
 */
export const schedulePublishedPayloadSchema = baseEventPayloadSchema.extend({
  editionId: z.string(),
  editionName: z.string(),
  sessionCount: z.number(),
  publishedBy: z.string().optional()
})

export type SchedulePublishedPayload = z.infer<typeof schedulePublishedPayloadSchema>

/**
 * Contact created event payload
 */
export const contactCreatedPayloadSchema = baseEventPayloadSchema.extend({
  contactId: z.string(),
  eventId: z.string(),
  email: z.string().email(),
  name: z.string().optional(),
  source: z.string().optional()
})

export type ContactCreatedPayload = z.infer<typeof contactCreatedPayloadSchema>

/**
 * Contact updated event payload
 */
export const contactUpdatedPayloadSchema = baseEventPayloadSchema.extend({
  contactId: z.string(),
  eventId: z.string(),
  email: z.string().email(),
  changedFields: z.array(z.string())
})

export type ContactUpdatedPayload = z.infer<typeof contactUpdatedPayloadSchema>

/**
 * Campaign sent event payload
 */
export const campaignSentPayloadSchema = baseEventPayloadSchema.extend({
  campaignId: z.string(),
  editionId: z.string(),
  name: z.string(),
  recipientCount: z.number(),
  sentBy: z.string().optional()
})

export type CampaignSentPayload = z.infer<typeof campaignSentPayloadSchema>

/**
 * Campaign completed event payload
 */
export const campaignCompletedPayloadSchema = baseEventPayloadSchema.extend({
  campaignId: z.string(),
  editionId: z.string(),
  name: z.string(),
  sentCount: z.number(),
  openRate: z.number().optional(),
  clickRate: z.number().optional()
})

export type CampaignCompletedPayload = z.infer<typeof campaignCompletedPayloadSchema>

/**
 * Sponsor created event payload
 */
export const sponsorCreatedPayloadSchema = baseEventPayloadSchema.extend({
  sponsorId: z.string(),
  editionId: z.string(),
  companyName: z.string(),
  packageName: z.string().optional(),
  contactEmail: z.string().email().optional()
})

export type SponsorCreatedPayload = z.infer<typeof sponsorCreatedPayloadSchema>

/**
 * Sponsor confirmed event payload
 */
export const sponsorConfirmedPayloadSchema = baseEventPayloadSchema.extend({
  sponsorId: z.string(),
  editionId: z.string(),
  companyName: z.string(),
  packageName: z.string(),
  amount: z.number().optional()
})

export type SponsorConfirmedPayload = z.infer<typeof sponsorConfirmedPayloadSchema>

/**
 * Sponsor updated event payload
 */
export const sponsorUpdatedPayloadSchema = baseEventPayloadSchema.extend({
  sponsorId: z.string(),
  editionId: z.string(),
  companyName: z.string(),
  changedFields: z.array(z.string())
})

export type SponsorUpdatedPayload = z.infer<typeof sponsorUpdatedPayloadSchema>

// ============================================================================
// Event Map
// ============================================================================

/**
 * Map of event types to their payload types
 */
export interface AppEventMap {
  'order.created': OrderCreatedPayload
  'order.paid': OrderPaidPayload
  'order.refunded': OrderRefundedPayload
  'order.cancelled': OrderCancelledPayload
  'ticket.checked_in': TicketCheckedInPayload
  'ticket.transferred': TicketTransferredPayload
  'talk.submitted': TalkSubmittedPayload
  'talk.updated': TalkUpdatedPayload
  'talk.withdrawn': TalkWithdrawnPayload
  'talk.status_changed': TalkStatusChangedPayload
  'speaker.created': SpeakerCreatedPayload
  'speaker.updated': SpeakerUpdatedPayload
  'member.invited': MemberInvitedPayload
  'member.joined': MemberJoinedPayload
  'member.removed': MemberRemovedPayload
  'member.role_changed': MemberRoleChangedPayload
  'session.created': SessionCreatedPayload
  'session.updated': SessionUpdatedPayload
  'session.cancelled': SessionCancelledPayload
  'schedule.published': SchedulePublishedPayload
  'contact.created': ContactCreatedPayload
  'contact.updated': ContactUpdatedPayload
  'campaign.sent': CampaignSentPayload
  'campaign.completed': CampaignCompletedPayload
  'sponsor.created': SponsorCreatedPayload
  'sponsor.confirmed': SponsorConfirmedPayload
  'sponsor.updated': SponsorUpdatedPayload
}

/**
 * Application event type
 */
export type AppEvent<T extends AppEventType = AppEventType> = {
  type: T
  payload: AppEventMap[T]
}

// ============================================================================
// Event Handler Types
// ============================================================================

/**
 * Event handler function type
 */
export type EventHandler<T extends AppEventType = AppEventType> = (
  event: AppEvent<T>
) => Promise<void> | void

/**
 * Event subscription
 */
export interface EventSubscription {
  id: string
  eventType: AppEventType | '*'
  handler: EventHandler<AppEventType>
  name?: string
  priority?: number
}

/**
 * Event log entry
 */
export interface EventLogEntry {
  id: string
  eventType: AppEventType
  payload: unknown
  timestamp: Date
  handlerCount: number
  handlerResults: HandlerResult[]
  duration: number
}

/**
 * Handler execution result
 */
export interface HandlerResult {
  subscriptionId: string
  name?: string
  success: boolean
  error?: string
  duration: number
}

// ============================================================================
// Event Bus Implementation
// ============================================================================

/**
 * Event Bus class
 */
export class EventBus {
  private subscriptions: Map<string, EventSubscription> = new Map()
  private eventLog: EventLogEntry[] = []
  private maxLogSize: number
  private logEnabled: boolean
  private onError?: (error: Error, event: AppEvent, subscription: EventSubscription) => void

  constructor(
    options: {
      maxLogSize?: number
      logEnabled?: boolean
      onError?: (error: Error, event: AppEvent, subscription: EventSubscription) => void
    } = {}
  ) {
    this.maxLogSize = options.maxLogSize ?? 1000
    this.logEnabled = options.logEnabled ?? true
    this.onError = options.onError
  }

  /**
   * Subscribe to an event type
   */
  subscribe<T extends AppEventType>(
    eventType: T | '*',
    handler: EventHandler<T>,
    options: { name?: string; priority?: number } = {}
  ): string {
    const id = this.generateSubscriptionId()

    const subscription: EventSubscription = {
      id,
      eventType,
      handler: handler as EventHandler<AppEventType>,
      name: options.name,
      priority: options.priority ?? 0
    }

    this.subscriptions.set(id, subscription)
    return id
  }

  /**
   * Unsubscribe from an event
   */
  unsubscribe(subscriptionId: string): boolean {
    return this.subscriptions.delete(subscriptionId)
  }

  /**
   * Unsubscribe all handlers for an event type
   */
  unsubscribeAll(eventType?: AppEventType): number {
    let count = 0
    for (const [id, sub] of this.subscriptions) {
      if (!eventType || sub.eventType === eventType) {
        this.subscriptions.delete(id)
        count++
      }
    }
    return count
  }

  /**
   * Emit an event (fire-and-forget, non-blocking)
   */
  emit<T extends AppEventType>(eventType: T, payload: AppEventMap[T]): void {
    const event: AppEvent<T> = { type: eventType, payload }

    // Fire and forget - don't await
    this.processEvent(event as AppEvent).catch((error) => {
      console.error(`[EventBus] Fatal error processing event ${eventType}:`, error)
    })
  }

  /**
   * Emit an event and wait for all handlers (for testing/critical events)
   */
  async emitAndWait<T extends AppEventType>(
    eventType: T,
    payload: AppEventMap[T]
  ): Promise<EventLogEntry> {
    const event: AppEvent<T> = { type: eventType, payload }
    return this.processEvent(event as AppEvent)
  }

  /**
   * Get subscriptions for an event type
   */
  getSubscriptions(eventType?: AppEventType): EventSubscription[] {
    const subs: EventSubscription[] = []
    for (const sub of this.subscriptions.values()) {
      if (!eventType || sub.eventType === eventType || sub.eventType === '*') {
        subs.push(sub)
      }
    }
    return subs.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
  }

  /**
   * Get subscription count
   */
  getSubscriptionCount(): number {
    return this.subscriptions.size
  }

  /**
   * Get event log
   */
  getEventLog(): EventLogEntry[] {
    return [...this.eventLog]
  }

  /**
   * Clear event log
   */
  clearEventLog(): void {
    this.eventLog = []
  }

  /**
   * Check if event type has subscribers
   */
  hasSubscribers(eventType: AppEventType): boolean {
    for (const sub of this.subscriptions.values()) {
      if (sub.eventType === eventType || sub.eventType === '*') {
        return true
      }
    }
    return false
  }

  /**
   * Process an event
   */
  private async processEvent(event: AppEvent): Promise<EventLogEntry> {
    const startTime = Date.now()
    const subscriptions = this.getSubscriptions(event.type)
    const handlerResults: HandlerResult[] = []

    // Execute handlers in parallel, isolated from each other
    const promises = subscriptions.map(async (sub) => {
      const handlerStart = Date.now()
      try {
        await sub.handler(event)
        handlerResults.push({
          subscriptionId: sub.id,
          name: sub.name,
          success: true,
          duration: Date.now() - handlerStart
        })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        handlerResults.push({
          subscriptionId: sub.id,
          name: sub.name,
          success: false,
          error: errorMessage,
          duration: Date.now() - handlerStart
        })

        // Call error handler if provided
        if (this.onError) {
          try {
            this.onError(error instanceof Error ? error : new Error(errorMessage), event, sub)
          } catch {
            // Ignore errors in error handler
          }
        }
      }
    })

    await Promise.all(promises)

    const logEntry: EventLogEntry = {
      id: this.generateLogId(),
      eventType: event.type,
      payload: event.payload,
      timestamp: new Date(),
      handlerCount: subscriptions.length,
      handlerResults,
      duration: Date.now() - startTime
    }

    if (this.logEnabled) {
      this.addToLog(logEntry)
    }

    return logEntry
  }

  /**
   * Add entry to log
   */
  private addToLog(entry: EventLogEntry): void {
    this.eventLog.push(entry)
    if (this.eventLog.length > this.maxLogSize) {
      this.eventLog.shift()
    }
  }

  /**
   * Generate subscription ID
   */
  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
  }

  /**
   * Generate log ID
   */
  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
  }
}

// ============================================================================
// Global Event Bus Instance
// ============================================================================

let globalEventBus: EventBus | null = null

/**
 * Get global event bus instance
 */
export function getEventBus(): EventBus {
  if (!globalEventBus) {
    globalEventBus = new EventBus()
  }
  return globalEventBus
}

/**
 * Set global event bus instance (for testing)
 */
export function setEventBus(bus: EventBus | null): void {
  globalEventBus = bus
}

/**
 * Reset global event bus (for testing)
 */
export function resetEventBus(): void {
  globalEventBus = null
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a typed event
 */
export function createEvent<T extends AppEventType>(
  type: T,
  payload: Omit<AppEventMap[T], 'timestamp'>
): AppEvent<T> {
  return {
    type,
    payload: {
      ...payload,
      timestamp: new Date()
    } as AppEventMap[T]
  }
}

/**
 * Get event type label
 */
export function getEventTypeLabel(eventType: AppEventType): string {
  const labels: Record<AppEventType, string> = {
    'order.created': 'Order Created',
    'order.paid': 'Order Paid',
    'order.refunded': 'Order Refunded',
    'order.cancelled': 'Order Cancelled',
    'ticket.checked_in': 'Ticket Checked In',
    'ticket.transferred': 'Ticket Transferred',
    'talk.submitted': 'Talk Submitted',
    'talk.updated': 'Talk Updated',
    'talk.withdrawn': 'Talk Withdrawn',
    'talk.status_changed': 'Talk Status Changed',
    'speaker.created': 'Speaker Created',
    'speaker.updated': 'Speaker Updated',
    'member.invited': 'Member Invited',
    'member.joined': 'Member Joined',
    'member.removed': 'Member Removed',
    'member.role_changed': 'Member Role Changed',
    'session.created': 'Session Created',
    'session.updated': 'Session Updated',
    'session.cancelled': 'Session Cancelled',
    'schedule.published': 'Schedule Published',
    'contact.created': 'Contact Created',
    'contact.updated': 'Contact Updated',
    'campaign.sent': 'Campaign Sent',
    'campaign.completed': 'Campaign Completed',
    'sponsor.created': 'Sponsor Created',
    'sponsor.confirmed': 'Sponsor Confirmed',
    'sponsor.updated': 'Sponsor Updated'
  }
  return labels[eventType]
}

/**
 * Get event type category
 */
export function getEventTypeCategory(
  eventType: AppEventType
): 'billing' | 'cfp' | 'team' | 'planning' | 'crm' | 'sponsoring' {
  if (eventType.startsWith('order.') || eventType.startsWith('ticket.')) {
    return 'billing'
  }
  if (eventType.startsWith('talk.') || eventType.startsWith('speaker.')) {
    return 'cfp'
  }
  if (eventType.startsWith('member.')) {
    return 'team'
  }
  if (eventType.startsWith('session.') || eventType.startsWith('schedule.')) {
    return 'planning'
  }
  if (eventType.startsWith('contact.') || eventType.startsWith('campaign.')) {
    return 'crm'
  }
  return 'sponsoring'
}

/**
 * Get event types by category
 */
export function getEventTypesByCategory(
  category: 'billing' | 'cfp' | 'team' | 'planning' | 'crm' | 'sponsoring'
): AppEventType[] {
  return APP_EVENT_TYPES.filter((type) => getEventTypeCategory(type) === category)
}

/**
 * Validate event type
 */
export function isValidEventType(type: string): type is AppEventType {
  return APP_EVENT_TYPES.includes(type as AppEventType)
}
