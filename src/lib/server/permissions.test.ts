import { describe, expect, it } from 'vitest'
import {
  ADMIN_ROLES,
  canAccessSettings,
  canAddComments,
  canChangeTalkStatus,
  canDeleteTalks,
  canExportData,
  canManageBilling,
  canManageCRM,
  canManageCfpSettings,
  canManageEvents,
  canManageOrganizations,
  canSubmitReviews,
  isReviewerOnly
} from './permissions'

describe('Permissions', () => {
  describe('ADMIN_ROLES', () => {
    it('should include all admin roles', () => {
      expect(ADMIN_ROLES).toContain('super_admin')
      expect(ADMIN_ROLES).toContain('admin')
      expect(ADMIN_ROLES).toContain('organizer')
      expect(ADMIN_ROLES).toContain('reviewer')
    })

    it('should have exactly 4 roles', () => {
      expect(ADMIN_ROLES).toHaveLength(4)
    })
  })

  describe('canAccessSettings', () => {
    it('should allow super_admin', () => {
      expect(canAccessSettings('super_admin')).toBe(true)
    })

    it('should allow admin', () => {
      expect(canAccessSettings('admin')).toBe(true)
    })

    it('should allow organizer', () => {
      expect(canAccessSettings('organizer')).toBe(true)
    })

    it('should not allow reviewer', () => {
      expect(canAccessSettings('reviewer')).toBe(false)
    })

    it('should not allow undefined role', () => {
      expect(canAccessSettings(undefined)).toBe(false)
    })

    it('should not allow unknown role', () => {
      expect(canAccessSettings('unknown')).toBe(false)
    })
  })

  describe('canManageOrganizations', () => {
    it('should allow super_admin', () => {
      expect(canManageOrganizations('super_admin')).toBe(true)
    })

    it('should allow admin', () => {
      expect(canManageOrganizations('admin')).toBe(true)
    })

    it('should allow organizer', () => {
      expect(canManageOrganizations('organizer')).toBe(true)
    })

    it('should not allow reviewer', () => {
      expect(canManageOrganizations('reviewer')).toBe(false)
    })

    it('should not allow undefined role', () => {
      expect(canManageOrganizations(undefined)).toBe(false)
    })
  })

  describe('canManageEvents', () => {
    it('should allow super_admin', () => {
      expect(canManageEvents('super_admin')).toBe(true)
    })

    it('should allow admin', () => {
      expect(canManageEvents('admin')).toBe(true)
    })

    it('should allow organizer', () => {
      expect(canManageEvents('organizer')).toBe(true)
    })

    it('should not allow reviewer', () => {
      expect(canManageEvents('reviewer')).toBe(false)
    })

    it('should not allow undefined role', () => {
      expect(canManageEvents(undefined)).toBe(false)
    })
  })

  describe('canChangeTalkStatus', () => {
    it('should allow super_admin', () => {
      expect(canChangeTalkStatus('super_admin')).toBe(true)
    })

    it('should allow admin', () => {
      expect(canChangeTalkStatus('admin')).toBe(true)
    })

    it('should allow organizer', () => {
      expect(canChangeTalkStatus('organizer')).toBe(true)
    })

    it('should not allow reviewer', () => {
      expect(canChangeTalkStatus('reviewer')).toBe(false)
    })

    it('should not allow undefined role', () => {
      expect(canChangeTalkStatus(undefined)).toBe(false)
    })
  })

  describe('canDeleteTalks', () => {
    it('should allow super_admin', () => {
      expect(canDeleteTalks('super_admin')).toBe(true)
    })

    it('should allow admin', () => {
      expect(canDeleteTalks('admin')).toBe(true)
    })

    it('should allow organizer', () => {
      expect(canDeleteTalks('organizer')).toBe(true)
    })

    it('should not allow reviewer', () => {
      expect(canDeleteTalks('reviewer')).toBe(false)
    })

    it('should not allow undefined role', () => {
      expect(canDeleteTalks(undefined)).toBe(false)
    })
  })

  describe('canExportData', () => {
    it('should allow super_admin', () => {
      expect(canExportData('super_admin')).toBe(true)
    })

    it('should allow admin', () => {
      expect(canExportData('admin')).toBe(true)
    })

    it('should allow organizer', () => {
      expect(canExportData('organizer')).toBe(true)
    })

    it('should not allow reviewer', () => {
      expect(canExportData('reviewer')).toBe(false)
    })

    it('should not allow undefined role', () => {
      expect(canExportData(undefined)).toBe(false)
    })
  })

  describe('canManageCfpSettings', () => {
    it('should allow super_admin', () => {
      expect(canManageCfpSettings('super_admin')).toBe(true)
    })

    it('should allow admin', () => {
      expect(canManageCfpSettings('admin')).toBe(true)
    })

    it('should allow organizer', () => {
      expect(canManageCfpSettings('organizer')).toBe(true)
    })

    it('should not allow reviewer', () => {
      expect(canManageCfpSettings('reviewer')).toBe(false)
    })

    it('should not allow undefined role', () => {
      expect(canManageCfpSettings(undefined)).toBe(false)
    })
  })

  describe('canSubmitReviews', () => {
    it('should allow super_admin', () => {
      expect(canSubmitReviews('super_admin')).toBe(true)
    })

    it('should allow admin', () => {
      expect(canSubmitReviews('admin')).toBe(true)
    })

    it('should allow organizer', () => {
      expect(canSubmitReviews('organizer')).toBe(true)
    })

    it('should allow reviewer', () => {
      expect(canSubmitReviews('reviewer')).toBe(true)
    })

    it('should not allow undefined role', () => {
      expect(canSubmitReviews(undefined)).toBe(false)
    })

    it('should not allow unknown role', () => {
      expect(canSubmitReviews('unknown')).toBe(false)
    })
  })

  describe('canAddComments', () => {
    it('should allow super_admin', () => {
      expect(canAddComments('super_admin')).toBe(true)
    })

    it('should allow admin', () => {
      expect(canAddComments('admin')).toBe(true)
    })

    it('should allow organizer', () => {
      expect(canAddComments('organizer')).toBe(true)
    })

    it('should allow reviewer', () => {
      expect(canAddComments('reviewer')).toBe(true)
    })

    it('should not allow undefined role', () => {
      expect(canAddComments(undefined)).toBe(false)
    })

    it('should not allow unknown role', () => {
      expect(canAddComments('unknown')).toBe(false)
    })
  })

  describe('canManageBilling', () => {
    it('should allow super_admin', () => {
      expect(canManageBilling('super_admin')).toBe(true)
    })

    it('should allow admin', () => {
      expect(canManageBilling('admin')).toBe(true)
    })

    it('should allow organizer', () => {
      expect(canManageBilling('organizer')).toBe(true)
    })

    it('should not allow reviewer', () => {
      expect(canManageBilling('reviewer')).toBe(false)
    })

    it('should not allow undefined role', () => {
      expect(canManageBilling(undefined)).toBe(false)
    })
  })

  describe('canManageCRM', () => {
    it('should allow super_admin', () => {
      expect(canManageCRM('super_admin')).toBe(true)
    })

    it('should allow admin', () => {
      expect(canManageCRM('admin')).toBe(true)
    })

    it('should allow organizer', () => {
      expect(canManageCRM('organizer')).toBe(true)
    })

    it('should not allow reviewer', () => {
      expect(canManageCRM('reviewer')).toBe(false)
    })

    it('should not allow undefined role', () => {
      expect(canManageCRM(undefined)).toBe(false)
    })
  })

  describe('isReviewerOnly', () => {
    it('should return true for reviewer', () => {
      expect(isReviewerOnly('reviewer')).toBe(true)
    })

    it('should return false for super_admin', () => {
      expect(isReviewerOnly('super_admin')).toBe(false)
    })

    it('should return false for admin', () => {
      expect(isReviewerOnly('admin')).toBe(false)
    })

    it('should return false for organizer', () => {
      expect(isReviewerOnly('organizer')).toBe(false)
    })

    it('should return false for undefined role', () => {
      expect(isReviewerOnly(undefined)).toBe(false)
    })

    it('should return false for unknown role', () => {
      expect(isReviewerOnly('unknown')).toBe(false)
    })
  })

  describe('role hierarchy consistency', () => {
    const roles = ['super_admin', 'admin', 'organizer', 'reviewer'] as const

    it('super_admin should have all permissions', () => {
      expect(canAccessSettings('super_admin')).toBe(true)
      expect(canManageOrganizations('super_admin')).toBe(true)
      expect(canManageEvents('super_admin')).toBe(true)
      expect(canChangeTalkStatus('super_admin')).toBe(true)
      expect(canDeleteTalks('super_admin')).toBe(true)
      expect(canExportData('super_admin')).toBe(true)
      expect(canManageCfpSettings('super_admin')).toBe(true)
      expect(canSubmitReviews('super_admin')).toBe(true)
      expect(canAddComments('super_admin')).toBe(true)
      expect(canManageBilling('super_admin')).toBe(true)
      expect(canManageCRM('super_admin')).toBe(true)
    })

    it('admin should have all permissions', () => {
      expect(canAccessSettings('admin')).toBe(true)
      expect(canManageOrganizations('admin')).toBe(true)
      expect(canManageEvents('admin')).toBe(true)
      expect(canChangeTalkStatus('admin')).toBe(true)
      expect(canDeleteTalks('admin')).toBe(true)
      expect(canExportData('admin')).toBe(true)
      expect(canManageCfpSettings('admin')).toBe(true)
      expect(canSubmitReviews('admin')).toBe(true)
      expect(canAddComments('admin')).toBe(true)
      expect(canManageBilling('admin')).toBe(true)
      expect(canManageCRM('admin')).toBe(true)
    })

    it('organizer should have management permissions', () => {
      expect(canAccessSettings('organizer')).toBe(true)
      expect(canManageOrganizations('organizer')).toBe(true)
      expect(canManageEvents('organizer')).toBe(true)
      expect(canChangeTalkStatus('organizer')).toBe(true)
      expect(canDeleteTalks('organizer')).toBe(true)
      expect(canExportData('organizer')).toBe(true)
      expect(canManageCfpSettings('organizer')).toBe(true)
      expect(canSubmitReviews('organizer')).toBe(true)
      expect(canAddComments('organizer')).toBe(true)
      expect(canManageBilling('organizer')).toBe(true)
      expect(canManageCRM('organizer')).toBe(true)
    })

    it('reviewer should only have review and comment permissions', () => {
      expect(canAccessSettings('reviewer')).toBe(false)
      expect(canManageOrganizations('reviewer')).toBe(false)
      expect(canManageEvents('reviewer')).toBe(false)
      expect(canChangeTalkStatus('reviewer')).toBe(false)
      expect(canDeleteTalks('reviewer')).toBe(false)
      expect(canExportData('reviewer')).toBe(false)
      expect(canManageCfpSettings('reviewer')).toBe(false)
      expect(canSubmitReviews('reviewer')).toBe(true)
      expect(canAddComments('reviewer')).toBe(true)
      expect(canManageBilling('reviewer')).toBe(false)
      expect(canManageCRM('reviewer')).toBe(false)
    })
  })
})
