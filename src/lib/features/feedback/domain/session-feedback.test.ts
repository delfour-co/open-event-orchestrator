import { describe, expect, it } from 'vitest'
import {
	calculateFeedbackSummary,
	getUserFeedback,
	hasUserSubmittedFeedback,
	type SessionFeedback
} from './session-feedback'

const mockFeedback: SessionFeedback[] = [
	{
		id: '1',
		sessionId: 'session1',
		userId: 'user1',
		ratingMode: 'stars',
		numericValue: 5,
		comment: 'Great session!',
		createdAt: new Date('2025-01-01'),
		updatedAt: new Date('2025-01-01')
	},
	{
		id: '2',
		sessionId: 'session1',
		userId: 'user2',
		ratingMode: 'stars',
		numericValue: 4,
		comment: undefined,
		createdAt: new Date('2025-01-01'),
		updatedAt: new Date('2025-01-01')
	},
	{
		id: '3',
		sessionId: 'session1',
		userId: 'user3',
		ratingMode: 'stars',
		numericValue: 5,
		comment: 'Excellent!',
		createdAt: new Date('2025-01-01'),
		updatedAt: new Date('2025-01-01')
	}
]

describe('Session Feedback', () => {
	describe('calculateFeedbackSummary', () => {
		it('should calculate summary statistics', () => {
			const summary = calculateFeedbackSummary(mockFeedback)

			expect(summary).not.toBe(null)
			expect(summary?.sessionId).toBe('session1')
			expect(summary?.totalFeedback).toBe(3)
			expect(summary?.averageRating).toBe(14 / 3) // (5+4+5)/3
			expect(summary?.hasComments).toBe(true)
		})

		it('should create rating distribution', () => {
			const summary = calculateFeedbackSummary(mockFeedback)

			expect(summary?.ratingDistribution[4]).toBe(1)
			expect(summary?.ratingDistribution[5]).toBe(2)
		})

		it('should return null for empty feedback', () => {
			const summary = calculateFeedbackSummary([])
			expect(summary).toBe(null)
		})

		it('should handle feedback without comments', () => {
			const feedbackNoComments: SessionFeedback[] = [
				{
					id: '1',
					sessionId: 'session1',
					userId: 'user1',
					ratingMode: 'stars',
					numericValue: 5,
					comment: undefined,
					createdAt: new Date(),
					updatedAt: new Date()
				}
			]

			const summary = calculateFeedbackSummary(feedbackNoComments)
			expect(summary?.hasComments).toBe(false)
		})

		it('should handle null numeric values', () => {
			const feedbackWithNulls: SessionFeedback[] = [
				{
					id: '1',
					sessionId: 'session1',
					userId: 'user1',
					ratingMode: 'stars',
					numericValue: null,
					comment: 'Comment only',
					createdAt: new Date(),
					updatedAt: new Date()
				},
				{
					id: '2',
					sessionId: 'session1',
					userId: 'user2',
					ratingMode: 'stars',
					numericValue: 5,
					comment: undefined,
					createdAt: new Date(),
					updatedAt: new Date()
				}
			]

			const summary = calculateFeedbackSummary(feedbackWithNulls)
			expect(summary?.averageRating).toBe(5)
			expect(summary?.totalFeedback).toBe(2)
		})
	})

	describe('hasUserSubmittedFeedback', () => {
		it('should return true if user has submitted feedback', () => {
			expect(hasUserSubmittedFeedback(mockFeedback, 'user1')).toBe(true)
			expect(hasUserSubmittedFeedback(mockFeedback, 'user2')).toBe(true)
		})

		it('should return false if user has not submitted feedback', () => {
			expect(hasUserSubmittedFeedback(mockFeedback, 'user999')).toBe(false)
		})

		it('should return false for empty feedback', () => {
			expect(hasUserSubmittedFeedback([], 'user1')).toBe(false)
		})
	})

	describe('getUserFeedback', () => {
		it('should return user feedback if exists', () => {
			const feedback = getUserFeedback(mockFeedback, 'user1')
			expect(feedback).not.toBe(null)
			expect(feedback?.id).toBe('1')
			expect(feedback?.userId).toBe('user1')
		})

		it('should return null if user has not submitted feedback', () => {
			const feedback = getUserFeedback(mockFeedback, 'user999')
			expect(feedback).toBe(null)
		})

		it('should return null for empty feedback', () => {
			const feedback = getUserFeedback([], 'user1')
			expect(feedback).toBe(null)
		})
	})
})
