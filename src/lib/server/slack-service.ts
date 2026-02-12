/**
 * Slack Service
 *
 * Sends notifications to Slack via incoming webhooks.
 * Supports Block Kit formatting for rich messages.
 */

import { z } from 'zod'
import { type AppEventType, getEventBus } from './event-bus'

// ============================================================================
// Constants
// ============================================================================

/**
 * Slack notification event types
 */
export const SLACK_NOTIFICATION_TYPES = [
  'order.paid',
  'order.refunded',
  'ticket.checked_in',
  'talk.submitted',
  'talk.status_changed',
  'member.invited',
  'member.joined',
  'sponsor.confirmed',
  'schedule.published',
  'campaign.sent'
] as const

export type SlackNotificationType = (typeof SLACK_NOTIFICATION_TYPES)[number]

/**
 * Slack message colors
 */
export const SLACK_COLORS = {
  success: '#36a64f',
  warning: '#f0ad4e',
  danger: '#dc3545',
  info: '#3498db',
  default: '#6c757d'
} as const

export type SlackColor = keyof typeof SLACK_COLORS

// ============================================================================
// Schemas
// ============================================================================

/**
 * Slack settings schema
 */
export const slackSettingsSchema = z.object({
  webhookUrl: z.string().url().startsWith('https://hooks.slack.com/'),
  enabled: z.boolean().default(false),
  channel: z.string().max(80).optional(),
  username: z.string().max(50).optional(),
  iconEmoji: z.string().max(50).optional(),
  enabledNotifications: z.array(z.enum(SLACK_NOTIFICATION_TYPES)).default([])
})

export type SlackSettings = z.infer<typeof slackSettingsSchema>

/**
 * Create/Update slack settings schema
 */
export const updateSlackSettingsSchema = slackSettingsSchema.partial()

export type UpdateSlackSettings = z.infer<typeof updateSlackSettingsSchema>

/**
 * Slack Block Kit text object
 */
export const slackTextObjectSchema = z.object({
  type: z.enum(['plain_text', 'mrkdwn']),
  text: z.string(),
  emoji: z.boolean().optional()
})

export type SlackTextObject = z.infer<typeof slackTextObjectSchema>

/**
 * Slack Block Kit block types
 */
export const slackBlockSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('header'),
    text: slackTextObjectSchema
  }),
  z.object({
    type: z.literal('section'),
    text: slackTextObjectSchema.optional(),
    fields: z.array(slackTextObjectSchema).optional(),
    accessory: z
      .object({
        type: z.string(),
        text: slackTextObjectSchema.optional(),
        url: z.string().optional(),
        action_id: z.string().optional()
      })
      .optional()
  }),
  z.object({
    type: z.literal('divider')
  }),
  z.object({
    type: z.literal('context'),
    elements: z.array(slackTextObjectSchema)
  }),
  z.object({
    type: z.literal('actions'),
    elements: z.array(
      z.object({
        type: z.string(),
        text: slackTextObjectSchema.optional(),
        url: z.string().optional(),
        action_id: z.string().optional(),
        style: z.enum(['primary', 'danger']).optional()
      })
    )
  })
])

export type SlackBlock = z.infer<typeof slackBlockSchema>

/**
 * Slack attachment (legacy, but useful for colors)
 */
export const slackAttachmentSchema = z.object({
  color: z.string().optional(),
  fallback: z.string().optional(),
  pretext: z.string().optional(),
  author_name: z.string().optional(),
  author_link: z.string().optional(),
  author_icon: z.string().optional(),
  title: z.string().optional(),
  title_link: z.string().optional(),
  text: z.string().optional(),
  fields: z
    .array(
      z.object({
        title: z.string(),
        value: z.string(),
        short: z.boolean().optional()
      })
    )
    .optional(),
  footer: z.string().optional(),
  footer_icon: z.string().optional(),
  ts: z.number().optional()
})

export type SlackAttachment = z.infer<typeof slackAttachmentSchema>

/**
 * Slack message payload
 */
export const slackMessageSchema = z.object({
  text: z.string().optional(),
  blocks: z.array(slackBlockSchema).optional(),
  attachments: z.array(slackAttachmentSchema).optional(),
  channel: z.string().optional(),
  username: z.string().optional(),
  icon_emoji: z.string().optional(),
  icon_url: z.string().optional(),
  mrkdwn: z.boolean().optional()
})

export type SlackMessage = z.infer<typeof slackMessageSchema>

/**
 * Slack delivery result
 */
export interface SlackDeliveryResult {
  success: boolean
  error?: string
  timestamp?: Date
  retryable?: boolean
}

/**
 * Slack notification log entry
 */
export interface SlackNotificationLog {
  id: string
  eventType: SlackNotificationType
  message: SlackMessage
  result: SlackDeliveryResult
  timestamp: Date
  organizationId?: string
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate Slack settings
 */
export function validateSlackSettings(data: unknown): SlackSettings {
  return slackSettingsSchema.parse(data)
}

/**
 * Validate Slack message
 */
export function validateSlackMessage(data: unknown): SlackMessage {
  return slackMessageSchema.parse(data)
}

/**
 * Check if notification type is enabled
 */
export function isNotificationEnabled(
  settings: SlackSettings,
  type: SlackNotificationType
): boolean {
  return settings.enabled && settings.enabledNotifications.includes(type)
}

/**
 * Check if webhook URL is valid
 */
export function isValidWebhookUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' && parsed.hostname === 'hooks.slack.com'
  } catch {
    return false
  }
}

// ============================================================================
// Message Builder Functions
// ============================================================================

/**
 * Create a text object
 */
export function text(content: string, type: 'plain_text' | 'mrkdwn' = 'mrkdwn'): SlackTextObject {
  return { type, text: content }
}

/**
 * Create a plain text object
 */
export function plainText(content: string, emoji = true): SlackTextObject {
  return { type: 'plain_text', text: content, emoji }
}

/**
 * Create a markdown text object
 */
export function mrkdwn(content: string): SlackTextObject {
  return { type: 'mrkdwn', text: content }
}

/**
 * Create a header block
 */
export function header(content: string): SlackBlock {
  return {
    type: 'header',
    text: plainText(content)
  }
}

/**
 * Create a section block
 */
export function section(content: string, fields?: string[]): SlackBlock {
  const block: SlackBlock = {
    type: 'section',
    text: mrkdwn(content)
  }

  if (fields && fields.length > 0) {
    return {
      ...block,
      fields: fields.map((f) => mrkdwn(f))
    } as SlackBlock
  }

  return block
}

/**
 * Create a section with fields only
 */
export function fieldsSection(fields: string[]): SlackBlock {
  return {
    type: 'section',
    fields: fields.map((f) => mrkdwn(f))
  }
}

/**
 * Create a divider block
 */
export function divider(): SlackBlock {
  return { type: 'divider' }
}

/**
 * Create a context block
 */
export function context(...elements: string[]): SlackBlock {
  return {
    type: 'context',
    elements: elements.map((e) => mrkdwn(e))
  }
}

/**
 * Create an attachment with color
 */
export function coloredAttachment(color: SlackColor, text: string): SlackAttachment {
  return {
    color: SLACK_COLORS[color],
    text,
    fallback: text
  }
}

// ============================================================================
// Notification Message Builders
// ============================================================================

/**
 * Build order paid message
 */
export function buildOrderPaidMessage(data: {
  orderId: string
  orderNumber: string
  customerEmail: string
  totalAmount: number
  ticketCount: number
  currency?: string
  eventName?: string
}): SlackMessage {
  const currency = data.currency ?? '€'
  const emoji = '🎫'

  return {
    text: `${emoji} New order #${data.orderNumber} - ${data.ticketCount} ticket(s) (${data.totalAmount}${currency})`,
    blocks: [
      header(`${emoji} New Order`),
      section(
        `*Order #${data.orderNumber}*\n${data.ticketCount} ticket(s) for *${data.totalAmount}${currency}*`
      ),
      fieldsSection([`*Customer*\n${data.customerEmail}`, `*Event*\n${data.eventName || 'N/A'}`]),
      context(`Order ID: ${data.orderId}`)
    ],
    attachments: [coloredAttachment('success', '')]
  }
}

/**
 * Build order refunded message
 */
export function buildOrderRefundedMessage(data: {
  orderId: string
  orderNumber: string
  customerEmail: string
  refundAmount: number
  reason?: string
  currency?: string
}): SlackMessage {
  const currency = data.currency ?? '€'
  const emoji = '💰'

  return {
    text: `${emoji} Refund #${data.orderNumber} - ${data.refundAmount}${currency}`,
    blocks: [
      header(`${emoji} Order Refunded`),
      section(`*Order #${data.orderNumber}* refunded for *${data.refundAmount}${currency}*`),
      fieldsSection([
        `*Customer*\n${data.customerEmail}`,
        `*Reason*\n${data.reason || 'Not specified'}`
      ]),
      context(`Order ID: ${data.orderId}`)
    ],
    attachments: [coloredAttachment('warning', '')]
  }
}

/**
 * Build ticket checked in message
 */
export function buildTicketCheckedInMessage(data: {
  ticketId: string
  ticketNumber: string
  attendeeName: string
  ticketTypeName: string
  eventName?: string
}): SlackMessage {
  const emoji = '✅'

  return {
    text: `${emoji} Check-in: ${data.attendeeName} (${data.ticketNumber})`,
    blocks: [
      section(`${emoji} *Check-in*: ${data.attendeeName}`),
      context(`${data.ticketTypeName} • ${data.eventName || 'Event'} • ${data.ticketNumber}`)
    ]
  }
}

/**
 * Build talk submitted message
 */
export function buildTalkSubmittedMessage(data: {
  talkId: string
  title: string
  speakerName: string
  speakerEmail: string
  categoryName?: string
  formatName?: string
  eventName?: string
}): SlackMessage {
  const emoji = '📝'

  return {
    text: `${emoji} New submission: "${data.title}" by ${data.speakerName}`,
    blocks: [
      header(`${emoji} New CFP Submission`),
      section(`*${data.title}*\nby ${data.speakerName}`),
      fieldsSection([
        `*Category*\n${data.categoryName || 'Not specified'}`,
        `*Format*\n${data.formatName || 'Not specified'}`
      ]),
      context(`${data.speakerEmail} • ${data.eventName || 'Event'}`)
    ],
    attachments: [coloredAttachment('info', '')]
  }
}

/**
 * Build talk status changed message
 */
export function buildTalkStatusChangedMessage(data: {
  talkId: string
  title: string
  speakerName: string
  oldStatus: string
  newStatus: string
  eventName?: string
}): SlackMessage {
  const isAccepted = data.newStatus === 'accepted'
  const isRejected = data.newStatus === 'rejected'
  const emoji = isAccepted ? '✅' : isRejected ? '❌' : '📋'
  const color: SlackColor = isAccepted ? 'success' : isRejected ? 'danger' : 'info'

  return {
    text: `${emoji} Talk "${data.title}" - ${data.newStatus}`,
    blocks: [
      section(`${emoji} *${data.title}*\nStatus changed: ${data.oldStatus} → *${data.newStatus}*`),
      context(`${data.speakerName} • ${data.eventName || 'Event'}`)
    ],
    attachments: [coloredAttachment(color, '')]
  }
}

/**
 * Build member invited message
 */
export function buildMemberInvitedMessage(data: {
  email: string
  role: string
  invitedBy: string
  organizationName: string
}): SlackMessage {
  const emoji = '👤'

  return {
    text: `${emoji} ${data.email} invited as ${data.role}`,
    blocks: [
      section(`${emoji} *New Member Invited*\n${data.email} as *${data.role}*`),
      context(`Invited by ${data.invitedBy} • ${data.organizationName}`)
    ]
  }
}

/**
 * Build member joined message
 */
export function buildMemberJoinedMessage(data: {
  userName: string
  userEmail: string
  role: string
  organizationName: string
}): SlackMessage {
  const emoji = '🎉'

  return {
    text: `${emoji} ${data.userName} joined as ${data.role}`,
    blocks: [
      section(`${emoji} *New Member Joined*\n${data.userName} as *${data.role}*`),
      context(`${data.userEmail} • ${data.organizationName}`)
    ]
  }
}

/**
 * Build sponsor confirmed message
 */
export function buildSponsorConfirmedMessage(data: {
  sponsorId: string
  companyName: string
  packageName: string
  amount?: number
  currency?: string
  eventName?: string
}): SlackMessage {
  const currency = data.currency ?? '€'
  const emoji = '🤝'
  const amountText = data.amount ? ` (${data.amount}${currency})` : ''

  return {
    text: `${emoji} Sponsor confirmed: ${data.companyName} - ${data.packageName}${amountText}`,
    blocks: [
      header(`${emoji} Sponsor Confirmed`),
      section(`*${data.companyName}*\n${data.packageName} package${amountText}`),
      context(`${data.eventName || 'Event'}`)
    ],
    attachments: [coloredAttachment('success', '')]
  }
}

/**
 * Build schedule published message
 */
export function buildSchedulePublishedMessage(data: {
  editionName: string
  sessionCount: number
  publishedBy?: string
}): SlackMessage {
  const emoji = '📅'

  return {
    text: `${emoji} Schedule published for ${data.editionName} (${data.sessionCount} sessions)`,
    blocks: [
      header(`${emoji} Schedule Published`),
      section(`*${data.editionName}*\n${data.sessionCount} sessions scheduled`),
      context(data.publishedBy ? `Published by ${data.publishedBy}` : 'Schedule is now live')
    ],
    attachments: [coloredAttachment('success', '')]
  }
}

/**
 * Build campaign sent message
 */
export function buildCampaignSentMessage(data: {
  campaignId: string
  name: string
  recipientCount: number
  sentBy?: string
  eventName?: string
}): SlackMessage {
  const emoji = '📧'

  return {
    text: `${emoji} Campaign "${data.name}" sent to ${data.recipientCount} recipients`,
    blocks: [
      section(`${emoji} *Campaign Sent*: ${data.name}`),
      fieldsSection([
        `*Recipients*\n${data.recipientCount}`,
        `*Sent by*\n${data.sentBy || 'System'}`
      ]),
      context(`${data.eventName || 'Event'} • Campaign ID: ${data.campaignId}`)
    ],
    attachments: [coloredAttachment('info', '')]
  }
}

/**
 * Build test message
 */
export function buildTestMessage(organizationName?: string): SlackMessage {
  const emoji = '🔔'

  return {
    text: `${emoji} Test notification from Open Event Orchestrator`,
    blocks: [
      header(`${emoji} Test Notification`),
      section('This is a test message from Open Event Orchestrator.'),
      section('If you see this message, your Slack integration is working correctly! 🎉'),
      context(organizationName || 'Open Event Orchestrator')
    ],
    attachments: [coloredAttachment('info', '')]
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get notification type label
 */
export function getNotificationTypeLabel(type: SlackNotificationType): string {
  const labels: Record<SlackNotificationType, string> = {
    'order.paid': 'Order Paid',
    'order.refunded': 'Order Refunded',
    'ticket.checked_in': 'Ticket Check-in',
    'talk.submitted': 'Talk Submitted',
    'talk.status_changed': 'Talk Status Changed',
    'member.invited': 'Member Invited',
    'member.joined': 'Member Joined',
    'sponsor.confirmed': 'Sponsor Confirmed',
    'schedule.published': 'Schedule Published',
    'campaign.sent': 'Campaign Sent'
  }
  return labels[type]
}

/**
 * Get notification type description
 */
export function getNotificationTypeDescription(type: SlackNotificationType): string {
  const descriptions: Record<SlackNotificationType, string> = {
    'order.paid': 'Notify when a ticket order is paid',
    'order.refunded': 'Notify when an order is refunded',
    'ticket.checked_in': 'Notify when an attendee checks in',
    'talk.submitted': 'Notify when a new talk is submitted',
    'talk.status_changed': 'Notify when a talk status changes (accepted/rejected)',
    'member.invited': 'Notify when a team member is invited',
    'member.joined': 'Notify when a team member joins',
    'sponsor.confirmed': 'Notify when a sponsor confirms',
    'schedule.published': 'Notify when the schedule is published',
    'campaign.sent': 'Notify when an email campaign is sent'
  }
  return descriptions[type]
}

/**
 * Get notification type emoji
 */
export function getNotificationTypeEmoji(type: SlackNotificationType): string {
  const emojis: Record<SlackNotificationType, string> = {
    'order.paid': '🎫',
    'order.refunded': '💰',
    'ticket.checked_in': '✅',
    'talk.submitted': '📝',
    'talk.status_changed': '📋',
    'member.invited': '👤',
    'member.joined': '🎉',
    'sponsor.confirmed': '🤝',
    'schedule.published': '📅',
    'campaign.sent': '📧'
  }
  return emojis[type]
}

/**
 * Check if event type is a Slack notification type
 */
export function isSlackNotificationType(type: AppEventType): type is SlackNotificationType {
  return SLACK_NOTIFICATION_TYPES.includes(type as SlackNotificationType)
}

// ============================================================================
// Slack Service Implementation
// ============================================================================

/**
 * Create Slack service
 */
export function createSlackService(options: { settings: SlackSettings; logger?: Console }) {
  const logger = options.logger ?? console

  /**
   * Send message to Slack webhook
   */
  async function sendMessage(message: SlackMessage): Promise<SlackDeliveryResult> {
    if (!options.settings.enabled || !options.settings.webhookUrl) {
      return { success: false, error: 'Slack is not enabled', retryable: false }
    }

    try {
      // Apply settings
      const payload: SlackMessage = {
        ...message,
        channel: message.channel ?? options.settings.channel,
        username: message.username ?? options.settings.username,
        icon_emoji: message.icon_emoji ?? options.settings.iconEmoji
      }

      const response = await fetch(options.settings.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorText = await response.text()
        const retryable = response.status >= 500 || response.status === 429

        logger.error(`[Slack] Failed to send message: ${response.status} - ${errorText}`)

        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`,
          retryable,
          timestamp: new Date()
        }
      }

      return { success: true, timestamp: new Date() }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error(`[Slack] Error sending message: ${errorMessage}`)

      return {
        success: false,
        error: errorMessage,
        retryable: true,
        timestamp: new Date()
      }
    }
  }

  /**
   * Send notification if enabled for type
   */
  async function sendNotification(
    type: SlackNotificationType,
    message: SlackMessage
  ): Promise<SlackDeliveryResult> {
    if (!isNotificationEnabled(options.settings, type)) {
      return { success: false, error: `Notification type ${type} is not enabled`, retryable: false }
    }

    return sendMessage(message)
  }

  /**
   * Send test message
   */
  async function sendTestMessage(organizationName?: string): Promise<SlackDeliveryResult> {
    const message = buildTestMessage(organizationName)
    return sendMessage(message)
  }

  return {
    sendMessage,
    sendNotification,
    sendTestMessage
  }
}

export type SlackService = ReturnType<typeof createSlackService>

// ============================================================================
// Event Bus Integration
// ============================================================================

/**
 * Register Slack event listeners
 */
export function registerSlackEventListeners(service: SlackService): () => void {
  const bus = getEventBus()
  const subscriptionIds: string[] = []

  // Order paid
  subscriptionIds.push(
    bus.subscribe(
      'order.paid',
      async (event) => {
        const message = buildOrderPaidMessage({
          orderId: event.payload.orderId,
          orderNumber: event.payload.orderId.slice(0, 8).toUpperCase(),
          customerEmail: event.payload.customerEmail,
          totalAmount: 0, // Would need to fetch from order
          ticketCount: event.payload.ticketCount
        })
        await service.sendNotification('order.paid', message)
      },
      { name: 'slack-order-paid', priority: -10 }
    )
  )

  // Order refunded
  subscriptionIds.push(
    bus.subscribe(
      'order.refunded',
      async (event) => {
        const message = buildOrderRefundedMessage({
          orderId: event.payload.orderId,
          orderNumber: event.payload.orderId.slice(0, 8).toUpperCase(),
          customerEmail: event.payload.customerEmail,
          refundAmount: event.payload.refundAmount,
          reason: event.payload.reason
        })
        await service.sendNotification('order.refunded', message)
      },
      { name: 'slack-order-refunded', priority: -10 }
    )
  )

  // Ticket checked in
  subscriptionIds.push(
    bus.subscribe(
      'ticket.checked_in',
      async (event) => {
        const message = buildTicketCheckedInMessage({
          ticketId: event.payload.ticketId,
          ticketNumber: event.payload.ticketId.slice(0, 8).toUpperCase(),
          attendeeName: event.payload.attendeeName,
          ticketTypeName: event.payload.ticketTypeName
        })
        await service.sendNotification('ticket.checked_in', message)
      },
      { name: 'slack-ticket-checkin', priority: -10 }
    )
  )

  // Talk submitted
  subscriptionIds.push(
    bus.subscribe(
      'talk.submitted',
      async (event) => {
        const message = buildTalkSubmittedMessage({
          talkId: event.payload.talkId,
          title: event.payload.title,
          speakerName: event.payload.speakerName,
          speakerEmail: event.payload.speakerEmail,
          categoryName: event.payload.categoryName,
          formatName: event.payload.formatName
        })
        await service.sendNotification('talk.submitted', message)
      },
      { name: 'slack-talk-submitted', priority: -10 }
    )
  )

  // Talk status changed
  subscriptionIds.push(
    bus.subscribe(
      'talk.status_changed',
      async (event) => {
        const message = buildTalkStatusChangedMessage({
          talkId: event.payload.talkId,
          title: event.payload.title,
          speakerName: event.payload.speakerName,
          oldStatus: event.payload.oldStatus,
          newStatus: event.payload.newStatus
        })
        await service.sendNotification('talk.status_changed', message)
      },
      { name: 'slack-talk-status', priority: -10 }
    )
  )

  // Member invited
  subscriptionIds.push(
    bus.subscribe(
      'member.invited',
      async (event) => {
        const message = buildMemberInvitedMessage({
          email: event.payload.email,
          role: event.payload.role,
          invitedBy: event.payload.invitedBy,
          organizationName: event.payload.organizationName
        })
        await service.sendNotification('member.invited', message)
      },
      { name: 'slack-member-invited', priority: -10 }
    )
  )

  // Member joined
  subscriptionIds.push(
    bus.subscribe(
      'member.joined',
      async (event) => {
        const message = buildMemberJoinedMessage({
          userName: event.payload.userName,
          userEmail: event.payload.userEmail,
          role: event.payload.role,
          organizationName: event.payload.organizationName
        })
        await service.sendNotification('member.joined', message)
      },
      { name: 'slack-member-joined', priority: -10 }
    )
  )

  // Sponsor confirmed
  subscriptionIds.push(
    bus.subscribe(
      'sponsor.confirmed',
      async (event) => {
        const message = buildSponsorConfirmedMessage({
          sponsorId: event.payload.sponsorId,
          companyName: event.payload.companyName,
          packageName: event.payload.packageName,
          amount: event.payload.amount
        })
        await service.sendNotification('sponsor.confirmed', message)
      },
      { name: 'slack-sponsor-confirmed', priority: -10 }
    )
  )

  // Schedule published
  subscriptionIds.push(
    bus.subscribe(
      'schedule.published',
      async (event) => {
        const message = buildSchedulePublishedMessage({
          editionName: event.payload.editionName,
          sessionCount: event.payload.sessionCount,
          publishedBy: event.payload.publishedBy
        })
        await service.sendNotification('schedule.published', message)
      },
      { name: 'slack-schedule-published', priority: -10 }
    )
  )

  // Campaign sent
  subscriptionIds.push(
    bus.subscribe(
      'campaign.sent',
      async (event) => {
        const message = buildCampaignSentMessage({
          campaignId: event.payload.campaignId,
          name: event.payload.name,
          recipientCount: event.payload.recipientCount,
          sentBy: event.payload.sentBy
        })
        await service.sendNotification('campaign.sent', message)
      },
      { name: 'slack-campaign-sent', priority: -10 }
    )
  )

  // Return cleanup function
  return () => {
    for (const id of subscriptionIds) {
      bus.unsubscribe(id)
    }
  }
}
