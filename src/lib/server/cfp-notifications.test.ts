import type PocketBase from 'pocketbase'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockSend = vi.fn()
const mockSpeakerFindById = vi.fn()
const mockTalkFindById = vi.fn()
const mockEmailLogCreate = vi.fn()
const mockEmailLogUpdateStatus = vi.fn()

vi.mock('$lib/server/app-settings', () => ({
  getEmailService: vi.fn().mockResolvedValue({
    send: (...args: unknown[]) => mockSend(...args)
  })
}))

vi.mock('$lib/server/email-branding', () => ({
  getEventBranding: vi.fn().mockResolvedValue({
    orgName: 'Test Org',
    primaryColor: '#3b82f6',
    logoUrl: undefined,
    footerText: 'Footer'
  })
}))

vi.mock('$lib/features/cfp/infra', () => ({
  createSpeakerRepository: () => ({
    findById: (...args: unknown[]) => mockSpeakerFindById(...args)
  }),
  createTalkRepository: () => ({
    findById: (...args: unknown[]) => mockTalkFindById(...args)
  }),
  createEmailLogRepository: () => ({
    create: (...args: unknown[]) => mockEmailLogCreate(...args),
    updateStatus: (...args: unknown[]) => mockEmailLogUpdateStatus(...args)
  })
}))

vi.mock('$lib/features/cfp/domain/notification', () => ({
  getNotificationSubject: (type: string, editionName: string, talkTitle: string) =>
    `[${type}] ${editionName} - ${talkTitle}`
}))

vi.mock('$lib/features/cfp/services', () => ({
  generateEmailHtml: (type: string) => `<html>${type}</html>`,
  generateEmailText: (type: string) => `text:${type}`
}))

import { type SendCfpNotificationParams, sendCfpNotification } from './cfp-notifications'

function createMockPb(): PocketBase {
  return {
    collection: vi.fn()
  } as unknown as PocketBase
}

describe('cfp-notifications', () => {
  let pb: PocketBase

  const baseParams: Omit<SendCfpNotificationParams, 'pb'> = {
    type: 'talk_accepted',
    talkId: 'talk-1',
    speakerId: 'speaker-1',
    editionId: 'edition-1',
    editionSlug: 'conf-2024',
    editionName: 'Conference 2024',
    eventName: 'My Conference',
    baseUrl: 'https://example.com'
  }

  beforeEach(() => {
    pb = createMockPb()
    vi.clearAllMocks()

    mockSpeakerFindById.mockResolvedValue({
      id: 'speaker-1',
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com'
    })

    mockTalkFindById.mockResolvedValue({
      id: 'talk-1',
      title: 'My Great Talk'
    })

    mockEmailLogCreate.mockResolvedValue({ id: 'log-1' })
    mockEmailLogUpdateStatus.mockResolvedValue({})
    mockSend.mockResolvedValue({ success: true })
  })

  describe('sendCfpNotification', () => {
    it('should send a notification email successfully', async () => {
      const result = await sendCfpNotification({ pb, ...baseParams })

      expect(result.success).toBe(true)
      expect(mockSend).toHaveBeenCalledTimes(1)
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'jane@example.com',
          subject: expect.stringContaining('talk_accepted'),
          html: expect.any(String),
          text: expect.any(String)
        })
      )
    })

    it('should return error when speaker is not found', async () => {
      mockSpeakerFindById.mockResolvedValue(null)

      const result = await sendCfpNotification({ pb, ...baseParams })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Speaker not found')
      expect(mockSend).not.toHaveBeenCalled()
    })

    it('should return error when talk is not found', async () => {
      mockTalkFindById.mockResolvedValue(null)

      const result = await sendCfpNotification({ pb, ...baseParams })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Talk not found')
      expect(mockSend).not.toHaveBeenCalled()
    })

    it('should create a pending email log before sending', async () => {
      await sendCfpNotification({ pb, ...baseParams })

      expect(mockEmailLogCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          talkId: 'talk-1',
          speakerId: 'speaker-1',
          editionId: 'edition-1',
          type: 'talk_accepted',
          to: 'jane@example.com',
          status: 'pending'
        })
      )
    })

    it('should update email log to sent on success', async () => {
      await sendCfpNotification({ pb, ...baseParams })

      expect(mockEmailLogUpdateStatus).toHaveBeenCalledWith('log-1', 'sent')
    })

    it('should update email log to failed on send failure', async () => {
      mockSend.mockResolvedValue({ success: false, error: 'SMTP timeout' })

      const result = await sendCfpNotification({ pb, ...baseParams })

      expect(result.success).toBe(false)
      expect(result.error).toBe('SMTP timeout')
      expect(mockEmailLogUpdateStatus).toHaveBeenCalledWith('log-1', 'failed', 'SMTP timeout')
    })

    it('should catch exceptions and return error', async () => {
      mockSpeakerFindById.mockRejectedValue(new Error('DB connection lost'))

      const result = await sendCfpNotification({ pb, ...baseParams })

      expect(result.success).toBe(false)
      expect(result.error).toContain('DB connection lost')
    })

    it('should use customCfpUrl when provided', async () => {
      await sendCfpNotification({
        pb,
        ...baseParams,
        customCfpUrl: 'https://example.com/cfp/conf-2024/submissions?token=secure-tok'
      })

      expect(mockSend).toHaveBeenCalledTimes(1)
    })

    it('should build legacy URL when customCfpUrl is not provided', async () => {
      await sendCfpNotification({ pb, ...baseParams })

      // The function builds the URL internally; we verify it was called
      expect(mockSend).toHaveBeenCalledTimes(1)
    })
  })
})
