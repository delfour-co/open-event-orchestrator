import { env } from '$env/dynamic/public'
import type PocketBase from 'pocketbase'
import type { PBEditionRecord, PBEventRecord, PBOrganizationRecord } from './pb-types'

/**
 * Escape HTML special characters to prevent XSS in email templates
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export interface EmailBranding {
  orgName: string
  logoUrl?: string
  primaryColor: string
  secondaryColor: string
  website?: string
}

/**
 * Default branding used when no organization or event context is available
 * (e.g., auth emails like password reset, verification).
 *
 * The app name is hardcoded here because reading from app_settings would
 * require a PocketBase instance, which is not always available in email
 * utility functions. In the future, a dedicated "app branding" system
 * could replace this default. For org/event-scoped emails, branding is
 * loaded dynamically via getOrgBranding() or getEventBranding().
 */
export const DEFAULT_BRANDING: EmailBranding = {
  orgName: 'Open Event Orchestrator',
  primaryColor: '#2563eb',
  secondaryColor: '#1d4ed8'
}

/**
 * Load organization branding from PocketBase for a given organizationId
 */
export async function getOrgBranding(
  pb: PocketBase,
  organizationId: string
): Promise<EmailBranding> {
  try {
    const org = await pb.collection('organizations').getOne<PBOrganizationRecord>(organizationId)
    const pbUrl = env.PUBLIC_POCKETBASE_URL || 'http://localhost:8090' // Will be resolved by email client
    let logoUrl: string | undefined
    if (org.logo) {
      logoUrl = `${pbUrl}/api/files/organizations/${org.id}/${org.logo}`
    }
    return {
      orgName: org.name || DEFAULT_BRANDING.orgName,
      logoUrl,
      primaryColor: org.primaryColor || DEFAULT_BRANDING.primaryColor,
      secondaryColor: org.secondaryColor || DEFAULT_BRANDING.secondaryColor,
      website: org.website || undefined
    }
  } catch {
    return DEFAULT_BRANDING
  }
}

/**
 * Load event branding from PocketBase, falling back to org branding.
 * Traverses edition -> event -> organization chain.
 */
export async function getEventBranding(pb: PocketBase, editionId: string): Promise<EmailBranding> {
  try {
    const edition = await pb
      .collection('editions')
      .getOne<PBEditionRecord>(editionId, { expand: 'eventId' })
    const event = edition.expand?.eventId

    if (!event) return DEFAULT_BRANDING

    const eventId = event.id
    const organizationId = event.organizationId

    // Get org branding as base
    const orgBranding = await getOrgBranding(pb, organizationId)

    // Get event record for branding overrides
    const eventRecord = await pb.collection('events').getOne<PBEventRecord>(eventId)

    const pbUrl = env.PUBLIC_POCKETBASE_URL || 'http://localhost:8090'
    let logoUrl = orgBranding.logoUrl
    if (eventRecord.logo) {
      logoUrl = `${pbUrl}/api/files/events/${eventId}/${eventRecord.logo}`
    }

    return {
      orgName: eventRecord.name || orgBranding.orgName,
      logoUrl,
      primaryColor: eventRecord.primaryColor || orgBranding.primaryColor,
      secondaryColor: eventRecord.secondaryColor || orgBranding.secondaryColor,
      website: eventRecord.website || orgBranding.website
    }
  } catch {
    return DEFAULT_BRANDING
  }
}

/**
 * Generate branded email header HTML
 */
export function emailHeader(branding: EmailBranding, title: string): string {
  const safeOrgName = escapeHtml(branding.orgName)
  const safeTitle = escapeHtml(title)
  const logoHtml = branding.logoUrl
    ? `<img src="${branding.logoUrl}" alt="${safeOrgName}" style="max-height: 40px; max-width: 180px; margin-bottom: 10px;" /><br/>`
    : ''

  return `<div style="background: ${branding.primaryColor}; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    ${logoHtml}
    <h1 style="color: white; margin: 0; font-size: 24px;">${safeTitle}</h1>
  </div>`
}

/**
 * Generate branded email footer HTML
 */
export function emailFooter(branding: EmailBranding): string {
  const safeOrgName = escapeHtml(branding.orgName)
  const safeWebsite = branding.website ? escapeHtml(branding.website) : ''
  const websiteLink = branding.website
    ? `<p style="margin: 5px 0;"><a href="${branding.website}" style="color: #64748b; text-decoration: underline;">${safeWebsite}</a></p>`
    : ''

  return `<div style="text-align: center; padding: 20px; color: #64748b; font-size: 12px;">
    <p style="margin: 0;">${safeOrgName}</p>
    ${websiteLink}
  </div>`
}

/**
 * Generate a branded action button
 */
export function emailButton(branding: EmailBranding, text: string, href: string): string {
  const safeText = escapeHtml(text)
  return `<div style="text-align: center; margin: 30px 0;">
    <a href="${href}" style="display: inline-block; background: ${branding.primaryColor}; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">${safeText}</a>
  </div>`
}

/**
 * Wrap email content with branded header and footer
 */
export function wrapEmail(branding: EmailBranding, title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  ${emailHeader(branding, title)}
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
    ${bodyHtml}
  </div>
  ${emailFooter(branding)}
</body>
</html>`
}

/**
 * Generate plain text footer
 */
export function textFooter(branding: EmailBranding): string {
  return `---\n${branding.orgName}${branding.website ? `\n${branding.website}` : ''}`
}
