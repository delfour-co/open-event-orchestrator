/**
 * Permission helpers for role-based access control
 *
 * Roles hierarchy:
 * - super_admin: Full access to everything (initial setup admin)
 * - admin: Full access to everything
 * - organizer: Can manage events, editions, CFP settings, and change talk statuses
 * - reviewer: Can only view submissions, add reviews and comments
 */

export type OrgRole = 'super_admin' | 'admin' | 'organizer' | 'reviewer'

export const ADMIN_ROLES: OrgRole[] = ['super_admin', 'admin', 'organizer', 'reviewer']

/**
 * Check if user can access settings pages (organization, event, edition, CFP settings)
 */
export function canAccessSettings(role: string | undefined): boolean {
  return role === 'super_admin' || role === 'admin' || role === 'organizer'
}

/**
 * Check if user can manage organizations (create, update, delete)
 */
export function canManageOrganizations(role: string | undefined): boolean {
  return role === 'super_admin' || role === 'admin' || role === 'organizer'
}

/**
 * Check if user can manage events (create, update, delete)
 */
export function canManageEvents(role: string | undefined): boolean {
  return role === 'super_admin' || role === 'admin' || role === 'organizer'
}

/**
 * Check if user can change talk status (accept, reject, etc.)
 */
export function canChangeTalkStatus(role: string | undefined): boolean {
  return role === 'super_admin' || role === 'admin' || role === 'organizer'
}

/**
 * Check if user can delete talks
 */
export function canDeleteTalks(role: string | undefined): boolean {
  return role === 'super_admin' || role === 'admin' || role === 'organizer'
}

/**
 * Check if user can export data
 */
export function canExportData(role: string | undefined): boolean {
  return role === 'super_admin' || role === 'admin' || role === 'organizer'
}

/**
 * Check if user can manage CFP settings (categories, formats, dates)
 */
export function canManageCfpSettings(role: string | undefined): boolean {
  return role === 'super_admin' || role === 'admin' || role === 'organizer'
}

/**
 * Check if user can submit reviews
 */
export function canSubmitReviews(role: string | undefined): boolean {
  return ADMIN_ROLES.includes(role as OrgRole)
}

/**
 * Check if user can add comments
 */
export function canAddComments(role: string | undefined): boolean {
  return ADMIN_ROLES.includes(role as OrgRole)
}

/**
 * Check if user can manage billing (ticket types, orders, check-in)
 */
export function canManageBilling(role: string | undefined): boolean {
  return role === 'super_admin' || role === 'admin' || role === 'organizer'
}

/**
 * Check if user can manage CRM (contacts, segments, campaigns)
 */
export function canManageCRM(role: string | undefined): boolean {
  return role === 'super_admin' || role === 'admin' || role === 'organizer'
}

/**
 * Check if user is a reviewer only (no admin/organizer privileges)
 */
export function isReviewerOnly(role: string | undefined): boolean {
  return role === 'reviewer'
}
