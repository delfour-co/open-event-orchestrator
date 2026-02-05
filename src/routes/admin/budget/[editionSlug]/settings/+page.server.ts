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

  const budgets = await locals.pb.collection('edition_budgets').getList(1, 1, {
    filter: `editionId = "${editionId}"`
  })

  if (budgets.items.length === 0) {
    throw error(404, 'Budget not found. Initialize a budget first.')
  }

  const budget = budgets.items[0]

  // Compute stats for overview
  const categoryRecords = await locals.pb.collection('budget_categories').getFullList({
    filter: `budgetId = "${budget.id}"`,
    fields: 'id'
  })

  const categoryIds = categoryRecords.map((c) => c.id as string)
  let totalTransactions = 0
  if (categoryIds.length > 0) {
    const filter = categoryIds.map((id) => `categoryId = "${id}"`).join(' || ')
    const txResult = await locals.pb.collection('budget_transactions').getList(1, 1, {
      filter,
      fields: 'id'
    })
    totalTransactions = txResult.totalItems
  }

  return {
    edition: {
      id: editionId,
      name: edition.name as string,
      slug: edition.slug as string
    },
    budget: {
      id: budget.id as string,
      editionId: budget.editionId as string,
      totalBudget: (budget.totalBudget as number) || 0,
      currency: ((budget.currency as string) || 'EUR') as 'EUR' | 'USD' | 'GBP',
      status: ((budget.status as string) || 'draft') as 'draft' | 'approved' | 'closed',
      notes: (budget.notes as string) || ''
    },
    stats: {
      totalCategories: categoryRecords.length,
      totalTransactions
    }
  }
}

export const actions: Actions = {
  updateBudget: async ({ request, locals }) => {
    const formData = await request.formData()
    const id = formData.get('id') as string
    const totalBudget = formData.get('totalBudget') as string
    const currency = formData.get('currency') as string
    const notes = formData.get('notes') as string

    if (!id) {
      return fail(400, { error: 'Budget ID is required' })
    }

    try {
      await locals.pb.collection('edition_budgets').update(id, {
        totalBudget: Number(totalBudget) || 0,
        currency: currency || 'EUR',
        notes: notes?.trim() || null
      })

      return { success: true, message: 'Budget settings saved successfully' }
    } catch (err) {
      console.error('Failed to update budget:', err)
      return fail(500, { error: 'Failed to update budget settings' })
    }
  },

  updateStatus: async ({ request, locals }) => {
    const formData = await request.formData()
    const id = formData.get('id') as string
    const status = formData.get('status') as string

    if (!id) {
      return fail(400, { error: 'Budget ID is required' })
    }

    try {
      await locals.pb.collection('edition_budgets').update(id, {
        status: status || 'draft'
      })

      return { success: true, message: `Budget status changed to ${status}` }
    } catch (err) {
      console.error('Failed to update budget status:', err)
      return fail(500, { error: 'Failed to update budget status' })
    }
  }
}
