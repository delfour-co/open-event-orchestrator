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

  // Load event feedback
  const eventFeedbackRecords = await locals.pb.collection('event_feedback').getFullList({
    filter: `editionId = "${editionId}"`,
    sort: '-created'
  })

  const eventFeedback = eventFeedbackRecords.map((f) => ({
    id: f.id as string,
    feedbackType: f.feedbackType as 'general' | 'problem',
    numericValue: (f.numericValue as number) ?? null,
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
    eventFeedback,
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
