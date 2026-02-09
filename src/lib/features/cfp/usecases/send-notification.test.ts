import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Speaker, Talk } from '../domain'
import type { EmailLogRepository, SpeakerRepository, TalkRepository } from '../infra'
import type { EmailService } from '../services/email-service'
import { createSendNotificationUseCase } from './send-notification'

describe('SendNotificationUseCase', () => {
  let emailService: EmailService
  let emailLogRepository: EmailLogRepository
  let speakerRepository: SpeakerRepository
  let talkRepository: TalkRepository
  let sendNotification: ReturnType<typeof createSendNotificationUseCase>

  const mockSpeaker: Speaker = {
    id: 'speaker-1',
    email: 'jane@example.com',
    firstName: 'Jane',
    lastName: 'Speaker',
    bio: 'A great speaker',
    createdAt: new Date(),
    updatedAt: new Date()
  }

  const mockTalk: Talk = {
    id: 'talk-1',
    title: 'My Amazing Talk',
    abstract: 'My abstract',
    editionId: 'edition-1',
    speakerIds: ['speaker-1'],
    status: 'accepted',
    createdAt: new Date(),
    updatedAt: new Date()
  }

  const mockEmailLog = {
    id: 'log-1',
    talkId: 'talk-1',
    speakerId: 'speaker-1',
    editionId: 'edition-1',
    type: 'talk_accepted' as const,
    to: 'jane@example.com',
    subject: 'Your talk has been accepted',
    status: 'pending' as const,
    createdAt: new Date()
  }

  beforeEach(() => {
    emailService = {
      send: vi.fn()
    } as unknown as EmailService

    emailLogRepository = {
      create: vi.fn(),
      updateStatus: vi.fn(),
      findById: vi.fn(),
      findByTalk: vi.fn(),
      findBySpeaker: vi.fn()
    } as unknown as EmailLogRepository

    speakerRepository = {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    } as unknown as SpeakerRepository

    talkRepository = {
      findById: vi.fn(),
      findByFilters: vi.fn(),
      findBySpeaker: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateStatus: vi.fn(),
      delete: vi.fn(),
      findByEdition: vi.fn(),
      addCoSpeaker: vi.fn(),
      removeCoSpeaker: vi.fn()
    } as unknown as TalkRepository

    sendNotification = createSendNotificationUseCase(
      emailService,
      emailLogRepository,
      speakerRepository,
      talkRepository
    )
  })

  it('should return error when speaker not found', async () => {
    vi.mocked(speakerRepository.findById).mockResolvedValue(null)

    const result = await sendNotification({
      type: 'talk_accepted',
      talkId: 'talk-1',
      speakerId: 'speaker-1',
      editionId: 'edition-1',
      editionName: 'DevFest 2025',
      eventName: 'DevFest',
      baseUrl: 'https://example.com'
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('Speaker not found')
    expect(emailService.send).not.toHaveBeenCalled()
  })

  it('should send notification and log success', async () => {
    vi.mocked(speakerRepository.findById).mockResolvedValue(mockSpeaker)
    vi.mocked(talkRepository.findById).mockResolvedValue(mockTalk)
    vi.mocked(emailLogRepository.create).mockResolvedValue(mockEmailLog)
    vi.mocked(emailService.send).mockResolvedValue({ success: true })
    vi.mocked(emailLogRepository.updateStatus).mockResolvedValue({
      ...mockEmailLog,
      status: 'sent'
    })

    const result = await sendNotification({
      type: 'talk_accepted',
      talkId: 'talk-1',
      speakerId: 'speaker-1',
      editionId: 'edition-1',
      editionName: 'DevFest 2025',
      eventName: 'DevFest',
      baseUrl: 'https://example.com'
    })

    expect(result.success).toBe(true)
    expect(result.emailLogId).toBe('log-1')
    expect(emailLogRepository.updateStatus).toHaveBeenCalledWith('log-1', 'sent')
  })

  it('should log failure when email sending fails', async () => {
    vi.mocked(speakerRepository.findById).mockResolvedValue(mockSpeaker)
    vi.mocked(talkRepository.findById).mockResolvedValue(mockTalk)
    vi.mocked(emailLogRepository.create).mockResolvedValue(mockEmailLog)
    vi.mocked(emailService.send).mockResolvedValue({ success: false, error: 'SMTP error' })
    vi.mocked(emailLogRepository.updateStatus).mockResolvedValue({
      ...mockEmailLog,
      status: 'failed'
    })

    const result = await sendNotification({
      type: 'talk_accepted',
      talkId: 'talk-1',
      speakerId: 'speaker-1',
      editionId: 'edition-1',
      editionName: 'DevFest 2025',
      eventName: 'DevFest',
      baseUrl: 'https://example.com'
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe('SMTP error')
    expect(result.emailLogId).toBe('log-1')
    expect(emailLogRepository.updateStatus).toHaveBeenCalledWith('log-1', 'failed', 'SMTP error')
  })

  it('should send email to speaker email address', async () => {
    vi.mocked(speakerRepository.findById).mockResolvedValue(mockSpeaker)
    vi.mocked(talkRepository.findById).mockResolvedValue(mockTalk)
    vi.mocked(emailLogRepository.create).mockResolvedValue(mockEmailLog)
    vi.mocked(emailService.send).mockResolvedValue({ success: true })

    await sendNotification({
      type: 'talk_accepted',
      talkId: 'talk-1',
      speakerId: 'speaker-1',
      editionId: 'edition-1',
      editionName: 'DevFest 2025',
      eventName: 'DevFest',
      baseUrl: 'https://example.com'
    })

    expect(emailService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'jane@example.com'
      })
    )
  })

  it('should work without talkId for speaker-level notifications', async () => {
    vi.mocked(speakerRepository.findById).mockResolvedValue(mockSpeaker)
    vi.mocked(emailLogRepository.create).mockResolvedValue({ ...mockEmailLog, talkId: undefined })
    vi.mocked(emailService.send).mockResolvedValue({ success: true })

    const result = await sendNotification({
      type: 'cfp_closing_reminder',
      speakerId: 'speaker-1',
      editionId: 'edition-1',
      editionName: 'DevFest 2025',
      eventName: 'DevFest',
      baseUrl: 'https://example.com'
    })

    expect(result.success).toBe(true)
    expect(talkRepository.findById).not.toHaveBeenCalled()
  })

  it('should create email log with pending status before sending', async () => {
    vi.mocked(speakerRepository.findById).mockResolvedValue(mockSpeaker)
    vi.mocked(talkRepository.findById).mockResolvedValue(mockTalk)
    vi.mocked(emailLogRepository.create).mockResolvedValue(mockEmailLog)
    vi.mocked(emailService.send).mockResolvedValue({ success: true })

    await sendNotification({
      type: 'talk_accepted',
      talkId: 'talk-1',
      speakerId: 'speaker-1',
      editionId: 'edition-1',
      editionName: 'DevFest 2025',
      eventName: 'DevFest',
      baseUrl: 'https://example.com'
    })

    expect(emailLogRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'pending',
        type: 'talk_accepted',
        to: 'jane@example.com'
      })
    )
  })

  it('should include talk title when talkId is provided', async () => {
    vi.mocked(speakerRepository.findById).mockResolvedValue(mockSpeaker)
    vi.mocked(talkRepository.findById).mockResolvedValue(mockTalk)
    vi.mocked(emailLogRepository.create).mockResolvedValue(mockEmailLog)
    vi.mocked(emailService.send).mockResolvedValue({ success: true })

    await sendNotification({
      type: 'talk_accepted',
      talkId: 'talk-1',
      speakerId: 'speaker-1',
      editionId: 'edition-1',
      editionName: 'DevFest 2025',
      eventName: 'DevFest',
      baseUrl: 'https://example.com'
    })

    expect(talkRepository.findById).toHaveBeenCalledWith('talk-1')
  })

  it('should send email with correct subject and content', async () => {
    vi.mocked(speakerRepository.findById).mockResolvedValue(mockSpeaker)
    vi.mocked(talkRepository.findById).mockResolvedValue(mockTalk)
    vi.mocked(emailLogRepository.create).mockResolvedValue(mockEmailLog)
    vi.mocked(emailService.send).mockResolvedValue({ success: true })

    await sendNotification({
      type: 'talk_accepted',
      talkId: 'talk-1',
      speakerId: 'speaker-1',
      editionId: 'edition-1',
      editionName: 'DevFest 2025',
      eventName: 'DevFest',
      baseUrl: 'https://example.com'
    })

    expect(emailService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.any(String),
        html: expect.any(String),
        text: expect.any(String)
      })
    )
  })
})
