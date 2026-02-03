import { describe, expect, it } from 'vitest'
import {
  type Review,
  calculateAverageRating,
  createReviewSchema,
  getRatingLabel,
  getUserReview,
  hasUserReviewed,
  reviewRatingSchema,
  reviewSchema,
  updateReviewSchema
} from './review'

describe('review domain', () => {
  describe('reviewRatingSchema', () => {
    it('should accept valid ratings 1-5', () => {
      for (let i = 1; i <= 5; i++) {
        expect(reviewRatingSchema.safeParse(i).success).toBe(true)
      }
    })

    it('should reject ratings below 1', () => {
      expect(reviewRatingSchema.safeParse(0).success).toBe(false)
      expect(reviewRatingSchema.safeParse(-1).success).toBe(false)
    })

    it('should reject ratings above 5', () => {
      expect(reviewRatingSchema.safeParse(6).success).toBe(false)
      expect(reviewRatingSchema.safeParse(10).success).toBe(false)
    })

    it('should reject non-integers', () => {
      expect(reviewRatingSchema.safeParse(3.5).success).toBe(false)
    })
  })

  describe('reviewSchema', () => {
    it('should validate a complete review', () => {
      const review = {
        id: 'review-1',
        talkId: 'talk-1',
        userId: 'user-1',
        rating: 4,
        comment: 'Great talk proposal',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      expect(reviewSchema.safeParse(review).success).toBe(true)
    })

    it('should accept review without comment', () => {
      const review = {
        id: 'review-1',
        talkId: 'talk-1',
        userId: 'user-1',
        rating: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      expect(reviewSchema.safeParse(review).success).toBe(true)
    })

    it('should reject review with comment exceeding 2000 characters', () => {
      const review = {
        id: 'review-1',
        talkId: 'talk-1',
        userId: 'user-1',
        rating: 4,
        comment: 'a'.repeat(2001),
        createdAt: new Date(),
        updatedAt: new Date()
      }

      expect(reviewSchema.safeParse(review).success).toBe(false)
    })
  })

  describe('createReviewSchema', () => {
    it('should validate creation data without id and timestamps', () => {
      const data = {
        talkId: 'talk-1',
        userId: 'user-1',
        rating: 5,
        comment: 'Excellent!'
      }

      expect(createReviewSchema.safeParse(data).success).toBe(true)
    })
  })

  describe('updateReviewSchema', () => {
    it('should allow partial updates', () => {
      expect(updateReviewSchema.safeParse({ rating: 4 }).success).toBe(true)
      expect(updateReviewSchema.safeParse({ comment: 'Updated comment' }).success).toBe(true)
      expect(updateReviewSchema.safeParse({}).success).toBe(true)
    })
  })

  describe('calculateAverageRating', () => {
    const createReview = (rating: number): Review => ({
      id: `review-${rating}`,
      talkId: 'talk-1',
      userId: `user-${rating}`,
      rating,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    it('should return null for empty reviews', () => {
      expect(calculateAverageRating([])).toBeNull()
    })

    it('should calculate average for single review', () => {
      expect(calculateAverageRating([createReview(4)])).toBe(4)
    })

    it('should calculate average for multiple reviews', () => {
      const reviews = [createReview(3), createReview(4), createReview(5)]
      expect(calculateAverageRating(reviews)).toBe(4)
    })

    it('should round to one decimal place', () => {
      const reviews = [createReview(3), createReview(4)]
      expect(calculateAverageRating(reviews)).toBe(3.5)
    })

    it('should handle complex averages', () => {
      const reviews = [createReview(1), createReview(2), createReview(3)]
      expect(calculateAverageRating(reviews)).toBe(2)
    })
  })

  describe('getRatingLabel', () => {
    it('should return correct label for each rating', () => {
      expect(getRatingLabel(1)).toBe('Poor')
      expect(getRatingLabel(2)).toBe('Fair')
      expect(getRatingLabel(3)).toBe('Good')
      expect(getRatingLabel(4)).toBe('Very Good')
      expect(getRatingLabel(5)).toBe('Excellent')
    })

    it('should round decimal ratings', () => {
      expect(getRatingLabel(3.4)).toBe('Good')
      expect(getRatingLabel(3.6)).toBe('Very Good')
    })

    it('should return empty string for out of range', () => {
      expect(getRatingLabel(0)).toBe('')
      expect(getRatingLabel(6)).toBe('')
    })
  })

  describe('hasUserReviewed', () => {
    const reviews: Review[] = [
      {
        id: 'review-1',
        talkId: 'talk-1',
        userId: 'user-1',
        rating: 4,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'review-2',
        talkId: 'talk-1',
        userId: 'user-2',
        rating: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    it('should return true if user has reviewed', () => {
      expect(hasUserReviewed(reviews, 'user-1')).toBe(true)
      expect(hasUserReviewed(reviews, 'user-2')).toBe(true)
    })

    it('should return false if user has not reviewed', () => {
      expect(hasUserReviewed(reviews, 'user-3')).toBe(false)
    })

    it('should return false for empty reviews', () => {
      expect(hasUserReviewed([], 'user-1')).toBe(false)
    })
  })

  describe('getUserReview', () => {
    const reviews: Review[] = [
      {
        id: 'review-1',
        talkId: 'talk-1',
        userId: 'user-1',
        rating: 4,
        comment: 'Good',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    it('should return user review if exists', () => {
      const review = getUserReview(reviews, 'user-1')
      expect(review).toBeDefined()
      expect(review?.rating).toBe(4)
    })

    it('should return undefined if user has not reviewed', () => {
      expect(getUserReview(reviews, 'user-2')).toBeUndefined()
    })
  })
})
