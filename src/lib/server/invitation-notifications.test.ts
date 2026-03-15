import type PocketBase from 'pocketbase'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockSend = vi.fn()

vi.mock('$lib/server/app-settings', () => ({
  getEmailService: vi.fn().mockResolvedValue({
    send: (...args: unknown[]) => mockSend(...args)
  })
}))

vi.mock('$lib/server/email-branding', () => ({
  DEFAULT_BRANDING: {
    orgName: 'Test Org',
    primaryColor: '#3b82f6',
    logoUrl: undefined,
    footerText: 'Test Footer'
  },
  emailButton: (_branding: unknown, text: string, url: string) => `<a href="${url}">${text}</a>`,
  textFooter: (_branding: unknown) => '-- Test Footer --',
  wrapEmail: (_branding: unknown, title: string, body: string) =>
    `<html><h1>${title}</h1>${body}</html>`
}))

import { type SendInvitationEmailParams, sendInvitationEmail } from './invitation-notifications'

function createMockPb(): PocketBase {
  return {
    collection: vi.fn()
  } as unknown as PocketBase
}

describe('invitation-notifications', () => {
  let pb: PocketBase

  beforeEach(() => {
    pb = createMockPb()
    vi.clearAllMocks()
    mockSend.mockResolvedValue({ success: true })
  })

  describe('sendInvitationEmail', () => {
    const baseParams: Omit<SendInvitationEmailParams, 'pb'> = {
      email: 'user@example.com',
      organizationName: 'My Org',
      role: 'organizer',
      invitedByName: 'Admin User',
      acceptUrl: 'https://example.com/auth/invite/abc123'
    }

    it('should send an invitation email successfully', async () => {
      const result = await sendInvitationEmail({ pb, ...baseParams })

      expect(result.success).toBe(true)
      expect(mockSend).toHaveBeenCalledTimes(1)
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: "You've been invited to join My Org",
          html: expect.stringContaining('Admin User'),
          text: expect.stringContaining('Admin User')
        })
      )
    })

    it('should include organization name in the subject', async () => {
      await sendInvitationEmail({ pb, ...baseParams, organizationName: 'Cool Conf' })

      const sendCall = mockSend.mock.calls[0][0] as { subject: string }
      expect(sendCall.subject).toBe("You've been invited to join Cool Conf")
    })

    it('should include the role in the email body', async () => {
      await sendInvitationEmail({ pb, ...baseParams, role: 'reviewer' })

      const sendCall = mockSend.mock.calls[0][0] as { html: string; text: string }
      expect(sendCall.html).toContain('reviewer')
      expect(sendCall.text).toContain('reviewer')
    })

    it('should include the accept URL in the email', async () => {
      await sendInvitationEmail({ pb, ...baseParams })

      const sendCall = mockSend.mock.calls[0][0] as { html: string; text: string }
      expect(sendCall.html).toContain('https://example.com/auth/invite/abc123')
      expect(sendCall.text).toContain('https://example.com/auth/invite/abc123')
    })

    it('should return error when email sending fails', async () => {
      mockSend.mockResolvedValue({ success: false, error: 'SMTP error' })

      const result = await sendInvitationEmail({ pb, ...baseParams })

      expect(result.success).toBe(false)
      expect(result.error).toBe('SMTP error')
    })

    it('should catch exceptions and return error', async () => {
      mockSend.mockRejectedValue(new Error('Connection refused'))

      const result = await sendInvitationEmail({ pb, ...baseParams })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Connection refused')
    })

    it('should use custom primaryColor if provided', async () => {
      const result = await sendInvitationEmail({
        pb,
        ...baseParams,
        primaryColor: '#ff0000'
      })

      expect(result.success).toBe(true)
      expect(mockSend).toHaveBeenCalledTimes(1)
    })

    it('should use custom logoUrl if provided', async () => {
      const result = await sendInvitationEmail({
        pb,
        ...baseParams,
        logoUrl: 'https://example.com/logo.png'
      })

      expect(result.success).toBe(true)
    })
  })
})
