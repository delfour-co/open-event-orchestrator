/**
 * Engagement Metrics Service
 *
 * Aggregates and calculates metrics for CRM dashboard and reporting.
 */

import { safeFilter } from '$lib/server/safe-filter'
import type PocketBase from 'pocketbase'
import {
  type CampaignComparison,
  type ContactGrowthPoint,
  type ContactHealth,
  type DashboardData,
  type DashboardKpi,
  type EmailMetrics,
  INACTIVE_DAYS_THRESHOLD,
  type LinkClickData,
  type MetricPeriod,
  type SegmentMetrics,
  type SourceDistribution,
  type TopEngagedContact,
  buildContactHealth,
  buildEmailMetrics,
  calculateEngagementRate,
  calculateGrowthRate,
  calculateSourceDistribution,
  getDateRangeForPeriod
} from '../domain/engagement-metrics'

export interface EngagementMetricsService {
  getDashboardData(eventId: string, period: MetricPeriod): Promise<DashboardData>
  getKpis(eventId: string, period: MetricPeriod): Promise<DashboardKpi>
  getContactGrowth(eventId: string, period: MetricPeriod): Promise<ContactGrowthPoint[]>
  getSourceDistribution(eventId: string): Promise<SourceDistribution[]>
  getTopEngagedContacts(eventId: string, limit?: number): Promise<TopEngagedContact[]>
  getEmailMetrics(eventId: string, period: MetricPeriod): Promise<EmailMetrics>
  getSegmentMetrics(eventId: string): Promise<SegmentMetrics[]>
  getContactHealth(eventId: string): Promise<ContactHealth>
  getCampaignComparison(eventId: string, limit?: number): Promise<CampaignComparison[]>
  getLinkClickData(campaignId: string): Promise<LinkClickData[]>
}

export function createEngagementMetricsService(pb: PocketBase): EngagementMetricsService {
  async function countContacts(eventId: string, additionalFilter?: string): Promise<number> {
    const filters = [safeFilter`eventId = ${eventId}`]
    if (additionalFilter) {
      filters.push(additionalFilter)
    }
    const result = await pb.collection('contacts').getList(1, 1, {
      filter: filters.join(' && '),
      fields: 'id'
    })
    return result.totalItems
  }

  async function getActiveContactCount(eventId: string, since: Date): Promise<number> {
    const result = await pb.collection('contact_activities').getList(1, 1, {
      filter: safeFilter`contact.eventId = ${eventId} && created >= ${since.toISOString()}`,
      fields: 'contactId'
    })
    return result.totalItems
  }

  return {
    async getDashboardData(eventId: string, period: MetricPeriod): Promise<DashboardData> {
      const [
        kpis,
        contactGrowth,
        sourceDistribution,
        topEngagedContacts,
        emailMetrics,
        segmentMetrics,
        contactHealth
      ] = await Promise.all([
        this.getKpis(eventId, period),
        this.getContactGrowth(eventId, period),
        this.getSourceDistribution(eventId),
        this.getTopEngagedContacts(eventId, 10),
        this.getEmailMetrics(eventId, period),
        this.getSegmentMetrics(eventId),
        this.getContactHealth(eventId)
      ])

      // Get previous period metrics for comparison
      let previousKpis: DashboardKpi | undefined
      let previousEmailMetrics: EmailMetrics | undefined

      if (period !== 'all_time') {
        ;[previousKpis, previousEmailMetrics] = await Promise.all([
          this.getKpis(eventId, period),
          this.getEmailMetrics(eventId, period)
        ])
      }

      return {
        kpis,
        previousKpis,
        contactGrowth,
        sourceDistribution,
        topEngagedContacts,
        emailMetrics,
        previousEmailMetrics,
        segmentMetrics,
        contactHealth,
        period,
        generatedAt: new Date()
      }
    },

    async getKpis(eventId: string, period: MetricPeriod): Promise<DashboardKpi> {
      const { start, end } = getDateRangeForPeriod(period)

      const totalContacts = await countContacts(eventId)
      const previousTotal = await countContacts(
        eventId,
        safeFilter`created < ${start.toISOString()}`
      )

      const newContacts = await countContacts(
        eventId,
        safeFilter`created >= ${start.toISOString()} && created <= ${end.toISOString()}`
      )

      const inactiveCutoff = new Date()
      inactiveCutoff.setDate(inactiveCutoff.getDate() - INACTIVE_DAYS_THRESHOLD)
      const activeContacts = await getActiveContactCount(eventId, inactiveCutoff)

      // Get contacts with valid marketing consent
      let contactsWithConsent = 0
      try {
        const consentResult = await pb.collection('consents').getList(1, 1, {
          filter: safeFilter`contact.eventId = ${eventId} && type = ${'marketing'} && status = ${'active'}`,
          fields: 'id'
        })
        contactsWithConsent = consentResult.totalItems
      } catch {
        // Consent collection might not exist
      }

      const engagementRate = calculateEngagementRate(activeContacts, totalContacts)
      const growthRate = calculateGrowthRate(totalContacts, previousTotal)
      const consentRate = calculateEngagementRate(contactsWithConsent, totalContacts)

      return {
        totalContacts,
        activeContacts,
        newContacts,
        engagementRate,
        growthRate,
        contactsWithConsent,
        consentRate
      }
    },

    async getContactGrowth(eventId: string, period: MetricPeriod): Promise<ContactGrowthPoint[]> {
      const { start, end } = getDateRangeForPeriod(period)
      const points: ContactGrowthPoint[] = []

      // Determine interval based on period
      let intervalDays = 1
      if (period === 'last_90_days' || period === 'this_year') {
        intervalDays = 7
      } else if (period === 'all_time') {
        intervalDays = 30
      }

      let currentDate = new Date(start)

      while (currentDate <= end) {
        const nextDate = new Date(currentDate)
        nextDate.setDate(nextDate.getDate() + intervalDays)

        const totalAtDate = await countContacts(
          eventId,
          safeFilter`created <= ${currentDate.toISOString()}`
        )

        const newInPeriod = await countContacts(
          eventId,
          safeFilter`created > ${currentDate.toISOString()} && created <= ${nextDate.toISOString()}`
        )

        points.push({
          date: new Date(currentDate),
          total: totalAtDate,
          newContacts: newInPeriod,
          removedContacts: 0
        })

        currentDate = nextDate
      }

      return points
    },

    async getSourceDistribution(eventId: string): Promise<SourceDistribution[]> {
      const sources: { source: string; count: number }[] = []

      // Get contact edition links to determine sources
      try {
        const links = await pb.collection('contact_edition_links').getFullList({
          filter: safeFilter`edition.eventId = ${eventId}`,
          fields: 'role'
        })

        const roleCounts = new Map<string, number>()
        for (const link of links) {
          const role = (link.role as string) || 'unknown'
          roleCounts.set(role, (roleCounts.get(role) || 0) + 1)
        }

        for (const [source, count] of roleCounts) {
          sources.push({ source, count })
        }
      } catch {
        // Fallback to basic contact count
        const total = await countContacts(eventId)
        sources.push({ source: 'contact', count: total })
      }

      return calculateSourceDistribution(sources)
    },

    async getTopEngagedContacts(eventId: string, limit = 10): Promise<TopEngagedContact[]> {
      try {
        const contacts = await pb.collection('contacts').getList(1, limit, {
          filter: safeFilter`eventId = ${eventId}`,
          sort: '-leadScore,-updated',
          fields: 'id,email,firstName,lastName,leadScore,lastActivityAt'
        })

        return contacts.items.map((c) => ({
          contactId: c.id,
          email: c.email as string,
          firstName: (c.firstName as string) || undefined,
          lastName: (c.lastName as string) || undefined,
          engagementScore: (c.leadScore as number) || 0,
          lastActivityAt: c.lastActivityAt ? new Date(c.lastActivityAt as string) : undefined,
          activityCount: 0
        }))
      } catch {
        return []
      }
    },

    async getEmailMetrics(eventId: string, period: MetricPeriod): Promise<EmailMetrics> {
      const { start, end } = getDateRangeForPeriod(period)

      let sent = 0
      let delivered = 0
      let opened = 0
      let clicked = 0
      let bounced = 0
      let unsubscribed = 0

      try {
        // Get campaigns in period
        const campaigns = await pb.collection('email_campaigns').getFullList({
          filter: safeFilter`eventId = ${eventId} && sentAt >= ${start.toISOString()} && sentAt <= ${end.toISOString()}`,
          fields: 'sentCount,deliveredCount,openedCount,clickedCount,bouncedCount,unsubscribedCount'
        })

        for (const campaign of campaigns) {
          sent += (campaign.sentCount as number) || 0
          delivered += (campaign.deliveredCount as number) || 0
          opened += (campaign.openedCount as number) || 0
          clicked += (campaign.clickedCount as number) || 0
          bounced += (campaign.bouncedCount as number) || 0
          unsubscribed += (campaign.unsubscribedCount as number) || 0
        }
      } catch {
        // Campaign collection might not exist or have different fields
      }

      return buildEmailMetrics({ sent, delivered, opened, clicked, bounced, unsubscribed })
    },

    async getSegmentMetrics(eventId: string): Promise<SegmentMetrics[]> {
      const metrics: SegmentMetrics[] = []

      try {
        const segments = await pb.collection('segments').getFullList({
          filter: safeFilter`eventId = ${eventId}`,
          fields: 'id,name'
        })

        for (const segment of segments) {
          // Count current members
          let memberCount = 0
          try {
            const members = await pb.collection('segment_memberships').getList(1, 1, {
              filter: safeFilter`segmentId = ${segment.id}`,
              fields: 'id'
            })
            memberCount = members.totalItems
          } catch {
            // Membership collection might not exist
          }

          metrics.push({
            segmentId: segment.id,
            segmentName: segment.name as string,
            memberCount,
            previousCount: 0,
            growthRate: 0,
            openRate: 0,
            clickRate: 0
          })
        }
      } catch {
        // Segments collection might not exist
      }

      return metrics
    },

    async getContactHealth(eventId: string): Promise<ContactHealth> {
      const total = await countContacts(eventId)

      // Count valid emails (those that haven't bounced)
      let invalidEmails = 0
      try {
        const suppressed = await pb.collection('suppression_list').getList(1, 1, {
          filter: safeFilter`eventId = ${eventId} && reason = ${'hard_bounce'}`,
          fields: 'id'
        })
        invalidEmails = suppressed.totalItems
      } catch {
        // Suppression list might not exist
      }

      // Count inactive contacts
      const inactiveCutoff = new Date()
      inactiveCutoff.setDate(inactiveCutoff.getDate() - INACTIVE_DAYS_THRESHOLD)

      let inactive = 0
      try {
        const inactiveResult = await pb.collection('contacts').getList(1, 1, {
          filter: safeFilter`eventId = ${eventId} && (lastActivityAt = "" || lastActivityAt < ${inactiveCutoff.toISOString()})`,
          fields: 'id'
        })
        inactive = inactiveResult.totalItems
      } catch {
        // Handle gracefully
      }

      // Count contacts with consent
      let withConsent = 0
      try {
        const consentResult = await pb.collection('consents').getList(1, 1, {
          filter: safeFilter`contact.eventId = ${eventId} && type = ${'marketing'} && status = ${'active'}`,
          fields: 'id'
        })
        withConsent = consentResult.totalItems
      } catch {
        // Assume all have consent if no consent system
        withConsent = total
      }

      return buildContactHealth({
        total,
        validEmails: total - invalidEmails,
        invalidEmails,
        inactive,
        withConsent
      })
    },

    async getCampaignComparison(eventId: string, limit = 10): Promise<CampaignComparison[]> {
      const comparisons: CampaignComparison[] = []

      try {
        const campaigns = await pb.collection('email_campaigns').getList(1, limit, {
          filter: safeFilter`eventId = ${eventId} && status = ${'sent'}`,
          sort: '-sentAt',
          fields: 'id,name,sentAt,sentCount,deliveredCount,openedCount,clickedCount,bouncedCount'
        })

        for (const campaign of campaigns.items) {
          const sent = (campaign.sentCount as number) || 0
          const delivered = (campaign.deliveredCount as number) || 0
          const opened = (campaign.openedCount as number) || 0
          const clicked = (campaign.clickedCount as number) || 0
          const bounced = (campaign.bouncedCount as number) || 0

          comparisons.push({
            campaignId: campaign.id,
            campaignName: campaign.name as string,
            sentAt: new Date(campaign.sentAt as string),
            recipientCount: sent,
            deliveryRate: sent > 0 ? Math.round((delivered / sent) * 1000) / 10 : 0,
            openRate: delivered > 0 ? Math.round((opened / delivered) * 1000) / 10 : 0,
            clickRate: delivered > 0 ? Math.round((clicked / delivered) * 1000) / 10 : 0,
            bounceRate: sent > 0 ? Math.round((bounced / sent) * 1000) / 10 : 0
          })
        }
      } catch {
        // Campaigns collection might not exist
      }

      return comparisons
    },

    async getLinkClickData(campaignId: string): Promise<LinkClickData[]> {
      const linkData: LinkClickData[] = []

      try {
        const events = await pb.collection('email_events').getFullList({
          filter: safeFilter`campaignId = ${campaignId} && type = ${'click'}`,
          fields: 'metadata'
        })

        const linkCounts = new Map<string, { clicks: number; uniqueContacts: Set<string> }>()

        for (const event of events) {
          const metadata = event.metadata as { url?: string; contactId?: string } | undefined
          if (metadata?.url) {
            const existing = linkCounts.get(metadata.url) || {
              clicks: 0,
              uniqueContacts: new Set<string>()
            }
            existing.clicks++
            if (metadata.contactId) {
              existing.uniqueContacts.add(metadata.contactId)
            }
            linkCounts.set(metadata.url, existing)
          }
        }

        const totalClicks = Array.from(linkCounts.values()).reduce((sum, l) => sum + l.clicks, 0)

        for (const [url, data] of linkCounts) {
          linkData.push({
            url,
            clickCount: data.clicks,
            uniqueClicks: data.uniqueContacts.size,
            clickRate: totalClicks > 0 ? Math.round((data.clicks / totalClicks) * 1000) / 10 : 0
          })
        }
      } catch {
        // Email events collection might not exist
      }

      return linkData.sort((a, b) => b.clickCount - a.clickCount)
    }
  }
}
