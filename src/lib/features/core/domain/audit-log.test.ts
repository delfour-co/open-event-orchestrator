import { describe, expect, it } from 'vitest'
import {
  AUDIT_RETENTION_DAYS,
  type AuditAction,
  auditLogSchema,
  getAuditActionColor,
  getAuditActionLabel
} from './audit-log'

describe('Audit Log Domain', () => {
  describe('AUDIT_RETENTION_DAYS', () => {
    it('should equal 90', () => {
      expect(AUDIT_RETENTION_DAYS).toBe(90)
    })
  })

  describe('getAuditActionLabel', () => {
    const expectedLabels: Record<AuditAction, string> = {
      login: 'Login',
      logout: 'Logout',
      password_change: 'Password Changed',
      profile_update: 'Profile Updated',
      '2fa_enable': '2FA Enabled',
      '2fa_disable': '2FA Disabled',
      org_create: 'Organization Created',
      org_update: 'Organization Updated',
      org_delete: 'Organization Deleted',
      member_add: 'Member Added',
      member_remove: 'Member Removed',
      member_role_change: 'Member Role Changed',
      event_create: 'Event Created',
      event_update: 'Event Updated',
      event_delete: 'Event Deleted',
      edition_create: 'Edition Created',
      edition_update: 'Edition Updated',
      edition_delete: 'Edition Deleted',
      settings_change: 'Settings Changed',
      invitation_send: 'Invitation Sent',
      invitation_accept: 'Invitation Accepted'
    }

    for (const [action, label] of Object.entries(expectedLabels)) {
      it(`should return "${label}" for action "${action}"`, () => {
        expect(getAuditActionLabel(action as AuditAction)).toBe(label)
      })
    }
  })

  describe('getAuditActionColor', () => {
    it('should return red for delete actions', () => {
      expect(getAuditActionColor('org_delete')).toBe('red')
      expect(getAuditActionColor('event_delete')).toBe('red')
      expect(getAuditActionColor('edition_delete')).toBe('red')
    })

    it('should return red for member_remove', () => {
      expect(getAuditActionColor('member_remove')).toBe('red')
    })

    it('should return green for create actions', () => {
      expect(getAuditActionColor('org_create')).toBe('green')
      expect(getAuditActionColor('event_create')).toBe('green')
      expect(getAuditActionColor('edition_create')).toBe('green')
    })

    it('should return green for member_add', () => {
      expect(getAuditActionColor('member_add')).toBe('green')
    })

    it('should return green for invitation_accept', () => {
      expect(getAuditActionColor('invitation_accept')).toBe('green')
    })

    it('should return blue for login and logout', () => {
      expect(getAuditActionColor('login')).toBe('blue')
      expect(getAuditActionColor('logout')).toBe('blue')
    })

    it('should return purple for 2fa actions', () => {
      expect(getAuditActionColor('2fa_enable')).toBe('purple')
      expect(getAuditActionColor('2fa_disable')).toBe('purple')
    })

    it('should return gray for other actions', () => {
      expect(getAuditActionColor('password_change')).toBe('gray')
      expect(getAuditActionColor('profile_update')).toBe('gray')
      expect(getAuditActionColor('settings_change')).toBe('gray')
      expect(getAuditActionColor('invitation_send')).toBe('gray')
      expect(getAuditActionColor('org_update')).toBe('gray')
      expect(getAuditActionColor('member_role_change')).toBe('gray')
    })
  })

  describe('auditLogSchema', () => {
    it('should parse a valid audit log entry', () => {
      const result = auditLogSchema.safeParse({
        id: 'log-1',
        organizationId: 'org-1',
        userId: 'user-1',
        userName: 'Alice',
        action: 'login',
        entityType: 'user',
        entityId: 'user-1',
        entityName: 'Alice',
        details: { ip: '127.0.0.1' },
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        created: new Date()
      })

      expect(result.success).toBe(true)
    })

    it('should parse with only required fields', () => {
      const result = auditLogSchema.safeParse({
        id: 'log-2',
        organizationId: 'org-1',
        action: 'logout',
        created: new Date()
      })

      expect(result.success).toBe(true)
    })

    it('should reject invalid action', () => {
      const result = auditLogSchema.safeParse({
        id: 'log-3',
        organizationId: 'org-1',
        action: 'invalid_action',
        created: new Date()
      })

      expect(result.success).toBe(false)
    })

    it('should reject invalid entity type', () => {
      const result = auditLogSchema.safeParse({
        id: 'log-4',
        organizationId: 'org-1',
        action: 'login',
        entityType: 'invalid_type',
        created: new Date()
      })

      expect(result.success).toBe(false)
    })

    it('should reject missing required fields', () => {
      const result = auditLogSchema.safeParse({
        action: 'login'
      })

      expect(result.success).toBe(false)
    })
  })
})
