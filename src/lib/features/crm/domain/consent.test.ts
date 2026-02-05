import { describe, expect, it } from 'vitest'
import {
  CONSENT_TYPE_LABELS,
  canSendMarketingEmail,
  canShareData,
  isConsentActive
} from './consent'
import type { Consent } from './consent'

describe('Consent', () => {
  const now = new Date()

  const makeConsent = (overrides: Partial<Consent> = {}): Consent => ({
    id: 'cns-001',
    contactId: 'ct-001',
    type: 'marketing_email',
    status: 'granted',
    source: 'manual',
    createdAt: now,
    updatedAt: now,
    ...overrides
  })

  describe('isConsentActive', () => {
    it('should return true when status is granted', () => {
      const consent = makeConsent({ status: 'granted' })
      expect(isConsentActive(consent)).toBe(true)
    })

    it('should return false when status is denied', () => {
      const consent = makeConsent({ status: 'denied' })
      expect(isConsentActive(consent)).toBe(false)
    })

    it('should return false when status is withdrawn', () => {
      const consent = makeConsent({ status: 'withdrawn' })
      expect(isConsentActive(consent)).toBe(false)
    })
  })

  describe('canSendMarketingEmail', () => {
    it('should return true when marketing_email consent is granted', () => {
      const consents = [makeConsent({ type: 'marketing_email', status: 'granted' })]
      expect(canSendMarketingEmail(consents)).toBe(true)
    })

    it('should return false when marketing_email consent is denied', () => {
      const consents = [makeConsent({ type: 'marketing_email', status: 'denied' })]
      expect(canSendMarketingEmail(consents)).toBe(false)
    })

    it('should return false when no marketing_email consent exists', () => {
      const consents = [makeConsent({ type: 'data_sharing', status: 'granted' })]
      expect(canSendMarketingEmail(consents)).toBe(false)
    })

    it('should return false for empty consents array', () => {
      expect(canSendMarketingEmail([])).toBe(false)
    })

    it('should return true if at least one marketing_email is granted among multiple', () => {
      const consents = [
        makeConsent({ type: 'marketing_email', status: 'denied' }),
        makeConsent({ type: 'marketing_email', status: 'granted' })
      ]
      expect(canSendMarketingEmail(consents)).toBe(true)
    })
  })

  describe('canShareData', () => {
    it('should return true when data_sharing consent is granted', () => {
      const consents = [makeConsent({ type: 'data_sharing', status: 'granted' })]
      expect(canShareData(consents)).toBe(true)
    })

    it('should return false when data_sharing consent is denied', () => {
      const consents = [makeConsent({ type: 'data_sharing', status: 'denied' })]
      expect(canShareData(consents)).toBe(false)
    })

    it('should return false when no data_sharing consent exists', () => {
      const consents = [makeConsent({ type: 'marketing_email', status: 'granted' })]
      expect(canShareData(consents)).toBe(false)
    })

    it('should return false for empty consents array', () => {
      expect(canShareData([])).toBe(false)
    })
  })

  describe('CONSENT_TYPE_LABELS', () => {
    it('should have all 3 consent types', () => {
      expect(Object.keys(CONSENT_TYPE_LABELS)).toHaveLength(3)
      expect(CONSENT_TYPE_LABELS.marketing_email).toBe('Marketing Emails')
      expect(CONSENT_TYPE_LABELS.data_sharing).toBe('Data Sharing')
      expect(CONSENT_TYPE_LABELS.analytics).toBe('Analytics')
    })
  })
})
