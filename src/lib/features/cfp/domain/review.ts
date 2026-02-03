import { z } from 'zod'

export const reviewRatingSchema = z.number().int().min(1).max(5)

export type ReviewRating = z.infer<typeof reviewRatingSchema>

export const reviewSchema = z.object({
  id: z.string(),
  talkId: z.string(),
  userId: z.string(),
  rating: reviewRatingSchema,
  comment: z.string().max(2000).optional(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type Review = z.infer<typeof reviewSchema>

export const createReviewSchema = reviewSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
})

export type CreateReview = z.infer<typeof createReviewSchema>

export const updateReviewSchema = createReviewSchema.partial().omit({
  talkId: true,
  userId: true
})

export type UpdateReview = z.infer<typeof updateReviewSchema>

export const calculateAverageRating = (reviews: Review[]): number | null => {
  if (reviews.length === 0) return null
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0)
  return Math.round((sum / reviews.length) * 10) / 10
}

export const getRatingLabel = (rating: number): string => {
  const labels: Record<number, string> = {
    1: 'Poor',
    2: 'Fair',
    3: 'Good',
    4: 'Very Good',
    5: 'Excellent'
  }
  return labels[Math.round(rating)] || ''
}

export const hasUserReviewed = (reviews: Review[], userId: string): boolean => {
  return reviews.some((r) => r.userId === userId)
}

export const getUserReview = (reviews: Review[], userId: string): Review | undefined => {
  return reviews.find((r) => r.userId === userId)
}
