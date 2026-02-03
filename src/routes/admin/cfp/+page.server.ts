import { fail } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
  // Get all editions (draft, published, archived)
  // In the future, this should be filtered by user's organizations
  const editions = await locals.pb.collection('editions').getFullList({
    sort: '-year'
  })

  return {
    editions: editions.map((e) => ({
      id: e.id as string,
      name: e.name as string,
      slug: e.slug as string,
      year: e.year as number,
      startDate: new Date(e.startDate as string),
      endDate: new Date(e.endDate as string),
      status: e.status as string
    }))
  }
}

export const actions: Actions = {
  updateStatus: async ({ request, locals }) => {
    const data = await request.formData()
    const editionId = data.get('editionId') as string
    const status = data.get('status') as string

    if (!editionId || !status) {
      return fail(400, { error: 'Edition ID and status are required' })
    }

    if (!['draft', 'published', 'archived'].includes(status)) {
      return fail(400, { error: 'Invalid status' })
    }

    try {
      await locals.pb.collection('editions').update(editionId, { status })
      return { success: true }
    } catch (e) {
      console.error('Failed to update edition status:', e)
      return fail(500, { error: 'Failed to update status' })
    }
  }
}
