import type { NavItem } from '$lib/components/shared'

export type { NavItem }

/**
 * Generate sponsoring navigation items
 */
export const getSponsoringNavItems = (editionSlug: string): NavItem[] => [
  { href: `/admin/sponsoring/${editionSlug}`, label: 'Dashboard' },
  { href: `/admin/sponsoring/${editionSlug}/packages`, label: 'Packages' },
  { href: `/admin/sponsoring/${editionSlug}/sponsors`, label: 'Sponsors' },
  { href: `/admin/sponsoring/${editionSlug}/inquiries`, label: 'Inquiries' },
  { href: `/admin/sponsoring/${editionSlug}/deliverables`, label: 'Deliverables' },
  { href: `/admin/sponsoring/${editionSlug}/messages`, label: 'Messages' },
  { href: `/admin/sponsoring/${editionSlug}/assets`, label: 'Assets' }
]

/**
 * Generate budget navigation items
 */
export const getBudgetNavItems = (editionSlug: string): NavItem[] => [
  { href: `/admin/budget/${editionSlug}`, label: 'Dashboard' },
  { href: `/admin/budget/${editionSlug}/checklist`, label: 'Checklist' },
  { href: `/admin/budget/${editionSlug}/profitability`, label: 'Profitability' },
  { href: `/admin/budget/${editionSlug}/quotes`, label: 'Quotes' },
  { href: `/admin/budget/${editionSlug}/invoices`, label: 'Invoices' },
  { href: `/admin/budget/${editionSlug}/reimbursements`, label: 'Reimbursements' },
  { href: `/admin/budget/${editionSlug}/journal`, label: 'Journal' },
  { href: `/admin/budget/${editionSlug}/settings`, label: 'Settings' }
]

/**
 * Generate billing navigation items
 */
export const getBillingNavItems = (editionSlug: string): NavItem[] => [
  { href: `/admin/billing/${editionSlug}`, label: 'Dashboard' },
  { href: `/admin/billing/${editionSlug}/participants`, label: 'Participants' },
  { href: `/admin/billing/${editionSlug}/checkin`, label: 'Check-in' },
  { href: `/admin/billing/${editionSlug}/design`, label: 'Design' },
  { href: `/admin/billing/${editionSlug}/settings`, label: 'Settings' }
]

/**
 * Generate CRM navigation items
 */
export const getCrmNavItems = (eventSlug: string): NavItem[] => [
  { href: `/admin/crm/${eventSlug}`, label: 'Contacts' },
  { href: `/admin/crm/${eventSlug}/segments`, label: 'Segments' },
  { href: `/admin/crm/${eventSlug}/import`, label: 'Import' }
]

/**
 * Generate emails navigation items
 */
export const getEmailsNavItems = (eventSlug: string): NavItem[] => [
  { href: `/admin/emails/${eventSlug}`, label: 'Campaigns' },
  { href: `/admin/emails/${eventSlug}/templates`, label: 'Templates' }
]

/**
 * Generate reporting navigation items
 */
export const getReportingNavItems = (editionSlug: string): NavItem[] => [
  { href: `/admin/reporting/${editionSlug}`, label: 'Dashboard' },
  { href: `/admin/reporting/${editionSlug}/alerts`, label: 'Alerts' },
  { href: `/admin/reporting/${editionSlug}/reports`, label: 'Reports' }
]

/**
 * Generate feedback navigation items
 */
export const getFeedbackNavItems = (editionSlug: string): NavItem[] => [
  { href: `/admin/feedback/${editionSlug}`, label: 'Sessions' },
  { href: `/admin/feedback/${editionSlug}/event`, label: 'Event' }
]

/**
 * Generate planning navigation items
 */
export const getPlanningNavItems = (editionSlug: string): NavItem[] => [
  { href: `/admin/planning/${editionSlug}`, label: 'Schedule' },
  { href: `/admin/planning/${editionSlug}/sessions`, label: 'Sessions' },
  { href: `/admin/planning/${editionSlug}/rooms`, label: 'Rooms' },
  { href: `/admin/planning/${editionSlug}/tracks`, label: 'Tracks' },
  { href: `/admin/planning/${editionSlug}/slots`, label: 'Slots' },
  { href: `/admin/planning/${editionSlug}/staff`, label: 'Staff' },
  { href: `/admin/planning/${editionSlug}/settings`, label: 'Settings' }
]

/**
 * Generate event settings navigation items
 */
export const getEventSettingsNavItems = (eventSlug: string): NavItem[] => [
  { href: `/admin/events/${eventSlug}/settings`, label: 'General' },
  { href: `/admin/events/${eventSlug}/settings/branding`, label: 'Branding' },
  { href: `/admin/events/${eventSlug}/settings/social`, label: 'Social & Localization' },
  { href: `/admin/events/${eventSlug}/settings/policies`, label: 'Policies' }
]

/**
 * Generate organization settings navigation items
 */
export const getOrgSettingsNavItems = (orgSlug: string): NavItem[] => [
  { href: `/admin/organizations/${orgSlug}/settings`, label: 'General' },
  { href: `/admin/organizations/${orgSlug}/settings/branding`, label: 'Branding' },
  { href: `/admin/organizations/${orgSlug}/settings/social`, label: 'Social & Localization' },
  { href: `/admin/organizations/${orgSlug}/settings/legal`, label: 'Legal & Billing' },
  { href: `/admin/organizations/${orgSlug}/settings/team`, label: 'Team' },
  { href: `/admin/organizations/${orgSlug}/audit-log`, label: 'Audit Log' }
]
