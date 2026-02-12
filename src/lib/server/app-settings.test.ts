import { describe, expect, it } from 'vitest'
import {
  type SlackSettings,
  type StripeSettings,
  getStripeMode,
  isSlackConfigured,
  isStripeConfigured,
  maskStripeKey
} from './app-settings'

describe('app-settings', () => {
  describe('Stripe Settings', () => {
    describe('getStripeMode', () => {
      it('should return live for sk_live_ prefix', () => {
        expect(getStripeMode('sk_live_abc123')).toBe('live')
      })

      it('should return test for sk_test_ prefix', () => {
        expect(getStripeMode('sk_test_abc123')).toBe('test')
      })

      it('should return test for empty string', () => {
        expect(getStripeMode('')).toBe('test')
      })

      it('should return test for invalid prefix', () => {
        expect(getStripeMode('invalid_key')).toBe('test')
      })
    })

    describe('isStripeConfigured', () => {
      it('should return true when all fields are set and enabled', () => {
        const settings: StripeSettings = {
          stripeSecretKey: 'sk_test_123',
          stripePublishableKey: 'pk_test_123',
          stripeWebhookSecret: 'whsec_123',
          stripeEnabled: true
        }
        expect(isStripeConfigured(settings)).toBe(true)
      })

      it('should return false when disabled', () => {
        const settings: StripeSettings = {
          stripeSecretKey: 'sk_test_123',
          stripePublishableKey: 'pk_test_123',
          stripeWebhookSecret: 'whsec_123',
          stripeEnabled: false
        }
        expect(isStripeConfigured(settings)).toBe(false)
      })

      it('should return false when secret key is missing', () => {
        const settings: StripeSettings = {
          stripeSecretKey: '',
          stripePublishableKey: 'pk_test_123',
          stripeWebhookSecret: 'whsec_123',
          stripeEnabled: true
        }
        expect(isStripeConfigured(settings)).toBe(false)
      })

      it('should return false when publishable key is missing', () => {
        const settings: StripeSettings = {
          stripeSecretKey: 'sk_test_123',
          stripePublishableKey: '',
          stripeWebhookSecret: 'whsec_123',
          stripeEnabled: true
        }
        expect(isStripeConfigured(settings)).toBe(false)
      })

      it('should return false when webhook secret is missing', () => {
        const settings: StripeSettings = {
          stripeSecretKey: 'sk_test_123',
          stripePublishableKey: 'pk_test_123',
          stripeWebhookSecret: '',
          stripeEnabled: true
        }
        expect(isStripeConfigured(settings)).toBe(false)
      })
    })

    describe('maskStripeKey', () => {
      it('should mask secret key showing prefix and last 4 chars', () => {
        const key = 'sk_test_1234567890abcdef'
        const masked = maskStripeKey(key)
        expect(masked).toBe('sk_test_••••••••cdef')
      })

      it('should mask publishable key showing prefix and last 4 chars', () => {
        const key = 'pk_test_1234567890abcdef'
        const masked = maskStripeKey(key)
        expect(masked).toBe('pk_test_••••••••cdef')
      })

      it('should mask live keys', () => {
        const key = 'sk_live_1234567890abcdef'
        const masked = maskStripeKey(key)
        expect(masked).toBe('sk_live_••••••••cdef')
      })

      it('should return masked placeholder for empty string', () => {
        expect(maskStripeKey('')).toBe('••••••••')
      })

      it('should return masked placeholder for short string', () => {
        expect(maskStripeKey('short')).toBe('••••••••')
      })

      it('should handle webhook secret without prefix', () => {
        const key = 'whsec_1234567890abcdef'
        const masked = maskStripeKey(key)
        expect(masked).toBe('••••••••cdef')
      })
    })
  })

  describe('Slack Settings', () => {
    describe('isSlackConfigured', () => {
      it('should return true when webhook URL is set and enabled', () => {
        const settings: SlackSettings = {
          slackWebhookUrl: 'https://hooks.slack.com/services/xxx',
          slackEnabled: true,
          slackDefaultChannel: '#general'
        }
        expect(isSlackConfigured(settings)).toBe(true)
      })

      it('should return false when disabled', () => {
        const settings: SlackSettings = {
          slackWebhookUrl: 'https://hooks.slack.com/services/xxx',
          slackEnabled: false,
          slackDefaultChannel: '#general'
        }
        expect(isSlackConfigured(settings)).toBe(false)
      })

      it('should return false when webhook URL is empty', () => {
        const settings: SlackSettings = {
          slackWebhookUrl: '',
          slackEnabled: true,
          slackDefaultChannel: '#general'
        }
        expect(isSlackConfigured(settings)).toBe(false)
      })
    })
  })
})
