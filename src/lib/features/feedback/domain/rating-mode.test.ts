import { describe, expect, it } from 'vitest'
import {
  RATING_MODE_CONFIG,
  calculateAverageRating,
  getRatingDisplayText,
  isValidRating,
  normalizeRating
} from './rating-mode'

describe('Rating Mode', () => {
  describe('isValidRating', () => {
    it('should validate stars rating (1-5)', () => {
      expect(isValidRating('stars', 1)).toBe(true)
      expect(isValidRating('stars', 3)).toBe(true)
      expect(isValidRating('stars', 5)).toBe(true)
      expect(isValidRating('stars', 0)).toBe(false)
      expect(isValidRating('stars', 6)).toBe(false)
      expect(isValidRating('stars', 2.5)).toBe(false)
    })

    it('should validate scale_10 rating (1-10)', () => {
      expect(isValidRating('scale_10', 1)).toBe(true)
      expect(isValidRating('scale_10', 10)).toBe(true)
      expect(isValidRating('scale_10', 0)).toBe(false)
      expect(isValidRating('scale_10', 11)).toBe(false)
    })

    it('should validate thumbs rating (0-1)', () => {
      expect(isValidRating('thumbs', 0)).toBe(true)
      expect(isValidRating('thumbs', 1)).toBe(true)
      expect(isValidRating('thumbs', 2)).toBe(false)
    })

    it('should validate yes_no rating (0-1)', () => {
      expect(isValidRating('yes_no', 0)).toBe(true)
      expect(isValidRating('yes_no', 1)).toBe(true)
      expect(isValidRating('yes_no', 2)).toBe(false)
    })
  })

  describe('getRatingDisplayText', () => {
    it('should return label for stars', () => {
      expect(getRatingDisplayText('stars', 1)).toBe('Poor')
      expect(getRatingDisplayText('stars', 5)).toBe('Excellent')
    })

    it('should return formatted text for scale_10', () => {
      expect(getRatingDisplayText('scale_10', 7)).toBe('7/10')
    })

    it('should return emoji for thumbs', () => {
      expect(getRatingDisplayText('thumbs', 0)).toBe('👎')
      expect(getRatingDisplayText('thumbs', 1)).toBe('👍')
    })

    it('should return yes/no for yes_no', () => {
      expect(getRatingDisplayText('yes_no', 0)).toBe('No')
      expect(getRatingDisplayText('yes_no', 1)).toBe('Yes')
    })
  })

  describe('normalizeRating', () => {
    it('should normalize stars to 0-100', () => {
      expect(normalizeRating('stars', 1)).toBe(0)
      expect(normalizeRating('stars', 3)).toBe(50)
      expect(normalizeRating('stars', 5)).toBe(100)
    })

    it('should normalize scale_10 to 0-100', () => {
      expect(normalizeRating('scale_10', 1)).toBe(0)
      expect(normalizeRating('scale_10', 5)).toBe(44)
      expect(normalizeRating('scale_10', 10)).toBe(100)
    })

    it('should normalize thumbs to 0-100', () => {
      expect(normalizeRating('thumbs', 0)).toBe(0)
      expect(normalizeRating('thumbs', 1)).toBe(100)
    })

    it('should normalize yes_no to 0-100', () => {
      expect(normalizeRating('yes_no', 0)).toBe(0)
      expect(normalizeRating('yes_no', 1)).toBe(100)
    })
  })

  describe('calculateAverageRating', () => {
    it('should calculate average for stars', () => {
      const avg = calculateAverageRating('stars', [4, 5, 3, 4, 5])
      expect(avg).toBe(4.2)
    })

    it('should calculate average for scale_10', () => {
      const avg = calculateAverageRating('scale_10', [7, 8, 9, 8])
      expect(avg).toBe(8)
    })

    it('should return null for empty array', () => {
      expect(calculateAverageRating('stars', [])).toBe(null)
    })

    it('should round properly for integers', () => {
      const avg = calculateAverageRating('scale_10', [7, 8])
      expect(avg).toBe(8) // 7.5 rounds to 8
    })
  })

  describe('RATING_MODE_CONFIG', () => {
    it('should have correct configuration for all modes', () => {
      expect(RATING_MODE_CONFIG.stars.minValue).toBe(1)
      expect(RATING_MODE_CONFIG.stars.maxValue).toBe(5)
      expect(RATING_MODE_CONFIG.stars.labels).toHaveLength(5)

      expect(RATING_MODE_CONFIG.scale_10.minValue).toBe(1)
      expect(RATING_MODE_CONFIG.scale_10.maxValue).toBe(10)

      expect(RATING_MODE_CONFIG.thumbs.minValue).toBe(0)
      expect(RATING_MODE_CONFIG.thumbs.maxValue).toBe(1)

      expect(RATING_MODE_CONFIG.yes_no.minValue).toBe(0)
      expect(RATING_MODE_CONFIG.yes_no.maxValue).toBe(1)
    })
  })
})
