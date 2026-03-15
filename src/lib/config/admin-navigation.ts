import type { NavItem } from '$lib/components/shared'
import * as m from '$lib/paraglide/messages'

export type { NavItem }

/**
 * Generate sponsoring navigation items
 */
export const getSponsoringNavItems = (editionSlug: string): NavItem[] => [
  { href: `/admin/sponsoring/${editionSlug}`, label: () => m.sponsoring_nav_dashboard() },
  { href: `/admin/sponsoring/${editionSlug}/packages`, label: () => m.sponsoring_nav_packages() },
  { href: `/admin/sponsoring/${editionSlug}/sponsors`, label: () => m.sponsoring_nav_sponsors() },
  { href: `/admin/sponsoring/${editionSlug}/inquiries`, label: () => m.sponsoring_nav_inquiries() },
  {
    href: `/admin/sponsoring/${editionSlug}/deliverables`,
    label: () => m.sponsoring_nav_deliverables()
  },
  { href: `/admin/sponsoring/${editionSlug}/messages`, label: () => m.sponsoring_nav_messages() },
  { href: `/admin/sponsoring/${editionSlug}/assets`, label: () => m.sponsoring_nav_assets() }
]

/**
 * Generate budget navigation items
 */
export const getBudgetNavItems = (editionSlug: string): NavItem[] => [
  { href: `/admin/budget/${editionSlug}`, label: () => m.budget_nav_dashboard() },
  { href: `/admin/budget/${editionSlug}/checklist`, label: () => m.budget_nav_checklist() },
  { href: `/admin/budget/${editionSlug}/profitability`, label: () => m.budget_nav_profitability() },
  { href: `/admin/budget/${editionSlug}/quotes`, label: () => m.budget_nav_quotes() },
  { href: `/admin/budget/${editionSlug}/invoices`, label: () => m.budget_nav_invoices() },
  {
    href: `/admin/budget/${editionSlug}/reimbursements`,
    label: () => m.budget_nav_reimbursements()
  },
  { href: `/admin/budget/${editionSlug}/journal`, label: () => m.budget_nav_journal() },
  { href: `/admin/budget/${editionSlug}/settings`, label: () => m.budget_nav_settings() }
]

/**
 * Generate billing navigation items
 */
export const getBillingNavItems = (editionSlug: string): NavItem[] => [
  { href: `/admin/billing/${editionSlug}`, label: () => m.billing_nav_dashboard() },
  { href: `/admin/billing/${editionSlug}/participants`, label: () => m.billing_nav_participants() },
  { href: `/admin/billing/${editionSlug}/checkin`, label: () => m.billing_nav_checkin() },
  { href: `/admin/billing/${editionSlug}/design`, label: () => m.billing_nav_design() },
  { href: `/admin/billing/${editionSlug}/settings`, label: () => m.billing_nav_settings() }
]

/**
 * Generate CRM navigation items
 */
export const getCrmNavItems = (eventSlug: string): NavItem[] => [
  { href: `/admin/crm/${eventSlug}`, label: () => m.crm_nav_contacts() },
  { href: `/admin/crm/${eventSlug}/segments`, label: () => m.crm_nav_segments() },
  { href: `/admin/crm/${eventSlug}/import`, label: () => m.crm_nav_import() }
]

/**
 * Generate emails navigation items
 */
export const getEmailsNavItems = (eventSlug: string): NavItem[] => [
  { href: `/admin/emails/${eventSlug}`, label: () => m.emails_nav_campaigns() },
  { href: `/admin/emails/${eventSlug}/templates`, label: () => m.emails_nav_templates() }
]

/**
 * Generate reporting navigation items
 */
export const getReportingNavItems = (editionSlug: string): NavItem[] => [
  { href: `/admin/reporting/${editionSlug}`, label: () => m.reporting_nav_dashboard() },
  { href: `/admin/reporting/${editionSlug}/alerts`, label: () => m.reporting_nav_alerts() },
  { href: `/admin/reporting/${editionSlug}/reports`, label: () => m.reporting_nav_reports() }
]

/**
 * Generate feedback navigation items
 */
export const getFeedbackNavItems = (editionSlug: string): NavItem[] => [
  { href: `/admin/feedback/${editionSlug}`, label: () => m.feedback_nav_sessions() },
  { href: `/admin/feedback/${editionSlug}/event`, label: () => m.feedback_nav_event() }
]

/**
 * Generate planning navigation items
 */
export const getPlanningNavItems = (editionSlug: string): NavItem[] => [
  { href: `/admin/planning/${editionSlug}`, label: () => m.planning_nav_schedule() },
  { href: `/admin/planning/${editionSlug}/sessions`, label: () => m.planning_nav_sessions() },
  { href: `/admin/planning/${editionSlug}/rooms`, label: () => m.planning_nav_rooms() },
  { href: `/admin/planning/${editionSlug}/tracks`, label: () => m.planning_nav_tracks() },
  { href: `/admin/planning/${editionSlug}/slots`, label: () => m.planning_nav_slots() },
  { href: `/admin/planning/${editionSlug}/staff`, label: () => m.planning_nav_staff() },
  { href: `/admin/planning/${editionSlug}/settings`, label: () => m.planning_nav_settings() }
]

/**
 * Generate event settings navigation items
 */
export const getEventSettingsNavItems = (eventSlug: string): NavItem[] => [
  {
    href: `/admin/events/${eventSlug}/settings`,
    label: () => m.admin_event_settings_nav_general()
  },
  {
    href: `/admin/events/${eventSlug}/settings/branding`,
    label: () => m.admin_event_settings_nav_branding()
  },
  {
    href: `/admin/events/${eventSlug}/settings/social`,
    label: () => m.admin_event_settings_nav_social()
  },
  {
    href: `/admin/events/${eventSlug}/settings/policies`,
    label: () => m.admin_event_settings_nav_policies()
  }
]

/**
 * Generate admin settings navigation items
 */
export const getAdminSettingsNavItems = (): NavItem[] => [
  { href: '/admin/settings/general', label: () => m.admin_settings_nav_application() },
  { href: '/admin/settings', label: () => m.admin_settings_nav_email_smtp() },
  { href: '/admin/settings/oauth', label: () => m.admin_settings_nav_oauth2() },
  { href: '/admin/settings/payments', label: () => m.admin_settings_nav_payments() },
  { href: '/admin/settings/notifications', label: () => m.admin_settings_nav_notifications() },
  { href: '/admin/settings/s3', label: () => m.admin_settings_nav_s3_storage() },
  { href: '/admin/settings/backups', label: () => m.admin_settings_nav_backups() },
  { href: '/admin/settings/log-retention', label: () => m.admin_settings_nav_log_retention() }
]

/**
 * Generate organization settings navigation items
 */
export const getOrgSettingsNavItems = (orgSlug: string): NavItem[] => [
  {
    href: `/admin/organizations/${orgSlug}/settings`,
    label: () => m.admin_org_settings_nav_general()
  },
  {
    href: `/admin/organizations/${orgSlug}/settings/branding`,
    label: () => m.admin_org_settings_nav_branding()
  },
  {
    href: `/admin/organizations/${orgSlug}/settings/social`,
    label: () => m.admin_org_settings_nav_social()
  },
  {
    href: `/admin/organizations/${orgSlug}/settings/legal`,
    label: () => m.admin_org_settings_nav_legal()
  },
  {
    href: `/admin/organizations/${orgSlug}/settings/team`,
    label: () => m.admin_org_settings_nav_team()
  },
  {
    href: `/admin/organizations/${orgSlug}/audit-log`,
    label: () => m.admin_org_settings_nav_audit_log()
  }
]
