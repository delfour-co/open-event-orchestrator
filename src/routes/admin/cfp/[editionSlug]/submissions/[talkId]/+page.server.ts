import type { TalkStatus } from '$lib/features/cfp/domain'
import {
  createCommentRepository,
  createReviewRepository,
  createSpeakerRepository,
  createTalkRepository
} from '$lib/features/cfp/infra'
import { error, fail, redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ parent, params, locals }) => {
  const { edition, categories, formats } = await parent()

  const talkRepo = createTalkRepository(locals.pb)
  const speakerRepo = createSpeakerRepository(locals.pb)
  const reviewRepo = createReviewRepository(locals.pb)
  const commentRepo = createCommentRepository(locals.pb)

  const talk = await talkRepo.findById(params.talkId)

  if (!talk) {
    throw error(404, 'Talk not found')
  }

  if (talk.editionId !== edition.id) {
    throw error(404, 'Talk not found in this edition')
  }

  const speakers = await speakerRepo.findByIds(talk.speakerIds)

  // Load reviews and comments
  const reviews = await reviewRepo.findByTalk(params.talkId)
  const ratingStats = await reviewRepo.getAverageRating(params.talkId)
  const comments = await commentRepo.findByTalk(params.talkId, true)

  // Get current user's review if exists
  const userId = locals.user?.id
  const userReview = userId ? reviews.find((r) => r.userId === userId) : undefined

  // Get user names for reviews and comments
  const userIds = [...new Set([...reviews.map((r) => r.userId), ...comments.map((c) => c.userId)])]

  const users = await Promise.all(
    userIds.map(async (id) => {
      try {
        const user = await locals.pb.collection('users').getOne(id)
        return { id, name: user.name as string, email: user.email as string }
      } catch {
        return { id, name: 'Unknown', email: '' }
      }
    })
  )
  const userMap = new Map(users.map((u) => [u.id, u]))

  return {
    edition,
    categories,
    formats,
    talk: {
      ...talk,
      category: categories.find((c) => c.id === talk.categoryId),
      format: formats.find((f) => f.id === talk.formatId)
    },
    speakers,
    reviews: reviews.map((r) => ({
      ...r,
      user: userMap.get(r.userId)
    })),
    ratingStats,
    userReview,
    comments: comments.map((c) => ({
      ...c,
      user: userMap.get(c.userId)
    })),
    currentUserId: userId
  }
}

export const actions: Actions = {
  updateStatus: async ({ request, locals, params }) => {
    const formData = await request.formData()
    const newStatus = formData.get('status') as TalkStatus

    if (!newStatus) {
      return fail(400, { error: 'Status is required' })
    }

    const talkRepo = createTalkRepository(locals.pb)

    try {
      await talkRepo.updateStatus(params.talkId, newStatus)
      return { success: true, message: `Status updated to ${newStatus}` }
    } catch (err) {
      console.error('Failed to update talk status:', err)
      return fail(500, { error: 'Failed to update status' })
    }
  },

  submitReview: async ({ request, locals, params }) => {
    if (!locals.user) {
      return fail(401, { error: 'You must be logged in to review' })
    }

    const formData = await request.formData()
    const rating = Number.parseInt(formData.get('rating') as string, 10)
    const comment = (formData.get('comment') as string) || undefined

    if (!rating || rating < 1 || rating > 5) {
      return fail(400, { reviewError: 'Rating must be between 1 and 5' })
    }

    const reviewRepo = createReviewRepository(locals.pb)

    try {
      await reviewRepo.upsert(params.talkId, locals.user.id, { rating, comment })
      return { reviewSuccess: true, message: 'Review submitted' }
    } catch (err) {
      console.error('Failed to submit review:', err)
      return fail(500, { reviewError: 'Failed to submit review' })
    }
  },

  addComment: async ({ request, locals, params }) => {
    if (!locals.user) {
      return fail(401, { error: 'You must be logged in to comment' })
    }

    const formData = await request.formData()
    const content = formData.get('content') as string

    if (!content || content.trim().length === 0) {
      return fail(400, { commentError: 'Comment cannot be empty' })
    }

    if (content.length > 5000) {
      return fail(400, { commentError: 'Comment is too long (max 5000 characters)' })
    }

    const commentRepo = createCommentRepository(locals.pb)

    try {
      await commentRepo.create({
        talkId: params.talkId,
        userId: locals.user.id,
        content: content.trim(),
        isInternal: true
      })
      return { commentSuccess: true, message: 'Comment added' }
    } catch (err) {
      console.error('Failed to add comment:', err)
      return fail(500, { commentError: 'Failed to add comment' })
    }
  },

  deleteComment: async ({ request, locals, params }) => {
    if (!locals.user) {
      return fail(401, { error: 'You must be logged in' })
    }

    const formData = await request.formData()
    const commentId = formData.get('commentId') as string

    if (!commentId) {
      return fail(400, { error: 'Comment ID is required' })
    }

    const commentRepo = createCommentRepository(locals.pb)

    // Verify ownership
    const comment = await commentRepo.findById(commentId)
    if (!comment || comment.userId !== locals.user.id) {
      return fail(403, { error: 'You can only delete your own comments' })
    }

    try {
      await commentRepo.delete(commentId)
      return { commentDeleted: true }
    } catch (err) {
      console.error('Failed to delete comment:', err)
      return fail(500, { error: 'Failed to delete comment' })
    }
  },

  delete: async ({ locals, params }) => {
    const talkRepo = createTalkRepository(locals.pb)

    try {
      await talkRepo.delete(params.talkId)
    } catch (err) {
      console.error('Failed to delete talk:', err)
      return fail(500, { error: 'Failed to delete talk' })
    }

    throw redirect(303, `/admin/cfp/${params.editionSlug}/submissions`)
  }
}
