import type PocketBase from 'pocketbase'
import type { TalkStatus } from '../domain'

export interface SubmissionStats {
  total: number
  byStatus: Record<TalkStatus, number>
  submittedCount: number
  draftCount: number
}

export interface ReviewStats {
  totalReviews: number
  reviewedTalks: number
  pendingReviewTalks: number
  averageReviewsPerTalk: number
  averageRating: number | null
}

export interface CategoryAcceptanceRate {
  categoryId: string
  categoryName: string
  submitted: number
  accepted: number
  rate: number
}

export interface AcceptanceRateStats {
  globalRate: number
  acceptedCount: number
  decidedCount: number
  byCategory: CategoryAcceptanceRate[]
}

export interface CfpStatsService {
  getSubmissionStats(editionId: string): Promise<SubmissionStats>
  getReviewStats(editionId: string): Promise<ReviewStats>
  getAcceptanceRate(editionId: string): Promise<AcceptanceRateStats>
}

const DECIDED_STATUSES: TalkStatus[] = ['accepted', 'rejected', 'confirmed', 'declined']
const SUBMITTED_STATUSES: TalkStatus[] = [
  'submitted',
  'under_review',
  'accepted',
  'rejected',
  'confirmed',
  'declined',
  'withdrawn'
]

export const createCfpStatsService = (pb: PocketBase): CfpStatsService => ({
  async getSubmissionStats(editionId: string): Promise<SubmissionStats> {
    const talks = await pb.collection('talks').getFullList({
      filter: `editionId = "${editionId}"`,
      fields: 'status'
    })

    const byStatus: Record<TalkStatus, number> = {
      draft: 0,
      submitted: 0,
      under_review: 0,
      accepted: 0,
      rejected: 0,
      confirmed: 0,
      declined: 0,
      withdrawn: 0
    }

    for (const talk of talks) {
      const status = talk.status as TalkStatus
      byStatus[status]++
    }

    const submittedCount = SUBMITTED_STATUSES.reduce((sum, s) => sum + byStatus[s], 0)

    return {
      total: talks.length,
      byStatus,
      submittedCount,
      draftCount: byStatus.draft
    }
  },

  async getReviewStats(editionId: string): Promise<ReviewStats> {
    const talks = await pb.collection('talks').getFullList({
      filter: `editionId = "${editionId}" && status != "draft"`,
      fields: 'id'
    })

    if (talks.length === 0) {
      return {
        totalReviews: 0,
        reviewedTalks: 0,
        pendingReviewTalks: 0,
        averageReviewsPerTalk: 0,
        averageRating: null
      }
    }

    const talkIds = talks.map((t) => t.id)

    const reviews = await pb.collection('reviews').getFullList({
      filter: talkIds.map((id) => `talkId = "${id}"`).join(' || '),
      fields: 'talkId,rating'
    })

    const reviewedTalkIds = new Set(reviews.map((r) => r.talkId))
    const totalReviews = reviews.length
    const reviewedTalks = reviewedTalkIds.size
    const pendingReviewTalks = talks.length - reviewedTalks

    const averageReviewsPerTalk =
      talks.length > 0 ? Math.round((totalReviews / talks.length) * 10) / 10 : 0

    let averageRating: number | null = null
    if (reviews.length > 0) {
      const sumRatings = reviews.reduce((sum, r) => sum + (r.rating as number), 0)
      averageRating = Math.round((sumRatings / reviews.length) * 10) / 10
    }

    return {
      totalReviews,
      reviewedTalks,
      pendingReviewTalks,
      averageReviewsPerTalk,
      averageRating
    }
  },

  async getAcceptanceRate(editionId: string): Promise<AcceptanceRateStats> {
    const [talks, categories] = await Promise.all([
      pb.collection('talks').getFullList({
        filter: `editionId = "${editionId}"`,
        fields: 'status,categoryId'
      }),
      pb.collection('categories').getFullList({
        filter: `editionId = "${editionId}"`,
        fields: 'id,name'
      })
    ])

    const categoryMap = new Map(categories.map((c) => [c.id, c.name as string]))

    const decidedTalks = talks.filter((t) => DECIDED_STATUSES.includes(t.status as TalkStatus))
    const acceptedTalks = talks.filter((t) =>
      ['accepted', 'confirmed'].includes(t.status as TalkStatus)
    )

    const decidedCount = decidedTalks.length
    const acceptedCount = acceptedTalks.length
    const globalRate = decidedCount > 0 ? Math.round((acceptedCount / decidedCount) * 100) : 0

    const categoryStats = new Map<string, { submitted: number; accepted: number }>()

    for (const talk of talks) {
      const categoryId = talk.categoryId as string | undefined
      if (!categoryId) continue

      if (!DECIDED_STATUSES.includes(talk.status as TalkStatus)) continue

      if (!categoryStats.has(categoryId)) {
        categoryStats.set(categoryId, { submitted: 0, accepted: 0 })
      }

      const stats = categoryStats.get(categoryId)
      if (stats) {
        stats.submitted++
        if (['accepted', 'confirmed'].includes(talk.status as TalkStatus)) {
          stats.accepted++
        }
      }
    }

    const byCategory: CategoryAcceptanceRate[] = []
    for (const [categoryId, stats] of categoryStats) {
      const categoryName = categoryMap.get(categoryId) || 'Unknown'
      byCategory.push({
        categoryId,
        categoryName,
        submitted: stats.submitted,
        accepted: stats.accepted,
        rate: stats.submitted > 0 ? Math.round((stats.accepted / stats.submitted) * 100) : 0
      })
    }

    byCategory.sort((a, b) => b.rate - a.rate)

    return {
      globalRate,
      acceptedCount,
      decidedCount,
      byCategory
    }
  }
})

export type { CfpStatsService as CfpStatsServiceType }
