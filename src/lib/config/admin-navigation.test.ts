import { describe, expect, it } from 'vitest'
import {
  getBillingNavItems,
  getBudgetNavItems,
  getCrmNavItems,
  getEmailsNavItems,
  getPlanningNavItems,
  getReportingNavItems,
  getSponsoringNavItems
} from './admin-navigation'

describe('admin-navigation', () => {
  describe('getSponsoringNavItems', () => {
    it('should return navigation items with correct paths', () => {
      const items = getSponsoringNavItems('devfest-2025')
      expect(items).toHaveLength(7)
      expect(items[0]).toEqual({
        href: '/admin/sponsoring/devfest-2025',
        label: 'Dashboard'
      })
      expect(items[1].href).toBe('/admin/sponsoring/devfest-2025/packages')
      expect(items[2].href).toBe('/admin/sponsoring/devfest-2025/sponsors')
      expect(items[3].href).toBe('/admin/sponsoring/devfest-2025/inquiries')
      expect(items[4].href).toBe('/admin/sponsoring/devfest-2025/deliverables')
      expect(items[5].href).toBe('/admin/sponsoring/devfest-2025/messages')
      expect(items[6].href).toBe('/admin/sponsoring/devfest-2025/assets')
    })

    it('should handle special characters in slug', () => {
      const items = getSponsoringNavItems('event-name-2025')
      expect(items[0].href).toContain('event-name-2025')
    })
  })

  describe('getBudgetNavItems', () => {
    it('should return navigation items with correct paths', () => {
      const items = getBudgetNavItems('devfest-2025')
      expect(items).toHaveLength(8)
      expect(items[0]).toEqual({
        href: '/admin/budget/devfest-2025',
        label: 'Dashboard'
      })
      expect(items[1].href).toBe('/admin/budget/devfest-2025/checklist')
      expect(items[2].href).toBe('/admin/budget/devfest-2025/profitability')
      expect(items[3].href).toBe('/admin/budget/devfest-2025/quotes')
      expect(items[4].href).toBe('/admin/budget/devfest-2025/invoices')
      expect(items[5].href).toBe('/admin/budget/devfest-2025/reimbursements')
      expect(items[6].href).toBe('/admin/budget/devfest-2025/journal')
      expect(items[7].href).toBe('/admin/budget/devfest-2025/settings')
    })
  })

  describe('getBillingNavItems', () => {
    it('should return navigation items with correct paths', () => {
      const items = getBillingNavItems('devfest-2025')
      expect(items).toHaveLength(5)
      expect(items[0]).toEqual({
        href: '/admin/billing/devfest-2025',
        label: 'Dashboard'
      })
      expect(items[1].href).toBe('/admin/billing/devfest-2025/participants')
      expect(items[2].href).toBe('/admin/billing/devfest-2025/checkin')
      expect(items[3].href).toBe('/admin/billing/devfest-2025/design')
      expect(items[4].href).toBe('/admin/billing/devfest-2025/settings')
    })
  })

  describe('getCrmNavItems', () => {
    it('should return navigation items with correct paths', () => {
      const items = getCrmNavItems('devfest')
      expect(items).toHaveLength(3)
      expect(items[0]).toEqual({
        href: '/admin/crm/devfest',
        label: 'Contacts'
      })
      expect(items[1].href).toBe('/admin/crm/devfest/segments')
      expect(items[2].href).toBe('/admin/crm/devfest/import')
    })
  })

  describe('getEmailsNavItems', () => {
    it('should return navigation items with correct paths', () => {
      const items = getEmailsNavItems('devfest')
      expect(items).toHaveLength(2)
      expect(items[0]).toEqual({
        href: '/admin/emails/devfest',
        label: 'Campaigns'
      })
      expect(items[1].href).toBe('/admin/emails/devfest/templates')
    })
  })

  describe('getReportingNavItems', () => {
    it('should return navigation items with correct paths', () => {
      const items = getReportingNavItems('devfest-2025')
      expect(items).toHaveLength(3)
      expect(items[0]).toEqual({
        href: '/admin/reporting/devfest-2025',
        label: 'Dashboard'
      })
      expect(items[1].href).toBe('/admin/reporting/devfest-2025/alerts')
      expect(items[2].href).toBe('/admin/reporting/devfest-2025/reports')
    })
  })

  describe('getPlanningNavItems', () => {
    it('should return navigation items with correct paths', () => {
      const items = getPlanningNavItems('devfest-2025')
      expect(items).toHaveLength(7)
      expect(items[0]).toEqual({
        href: '/admin/planning/devfest-2025',
        label: 'Schedule'
      })
      expect(items[1].href).toBe('/admin/planning/devfest-2025/sessions')
      expect(items[2].href).toBe('/admin/planning/devfest-2025/rooms')
      expect(items[3].href).toBe('/admin/planning/devfest-2025/tracks')
      expect(items[4].href).toBe('/admin/planning/devfest-2025/slots')
      expect(items[5].href).toBe('/admin/planning/devfest-2025/staff')
      expect(items[6].href).toBe('/admin/planning/devfest-2025/settings')
    })
  })
})
