import type { EmailService } from '$lib/features/cfp/services/email-service'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { EditionSponsorExpanded } from '../domain'
import { createSponsorEmailService } from './sponsor-email-service'

describe('SponsorEmailService', () => {
  let mockEmailService: EmailService
  let service: ReturnType<typeof createSponsorEmailService>

  const mockEditionSponsor: EditionSponsorExpanded = {
    id: 'es-1',
    editionId: 'edition-1',
    sponsorId: 'sponsor-1',
    packageId: 'pkg-1',
    status: 'confirmed',
    amount: 500000, // 5000 in cents
    createdAt: new Date(),
    updatedAt: new Date(),
    sponsor: {
      id: 'sponsor-1',
      organizationId: 'org-1',
      name: 'Acme Corp',
      contactName: 'John Doe',
      contactEmail: 'john@acme.com',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    package: {
      id: 'pkg-1',
      editionId: 'edition-1',
      name: 'Gold',
      price: 500000,
      currency: 'EUR',
      tier: 1,
      benefits: [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }

  beforeEach(() => {
    mockEmailService = {
      send: vi.fn().mockResolvedValue({ success: true })
    } as unknown as EmailService

    service = createSponsorEmailService(mockEmailService)
  })

  describe('sendPortalInvitation', () => {
    it('should send portal invitation email', async () => {
      const result = await service.sendPortalInvitation(
        mockEditionSponsor,
        'https://example.com/sponsor/abc123',
        'Tech Conference 2024'
      )

      expect(result.success).toBe(true)
      expect(mockEmailService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'john@acme.com',
          subject: 'Tech Conference 2024 - Sponsor Portal Access'
        })
      )
    })

    it('should include portal URL in email', async () => {
      await service.sendPortalInvitation(
        mockEditionSponsor,
        'https://example.com/sponsor/abc123',
        'Tech Conference 2024'
      )

      const call = vi.mocked(mockEmailService.send).mock.calls[0][0]
      expect(call.html).toContain('https://example.com/sponsor/abc123')
      expect(call.text).toContain('https://example.com/sponsor/abc123')
    })

    it('should return error when no contact email', async () => {
      const sponsorWithoutEmail = {
        ...mockEditionSponsor,
        sponsor: mockEditionSponsor.sponsor
          ? { ...mockEditionSponsor.sponsor, contactEmail: undefined }
          : undefined
      }

      const result = await service.sendPortalInvitation(
        sponsorWithoutEmail,
        'https://example.com/sponsor/abc123',
        'Tech Conference 2024'
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('No contact email for sponsor')
      expect(mockEmailService.send).not.toHaveBeenCalled()
    })

    it('should use sponsor name when no contact name', async () => {
      const sponsorWithoutContactName = {
        ...mockEditionSponsor,
        sponsor: mockEditionSponsor.sponsor
          ? { ...mockEditionSponsor.sponsor, contactName: undefined }
          : undefined
      }

      await service.sendPortalInvitation(
        sponsorWithoutContactName,
        'https://example.com/sponsor/abc123',
        'Tech Conference 2024'
      )

      const call = vi.mocked(mockEmailService.send).mock.calls[0][0]
      expect(call.html).toContain('Dear Acme Corp team')
    })
  })

  describe('sendConfirmationEmail', () => {
    it('should send confirmation email', async () => {
      const result = await service.sendConfirmationEmail(
        mockEditionSponsor,
        'Tech Conference 2024',
        'https://example.com/portal'
      )

      expect(result.success).toBe(true)
      expect(mockEmailService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'john@acme.com',
          subject: 'Tech Conference 2024 - Sponsorship Confirmed!'
        })
      )
    })

    it('should include package name and amount', async () => {
      await service.sendConfirmationEmail(mockEditionSponsor, 'Tech Conference 2024')

      const call = vi.mocked(mockEmailService.send).mock.calls[0][0]
      expect(call.html).toContain('Gold')
    })

    it('should return error when no contact email', async () => {
      const sponsorWithoutEmail = {
        ...mockEditionSponsor,
        sponsor: mockEditionSponsor.sponsor
          ? { ...mockEditionSponsor.sponsor, contactEmail: undefined }
          : undefined
      }

      const result = await service.sendConfirmationEmail(
        sponsorWithoutEmail,
        'Tech Conference 2024'
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('No contact email for sponsor')
    })
  })

  describe('sendPaymentReceivedEmail', () => {
    it('should send payment received email', async () => {
      const result = await service.sendPaymentReceivedEmail(
        mockEditionSponsor,
        'Tech Conference 2024'
      )

      expect(result.success).toBe(true)
      expect(mockEmailService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'john@acme.com',
          subject: 'Tech Conference 2024 - Payment Received'
        })
      )
    })

    it('should return error when no contact email', async () => {
      const sponsorWithoutEmail = {
        ...mockEditionSponsor,
        sponsor: mockEditionSponsor.sponsor
          ? { ...mockEditionSponsor.sponsor, contactEmail: undefined }
          : undefined
      }

      const result = await service.sendPaymentReceivedEmail(
        sponsorWithoutEmail,
        'Tech Conference 2024'
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('No contact email for sponsor')
    })
  })

  describe('sendWelcomeEmail', () => {
    it('should send welcome email', async () => {
      const result = await service.sendWelcomeEmail(
        mockEditionSponsor,
        'Tech Conference 2024',
        'https://example.com/portal'
      )

      expect(result.success).toBe(true)
      expect(mockEmailService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'john@acme.com',
          subject: 'Welcome to Tech Conference 2024 as a Sponsor!'
        })
      )
    })

    it('should include portal URL in welcome email', async () => {
      await service.sendWelcomeEmail(
        mockEditionSponsor,
        'Tech Conference 2024',
        'https://example.com/portal'
      )

      const call = vi.mocked(mockEmailService.send).mock.calls[0][0]
      expect(call.html).toContain('https://example.com/portal')
      expect(call.html).toContain('Get Started')
    })

    it('should return error when no contact email', async () => {
      const sponsorWithoutEmail = {
        ...mockEditionSponsor,
        sponsor: mockEditionSponsor.sponsor
          ? { ...mockEditionSponsor.sponsor, contactEmail: undefined }
          : undefined
      }

      const result = await service.sendWelcomeEmail(
        sponsorWithoutEmail,
        'Tech Conference 2024',
        'https://example.com/portal'
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('No contact email for sponsor')
    })
  })

  describe('sendInvoiceEmail', () => {
    const fakePdf = new Uint8Array([37, 80, 68, 70]) // %PDF

    it('should send invoice email with PDF attachment', async () => {
      const result = await service.sendInvoiceEmail(
        mockEditionSponsor,
        'Tech Conference 2024',
        fakePdf,
        'https://example.com/portal'
      )

      expect(result.success).toBe(true)
      expect(mockEmailService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'john@acme.com',
          subject: 'Tech Conference 2024 - Sponsorship Invoice',
          attachments: [
            expect.objectContaining({
              filename: expect.stringContaining('.pdf'),
              content: fakePdf,
              contentType: 'application/pdf'
            })
          ]
        })
      )
    })

    it('should include portal URL in invoice email when provided', async () => {
      await service.sendInvoiceEmail(
        mockEditionSponsor,
        'Tech Conference 2024',
        fakePdf,
        'https://example.com/portal'
      )

      const call = vi.mocked(mockEmailService.send).mock.calls[0][0]
      expect(call.html).toContain('https://example.com/portal')
      expect(call.text).toContain('https://example.com/portal')
    })

    it('should return error when no contact email', async () => {
      const sponsorWithoutEmail = {
        ...mockEditionSponsor,
        sponsor: mockEditionSponsor.sponsor
          ? { ...mockEditionSponsor.sponsor, contactEmail: undefined }
          : undefined
      }

      const result = await service.sendInvoiceEmail(
        sponsorWithoutEmail,
        'Tech Conference 2024',
        fakePdf
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe('No contact email for sponsor')
      expect(mockEmailService.send).not.toHaveBeenCalled()
    })

    it('should use sponsor name in attachment filename', async () => {
      await service.sendInvoiceEmail(mockEditionSponsor, 'Tech Conference 2024', fakePdf)

      const call = vi.mocked(mockEmailService.send).mock.calls[0][0]
      expect(call.attachments?.[0].filename).toBe('invoice-acme-corp.pdf')
    })
  })

  describe('email template content', () => {
    it('should include contact name in greeting when available', async () => {
      await service.sendPortalInvitation(
        mockEditionSponsor,
        'https://example.com/portal',
        'Tech Conference 2024'
      )

      const call = vi.mocked(mockEmailService.send).mock.calls[0][0]
      expect(call.html).toContain('Dear John Doe')
      expect(call.text).toContain('Dear John Doe')
    })

    it('should include event name in all emails', async () => {
      await service.sendConfirmationEmail(mockEditionSponsor, 'Tech Conference 2024')

      const call = vi.mocked(mockEmailService.send).mock.calls[0][0]
      expect(call.html).toContain('Tech Conference 2024')
      expect(call.text).toContain('Tech Conference 2024')
    })
  })
})
