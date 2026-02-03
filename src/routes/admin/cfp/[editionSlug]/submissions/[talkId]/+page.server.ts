import type { TalkStatus } from '$lib/features/cfp/domain'
import { createSpeakerRepository, createTalkRepository } from '$lib/features/cfp/infra'
import { error, fail, redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ parent, params, locals }) => {
  const { edition, categories, formats } = await parent()

  const talkRepo = createTalkRepository(locals.pb)
  const speakerRepo = createSpeakerRepository(locals.pb)

  const talk = await talkRepo.findById(params.talkId)

  if (!talk) {
    throw error(404, 'Talk not found')
  }

  if (talk.editionId !== edition.id) {
    throw error(404, 'Talk not found in this edition')
  }

  const speakers = await speakerRepo.findByIds(talk.speakerIds)

  return {
    edition,
    categories,
    formats,
    talk: {
      ...talk,
      category: categories.find((c) => c.id === talk.categoryId),
      format: formats.find((f) => f.id === talk.formatId)
    },
    speakers
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

  delete: async ({ locals, params }) => {
    const talkRepo = createTalkRepository(locals.pb)

    try {
      await talkRepo.delete(params.talkId)
    } catch (err) {
      console.error('Failed to delete talk:', err)
      return fail(500, { error: 'Failed to delete talk' })
    }

    // Find edition slug to redirect back to submissions
    const editions = await locals.pb.collection('editions').getList(1, 1, {
      filter: `slug = "${params.editionSlug}"`
    })

    if (editions.items.length > 0) {
      throw redirect(303, `/admin/cfp/${params.editionSlug}/submissions`)
    }

    throw redirect(303, '/admin/cfp')
  }
}
