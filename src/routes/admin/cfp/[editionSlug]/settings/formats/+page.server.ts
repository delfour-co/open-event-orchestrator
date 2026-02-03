import { createFormatRepository } from '$lib/features/cfp/infra'
import { fail } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ parent }) => {
  const { edition, formats } = await parent()
  return { edition, formats }
}

async function getEditionId(locals: App.Locals, editionSlug: string): Promise<string> {
  const editions = await locals.pb.collection('editions').getList(1, 1, {
    filter: `slug = "${editionSlug}"`
  })
  if (editions.items.length === 0) {
    throw new Error('Edition not found')
  }
  return editions.items[0].id
}

export const actions: Actions = {
  create: async ({ request, locals, params }) => {
    const formData = await request.formData()

    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const duration = Number.parseInt(formData.get('durationMinutes') as string, 10)

    if (!name || name.trim().length < 2) {
      return fail(400, { error: 'Name must be at least 2 characters' })
    }

    if (Number.isNaN(duration) || duration < 5 || duration > 480) {
      return fail(400, { error: 'Duration must be between 5 and 480 minutes' })
    }

    const formatRepo = createFormatRepository(locals.pb)

    try {
      const editionId = await getEditionId(locals, params.editionSlug)
      const existingFormats = await formatRepo.findByEdition(editionId)

      await formatRepo.create({
        editionId,
        name: name.trim(),
        description: description?.trim() || undefined,
        duration,
        order: existingFormats.length
      })
      return { success: true, message: 'Format created' }
    } catch (err) {
      console.error('Failed to create format:', err)
      return fail(500, { error: 'Failed to create format' })
    }
  },

  update: async ({ request, locals }) => {
    const formData = await request.formData()

    const id = formData.get('id') as string
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const duration = Number.parseInt(formData.get('durationMinutes') as string, 10)

    if (!id) {
      return fail(400, { error: 'Format ID is required' })
    }

    if (!name || name.trim().length < 2) {
      return fail(400, { error: 'Name must be at least 2 characters' })
    }

    if (Number.isNaN(duration) || duration < 5 || duration > 480) {
      return fail(400, { error: 'Duration must be between 5 and 480 minutes' })
    }

    const formatRepo = createFormatRepository(locals.pb)

    try {
      await formatRepo.update(id, {
        name: name.trim(),
        description: description?.trim() || undefined,
        duration
      })
      return { success: true, message: 'Format updated' }
    } catch (err) {
      console.error('Failed to update format:', err)
      return fail(500, { error: 'Failed to update format' })
    }
  },

  delete: async ({ request, locals }) => {
    const formData = await request.formData()
    const id = formData.get('id') as string

    if (!id) {
      return fail(400, { error: 'Format ID is required' })
    }

    const formatRepo = createFormatRepository(locals.pb)

    try {
      await formatRepo.delete(id)
      return { success: true, message: 'Format deleted' }
    } catch (err) {
      console.error('Failed to delete format:', err)
      return fail(500, { error: 'Failed to delete format. It may be in use by talks.' })
    }
  }
}
