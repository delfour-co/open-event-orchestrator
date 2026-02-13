/**
 * Discord Service Tests
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  DISCORD_COLORS,
  DISCORD_NOTIFICATION_TYPES,
  type DiscordSettings,
  author,
  buildCampaignSentMessage,
  buildMemberInvitedMessage,
  buildMemberJoinedMessage,
  buildOrderPaidMessage,
  buildOrderRefundedMessage,
  buildSchedulePublishedMessage,
  buildSponsorConfirmedMessage,
  buildTalkStatusChangedMessage,
  buildTalkSubmittedMessage,
  buildTestMessage,
  buildTicketCheckedInMessage,
  createDiscordService,
  embed,
  embedWithFields,
  field,
  footer,
  getNotificationTypeDescription,
  getNotificationTypeEmoji,
  getNotificationTypeLabel,
  isDiscordNotificationType,
  isNotificationEnabled,
  isValidWebhookUrl,
  registerDiscordEventListeners,
  validateDiscordMessage,
  validateDiscordSettings
} from './discord-service'
import { EventBus, resetEventBus, setEventBus } from './event-bus'

describe('Discord Settings', () => {
  describe('validateDiscordSettings', () => {
    it('should validate valid settings', () => {
      const settings = validateDiscordSettings({
        webhookUrl: 'https://discord.com/api/webhooks/123456789/abcdefghijk',
        enabled: true,
        username: 'My Bot',
        enabledNotifications: ['order.paid', 'talk.submitted']
      })

      expect(settings.webhookUrl).toBe('https://discord.com/api/webhooks/123456789/abcdefghijk')
      expect(settings.enabled).toBe(true)
      expect(settings.username).toBe('My Bot')
      expect(settings.enabledNotifications).toHaveLength(2)
    })

    it('should apply defaults', () => {
      const settings = validateDiscordSettings({
        webhookUrl: 'https://discord.com/api/webhooks/123456789/abcdefghijk'
      })

      expect(settings.enabled).toBe(false)
      expect(settings.enabledNotifications).toEqual([])
    })

    it('should reject invalid webhook URL', () => {
      expect(() =>
        validateDiscordSettings({
          webhookUrl: 'https://example.com/webhook'
        })
      ).toThrow()
    })

    it('should reject non-https webhook', () => {
      expect(() =>
        validateDiscordSettings({
          webhookUrl: 'http://discord.com/api/webhooks/123456789/abcdefghijk'
        })
      ).toThrow()
    })
  })

  describe('isValidWebhookUrl', () => {
    it('should accept valid Discord webhook URLs', () => {
      expect(isValidWebhookUrl('https://discord.com/api/webhooks/123456789/abcdefghijk')).toBe(true)
      expect(isValidWebhookUrl('https://discord.com/api/webhooks/123/abc-def_123')).toBe(true)
    })

    it('should reject invalid URLs', () => {
      expect(isValidWebhookUrl('https://example.com/webhook')).toBe(false)
      expect(isValidWebhookUrl('http://discord.com/api/webhooks/123/abc')).toBe(false)
      expect(isValidWebhookUrl('https://discord.com/channels/123')).toBe(false)
      expect(isValidWebhookUrl('not-a-url')).toBe(false)
    })
  })

  describe('isNotificationEnabled', () => {
    it('should return true when enabled', () => {
      const settings: DiscordSettings = {
        webhookUrl: 'https://discord.com/api/webhooks/123/abc',
        enabled: true,
        enabledNotifications: ['order.paid', 'talk.submitted']
      }

      expect(isNotificationEnabled(settings, 'order.paid')).toBe(true)
      expect(isNotificationEnabled(settings, 'talk.submitted')).toBe(true)
    })

    it('should return false when notification type not enabled', () => {
      const settings: DiscordSettings = {
        webhookUrl: 'https://discord.com/api/webhooks/123/abc',
        enabled: true,
        enabledNotifications: ['order.paid']
      }

      expect(isNotificationEnabled(settings, 'talk.submitted')).toBe(false)
    })

    it('should return false when Discord disabled', () => {
      const settings: DiscordSettings = {
        webhookUrl: 'https://discord.com/api/webhooks/123/abc',
        enabled: false,
        enabledNotifications: ['order.paid']
      }

      expect(isNotificationEnabled(settings, 'order.paid')).toBe(false)
    })
  })
})

describe('Discord Message Validation', () => {
  describe('validateDiscordMessage', () => {
    it('should validate simple content message', () => {
      const message = validateDiscordMessage({
        content: 'Hello, World!'
      })

      expect(message.content).toBe('Hello, World!')
    })

    it('should validate message with embeds', () => {
      const message = validateDiscordMessage({
        embeds: [
          {
            title: 'Test Title',
            description: 'Test Description',
            color: 3066993
          }
        ]
      })

      expect(message.embeds).toHaveLength(1)
    })

    it('should validate message with embed fields', () => {
      const message = validateDiscordMessage({
        embeds: [
          {
            title: 'Test',
            fields: [
              { name: 'Field 1', value: 'Value 1', inline: true },
              { name: 'Field 2', value: 'Value 2', inline: false }
            ]
          }
        ]
      })

      expect(message.embeds?.[0].fields).toHaveLength(2)
    })
  })
})

describe('Embed Builder Helpers', () => {
  describe('field', () => {
    it('should create embed field', () => {
      const result = field('Name', 'Value', true)
      expect(result.name).toBe('Name')
      expect(result.value).toBe('Value')
      expect(result.inline).toBe(true)
    })

    it('should default inline to false', () => {
      const result = field('Name', 'Value')
      expect(result.inline).toBe(false)
    })
  })

  describe('footer', () => {
    it('should create embed footer', () => {
      const result = footer('Footer text', 'https://example.com/icon.png')
      expect(result.text).toBe('Footer text')
      expect(result.icon_url).toBe('https://example.com/icon.png')
    })

    it('should work without icon', () => {
      const result = footer('Footer text')
      expect(result.text).toBe('Footer text')
      expect(result.icon_url).toBeUndefined()
    })
  })

  describe('author', () => {
    it('should create embed author', () => {
      const result = author('Author Name', 'https://example.com', 'https://example.com/icon.png')
      expect(result.name).toBe('Author Name')
      expect(result.url).toBe('https://example.com')
      expect(result.icon_url).toBe('https://example.com/icon.png')
    })
  })

  describe('embed', () => {
    it('should create simple embed', () => {
      const result = embed('Title', 'Description', 'success')
      expect(result.title).toBe('Title')
      expect(result.description).toBe('Description')
      expect(result.color).toBe(DISCORD_COLORS.success)
      expect(result.timestamp).toBeDefined()
    })

    it('should use default color', () => {
      const result = embed('Title')
      expect(result.color).toBe(DISCORD_COLORS.default)
    })
  })

  describe('embedWithFields', () => {
    it('should create embed with fields', () => {
      const fields = [field('F1', 'V1'), field('F2', 'V2')]
      const result = embedWithFields('Title', 'Description', fields, 'info')
      expect(result.title).toBe('Title')
      expect(result.description).toBe('Description')
      expect(result.fields).toHaveLength(2)
      expect(result.color).toBe(DISCORD_COLORS.info)
    })
  })
})

describe('Message Builders', () => {
  describe('buildOrderPaidMessage', () => {
    it('should build order paid message', () => {
      const message = buildOrderPaidMessage({
        orderId: 'order_123',
        orderNumber: 'ORD-12345',
        customerEmail: 'test@example.com',
        totalAmount: 198,
        ticketCount: 2,
        eventName: 'My Conference'
      })

      expect(message.content).toContain('New order')
      expect(message.embeds).toBeDefined()
      expect(message.embeds?.[0].title).toContain('ORD-12345')
    })

    it('should use default currency', () => {
      const message = buildOrderPaidMessage({
        orderId: 'order_123',
        orderNumber: 'ORD-12345',
        customerEmail: 'test@example.com',
        totalAmount: 100,
        ticketCount: 1
      })

      expect(message.embeds?.[0].description).toContain('EUR')
    })
  })

  describe('buildOrderRefundedMessage', () => {
    it('should build order refunded message', () => {
      const message = buildOrderRefundedMessage({
        orderId: 'order_123',
        orderNumber: 'ORD-12345',
        customerEmail: 'test@example.com',
        refundAmount: 98,
        reason: 'Cancellation'
      })

      expect(message.content).toContain('refunded')
      expect(message.embeds).toBeDefined()
    })
  })

  describe('buildTicketCheckedInMessage', () => {
    it('should build check-in message', () => {
      const message = buildTicketCheckedInMessage({
        ticketId: 'ticket_123',
        ticketNumber: 'TKT-12345',
        attendeeName: 'John Doe',
        ticketTypeName: 'Standard'
      })

      expect(message.content).toContain('Check-in')
      expect(message.content).toContain('John Doe')
      expect(message.embeds).toBeDefined()
    })
  })

  describe('buildTalkSubmittedMessage', () => {
    it('should build talk submitted message', () => {
      const message = buildTalkSubmittedMessage({
        talkId: 'talk_123',
        title: 'My Amazing Talk',
        speakerName: 'Jane Doe',
        speakerEmail: 'jane@example.com',
        categoryName: 'Tech',
        formatName: '45 min'
      })

      expect(message.content).toContain('submission')
      expect(message.embeds?.[0].title).toBe('My Amazing Talk')
    })
  })

  describe('buildTalkStatusChangedMessage', () => {
    it('should build accepted talk message with success color', () => {
      const message = buildTalkStatusChangedMessage({
        talkId: 'talk_123',
        title: 'My Talk',
        speakerName: 'Jane Doe',
        oldStatus: 'submitted',
        newStatus: 'accepted'
      })

      expect(message.content).toContain(':white_check_mark:')
      expect(message.embeds?.[0].color).toBe(DISCORD_COLORS.success)
    })

    it('should build rejected talk message with danger color', () => {
      const message = buildTalkStatusChangedMessage({
        talkId: 'talk_123',
        title: 'My Talk',
        speakerName: 'Jane Doe',
        oldStatus: 'submitted',
        newStatus: 'rejected'
      })

      expect(message.content).toContain(':x:')
      expect(message.embeds?.[0].color).toBe(DISCORD_COLORS.danger)
    })
  })

  describe('buildMemberInvitedMessage', () => {
    it('should build member invited message', () => {
      const message = buildMemberInvitedMessage({
        email: 'new@example.com',
        role: 'admin',
        invitedBy: 'John',
        organizationName: 'My Org'
      })

      expect(message.content).toContain('invited')
      expect(message.embeds).toBeDefined()
    })
  })

  describe('buildMemberJoinedMessage', () => {
    it('should build member joined message', () => {
      const message = buildMemberJoinedMessage({
        userName: 'Jane Doe',
        userEmail: 'jane@example.com',
        role: 'member',
        organizationName: 'My Org'
      })

      expect(message.content).toContain('joined')
      expect(message.embeds).toBeDefined()
    })
  })

  describe('buildSponsorConfirmedMessage', () => {
    it('should build sponsor confirmed message', () => {
      const message = buildSponsorConfirmedMessage({
        sponsorId: 'sponsor_123',
        companyName: 'ACME Corp',
        packageName: 'Gold',
        amount: 5000
      })

      expect(message.content).toContain('confirmed')
      expect(message.embeds?.[0].title).toBe('ACME Corp')
    })

    it('should work without amount', () => {
      const message = buildSponsorConfirmedMessage({
        sponsorId: 'sponsor_123',
        companyName: 'ACME Corp',
        packageName: 'Bronze'
      })

      expect(message.embeds?.[0].description).not.toContain('EUR')
    })
  })

  describe('buildSchedulePublishedMessage', () => {
    it('should build schedule published message', () => {
      const message = buildSchedulePublishedMessage({
        editionName: 'Conference 2026',
        sessionCount: 42,
        publishedBy: 'Admin'
      })

      expect(message.content).toContain('published')
      expect(message.embeds?.[0].title).toBe('Conference 2026')
    })
  })

  describe('buildCampaignSentMessage', () => {
    it('should build campaign sent message', () => {
      const message = buildCampaignSentMessage({
        campaignId: 'campaign_123',
        name: 'Newsletter',
        recipientCount: 500,
        sentBy: 'Marketing'
      })

      expect(message.content).toContain('sent')
      expect(message.embeds?.[0].title).toBe('Newsletter')
    })
  })

  describe('buildTestMessage', () => {
    it('should build test message', () => {
      const message = buildTestMessage('My Org')

      expect(message.content).toContain('Test notification')
      expect(message.embeds).toBeDefined()
    })
  })
})

describe('Helper Functions', () => {
  describe('getNotificationTypeLabel', () => {
    it('should return label for each type', () => {
      expect(getNotificationTypeLabel('order.paid')).toBe('Order Paid')
      expect(getNotificationTypeLabel('talk.submitted')).toBe('Talk Submitted')
    })
  })

  describe('getNotificationTypeDescription', () => {
    it('should return description for each type', () => {
      expect(getNotificationTypeDescription('order.paid')).toContain('ticket order')
      expect(getNotificationTypeDescription('talk.submitted')).toContain('talk is submitted')
    })
  })

  describe('getNotificationTypeEmoji', () => {
    it('should return emoji for each type', () => {
      expect(getNotificationTypeEmoji('order.paid')).toBe(':tickets:')
      expect(getNotificationTypeEmoji('ticket.checked_in')).toBe(':white_check_mark:')
    })
  })

  describe('isDiscordNotificationType', () => {
    it('should return true for valid Discord types', () => {
      expect(isDiscordNotificationType('order.paid')).toBe(true)
      expect(isDiscordNotificationType('talk.submitted')).toBe(true)
    })

    it('should return false for non-Discord types', () => {
      expect(isDiscordNotificationType('order.created')).toBe(false)
      expect(isDiscordNotificationType('contact.created')).toBe(false)
    })
  })

  describe('DISCORD_NOTIFICATION_TYPES', () => {
    it('should contain all expected types', () => {
      expect(DISCORD_NOTIFICATION_TYPES).toContain('order.paid')
      expect(DISCORD_NOTIFICATION_TYPES).toContain('order.refunded')
      expect(DISCORD_NOTIFICATION_TYPES).toContain('ticket.checked_in')
      expect(DISCORD_NOTIFICATION_TYPES).toContain('talk.submitted')
      expect(DISCORD_NOTIFICATION_TYPES).toContain('talk.status_changed')
      expect(DISCORD_NOTIFICATION_TYPES).toContain('member.invited')
      expect(DISCORD_NOTIFICATION_TYPES).toContain('member.joined')
      expect(DISCORD_NOTIFICATION_TYPES).toContain('sponsor.confirmed')
      expect(DISCORD_NOTIFICATION_TYPES).toContain('schedule.published')
      expect(DISCORD_NOTIFICATION_TYPES).toContain('campaign.sent')
    })

    it('should have 10 notification types', () => {
      expect(DISCORD_NOTIFICATION_TYPES).toHaveLength(10)
    })
  })
})

describe('Discord Service', () => {
  const mockSettings: DiscordSettings = {
    webhookUrl: 'https://discord.com/api/webhooks/123456789/abcdefghijk',
    enabled: true,
    username: 'Test Bot',
    enabledNotifications: ['order.paid', 'talk.submitted']
  }

  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  describe('createDiscordService', () => {
    it('should create service with settings', () => {
      const service = createDiscordService({ settings: mockSettings })

      expect(service.sendMessage).toBeDefined()
      expect(service.sendNotification).toBeDefined()
      expect(service.sendTestMessage).toBeDefined()
    })
  })

  describe('sendMessage', () => {
    it('should send message successfully', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true
      } as Response)

      const service = createDiscordService({ settings: mockSettings })
      const result = await service.sendMessage({ content: 'Hello' })

      expect(result.success).toBe(true)
      expect(result.timestamp).toBeDefined()
      expect(global.fetch).toHaveBeenCalledWith(
        mockSettings.webhookUrl,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
      )
    })

    it('should fail when Discord disabled', async () => {
      const service = createDiscordService({
        settings: { ...mockSettings, enabled: false }
      })
      const result = await service.sendMessage({ content: 'Hello' })

      expect(result.success).toBe(false)
      expect(result.error).toContain('not enabled')
    })

    it('should handle HTTP errors', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: () => Promise.resolve('not_found')
      } as unknown as Response)

      const service = createDiscordService({ settings: mockSettings })
      const result = await service.sendMessage({ content: 'Hello' })

      expect(result.success).toBe(false)
      expect(result.error).toContain('404')
    })

    it('should mark 5xx errors as retryable', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve('internal_error')
      } as unknown as Response)

      const service = createDiscordService({ settings: mockSettings })
      const result = await service.sendMessage({ content: 'Hello' })

      expect(result.success).toBe(false)
      expect(result.retryable).toBe(true)
    })

    it('should mark 429 errors as retryable', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: () => Promise.resolve('rate_limited')
      } as unknown as Response)

      const service = createDiscordService({ settings: mockSettings })
      const result = await service.sendMessage({ content: 'Hello' })

      expect(result.success).toBe(false)
      expect(result.retryable).toBe(true)
    })

    it('should handle network errors', async () => {
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'))

      const service = createDiscordService({ settings: mockSettings })
      const result = await service.sendMessage({ content: 'Hello' })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Network error')
      expect(result.retryable).toBe(true)
    })
  })

  describe('sendNotification', () => {
    it('should send notification when enabled', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true
      } as Response)

      const service = createDiscordService({ settings: mockSettings })
      const result = await service.sendNotification('order.paid', { content: 'Order paid' })

      expect(result.success).toBe(true)
    })

    it('should fail when notification type not enabled', async () => {
      const service = createDiscordService({ settings: mockSettings })
      const result = await service.sendNotification('ticket.checked_in', { content: 'Check-in' })

      expect(result.success).toBe(false)
      expect(result.error).toContain('not enabled')
    })
  })

  describe('sendTestMessage', () => {
    it('should send test message', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true
      } as Response)

      const service = createDiscordService({ settings: mockSettings })
      const result = await service.sendTestMessage('My Organization')

      expect(result.success).toBe(true)
      expect(global.fetch).toHaveBeenCalled()
    })
  })
})

describe('Event Bus Integration', () => {
  let eventBus: EventBus
  let cleanup: () => void

  const mockSettings: DiscordSettings = {
    webhookUrl: 'https://discord.com/api/webhooks/123456789/abcdefghijk',
    enabled: true,
    enabledNotifications: ['order.paid', 'talk.submitted', 'member.joined']
  }

  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn().mockResolvedValue({ ok: true } as Response)
    eventBus = new EventBus()
    setEventBus(eventBus)
  })

  afterEach(() => {
    if (cleanup) cleanup()
    resetEventBus()
  })

  it('should register event listeners', () => {
    const service = createDiscordService({ settings: mockSettings })
    cleanup = registerDiscordEventListeners(service)

    // Should have subscribers for all Discord notification types
    expect(eventBus.hasSubscribers('order.paid')).toBe(true)
    expect(eventBus.hasSubscribers('talk.submitted')).toBe(true)
    expect(eventBus.hasSubscribers('member.joined')).toBe(true)
  })

  it('should send Discord message on order.paid event', async () => {
    const service = createDiscordService({ settings: mockSettings })
    cleanup = registerDiscordEventListeners(service)

    await eventBus.emitAndWait('order.paid', {
      orderId: 'order_123',
      editionId: 'edition_456',
      customerEmail: 'test@example.com',
      ticketCount: 2,
      timestamp: new Date()
    })

    expect(global.fetch).toHaveBeenCalled()
  })

  it('should send Discord message on talk.submitted event', async () => {
    const service = createDiscordService({ settings: mockSettings })
    cleanup = registerDiscordEventListeners(service)

    await eventBus.emitAndWait('talk.submitted', {
      talkId: 'talk_123',
      editionId: 'edition_456',
      title: 'My Talk',
      speakerName: 'Jane Doe',
      speakerEmail: 'jane@example.com',
      timestamp: new Date()
    })

    expect(global.fetch).toHaveBeenCalled()
  })

  it('should cleanup listeners', () => {
    const service = createDiscordService({ settings: mockSettings })
    cleanup = registerDiscordEventListeners(service)

    expect(eventBus.getSubscriptionCount()).toBeGreaterThan(0)

    cleanup()

    expect(eventBus.getSubscriptionCount()).toBe(0)
  })

  it('should not send when notification type disabled', async () => {
    const limitedSettings: DiscordSettings = {
      ...mockSettings,
      enabledNotifications: ['order.paid'] // Only order.paid enabled
    }

    const service = createDiscordService({ settings: limitedSettings })
    cleanup = registerDiscordEventListeners(service)

    await eventBus.emitAndWait('talk.submitted', {
      talkId: 'talk_123',
      editionId: 'edition_456',
      title: 'My Talk',
      speakerName: 'Jane Doe',
      speakerEmail: 'jane@example.com',
      timestamp: new Date()
    })

    // Fetch called but notification should not be sent (disabled type)
    // The handler still runs, but sendNotification returns early
    expect(global.fetch).not.toHaveBeenCalled()
  })
})
