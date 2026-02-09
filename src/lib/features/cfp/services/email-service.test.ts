import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { NotificationType } from '../domain/notification'
import {
  type EmailTemplateData,
  createConsoleEmailService,
  createSmtpEmailService,
  generateEmailHtml,
  generateEmailText
} from './email-service'

// Mock nodemailer
vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn()
  }
}))

import nodemailer from 'nodemailer'

describe('EmailService', () => {
  describe('createConsoleEmailService', () => {
    it('should log email to console and return success', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const service = createConsoleEmailService()

      const result = await service.send({
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test body</p>',
        text: 'Test body'
      })

      expect(result.success).toBe(true)
      expect(consoleSpy).toHaveBeenCalledWith('=== Email Sent (Console) ===')
      expect(consoleSpy).toHaveBeenCalledWith('To:', 'test@example.com')
      expect(consoleSpy).toHaveBeenCalledWith('Subject:', 'Test Subject')
      expect(consoleSpy).toHaveBeenCalledWith('Body:', 'Test body')

      consoleSpy.mockRestore()
    })

    it('should use html body when text is not provided', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const service = createConsoleEmailService()

      await service.send({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>HTML content</p>'
      })

      expect(consoleSpy).toHaveBeenCalledWith('Body:', '<p>HTML content</p>')

      consoleSpy.mockRestore()
    })
  })

  describe('createSmtpEmailService', () => {
    let mockSendMail: ReturnType<typeof vi.fn>
    let mockTransporter: { sendMail: ReturnType<typeof vi.fn> }

    beforeEach(() => {
      vi.clearAllMocks()
      mockSendMail = vi.fn()
      mockTransporter = { sendMail: mockSendMail }
      vi.mocked(nodemailer.createTransport).mockReturnValue(mockTransporter as never)
    })

    it('should create transporter with basic config', () => {
      createSmtpEmailService({
        host: 'smtp.example.com',
        port: 587,
        from: 'noreply@example.com'
      })

      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: 'smtp.example.com',
        port: 587,
        secure: false
      })
    })

    it('should create transporter with auth when credentials provided', () => {
      createSmtpEmailService({
        host: 'smtp.example.com',
        port: 465,
        user: 'user@example.com',
        pass: 'password123',
        from: 'noreply@example.com'
      })

      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: 'smtp.example.com',
        port: 465,
        secure: true,
        auth: { user: 'user@example.com', pass: 'password123' }
      })
    })

    it('should send email successfully', async () => {
      mockSendMail.mockResolvedValue({ messageId: 'msg-123' })
      const service = createSmtpEmailService({
        host: 'smtp.example.com',
        port: 587,
        from: 'noreply@example.com'
      })

      const result = await service.send({
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        text: 'Test text'
      })

      expect(result.success).toBe(true)
      expect(mockSendMail).toHaveBeenCalledWith({
        from: 'noreply@example.com',
        to: 'recipient@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        text: 'Test text'
      })
    })

    it('should return error on send failure', async () => {
      mockSendMail.mockRejectedValue(new Error('SMTP connection failed'))
      const service = createSmtpEmailService({
        host: 'smtp.example.com',
        port: 587,
        from: 'noreply@example.com'
      })

      const result = await service.send({
        to: 'recipient@example.com',
        subject: 'Test',
        html: '<p>Test</p>'
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('SMTP connection failed')
    })
  })

  describe('generateEmailHtml', () => {
    const baseData: EmailTemplateData = {
      speakerName: 'John Doe',
      talkTitle: 'Introduction to TypeScript',
      editionName: 'DevConf 2025',
      eventName: 'DevConf',
      cfpUrl: 'https://example.com/cfp',
      confirmationUrl: 'https://example.com/confirm',
      cfpDeadline: 'March 15, 2025'
    }

    it('should generate submission_confirmed email', () => {
      const html = generateEmailHtml('submission_confirmed', baseData)

      expect(html).toContain('Thank you for your submission!')
      expect(html).toContain('John Doe')
      expect(html).toContain('Introduction to TypeScript')
      expect(html).toContain('DevConf 2025')
      expect(html).toContain('https://example.com/cfp')
    })

    it('should generate talk_accepted email', () => {
      const html = generateEmailHtml('talk_accepted', baseData)

      expect(html).toContain('Congratulations!')
      expect(html).toContain('has been accepted')
      expect(html).toContain('John Doe')
      expect(html).toContain('Introduction to TypeScript')
      expect(html).toContain('https://example.com/confirm')
    })

    it('should generate talk_rejected email', () => {
      const html = generateEmailHtml('talk_rejected', baseData)

      expect(html).toContain('Thank you for your submission')
      expect(html).toContain('unable to include your talk')
      expect(html).toContain('John Doe')
      expect(html).toContain('Introduction to TypeScript')
    })

    it('should generate confirmation_reminder email', () => {
      const html = generateEmailHtml('confirmation_reminder', baseData)

      expect(html).toContain('Please confirm your participation')
      expect(html).toContain("haven't received your confirmation")
      expect(html).toContain('John Doe')
    })

    it('should generate cfp_closing_reminder email', () => {
      const html = generateEmailHtml('cfp_closing_reminder', baseData)

      expect(html).toContain('CFP Closing Soon!')
      expect(html).toContain('March 15, 2025')
      expect(html).toContain('John Doe')
      expect(html).toContain('https://example.com/cfp')
    })

    it('should generate cospeaker_invitation email', () => {
      const html = generateEmailHtml('cospeaker_invitation', baseData)

      expect(html).toContain("You've Been Invited as a Co-Speaker!")
      expect(html).toContain('John Doe')
      expect(html).toContain('Introduction to TypeScript')
      expect(html).toContain('https://example.com/confirm')
    })

    it('should include proper HTML structure', () => {
      const html = generateEmailHtml('submission_confirmed', baseData)

      expect(html).toContain('<!DOCTYPE html>')
      expect(html).toContain('<html>')
      expect(html).toContain('</html>')
      expect(html).toContain('<meta charset="utf-8">')
    })
  })

  describe('generateEmailText', () => {
    const baseData: EmailTemplateData = {
      speakerName: 'Jane Smith',
      talkTitle: 'Advanced React Patterns',
      editionName: 'ReactConf 2025',
      eventName: 'ReactConf',
      cfpUrl: 'https://example.com/cfp',
      confirmationUrl: 'https://example.com/confirm',
      cfpDeadline: 'April 1, 2025'
    }

    it('should generate plain text for submission_confirmed', () => {
      const text = generateEmailText('submission_confirmed', baseData)

      expect(text).toContain('Thank you for your submission!')
      expect(text).toContain('Jane Smith')
      expect(text).toContain('Advanced React Patterns')
      expect(text).toContain('ReactConf 2025')
      expect(text).not.toContain('<')
      expect(text).not.toContain('>')
    })

    it('should generate plain text for talk_accepted', () => {
      const text = generateEmailText('talk_accepted', baseData)

      expect(text).toContain('Congratulations!')
      expect(text).toContain('has been accepted')
      expect(text).not.toContain('style=')
    })

    it('should generate plain text for talk_rejected', () => {
      const text = generateEmailText('talk_rejected', baseData)

      expect(text).toContain('unable to include your talk')
      expect(text).toContain('encourage you to submit again')
    })

    it('should generate plain text for confirmation_reminder', () => {
      const text = generateEmailText('confirmation_reminder', baseData)

      expect(text).toContain('Please confirm your participation')
      expect(text).toContain('https://example.com/confirm')
    })

    it('should generate plain text for cfp_closing_reminder', () => {
      const text = generateEmailText('cfp_closing_reminder', baseData)

      expect(text).toContain('CFP Closing Soon!')
      expect(text).toContain('April 1, 2025')
    })

    it('should generate plain text for cospeaker_invitation', () => {
      const text = generateEmailText('cospeaker_invitation', baseData)

      expect(text).toContain("You've Been Invited as a Co-Speaker!")
      expect(text).toContain('accept or decline this invitation')
    })

    it('should return trimmed text', () => {
      const text = generateEmailText('submission_confirmed', baseData)

      expect(text).not.toMatch(/^\s/)
      expect(text).not.toMatch(/\s$/)
    })
  })

  describe('template data interpolation', () => {
    const notificationTypes: NotificationType[] = [
      'submission_confirmed',
      'talk_accepted',
      'talk_rejected',
      'confirmation_reminder',
      'cfp_closing_reminder',
      'cospeaker_invitation'
    ]

    it.each(notificationTypes)('should interpolate all data fields for %s', (type) => {
      const data: EmailTemplateData = {
        speakerName: 'Test Speaker',
        talkTitle: 'Test Talk Title',
        editionName: 'Test Edition',
        eventName: 'Test Event',
        cfpUrl: 'https://cfp.test',
        confirmationUrl: 'https://confirm.test',
        cfpDeadline: 'Test Deadline'
      }

      const html = generateEmailHtml(type, data)
      const text = generateEmailText(type, data)

      expect(html).toContain('Test Speaker')
      expect(text).toContain('Test Speaker')
    })
  })
})
