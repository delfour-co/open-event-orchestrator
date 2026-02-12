/**
 * Review Mode Domain Tests
 */

import { describe, expect, it } from 'vitest'
import {
  type MultiModeReview,
  calculateAverageComparativeRank,
  calculateAverageStarRating,
  calculateUnifiedScore,
  calculateYesNoSummary,
  createReviewFromModeAndValue,
  getAvailableReviewModes,
  getComparativeRankLabel,
  getReviewDisplayValue,
  getReviewModeDescription,
  getReviewModeLabel,
  getReviewSummary,
  getStarRatingLabel,
  getYesNoLabel,
  isValidReviewValue,
  normalizeReviewValue
} from './review-mode'

// Test fixtures
const createReview = (overrides?: Partial<MultiModeReview>): MultiModeReview => ({
  id: 'review-1',
  talkId: 'talk-1',
  userId: 'user-1',
  mode: 'stars',
  numericValue: 4,
  starRating: 4,
  yesNoValue: null,
  comparativeRank: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
})

describe('Review Mode Configuration', () => {
  describe('getAvailableReviewModes', () => {
    it('should return all three review modes', () => {
      const modes = getAvailableReviewModes()

      expect(modes).toHaveLength(3)
      expect(modes.map((m) => m.value)).toContain('stars')
      expect(modes.map((m) => m.value)).toContain('yes_no')
      expect(modes.map((m) => m.value)).toContain('comparative')
    })

    it('should include labels and descriptions', () => {
      const modes = getAvailableReviewModes()

      for (const mode of modes) {
        expect(mode.label).toBeTruthy()
        expect(mode.description).toBeTruthy()
      }
    })
  })

  describe('getReviewModeLabel', () => {
    it('should return Star Rating for stars mode', () => {
      expect(getReviewModeLabel('stars')).toBe('Star Rating')
    })

    it('should return Yes/No for yes_no mode', () => {
      expect(getReviewModeLabel('yes_no')).toBe('Yes/No')
    })

    it('should return Comparative Ranking for comparative mode', () => {
      expect(getReviewModeLabel('comparative')).toBe('Comparative Ranking')
    })
  })

  describe('getReviewModeDescription', () => {
    it('should return description for each mode', () => {
      expect(getReviewModeDescription('stars')).toContain('1 to 5 stars')
      expect(getReviewModeDescription('yes_no')).toContain('binary')
      expect(getReviewModeDescription('comparative').toLowerCase()).toContain('rank')
    })
  })
})

describe('Star Rating Functions', () => {
  describe('getStarRatingLabel', () => {
    it('should return Poor for rating 1', () => {
      expect(getStarRatingLabel(1)).toBe('Poor')
    })

    it('should return Fair for rating 2', () => {
      expect(getStarRatingLabel(2)).toBe('Fair')
    })

    it('should return Good for rating 3', () => {
      expect(getStarRatingLabel(3)).toBe('Good')
    })

    it('should return Very Good for rating 4', () => {
      expect(getStarRatingLabel(4)).toBe('Very Good')
    })

    it('should return Excellent for rating 5', () => {
      expect(getStarRatingLabel(5)).toBe('Excellent')
    })
  })

  describe('calculateAverageStarRating', () => {
    it('should calculate average from star reviews', () => {
      const reviews = [
        createReview({ starRating: 4 }),
        createReview({ starRating: 5 }),
        createReview({ starRating: 3 })
      ]

      expect(calculateAverageStarRating(reviews)).toBe(4)
    })

    it('should return null for empty reviews', () => {
      expect(calculateAverageStarRating([])).toBeNull()
    })

    it('should ignore non-star reviews', () => {
      const reviews = [
        createReview({ starRating: 5 }),
        createReview({ mode: 'yes_no', starRating: null, yesNoValue: true })
      ]

      expect(calculateAverageStarRating(reviews)).toBe(5)
    })

    it('should round to one decimal place', () => {
      const reviews = [
        createReview({ starRating: 4 }),
        createReview({ starRating: 4 }),
        createReview({ starRating: 5 })
      ]

      expect(calculateAverageStarRating(reviews)).toBe(4.3)
    })
  })
})

describe('Yes/No Functions', () => {
  describe('getYesNoLabel', () => {
    it('should return Yes for true', () => {
      expect(getYesNoLabel(true)).toBe('Yes')
    })

    it('should return No for false', () => {
      expect(getYesNoLabel(false)).toBe('No')
    })

    it('should return Abstain for null', () => {
      expect(getYesNoLabel(null)).toBe('Abstain')
    })
  })

  describe('calculateYesNoSummary', () => {
    it('should count yes, no, and abstain votes', () => {
      const reviews = [
        createReview({ mode: 'yes_no', yesNoValue: true }),
        createReview({ mode: 'yes_no', yesNoValue: true }),
        createReview({ mode: 'yes_no', yesNoValue: false }),
        createReview({ mode: 'yes_no', yesNoValue: null })
      ]

      const summary = calculateYesNoSummary(reviews)

      expect(summary.yes).toBe(2)
      expect(summary.no).toBe(1)
      expect(summary.abstain).toBe(1)
    })

    it('should calculate score as percentage of yes votes', () => {
      const reviews = [
        createReview({ mode: 'yes_no', yesNoValue: true }),
        createReview({ mode: 'yes_no', yesNoValue: true }),
        createReview({ mode: 'yes_no', yesNoValue: false }),
        createReview({ mode: 'yes_no', yesNoValue: false })
      ]

      const summary = calculateYesNoSummary(reviews)

      expect(summary.score).toBe(50) // 2 yes / 4 votes = 50%
    })

    it('should return null score when no votes', () => {
      const reviews = [createReview({ mode: 'yes_no', yesNoValue: null })]

      const summary = calculateYesNoSummary(reviews)

      expect(summary.score).toBeNull()
    })

    it('should ignore non-yes_no reviews', () => {
      const reviews = [
        createReview({ mode: 'yes_no', yesNoValue: true }),
        createReview({ mode: 'stars', starRating: 5 })
      ]

      const summary = calculateYesNoSummary(reviews)

      expect(summary.yes).toBe(1)
      expect(summary.no).toBe(0)
    })
  })
})

describe('Comparative Ranking Functions', () => {
  describe('getComparativeRankLabel', () => {
    it('should return Must Have for 80+', () => {
      expect(getComparativeRankLabel(80)).toBe('Must Have')
      expect(getComparativeRankLabel(100)).toBe('Must Have')
    })

    it('should return Strong Yes for 60-79', () => {
      expect(getComparativeRankLabel(60)).toBe('Strong Yes')
      expect(getComparativeRankLabel(79)).toBe('Strong Yes')
    })

    it('should return Maybe for 40-59', () => {
      expect(getComparativeRankLabel(40)).toBe('Maybe')
      expect(getComparativeRankLabel(59)).toBe('Maybe')
    })

    it('should return Weak for 20-39', () => {
      expect(getComparativeRankLabel(20)).toBe('Weak')
      expect(getComparativeRankLabel(39)).toBe('Weak')
    })

    it('should return Pass for under 20', () => {
      expect(getComparativeRankLabel(19)).toBe('Pass')
      expect(getComparativeRankLabel(1)).toBe('Pass')
    })
  })

  describe('calculateAverageComparativeRank', () => {
    it('should calculate average from comparative reviews', () => {
      const reviews = [
        createReview({ mode: 'comparative', comparativeRank: 80 }),
        createReview({ mode: 'comparative', comparativeRank: 60 }),
        createReview({ mode: 'comparative', comparativeRank: 70 })
      ]

      expect(calculateAverageComparativeRank(reviews)).toBe(70)
    })

    it('should return null for empty reviews', () => {
      expect(calculateAverageComparativeRank([])).toBeNull()
    })

    it('should round to integer', () => {
      const reviews = [
        createReview({ mode: 'comparative', comparativeRank: 75 }),
        createReview({ mode: 'comparative', comparativeRank: 76 })
      ]

      expect(calculateAverageComparativeRank(reviews)).toBe(76) // 75.5 rounded
    })
  })
})

describe('Unified Scoring Functions', () => {
  describe('normalizeReviewValue', () => {
    it('should normalize star rating to 0-100', () => {
      expect(normalizeReviewValue(createReview({ mode: 'stars', starRating: 1 }))).toBe(0)
      expect(normalizeReviewValue(createReview({ mode: 'stars', starRating: 3 }))).toBe(50)
      expect(normalizeReviewValue(createReview({ mode: 'stars', starRating: 5 }))).toBe(100)
    })

    it('should normalize yes/no to 0 or 100', () => {
      expect(
        normalizeReviewValue(createReview({ mode: 'yes_no', yesNoValue: true, starRating: null }))
      ).toBe(100)
      expect(
        normalizeReviewValue(createReview({ mode: 'yes_no', yesNoValue: false, starRating: null }))
      ).toBe(0)
    })

    it('should return null for abstain', () => {
      expect(
        normalizeReviewValue(createReview({ mode: 'yes_no', yesNoValue: null, starRating: null }))
      ).toBeNull()
    })

    it('should return comparative rank as-is', () => {
      expect(
        normalizeReviewValue(
          createReview({ mode: 'comparative', comparativeRank: 75, starRating: null })
        )
      ).toBe(75)
    })
  })

  describe('calculateUnifiedScore', () => {
    it('should calculate unified score across different modes', () => {
      const reviews = [
        createReview({ mode: 'stars', starRating: 5 }), // 100
        createReview({ mode: 'yes_no', yesNoValue: true, starRating: null }), // 100
        createReview({ mode: 'comparative', comparativeRank: 80, starRating: null }) // 80
      ]

      expect(calculateUnifiedScore(reviews)).toBe(93) // (100+100+80)/3 = 93.33 rounded
    })

    it('should return null for empty reviews', () => {
      expect(calculateUnifiedScore([])).toBeNull()
    })

    it('should skip null values', () => {
      const reviews = [
        createReview({ mode: 'stars', starRating: 5 }),
        createReview({ mode: 'yes_no', yesNoValue: null, starRating: null })
      ]

      expect(calculateUnifiedScore(reviews)).toBe(100)
    })
  })
})

describe('Review Display Functions', () => {
  describe('getReviewDisplayValue', () => {
    it('should display star rating', () => {
      expect(getReviewDisplayValue(createReview({ mode: 'stars', starRating: 4 }))).toBe('4/5')
    })

    it('should display yes/no value', () => {
      expect(
        getReviewDisplayValue(createReview({ mode: 'yes_no', yesNoValue: true, starRating: null }))
      ).toBe('Yes')
      expect(
        getReviewDisplayValue(createReview({ mode: 'yes_no', yesNoValue: false, starRating: null }))
      ).toBe('No')
    })

    it('should display comparative rank', () => {
      expect(
        getReviewDisplayValue(
          createReview({ mode: 'comparative', comparativeRank: 75, starRating: null })
        )
      ).toBe('75/100')
    })

    it('should return dash for null values', () => {
      expect(
        getReviewDisplayValue(
          createReview({ mode: 'stars', starRating: null as unknown as number })
        )
      ).toBe('-')
    })
  })

  describe('getReviewSummary', () => {
    it('should return summary for star reviews', () => {
      const reviews = [createReview({ starRating: 4 }), createReview({ starRating: 5 })]

      const summary = getReviewSummary(reviews)

      expect(summary.mode).toBe('stars')
      expect(summary.count).toBe(2)
      expect(summary.displayValue).toBe('4.5/5')
    })

    it('should return summary for yes/no reviews', () => {
      const reviews = [
        createReview({ mode: 'yes_no', yesNoValue: true, starRating: null }),
        createReview({ mode: 'yes_no', yesNoValue: false, starRating: null })
      ]

      const summary = getReviewSummary(reviews)

      expect(summary.mode).toBe('yes_no')
      expect(summary.displayValue).toBe('1Y/1N')
    })

    it('should return mixed mode for different review types', () => {
      const reviews = [
        createReview({ mode: 'stars', starRating: 5 }),
        createReview({ mode: 'yes_no', yesNoValue: true, starRating: null })
      ]

      const summary = getReviewSummary(reviews)

      expect(summary.mode).toBe('mixed')
    })

    it('should return default summary for empty reviews', () => {
      const summary = getReviewSummary([])

      expect(summary.count).toBe(0)
      expect(summary.displayValue).toBe('No reviews')
    })
  })
})

describe('Review Validation', () => {
  describe('isValidReviewValue', () => {
    it('should validate star ratings', () => {
      expect(isValidReviewValue('stars', 1)).toBe(true)
      expect(isValidReviewValue('stars', 5)).toBe(true)
      expect(isValidReviewValue('stars', 0)).toBe(false)
      expect(isValidReviewValue('stars', 6)).toBe(false)
      expect(isValidReviewValue('stars', 3.5)).toBe(false)
    })

    it('should validate yes/no values', () => {
      expect(isValidReviewValue('yes_no', true)).toBe(true)
      expect(isValidReviewValue('yes_no', false)).toBe(true)
      expect(isValidReviewValue('yes_no', null)).toBe(true)
      expect(isValidReviewValue('yes_no', 'yes')).toBe(false)
    })

    it('should validate comparative ranks', () => {
      expect(isValidReviewValue('comparative', 1)).toBe(true)
      expect(isValidReviewValue('comparative', 100)).toBe(true)
      expect(isValidReviewValue('comparative', 0)).toBe(false)
      expect(isValidReviewValue('comparative', 101)).toBe(false)
      expect(isValidReviewValue('comparative', 50.5)).toBe(false)
    })
  })

  describe('createReviewFromModeAndValue', () => {
    it('should create star review data', () => {
      const data = createReviewFromModeAndValue('stars', 4)

      expect(data.mode).toBe('stars')
      expect(data.starRating).toBe(4)
      expect(data.numericValue).toBe(4)
      expect(data.yesNoValue).toBeNull()
      expect(data.comparativeRank).toBeNull()
    })

    it('should create yes/no review data', () => {
      const data = createReviewFromModeAndValue('yes_no', true)

      expect(data.mode).toBe('yes_no')
      expect(data.yesNoValue).toBe(true)
      expect(data.numericValue).toBe(1)
      expect(data.starRating).toBeNull()
    })

    it('should create comparative review data', () => {
      const data = createReviewFromModeAndValue('comparative', 75)

      expect(data.mode).toBe('comparative')
      expect(data.comparativeRank).toBe(75)
      expect(data.numericValue).toBe(75)
      expect(data.starRating).toBeNull()
    })

    it('should handle null yes/no value', () => {
      const data = createReviewFromModeAndValue('yes_no', null)

      expect(data.yesNoValue).toBeNull()
      expect(data.numericValue).toBeNull()
    })
  })
})
