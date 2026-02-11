import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createGdprComplianceService } from './gdpr-compliance-service'

const createMockPb = () => {
  const collections: Record<string, ReturnType<typeof createMockCollection>> = {}

  const createMockCollection = () => ({
    getFullList: vi.fn().mockResolvedValue([]),
    getList: vi.fn().mockResolvedValue({ items: [], totalItems: 0 }),
    getOne: vi.fn().mockResolvedValue({}),
    create: vi.fn().mockImplementation((data) =>
      Promise.resolve({
        id: 'new-id',
        ...data,
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      })
    ),
    update: vi.fn().mockImplementation((id, data) =>
      Promise.resolve({
        id,
        ...data,
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      })
    ),
    delete: vi.fn().mockResolvedValue({})
  })

  return {
    collection: vi.fn((name: string) => {
      if (!collections[name]) {
        collections[name] = createMockCollection()
      }
      return collections[name]
    }),
    _collections: collections
    // biome-ignore lint/suspicious/noExplicitAny: mock PocketBase
  } as any
}

describe('GdprComplianceService', () => {
  let pb: ReturnType<typeof createMockPb>
  let service: ReturnType<typeof createGdprComplianceService>

  const now = new Date()

  beforeEach(() => {
    vi.clearAllMocks()
    pb = createMockPb()
    service = createGdprComplianceService(pb)
  })

  describe('initiateDoubleOptIn', () => {
    it('should initiate double opt-in for a contact', async () => {
      pb.collection('contacts').getOne.mockResolvedValue({
        id: 'c1',
        email: 'test@example.com'
      })

      const result = await service.initiateDoubleOptIn('c1', 'https://example.com')

      expect(result.success).toBe(true)
      expect(result.contactId).toBe('c1')
      expect(result.confirmationToken).toBeDefined()
      expect(result.confirmationUrl).toContain('https://example.com/confirm-email?token=')

      expect(pb.collection('contacts').update).toHaveBeenCalledWith(
        'c1',
        expect.objectContaining({
          emailStatus: 'pending',
          confirmationToken: expect.any(String),
          reminderCount: 0
        })
      )
    })

    it('should log consent action', async () => {
      pb.collection('contacts').getOne.mockResolvedValue({
        id: 'c1',
        email: 'test@example.com'
      })

      await service.initiateDoubleOptIn('c1', 'https://example.com')

      expect(pb.collection('consent_audit_logs').create).toHaveBeenCalledWith(
        expect.objectContaining({
          contactId: 'c1',
          action: 'granted',
          source: 'double_opt_in'
        })
      )
    })

    it('should return error on failure', async () => {
      pb.collection('contacts').getOne.mockRejectedValue(new Error('Not found'))

      const result = await service.initiateDoubleOptIn('c1', 'https://example.com')

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('confirmEmail', () => {
    it('should confirm email with valid token', async () => {
      const futureDate = new Date(Date.now() + 1000 * 60 * 60)
      pb.collection('contacts').getList.mockResolvedValue({
        items: [
          {
            id: 'c1',
            email: 'test@example.com',
            confirmationToken: 'valid-token',
            confirmationExpiresAt: futureDate.toISOString()
          }
        ]
      })

      const result = await service.confirmEmail('valid-token', '127.0.0.1')

      expect(result.success).toBe(true)
      expect(result.contactId).toBe('c1')
      expect(result.email).toBe('test@example.com')

      expect(pb.collection('contacts').update).toHaveBeenCalledWith(
        'c1',
        expect.objectContaining({
          emailStatus: 'confirmed',
          confirmationToken: null,
          confirmationIpAddress: '127.0.0.1'
        })
      )
    })

    it('should reject invalid token', async () => {
      pb.collection('contacts').getList.mockResolvedValue({ items: [] })

      const result = await service.confirmEmail('invalid-token')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid confirmation token')
    })

    it('should reject expired token', async () => {
      const pastDate = new Date(Date.now() - 1000 * 60 * 60)
      pb.collection('contacts').getList.mockResolvedValue({
        items: [
          {
            id: 'c1',
            email: 'test@example.com',
            confirmationToken: 'expired-token',
            confirmationExpiresAt: pastDate.toISOString()
          }
        ]
      })

      const result = await service.confirmEmail('expired-token')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Confirmation token has expired')
    })
  })

  describe('sendConfirmationReminder', () => {
    it('should send reminder for pending contact', async () => {
      const futureDate = new Date(Date.now() + 1000 * 60 * 60)
      pb.collection('contacts').getOne.mockResolvedValue({
        id: 'c1',
        emailStatus: 'pending',
        confirmationToken: 'existing-token',
        confirmationExpiresAt: futureDate.toISOString(),
        reminderCount: 0
      })

      const result = await service.sendConfirmationReminder('c1', 'https://example.com')

      expect(result.success).toBe(true)
      expect(pb.collection('contacts').update).toHaveBeenCalledWith(
        'c1',
        expect.objectContaining({
          reminderCount: 1,
          lastReminderSentAt: expect.any(String)
        })
      )
    })

    it('should reject non-pending contact', async () => {
      pb.collection('contacts').getOne.mockResolvedValue({
        id: 'c1',
        emailStatus: 'confirmed',
        reminderCount: 0
      })

      const result = await service.sendConfirmationReminder('c1', 'https://example.com')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Contact is not pending confirmation')
    })

    it('should generate new token if expired', async () => {
      const pastDate = new Date(Date.now() - 1000 * 60 * 60)
      pb.collection('contacts').getOne.mockResolvedValue({
        id: 'c1',
        emailStatus: 'pending',
        confirmationToken: 'old-token',
        confirmationExpiresAt: pastDate.toISOString(),
        reminderCount: 0
      })

      const result = await service.sendConfirmationReminder('c1', 'https://example.com')

      expect(result.success).toBe(true)
      expect(result.confirmationToken).not.toBe('old-token')
    })
  })

  describe('getPendingConfirmations', () => {
    it('should return pending contacts', async () => {
      pb.collection('contacts').getFullList.mockResolvedValue([
        {
          id: 'c1',
          email: 'test1@example.com',
          created: now.toISOString(),
          reminderCount: 0
        },
        {
          id: 'c2',
          email: 'test2@example.com',
          created: now.toISOString(),
          reminderCount: 1
        }
      ])

      const result = await service.getPendingConfirmations()

      expect(result).toHaveLength(2)
      expect(result[0].contactId).toBe('c1')
      expect(result[1].reminderCount).toBe(1)
    })

    it('should filter by event', async () => {
      await service.getPendingConfirmations('evt-1')

      expect(pb.collection('contacts').getFullList).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: expect.stringContaining('evt-1')
        })
      )
    })
  })

  describe('logConsentAction', () => {
    it('should create audit log entry', async () => {
      const result = await service.logConsentAction({
        contactId: 'c1',
        action: 'granted',
        consentType: 'marketing_email',
        source: 'form',
        ipAddress: '127.0.0.1'
      })

      expect(result.id).toBeDefined()
      expect(pb.collection('consent_audit_logs').create).toHaveBeenCalledWith(
        expect.objectContaining({
          contactId: 'c1',
          action: 'granted',
          consentType: 'marketing_email',
          source: 'form'
        })
      )
    })
  })

  describe('getAuditLog', () => {
    it('should return audit logs for contact', async () => {
      pb.collection('consent_audit_logs').getList.mockResolvedValue({
        items: [
          {
            id: 'log-1',
            contactId: 'c1',
            action: 'granted',
            source: 'form',
            created: now.toISOString()
          }
        ]
      })

      const result = await service.getAuditLog('c1')

      expect(result).toHaveLength(1)
      expect(result[0].action).toBe('granted')
    })
  })

  describe('getPreferences', () => {
    it('should return existing preferences', async () => {
      pb.collection('communication_preferences').getList.mockResolvedValue({
        items: [
          {
            id: 'pref-1',
            contactId: 'c1',
            newsletter: true,
            eventUpdates: true,
            partnerCommunications: false,
            frequency: 'weekly',
            created: now.toISOString(),
            updated: now.toISOString()
          }
        ]
      })

      const result = await service.getPreferences('c1')

      expect(result).not.toBeNull()
      expect(result?.newsletter).toBe(true)
      expect(result?.frequency).toBe('weekly')
    })

    it('should create default preferences if none exist', async () => {
      pb.collection('communication_preferences').getList.mockResolvedValue({ items: [] })

      const result = await service.getPreferences('c1')

      expect(result).not.toBeNull()
      expect(pb.collection('communication_preferences').create).toHaveBeenCalled()
    })
  })

  describe('updatePreferences', () => {
    it('should update preferences and log action', async () => {
      pb.collection('communication_preferences').getList.mockResolvedValue({
        items: [
          {
            id: 'pref-1',
            contactId: 'c1',
            newsletter: false,
            created: now.toISOString(),
            updated: now.toISOString()
          }
        ]
      })

      await service.updatePreferences(
        'c1',
        { newsletter: true, frequency: 'daily' },
        'preference_center',
        '127.0.0.1'
      )

      expect(pb.collection('communication_preferences').update).toHaveBeenCalledWith(
        'pref-1',
        expect.objectContaining({
          newsletter: true,
          frequency: 'daily'
        })
      )

      expect(pb.collection('consent_audit_logs').create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'preferences_updated',
          source: 'preference_center'
        })
      )
    })
  })

  describe('exportContactData', () => {
    it('should export all contact data', async () => {
      pb.collection('contacts').getOne.mockResolvedValue({
        id: 'c1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        created: now.toISOString(),
        updated: now.toISOString()
      })

      pb.collection('consents').getFullList.mockResolvedValue([
        { type: 'marketing_email', status: 'granted', source: 'form' }
      ])

      pb.collection('contact_activities').getFullList.mockResolvedValue([])
      pb.collection('consent_audit_logs').getFullList.mockResolvedValue([])

      const result = await service.exportContactData('c1')

      expect(result.contact.email).toBe('test@example.com')
      expect(result.consents).toHaveLength(1)
      expect(result.exportedAt).toBeDefined()

      // Should log export action
      expect(pb.collection('consent_audit_logs').create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'data_exported',
          source: 'gdpr_request'
        })
      )
    })
  })

  describe('deleteContactData', () => {
    it('should delete contact and related data', async () => {
      pb.collection('consents').getFullList.mockResolvedValue([{ id: 'consent-1' }])
      pb.collection('contact_activities').getFullList.mockResolvedValue([{ id: 'activity-1' }])
      pb.collection('communication_preferences').getFullList.mockResolvedValue([{ id: 'pref-1' }])
      pb.collection('consent_audit_logs').getFullList.mockResolvedValue([{ id: 'log-1' }])

      const result = await service.deleteContactData('c1', '127.0.0.1')

      expect(result.success).toBe(true)
      expect(result.deletedRecords.contact).toBe(true)
      expect(result.deletedRecords.consents).toBe(1)
      expect(result.deletedRecords.activities).toBe(1)
      expect(result.deletedRecords.preferences).toBe(1)

      expect(pb.collection('contacts').delete).toHaveBeenCalledWith('c1')
    })

    it('should anonymize audit logs instead of deleting', async () => {
      pb.collection('consents').getFullList.mockResolvedValue([])
      pb.collection('contact_activities').getFullList.mockResolvedValue([])
      pb.collection('communication_preferences').getFullList.mockResolvedValue([])
      pb.collection('consent_audit_logs').getFullList.mockResolvedValue([{ id: 'log-1' }])

      await service.deleteContactData('c1')

      expect(pb.collection('consent_audit_logs').update).toHaveBeenCalledWith(
        'log-1',
        expect.objectContaining({
          contactId: expect.stringContaining('deleted_'),
          metadata: { deleted: true }
        })
      )
    })
  })

  describe('unsubscribe', () => {
    it('should unsubscribe contact', async () => {
      pb.collection('consents').getFullList.mockResolvedValue([{ id: 'consent-1' }])

      const result = await service.unsubscribe('c1', 'unsubscribe_link', '127.0.0.1')

      expect(result.success).toBe(true)

      expect(pb.collection('contacts').update).toHaveBeenCalledWith('c1', {
        emailStatus: 'unsubscribed'
      })

      expect(pb.collection('consents').update).toHaveBeenCalledWith(
        'consent-1',
        expect.objectContaining({
          status: 'withdrawn'
        })
      )
    })
  })

  describe('unsubscribeByToken', () => {
    it('should unsubscribe by token', async () => {
      pb.collection('contacts').getList.mockResolvedValue({
        items: [{ id: 'c1', unsubscribeToken: 'unsub-token' }]
      })
      pb.collection('consents').getFullList.mockResolvedValue([])

      const result = await service.unsubscribeByToken('unsub-token')

      expect(result.success).toBe(true)
    })

    it('should reject invalid token', async () => {
      pb.collection('contacts').getList.mockResolvedValue({ items: [] })

      const result = await service.unsubscribeByToken('invalid-token')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid unsubscribe token')
    })
  })

  describe('createRetentionPolicy', () => {
    it('should create retention policy', async () => {
      const result = await service.createRetentionPolicy({
        dataType: 'contact',
        retentionDays: 365,
        warningDays: 30,
        autoDelete: false
      })

      expect(result.dataType).toBe('contact')
      expect(pb.collection('data_retention_policies').create).toHaveBeenCalled()
    })
  })

  describe('getRetentionPolicies', () => {
    it('should return retention policies', async () => {
      pb.collection('data_retention_policies').getFullList.mockResolvedValue([
        {
          id: 'policy-1',
          dataType: 'contact',
          retentionDays: 365,
          created: now.toISOString(),
          updated: now.toISOString()
        }
      ])

      const result = await service.getRetentionPolicies()

      expect(result).toHaveLength(1)
      expect(result[0].dataType).toBe('contact')
    })
  })
})
