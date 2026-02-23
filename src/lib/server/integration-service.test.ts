import type PocketBase from 'pocketbase'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  checkIntegrationStatus,
  createIntegrationService,
  getAllIntegrationStatuses
} from './integration-service'

describe('integration-service', () => {
  let mockPb: PocketBase

  beforeEach(() => {
    mockPb = {
      collection: vi.fn()
    } as unknown as PocketBase
  })

  describe('checkIntegrationStatus', () => {
    describe('smtp', () => {
      it('should return connected when SMTP is configured', async () => {
        vi.mocked(mockPb.collection).mockReturnValue({
          getList: vi.fn().mockResolvedValue({
            items: [
              {
                smtpHost: 'smtp.example.com',
                smtpPort: 587,
                smtpEnabled: true
              }
            ]
          })
        } as never)

        const result = await checkIntegrationStatus(mockPb, 'smtp')

        expect(result.status.status).toBe('connected')
        expect(result.status.message).toContain('smtp.example.com')
      })

      it('should return not_configured when SMTP is disabled', async () => {
        vi.mocked(mockPb.collection).mockReturnValue({
          getList: vi.fn().mockResolvedValue({
            items: [
              {
                smtpHost: 'smtp.example.com',
                smtpEnabled: false
              }
            ]
          })
        } as never)

        const result = await checkIntegrationStatus(mockPb, 'smtp')

        expect(result.status.status).toBe('not_configured')
      })

      it('should return connected with default localhost when host is empty', async () => {
        vi.mocked(mockPb.collection).mockReturnValue({
          getList: vi.fn().mockResolvedValue({
            items: [
              {
                smtpHost: '',
                smtpEnabled: true
              }
            ]
          })
        } as never)

        const result = await checkIntegrationStatus(mockPb, 'smtp')

        // Falls back to default localhost
        expect(result.status.status).toBe('connected')
        expect(result.status.message).toContain('localhost')
      })
    })

    describe('stripe', () => {
      it('should return connected when Stripe is configured', async () => {
        vi.mocked(mockPb.collection).mockReturnValue({
          getList: vi.fn().mockResolvedValue({
            items: [
              {
                stripeSecretKey: 'sk_test_123',
                stripePublishableKey: 'pk_test_123',
                stripeWebhookSecret: 'whsec_123',
                stripeEnabled: true
              }
            ]
          })
        } as never)

        const result = await checkIntegrationStatus(mockPb, 'stripe')

        expect(result.status.status).toBe('connected')
        expect(result.status.details?.mode).toBe('test')
      })

      it('should return connected with live mode', async () => {
        vi.mocked(mockPb.collection).mockReturnValue({
          getList: vi.fn().mockResolvedValue({
            items: [
              {
                stripeSecretKey: 'sk_live_123',
                stripePublishableKey: 'pk_live_123',
                stripeWebhookSecret: 'whsec_123',
                stripeEnabled: true
              }
            ]
          })
        } as never)

        const result = await checkIntegrationStatus(mockPb, 'stripe')

        expect(result.status.status).toBe('connected')
        expect(result.status.details?.mode).toBe('live')
      })

      it('should return not_configured when disabled', async () => {
        vi.mocked(mockPb.collection).mockReturnValue({
          getList: vi.fn().mockResolvedValue({
            items: [
              {
                stripeSecretKey: 'sk_test_123',
                stripeEnabled: false
              }
            ]
          })
        } as never)

        const result = await checkIntegrationStatus(mockPb, 'stripe')

        expect(result.status.status).toBe('not_configured')
      })
    })

    describe('slack', () => {
      it('should return connected when Slack is configured', async () => {
        vi.mocked(mockPb.collection).mockReturnValue({
          getList: vi.fn().mockResolvedValue({
            items: [
              {
                slackWebhookUrl: 'https://hooks.slack.com/services/xxx',
                slackEnabled: true,
                slackDefaultChannel: '#events'
              }
            ]
          })
        } as never)

        const result = await checkIntegrationStatus(mockPb, 'slack')

        expect(result.status.status).toBe('connected')
        expect(result.status.message).toContain('#events')
      })

      it('should return not_configured when disabled', async () => {
        vi.mocked(mockPb.collection).mockReturnValue({
          getList: vi.fn().mockResolvedValue({
            items: [
              {
                slackWebhookUrl: 'https://hooks.slack.com/services/xxx',
                slackEnabled: false
              }
            ]
          })
        } as never)

        const result = await checkIntegrationStatus(mockPb, 'slack')

        expect(result.status.status).toBe('not_configured')
      })
    })

    describe('discord', () => {
      it('should return connected when Discord is configured', async () => {
        vi.mocked(mockPb.collection).mockReturnValue({
          getList: vi.fn().mockResolvedValue({
            items: [
              {
                discordWebhookUrl: 'https://discord.com/api/webhooks/123/abc',
                discordEnabled: true,
                discordUsername: 'My Bot'
              }
            ]
          })
        } as never)

        const result = await checkIntegrationStatus(mockPb, 'discord')

        expect(result.status.status).toBe('connected')
        expect(result.status.message).toContain('My Bot')
      })

      it('should return not_configured when disabled', async () => {
        vi.mocked(mockPb.collection).mockReturnValue({
          getList: vi.fn().mockResolvedValue({
            items: [
              {
                discordWebhookUrl: 'https://discord.com/api/webhooks/123/abc',
                discordEnabled: false
              }
            ]
          })
        } as never)

        const result = await checkIntegrationStatus(mockPb, 'discord')

        expect(result.status.status).toBe('not_configured')
        expect(result.status.message).toBe('Discord is disabled')
      })

      it('should return not_configured when webhook URL is missing', async () => {
        vi.mocked(mockPb.collection).mockReturnValue({
          getList: vi.fn().mockResolvedValue({
            items: [
              {
                discordWebhookUrl: '',
                discordEnabled: true
              }
            ]
          })
        } as never)

        const result = await checkIntegrationStatus(mockPb, 'discord')

        expect(result.status.status).toBe('not_configured')
        expect(result.status.message).toBe('Discord webhook not configured')
      })
    })

    describe('webhooks', () => {
      it('should return connected when active webhooks exist', async () => {
        vi.mocked(mockPb.collection).mockReturnValue({
          getList: vi.fn().mockResolvedValue({
            totalItems: 3,
            items: []
          })
        } as never)

        const result = await checkIntegrationStatus(mockPb, 'webhooks')

        expect(result.status.status).toBe('connected')
        expect(result.status.message).toContain('3 active webhook')
      })

      it('should return not_configured when no active webhooks', async () => {
        vi.mocked(mockPb.collection).mockReturnValue({
          getList: vi.fn().mockResolvedValue({
            totalItems: 0,
            items: []
          })
        } as never)

        const result = await checkIntegrationStatus(mockPb, 'webhooks')

        expect(result.status.status).toBe('not_configured')
      })

      it('should return not_configured when collection does not exist', async () => {
        vi.mocked(mockPb.collection).mockReturnValue({
          getList: vi.fn().mockRejectedValue(new Error('Collection not found'))
        } as never)

        const result = await checkIntegrationStatus(mockPb, 'webhooks')

        expect(result.status.status).toBe('not_configured')
      })
    })
  })

  describe('getAllIntegrationStatuses', () => {
    it('should return status for all integrations', async () => {
      vi.mocked(mockPb.collection).mockReturnValue({
        getList: vi.fn().mockResolvedValue({
          items: [],
          totalItems: 0
        })
      } as never)

      const results = await getAllIntegrationStatuses(mockPb)

      expect(results).toHaveLength(6)
      expect(results.map((r) => r.info.type)).toEqual([
        'smtp',
        'stripe',
        'helloasso',
        'slack',
        'discord',
        'webhooks'
      ])
    })
  })

  describe('createIntegrationService', () => {
    it('should create service with getAll method', async () => {
      vi.mocked(mockPb.collection).mockReturnValue({
        getList: vi.fn().mockResolvedValue({
          items: [],
          totalItems: 0
        })
      } as never)

      const service = createIntegrationService(mockPb)
      const results = await service.getAll()

      expect(results).toHaveLength(6)
    })

    it('should create service with getStatus method', async () => {
      vi.mocked(mockPb.collection).mockReturnValue({
        getList: vi.fn().mockResolvedValue({
          items: [{ smtpHost: 'smtp.test.com', smtpEnabled: true }]
        })
      } as never)

      const service = createIntegrationService(mockPb)
      const result = await service.getStatus('smtp')

      expect(result.info.type).toBe('smtp')
      expect(result.status.status).toBe('connected')
    })

    it('should create service with isConnected method', async () => {
      vi.mocked(mockPb.collection).mockReturnValue({
        getList: vi.fn().mockResolvedValue({
          items: [{ smtpHost: 'smtp.test.com', smtpEnabled: true }]
        })
      } as never)

      const service = createIntegrationService(mockPb)

      expect(await service.isConnected('smtp')).toBe(true)
    })

    it('should return false for isConnected when not configured', async () => {
      vi.mocked(mockPb.collection).mockReturnValue({
        getList: vi.fn().mockResolvedValue({
          items: [
            {
              stripeSecretKey: 'sk_test_disabled',
              stripePublishableKey: 'pk_test_disabled',
              stripeWebhookSecret: '',
              stripeEnabled: false,
              stripeApiBase: ''
            }
          ]
        })
      } as never)

      const service = createIntegrationService(mockPb)

      expect(await service.isConnected('stripe')).toBe(false)
    })
  })
})
