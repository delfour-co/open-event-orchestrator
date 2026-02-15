import { isValidRating } from '$lib/features/feedback/domain/rating-mode'
import { FeedbackSettingsRepository, SessionFeedbackRepository } from '$lib/features/feedback/infra'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

interface SessionFeedbackRequest {
  sessionId: string
  editionId: string
  userId: string
  numericValue: number
  comment?: string
}

// GET: Retrieve user's existing feedback for an edition
export const GET: RequestHandler = async ({ url, locals }) => {
  const userId = url.searchParams.get('userId')
  const editionId = url.searchParams.get('editionId')

  if (!userId || !editionId) {
    return json({ success: false, error: 'userId and editionId are required' }, { status: 400 })
  }

  try {
    const sessionFeedbackRepo = new SessionFeedbackRepository(locals.pb)
    const feedbackList = await sessionFeedbackRepo.getUserFeedbackForEdition(userId, editionId)

    return json({
      success: true,
      feedback: feedbackList.map((f) => ({
        id: f.id,
        sessionId: f.sessionId,
        numericValue: f.numericValue,
        comment: f.comment
      }))
    })
  } catch (err) {
    console.error('Failed to get user feedback:', err)
    return json({ success: false, error: 'Failed to get feedback' }, { status: 500 })
  }
}

export const POST: RequestHandler = async ({ request, locals }) => {
  const body = (await request.json()) as SessionFeedbackRequest
  const { sessionId, editionId, userId, numericValue, comment } = body

  if (!sessionId) {
    return json({ success: false, error: 'sessionId is required' }, { status: 400 })
  }

  if (!editionId) {
    return json({ success: false, error: 'editionId is required' }, { status: 400 })
  }

  if (!userId) {
    return json({ success: false, error: 'userId is required' }, { status: 400 })
  }

  if (numericValue === undefined || numericValue === null) {
    return json({ success: false, error: 'numericValue is required' }, { status: 400 })
  }

  try {
    // Get feedback settings for the edition
    const feedbackSettingsRepo = new FeedbackSettingsRepository(locals.pb)
    const settings = await feedbackSettingsRepo.getByEdition(editionId)

    if (!settings || !settings.sessionRatingEnabled) {
      return json(
        { success: false, error: 'Session ratings are not enabled for this edition' },
        { status: 400 }
      )
    }

    // Validate rating value
    if (!isValidRating(settings.sessionRatingMode, numericValue)) {
      return json(
        { success: false, error: 'Invalid rating value for the configured rating mode' },
        { status: 400 }
      )
    }

    // Check if comment is required
    if (settings.sessionCommentRequired && (!comment || comment.trim().length === 0)) {
      return json(
        { success: false, error: 'A comment is required when submitting feedback' },
        { status: 400 }
      )
    }

    // Verify session exists
    try {
      await locals.pb.collection('sessions').getOne(sessionId)
    } catch {
      return json({ success: false, error: 'Session not found' }, { status: 404 })
    }

    const sessionFeedbackRepo = new SessionFeedbackRepository(locals.pb)

    // Check if user already submitted feedback for this session
    const existingFeedback = await sessionFeedbackRepo.getUserFeedbackForSession(userId, sessionId)

    if (existingFeedback) {
      // Update existing feedback
      const updated = await sessionFeedbackRepo.update({
        id: existingFeedback.id,
        numericValue,
        comment: comment?.trim()
      })

      return json({
        success: true,
        feedback: {
          id: updated.id,
          sessionId: updated.sessionId,
          numericValue: updated.numericValue,
          comment: updated.comment,
          isUpdate: true
        }
      })
    }

    // Create new feedback
    const feedback = await sessionFeedbackRepo.create({
      sessionId,
      editionId,
      userId,
      ratingMode: settings.sessionRatingMode,
      numericValue,
      comment: comment?.trim()
    })

    return json({
      success: true,
      feedback: {
        id: feedback.id,
        sessionId: feedback.sessionId,
        numericValue: feedback.numericValue,
        comment: feedback.comment,
        isUpdate: false
      }
    })
  } catch (err) {
    console.error('Failed to submit session feedback:', err)
    return json({ success: false, error: 'Failed to submit feedback' }, { status: 500 })
  }
}
