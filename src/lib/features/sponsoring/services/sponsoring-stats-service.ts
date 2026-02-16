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
import { createSponsorDeliverableRepository } from '../infra/sponsor-deliverable-repository'

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
  active: number
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
  conversionRate: number
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
  getStats(editionId: string): Promise<SponsoringStats>
  getSponsorStats(editionId: string): Promise<SponsorStatsDetailed>
  getRevenueStats(editionId: string): Promise<RevenueStats>
  getPipelineStats(editionId: string): Promise<PipelineStats>
  getPendingDeliverables(editionId: string): Promise<DeliverableSummary[]>
}

interface SponsorAmounts {
  totalRevenue: number
  paidRevenue: number
}

const calculateSponsorAmounts = (
  confirmedSponsors: Array<Record<string, unknown>>
): SponsorAmounts => {
  let totalRevenue = 0
  let paidRevenue = 0

  for (const sponsor of confirmedSponsors) {
    const amount = (sponsor.amount as number) || 0
    totalRevenue += amount
    if (sponsor.paidAt) {
      paidRevenue += amount
    }
  }

  return { totalRevenue, paidRevenue }
}

const calculateTargetRevenue = (packages: Array<Record<string, unknown>>): number | null => {
  let targetRevenue = 0
  let hasTarget = false

  for (const pkg of packages) {
    const maxSponsors = pkg.maxSponsors as number | undefined
    const price = pkg.price as number
    if (maxSponsors && price > 0) {
      hasTarget = true
      targetRevenue += price * maxSponsors
    }
  }

  return hasTarget ? targetRevenue : null
}

const calculateProgressPercent = (totalRevenue: number, targetRevenue: number | null): number => {
  if (targetRevenue === null || targetRevenue <= 0) return 0
  return Math.round((totalRevenue / targetRevenue) * 100 * 100) / 100
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
      const editionSponsors = await pb.collection('edition_sponsors').getFullList({
        filter: safeFilter`editionId = ${editionId}`,
        expand: 'packageId',
        requestKey: null
      })

      const packages = await pb.collection('sponsor_packages').getFullList({
        filter: safeFilter`editionId = ${editionId}`,
        sort: 'tier'
      })

      const byStatus: Record<SponsorStatus, number> = {
        prospect: 0,
        contacted: 0,
        negotiating: 0,
        confirmed: 0,
        declined: 0,
        cancelled: 0
      }

      const packageCounts = new Map<string, number>()

      for (const es of editionSponsors) {
        const status = (es.status as SponsorStatus) || 'prospect'
        byStatus[status]++

        if (es.packageId) {
          const count = packageCounts.get(es.packageId as string) || 0
          packageCounts.set(es.packageId as string, count + 1)
        }
      }

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
      const confirmedSponsors = await pb.collection('edition_sponsors').getFullList({
        filter: filterAnd(safeFilter`editionId = ${editionId}`, 'status = "confirmed"'),
        fields: 'id,amount,paidAt',
        requestKey: null
      })

      const packages = await pb.collection('sponsor_packages').getFullList({
        filter: safeFilter`editionId = ${editionId}`,
        fields: 'id,currency,price,maxSponsors',
        sort: 'tier'
      })

      const currency = packages.length > 0 ? (packages[0].currency as string) || 'EUR' : 'EUR'
      const { totalRevenue, paidRevenue } = calculateSponsorAmounts(confirmedSponsors)
      const pendingRevenue = totalRevenue - paidRevenue
      const targetRevenue = calculateTargetRevenue(packages)
      const progressPercent = calculateProgressPercent(totalRevenue, targetRevenue)

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

      const eligibleTotal = editionSponsors.length - counts.cancelled
      const conversionRate =
        eligibleTotal > 0 ? Math.round((counts.confirmed / eligibleTotal) * 100 * 100) / 100 : 0

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
      const deliverableRepo = createSponsorDeliverableRepository(pb)
      const pendingDeliverables = await deliverableRepo.findPendingByEdition(editionId)

      const bySponsor = new Map<
        string,
        {
          sponsorId: string
          sponsorName: string
          packageName: string
          pending: string[]
          total: number
          completed: number
        }
      >()

      for (const d of pendingDeliverables) {
        const esId = d.editionSponsorId
        if (!bySponsor.has(esId)) {
          bySponsor.set(esId, {
            sponsorId: d.editionSponsor?.sponsorId || '',
            sponsorName: d.editionSponsor?.sponsor?.name || 'Unknown Sponsor',
            packageName: d.editionSponsor?.package?.name || 'Unknown Package',
            pending: [],
            total: 0,
            completed: 0
          })
        }

        const entry = bySponsor.get(esId)
        if (entry) {
          entry.pending.push(d.benefitName)
          entry.total++
        }
      }

      for (const [esId, entry] of bySponsor.entries()) {
        const counts = await deliverableRepo.countByEditionSponsor(esId)
        entry.total = counts.pending + counts.in_progress + counts.delivered
        entry.completed = counts.delivered
      }

      return Array.from(bySponsor.values()).map((entry) => ({
        sponsorId: entry.sponsorId,
        sponsorName: entry.sponsorName,
        packageName: entry.packageName,
        pendingBenefits: entry.pending,
        totalBenefits: entry.total,
        completedBenefits: entry.completed
      }))
    }
  }
}

export type { SponsoringStatsService as SponsoringStatsServiceType }
