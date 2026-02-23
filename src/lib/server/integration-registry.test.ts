import { describe, expect, it } from 'vitest'
import {
  INTEGRATION_REGISTRY,
  INTEGRATION_STATUS_COLORS,
  INTEGRATION_STATUS_LABELS,
  type IntegrationEntry,
  type IntegrationType,
  areRequiredIntegrationsConfigured,
  buildIntegrationEntry,
  countIntegrationsByStatus,
  getIntegrationInfo,
  getIntegrationTypes,
  isValidIntegrationType,
  sortIntegrationsByStatus
} from './integration-registry'

describe('integration-registry', () => {
  describe('INTEGRATION_REGISTRY', () => {
    it('should have all expected integrations', () => {
      expect(INTEGRATION_REGISTRY.smtp).toBeDefined()
      expect(INTEGRATION_REGISTRY.stripe).toBeDefined()
      expect(INTEGRATION_REGISTRY.slack).toBeDefined()
      expect(INTEGRATION_REGISTRY.discord).toBeDefined()
      expect(INTEGRATION_REGISTRY.webhooks).toBeDefined()
    })

    it('should have valid info for each integration', () => {
      for (const [type, info] of Object.entries(INTEGRATION_REGISTRY)) {
        expect(info.type).toBe(type)
        expect(info.name).toBeTruthy()
        expect(info.description).toBeTruthy()
        expect(info.icon).toBeTruthy()
        expect(info.configPath).toMatch(/^\/admin\/settings/)
      }
    })
  })

  describe('INTEGRATION_STATUS_LABELS', () => {
    it('should have labels for all statuses', () => {
      expect(INTEGRATION_STATUS_LABELS.connected).toBe('Connected')
      expect(INTEGRATION_STATUS_LABELS.not_configured).toBe('Not configured')
      expect(INTEGRATION_STATUS_LABELS.error).toBe('Error')
    })
  })

  describe('INTEGRATION_STATUS_COLORS', () => {
    it('should have colors for all statuses', () => {
      expect(INTEGRATION_STATUS_COLORS.connected).toBe('green')
      expect(INTEGRATION_STATUS_COLORS.not_configured).toBe('yellow')
      expect(INTEGRATION_STATUS_COLORS.error).toBe('red')
    })
  })

  describe('getIntegrationTypes', () => {
    it('should return all integration types', () => {
      const types = getIntegrationTypes()
      expect(types).toContain('smtp')
      expect(types).toContain('stripe')
      expect(types).toContain('helloasso')
      expect(types).toContain('slack')
      expect(types).toContain('discord')
      expect(types).toContain('webhooks')
      expect(types).toHaveLength(6)
    })
  })

  describe('getIntegrationInfo', () => {
    it('should return correct info for smtp', () => {
      const info = getIntegrationInfo('smtp')
      expect(info.type).toBe('smtp')
      expect(info.name).toBe('Email (SMTP)')
      expect(info.icon).toBe('mail')
    })

    it('should return correct info for stripe', () => {
      const info = getIntegrationInfo('stripe')
      expect(info.type).toBe('stripe')
      expect(info.name).toBe('Stripe')
      expect(info.configPath).toBe('/admin/settings/stripe')
    })
  })

  describe('isValidIntegrationType', () => {
    it('should return true for valid types', () => {
      expect(isValidIntegrationType('smtp')).toBe(true)
      expect(isValidIntegrationType('stripe')).toBe(true)
      expect(isValidIntegrationType('slack')).toBe(true)
      expect(isValidIntegrationType('discord')).toBe(true)
      expect(isValidIntegrationType('webhooks')).toBe(true)
    })

    it('should return false for invalid types', () => {
      expect(isValidIntegrationType('invalid')).toBe(false)
      expect(isValidIntegrationType('')).toBe(false)
      expect(isValidIntegrationType('SMTP')).toBe(false)
    })
  })

  describe('buildIntegrationEntry', () => {
    it('should build entry with basic status', () => {
      const entry = buildIntegrationEntry('smtp', 'connected')

      expect(entry.info.type).toBe('smtp')
      expect(entry.info.name).toBe('Email (SMTP)')
      expect(entry.status.type).toBe('smtp')
      expect(entry.status.status).toBe('connected')
      expect(entry.status.lastChecked).toBeInstanceOf(Date)
    })

    it('should include optional message', () => {
      const entry = buildIntegrationEntry('stripe', 'error', 'Invalid API key')

      expect(entry.status.message).toBe('Invalid API key')
    })

    it('should include optional details', () => {
      const entry = buildIntegrationEntry('stripe', 'connected', undefined, {
        mode: 'test',
        accountId: 'acct_123'
      })

      expect(entry.status.details).toEqual({
        mode: 'test',
        accountId: 'acct_123'
      })
    })
  })

  describe('sortIntegrationsByStatus', () => {
    it('should sort errors first, then not configured, then connected', () => {
      const entries: IntegrationEntry[] = [
        buildIntegrationEntry('smtp', 'connected'),
        buildIntegrationEntry('stripe', 'error'),
        buildIntegrationEntry('slack', 'not_configured'),
        buildIntegrationEntry('discord', 'connected'),
        buildIntegrationEntry('webhooks', 'error')
      ]

      const sorted = sortIntegrationsByStatus(entries)

      expect(sorted[0].status.status).toBe('error')
      expect(sorted[1].status.status).toBe('error')
      expect(sorted[2].status.status).toBe('not_configured')
      expect(sorted[3].status.status).toBe('connected')
      expect(sorted[4].status.status).toBe('connected')
    })

    it('should not mutate original array', () => {
      const entries: IntegrationEntry[] = [
        buildIntegrationEntry('smtp', 'connected'),
        buildIntegrationEntry('stripe', 'error')
      ]

      const original = [...entries]
      sortIntegrationsByStatus(entries)

      expect(entries).toEqual(original)
    })
  })

  describe('countIntegrationsByStatus', () => {
    it('should count integrations by status', () => {
      const entries: IntegrationEntry[] = [
        buildIntegrationEntry('smtp', 'connected'),
        buildIntegrationEntry('stripe', 'connected'),
        buildIntegrationEntry('slack', 'not_configured'),
        buildIntegrationEntry('discord', 'error'),
        buildIntegrationEntry('webhooks', 'not_configured')
      ]

      const counts = countIntegrationsByStatus(entries)

      expect(counts.connected).toBe(2)
      expect(counts.not_configured).toBe(2)
      expect(counts.error).toBe(1)
    })

    it('should return zeros for empty array', () => {
      const counts = countIntegrationsByStatus([])

      expect(counts.connected).toBe(0)
      expect(counts.not_configured).toBe(0)
      expect(counts.error).toBe(0)
    })
  })

  describe('areRequiredIntegrationsConfigured', () => {
    it('should return true when all required integrations are connected', () => {
      const entries: IntegrationEntry[] = [
        buildIntegrationEntry('smtp', 'connected'),
        buildIntegrationEntry('stripe', 'connected'),
        buildIntegrationEntry('slack', 'not_configured')
      ]

      const required: IntegrationType[] = ['smtp', 'stripe']

      expect(areRequiredIntegrationsConfigured(entries, required)).toBe(true)
    })

    it('should return false when a required integration is not connected', () => {
      const entries: IntegrationEntry[] = [
        buildIntegrationEntry('smtp', 'connected'),
        buildIntegrationEntry('stripe', 'not_configured')
      ]

      const required: IntegrationType[] = ['smtp', 'stripe']

      expect(areRequiredIntegrationsConfigured(entries, required)).toBe(false)
    })

    it('should return false when a required integration has error', () => {
      const entries: IntegrationEntry[] = [
        buildIntegrationEntry('smtp', 'connected'),
        buildIntegrationEntry('stripe', 'error')
      ]

      const required: IntegrationType[] = ['smtp', 'stripe']

      expect(areRequiredIntegrationsConfigured(entries, required)).toBe(false)
    })

    it('should return false when a required integration is missing', () => {
      const entries: IntegrationEntry[] = [buildIntegrationEntry('smtp', 'connected')]

      const required: IntegrationType[] = ['smtp', 'stripe']

      expect(areRequiredIntegrationsConfigured(entries, required)).toBe(false)
    })

    it('should return true for empty required list', () => {
      const entries: IntegrationEntry[] = [buildIntegrationEntry('smtp', 'not_configured')]

      expect(areRequiredIntegrationsConfigured(entries, [])).toBe(true)
    })
  })
})
