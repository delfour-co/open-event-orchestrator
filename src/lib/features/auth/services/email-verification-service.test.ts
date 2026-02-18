import { describe, expect, it, vi } from 'vitest'
import {
  confirmEmailVerification,
  generateVerificationEmailHtml,
  generateVerificationEmailText,
  requestEmailVerification,
  sendVerificationEmail
} from './email-verification-service'

// Mock the app-settings module
vi.mock('$lib/server/app-settings', () => ({
  getEmailService: vi.fn()
}))

import { getEmailService } from '$lib/server/app-settings'

describe('Email Verification Service', () => {
  describe('generateVerificationEmailHtml', () => {
    it('should generate HTML with user name', () => {
      const html = generateVerificationEmailHtml({
        name: 'John Doe',
        verificationUrl: 'https://example.com/verify/abc123'
      })

      expect(html).toContain('John Doe')
      expect(html).toContain('Verify Your Email Address')
    })

    it('should include verification URL in HTML', () => {
      const verificationUrl = 'https://example.com/verify/token123'
      const html = generateVerificationEmailHtml({
        name: 'Test User',
        verificationUrl
      })

      expect(html).toContain(verificationUrl)
      expect(html).toContain(`href="${verificationUrl}"`)
    })

    it('should include proper HTML structure', () => {
      const html = generateVerificationEmailHtml({
        name: 'Test',
        verificationUrl: 'https://test.com/verify'
      })

      expect(html).toContain('<!DOCTYPE html>')
      expect(html).toContain('<html>')
      expect(html).toContain('</html>')
      expect(html).toContain('Open Event Orchestrator')
    })

    it('should include 24-hour expiry notice', () => {
      const html = generateVerificationEmailHtml({
        name: 'Test',
        verificationUrl: 'https://test.com/verify'
      })

      expect(html).toContain('24 hours')
    })
  })

  describe('generateVerificationEmailText', () => {
    it('should generate plain text with user name', () => {
      const text = generateVerificationEmailText({
        name: 'Jane Smith',
        verificationUrl: 'https://example.com/verify/xyz789'
      })

      expect(text).toContain('Jane Smith')
      expect(text).toContain('Verify Your Email Address')
    })

    it('should include verification URL in plain text', () => {
      const verificationUrl = 'https://example.com/verify/token456'
      const text = generateVerificationEmailText({
        name: 'Test User',
        verificationUrl
      })

      expect(text).toContain(verificationUrl)
    })

    it('should include expiry notice', () => {
      const text = generateVerificationEmailText({
        name: 'Test',
        verificationUrl: 'https://test.com/verify'
      })

      expect(text).toContain('24 hours')
    })

    it('should include footer', () => {
      const text = generateVerificationEmailText({
        name: 'Test',
        verificationUrl: 'https://test.com/verify'
      })

      expect(text).toContain('Open Event Orchestrator')
      expect(text).toContain('All-in-one platform for event management')
    })
  })

  describe('sendVerificationEmail', () => {
    it('should send email successfully', async () => {
      const mockSend = vi.fn().mockResolvedValue({ success: true })
      vi.mocked(getEmailService).mockResolvedValue({
        send: mockSend
      } as ReturnType<typeof getEmailService> extends Promise<infer T> ? T : never)

      const mockPb = {} as Parameters<typeof sendVerificationEmail>[0]['pb']

      const result = await sendVerificationEmail({
        pb: mockPb,
        email: 'test@example.com',
        name: 'Test User',
        verificationUrl: 'https://example.com/verify/token'
      })

      expect(result.success).toBe(true)
      expect(mockSend).toHaveBeenCalledWith({
        to: 'test@example.com',
        subject: 'Verify your email address - Open Event Orchestrator',
        html: expect.stringContaining('Test User'),
        text: expect.stringContaining('Test User')
      })
    })

    it('should handle email service failure', async () => {
      const mockSend = vi.fn().mockRejectedValue(new Error('SMTP error'))
      vi.mocked(getEmailService).mockResolvedValue({
        send: mockSend
      } as ReturnType<typeof getEmailService> extends Promise<infer T> ? T : never)

      const mockPb = {} as Parameters<typeof sendVerificationEmail>[0]['pb']

      const result = await sendVerificationEmail({
        pb: mockPb,
        email: 'test@example.com',
        name: 'Test User',
        verificationUrl: 'https://example.com/verify/token'
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('SMTP error')
    })

    it('should return error from email service', async () => {
      const mockSend = vi.fn().mockResolvedValue({ success: false, error: 'Invalid recipient' })
      vi.mocked(getEmailService).mockResolvedValue({
        send: mockSend
      } as ReturnType<typeof getEmailService> extends Promise<infer T> ? T : never)

      const mockPb = {} as Parameters<typeof sendVerificationEmail>[0]['pb']

      const result = await sendVerificationEmail({
        pb: mockPb,
        email: 'invalid@example.com',
        name: 'Test User',
        verificationUrl: 'https://example.com/verify/token'
      })

      expect(result.success).toBe(false)
    })
  })

  describe('requestEmailVerification', () => {
    it('should request verification successfully', async () => {
      const mockRequestVerification = vi.fn().mockResolvedValue(undefined)
      const mockPb = {
        collection: vi.fn().mockReturnValue({
          requestVerification: mockRequestVerification
        })
      } as unknown as Parameters<typeof requestEmailVerification>[0]

      const result = await requestEmailVerification(mockPb, 'test@example.com')

      expect(result.success).toBe(true)
      expect(mockPb.collection).toHaveBeenCalledWith('users')
      expect(mockRequestVerification).toHaveBeenCalledWith('test@example.com')
    })

    it('should handle request failure', async () => {
      const mockRequestVerification = vi.fn().mockRejectedValue(new Error('User not found'))
      const mockPb = {
        collection: vi.fn().mockReturnValue({
          requestVerification: mockRequestVerification
        })
      } as unknown as Parameters<typeof requestEmailVerification>[0]

      const result = await requestEmailVerification(mockPb, 'nonexistent@example.com')

      expect(result.success).toBe(false)
      expect(result.error).toContain('User not found')
    })
  })

  describe('confirmEmailVerification', () => {
    it('should confirm verification successfully', async () => {
      const mockConfirmVerification = vi.fn().mockResolvedValue(undefined)
      const mockPb = {
        collection: vi.fn().mockReturnValue({
          confirmVerification: mockConfirmVerification
        })
      } as unknown as Parameters<typeof confirmEmailVerification>[0]

      const result = await confirmEmailVerification(mockPb, 'valid-token-123')

      expect(result.success).toBe(true)
      expect(mockPb.collection).toHaveBeenCalledWith('users')
      expect(mockConfirmVerification).toHaveBeenCalledWith('valid-token-123')
    })

    it('should handle invalid token', async () => {
      const mockConfirmVerification = vi.fn().mockRejectedValue({
        response: { message: 'Token expired' }
      })
      const mockPb = {
        collection: vi.fn().mockReturnValue({
          confirmVerification: mockConfirmVerification
        })
      } as unknown as Parameters<typeof confirmEmailVerification>[0]

      const result = await confirmEmailVerification(mockPb, 'expired-token')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Token expired')
    })

    it('should use default error message when no response message', async () => {
      const mockConfirmVerification = vi.fn().mockRejectedValue(new Error('Unknown error'))
      const mockPb = {
        collection: vi.fn().mockReturnValue({
          confirmVerification: mockConfirmVerification
        })
      } as unknown as Parameters<typeof confirmEmailVerification>[0]

      const result = await confirmEmailVerification(mockPb, 'bad-token')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid or expired verification token')
    })
  })
})
