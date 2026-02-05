import { describe, expect, it } from 'vitest'
import {
  campaignSuccessRate,
  canCancelCampaign,
  canEditCampaign,
  canScheduleCampaign,
  canSendCampaign,
  isCampaignComplete
} from './email-campaign'
import type { EmailCampaign } from './email-campaign'

describe('EmailCampaign', () => {
  const now = new Date()

  const makeCampaign = (overrides: Partial<EmailCampaign> = {}): EmailCampaign => ({
    id: 'cmp-001',
    organizationId: 'org-001',
    name: 'Newsletter Q1',
    subject: 'Our Q1 Newsletter',
    bodyHtml: '<p>Hello</p>',
    bodyText: 'Hello',
    status: 'draft',
    totalRecipients: 100,
    totalSent: 90,
    totalFailed: 10,
    createdAt: now,
    updatedAt: now,
    ...overrides
  })

  describe('canEditCampaign', () => {
    it('should return true for draft', () => {
      expect(canEditCampaign('draft')).toBe(true)
    })

    it('should return true for scheduled', () => {
      expect(canEditCampaign('scheduled')).toBe(true)
    })

    it('should return false for sending', () => {
      expect(canEditCampaign('sending')).toBe(false)
    })

    it('should return false for sent', () => {
      expect(canEditCampaign('sent')).toBe(false)
    })

    it('should return false for cancelled', () => {
      expect(canEditCampaign('cancelled')).toBe(false)
    })
  })

  describe('canSendCampaign', () => {
    it('should return true only for draft', () => {
      expect(canSendCampaign('draft')).toBe(true)
    })

    it('should return false for scheduled', () => {
      expect(canSendCampaign('scheduled')).toBe(false)
    })

    it('should return false for sending', () => {
      expect(canSendCampaign('sending')).toBe(false)
    })

    it('should return false for sent', () => {
      expect(canSendCampaign('sent')).toBe(false)
    })

    it('should return false for cancelled', () => {
      expect(canSendCampaign('cancelled')).toBe(false)
    })
  })

  describe('canScheduleCampaign', () => {
    it('should return true only for draft', () => {
      expect(canScheduleCampaign('draft')).toBe(true)
    })

    it('should return false for scheduled', () => {
      expect(canScheduleCampaign('scheduled')).toBe(false)
    })

    it('should return false for sending', () => {
      expect(canScheduleCampaign('sending')).toBe(false)
    })

    it('should return false for sent', () => {
      expect(canScheduleCampaign('sent')).toBe(false)
    })

    it('should return false for cancelled', () => {
      expect(canScheduleCampaign('cancelled')).toBe(false)
    })
  })

  describe('canCancelCampaign', () => {
    it('should return true for scheduled', () => {
      expect(canCancelCampaign('scheduled')).toBe(true)
    })

    it('should return true for sending', () => {
      expect(canCancelCampaign('sending')).toBe(true)
    })

    it('should return false for draft', () => {
      expect(canCancelCampaign('draft')).toBe(false)
    })

    it('should return false for sent', () => {
      expect(canCancelCampaign('sent')).toBe(false)
    })

    it('should return false for cancelled', () => {
      expect(canCancelCampaign('cancelled')).toBe(false)
    })
  })

  describe('isCampaignComplete', () => {
    it('should return true for sent', () => {
      expect(isCampaignComplete('sent')).toBe(true)
    })

    it('should return true for cancelled', () => {
      expect(isCampaignComplete('cancelled')).toBe(true)
    })

    it('should return false for draft', () => {
      expect(isCampaignComplete('draft')).toBe(false)
    })

    it('should return false for scheduled', () => {
      expect(isCampaignComplete('scheduled')).toBe(false)
    })

    it('should return false for sending', () => {
      expect(isCampaignComplete('sending')).toBe(false)
    })
  })

  describe('campaignSuccessRate', () => {
    it('should calculate percentage of sent vs total recipients', () => {
      const campaign = makeCampaign({ totalRecipients: 100, totalSent: 90 })
      expect(campaignSuccessRate(campaign)).toBe(90)
    })

    it('should return 0 when totalRecipients is 0', () => {
      const campaign = makeCampaign({ totalRecipients: 0, totalSent: 0 })
      expect(campaignSuccessRate(campaign)).toBe(0)
    })

    it('should return 100 when all recipients received the email', () => {
      const campaign = makeCampaign({ totalRecipients: 50, totalSent: 50 })
      expect(campaignSuccessRate(campaign)).toBe(100)
    })

    it('should round the percentage', () => {
      const campaign = makeCampaign({ totalRecipients: 3, totalSent: 1 })
      expect(campaignSuccessRate(campaign)).toBe(33)
    })
  })
})
