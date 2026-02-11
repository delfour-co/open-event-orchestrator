/**
 * Campaign Analytics Service
 *
 * Provides campaign statistics, time-series data, and export functionality.
 */

import { safeFilter } from '$lib/server/safe-filter'
import type PocketBase from 'pocketbase'
import { calculateEventStats, calculateLinkStats } from '../domain/email-event'
import type {
  EmailEvent,
  EmailEventStats,
  EmailEventType,
  LinkClickStats
} from '../domain/email-event'

export interface TimeSeriesDataPoint {
  date: string // ISO date (YYYY-MM-DD)
  opens: number
  clicks: number
  bounces: number
  unsubscribes: number
}

export interface CampaignAnalytics {
  campaignId: string
  campaignName: string
  sentAt?: Date
  stats: EmailEventStats
  linkStats: LinkClickStats[]
  timeSeries: TimeSeriesDataPoint[]
  topContacts: ContactEngagement[]
}

export interface ContactEngagement {
  contactId: string
  email: string
  firstName?: string
  lastName?: string
  opens: number
  clicks: number
  lastInteraction?: Date
}

export interface CampaignComparisonStats {
  campaignId: string
  campaignName: string
  sentAt?: Date
  totalSent: number
  openRate: number
  clickRate: number
  bounceRate: number
}

export interface CampaignAnalyticsService {
  /**
   * Get full analytics for a campaign
   */
  getCampaignAnalytics(campaignId: string): Promise<CampaignAnalytics>

  /**
   * Get stats for multiple campaigns (for comparison)
   */
  getComparisonStats(campaignIds: string[]): Promise<CampaignComparisonStats[]>

  /**
   * Get time series data for a campaign
   */
  getTimeSeries(campaignId: string, days?: number): Promise<TimeSeriesDataPoint[]>

  /**
   * Get top engaged contacts for a campaign
   */
  getTopContacts(campaignId: string, limit?: number): Promise<ContactEngagement[]>

  /**
   * Export campaign stats as CSV
   */
  exportStatsCsv(campaignId: string): Promise<string>

  /**
   * Export all events for a campaign as CSV
   */
  exportEventsCsv(campaignId: string): Promise<string>

  /**
   * Get aggregate stats for an event or edition
   */
  getAggregateStats(options: {
    eventId?: string
    editionId?: string
    startDate?: Date
    endDate?: Date
  }): Promise<{
    totalCampaigns: number
    totalSent: number
    avgOpenRate: number
    avgClickRate: number
    avgBounceRate: number
  }>
}

export function createCampaignAnalyticsService(pb: PocketBase): CampaignAnalyticsService {
  async function fetchCampaignEvents(campaignId: string): Promise<EmailEvent[]> {
    const records = await pb.collection('email_events').getFullList({
      filter: safeFilter`campaignId = ${campaignId}`,
      sort: 'created'
    })

    return records.map((r) => ({
      id: r.id,
      campaignId: r.campaignId as string,
      contactId: r.contactId as string,
      type: r.type as EmailEventType,
      url: r.url as string | undefined,
      linkId: r.linkId as string | undefined,
      bounceType: r.bounceType as 'hard' | 'soft' | 'unknown' | undefined,
      bounceReason: r.bounceReason as string | undefined,
      ipAddress: r.ipAddress as string | undefined,
      userAgent: r.userAgent as string | undefined,
      timestamp: new Date(r.timestamp as string),
      createdAt: new Date(r.created as string)
    }))
  }

  async function fetchCampaign(campaignId: string) {
    return pb.collection('email_campaigns').getOne(campaignId)
  }

  return {
    async getCampaignAnalytics(campaignId: string): Promise<CampaignAnalytics> {
      const [campaign, events] = await Promise.all([
        fetchCampaign(campaignId),
        fetchCampaignEvents(campaignId)
      ])

      const totalSent = (campaign.sentCount as number) || 0
      const stats = calculateEventStats(campaignId, totalSent, events)
      const linkStats = calculateLinkStats(events)
      const timeSeries = buildTimeSeries(events)
      const topContacts = await this.getTopContacts(campaignId, 10)

      return {
        campaignId,
        campaignName: campaign.name as string,
        sentAt: campaign.sentAt ? new Date(campaign.sentAt as string) : undefined,
        stats,
        linkStats,
        timeSeries,
        topContacts
      }
    },

    async getComparisonStats(campaignIds: string[]): Promise<CampaignComparisonStats[]> {
      if (campaignIds.length === 0) return []

      const results: CampaignComparisonStats[] = []

      for (const campaignId of campaignIds) {
        const campaign = await fetchCampaign(campaignId)
        const events = await fetchCampaignEvents(campaignId)
        const totalSent = (campaign.sentCount as number) || 0
        const stats = calculateEventStats(campaignId, totalSent, events)

        results.push({
          campaignId,
          campaignName: campaign.name as string,
          sentAt: campaign.sentAt ? new Date(campaign.sentAt as string) : undefined,
          totalSent,
          openRate: stats.openRate,
          clickRate: stats.clickRate,
          bounceRate: totalSent > 0 ? (stats.bounces / totalSent) * 100 : 0
        })
      }

      return results
    },

    async getTimeSeries(campaignId: string, days = 30): Promise<TimeSeriesDataPoint[]> {
      const events = await fetchCampaignEvents(campaignId)
      return buildTimeSeries(events, days)
    },

    async getTopContacts(campaignId: string, limit = 10): Promise<ContactEngagement[]> {
      const events = await fetchCampaignEvents(campaignId)

      // Group by contact
      const contactMap = new Map<
        string,
        { opens: number; clicks: number; lastInteraction?: Date }
      >()

      for (const event of events) {
        const existing = contactMap.get(event.contactId) || {
          opens: 0,
          clicks: 0
        }

        if (event.type === 'opened') existing.opens++
        if (event.type === 'clicked') existing.clicks++

        if (!existing.lastInteraction || event.timestamp > existing.lastInteraction) {
          existing.lastInteraction = event.timestamp
        }

        contactMap.set(event.contactId, existing)
      }

      // Sort by engagement (clicks + opens)
      const sorted = Array.from(contactMap.entries())
        .map(([contactId, data]) => ({ contactId, ...data }))
        .sort((a, b) => b.clicks + b.opens - (a.clicks + a.opens))
        .slice(0, limit)

      // Fetch contact details
      const contactIds = sorted.map((c) => c.contactId)
      if (contactIds.length === 0) return []

      const idFilters = contactIds.map((id) => safeFilter`id = ${id}`)
      const contacts = await pb.collection('contacts').getFullList({
        filter: idFilters.join(' || ')
      })

      const contactDetails = new Map(contacts.map((c) => [c.id, c]))

      return sorted.map((engagement) => {
        const contact = contactDetails.get(engagement.contactId)
        return {
          contactId: engagement.contactId,
          email: (contact?.email as string) || '',
          firstName: contact?.firstName as string | undefined,
          lastName: contact?.lastName as string | undefined,
          opens: engagement.opens,
          clicks: engagement.clicks,
          lastInteraction: engagement.lastInteraction
        }
      })
    },

    async exportStatsCsv(campaignId: string): Promise<string> {
      const analytics = await this.getCampaignAnalytics(campaignId)
      const { stats, linkStats } = analytics

      const lines: string[] = [
        '# Campaign Statistics',
        `Campaign,${escapeCsv(analytics.campaignName)}`,
        `Sent At,${analytics.sentAt?.toISOString() || 'N/A'}`,
        '',
        '# Overview',
        'Metric,Value',
        `Total Sent,${stats.totalSent}`,
        `Unique Opens,${stats.uniqueOpens}`,
        `Total Opens,${stats.totalOpens}`,
        `Open Rate,${stats.openRate}%`,
        `Unique Clicks,${stats.uniqueClicks}`,
        `Total Clicks,${stats.totalClicks}`,
        `Click Rate,${stats.clickRate}%`,
        `Click-to-Open Rate,${stats.clickToOpenRate}%`,
        `Bounces,${stats.bounces}`,
        `Unsubscribes,${stats.unsubscribes}`,
        `Complaints,${stats.complaints}`,
        '',
        '# Link Statistics',
        'URL,Unique Clicks,Total Clicks'
      ]

      for (const link of linkStats) {
        lines.push(`${escapeCsv(link.url)},${link.uniqueClicks},${link.totalClicks}`)
      }

      return lines.join('\n')
    },

    async exportEventsCsv(campaignId: string): Promise<string> {
      const events = await fetchCampaignEvents(campaignId)

      const header = 'Timestamp,Contact ID,Type,URL,Bounce Type,IP Address,User Agent'
      const rows = events.map((e) =>
        [
          e.timestamp.toISOString(),
          e.contactId,
          e.type,
          escapeCsv(e.url || ''),
          e.bounceType || '',
          e.ipAddress || '',
          escapeCsv(e.userAgent || '')
        ].join(',')
      )

      return [header, ...rows].join('\n')
    },

    async getAggregateStats(options: {
      eventId?: string
      editionId?: string
      startDate?: Date
      endDate?: Date
    }): Promise<{
      totalCampaigns: number
      totalSent: number
      avgOpenRate: number
      avgClickRate: number
      avgBounceRate: number
    }> {
      const filters: string[] = []

      if (options.eventId) {
        filters.push(safeFilter`eventId = ${options.eventId}`)
      }
      if (options.editionId) {
        filters.push(safeFilter`editionId = ${options.editionId}`)
      }
      if (options.startDate) {
        filters.push(safeFilter`sentAt >= ${options.startDate.toISOString()}`)
      }
      if (options.endDate) {
        filters.push(safeFilter`sentAt <= ${options.endDate.toISOString()}`)
      }

      // Only completed campaigns
      filters.push('status = "sent"')

      const campaigns = await pb.collection('email_campaigns').getFullList({
        filter: filters.join(' && ')
      })

      if (campaigns.length === 0) {
        return {
          totalCampaigns: 0,
          totalSent: 0,
          avgOpenRate: 0,
          avgClickRate: 0,
          avgBounceRate: 0
        }
      }

      let totalSent = 0
      let totalOpenRate = 0
      let totalClickRate = 0
      let totalBounceRate = 0

      for (const campaign of campaigns) {
        const sentCount = (campaign.sentCount as number) || 0
        totalSent += sentCount

        // Get stats from campaign tracking fields if available
        const openCount = (campaign.openCount as number) || 0
        const clickCount = (campaign.clickCount as number) || 0
        const bounceCount = (campaign.bounceCount as number) || 0

        if (sentCount > 0) {
          totalOpenRate += (openCount / sentCount) * 100
          totalClickRate += (clickCount / sentCount) * 100
          totalBounceRate += (bounceCount / sentCount) * 100
        }
      }

      const count = campaigns.length
      return {
        totalCampaigns: count,
        totalSent,
        avgOpenRate: Math.round((totalOpenRate / count) * 100) / 100,
        avgClickRate: Math.round((totalClickRate / count) * 100) / 100,
        avgBounceRate: Math.round((totalBounceRate / count) * 100) / 100
      }
    }
  }
}

/**
 * Build time series data from events
 */
function buildTimeSeries(events: EmailEvent[], days = 30): TimeSeriesDataPoint[] {
  const now = new Date()
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

  // Initialize all dates
  const dateMap = new Map<string, TimeSeriesDataPoint>()
  for (let i = 0; i <= days; i++) {
    const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
    const dateKey = date.toISOString().split('T')[0]
    dateMap.set(dateKey, {
      date: dateKey,
      opens: 0,
      clicks: 0,
      bounces: 0,
      unsubscribes: 0
    })
  }

  // Aggregate events
  for (const event of events) {
    const dateKey = event.timestamp.toISOString().split('T')[0]
    const point = dateMap.get(dateKey)
    if (!point) continue

    switch (event.type) {
      case 'opened':
        point.opens++
        break
      case 'clicked':
        point.clicks++
        break
      case 'bounced':
        point.bounces++
        break
      case 'unsubscribed':
        point.unsubscribes++
        break
    }
  }

  return Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Escape value for CSV
 */
function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}
