import { calculateFeedbackSummary } from '$lib/features/feedback/domain/session-feedback'
import { error } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params, locals }) => {
  const { editionSlug } = params

  const editions = await locals.pb.collection('editions').getList(1, 1, {
    filter: `slug = "${editionSlug}"`
  })

  if (editions.items.length === 0) {
    throw error(404, 'Edition not found')
  }

  const edition = editions.items[0]
  const editionId = edition.id as string

  // Load feedback settings
  let feedbackEnabled = false
  try {
    const settings = await locals.pb.collection('feedback_settings').getList(1, 1, {
      filter: `editionId = "${editionId}"`
    })
    if (settings.items.length > 0) {
      feedbackEnabled =
        (settings.items[0].sessionRatingEnabled as boolean) ||
        (settings.items[0].eventFeedbackEnabled as boolean)
    }
  } catch {
    // Settings might not exist yet
  }

  // Load all session feedback for this edition
  const sessionFeedbackRecords = await locals.pb.collection('session_feedback').getFullList({
    filter: `editionId = "${editionId}"`,
    sort: '-created'
  })

  // Load sessions to get names
  const sessionIds = [...new Set(sessionFeedbackRecords.map((f) => f.sessionId as string))]
  const sessionMap = new Map<string, { title: string; speakerName: string }>()

  for (const sessionId of sessionIds) {
    try {
      const session = await locals.pb.collection('sessions').getOne(sessionId, {
        expand: 'talkId'
      })
      const talk = session.expand?.talkId as { title?: string; speakerName?: string } | undefined
      sessionMap.set(sessionId, {
        title: (talk?.title as string) || (session.title as string) || 'Untitled Session',
        speakerName: (talk?.speakerName as string) || ''
      })
    } catch {
      sessionMap.set(sessionId, { title: 'Unknown Session', speakerName: '' })
    }
  }

  // Group feedback by session and calculate summaries
  const feedbackBySession = new Map<string, typeof sessionFeedbackRecords>()
  for (const record of sessionFeedbackRecords) {
    const sid = record.sessionId as string
    if (!feedbackBySession.has(sid)) {
      feedbackBySession.set(sid, [])
    }
    feedbackBySession.get(sid)?.push(record)
  }

  const sessionSummaries = sessionIds.map((sessionId) => {
    const feedback = feedbackBySession.get(sessionId) || []
    const mapped = feedback.map((f) => ({
      id: f.id as string,
      sessionId: f.sessionId as string,
      editionId: f.editionId as string,
      userId: f.userId as string,
      ratingMode: f.ratingMode as 'stars' | 'scale_10' | 'thumbs' | 'yes_no',
      numericValue: f.numericValue as number | null,
      comment: f.comment as string | undefined,
      createdAt: new Date(f.created as string),
      updatedAt: new Date(f.updated as string)
    }))
    const summary = calculateFeedbackSummary(mapped)
    const session = sessionMap.get(sessionId)
    return {
      sessionId,
      title: session?.title || 'Unknown',
      speakerName: session?.speakerName || '',
      totalFeedback: summary?.totalFeedback || 0,
      averageRating: summary?.averageRating || null,
      ratingDistribution: summary?.ratingDistribution || {},
      hasComments: summary?.hasComments || false,
      comments: mapped
        .filter((f) => f.comment && f.comment.trim().length > 0)
        .map((f) => ({
          comment: f.comment || '',
          rating: f.numericValue,
          createdAt: f.createdAt.toISOString()
        }))
    }
  })

  // Sort by total feedback descending
  sessionSummaries.sort((a, b) => b.totalFeedback - a.totalFeedback)

  // Load event feedback
  const eventFeedbackRecords = await locals.pb.collection('event_feedback').getFullList({
    filter: `editionId = "${editionId}"`,
    sort: '-created'
  })

  const eventFeedback = eventFeedbackRecords.map((f) => ({
    id: f.id as string,
    feedbackType: f.feedbackType as 'general' | 'problem',
    subject: f.subject as string | undefined,
    message: f.message as string,
    status: f.status as 'open' | 'acknowledged' | 'resolved' | 'closed',
    createdAt: (f.created as string) || ''
  }))

  return {
    edition: {
      id: editionId,
      name: edition.name as string,
      slug: editionSlug
    },
    feedbackEnabled,
    sessionSummaries,
    eventFeedback,
    totalSessionFeedback: sessionFeedbackRecords.length,
    totalEventFeedback: eventFeedbackRecords.length
  }
}

export const actions: Actions = {
  updateStatus: async ({ request, locals }) => {
    const formData = await request.formData()
    const feedbackId = formData.get('feedbackId') as string
    const status = formData.get('status') as string

    if (!feedbackId || !status) {
      return { success: false }
    }

    await locals.pb.collection('event_feedback').update(feedbackId, { status })
    return { success: true }
  }
}
