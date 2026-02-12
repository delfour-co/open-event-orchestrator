/**
 * Review Mode Domain
 *
 * Handles multiple evaluation modes for CFP reviews:
 * - Stars (1-5 rating)
 * - Yes/No (binary decision)
 * - Comparative (ranking talks against each other)
 */

import { z } from 'zod'

/**
 * Available review modes
 */
export const reviewModeSchema = z.enum(['stars', 'yes_no', 'comparative'])

export type ReviewMode = z.infer<typeof reviewModeSchema>

/**
 * Review mode configuration
 */
export const REVIEW_MODE_CONFIG = {
  stars: {
    name: 'Star Rating',
    description: 'Rate talks from 1 to 5 stars',
    minValue: 1,
    maxValue: 5,
    defaultValue: 3
  },
  yes_no: {
    name: 'Yes/No',
    description: 'Simple binary decision - accept or reject',
    minValue: 0,
    maxValue: 1,
    defaultValue: null
  },
  comparative: {
    name: 'Comparative Ranking',
    description: 'Rank talks relative to each other within a category',
    minValue: 1,
    maxValue: 100,
    defaultValue: 50
  }
} as const

/**
 * Star rating value (1-5)
 */
export const starRatingSchema = z.number().int().min(1).max(5)
export type StarRating = z.infer<typeof starRatingSchema>

/**
 * Yes/No value (true = yes, false = no, null = abstain)
 */
export const yesNoValueSchema = z.boolean().nullable()
export type YesNoValue = z.infer<typeof yesNoValueSchema>

/**
 * Comparative ranking value (1-100)
 */
export const comparativeRankSchema = z.number().int().min(1).max(100)
export type ComparativeRank = z.infer<typeof comparativeRankSchema>

/**
 * Review value that can be any of the supported modes
 */
export const reviewValueSchema = z.union([
  z.object({
    mode: z.literal('stars'),
    value: starRatingSchema
  }),
  z.object({
    mode: z.literal('yes_no'),
    value: yesNoValueSchema
  }),
  z.object({
    mode: z.literal('comparative'),
    value: comparativeRankSchema
  })
])

export type ReviewValue = z.infer<typeof reviewValueSchema>

/**
 * Multi-mode review schema
 */
export const multiModeReviewSchema = z.object({
  id: z.string(),
  talkId: z.string(),
  userId: z.string(),
  mode: reviewModeSchema,
  // Numeric value for sorting/aggregation
  numericValue: z.number().nullable(),
  // Additional data depending on mode
  starRating: starRatingSchema.nullable().default(null),
  yesNoValue: yesNoValueSchema.default(null),
  comparativeRank: comparativeRankSchema.nullable().default(null),
  comment: z.string().max(2000).optional(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type MultiModeReview = z.infer<typeof multiModeReviewSchema>

export const createMultiModeReviewSchema = multiModeReviewSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
})

export type CreateMultiModeReview = z.infer<typeof createMultiModeReviewSchema>

// ============================================================================
// Review Mode Helpers
// ============================================================================

/**
 * Get display label for a review mode
 */
export function getReviewModeLabel(mode: ReviewMode): string {
  return REVIEW_MODE_CONFIG[mode].name
}

/**
 * Get description for a review mode
 */
export function getReviewModeDescription(mode: ReviewMode): string {
  return REVIEW_MODE_CONFIG[mode].description
}

/**
 * Get available review modes
 */
export function getAvailableReviewModes(): Array<{
  value: ReviewMode
  label: string
  description: string
}> {
  return [
    {
      value: 'stars',
      label: REVIEW_MODE_CONFIG.stars.name,
      description: REVIEW_MODE_CONFIG.stars.description
    },
    {
      value: 'yes_no',
      label: REVIEW_MODE_CONFIG.yes_no.name,
      description: REVIEW_MODE_CONFIG.yes_no.description
    },
    {
      value: 'comparative',
      label: REVIEW_MODE_CONFIG.comparative.name,
      description: REVIEW_MODE_CONFIG.comparative.description
    }
  ]
}

// ============================================================================
// Star Rating Functions
// ============================================================================

/**
 * Get star rating label
 */
export function getStarRatingLabel(rating: StarRating): string {
  const labels: Record<StarRating, string> = {
    1: 'Poor',
    2: 'Fair',
    3: 'Good',
    4: 'Very Good',
    5: 'Excellent'
  }
  return labels[rating]
}

/**
 * Calculate average star rating
 */
export function calculateAverageStarRating(reviews: MultiModeReview[]): number | null {
  const starReviews = reviews.filter((r) => r.mode === 'stars' && r.starRating !== null)
  if (starReviews.length === 0) return null
  const sum = starReviews.reduce((acc, r) => acc + (r.starRating ?? 0), 0)
  return Math.round((sum / starReviews.length) * 10) / 10
}

// ============================================================================
// Yes/No Functions
// ============================================================================

/**
 * Get yes/no value label
 */
export function getYesNoLabel(value: YesNoValue): string {
  if (value === true) return 'Yes'
  if (value === false) return 'No'
  return 'Abstain'
}

/**
 * Calculate yes/no summary
 */
export function calculateYesNoSummary(reviews: MultiModeReview[]): {
  yes: number
  no: number
  abstain: number
  score: number | null
} {
  const yesNoReviews = reviews.filter((r) => r.mode === 'yes_no')
  const yes = yesNoReviews.filter((r) => r.yesNoValue === true).length
  const no = yesNoReviews.filter((r) => r.yesNoValue === false).length
  const abstain = yesNoReviews.filter((r) => r.yesNoValue === null).length
  const voted = yes + no
  const score = voted > 0 ? Math.round((yes / voted) * 100) : null

  return { yes, no, abstain, score }
}

// ============================================================================
// Comparative Ranking Functions
// ============================================================================

/**
 * Get comparative rank label
 */
export function getComparativeRankLabel(rank: ComparativeRank): string {
  if (rank >= 80) return 'Must Have'
  if (rank >= 60) return 'Strong Yes'
  if (rank >= 40) return 'Maybe'
  if (rank >= 20) return 'Weak'
  return 'Pass'
}

/**
 * Calculate average comparative rank
 */
export function calculateAverageComparativeRank(reviews: MultiModeReview[]): number | null {
  const comparativeReviews = reviews.filter(
    (r) => r.mode === 'comparative' && r.comparativeRank !== null
  )
  if (comparativeReviews.length === 0) return null
  const sum = comparativeReviews.reduce((acc, r) => acc + (r.comparativeRank ?? 0), 0)
  return Math.round(sum / comparativeReviews.length)
}

// ============================================================================
// Unified Scoring Functions
// ============================================================================

/**
 * Convert any review mode to a normalized numeric value (0-100)
 */
export function normalizeReviewValue(review: MultiModeReview): number | null {
  switch (review.mode) {
    case 'stars': {
      if (review.starRating === null) return null
      // Convert 1-5 to 0-100
      return Math.round(((review.starRating - 1) / 4) * 100)
    }
    case 'yes_no': {
      if (review.yesNoValue === null) return null
      // Yes = 100, No = 0
      return review.yesNoValue ? 100 : 0
    }
    case 'comparative': {
      // Already 1-100
      return review.comparativeRank
    }
    default:
      return null
  }
}

/**
 * Calculate unified score across all review modes (0-100)
 */
export function calculateUnifiedScore(reviews: MultiModeReview[]): number | null {
  const normalizedValues = reviews.map(normalizeReviewValue).filter((v): v is number => v !== null)

  if (normalizedValues.length === 0) return null
  const sum = normalizedValues.reduce((acc, v) => acc + v, 0)
  return Math.round(sum / normalizedValues.length)
}

/**
 * Get display value for a review based on its mode
 */
export function getReviewDisplayValue(review: MultiModeReview): string {
  switch (review.mode) {
    case 'stars': {
      if (review.starRating === null) return '-'
      return `${review.starRating}/5`
    }
    case 'yes_no': {
      return getYesNoLabel(review.yesNoValue)
    }
    case 'comparative': {
      if (review.comparativeRank === null) return '-'
      return `${review.comparativeRank}/100`
    }
    default:
      return '-'
  }
}

/**
 * Get summary stats for a set of reviews
 */
export function getReviewSummary(reviews: MultiModeReview[]): {
  mode: ReviewMode | 'mixed'
  count: number
  displayValue: string
  score: number | null
} {
  if (reviews.length === 0) {
    return {
      mode: 'stars',
      count: 0,
      displayValue: 'No reviews',
      score: null
    }
  }

  const modes = new Set(reviews.map((r) => r.mode))
  const isMixed = modes.size > 1

  if (isMixed) {
    const score = calculateUnifiedScore(reviews)
    return {
      mode: 'mixed',
      count: reviews.length,
      displayValue: score !== null ? `${score}/100` : '-',
      score
    }
  }

  const mode = reviews[0].mode

  switch (mode) {
    case 'stars': {
      const avg = calculateAverageStarRating(reviews)
      return {
        mode,
        count: reviews.length,
        displayValue: avg !== null ? `${avg}/5` : '-',
        score: avg !== null ? Math.round(((avg - 1) / 4) * 100) : null
      }
    }
    case 'yes_no': {
      const summary = calculateYesNoSummary(reviews)
      return {
        mode,
        count: reviews.length,
        displayValue: `${summary.yes}Y/${summary.no}N`,
        score: summary.score
      }
    }
    case 'comparative': {
      const avg = calculateAverageComparativeRank(reviews)
      return {
        mode,
        count: reviews.length,
        displayValue: avg !== null ? `${avg}/100` : '-',
        score: avg
      }
    }
  }
}

/**
 * Validate that a review value is valid for its mode
 */
export function isValidReviewValue(mode: ReviewMode, value: unknown): boolean {
  switch (mode) {
    case 'stars': {
      return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 5
    }
    case 'yes_no': {
      return value === true || value === false || value === null
    }
    case 'comparative': {
      return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 100
    }
    default:
      return false
  }
}

/**
 * Create a review object from mode and value
 */
export function createReviewFromModeAndValue(
  mode: ReviewMode,
  value: unknown
): Pick<
  MultiModeReview,
  'mode' | 'numericValue' | 'starRating' | 'yesNoValue' | 'comparativeRank'
> {
  const base = {
    mode,
    numericValue: null as number | null,
    starRating: null as StarRating | null,
    yesNoValue: null as YesNoValue,
    comparativeRank: null as ComparativeRank | null
  }

  switch (mode) {
    case 'stars': {
      if (typeof value === 'number' && value >= 1 && value <= 5) {
        base.starRating = value as StarRating
        base.numericValue = value
      }
      break
    }
    case 'yes_no': {
      if (typeof value === 'boolean' || value === null) {
        base.yesNoValue = value as YesNoValue
        base.numericValue = value === true ? 1 : value === false ? 0 : null
      }
      break
    }
    case 'comparative': {
      if (typeof value === 'number' && value >= 1 && value <= 100) {
        base.comparativeRank = value as ComparativeRank
        base.numericValue = value
      }
      break
    }
  }

  return base
}
