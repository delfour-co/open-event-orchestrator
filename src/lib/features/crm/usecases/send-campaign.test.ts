import { getEmailService } from '$lib/server/app-settings'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSendCampaignUseCase } from './send-campaign'

vi.mock('$lib/server/app-settings', () => ({
  getEmailService: vi.fn()
}))

vi.mock('$env/dynamic/public', () => ({
  env: { PUBLIC_POCKETBASE_URL: 'http://localhost:8090' }
}))

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

const createMockPb = () => {
  // biome-ignore lint/suspicious/noExplicitAny: mock PocketBase collections
  const collections: Record<string, any> = {}
  return {
    collection: vi.fn((name: string) => {
      if (!collections[name]) {
        collections[name] = {
          getList: vi.fn(),
          getFullList: vi.fn(),
          getOne: vi.fn(),
          create: vi.fn(),
          update: vi.fn(),
          delete: vi.fn()
        }
      }
      return collections[name]
    })
    // biome-ignore lint/suspicious/noExplicitAny: mock PocketBase client
  } as any
}

const createMockEmailService = () => ({
  send: vi.fn().mockResolvedValue({ success: true })
})

describe('createSendCampaignUseCase', () => {
  let pb: ReturnType<typeof createMockPb>
  let sendCampaign: ReturnType<typeof createSendCampaignUseCase>
  let mockEmailService: ReturnType<typeof createMockEmailService>

  beforeEach(() => {
    vi.clearAllMocks()
    pb = createMockPb()
    sendCampaign = createSendCampaignUseCase(pb)
    mockEmailService = createMockEmailService()
    // biome-ignore lint/suspicious/noExplicitAny: mock email service
    vi.mocked(getEmailService).mockResolvedValue(mockEmailService as any)
  })

  it('throws error when campaign is not found', async () => {
    pb.collection('email_campaigns').getOne.mockResolvedValue(null)

    await expect(sendCampaign('nonexistent')).rejects.toThrow('Campaign not found')
  })

  it('throws error when campaign is not in draft status', async () => {
    pb.collection('email_campaigns').getOne.mockResolvedValue({
      id: 'camp1',
      status: 'sent',
      eventId: 'event1'
    })

    await expect(sendCampaign('camp1')).rejects.toThrow('Campaign is not in draft status')
  })

  it('filters contacts by marketing consent', async () => {
    pb.collection('email_campaigns').getOne.mockResolvedValue({
      id: 'camp1',
      status: 'draft',
      eventId: 'event1',
      subject: 'Hello',
      bodyHtml: '<p>Hi</p>',
      bodyText: 'Hi'
    })

    pb.collection('events').getOne.mockResolvedValue({ id: 'event1', name: 'TestEvent' })

    // Three contacts
    pb.collection('contacts').getFullList.mockResolvedValue([
      {
        id: 'c1',
        email: 'a@test.com',
        firstName: 'A',
        lastName: 'One',
        company: '',
        unsubscribeToken: 'tok1'
      },
      {
        id: 'c2',
        email: 'b@test.com',
        firstName: 'B',
        lastName: 'Two',
        company: '',
        unsubscribeToken: 'tok2'
      },
      {
        id: 'c3',
        email: 'c@test.com',
        firstName: 'C',
        lastName: 'Three',
        company: '',
        unsubscribeToken: 'tok3'
      }
    ])

    // Only c1 and c3 have marketing consent
    pb.collection('consents')
      .getList.mockResolvedValueOnce({ items: [{ id: 'consent1' }] }) // c1: has consent
      .mockResolvedValueOnce({ items: [] }) // c2: no consent
      .mockResolvedValueOnce({ items: [{ id: 'consent3' }] }) // c3: has consent

    pb.collection('email_campaigns').update.mockResolvedValue({})

    const result = await sendCampaign('camp1')

    expect(result.totalRecipients).toBe(2)
    expect(result.totalSent).toBe(2)
    expect(mockEmailService.send).toHaveBeenCalledTimes(2)
  })

  it('sends emails with interpolated template variables', async () => {
    pb.collection('email_campaigns').getOne.mockResolvedValue({
      id: 'camp1',
      status: 'draft',
      eventId: 'event1',
      subject: 'Welcome {{firstName}}!',
      bodyHtml: '<p>Hello {{firstName}} {{lastName}} from {{company}} - Event: {{eventName}}</p>',
      bodyText: 'Hello {{firstName}} {{lastName}} from {{company}} - Event: {{eventName}}'
    })

    pb.collection('events').getOne.mockResolvedValue({ id: 'event1', name: 'DevConf' })

    pb.collection('contacts').getFullList.mockResolvedValue([
      {
        id: 'c1',
        email: 'alice@example.com',
        firstName: 'Alice',
        lastName: 'Martin',
        company: 'TechCo',
        unsubscribeToken: 'existing-token'
      }
    ])

    pb.collection('consents').getList.mockResolvedValue({ items: [{ id: 'consent1' }] })
    pb.collection('email_campaigns').update.mockResolvedValue({})

    await sendCampaign('camp1')

    expect(mockEmailService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'alice@example.com',
        subject: 'Welcome Alice!',
        html: expect.stringContaining('Hello Alice Martin from TechCo - Event: DevConf'),
        text: expect.stringContaining('Hello Alice Martin from TechCo - Event: DevConf')
      })
    )
  })

  it('generates unsubscribe tokens for contacts without one', async () => {
    pb.collection('email_campaigns').getOne.mockResolvedValue({
      id: 'camp1',
      status: 'draft',
      eventId: 'event1',
      subject: 'Hi',
      bodyHtml: '<p>Hi {{unsubscribeUrl}}</p>',
      bodyText: 'Hi {{unsubscribeUrl}}'
    })

    pb.collection('events').getOne.mockResolvedValue({ id: 'event1', name: 'Event' })

    // Contact without unsubscribeToken
    pb.collection('contacts').getFullList.mockResolvedValue([
      {
        id: 'c1',
        email: 'notoken@example.com',
        firstName: 'No',
        lastName: 'Token',
        company: '',
        unsubscribeToken: '' // No token
      }
    ])

    pb.collection('consents').getList.mockResolvedValue({ items: [{ id: 'consent1' }] })
    pb.collection('contacts').update.mockResolvedValue({})
    pb.collection('email_campaigns').update.mockResolvedValue({})

    await sendCampaign('camp1')

    // Should have generated and saved a UUID token
    expect(pb.collection('contacts').update).toHaveBeenCalledWith('c1', {
      unsubscribeToken: expect.stringMatching(UUID_REGEX)
    })

    // Extract the generated token from the update call
    const generatedToken = pb.collection('contacts').update.mock.calls[0][1].unsubscribeToken

    // The unsubscribe URL should use the generated token
    expect(mockEmailService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining(`http://localhost:5173/unsubscribe/${generatedToken}`)
      })
    )
  })

  it('tracks sent/failed counts', async () => {
    pb.collection('email_campaigns').getOne.mockResolvedValue({
      id: 'camp1',
      status: 'draft',
      eventId: 'event1',
      subject: 'Hi',
      bodyHtml: '<p>Hi</p>',
      bodyText: 'Hi'
    })

    pb.collection('events').getOne.mockResolvedValue({ id: 'event1', name: 'Event' })

    pb.collection('contacts').getFullList.mockResolvedValue([
      {
        id: 'c1',
        email: 'ok@test.com',
        firstName: 'A',
        lastName: 'B',
        company: '',
        unsubscribeToken: 'tok1'
      },
      {
        id: 'c2',
        email: 'fail@test.com',
        firstName: 'C',
        lastName: 'D',
        company: '',
        unsubscribeToken: 'tok2'
      },
      {
        id: 'c3',
        email: 'ok2@test.com',
        firstName: 'E',
        lastName: 'F',
        company: '',
        unsubscribeToken: 'tok3'
      }
    ])

    // All have consent
    pb.collection('consents').getList.mockResolvedValue({ items: [{ id: 'consent' }] })
    pb.collection('email_campaigns').update.mockResolvedValue({})

    // Second email fails
    mockEmailService.send
      .mockResolvedValueOnce({ success: true })
      .mockResolvedValueOnce({ success: false, error: 'SMTP error' })
      .mockResolvedValueOnce({ success: true })

    const result = await sendCampaign('camp1')

    expect(result.totalRecipients).toBe(3)
    expect(result.totalSent).toBe(2)
    expect(result.totalFailed).toBe(1)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toEqual({ email: 'fail@test.com', error: 'SMTP error' })
  })

  it('updates campaign status to sent on success', async () => {
    pb.collection('email_campaigns').getOne.mockResolvedValue({
      id: 'camp1',
      status: 'draft',
      eventId: 'event1',
      subject: 'Hi',
      bodyHtml: '<p>Hi</p>',
      bodyText: 'Hi'
    })

    pb.collection('events').getOne.mockResolvedValue({ id: 'event1', name: 'Event' })
    pb.collection('contacts').getFullList.mockResolvedValue([
      {
        id: 'c1',
        email: 'a@test.com',
        firstName: 'A',
        lastName: 'B',
        company: '',
        unsubscribeToken: 'tok1'
      }
    ])
    pb.collection('consents').getList.mockResolvedValue({ items: [{ id: 'consent' }] })
    pb.collection('email_campaigns').update.mockResolvedValue({})

    await sendCampaign('camp1')

    // Should have been called with 'sending' first, then 'sent'
    const updateCalls = pb.collection('email_campaigns').update.mock.calls
    expect(updateCalls[0]).toEqual(['camp1', { status: 'sending' }])

    // Final update with 'sent' status
    // biome-ignore lint/suspicious/noExplicitAny: type cast for mock assertion
    const sentCall = updateCalls.find((call: any[]) => call[1].status === 'sent')
    expect(sentCall).toBeDefined()
    expect(sentCall?.[1]).toEqual(
      expect.objectContaining({
        status: 'sent',
        totalSent: 1,
        totalFailed: 0,
        sentAt: expect.any(String)
      })
    )
  })

  it('resets to draft on catastrophic failure', async () => {
    pb.collection('email_campaigns').getOne.mockResolvedValue({
      id: 'camp1',
      status: 'draft',
      eventId: 'event1',
      subject: 'Hi',
      bodyHtml: '<p>Hi</p>',
      bodyText: 'Hi'
    })

    pb.collection('events').getOne.mockResolvedValue({ id: 'event1', name: 'Event' })
    pb.collection('email_campaigns').update.mockResolvedValue({})

    // Catastrophic failure: getFullList throws
    pb.collection('contacts').getFullList.mockRejectedValue(new Error('Database connection lost'))

    await expect(sendCampaign('camp1')).rejects.toThrow('Database connection lost')

    // Should have set status to 'sending' then back to 'draft'
    const updateCalls = pb.collection('email_campaigns').update.mock.calls
    expect(updateCalls[0]).toEqual(['camp1', { status: 'sending' }])
    expect(updateCalls[1]).toEqual(['camp1', { status: 'draft' }])
  })

  it('adds email tracking when enabled', async () => {
    pb.collection('email_campaigns').getOne.mockResolvedValue({
      id: 'camp1',
      status: 'draft',
      eventId: 'event1',
      subject: 'Hi',
      bodyHtml: '<html><body><p>Hi</p><a href="https://example.com">Link</a></body></html>',
      bodyText: 'Hi https://example.com',
      enableOpenTracking: true,
      enableClickTracking: true
    })

    pb.collection('events').getOne.mockResolvedValue({ id: 'event1', name: 'Event' })
    pb.collection('contacts').getFullList.mockResolvedValue([
      {
        id: 'contact123',
        email: 'test@test.com',
        firstName: 'Test',
        lastName: 'User',
        company: '',
        unsubscribeToken: 'tok1'
      }
    ])

    pb.collection('consents').getList.mockResolvedValue({ items: [{ id: 'consent' }] })
    pb.collection('email_campaigns').update.mockResolvedValue({})

    await sendCampaign('camp1')

    const sentEmail = mockEmailService.send.mock.calls[0][0]
    // Should contain tracking pixel
    expect(sentEmail.html).toContain('/api/tracking/open/')
    expect(sentEmail.html).toContain('width="1" height="1"')
    // Should have rewritten links
    expect(sentEmail.html).toContain('/api/tracking/click/')
    expect(sentEmail.text).toContain('/api/tracking/click/')
  })

  it('disables tracking when campaign settings are false', async () => {
    pb.collection('email_campaigns').getOne.mockResolvedValue({
      id: 'camp1',
      status: 'draft',
      eventId: 'event1',
      subject: 'Hi',
      bodyHtml: '<html><body><p>Hi</p><a href="https://example.com">Link</a></body></html>',
      bodyText: 'Hi https://example.com',
      enableOpenTracking: false,
      enableClickTracking: false
    })

    pb.collection('events').getOne.mockResolvedValue({ id: 'event1', name: 'Event' })
    pb.collection('contacts').getFullList.mockResolvedValue([
      {
        id: 'contact123',
        email: 'test@test.com',
        firstName: 'Test',
        lastName: 'User',
        company: '',
        unsubscribeToken: 'tok1'
      }
    ])

    pb.collection('consents').getList.mockResolvedValue({ items: [{ id: 'consent' }] })
    pb.collection('email_campaigns').update.mockResolvedValue({})

    await sendCampaign('camp1')

    const sentEmail = mockEmailService.send.mock.calls[0][0]
    // Should NOT contain tracking pixel
    expect(sentEmail.html).not.toContain('/api/tracking/open/')
    // Should NOT rewrite links
    expect(sentEmail.html).toContain('href="https://example.com"')
    expect(sentEmail.text).toContain('https://example.com')
    expect(sentEmail.text).not.toContain('/api/tracking/click/')
  })

  it('handles individual email failures gracefully and continues sending', async () => {
    pb.collection('email_campaigns').getOne.mockResolvedValue({
      id: 'camp1',
      status: 'draft',
      eventId: 'event1',
      subject: 'Hi',
      bodyHtml: '<p>Hi</p>',
      bodyText: 'Hi'
    })

    pb.collection('events').getOne.mockResolvedValue({ id: 'event1', name: 'Event' })

    pb.collection('contacts').getFullList.mockResolvedValue([
      {
        id: 'c1',
        email: 'first@test.com',
        firstName: 'A',
        lastName: 'B',
        company: '',
        unsubscribeToken: 'tok1'
      },
      {
        id: 'c2',
        email: 'throw@test.com',
        firstName: 'C',
        lastName: 'D',
        company: '',
        unsubscribeToken: 'tok2'
      },
      {
        id: 'c3',
        email: 'last@test.com',
        firstName: 'E',
        lastName: 'F',
        company: '',
        unsubscribeToken: 'tok3'
      }
    ])

    pb.collection('consents').getList.mockResolvedValue({ items: [{ id: 'consent' }] })
    pb.collection('email_campaigns').update.mockResolvedValue({})

    // Second email throws an exception (not just { success: false })
    mockEmailService.send
      .mockResolvedValueOnce({ success: true })
      .mockRejectedValueOnce(new Error('Connection reset'))
      .mockResolvedValueOnce({ success: true })

    const result = await sendCampaign('camp1')

    // Should have continued past the error to send the third email
    expect(mockEmailService.send).toHaveBeenCalledTimes(3)
    expect(result.totalSent).toBe(2)
    expect(result.totalFailed).toBe(1)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toEqual({
      email: 'throw@test.com',
      error: 'Error: Connection reset'
    })

    // Campaign should still be marked as 'sent' (not reverted to draft)
    const sentCall = pb
      .collection('email_campaigns')
      // biome-ignore lint/suspicious/noExplicitAny: type cast for mock assertion
      .update.mock.calls.find((call: any[]) => call[1].status === 'sent')
    expect(sentCall).toBeDefined()
  })
})
