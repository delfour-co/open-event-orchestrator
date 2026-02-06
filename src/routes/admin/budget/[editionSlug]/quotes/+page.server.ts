import { generateQuoteNumber } from '$lib/features/budget/domain'
import { error, fail } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

function mapQuoteRecord(record: Record<string, unknown>) {
  let items: Array<{ description: string; quantity: number; unitPrice: number }> = []
  try {
    const raw = record.items
    if (typeof raw === 'string') {
      items = JSON.parse(raw)
    } else if (Array.isArray(raw)) {
      items = raw as Array<{ description: string; quantity: number; unitPrice: number }>
    }
  } catch {
    items = []
  }

  return {
    id: record.id as string,
    editionId: record.editionId as string,
    quoteNumber: record.quoteNumber as string,
    vendor: record.vendor as string,
    vendorEmail: (record.vendorEmail as string) || '',
    vendorAddress: (record.vendorAddress as string) || '',
    description: (record.description as string) || '',
    items,
    totalAmount: (record.totalAmount as number) || 0,
    currency: ((record.currency as string) || 'EUR') as 'EUR' | 'USD' | 'GBP',
    status: ((record.status as string) || 'draft') as
      | 'draft'
      | 'sent'
      | 'accepted'
      | 'rejected'
      | 'expired',
    validUntil: record.validUntil ? new Date(record.validUntil as string) : undefined,
    notes: (record.notes as string) || '',
    transactionId: (record.transactionId as string) || '',
    sentAt: record.sentAt ? new Date(record.sentAt as string) : undefined,
    createdAt: new Date(record.created as string),
    updatedAt: new Date(record.updated as string)
  }
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

  const quoteRecords = await locals.pb.collection('budget_quotes').getFullList({
    filter: `editionId = "${editionId}"`,
    sort: '-created'
  })

  const quotes = quoteRecords.map(mapQuoteRecord)

  let categories: Array<{ id: string; name: string }> = []
  if (budget) {
    const categoryRecords = await locals.pb.collection('budget_categories').getFullList({
      filter: `budgetId = "${budget.id}"`,
      sort: 'name'
    })
    categories = categoryRecords.map((c) => ({
      id: c.id as string,
      name: c.name as string
    }))
  }

  return {
    edition: {
      id: editionId,
      name: edition.name as string,
      slug: edition.slug as string
    },
    budget: budget
      ? {
          id: budget.id as string,
          currency: ((budget.currency as string) || 'EUR') as 'EUR' | 'USD' | 'GBP'
        }
      : null,
    quotes,
    categories
  }
}

export const actions: Actions = {
  createQuote: async ({ request, params, locals }) => {
    const formData = await request.formData()
    const vendor = formData.get('vendor') as string
    const vendorEmail = formData.get('vendorEmail') as string
    const vendorAddress = formData.get('vendorAddress') as string
    const description = formData.get('description') as string
    const itemsJson = formData.get('items') as string
    const totalAmount = formData.get('totalAmount') as string
    const currency = formData.get('currency') as string
    const validUntil = formData.get('validUntil') as string
    const notes = formData.get('notes') as string

    if (!vendor || vendor.trim().length === 0) {
      return fail(400, { error: 'Vendor is required', action: 'createQuote' })
    }

    let items: Array<{ description: string; quantity: number; unitPrice: number }> = []
    try {
      items = JSON.parse(itemsJson || '[]')
    } catch {
      return fail(400, { error: 'Invalid items format', action: 'createQuote' })
    }

    if (items.length === 0) {
      return fail(400, { error: 'At least one line item is required', action: 'createQuote' })
    }

    const { editionSlug } = params

    const editions = await locals.pb.collection('editions').getList(1, 1, {
      filter: `slug = "${editionSlug}"`
    })

    if (editions.items.length === 0) {
      return fail(404, { error: 'Edition not found', action: 'createQuote' })
    }

    const editionId = editions.items[0].id as string

    try {
      const existingQuotes = await locals.pb.collection('budget_quotes').getList(1, 1, {
        filter: `editionId = "${editionId}"`,
        sort: '-created'
      })
      const sequence = existingQuotes.totalItems + 1
      const quoteNumber = generateQuoteNumber(editionSlug, sequence)

      await locals.pb.collection('budget_quotes').create({
        editionId,
        quoteNumber,
        vendor: vendor.trim(),
        vendorEmail: vendorEmail?.trim() || null,
        vendorAddress: vendorAddress?.trim() || null,
        description: description?.trim() || null,
        items: JSON.stringify(items),
        totalAmount: Number(totalAmount) || 0,
        currency: currency || 'EUR',
        status: 'draft',
        validUntil: validUntil ? new Date(validUntil).toISOString() : null,
        notes: notes?.trim() || null
      })

      return { success: true, action: 'createQuote' }
    } catch (err) {
      console.error('Failed to create quote:', err)
      return fail(500, { error: 'Failed to create quote', action: 'createQuote' })
    }
  },

  updateQuote: async ({ request, locals }) => {
    const formData = await request.formData()
    const id = formData.get('id') as string
    const vendor = formData.get('vendor') as string
    const vendorEmail = formData.get('vendorEmail') as string
    const vendorAddress = formData.get('vendorAddress') as string
    const description = formData.get('description') as string
    const itemsJson = formData.get('items') as string
    const totalAmount = formData.get('totalAmount') as string
    const currency = formData.get('currency') as string
    const validUntil = formData.get('validUntil') as string
    const notes = formData.get('notes') as string

    if (!id) {
      return fail(400, { error: 'Quote ID is required', action: 'updateQuote' })
    }

    if (!vendor || vendor.trim().length === 0) {
      return fail(400, { error: 'Vendor is required', action: 'updateQuote' })
    }

    let items: Array<{ description: string; quantity: number; unitPrice: number }> = []
    try {
      items = JSON.parse(itemsJson || '[]')
    } catch {
      return fail(400, { error: 'Invalid items format', action: 'updateQuote' })
    }

    if (items.length === 0) {
      return fail(400, { error: 'At least one line item is required', action: 'updateQuote' })
    }

    try {
      await locals.pb.collection('budget_quotes').update(id, {
        vendor: vendor.trim(),
        vendorEmail: vendorEmail?.trim() || null,
        vendorAddress: vendorAddress?.trim() || null,
        description: description?.trim() || null,
        items: JSON.stringify(items),
        totalAmount: Number(totalAmount) || 0,
        currency: currency || 'EUR',
        validUntil: validUntil ? new Date(validUntil).toISOString() : null,
        notes: notes?.trim() || null
      })

      return { success: true, action: 'updateQuote' }
    } catch (err) {
      console.error('Failed to update quote:', err)
      return fail(500, { error: 'Failed to update quote', action: 'updateQuote' })
    }
  },

  deleteQuote: async ({ request, locals }) => {
    const formData = await request.formData()
    const id = formData.get('id') as string

    if (!id) {
      return fail(400, { error: 'Quote ID is required', action: 'deleteQuote' })
    }

    try {
      await locals.pb.collection('budget_quotes').delete(id)
      return { success: true, action: 'deleteQuote' }
    } catch (err) {
      console.error('Failed to delete quote:', err)
      return fail(500, { error: 'Failed to delete quote', action: 'deleteQuote' })
    }
  },

  sendQuote: async ({ request, locals }) => {
    const formData = await request.formData()
    const id = formData.get('id') as string

    if (!id) {
      return fail(400, { error: 'Quote ID is required', action: 'sendQuote' })
    }

    try {
      await locals.pb.collection('budget_quotes').update(id, {
        status: 'sent',
        sentAt: new Date().toISOString()
      })

      return { success: true, action: 'sendQuote' }
    } catch (err) {
      console.error('Failed to send quote:', err)
      return fail(500, { error: 'Failed to send quote', action: 'sendQuote' })
    }
  },

  markAccepted: async ({ request, locals }) => {
    const formData = await request.formData()
    const id = formData.get('id') as string

    if (!id) {
      return fail(400, { error: 'Quote ID is required', action: 'markAccepted' })
    }

    try {
      await locals.pb.collection('budget_quotes').update(id, {
        status: 'accepted'
      })

      return { success: true, action: 'markAccepted' }
    } catch (err) {
      console.error('Failed to accept quote:', err)
      return fail(500, { error: 'Failed to accept quote', action: 'markAccepted' })
    }
  },

  markRejected: async ({ request, locals }) => {
    const formData = await request.formData()
    const id = formData.get('id') as string

    if (!id) {
      return fail(400, { error: 'Quote ID is required', action: 'markRejected' })
    }

    try {
      await locals.pb.collection('budget_quotes').update(id, {
        status: 'rejected'
      })

      return { success: true, action: 'markRejected' }
    } catch (err) {
      console.error('Failed to reject quote:', err)
      return fail(500, { error: 'Failed to reject quote', action: 'markRejected' })
    }
  },

  convertToTransaction: async ({ request, locals }) => {
    const formData = await request.formData()
    const id = formData.get('id') as string
    const categoryId = formData.get('categoryId') as string

    if (!id) {
      return fail(400, { error: 'Quote ID is required', action: 'convertToTransaction' })
    }

    if (!categoryId) {
      return fail(400, { error: 'Category is required', action: 'convertToTransaction' })
    }

    try {
      const quote = await locals.pb.collection('budget_quotes').getOne(id)

      const transaction = await locals.pb.collection('budget_transactions').create({
        categoryId,
        type: 'expense',
        amount: (quote.totalAmount as number) || 0,
        description: `${quote.vendor} - ${quote.description || quote.quoteNumber}`,
        vendor: quote.vendor as string,
        invoiceNumber: quote.quoteNumber as string,
        date: new Date().toISOString(),
        status: 'pending'
      })

      await locals.pb.collection('budget_quotes').update(id, {
        transactionId: transaction.id
      })

      return { success: true, action: 'convertToTransaction' }
    } catch (err) {
      console.error('Failed to convert quote to transaction:', err)
      return fail(500, {
        error: 'Failed to convert quote to transaction',
        action: 'convertToTransaction'
      })
    }
  }
}
