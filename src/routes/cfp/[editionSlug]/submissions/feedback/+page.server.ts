import { calculateFeedbackSummary } from '$lib/features/feedback/domain/session-feedback'
import { validateSpeakerToken } from '$lib/server/speaker-tokens'
import { getSpeakerToken } from '$lib/server/token-cookies'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ parent, url, locals, cookies, params }) => {
  const { edition } = await parent()

  // Token-based authentication (same pattern as submissions page)
  const token = getSpeakerToken(cookies, url, params.editionSlug)
  if (!token) {
    return { authenticated: false as const, edition }
  }

  const validation = await validateSpeakerToken(locals.pb, token, edition.id)
  if (!validation.valid || !validation.speakerId) {
    return { authenticated: false as const, edition }
  }

  const speakerId = validation.speakerId

  // Get speaker's talks
  const talks = await locals.pb.collection('talks').getFullList({
    filter: `speakerIds ~ "${speakerId}" && editionId = "${edition.id}"`
  })

  if (talks.length === 0) {
    return {
      authenticated: true as const,
      edition,
      sessions: [],
      totalFeedback: 0
    }
  }

  // Find sessions linked to speaker's talks
  const talkIds = talks.map((t) => t.id as string)
  const talkFilter = talkIds.map((id) => `talkId = "${id}"`).join(' || ')

  const sessions: Array<{
    id: string
    title: string
    talkId: string
    summary: {
      totalFeedback: number
      averageRating: number | null
      ratingDistribution: Record<number, number>
      hasComments: boolean
    } | null
    comments: Array<{
      comment: string
      rating: number | null
      createdAt: string
    }>
  }> = []

  try {
    const sessionRecords = await locals.pb.collection('sessions').getFullList({
      filter: talkFilter,
      expand: 'talkId'
    })

    let totalFeedback = 0

    for (const session of sessionRecords) {
      const talk = session.expand?.talkId as { title?: string } | undefined
      const sessionTitle =
        (talk?.title as string) || (session.title as string) || 'Untitled Session'

      // Load feedback for this session
      const feedbackRecords = await locals.pb.collection('session_feedback').getFullList({
        filter: `sessionId = "${session.id}"`,
        sort: '-created'
      })

      const mapped = feedbackRecords.map((f) => ({
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
      totalFeedback += feedbackRecords.length

      const comments = mapped
        .filter((f) => f.comment && f.comment.trim().length > 0)
        .map((f) => ({
          comment: f.comment || '',
          rating: f.numericValue,
          createdAt: f.createdAt.toISOString()
        }))

      sessions.push({
        id: session.id as string,
        title: sessionTitle,
        talkId: session.talkId as string,
        summary: summary
          ? {
              totalFeedback: summary.totalFeedback,
              averageRating: summary.averageRating,
              ratingDistribution: summary.ratingDistribution,
              hasComments: summary.hasComments
            }
          : null,
        comments
      })
    }

    // Sort by feedback count descending
    sessions.sort((a, b) => (b.summary?.totalFeedback || 0) - (a.summary?.totalFeedback || 0))

    return {
      authenticated: true as const,
      edition,
      sessions,
      totalFeedback
    }
  } catch {
    return {
      authenticated: true as const,
      edition,
      sessions: [],
      totalFeedback: 0
    }
  }
}
