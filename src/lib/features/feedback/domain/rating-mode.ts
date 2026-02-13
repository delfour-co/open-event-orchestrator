import { z } from 'zod'

/**
 * Available rating modes for session feedback
 */
export const ratingModeSchema = z.enum(['stars', 'scale_10', 'thumbs', 'yes_no'])

export type RatingMode = z.infer<typeof ratingModeSchema>

/**
 * Rating mode configuration
 */
export const RATING_MODE_CONFIG = {
	stars: {
		name: '5 Stars',
		description: 'Rate from 1 to 5 stars',
		minValue: 1,
		maxValue: 5,
		icon: '⭐',
		labels: ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent']
	},
	scale_10: {
		name: '10 Point Scale',
		description: 'Rate from 1 to 10',
		minValue: 1,
		maxValue: 10,
		icon: '🔢',
		labels: []
	},
	thumbs: {
		name: 'Thumbs Up/Down',
		description: 'Simple thumbs up or thumbs down',
		minValue: 0,
		maxValue: 1,
		icon: '👍',
		labels: ['Down', 'Up']
	},
	yes_no: {
		name: 'Yes/No',
		description: 'Did you enjoy this session?',
		minValue: 0,
		maxValue: 1,
		icon: '✓',
		labels: ['No', 'Yes']
	}
} as const

/**
 * Get display label for a rating mode
 */
export function getRatingModeLabel(mode: RatingMode): string {
	return RATING_MODE_CONFIG[mode].name
}

/**
 * Get description for a rating mode
 */
export function getRatingModeDescription(mode: RatingMode): string {
	return RATING_MODE_CONFIG[mode].description
}

/**
 * Get available rating modes for configuration
 */
export function getAvailableRatingModes(): Array<{
	value: RatingMode
	label: string
	description: string
}> {
	return [
		{
			value: 'stars',
			label: RATING_MODE_CONFIG.stars.name,
			description: RATING_MODE_CONFIG.stars.description
		},
		{
			value: 'scale_10',
			label: RATING_MODE_CONFIG.scale_10.name,
			description: RATING_MODE_CONFIG.scale_10.description
		},
		{
			value: 'thumbs',
			label: RATING_MODE_CONFIG.thumbs.name,
			description: RATING_MODE_CONFIG.thumbs.description
		},
		{
			value: 'yes_no',
			label: RATING_MODE_CONFIG.yes_no.name,
			description: RATING_MODE_CONFIG.yes_no.description
		}
	]
}

/**
 * Validate a rating value for a specific mode
 */
export function isValidRating(mode: RatingMode, value: number): boolean {
	const config = RATING_MODE_CONFIG[mode]
	return (
		Number.isInteger(value) && value >= config.minValue && value <= config.maxValue
	)
}

/**
 * Get display text for a rating value
 */
export function getRatingDisplayText(mode: RatingMode, value: number): string {
	const config = RATING_MODE_CONFIG[mode]

	switch (mode) {
		case 'stars':
			return config.labels[value - 1] || `${value}/5`
		case 'scale_10':
			return `${value}/10`
		case 'thumbs':
			return value === 1 ? '👍' : '👎'
		case 'yes_no':
			return value === 1 ? 'Yes' : 'No'
	}
}

/**
 * Normalize rating to 0-100 scale for aggregation
 */
export function normalizeRating(mode: RatingMode, value: number): number {
	const config = RATING_MODE_CONFIG[mode]
	const range = config.maxValue - config.minValue
	return Math.round(((value - config.minValue) / range) * 100)
}

/**
 * Calculate average rating across multiple feedbacks
 */
export function calculateAverageRating(
	mode: RatingMode,
	ratings: number[]
): number | null {
	if (ratings.length === 0) return null

	const sum = ratings.reduce((acc, val) => acc + val, 0)
	const avg = sum / ratings.length

	// Round based on mode
	if (mode === 'stars') {
		return Math.round(avg * 10) / 10 // One decimal
	}
	return Math.round(avg)
}
