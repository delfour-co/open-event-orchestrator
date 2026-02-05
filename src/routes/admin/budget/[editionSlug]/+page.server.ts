import { DEFAULT_CATEGORIES } from '$lib/features/budget/domain'
import { error, fail } from '@sveltejs/kit'
import type PocketBase from 'pocketbase'
import type { Actions, PageServerLoad } from './$types'

function computeCategoryStats(
  cat: Record<string, unknown>,
  transactionRecords: Array<Record<string, unknown>>
) {
  const catId = cat.id as string
  const catTransactions = transactionRecords.filter((t) => (t.categoryId as string) === catId)
  let spent = 0
  let income = 0
  for (const t of catTransactions) {
    if (t.status === 'paid') {
      if (t.type === 'expense') spent += (t.amount as number) || 0
      if (t.type === 'income') income += (t.amount as number) || 0
    }
  }
  return {
    id: catId,
    budgetId: cat.budgetId as string,
    name: cat.name as string,
    plannedAmount: (cat.plannedAmount as number) || 0,
    notes: (cat.notes as string) || '',
    spent,
    income,
    transactionCount: catTransactions.length
  }
}

function computeTotals(transactionRecords: Array<Record<string, unknown>>) {
  let totalExpenses = 0
  let totalIncome = 0
  for (const t of transactionRecords) {
    if (t.status === 'paid') {
      if (t.type === 'expense') totalExpenses += (t.amount as number) || 0
      if (t.type === 'income') totalIncome += (t.amount as number) || 0
    }
  }
  return { totalExpenses, totalIncome }
}

function mapTransaction(t: Record<string, unknown>, categoryNameMap: Map<string, string>) {
  return {
    id: t.id as string,
    categoryId: t.categoryId as string,
    categoryName: categoryNameMap.get(t.categoryId as string) || 'Unknown',
    type: t.type as string,
    amount: (t.amount as number) || 0,
    description: t.description as string,
    vendor: (t.vendor as string) || '',
    invoiceNumber: (t.invoiceNumber as string) || '',
    date: t.date as string,
    status: (t.status as string) || 'pending'
  }
}

async function loadBudgetData(pb: PocketBase, budgetId: string) {
  const categoryRecords = await pb.collection('budget_categories').getFullList({
    filter: `budgetId = "${budgetId}"`,
    sort: 'name'
  })

  const categoryIds = categoryRecords.map((c) => c.id as string)

  let transactionRecords: Array<Record<string, unknown>> = []
  if (categoryIds.length > 0) {
    const filter = categoryIds.map((id) => `categoryId = "${id}"`).join(' || ')
    transactionRecords = await pb.collection('budget_transactions').getFullList({
      filter,
      sort: '-date'
    })
  }

  const categoryNameMap = new Map<string, string>()
  for (const cat of categoryRecords) {
    categoryNameMap.set(cat.id as string, cat.name as string)
  }

  const categories = categoryRecords.map((cat) => computeCategoryStats(cat, transactionRecords))
  const totals = computeTotals(transactionRecords)
  const transactions = transactionRecords.map((t) => mapTransaction(t, categoryNameMap))

  return { categories, transactions, ...totals }
}

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

  const budget = budgets.items.length > 0 ? budgets.items[0] : null

  const budgetData = budget
    ? await loadBudgetData(locals.pb, budget.id as string)
    : { categories: [], transactions: [], totalExpenses: 0, totalIncome: 0 }

  return {
    edition: {
      id: editionId,
      name: edition.name as string,
      slug: edition.slug as string,
      startDate: new Date(edition.startDate as string),
      endDate: new Date(edition.endDate as string)
    },
    budget: budget
      ? {
          id: budget.id as string,
          editionId: budget.editionId as string,
          totalBudget: (budget.totalBudget as number) || 0,
          currency: ((budget.currency as string) || 'EUR') as 'EUR' | 'USD' | 'GBP',
          status: ((budget.status as string) || 'draft') as 'draft' | 'approved' | 'closed',
          notes: (budget.notes as string) || ''
        }
      : null,
    categories: budgetData.categories,
    transactions: budgetData.transactions,
    stats: {
      totalExpenses: budgetData.totalExpenses,
      totalIncome: budgetData.totalIncome
    }
  }
}

export const actions: Actions = {
  createBudget: async ({ request, locals }) => {
    const formData = await request.formData()
    const editionId = formData.get('editionId') as string
    const totalBudget = formData.get('totalBudget') as string
    const currency = formData.get('currency') as string

    if (!editionId) {
      return fail(400, { error: 'Edition ID is required', action: 'createBudget' })
    }

    try {
      // Create budget
      const budget = await locals.pb.collection('edition_budgets').create({
        editionId,
        totalBudget: Number(totalBudget) || 0,
        currency: currency || 'EUR',
        status: 'draft',
        notes: null
      })

      // Create default categories
      for (const name of DEFAULT_CATEGORIES) {
        await locals.pb.collection('budget_categories').create({
          budgetId: budget.id,
          name,
          plannedAmount: 0,
          notes: null
        })
      }

      return { success: true, action: 'createBudget' }
    } catch (err) {
      console.error('Failed to create budget:', err)
      return fail(500, { error: 'Failed to create budget', action: 'createBudget' })
    }
  },

  createCategory: async ({ request, locals }) => {
    const formData = await request.formData()
    const budgetId = formData.get('budgetId') as string
    const name = formData.get('name') as string
    const plannedAmount = formData.get('plannedAmount') as string

    if (!budgetId) {
      return fail(400, { error: 'Budget ID is required', action: 'createCategory' })
    }
    if (!name || name.trim().length === 0) {
      return fail(400, { error: 'Name is required', action: 'createCategory' })
    }

    try {
      await locals.pb.collection('budget_categories').create({
        budgetId,
        name: name.trim(),
        plannedAmount: Number(plannedAmount) || 0,
        notes: null
      })

      return { success: true, action: 'createCategory' }
    } catch (err) {
      console.error('Failed to create category:', err)
      return fail(500, { error: 'Failed to create category', action: 'createCategory' })
    }
  },

  updateCategory: async ({ request, locals }) => {
    const formData = await request.formData()
    const id = formData.get('id') as string
    const name = formData.get('name') as string
    const plannedAmount = formData.get('plannedAmount') as string
    const notes = formData.get('notes') as string

    if (!id) {
      return fail(400, { error: 'Category ID is required', action: 'updateCategory' })
    }
    if (!name || name.trim().length === 0) {
      return fail(400, { error: 'Name is required', action: 'updateCategory' })
    }

    try {
      await locals.pb.collection('budget_categories').update(id, {
        name: name.trim(),
        plannedAmount: Number(plannedAmount) || 0,
        notes: notes?.trim() || null
      })

      return { success: true, action: 'updateCategory' }
    } catch (err) {
      console.error('Failed to update category:', err)
      return fail(500, { error: 'Failed to update category', action: 'updateCategory' })
    }
  },

  deleteCategory: async ({ request, locals }) => {
    const formData = await request.formData()
    const id = formData.get('id') as string

    if (!id) {
      return fail(400, { error: 'Category ID is required', action: 'deleteCategory' })
    }

    try {
      // Check if category has transactions
      const transactions = await locals.pb.collection('budget_transactions').getList(1, 1, {
        filter: `categoryId = "${id}"`,
        fields: 'id'
      })

      if (transactions.totalItems > 0) {
        return fail(400, {
          error: 'Cannot delete a category that has transactions. Delete the transactions first.',
          action: 'deleteCategory'
        })
      }

      await locals.pb.collection('budget_categories').delete(id)
      return { success: true, action: 'deleteCategory' }
    } catch (err) {
      console.error('Failed to delete category:', err)
      return fail(500, { error: 'Failed to delete category', action: 'deleteCategory' })
    }
  },

  createTransaction: async ({ request, locals }) => {
    const formData = await request.formData()
    const categoryId = formData.get('categoryId') as string
    const type = formData.get('type') as string
    const amount = formData.get('amount') as string
    const description = formData.get('description') as string
    const vendor = formData.get('vendor') as string
    const invoiceNumber = formData.get('invoiceNumber') as string
    const date = formData.get('date') as string
    const status = formData.get('status') as string

    if (!categoryId) {
      return fail(400, { error: 'Category is required', action: 'createTransaction' })
    }
    if (!description || description.trim().length === 0) {
      return fail(400, { error: 'Description is required', action: 'createTransaction' })
    }
    if (!amount || Number.isNaN(Number(amount))) {
      return fail(400, { error: 'Valid amount is required', action: 'createTransaction' })
    }

    try {
      await locals.pb.collection('budget_transactions').create({
        categoryId,
        type: type || 'expense',
        amount: Number(amount),
        description: description.trim(),
        vendor: vendor?.trim() || null,
        invoiceNumber: invoiceNumber?.trim() || null,
        date: date ? new Date(date).toISOString() : new Date().toISOString(),
        status: status || 'pending'
      })

      return { success: true, action: 'createTransaction' }
    } catch (err) {
      console.error('Failed to create transaction:', err)
      return fail(500, { error: 'Failed to create transaction', action: 'createTransaction' })
    }
  },

  updateTransaction: async ({ request, locals }) => {
    const formData = await request.formData()
    const id = formData.get('id') as string
    const type = formData.get('type') as string
    const amount = formData.get('amount') as string
    const description = formData.get('description') as string
    const vendor = formData.get('vendor') as string
    const invoiceNumber = formData.get('invoiceNumber') as string
    const date = formData.get('date') as string
    const status = formData.get('status') as string

    if (!id) {
      return fail(400, { error: 'Transaction ID is required', action: 'updateTransaction' })
    }
    if (!description || description.trim().length === 0) {
      return fail(400, { error: 'Description is required', action: 'updateTransaction' })
    }

    try {
      await locals.pb.collection('budget_transactions').update(id, {
        type: type || 'expense',
        amount: Number(amount) || 0,
        description: description.trim(),
        vendor: vendor?.trim() || null,
        invoiceNumber: invoiceNumber?.trim() || null,
        date: date ? new Date(date).toISOString() : undefined,
        status: status || 'pending'
      })

      return { success: true, action: 'updateTransaction' }
    } catch (err) {
      console.error('Failed to update transaction:', err)
      return fail(500, { error: 'Failed to update transaction', action: 'updateTransaction' })
    }
  },

  deleteTransaction: async ({ request, locals }) => {
    const formData = await request.formData()
    const id = formData.get('id') as string

    if (!id) {
      return fail(400, { error: 'Transaction ID is required', action: 'deleteTransaction' })
    }

    try {
      await locals.pb.collection('budget_transactions').delete(id)
      return { success: true, action: 'deleteTransaction' }
    } catch (err) {
      console.error('Failed to delete transaction:', err)
      return fail(500, { error: 'Failed to delete transaction', action: 'deleteTransaction' })
    }
  }
}
