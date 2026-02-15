/**
 * Sponsoring Statistics Service
 *
 * Provides statistical data about sponsoring for an edition:
 * - Sponsor counts by level/package
 * - Revenue statistics vs objectives
 * - Pipeline statistics (prospects -> confirmed)
 * - Pending deliverables
 */

import { filterAnd, safeFilter } from '$lib/server/safe-filter'
import type PocketBase from 'pocketbase'
import type { SponsorStatus } from '../domain/edition-sponsor'

export interface SponsorsByPackage {
  packageId: string
  packageName: string
  tier: number
  count: number
  maxSponsors: number | null
  availableSlots: number | null
}

export interface SponsorStatsDetailed {
  total: number
  byStatus: Record<SponsorStatus, number>
  byPackage: SponsorsByPackage[]
  confirmed: number
  active: number // prospect + contacted + negotiating + confirmed
}

export interface RevenueStats {
  totalRevenue: number
  paidRevenue: number
  pendingRevenue: number
  targetRevenue: number | null
  progressPercent: number
  currency: string
}

export interface PipelineStats {
  prospects: number
  contacted: number
  negotiating: number
  confirmed: number
  declined: number
  cancelled: number
  conversionRate: number // confirmed / (total - cancelled)
  averageDealSize: number
}

export interface DeliverableSummary {
  sponsorId: string
  sponsorName: string
  packageName: string
  pendingBenefits: string[]
  totalBenefits: number
  completedBenefits: number
}

export interface SponsoringStats {
  sponsors: SponsorStatsDetailed
  revenue: RevenueStats
  pipeline: PipelineStats
  totalPackages: number
  pendingDeliverables: DeliverableSummary[]
}

export interface SponsoringStatsService {
  /**
   * Get comprehensive sponsoring statistics for an edition
   */
  getStats(editionId: string): Promise<SponsoringStats>

  /**
   * Get sponsor statistics for an edition
   */
  getSponsorStats(editionId: string): Promise<SponsorStatsDetailed>

  /**
   * Get revenue statistics for an edition
   */
  getRevenueStats(editionId: string): Promise<RevenueStats>

  /**
   * Get pipeline statistics for an edition
   */
  getPipelineStats(editionId: string): Promise<PipelineStats>

  /**
   * Get pending deliverables for confirmed sponsors
   */
  getPendingDeliverables(editionId: string): Promise<DeliverableSummary[]>
}

export const createSponsoringStatsService = (pb: PocketBase): SponsoringStatsService => {
  return {
    async getStats(editionId: string): Promise<SponsoringStats> {
      const [sponsors, revenue, pipeline, deliverables, packages] = await Promise.all([
        this.getSponsorStats(editionId),
        this.getRevenueStats(editionId),
        this.getPipelineStats(editionId),
        this.getPendingDeliverables(editionId),
        pb.collection('sponsor_packages').getFullList({
          filter: safeFilter`editionId = ${editionId}`,
          fields: 'id'
        })
      ])

      return {
        sponsors,
        revenue,
        pipeline,
        totalPackages: packages.length,
        pendingDeliverables: deliverables
      }
    },

    async getSponsorStats(editionId: string): Promise<SponsorStatsDetailed> {
      // Fetch all edition sponsors with expanded package info
      const editionSponsors = await pb.collection('edition_sponsors').getFullList({
        filter: safeFilter`editionId = ${editionId}`,
        expand: 'packageId',
        requestKey: null
      })

      // Fetch all packages for the edition
      const packages = await pb.collection('sponsor_packages').getFullList({
        filter: safeFilter`editionId = ${editionId}`,
        sort: 'tier'
      })

      // Initialize status counts
      const byStatus: Record<SponsorStatus, number> = {
        prospect: 0,
        contacted: 0,
        negotiating: 0,
        confirmed: 0,
        declined: 0,
        cancelled: 0
      }

      // Count by package
      const packageCounts = new Map<string, number>()

      for (const es of editionSponsors) {
        const status = (es.status as SponsorStatus) || 'prospect'
        byStatus[status]++

        if (es.packageId) {
          const count = packageCounts.get(es.packageId as string) || 0
          packageCounts.set(es.packageId as string, count + 1)
        }
      }

      // Build package statistics
      const byPackage: SponsorsByPackage[] = packages.map((pkg) => {
        const count = packageCounts.get(pkg.id as string) || 0
        const maxSponsors = (pkg.maxSponsors as number) || null
        const availableSlots = maxSponsors !== null ? Math.max(0, maxSponsors - count) : null

        return {
          packageId: pkg.id as string,
          packageName: pkg.name as string,
          tier: (pkg.tier as number) || 1,
          count,
          maxSponsors,
          availableSlots
        }
      })

      const active =
        byStatus.prospect + byStatus.contacted + byStatus.negotiating + byStatus.confirmed

      return {
        total: editionSponsors.length,
        byStatus,
        byPackage,
        confirmed: byStatus.confirmed,
        active
      }
    },

    async getRevenueStats(editionId: string): Promise<RevenueStats> {
      // Fetch confirmed sponsors with their amounts
      const confirmedSponsors = await pb.collection('edition_sponsors').getFullList({
        filter: filterAnd(safeFilter`editionId = ${editionId}`, 'status = "confirmed"'),
        fields: 'id,amount,paidAt',
        requestKey: null
      })

      // Fetch packages to determine currency (use first package's currency)
      const packages = await pb.collection('sponsor_packages').getFullList({
        filter: safeFilter`editionId = ${editionId}`,
        fields: 'id,currency,price',
        sort: 'tier'
      })

      const currency = packages.length > 0 ? (packages[0].currency as string) || 'EUR' : 'EUR'

      // Calculate revenues
      let totalRevenue = 0
      let paidRevenue = 0

      for (const sponsor of confirmedSponsors) {
        const amount = (sponsor.amount as number) || 0
        totalRevenue += amount
        if (sponsor.paidAt) {
          paidRevenue += amount
        }
      }

      const pendingRevenue = totalRevenue - paidRevenue

      // Calculate target revenue (sum of all package prices * max sponsors if set)
      let targetRevenue: number | null = null
      let hasTarget = false

      for (const pkg of packages) {
        if (pkg.maxSponsors && (pkg.price as number) > 0) {
          hasTarget = true
          targetRevenue = (targetRevenue || 0) + (pkg.price as number) * (pkg.maxSponsors as number)
        }
      }

      if (!hasTarget) {
        targetRevenue = null
      }

      const progressPercent =
        targetRevenue !== null && targetRevenue > 0
          ? Math.round((totalRevenue / targetRevenue) * 100 * 100) / 100
          : 0

      return {
        totalRevenue,
        paidRevenue,
        pendingRevenue,
        targetRevenue,
        progressPercent,
        currency
      }
    },

    async getPipelineStats(editionId: string): Promise<PipelineStats> {
      const editionSponsors = await pb.collection('edition_sponsors').getFullList({
        filter: safeFilter`editionId = ${editionId}`,
        fields: 'id,status,amount',
        requestKey: null
      })

      const counts: Record<SponsorStatus, number> = {
        prospect: 0,
        contacted: 0,
        negotiating: 0,
        confirmed: 0,
        declined: 0,
        cancelled: 0
      }

      let totalConfirmedAmount = 0

      for (const sponsor of editionSponsors) {
        const status = (sponsor.status as SponsorStatus) || 'prospect'
        counts[status]++

        if (status === 'confirmed') {
          totalConfirmedAmount += (sponsor.amount as number) || 0
        }
      }

      // Conversion rate: confirmed / (total excluding cancelled)
      const eligibleTotal = editionSponsors.length - counts.cancelled
      const conversionRate =
        eligibleTotal > 0 ? Math.round((counts.confirmed / eligibleTotal) * 100 * 100) / 100 : 0

      // Average deal size
      const averageDealSize =
        counts.confirmed > 0 ? Math.round(totalConfirmedAmount / counts.confirmed) : 0

      return {
        prospects: counts.prospect,
        contacted: counts.contacted,
        negotiating: counts.negotiating,
        confirmed: counts.confirmed,
        declined: counts.declined,
        cancelled: counts.cancelled,
        conversionRate,
        averageDealSize
      }
    },

    async getPendingDeliverables(editionId: string): Promise<DeliverableSummary[]> {
      // Fetch confirmed sponsors with package and sponsor info
      const confirmedSponsors = await pb.collection('edition_sponsors').getFullList({
        filter: filterAnd(safeFilter`editionId = ${editionId}`, 'status = "confirmed"'),
        expand: 'sponsorId,packageId',
        requestKey: null
      })

      const deliverables: DeliverableSummary[] = []

      for (const es of confirmedSponsors) {
        const expand = es.expand as Record<string, unknown> | undefined
        const sponsorRecord = expand?.sponsorId as Record<string, unknown> | undefined
        const packageRecord = expand?.packageId as Record<string, unknown> | undefined

        if (!packageRecord) continue

        // Parse benefits from package
        let benefits: Array<{ name: string; included: boolean }> = []
        if (packageRecord.benefits) {
          if (typeof packageRecord.benefits === 'string') {
            try {
              benefits = JSON.parse(packageRecord.benefits)
            } catch {
              benefits = []
            }
          } else if (Array.isArray(packageRecord.benefits)) {
            benefits = packageRecord.benefits as Array<{ name: string; included: boolean }>
          }
        }

        // For now, we consider all included benefits as pending
        // In a full implementation, there would be a deliverables tracking system
        const includedBenefits = benefits.filter((b) => b.included)
        const pendingBenefits = includedBenefits.map((b) => b.name)

        if (pendingBenefits.length > 0) {
          deliverables.push({
            sponsorId: es.sponsorId as string,
            sponsorName: (sponsorRecord?.name as string) || 'Unknown Sponsor',
            packageName: (packageRecord.name as string) || 'Unknown Package',
            pendingBenefits,
            totalBenefits: includedBenefits.length,
            completedBenefits: 0 // Placeholder - would need deliverables tracking
          })
        }
      }

      return deliverables
    }
  }
}

export type { SponsoringStatsService as SponsoringStatsServiceType }
