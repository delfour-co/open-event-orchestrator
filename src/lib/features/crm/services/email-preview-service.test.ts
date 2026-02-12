import { describe, expect, it, vi, beforeEach } from 'vitest'
import { createEmailPreviewService } from './email-preview-service'
import type PocketBase from 'pocketbase'

describe('email-preview-service', () => {
  let mockPb: PocketBase
  let mockSendEmail: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()

    mockPb = {
      collection: vi.fn().mockReturnThis(),
      getOne: vi.fn(),
      getList: vi.fn()
    } as unknown as PocketBase

    mockSendEmail = vi.fn().mockResolvedValue(true)
  })

  describe('buildCampaignPreview', () => {
    it('should build preview from campaign with fallbacks', async () => {
      const mockCampaign = {
        id: 'campaign-1',
        subject: 'Welcome {{firstName}}!',
        htmlContent: '<p>Hello {{firstName}}, welcome to {{eventName}}!</p>',
        textContent: 'Hello {{firstName}}'
      }

      vi.mocked(mockPb.collection).mockReturnValue({
        getOne: vi.fn().mockResolvedValue(mockCampaign)
      } as never)

      const service = createEmailPreviewService(mockPb)
      const preview = await service.buildCampaignPreview('campaign-1')

      // Default fallbacks resolve common variables
      expect(preview.subject).toBe('Welcome {{firstName}}!')
      expect(preview.resolvedSubject).toBe('Welcome Friend!')
      expect(preview.resolvedHtmlContent).toContain('The Event')
    })

    it('should count unresolved variables without fallbacks', async () => {
      const mockCampaign = {
        id: 'campaign-1',
        subject: 'Hello {{customVar}}!',
        htmlContent: '<p>Custom: {{customVar}}</p>',
        textContent: ''
      }

      vi.mocked(mockPb.collection).mockReturnValue({
        getOne: vi.fn().mockResolvedValue(mockCampaign)
      } as never)

      const service = createEmailPreviewService(mockPb)
      const preview = await service.buildCampaignPreview('campaign-1')

      // customVar has no fallback, so it remains unresolved
      expect(preview.unresolvedCount).toBe(1)
    })

    it('should resolve variables with contact data', async () => {
      const mockCampaign = {
        id: 'campaign-1',
        subject: 'Welcome {{firstName}}!',
        htmlContent: '<p>Hello {{firstName}}!</p>',
        textContent: 'Hello {{firstName}}'
      }

      const mockContact = {
        id: 'contact-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com'
      }

      vi.mocked(mockPb.collection).mockImplementation((name) => ({
        getOne: vi.fn().mockImplementation(() => {
          if (name === 'email_campaigns') return Promise.resolve(mockCampaign)
          if (name === 'contacts') return Promise.resolve(mockContact)
          return Promise.reject(new Error('Unknown collection'))
        })
      })) as never

      const service = createEmailPreviewService(mockPb)
      const preview = await service.buildCampaignPreview('campaign-1', 'contact-1')

      expect(preview.resolvedSubject).toBe('Welcome John!')
      expect(preview.resolvedHtmlContent).toContain('Hello John!')
      expect(preview.unresolvedCount).toBe(0)
    })

    it('should merge custom data', async () => {
      const mockCampaign = {
        id: 'campaign-1',
        subject: 'Welcome to {{customField}}!',
        htmlContent: '<p>Event: {{customField}}</p>'
      }

      vi.mocked(mockPb.collection).mockReturnValue({
        getOne: vi.fn().mockResolvedValue(mockCampaign)
      } as never)

      const service = createEmailPreviewService(mockPb)
      const preview = await service.buildCampaignPreview('campaign-1', undefined, {
        customField: 'DevCon 2024'
      })

      expect(preview.resolvedSubject).toBe('Welcome to DevCon 2024!')
    })
  })

  describe('buildContactData', () => {
    it('should extract contact fields', () => {
      const contact = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        company: 'Acme Inc',
        jobTitle: 'Developer',
        phone: '+1234567890'
      }

      const service = createEmailPreviewService(mockPb)
      const data = service.buildContactData(contact)

      expect(data.firstName).toBe('Jane')
      expect(data.lastName).toBe('Smith')
      expect(data.email).toBe('jane@example.com')
      expect(data.company).toBe('Acme Inc')
      expect(data.jobTitle).toBe('Developer')
      expect(data.phone).toBe('+1234567890')
    })

    it('should handle missing fields', () => {
      const contact = {
        email: 'test@example.com'
      }

      const service = createEmailPreviewService(mockPb)
      const data = service.buildContactData(contact)

      expect(data.firstName).toBe('')
      expect(data.lastName).toBe('')
      expect(data.email).toBe('test@example.com')
    })
  })

  describe('validateCampaign', () => {
    it('should validate campaign with valid data', async () => {
      const mockCampaign = {
        id: 'campaign-1',
        subject: 'Welcome',
        fromName: 'Events Team',
        fromEmail: 'team@events.com',
        htmlContent: '<p>Content with <a href="#unsubscribe">unsubscribe</a></p>',
        textContent: 'Plain text version',
        segmentId: 'segment-1'
      }

      const memberships = { totalItems: 100, items: [] }

      vi.mocked(mockPb.collection).mockImplementation((name) => ({
        getOne: vi.fn().mockResolvedValue(mockCampaign),
        getList: vi.fn().mockResolvedValue(memberships)
      })) as never

      const service = createEmailPreviewService(mockPb)
      const result = await service.validateCampaign('campaign-1')

      expect(result.valid).toBe(true)
      expect(result.errorCount).toBe(0)
    })

    it('should report validation errors', async () => {
      const mockCampaign = {
        id: 'campaign-1',
        subject: '',
        fromName: '',
        fromEmail: '',
        htmlContent: '<p>No unsubscribe link</p>',
        textContent: '',
        segmentId: null
      }

      vi.mocked(mockPb.collection).mockReturnValue({
        getOne: vi.fn().mockResolvedValue(mockCampaign),
        getList: vi.fn().mockResolvedValue({ totalItems: 0, items: [] })
      } as never)

      const service = createEmailPreviewService(mockPb)
      const result = await service.validateCampaign('campaign-1')

      expect(result.valid).toBe(false)
      expect(result.errorCount).toBeGreaterThan(0)
    })
  })

  describe('analyzeSpamTriggers', () => {
    it('should detect spam trigger words', () => {
      const service = createEmailPreviewService(mockPb)
      const triggers = service.analyzeSpamTriggers('FREE OFFER', 'Act now to claim!')

      expect(triggers).toContain('free')
      expect(triggers).toContain('act now')
    })

    it('should return empty for clean content', () => {
      const service = createEmailPreviewService(mockPb)
      const triggers = service.analyzeSpamTriggers(
        'Conference Update',
        'Thank you for registering.'
      )

      expect(triggers).toHaveLength(0)
    })
  })

  describe('sendTestEmails', () => {
    it('should send test emails to valid addresses', async () => {
      const mockCampaign = {
        id: 'campaign-1',
        subject: 'Test Subject',
        htmlContent: '<p>Test content</p>',
        textContent: 'Test content'
      }

      vi.mocked(mockPb.collection).mockReturnValue({
        getOne: vi.fn().mockResolvedValue(mockCampaign)
      } as never)

      const service = createEmailPreviewService(mockPb, mockSendEmail)
      const result = await service.sendTestEmails({
        campaignId: 'campaign-1',
        toAddresses: ['test@example.com', 'test2@example.com']
      })

      expect(result.success).toBe(true)
      expect(result.sentCount).toBe(2)
      expect(result.failedAddresses).toHaveLength(0)
      expect(mockSendEmail).toHaveBeenCalledTimes(2)
    })

    it('should reject invalid email addresses', async () => {
      const mockCampaign = {
        id: 'campaign-1',
        subject: 'Test',
        htmlContent: '<p>Test</p>'
      }

      vi.mocked(mockPb.collection).mockReturnValue({
        getOne: vi.fn().mockResolvedValue(mockCampaign)
      } as never)

      const service = createEmailPreviewService(mockPb, mockSendEmail)
      const result = await service.sendTestEmails({
        campaignId: 'campaign-1',
        toAddresses: ['valid@example.com', 'not-an-email', 'also invalid']
      })

      expect(result.sentCount).toBe(1)
      expect(result.failedAddresses).toContain('not-an-email')
      expect(result.failedAddresses).toContain('also invalid')
    })

    it('should return error when no valid addresses', async () => {
      const service = createEmailPreviewService(mockPb, mockSendEmail)
      const result = await service.sendTestEmails({
        campaignId: 'campaign-1',
        toAddresses: ['invalid', 'also-invalid']
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('No valid email addresses provided')
    })

    it('should return error when email not configured', async () => {
      const service = createEmailPreviewService(mockPb)
      const result = await service.sendTestEmails({
        campaignId: 'campaign-1',
        toAddresses: ['test@example.com']
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Email sending not configured')
    })

    it('should prefix subject with [TEST]', async () => {
      const mockCampaign = {
        id: 'campaign-1',
        subject: 'Newsletter',
        htmlContent: '<p>Content</p>'
      }

      vi.mocked(mockPb.collection).mockReturnValue({
        getOne: vi.fn().mockResolvedValue(mockCampaign)
      } as never)

      const service = createEmailPreviewService(mockPb, mockSendEmail)
      await service.sendTestEmails({
        campaignId: 'campaign-1',
        toAddresses: ['test@example.com']
      })

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: '[TEST] Newsletter'
        })
      )
    })
  })

  describe('getSampleContacts', () => {
    it('should return contacts from segment', async () => {
      const mockMemberships = {
        items: [{ contactId: 'c1' }, { contactId: 'c2' }],
        totalItems: 2
      }

      const mockContacts = {
        items: [
          { id: 'c1', email: 'a@test.com' },
          { id: 'c2', email: 'b@test.com' }
        ]
      }

      vi.mocked(mockPb.collection).mockImplementation((name) => ({
        getList: vi.fn().mockImplementation(() => {
          if (name === 'segment_memberships') return Promise.resolve(mockMemberships)
          if (name === 'contacts') return Promise.resolve(mockContacts)
          return Promise.reject(new Error('Unknown'))
        })
      })) as never

      const service = createEmailPreviewService(mockPb)
      const contacts = await service.getSampleContacts('segment-1', 5)

      expect(contacts).toHaveLength(2)
    })

    it('should return empty array for empty segment', async () => {
      vi.mocked(mockPb.collection).mockReturnValue({
        getList: vi.fn().mockResolvedValue({ items: [], totalItems: 0 })
      } as never)

      const service = createEmailPreviewService(mockPb)
      const contacts = await service.getSampleContacts('empty-segment')

      expect(contacts).toHaveLength(0)
    })
  })

  describe('buildMultiContactPreview', () => {
    it('should build previews for multiple contacts', async () => {
      const mockCampaign = {
        id: 'campaign-1',
        subject: 'Hello {{firstName}}',
        htmlContent: '<p>Hi {{firstName}}</p>'
      }

      const contacts = [
        { id: 'c1', firstName: 'Alice', email: 'alice@test.com' },
        { id: 'c2', firstName: 'Bob', email: 'bob@test.com' }
      ]

      let campaignFetched = false

      vi.mocked(mockPb.collection).mockImplementation((name) => ({
        getOne: vi.fn().mockImplementation((id: string) => {
          if (name === 'email_campaigns' && !campaignFetched) {
            campaignFetched = true
            return Promise.resolve(mockCampaign)
          }
          if (name === 'contacts') {
            return Promise.resolve(contacts.find((c) => c.id === id))
          }
          return Promise.reject(new Error('Unknown'))
        })
      })) as never

      const service = createEmailPreviewService(mockPb)
      const previews = await service.buildMultiContactPreview('campaign-1', ['c1', 'c2'])

      expect(previews).toHaveLength(2)
      expect(previews[0].preview.resolvedSubject).toBe('Hello Alice')
      expect(previews[1].preview.resolvedSubject).toBe('Hello Bob')
    })
  })
})
