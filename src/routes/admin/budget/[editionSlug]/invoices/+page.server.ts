import { createFinancialAuditService } from '$lib/features/budget/services/financial-audit-service'
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

  let budget: Record<string, unknown>
  if (budgets.items.length === 0) {
    budget = await locals.pb.collection('edition_budgets').create({
      editionId,
      totalBudget: 0,
      currency: 'EUR',
      status: 'draft'
    })
  } else {
    budget = budgets.items[0]
  }
  const budgetId = budget.id as string

  const categoryRecords = await locals.pb.collection('budget_categories').getFullList({
    filter: `budgetId = "${budgetId}"`,
    sort: 'name'
  })

  const categoryIds = categoryRecords.map((c) => c.id as string)

  const categoryNameMap = new Map<string, string>()
  for (const cat of categoryRecords) {
    categoryNameMap.set(cat.id as string, cat.name as string)
  }

  let transactionRecords: Array<Record<string, unknown>> = []
  if (categoryIds.length > 0) {
    const filter = categoryIds.map((id) => `categoryId = "${id}"`).join(' || ')
    transactionRecords = await locals.pb.collection('budget_transactions').getFullList({
      filter,
      sort: '-date'
    })
  }

  const transactionIds = transactionRecords.map((t) => t.id as string)

  let invoiceRecords: Array<Record<string, unknown>> = []
  if (transactionIds.length > 0) {
    const filter = transactionIds.map((id) => `transactionId = "${id}"`).join(' || ')
    invoiceRecords = await locals.pb.collection('budget_invoices').getFullList({
      filter,
      sort: '-issueDate'
    })
  }

  const transactionMap = new Map<
    string,
    { description: string; vendor: string; amount: number; categoryName: string }
  >()
  for (const t of transactionRecords) {
    transactionMap.set(t.id as string, {
      description: t.description as string,
      vendor: (t.vendor as string) || '',
      amount: (t.amount as number) || 0,
      categoryName: categoryNameMap.get(t.categoryId as string) || 'Unknown'
    })
  }

  const invoices = invoiceRecords.map((record) => {
    const txId = record.transactionId as string
    const txInfo = transactionMap.get(txId)
    const fileName = (record.file as string) || ''
    let fileUrl = ''
    if (fileName) {
      fileUrl = locals.pb.files.getURL(
        {
          id: record.id as string,
          collectionId: 'budget_invoices',
          collectionName: 'budget_invoices'
        },
        fileName
      )
    }
    return {
      id: record.id as string,
      transactionId: txId,
      invoiceNumber: (record.invoiceNumber as string) || '',
      file: fileName,
      fileUrl,
      issueDate: new Date(record.issueDate as string),
      dueDate: record.dueDate ? new Date(record.dueDate as string) : undefined,
      amount: (record.amount as number) || 0,
      notes: (record.notes as string) || '',
      createdAt: new Date(record.created as string),
      updatedAt: new Date(record.updated as string),
      transactionDescription: txInfo?.description || 'Unknown',
      transactionVendor: txInfo?.vendor || ''
    }
  })

  const transactions = transactionRecords.map((t) => ({
    id: t.id as string,
    description: t.description as string,
    vendor: (t.vendor as string) || '',
    amount: (t.amount as number) || 0,
    categoryName: categoryNameMap.get(t.categoryId as string) || 'Unknown'
  }))

  return {
    edition: {
      id: editionId,
      name: edition.name as string,
      slug: edition.slug as string
    },
    invoices,
    transactions
  }
}

export const actions: Actions = {
  uploadInvoice: async ({ request, locals }) => {
    const formData = await request.formData()
    const transactionId = formData.get('transactionId') as string
    const invoiceNumber = formData.get('invoiceNumber') as string
    const file = formData.get('file') as File | null
    const issueDate = formData.get('issueDate') as string
    const amount = formData.get('amount') as string

    if (!transactionId) {
      return fail(400, { error: 'Transaction is required', action: 'uploadInvoice' })
    }
    if (!invoiceNumber || invoiceNumber.trim().length === 0) {
      return fail(400, { error: 'Invoice number is required', action: 'uploadInvoice' })
    }
    if (!issueDate) {
      return fail(400, { error: 'Issue date is required', action: 'uploadInvoice' })
    }
    if (!amount || Number.isNaN(Number(amount))) {
      return fail(400, { error: 'Valid amount is required', action: 'uploadInvoice' })
    }

    try {
      const transaction = await locals.pb.collection('budget_transactions').getOne(transactionId)
      const category = await locals.pb
        .collection('budget_categories')
        .getOne(transaction.categoryId as string)
      const budget = await locals.pb
        .collection('edition_budgets')
        .getOne(category.budgetId as string)
      const editionId = budget.editionId as string

      const auditService = createFinancialAuditService(locals.pb, {
        editionId,
        userId: locals.user?.id
      })

      const pbFormData = new FormData()
      pbFormData.append('transactionId', transactionId)
      pbFormData.append('invoiceNumber', invoiceNumber.trim())
      pbFormData.append('issueDate', new Date(issueDate).toISOString())
      pbFormData.append('amount', amount)

      const dueDate = formData.get('dueDate') as string
      if (dueDate) {
        pbFormData.append('dueDate', new Date(dueDate).toISOString())
      }

      const notes = formData.get('notes') as string
      if (notes?.trim()) {
        pbFormData.append('notes', notes.trim())
      }

      if (file && file.size > 0) {
        pbFormData.append('file', file)
      }

      const invoice = await locals.pb.collection('budget_invoices').create(pbFormData)

      auditService.logInvoiceCreate(invoice.id as string, invoiceNumber.trim(), {
        amount: Number(amount),
        transactionId,
        hasFile: !!(file && file.size > 0)
      })

      return { success: true, action: 'uploadInvoice' }
    } catch (err) {
      console.error('Failed to upload invoice:', err)
      return fail(500, { error: 'Failed to upload invoice', action: 'uploadInvoice' })
    }
  }
}
