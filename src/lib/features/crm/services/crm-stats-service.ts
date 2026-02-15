/**
 * CRM Stats Service
 *
 * Provides statistics for the CRM reporting widget.
 */

import { safeFilter } from '$lib/server/safe-filter'
import type PocketBase from 'pocketbase'

export interface ContactStats {
  totalContacts: number
  newContactsThisPeriod: number
  previousPeriodContacts: number
  growthRate: number
  contactsByRole: { role: string; count: number }[]
}

export interface CampaignStats {
  totalCampaigns: number
  recentCampaigns: RecentCampaign[]
  averageOpenRate: number
  averageClickRate: number
}

export interface RecentCampaign {
  id: string
  name: string
  sentAt: Date
  recipientCount: number
  openRate: number
  clickRate: number
}

export interface EngagementStats {
  averageEngagementScore: number
  hotLeadsCount: number
  warmLeadsCount: number
  coldLeadsCount: number
  engagementDistribution: { level: string; count: number; percentage: number }[]
}

export interface CrmStatsService {
  getContactStats(editionId: string, periodDays?: number): Promise<ContactStats>
  getCampaignStats(editionId: string, limit?: number): Promise<CampaignStats>
  getEngagementStats(editionId: string): Promise<EngagementStats>
}

const DEFAULT_PERIOD_DAYS = 30
const DEFAULT_CAMPAIGN_LIMIT = 5

const HOT_THRESHOLD = 50
const WARM_THRESHOLD = 20

export function createCrmStatsService(pb: PocketBase): CrmStatsService {
  return {
    async getContactStats(
      editionId: string,
      periodDays = DEFAULT_PERIOD_DAYS
    ): Promise<ContactStats> {
      const now = new Date()
      const periodStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000)
      const previousPeriodStart = new Date(periodStart.getTime() - periodDays * 24 * 60 * 60 * 1000)

      let totalContacts = 0
      let newContactsThisPeriod = 0
      let previousPeriodContacts = 0
      const roleCountMap = new Map<string, number>()

      try {
        // Get all contact edition links for this edition
        const links = await pb.collection('contact_edition_links').getFullList({
          filter: safeFilter`editionId = ${editionId}`,
          fields: 'id,roles,created'
        })

        totalContacts = links.length

        for (const link of links) {
          const createdAt = new Date(link.created as string)

          // Count new contacts this period
          if (createdAt >= periodStart) {
            newContactsThisPeriod++
          }

          // Count contacts in previous period
          if (createdAt >= previousPeriodStart && createdAt < periodStart) {
            previousPeriodContacts++
          }

          // Count by role
          const roles = parseRoles(link.roles)
          for (const role of roles) {
            roleCountMap.set(role, (roleCountMap.get(role) || 0) + 1)
          }
        }
      } catch {
        // Collection might not exist or be empty
      }

      const contactsByRole = Array.from(roleCountMap.entries())
        .map(([role, count]) => ({ role, count }))
        .sort((a, b) => b.count - a.count)

      const growthRate = calculateGrowthRate(newContactsThisPeriod, previousPeriodContacts)

      return {
        totalContacts,
        newContactsThisPeriod,
        previousPeriodContacts,
        growthRate,
        contactsByRole
      }
    },

    async getCampaignStats(
      editionId: string,
      limit = DEFAULT_CAMPAIGN_LIMIT
    ): Promise<CampaignStats> {
      const recentCampaigns: RecentCampaign[] = []
      let totalCampaigns = 0
      let totalOpenRate = 0
      let totalClickRate = 0

      try {
        // Get campaigns for this edition
        const campaigns = await pb.collection('email_campaigns').getList(1, limit, {
          filter: safeFilter`editionId = ${editionId} && status = ${'sent'}`,
          sort: '-sentAt',
          fields: 'id,name,sentAt,totalSent,totalRecipients'
        })

        totalCampaigns = campaigns.totalItems

        for (const campaign of campaigns.items) {
          const campaignId = campaign.id
          const totalSent = (campaign.totalSent as number) || 0
          const totalRecipients = (campaign.totalRecipients as number) || 0

          // Get campaign event stats
          let openCount = 0
          let clickCount = 0

          try {
            const openEvents = await pb.collection('email_events').getList(1, 1, {
              filter: safeFilter`campaignId = ${campaignId} && type = ${'opened'}`,
              fields: 'id'
            })
            openCount = openEvents.totalItems

            const clickEvents = await pb.collection('email_events').getList(1, 1, {
              filter: safeFilter`campaignId = ${campaignId} && type = ${'clicked'}`,
              fields: 'id'
            })
            clickCount = clickEvents.totalItems
          } catch {
            // Events collection might not exist
          }

          const openRate = totalSent > 0 ? Math.round((openCount / totalSent) * 1000) / 10 : 0
          const clickRate = totalSent > 0 ? Math.round((clickCount / totalSent) * 1000) / 10 : 0

          totalOpenRate += openRate
          totalClickRate += clickRate

          recentCampaigns.push({
            id: campaignId,
            name: campaign.name as string,
            sentAt: new Date(campaign.sentAt as string),
            recipientCount: totalRecipients,
            openRate,
            clickRate
          })
        }
      } catch {
        // Collection might not exist
      }

      const campaignCount = recentCampaigns.length
      const averageOpenRate =
        campaignCount > 0 ? Math.round((totalOpenRate / campaignCount) * 10) / 10 : 0
      const averageClickRate =
        campaignCount > 0 ? Math.round((totalClickRate / campaignCount) * 10) / 10 : 0

      return {
        totalCampaigns,
        recentCampaigns,
        averageOpenRate,
        averageClickRate
      }
    },

    async getEngagementStats(editionId: string): Promise<EngagementStats> {
      let hotLeadsCount = 0
      let warmLeadsCount = 0
      let coldLeadsCount = 0
      let totalScore = 0
      let contactCount = 0

      try {
        // Get contacts linked to this edition with their lead scores
        const links = await pb.collection('contact_edition_links').getFullList({
          filter: safeFilter`editionId = ${editionId}`,
          expand: 'contactId',
          fields: 'contactId,expand.contactId.leadScore'
        })

        for (const link of links) {
          contactCount++
          const expanded = link.expand as { contactId?: { leadScore?: number } } | undefined
          const leadScore = expanded?.contactId?.leadScore || 0

          totalScore += leadScore

          if (leadScore >= HOT_THRESHOLD) {
            hotLeadsCount++
          } else if (leadScore >= WARM_THRESHOLD) {
            warmLeadsCount++
          } else {
            coldLeadsCount++
          }
        }
      } catch {
        // Collection might not exist or contacts don't have leadScore
      }

      const averageEngagementScore =
        contactCount > 0 ? Math.round((totalScore / contactCount) * 10) / 10 : 0

      const total = hotLeadsCount + warmLeadsCount + coldLeadsCount
      const engagementDistribution =
        total > 0
          ? [
              {
                level: 'hot',
                count: hotLeadsCount,
                percentage: Math.round((hotLeadsCount / total) * 1000) / 10
              },
              {
                level: 'warm',
                count: warmLeadsCount,
                percentage: Math.round((warmLeadsCount / total) * 1000) / 10
              },
              {
                level: 'cold',
                count: coldLeadsCount,
                percentage: Math.round((coldLeadsCount / total) * 1000) / 10
              }
            ]
          : []

      return {
        averageEngagementScore,
        hotLeadsCount,
        warmLeadsCount,
        coldLeadsCount,
        engagementDistribution
      }
    }
  }
}

function parseRoles(value: unknown): string[] {
  if (Array.isArray(value)) return value as string[]
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

function calculateGrowthRate(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0
  }
  return Math.round(((current - previous) / previous) * 1000) / 10
}
