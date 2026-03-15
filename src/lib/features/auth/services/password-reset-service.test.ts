import { describe, expect, it, vi } from 'vitest'
import {
  confirmPasswordReset,
  generatePasswordResetEmailHtml,
  generatePasswordResetEmailText,
  requestPasswordReset,
  sendPasswordResetEmail
} from './password-reset-service'

// Mock the app-settings module
vi.mock('$lib/server/app-settings', () => ({
  getEmailService: vi.fn()
}))

import { getEmailService } from '$lib/server/app-settings'

describe('Password Reset Service', () => {
  describe('generatePasswordResetEmailHtml', () => {
    it('should contain the user name', () => {
      const html = generatePasswordResetEmailHtml({
        name: 'Alice Martin',
        resetUrl: 'https://example.com/reset/token123'
      })

      expect(html).toContain('Alice Martin')
    })

    it('should contain the reset URL', () => {
      const resetUrl = 'https://example.com/reset/abc-def'
      const html = generatePasswordResetEmailHtml({
        name: 'Test User',
        resetUrl
      })

      expect(html).toContain(resetUrl)
      expect(html).toContain(`href="${resetUrl}"`)
    })

    it('should include proper HTML structure and branding', () => {
      const html = generatePasswordResetEmailHtml({
        name: 'Test',
        resetUrl: 'https://example.com/reset'
      })

      expect(html).toContain('<!DOCTYPE html>')
      expect(html).toContain('<html>')
      expect(html).toContain('</html>')
      expect(html).toContain('Open Event Orchestrator')
    })

    it('should include the Reset Your Password title', () => {
      const html = generatePasswordResetEmailHtml({
        name: 'Test',
        resetUrl: 'https://example.com/reset'
      })

      expect(html).toContain('Reset Your Password')
    })

    it('should include 1-hour expiry notice', () => {
      const html = generatePasswordResetEmailHtml({
        name: 'Test',
        resetUrl: 'https://example.com/reset'
      })

      expect(html).toContain('1 hour')
    })
  })

  describe('generatePasswordResetEmailText', () => {
    it('should contain the user name', () => {
      const text = generatePasswordResetEmailText({
        name: 'Bob Smith',
        resetUrl: 'https://example.com/reset/xyz'
      })

      expect(text).toContain('Bob Smith')
    })

    it('should contain the reset URL', () => {
      const resetUrl = 'https://example.com/reset/token456'
      const text = generatePasswordResetEmailText({
        name: 'Test User',
        resetUrl
      })

      expect(text).toContain(resetUrl)
    })

    it('should include expiry notice', () => {
      const text = generatePasswordResetEmailText({
        name: 'Test',
        resetUrl: 'https://example.com/reset'
      })

      expect(text).toContain('1 hour')
    })

    it('should include footer with branding', () => {
      const text = generatePasswordResetEmailText({
        name: 'Test',
        resetUrl: 'https://example.com/reset'
      })

      expect(text).toContain('Open Event Orchestrator')
      expect(text).toContain('---')
    })
  })

  describe('sendPasswordResetEmail', () => {
    it('should send email successfully', async () => {
      const mockSend = vi.fn().mockResolvedValue({ success: true })
      vi.mocked(getEmailService).mockResolvedValue({
        send: mockSend
      } as ReturnType<typeof getEmailService> extends Promise<infer T> ? T : never)

      const mockPb = {} as Parameters<typeof sendPasswordResetEmail>[0]['pb']

      const result = await sendPasswordResetEmail({
        pb: mockPb,
        email: 'user@example.com',
        name: 'Test User',
        resetUrl: 'https://example.com/reset/token'
      })

      expect(result.success).toBe(true)
      expect(mockSend).toHaveBeenCalledWith({
        to: 'user@example.com',
        subject: 'Reset your password - Open Event Orchestrator',
        html: expect.stringContaining('Test User'),
        text: expect.stringContaining('Test User')
      })
    })

    it('should handle email service failure', async () => {
      const mockSend = vi.fn().mockRejectedValue(new Error('SMTP connection refused'))
      vi.mocked(getEmailService).mockResolvedValue({
        send: mockSend
      } as ReturnType<typeof getEmailService> extends Promise<infer T> ? T : never)

      const mockPb = {} as Parameters<typeof sendPasswordResetEmail>[0]['pb']

      const result = await sendPasswordResetEmail({
        pb: mockPb,
        email: 'user@example.com',
        name: 'Test User',
        resetUrl: 'https://example.com/reset/token'
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('SMTP connection refused')
    })
  })

  describe('requestPasswordReset', () => {
    it('should request password reset successfully', async () => {
      const mockRequestPasswordReset = vi.fn().mockResolvedValue(undefined)
      const mockPb = {
        collection: vi.fn().mockReturnValue({
          requestPasswordReset: mockRequestPasswordReset
        })
      } as unknown as Parameters<typeof requestPasswordReset>[0]

      const result = await requestPasswordReset(mockPb, 'user@example.com')

      expect(result.success).toBe(true)
      expect(mockPb.collection).toHaveBeenCalledWith('users')
      expect(mockRequestPasswordReset).toHaveBeenCalledWith('user@example.com')
    })

    it('should handle request failure', async () => {
      const mockRequestPasswordReset = vi.fn().mockRejectedValue(new Error('User not found'))
      const mockPb = {
        collection: vi.fn().mockReturnValue({
          requestPasswordReset: mockRequestPasswordReset
        })
      } as unknown as Parameters<typeof requestPasswordReset>[0]

      const result = await requestPasswordReset(mockPb, 'nonexistent@example.com')

      expect(result.success).toBe(false)
      expect(result.error).toContain('User not found')
    })
  })

  describe('confirmPasswordReset', () => {
    it('should confirm password reset successfully', async () => {
      const mockConfirmPasswordReset = vi.fn().mockResolvedValue(undefined)
      const mockPb = {
        collection: vi.fn().mockReturnValue({
          confirmPasswordReset: mockConfirmPasswordReset
        })
      } as unknown as Parameters<typeof confirmPasswordReset>[0]

      const result = await confirmPasswordReset(mockPb, 'valid-token', 'newPass123', 'newPass123')

      expect(result.success).toBe(true)
      expect(mockPb.collection).toHaveBeenCalledWith('users')
      expect(mockConfirmPasswordReset).toHaveBeenCalledWith(
        'valid-token',
        'newPass123',
        'newPass123'
      )
    })

    it('should handle invalid token with PB response message', async () => {
      const mockConfirmPasswordReset = vi.fn().mockRejectedValue({
        response: { message: 'Token expired' }
      })
      const mockPb = {
        collection: vi.fn().mockReturnValue({
          confirmPasswordReset: mockConfirmPasswordReset
        })
      } as unknown as Parameters<typeof confirmPasswordReset>[0]

      const result = await confirmPasswordReset(mockPb, 'expired-token', 'pass', 'pass')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Token expired')
    })

    it('should use default error message when no response message', async () => {
      const mockConfirmPasswordReset = vi.fn().mockRejectedValue(new Error('Unknown'))
      const mockPb = {
        collection: vi.fn().mockReturnValue({
          confirmPasswordReset: mockConfirmPasswordReset
        })
      } as unknown as Parameters<typeof confirmPasswordReset>[0]

      const result = await confirmPasswordReset(mockPb, 'bad-token', 'pass', 'pass')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid or expired password reset token')
    })
  })
})
