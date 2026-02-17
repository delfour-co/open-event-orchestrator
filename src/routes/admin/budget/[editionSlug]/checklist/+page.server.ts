import {
  createBudgetRepository,
  createBudgetTemplateRepository,
  createCategoryRepository,
  createChecklistItemRepository
} from '$lib/features/budget/infra'
import { createApplyBudgetTemplateUseCase } from '$lib/features/budget/usecases'
import { error, fail } from '@sveltejs/kit'
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

  // Get budget and categories
  const budgetRepo = createBudgetRepository(locals.pb)
  const budget = await budgetRepo.findByEdition(editionId)

  let categories: Array<{ id: string; name: string }> = []
  if (budget) {
    const categoryRepo = createCategoryRepository(locals.pb)
    const categoryRecords = await categoryRepo.findByBudget(budget.id)
    categories = categoryRecords.map((c) => ({ id: c.id, name: c.name }))
  }

  // Get checklist items
  const checklistRepo = createChecklistItemRepository(locals.pb)
  const items = await checklistRepo.findByEdition(editionId)

  // Get available templates
  const templateRepo = createBudgetTemplateRepository(locals.pb)
  const templates = await templateRepo.findGlobal()

  // Map category names to items
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]))
  const itemsWithCategoryName = items.map((item) => ({
    ...item,
    categoryName: item.categoryId ? categoryMap.get(item.categoryId) || 'Unknown' : undefined
  }))

  // Calculate stats
  const stats = {
    total: items.length,
    pending: items.filter((i) => i.status === 'pending').length,
    approved: items.filter((i) => i.status === 'approved').length,
    ordered: items.filter((i) => i.status === 'ordered').length,
    paid: items.filter((i) => i.status === 'paid').length,
    cancelled: items.filter((i) => i.status === 'cancelled').length,
    totalEstimated: items
      .filter((i) => i.status !== 'cancelled')
      .reduce((sum, i) => sum + i.estimatedAmount, 0)
  }

  return {
    edition: {
      id: editionId,
      name: edition.name as string,
      slug: edition.slug as string
    },
    budget: budget
      ? {
          id: budget.id,
          currency: budget.currency
        }
      : null,
    categories,
    items: itemsWithCategoryName,
    templates: templates.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      eventType: t.eventType,
      itemCount: t.items.length,
      usageCount: t.usageCount
    })),
    stats
  }
}

export const actions: Actions = {
  createItem: async ({ request, locals, params }) => {
    const formData = await request.formData()
    const editionSlug = params.editionSlug

    const editions = await locals.pb.collection('editions').getList(1, 1, {
      filter: `slug = "${editionSlug}"`
    })

    if (editions.items.length === 0) {
      return fail(404, { error: 'Edition not found' })
    }

    const editionId = editions.items[0].id as string

    const name = formData.get('name') as string
    const categoryId = formData.get('categoryId') as string
    const estimatedAmount = formData.get('estimatedAmount') as string
    const priority = formData.get('priority') as string
    const dueDate = formData.get('dueDate') as string
    const assignee = formData.get('assignee') as string
    const notes = formData.get('notes') as string

    if (!name || name.trim().length === 0) {
      return fail(400, { error: 'Name is required' })
    }

    try {
      const checklistRepo = createChecklistItemRepository(locals.pb)
      const order = await checklistRepo.getNextOrder(editionId)

      await checklistRepo.create({
        editionId,
        categoryId: categoryId || undefined,
        name: name.trim(),
        estimatedAmount: Number(estimatedAmount) || 0,
        status: 'pending',
        priority: (priority as 'low' | 'medium' | 'high') || 'medium',
        dueDate: dueDate ? new Date(dueDate) : undefined,
        assignee: assignee?.trim() || undefined,
        notes: notes?.trim() || undefined,
        order,
        createdBy: locals.user?.id || ''
      })

      return { success: true }
    } catch (err) {
      console.error('Failed to create checklist item:', err)
      return fail(500, { error: 'Failed to create checklist item' })
    }
  },

  updateItem: async ({ request, locals }) => {
    const formData = await request.formData()
    const id = formData.get('id') as string
    const name = formData.get('name') as string
    const categoryId = formData.get('categoryId') as string
    const estimatedAmount = formData.get('estimatedAmount') as string
    const status = formData.get('status') as string
    const priority = formData.get('priority') as string
    const dueDate = formData.get('dueDate') as string
    const assignee = formData.get('assignee') as string
    const notes = formData.get('notes') as string

    if (!id) {
      return fail(400, { error: 'Item ID is required' })
    }

    try {
      const checklistRepo = createChecklistItemRepository(locals.pb)

      await checklistRepo.update(id, {
        name: name?.trim(),
        categoryId: categoryId || undefined,
        estimatedAmount: Number(estimatedAmount) || 0,
        status: status as 'pending' | 'approved' | 'ordered' | 'paid' | 'cancelled',
        priority: priority as 'low' | 'medium' | 'high',
        dueDate: dueDate ? new Date(dueDate) : undefined,
        assignee: assignee?.trim() || undefined,
        notes: notes?.trim() || undefined
      })

      return { success: true }
    } catch (err) {
      console.error('Failed to update checklist item:', err)
      return fail(500, { error: 'Failed to update checklist item' })
    }
  },

  deleteItem: async ({ request, locals }) => {
    const formData = await request.formData()
    const id = formData.get('id') as string

    if (!id) {
      return fail(400, { error: 'Item ID is required' })
    }

    try {
      const checklistRepo = createChecklistItemRepository(locals.pb)
      await checklistRepo.delete(id)

      return { success: true }
    } catch (err) {
      console.error('Failed to delete checklist item:', err)
      return fail(500, { error: 'Failed to delete checklist item' })
    }
  },

  updateStatus: async ({ request, locals }) => {
    const formData = await request.formData()
    const id = formData.get('id') as string
    const status = formData.get('status') as string

    if (!id || !status) {
      return fail(400, { error: 'Item ID and status are required' })
    }

    try {
      const checklistRepo = createChecklistItemRepository(locals.pb)
      await checklistRepo.update(id, {
        status: status as 'pending' | 'approved' | 'ordered' | 'paid' | 'cancelled'
      })

      return { success: true }
    } catch (err) {
      console.error('Failed to update status:', err)
      return fail(500, { error: 'Failed to update status' })
    }
  },

  applyTemplate: async ({ request, locals, params }) => {
    const formData = await request.formData()
    const templateId = formData.get('templateId') as string
    const multiplier = formData.get('multiplier') as string
    const editionSlug = params.editionSlug

    if (!templateId) {
      return fail(400, { error: 'Template is required' })
    }

    const editions = await locals.pb.collection('editions').getList(1, 1, {
      filter: `slug = "${editionSlug}"`
    })

    if (editions.items.length === 0) {
      return fail(404, { error: 'Edition not found' })
    }

    const editionId = editions.items[0].id as string

    try {
      const templateRepo = createBudgetTemplateRepository(locals.pb)
      const checklistRepo = createChecklistItemRepository(locals.pb)

      const applyTemplate = createApplyBudgetTemplateUseCase(templateRepo, checklistRepo)

      const result = await applyTemplate({
        templateId,
        editionId,
        createdBy: locals.user?.id || '',
        multiplier: Number(multiplier) || undefined
      })

      return {
        success: true,
        message: `Applied template "${result.templateName}": ${result.itemsCreated} items created`
      }
    } catch (err) {
      console.error('Failed to apply template:', err)
      return fail(500, { error: 'Failed to apply template' })
    }
  },

  reorder: async ({ request, locals }) => {
    const formData = await request.formData()
    const itemsJson = formData.get('items') as string

    if (!itemsJson) {
      return fail(400, { error: 'Items data is required' })
    }

    try {
      const items = JSON.parse(itemsJson) as Array<{ id: string; order: number }>
      const checklistRepo = createChecklistItemRepository(locals.pb)

      await checklistRepo.reorder(items)

      return { success: true }
    } catch (err) {
      console.error('Failed to reorder items:', err)
      return fail(500, { error: 'Failed to reorder items' })
    }
  }
}
