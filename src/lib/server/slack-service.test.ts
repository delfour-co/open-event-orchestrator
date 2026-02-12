/**
 * Slack Service Tests
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { EventBus, resetEventBus, setEventBus } from './event-bus'
import {
  SLACK_COLORS,
  SLACK_NOTIFICATION_TYPES,
  type SlackSettings,
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
  coloredAttachment,
  context,
  createSlackService,
  divider,
  fieldsSection,
  getNotificationTypeDescription,
  getNotificationTypeEmoji,
  getNotificationTypeLabel,
  header,
  isNotificationEnabled,
  isSlackNotificationType,
  isValidWebhookUrl,
  mrkdwn,
  plainText,
  registerSlackEventListeners,
  section,
  text,
  validateSlackMessage,
  validateSlackSettings
} from './slack-service'

describe('Slack Settings', () => {
  describe('validateSlackSettings', () => {
    it('should validate valid settings', () => {
      const settings = validateSlackSettings({
        webhookUrl: 'https://hooks.slack.com/services/T00/B00/xxx',
        enabled: true,
        channel: '#notifications',
        enabledNotifications: ['order.paid', 'talk.submitted']
      })

      expect(settings.webhookUrl).toBe('https://hooks.slack.com/services/T00/B00/xxx')
      expect(settings.enabled).toBe(true)
      expect(settings.channel).toBe('#notifications')
      expect(settings.enabledNotifications).toHaveLength(2)
    })

    it('should apply defaults', () => {
      const settings = validateSlackSettings({
        webhookUrl: 'https://hooks.slack.com/services/T00/B00/xxx'
      })

      expect(settings.enabled).toBe(false)
      expect(settings.enabledNotifications).toEqual([])
    })

    it('should reject invalid webhook URL', () => {
      expect(() =>
        validateSlackSettings({
          webhookUrl: 'https://example.com/webhook'
        })
      ).toThrow()
    })

    it('should reject non-https webhook', () => {
      expect(() =>
        validateSlackSettings({
          webhookUrl: 'http://hooks.slack.com/services/T00/B00/xxx'
        })
      ).toThrow()
    })
  })

  describe('isValidWebhookUrl', () => {
    it('should accept valid Slack webhook URLs', () => {
      expect(isValidWebhookUrl('https://hooks.slack.com/services/T00/B00/xxx')).toBe(true)
      expect(isValidWebhookUrl('https://hooks.slack.com/workflows/xxx')).toBe(true)
    })

    it('should reject invalid URLs', () => {
      expect(isValidWebhookUrl('https://example.com/webhook')).toBe(false)
      expect(isValidWebhookUrl('http://hooks.slack.com/services/T00/B00/xxx')).toBe(false)
      expect(isValidWebhookUrl('not-a-url')).toBe(false)
    })
  })

  describe('isNotificationEnabled', () => {
    it('should return true when enabled', () => {
      const settings: SlackSettings = {
        webhookUrl: 'https://hooks.slack.com/services/T00/B00/xxx',
        enabled: true,
        enabledNotifications: ['order.paid', 'talk.submitted']
      }

      expect(isNotificationEnabled(settings, 'order.paid')).toBe(true)
      expect(isNotificationEnabled(settings, 'talk.submitted')).toBe(true)
    })

    it('should return false when notification type not enabled', () => {
      const settings: SlackSettings = {
        webhookUrl: 'https://hooks.slack.com/services/T00/B00/xxx',
        enabled: true,
        enabledNotifications: ['order.paid']
      }

      expect(isNotificationEnabled(settings, 'talk.submitted')).toBe(false)
    })

    it('should return false when Slack disabled', () => {
      const settings: SlackSettings = {
        webhookUrl: 'https://hooks.slack.com/services/T00/B00/xxx',
        enabled: false,
        enabledNotifications: ['order.paid']
      }

      expect(isNotificationEnabled(settings, 'order.paid')).toBe(false)
    })
  })
})

describe('Slack Message Validation', () => {
  describe('validateSlackMessage', () => {
    it('should validate simple text message', () => {
      const message = validateSlackMessage({
        text: 'Hello, World!'
      })

      expect(message.text).toBe('Hello, World!')
    })

    it('should validate message with blocks', () => {
      const message = validateSlackMessage({
        blocks: [
          { type: 'header', text: { type: 'plain_text', text: 'Header' } },
          { type: 'section', text: { type: 'mrkdwn', text: 'Content' } },
          { type: 'divider' }
        ]
      })

      expect(message.blocks).toHaveLength(3)
    })

    it('should validate message with attachments', () => {
      const message = validateSlackMessage({
        text: 'Message with attachment',
        attachments: [
          {
            color: '#36a64f',
            text: 'Attachment text'
          }
        ]
      })

      expect(message.attachments).toHaveLength(1)
      expect(message.attachments?.[0].color).toBe('#36a64f')
    })
  })
})

describe('Block Kit Helpers', () => {
  describe('text', () => {
    it('should create mrkdwn text by default', () => {
      const result = text('Hello')
      expect(result.type).toBe('mrkdwn')
      expect(result.text).toBe('Hello')
    })

    it('should create plain_text when specified', () => {
      const result = text('Hello', 'plain_text')
      expect(result.type).toBe('plain_text')
    })
  })

  describe('plainText', () => {
    it('should create plain_text with emoji', () => {
      const result = plainText('Hello')
      expect(result.type).toBe('plain_text')
      expect(result.emoji).toBe(true)
    })
  })

  describe('mrkdwn', () => {
    it('should create mrkdwn text', () => {
      const result = mrkdwn('*bold* and _italic_')
      expect(result.type).toBe('mrkdwn')
      expect(result.text).toBe('*bold* and _italic_')
    })
  })

  describe('header', () => {
    it('should create header block', () => {
      const result = header('My Header')
      expect(result.type).toBe('header')
      if ('text' in result && result.text) {
        expect(result.text.type).toBe('plain_text')
        expect(result.text.text).toBe('My Header')
      }
    })
  })

  describe('section', () => {
    it('should create section with text', () => {
      const result = section('Section content')
      expect(result.type).toBe('section')
      if ('text' in result && result.text) {
        expect(result.text.text).toBe('Section content')
      }
    })

    it('should create section with fields', () => {
      const result = section('Main text', ['Field 1', 'Field 2'])
      expect(result.type).toBe('section')
      if ('fields' in result && result.fields) {
        expect(result.fields).toHaveLength(2)
      }
    })
  })

  describe('fieldsSection', () => {
    it('should create section with only fields', () => {
      const result = fieldsSection(['*Label 1*\nValue 1', '*Label 2*\nValue 2'])
      expect(result.type).toBe('section')
      if ('fields' in result && result.fields) {
        expect(result.fields).toHaveLength(2)
      }
    })
  })

  describe('divider', () => {
    it('should create divider block', () => {
      const result = divider()
      expect(result.type).toBe('divider')
    })
  })

  describe('context', () => {
    it('should create context block', () => {
      const result = context('Element 1', 'Element 2')
      expect(result.type).toBe('context')
      if ('elements' in result && result.elements) {
        expect(result.elements).toHaveLength(2)
      }
    })
  })

  describe('coloredAttachment', () => {
    it('should create attachment with color', () => {
      const result = coloredAttachment('success', 'Success message')
      expect(result.color).toBe(SLACK_COLORS.success)
      expect(result.text).toBe('Success message')
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

      expect(message.text).toContain('New order')
      expect(message.text).toContain('ORD-12345')
      expect(message.text).toContain('2 ticket(s)')
      expect(message.text).toContain('198€')
      expect(message.blocks).toBeDefined()
    })

    it('should use default currency', () => {
      const message = buildOrderPaidMessage({
        orderId: 'order_123',
        orderNumber: 'ORD-12345',
        customerEmail: 'test@example.com',
        totalAmount: 100,
        ticketCount: 1
      })

      expect(message.text).toContain('€')
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

      expect(message.text).toContain('Refund')
      expect(message.text).toContain('98€')
      expect(message.blocks).toBeDefined()
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

      expect(message.text).toContain('Check-in')
      expect(message.text).toContain('John Doe')
      expect(message.blocks).toBeDefined()
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

      expect(message.text).toContain('New submission')
      expect(message.text).toContain('My Amazing Talk')
      expect(message.text).toContain('Jane Doe')
      expect(message.blocks).toBeDefined()
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

      expect(message.text).toContain('✅')
      expect(message.text).toContain('accepted')
      expect(message.attachments?.[0].color).toBe(SLACK_COLORS.success)
    })

    it('should build rejected talk message with danger color', () => {
      const message = buildTalkStatusChangedMessage({
        talkId: 'talk_123',
        title: 'My Talk',
        speakerName: 'Jane Doe',
        oldStatus: 'submitted',
        newStatus: 'rejected'
      })

      expect(message.text).toContain('❌')
      expect(message.text).toContain('rejected')
      expect(message.attachments?.[0].color).toBe(SLACK_COLORS.danger)
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

      expect(message.text).toContain('new@example.com')
      expect(message.text).toContain('admin')
      expect(message.blocks).toBeDefined()
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

      expect(message.text).toContain('Jane Doe')
      expect(message.text).toContain('member')
      expect(message.blocks).toBeDefined()
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

      expect(message.text).toContain('ACME Corp')
      expect(message.text).toContain('Gold')
      expect(message.text).toContain('5000€')
      expect(message.blocks).toBeDefined()
    })

    it('should work without amount', () => {
      const message = buildSponsorConfirmedMessage({
        sponsorId: 'sponsor_123',
        companyName: 'ACME Corp',
        packageName: 'Bronze'
      })

      expect(message.text).not.toContain('€')
    })
  })

  describe('buildSchedulePublishedMessage', () => {
    it('should build schedule published message', () => {
      const message = buildSchedulePublishedMessage({
        editionName: 'Conference 2026',
        sessionCount: 42,
        publishedBy: 'Admin'
      })

      expect(message.text).toContain('Conference 2026')
      expect(message.text).toContain('42 sessions')
      expect(message.blocks).toBeDefined()
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

      expect(message.text).toContain('Newsletter')
      expect(message.text).toContain('500 recipients')
      expect(message.blocks).toBeDefined()
    })
  })

  describe('buildTestMessage', () => {
    it('should build test message', () => {
      const message = buildTestMessage('My Org')

      expect(message.text).toContain('Test notification')
      expect(message.blocks).toBeDefined()
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
      expect(getNotificationTypeEmoji('order.paid')).toBe('🎫')
      expect(getNotificationTypeEmoji('ticket.checked_in')).toBe('✅')
    })
  })

  describe('isSlackNotificationType', () => {
    it('should return true for valid Slack types', () => {
      expect(isSlackNotificationType('order.paid')).toBe(true)
      expect(isSlackNotificationType('talk.submitted')).toBe(true)
    })

    it('should return false for non-Slack types', () => {
      expect(isSlackNotificationType('order.created')).toBe(false)
      expect(isSlackNotificationType('contact.created')).toBe(false)
    })
  })

  describe('SLACK_NOTIFICATION_TYPES', () => {
    it('should contain all expected types', () => {
      expect(SLACK_NOTIFICATION_TYPES).toContain('order.paid')
      expect(SLACK_NOTIFICATION_TYPES).toContain('order.refunded')
      expect(SLACK_NOTIFICATION_TYPES).toContain('ticket.checked_in')
      expect(SLACK_NOTIFICATION_TYPES).toContain('talk.submitted')
      expect(SLACK_NOTIFICATION_TYPES).toContain('talk.status_changed')
      expect(SLACK_NOTIFICATION_TYPES).toContain('member.invited')
      expect(SLACK_NOTIFICATION_TYPES).toContain('member.joined')
      expect(SLACK_NOTIFICATION_TYPES).toContain('sponsor.confirmed')
      expect(SLACK_NOTIFICATION_TYPES).toContain('schedule.published')
      expect(SLACK_NOTIFICATION_TYPES).toContain('campaign.sent')
    })

    it('should have 10 notification types', () => {
      expect(SLACK_NOTIFICATION_TYPES).toHaveLength(10)
    })
  })
})

describe('Slack Service', () => {
  const mockSettings: SlackSettings = {
    webhookUrl: 'https://hooks.slack.com/services/T00/B00/xxx',
    enabled: true,
    channel: '#notifications',
    enabledNotifications: ['order.paid', 'talk.submitted']
  }

  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  describe('createSlackService', () => {
    it('should create service with settings', () => {
      const service = createSlackService({ settings: mockSettings })

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

      const service = createSlackService({ settings: mockSettings })
      const result = await service.sendMessage({ text: 'Hello' })

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

    it('should fail when Slack disabled', async () => {
      const service = createSlackService({
        settings: { ...mockSettings, enabled: false }
      })
      const result = await service.sendMessage({ text: 'Hello' })

      expect(result.success).toBe(false)
      expect(result.error).toContain('not enabled')
    })

    it('should handle HTTP errors', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: () => Promise.resolve('not_found')
      } as unknown as Response)

      const service = createSlackService({ settings: mockSettings })
      const result = await service.sendMessage({ text: 'Hello' })

      expect(result.success).toBe(false)
      expect(result.error).toContain('404')
    })

    it('should mark 5xx errors as retryable', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve('internal_error')
      } as unknown as Response)

      const service = createSlackService({ settings: mockSettings })
      const result = await service.sendMessage({ text: 'Hello' })

      expect(result.success).toBe(false)
      expect(result.retryable).toBe(true)
    })

    it('should mark 429 errors as retryable', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: () => Promise.resolve('rate_limited')
      } as unknown as Response)

      const service = createSlackService({ settings: mockSettings })
      const result = await service.sendMessage({ text: 'Hello' })

      expect(result.success).toBe(false)
      expect(result.retryable).toBe(true)
    })

    it('should handle network errors', async () => {
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'))

      const service = createSlackService({ settings: mockSettings })
      const result = await service.sendMessage({ text: 'Hello' })

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

      const service = createSlackService({ settings: mockSettings })
      const result = await service.sendNotification('order.paid', { text: 'Order paid' })

      expect(result.success).toBe(true)
    })

    it('should fail when notification type not enabled', async () => {
      const service = createSlackService({ settings: mockSettings })
      const result = await service.sendNotification('ticket.checked_in', { text: 'Check-in' })

      expect(result.success).toBe(false)
      expect(result.error).toContain('not enabled')
    })
  })

  describe('sendTestMessage', () => {
    it('should send test message', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true
      } as Response)

      const service = createSlackService({ settings: mockSettings })
      const result = await service.sendTestMessage('My Organization')

      expect(result.success).toBe(true)
      expect(global.fetch).toHaveBeenCalled()
    })
  })
})

describe('Event Bus Integration', () => {
  let eventBus: EventBus
  let cleanup: () => void

  const mockSettings: SlackSettings = {
    webhookUrl: 'https://hooks.slack.com/services/T00/B00/xxx',
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
    const service = createSlackService({ settings: mockSettings })
    cleanup = registerSlackEventListeners(service)

    // Should have subscribers for all Slack notification types
    expect(eventBus.hasSubscribers('order.paid')).toBe(true)
    expect(eventBus.hasSubscribers('talk.submitted')).toBe(true)
    expect(eventBus.hasSubscribers('member.joined')).toBe(true)
  })

  it('should send Slack message on order.paid event', async () => {
    const service = createSlackService({ settings: mockSettings })
    cleanup = registerSlackEventListeners(service)

    await eventBus.emitAndWait('order.paid', {
      orderId: 'order_123',
      editionId: 'edition_456',
      customerEmail: 'test@example.com',
      ticketCount: 2,
      timestamp: new Date()
    })

    expect(global.fetch).toHaveBeenCalled()
  })

  it('should send Slack message on talk.submitted event', async () => {
    const service = createSlackService({ settings: mockSettings })
    cleanup = registerSlackEventListeners(service)

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
    const service = createSlackService({ settings: mockSettings })
    cleanup = registerSlackEventListeners(service)

    expect(eventBus.getSubscriptionCount()).toBeGreaterThan(0)

    cleanup()

    expect(eventBus.getSubscriptionCount()).toBe(0)
  })

  it('should not send when notification type disabled', async () => {
    const limitedSettings: SlackSettings = {
      ...mockSettings,
      enabledNotifications: ['order.paid'] // Only order.paid enabled
    }

    const service = createSlackService({ settings: limitedSettings })
    cleanup = registerSlackEventListeners(service)

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
