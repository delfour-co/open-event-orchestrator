/**
 * Email Event Domain Entity
 *
 * Tracks email interactions: opens, clicks, bounces, unsubscribes
 */

export type EmailEventType = 'opened' | 'clicked' | 'bounced' | 'unsubscribed' | 'complained'

export type BounceType = 'hard' | 'soft' | 'unknown'

export interface EmailEvent {
  id: string
  campaignId: string
  contactId: string
  type: EmailEventType
  // For click events
  url?: string
  linkId?: string
  // For bounce events
  bounceType?: BounceType
  bounceReason?: string
  // Metadata
  ipAddress?: string
  userAgent?: string
  timestamp: Date
  createdAt: Date
}

export interface CreateEmailEvent {
  campaignId: string
  contactId: string
  type: EmailEventType
  url?: string
  linkId?: string
  bounceType?: BounceType
  bounceReason?: string
  ipAddress?: string
  userAgent?: string
  timestamp?: Date
}

export interface EmailEventStats {
  campaignId: string
  totalSent: number
  uniqueOpens: number
  totalOpens: number
  uniqueClicks: number
  totalClicks: number
  bounces: number
  unsubscribes: number
  complaints: number
  openRate: number
  clickRate: number
  clickToOpenRate: number
}

export interface LinkClickStats {
  linkId: string
  url: string
  uniqueClicks: number
  totalClicks: number
}

/**
 * Generate a unique tracking ID for an email event
 * Uses base64url encoding to avoid issues with special characters
 * Format: base64url({campaignId}:{contactId}:{random})
 */
export function generateTrackingId(campaignId: string, contactId: string): string {
  const random = Math.random().toString(36).substring(2, 10)
  const data = `${campaignId}:${contactId}:${random}`
  // Base64url encode (browser and Node compatible)
  if (typeof btoa !== 'undefined') {
    return btoa(data).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  }
  return Buffer.from(data).toString('base64url')
}

/**
 * Parse a tracking ID to extract campaign and contact IDs
 */
export function parseTrackingId(
  trackingId: string
): { campaignId: string; contactId: string } | null {
  try {
    // Base64url decode
    let data: string
    if (typeof atob !== 'undefined') {
      const base64 = trackingId.replace(/-/g, '+').replace(/_/g, '/')
      data = atob(base64)
    } else {
      data = Buffer.from(trackingId, 'base64url').toString()
    }

    const parts = data.split(':')
    if (parts.length < 3) return null

    const campaignId = parts[0]
    const contactId = parts[1]
    // Random is parts[2], we don't need it

    if (!campaignId || !contactId) return null
    return { campaignId, contactId }
  } catch {
    return null
  }
}

/**
 * Calculate email event statistics from a list of events
 */
export function calculateEventStats(
  campaignId: string,
  totalSent: number,
  events: EmailEvent[]
): EmailEventStats {
  const openedContacts = new Set<string>()
  const clickedContacts = new Set<string>()
  let totalOpens = 0
  let totalClicks = 0
  let bounces = 0
  let unsubscribes = 0
  let complaints = 0

  for (const event of events) {
    switch (event.type) {
      case 'opened':
        openedContacts.add(event.contactId)
        totalOpens++
        break
      case 'clicked':
        clickedContacts.add(event.contactId)
        totalClicks++
        break
      case 'bounced':
        bounces++
        break
      case 'unsubscribed':
        unsubscribes++
        break
      case 'complained':
        complaints++
        break
    }
  }

  const uniqueOpens = openedContacts.size
  const uniqueClicks = clickedContacts.size
  const openRate = totalSent > 0 ? (uniqueOpens / totalSent) * 100 : 0
  const clickRate = totalSent > 0 ? (uniqueClicks / totalSent) * 100 : 0
  const clickToOpenRate = uniqueOpens > 0 ? (uniqueClicks / uniqueOpens) * 100 : 0

  return {
    campaignId,
    totalSent,
    uniqueOpens,
    totalOpens,
    uniqueClicks,
    totalClicks,
    bounces,
    unsubscribes,
    complaints,
    openRate: Math.round(openRate * 100) / 100,
    clickRate: Math.round(clickRate * 100) / 100,
    clickToOpenRate: Math.round(clickToOpenRate * 100) / 100
  }
}

/**
 * Calculate click statistics per link
 */
export function calculateLinkStats(events: EmailEvent[]): LinkClickStats[] {
  const linkMap = new Map<string, { url: string; contacts: Set<string>; totalClicks: number }>()

  for (const event of events) {
    if (event.type !== 'clicked' || !event.url) continue

    const linkId = event.linkId || event.url
    const existing = linkMap.get(linkId)

    if (existing) {
      existing.contacts.add(event.contactId)
      existing.totalClicks++
    } else {
      linkMap.set(linkId, {
        url: event.url,
        contacts: new Set([event.contactId]),
        totalClicks: 1
      })
    }
  }

  return Array.from(linkMap.entries()).map(([linkId, data]) => ({
    linkId,
    url: data.url,
    uniqueClicks: data.contacts.size,
    totalClicks: data.totalClicks
  }))
}

/**
 * Check if an email event is a hard bounce (permanent failure)
 */
export function isHardBounce(event: EmailEvent): boolean {
  return event.type === 'bounced' && event.bounceType === 'hard'
}

/**
 * Check if a contact should be suppressed based on their events
 * A contact should be suppressed if they have:
 * - Hard bounced
 * - Unsubscribed
 * - Complained
 */
export function shouldSuppressContact(events: EmailEvent[]): boolean {
  return events.some(
    (event) =>
      event.type === 'unsubscribed' ||
      event.type === 'complained' ||
      (event.type === 'bounced' && event.bounceType === 'hard')
  )
}
