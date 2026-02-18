import type { EmailService } from '$lib/features/cfp/services/email-service'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { EditionSponsorExpanded, SponsorMessage } from '../domain'
import type { SponsorMessageRepository } from '../infra/sponsor-message-repository'
import { createSponsorMessageService } from './sponsor-message-service'

describe('SponsorMessageService', () => {
  let mockMessageRepo: SponsorMessageRepository
  let mockEmailService: EmailService
  let service: ReturnType<typeof createSponsorMessageService>

  const mockMessage: SponsorMessage = {
    id: 'msg-1',
    editionSponsorId: 'es-1',
    senderType: 'organizer',
    senderName: 'Event Organizer',
    subject: 'Welcome',
    content: 'Welcome to our event!',
    readAt: undefined,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  const mockEditionSponsor: EditionSponsorExpanded = {
    id: 'es-1',
    editionId: 'edition-1',
    sponsorId: 'sponsor-1',
    status: 'confirmed',
    createdAt: new Date(),
    updatedAt: new Date(),
    sponsor: {
      id: 'sponsor-1',
      name: 'Acme Corp',
      contactName: 'John Doe',
      contactEmail: 'john@acme.com',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }

  beforeEach(() => {
    mockMessageRepo = {
      findById: vi.fn(),
      findByEditionSponsor: vi.fn(),
      create: vi.fn().mockResolvedValue(mockMessage),
      createWithAttachments: vi.fn().mockResolvedValue(mockMessage),
      markAsRead: vi.fn(),
      markAllAsReadForEditionSponsor: vi.fn()
    } as unknown as SponsorMessageRepository

    mockEmailService = {
      send: vi.fn().mockResolvedValue({ success: true })
    } as unknown as EmailService

    service = createSponsorMessageService(mockMessageRepo, mockEmailService)
  })

  describe('sendMessage', () => {
    it('should create message without attachments', async () => {
      const result = await service.sendMessage({
        editionSponsorId: 'es-1',
        senderType: 'organizer',
        senderName: 'Event Organizer',
        content: 'Hello!'
      })

      expect(result).toEqual(mockMessage)
      expect(mockMessageRepo.create).toHaveBeenCalled()
      expect(mockMessageRepo.createWithAttachments).not.toHaveBeenCalled()
    })

    it('should create message with attachments', async () => {
      const mockFile = new File(['content'], 'test.pdf', { type: 'application/pdf' })

      const result = await service.sendMessage(
        {
          editionSponsorId: 'es-1',
          senderType: 'organizer',
          senderName: 'Event Organizer',
          content: 'Hello with attachment!'
        },
        [mockFile]
      )

      expect(result).toEqual(mockMessage)
      expect(mockMessageRepo.createWithAttachments).toHaveBeenCalled()
      expect(mockMessageRepo.create).not.toHaveBeenCalled()
    })
  })

  describe('sendMessageWithNotification', () => {
    it('should send message and email notification for organizer to sponsor', async () => {
      const result = await service.sendMessageWithNotification(
        {
          editionSponsorId: 'es-1',
          senderType: 'organizer',
          senderName: 'Event Organizer',
          subject: 'Welcome',
          content: 'Welcome to our event!'
        },
        [],
        mockEditionSponsor,
        'Tech Conference 2024',
        'https://example.com/portal'
      )

      expect(result.message).toEqual(mockMessage)
      expect(result.emailSent).toBe(true)
      expect(mockEmailService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'john@acme.com',
          subject: 'Tech Conference 2024 - New message: Welcome'
        })
      )
    })

    it('should not send email for sponsor to organizer messages', async () => {
      const result = await service.sendMessageWithNotification(
        {
          editionSponsorId: 'es-1',
          senderType: 'sponsor',
          senderName: 'John Doe',
          content: 'Question about benefits'
        },
        [],
        mockEditionSponsor,
        'Tech Conference 2024',
        'https://example.com/admin'
      )

      expect(result.message).toEqual(mockMessage)
      expect(result.emailSent).toBe(false)
      expect(mockEmailService.send).not.toHaveBeenCalled()
    })

    it('should return error when no recipient email', async () => {
      const sponsorWithoutEmail = {
        ...mockEditionSponsor,
        sponsor: mockEditionSponsor.sponsor
          ? { ...mockEditionSponsor.sponsor, contactEmail: undefined }
          : undefined
      }

      const result = await service.sendMessageWithNotification(
        {
          editionSponsorId: 'es-1',
          senderType: 'organizer',
          senderName: 'Event Organizer',
          content: 'Hello!'
        },
        [],
        sponsorWithoutEmail,
        'Tech Conference 2024',
        'https://example.com/portal'
      )

      expect(result.message).toEqual(mockMessage)
      expect(result.emailSent).toBe(false)
      expect(result.emailError).toBe('No recipient email available')
    })

    it('should include message preview in email', async () => {
      await service.sendMessageWithNotification(
        {
          editionSponsorId: 'es-1',
          senderType: 'organizer',
          senderName: 'Event Organizer',
          content: 'This is the message content that should appear in preview'
        },
        [],
        mockEditionSponsor,
        'Tech Conference 2024',
        'https://example.com/portal'
      )

      const call = vi.mocked(mockEmailService.send).mock.calls[0][0]
      expect(call.html).toContain('This is the message content')
      expect(call.text).toContain('This is the message content')
    })
  })

  describe('markAsRead', () => {
    it('should call repository to mark message as read', async () => {
      const readMessage = { ...mockMessage, readAt: new Date() }
      vi.mocked(mockMessageRepo.markAsRead).mockResolvedValue(readMessage)

      const result = await service.markAsRead('msg-1')

      expect(mockMessageRepo.markAsRead).toHaveBeenCalledWith('msg-1')
      expect(result.readAt).toBeDefined()
    })
  })

  describe('markAllAsRead', () => {
    it('should call repository to mark all messages as read', async () => {
      vi.mocked(mockMessageRepo.markAllAsReadForEditionSponsor).mockResolvedValue(5)

      const result = await service.markAllAsRead('es-1', 'organizer')

      expect(mockMessageRepo.markAllAsReadForEditionSponsor).toHaveBeenCalledWith(
        'es-1',
        'organizer'
      )
      expect(result).toBe(5)
    })
  })
})
