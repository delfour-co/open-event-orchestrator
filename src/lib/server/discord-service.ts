/**
 * Discord Service
 *
 * Sends notifications to Discord via incoming webhooks.
 * Supports Discord embeds for rich messages.
 */

import { z } from 'zod'
import { type AppEventType, getEventBus } from './event-bus'

// ============================================================================
// Constants
// ============================================================================

/**
 * Discord notification event types
 */
export const DISCORD_NOTIFICATION_TYPES = [
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

export type DiscordNotificationType = (typeof DISCORD_NOTIFICATION_TYPES)[number]

/**
 * Discord embed colors (decimal format)
 */
export const DISCORD_COLORS = {
  success: 3066993, // #2ecc71
  warning: 15844367, // #f1c40f
  danger: 15158332, // #e74c3c
  info: 3447003, // #3498db
  default: 9807270 // #95a5a6
} as const

export type DiscordColor = keyof typeof DISCORD_COLORS

// ============================================================================
// Schemas
// ============================================================================

/**
 * Discord settings schema
 */
export const discordSettingsSchema = z.object({
  webhookUrl: z.string().url().startsWith('https://discord.com/api/webhooks/'),
  enabled: z.boolean().default(false),
  username: z.string().max(80).optional(),
  avatarUrl: z.string().url().optional(),
  enabledNotifications: z.array(z.enum(DISCORD_NOTIFICATION_TYPES)).default([])
})

export type DiscordSettings = z.infer<typeof discordSettingsSchema>

/**
 * Create/Update discord settings schema
 */
export const updateDiscordSettingsSchema = discordSettingsSchema.partial()

export type UpdateDiscordSettings = z.infer<typeof updateDiscordSettingsSchema>

/**
 * Discord embed field
 */
export const discordEmbedFieldSchema = z.object({
  name: z.string().max(256),
  value: z.string().max(1024),
  inline: z.boolean().optional()
})

export type DiscordEmbedField = z.infer<typeof discordEmbedFieldSchema>

/**
 * Discord embed footer
 */
export const discordEmbedFooterSchema = z.object({
  text: z.string().max(2048),
  icon_url: z.string().url().optional()
})

export type DiscordEmbedFooter = z.infer<typeof discordEmbedFooterSchema>

/**
 * Discord embed author
 */
export const discordEmbedAuthorSchema = z.object({
  name: z.string().max(256),
  url: z.string().url().optional(),
  icon_url: z.string().url().optional()
})

export type DiscordEmbedAuthor = z.infer<typeof discordEmbedAuthorSchema>

/**
 * Discord embed
 */
export const discordEmbedSchema = z.object({
  title: z.string().max(256).optional(),
  description: z.string().max(4096).optional(),
  url: z.string().url().optional(),
  color: z.number().optional(),
  timestamp: z.string().optional(),
  footer: discordEmbedFooterSchema.optional(),
  author: discordEmbedAuthorSchema.optional(),
  fields: z.array(discordEmbedFieldSchema).max(25).optional()
})

export type DiscordEmbed = z.infer<typeof discordEmbedSchema>

/**
 * Discord message payload
 */
export const discordMessageSchema = z.object({
  content: z.string().max(2000).optional(),
  username: z.string().max(80).optional(),
  avatar_url: z.string().url().optional(),
  embeds: z.array(discordEmbedSchema).max(10).optional(),
  tts: z.boolean().optional()
})

export type DiscordMessage = z.infer<typeof discordMessageSchema>

/**
 * Discord delivery result
 */
export interface DiscordDeliveryResult {
  success: boolean
  error?: string
  timestamp?: Date
  retryable?: boolean
}

/**
 * Discord notification log entry
 */
export interface DiscordNotificationLog {
  id: string
  eventType: DiscordNotificationType
  message: DiscordMessage
  result: DiscordDeliveryResult
  timestamp: Date
  organizationId?: string
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate Discord settings
 */
export function validateDiscordSettings(data: unknown): DiscordSettings {
  return discordSettingsSchema.parse(data)
}

/**
 * Validate Discord message
 */
export function validateDiscordMessage(data: unknown): DiscordMessage {
  return discordMessageSchema.parse(data)
}

/**
 * Check if notification type is enabled
 */
export function isNotificationEnabled(
  settings: DiscordSettings,
  type: DiscordNotificationType
): boolean {
  return settings.enabled && settings.enabledNotifications.includes(type)
}

/**
 * Check if webhook URL is valid
 */
export function isValidWebhookUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return (
      parsed.protocol === 'https:' &&
      parsed.hostname === 'discord.com' &&
      parsed.pathname.startsWith('/api/webhooks/')
    )
  } catch {
    return false
  }
}

// ============================================================================
// Embed Builder Functions
// ============================================================================

/**
 * Create an embed field
 */
export function field(name: string, value: string, inline = false): DiscordEmbedField {
  return { name, value, inline }
}

/**
 * Create an embed footer
 */
export function footer(text: string, iconUrl?: string): DiscordEmbedFooter {
  return { text, icon_url: iconUrl }
}

/**
 * Create an embed author
 */
export function author(name: string, url?: string, iconUrl?: string): DiscordEmbedAuthor {
  return { name, url, icon_url: iconUrl }
}

/**
 * Create a simple embed
 */
export function embed(
  title: string,
  description?: string,
  color: DiscordColor = 'default'
): DiscordEmbed {
  return {
    title,
    description,
    color: DISCORD_COLORS[color],
    timestamp: new Date().toISOString()
  }
}

/**
 * Create an embed with fields
 */
export function embedWithFields(
  title: string,
  description: string | undefined,
  fields: DiscordEmbedField[],
  color: DiscordColor = 'default'
): DiscordEmbed {
  return {
    title,
    description,
    fields,
    color: DISCORD_COLORS[color],
    timestamp: new Date().toISOString()
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
}): DiscordMessage {
  const currency = data.currency ?? 'EUR'
  const emoji = ':tickets:'

  return {
    content: `${emoji} New order received!`,
    embeds: [
      embedWithFields(
        `Order #${data.orderNumber}`,
        `${data.ticketCount} ticket(s) for **${data.totalAmount} ${currency}**`,
        [
          field('Customer', data.customerEmail, true),
          field('Event', data.eventName || 'N/A', true),
          field('Order ID', data.orderId, false)
        ],
        'success'
      )
    ]
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
}): DiscordMessage {
  const currency = data.currency ?? 'EUR'
  const emoji = ':moneybag:'

  return {
    content: `${emoji} Order refunded`,
    embeds: [
      embedWithFields(
        `Refund #${data.orderNumber}`,
        `Refunded **${data.refundAmount} ${currency}**`,
        [
          field('Customer', data.customerEmail, true),
          field('Reason', data.reason || 'Not specified', true),
          field('Order ID', data.orderId, false)
        ],
        'warning'
      )
    ]
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
}): DiscordMessage {
  const emoji = ':white_check_mark:'

  return {
    content: `${emoji} Check-in: **${data.attendeeName}**`,
    embeds: [
      embed(
        `${data.ticketTypeName}`,
        `${data.eventName || 'Event'} - ${data.ticketNumber}`,
        'success'
      )
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
}): DiscordMessage {
  const emoji = ':pencil:'

  return {
    content: `${emoji} New CFP submission!`,
    embeds: [
      embedWithFields(
        data.title,
        `by **${data.speakerName}**`,
        [
          field('Category', data.categoryName || 'Not specified', true),
          field('Format', data.formatName || 'Not specified', true),
          field('Speaker Email', data.speakerEmail, false),
          field('Event', data.eventName || 'N/A', false)
        ],
        'info'
      )
    ]
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
}): DiscordMessage {
  const isAccepted = data.newStatus === 'accepted'
  const isRejected = data.newStatus === 'rejected'
  const emoji = isAccepted ? ':white_check_mark:' : isRejected ? ':x:' : ':clipboard:'
  const color: DiscordColor = isAccepted ? 'success' : isRejected ? 'danger' : 'info'

  return {
    content: `${emoji} Talk status changed`,
    embeds: [
      embedWithFields(
        data.title,
        `Status: ${data.oldStatus} → **${data.newStatus}**`,
        [field('Speaker', data.speakerName, true), field('Event', data.eventName || 'N/A', true)],
        color
      )
    ]
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
}): DiscordMessage {
  const emoji = ':bust_in_silhouette:'

  return {
    content: `${emoji} New member invited`,
    embeds: [
      embedWithFields(
        'Member Invited',
        `**${data.email}** as **${data.role}**`,
        [
          field('Invited by', data.invitedBy, true),
          field('Organization', data.organizationName, true)
        ],
        'info'
      )
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
}): DiscordMessage {
  const emoji = ':tada:'

  return {
    content: `${emoji} New member joined!`,
    embeds: [
      embedWithFields(
        'Member Joined',
        `**${data.userName}** as **${data.role}**`,
        [field('Email', data.userEmail, true), field('Organization', data.organizationName, true)],
        'success'
      )
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
}): DiscordMessage {
  const currency = data.currency ?? 'EUR'
  const emoji = ':handshake:'
  const amountText = data.amount ? ` (${data.amount} ${currency})` : ''

  return {
    content: `${emoji} Sponsor confirmed!`,
    embeds: [
      embedWithFields(
        data.companyName,
        `**${data.packageName}** package${amountText}`,
        [field('Event', data.eventName || 'N/A', true)],
        'success'
      )
    ]
  }
}

/**
 * Build schedule published message
 */
export function buildSchedulePublishedMessage(data: {
  editionName: string
  sessionCount: number
  publishedBy?: string
}): DiscordMessage {
  const emoji = ':calendar:'

  return {
    content: `${emoji} Schedule published!`,
    embeds: [
      embedWithFields(
        data.editionName,
        `**${data.sessionCount}** sessions scheduled`,
        data.publishedBy ? [field('Published by', data.publishedBy, true)] : [],
        'success'
      )
    ]
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
}): DiscordMessage {
  const emoji = ':envelope:'

  return {
    content: `${emoji} Campaign sent!`,
    embeds: [
      embedWithFields(
        data.name,
        `Sent to **${data.recipientCount}** recipients`,
        [
          field('Sent by', data.sentBy || 'System', true),
          field('Event', data.eventName || 'N/A', true),
          field('Campaign ID', data.campaignId, false)
        ],
        'info'
      )
    ]
  }
}

/**
 * Build test message
 */
export function buildTestMessage(organizationName?: string): DiscordMessage {
  const emoji = ':bell:'

  return {
    content: `${emoji} Test notification from Open Event Orchestrator`,
    embeds: [
      embedWithFields(
        'Test Notification',
        'This is a test message from Open Event Orchestrator.\n\nIf you see this message, your Discord integration is working correctly!',
        organizationName ? [field('Organization', organizationName, true)] : [],
        'info'
      )
    ]
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get notification type label
 */
export function getNotificationTypeLabel(type: DiscordNotificationType): string {
  const labels: Record<DiscordNotificationType, string> = {
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
export function getNotificationTypeDescription(type: DiscordNotificationType): string {
  const descriptions: Record<DiscordNotificationType, string> = {
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
export function getNotificationTypeEmoji(type: DiscordNotificationType): string {
  const emojis: Record<DiscordNotificationType, string> = {
    'order.paid': ':tickets:',
    'order.refunded': ':moneybag:',
    'ticket.checked_in': ':white_check_mark:',
    'talk.submitted': ':pencil:',
    'talk.status_changed': ':clipboard:',
    'member.invited': ':bust_in_silhouette:',
    'member.joined': ':tada:',
    'sponsor.confirmed': ':handshake:',
    'schedule.published': ':calendar:',
    'campaign.sent': ':envelope:'
  }
  return emojis[type]
}

/**
 * Check if event type is a Discord notification type
 */
export function isDiscordNotificationType(type: AppEventType): type is DiscordNotificationType {
  return DISCORD_NOTIFICATION_TYPES.includes(type as DiscordNotificationType)
}

// ============================================================================
// Discord Service Implementation
// ============================================================================

/**
 * Create Discord service
 */
export function createDiscordService(options: { settings: DiscordSettings; logger?: Console }) {
  const logger = options.logger ?? console

  /**
   * Send message to Discord webhook
   */
  async function sendMessage(message: DiscordMessage): Promise<DiscordDeliveryResult> {
    if (!options.settings.enabled || !options.settings.webhookUrl) {
      return { success: false, error: 'Discord is not enabled', retryable: false }
    }

    try {
      // Apply settings
      const payload: DiscordMessage = {
        ...message,
        username: message.username ?? options.settings.username,
        avatar_url: message.avatar_url ?? options.settings.avatarUrl
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

        logger.error(`[Discord] Failed to send message: ${response.status} - ${errorText}`)

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
      logger.error(`[Discord] Error sending message: ${errorMessage}`)

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
    type: DiscordNotificationType,
    message: DiscordMessage
  ): Promise<DiscordDeliveryResult> {
    if (!isNotificationEnabled(options.settings, type)) {
      return {
        success: false,
        error: `Notification type ${type} is not enabled`,
        retryable: false
      }
    }

    return sendMessage(message)
  }

  /**
   * Send test message
   */
  async function sendTestMessage(organizationName?: string): Promise<DiscordDeliveryResult> {
    const message = buildTestMessage(organizationName)
    return sendMessage(message)
  }

  return {
    sendMessage,
    sendNotification,
    sendTestMessage
  }
}

export type DiscordService = ReturnType<typeof createDiscordService>

// ============================================================================
// Event Bus Integration
// ============================================================================

/**
 * Register Discord event listeners
 */
export function registerDiscordEventListeners(service: DiscordService): () => void {
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
      { name: 'discord-order-paid', priority: -10 }
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
      { name: 'discord-order-refunded', priority: -10 }
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
      { name: 'discord-ticket-checkin', priority: -10 }
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
      { name: 'discord-talk-submitted', priority: -10 }
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
      { name: 'discord-talk-status', priority: -10 }
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
      { name: 'discord-member-invited', priority: -10 }
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
      { name: 'discord-member-joined', priority: -10 }
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
      { name: 'discord-sponsor-confirmed', priority: -10 }
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
      { name: 'discord-schedule-published', priority: -10 }
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
      { name: 'discord-campaign-sent', priority: -10 }
    )
  )

  // Return cleanup function
  return () => {
    for (const id of subscriptionIds) {
      bus.unsubscribe(id)
    }
  }
}
