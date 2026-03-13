import { EventFeedbackRepository, FeedbackSettingsRepository } from '$lib/features/feedback/infra'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

interface EventFeedbackRequest {
  editionId: string
  userId: string
  feedbackType: 'general' | 'problem'
  numericValue?: number | null
  message: string
}

export const POST: RequestHandler = async ({ request, locals }) => {
  const body = (await request.json()) as EventFeedbackRequest
  const { editionId, userId, feedbackType, numericValue, message } = body

  if (!editionId) {
    return json({ success: false, error: 'editionId is required' }, { status: 400 })
  }

  if (!userId) {
    return json({ success: false, error: 'userId is required' }, { status: 400 })
  }

  if (!feedbackType || !['general', 'problem'].includes(feedbackType)) {
    return json(
      { success: false, error: 'feedbackType must be "general" or "problem"' },
      { status: 400 }
    )
  }

  if (!message || message.trim().length === 0) {
    return json({ success: false, error: 'message is required' }, { status: 400 })
  }

  if (message.length > 5000) {
    return json(
      { success: false, error: 'message must be 5000 characters or less' },
      { status: 400 }
    )
  }

  if (numericValue !== undefined && numericValue !== null) {
    if (numericValue < 1 || numericValue > 5 || !Number.isInteger(numericValue)) {
      return json(
        { success: false, error: 'numericValue must be an integer between 1 and 5' },
        { status: 400 }
      )
    }
  }

  try {
    // Get feedback settings for the edition
    const feedbackSettingsRepo = new FeedbackSettingsRepository(locals.pb)
    const settings = await feedbackSettingsRepo.getByEdition(editionId)

    if (!settings || !settings.eventFeedbackEnabled) {
      return json(
        { success: false, error: 'Event feedback is not enabled for this edition' },
        { status: 400 }
      )
    }

    // Verify edition exists
    try {
      await locals.pb.collection('editions').getOne(editionId)
    } catch {
      return json({ success: false, error: 'Edition not found' }, { status: 404 })
    }

    const eventFeedbackRepo = new EventFeedbackRepository(locals.pb)

    // Create feedback
    const feedback = await eventFeedbackRepo.create({
      editionId,
      userId,
      feedbackType,
      numericValue: numericValue ?? null,
      message: message.trim(),
      status: 'open'
    })

    return json({
      success: true,
      feedback: {
        id: feedback.id,
        feedbackType: feedback.feedbackType,
        numericValue: feedback.numericValue,
        message: feedback.message,
        status: feedback.status
      }
    })
  } catch (err) {
    console.error('Failed to submit event feedback:', err)
    return json({ success: false, error: 'Failed to submit feedback' }, { status: 500 })
  }
}
