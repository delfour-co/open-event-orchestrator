import { createCategoryRepository } from '$lib/features/cfp/infra'
import { fail } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ parent }) => {
  const { edition, categories } = await parent()
  return { edition, categories }
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
    const color = formData.get('color') as string

    if (!name || name.trim().length < 2) {
      return fail(400, { error: 'Name must be at least 2 characters' })
    }

    const categoryRepo = createCategoryRepository(locals.pb)

    try {
      const editionId = await getEditionId(locals, params.editionSlug)
      const existingCategories = await categoryRepo.findByEdition(editionId)

      await categoryRepo.create({
        editionId,
        name: name.trim(),
        description: description?.trim() || undefined,
        color: color || undefined,
        order: existingCategories.length
      })
      return { success: true, message: 'Category created' }
    } catch (err) {
      console.error('Failed to create category:', err)
      return fail(500, { error: 'Failed to create category' })
    }
  },

  update: async ({ request, locals }) => {
    const formData = await request.formData()

    const id = formData.get('id') as string
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const color = formData.get('color') as string

    if (!id) {
      return fail(400, { error: 'Category ID is required' })
    }

    if (!name || name.trim().length < 2) {
      return fail(400, { error: 'Name must be at least 2 characters' })
    }

    const categoryRepo = createCategoryRepository(locals.pb)

    try {
      await categoryRepo.update(id, {
        name: name.trim(),
        description: description?.trim() || undefined,
        color: color || undefined
      })
      return { success: true, message: 'Category updated' }
    } catch (err) {
      console.error('Failed to update category:', err)
      return fail(500, { error: 'Failed to update category' })
    }
  },

  delete: async ({ request, locals }) => {
    const formData = await request.formData()
    const id = formData.get('id') as string

    if (!id) {
      return fail(400, { error: 'Category ID is required' })
    }

    const categoryRepo = createCategoryRepository(locals.pb)

    try {
      await categoryRepo.delete(id)
      return { success: true, message: 'Category deleted' }
    } catch (err) {
      console.error('Failed to delete category:', err)
      return fail(500, { error: 'Failed to delete category. It may be in use by talks.' })
    }
  }
}
