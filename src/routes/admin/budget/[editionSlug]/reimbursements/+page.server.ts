import { env } from '$env/dynamic/public'
import { createFinancialAuditService } from '$lib/features/budget/services/financial-audit-service'
import { error, fail } from '@sveltejs/kit'
import type PocketBase from 'pocketbase'
import type { Actions, PageServerLoad } from './$types'

function buildFileUrl(collectionName: string, recordId: string, filename: string): string {
  const baseUrl = env.PUBLIC_POCKETBASE_URL || 'http://localhost:8090'
  return `${baseUrl}/api/files/${collectionName}/${recordId}/${filename}`
}

function escapeCsvField(value: string | number): string {
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

async function getSpeakerName(
  pb: PocketBase,
  speakerId: string,
  cache: Map<string, string>
): Promise<string> {
  if (cache.has(speakerId)) {
    return cache.get(speakerId) || 'Unknown Speaker'
  }
  try {
    const speaker = await pb.collection('speakers').getOne(speakerId)
    const firstName = (speaker.firstName as string) || ''
    const lastName = (speaker.lastName as string) || ''
    const name = `${firstName} ${lastName}`.trim() || 'Unknown Speaker'
    cache.set(speakerId, name)
    return name
  } catch {
    cache.set(speakerId, 'Unknown Speaker')
    return 'Unknown Speaker'
  }
}

function buildCsvRowsForRequest(
  requestNumber: string,
  speakerName: string,
  status: string,
  currency: string,
  totalAmount: number,
  items: Array<Record<string, unknown>>
): string[] {
  if (items.length === 0) {
    return [
      [
        escapeCsvField(requestNumber),
        escapeCsvField(speakerName),
        escapeCsvField(status),
        '',
        '',
        String(totalAmount),
        '',
        escapeCsvField(currency)
      ].join(',')
    ]
  }

  return items.map((item) => {
    const expenseType = (item.expenseType as string) || 'other'
    const description = (item.description as string) || ''
    const amount = (item.amount as number) || 0
    const date = item.date ? new Date(item.date as string).toISOString().split('T')[0] : ''

    return [
      escapeCsvField(requestNumber),
      escapeCsvField(speakerName),
      escapeCsvField(status),
      escapeCsvField(expenseType),
      escapeCsvField(description),
      String(amount),
      escapeCsvField(date),
      escapeCsvField(currency)
    ].join(',')
  })
}

interface MappedItem {
  id: string
  expenseType: string
  description: string
  amount: number
  date: string
  receipt: string
  receiptUrl: string
  notes: string
}

interface MappedRequest {
  id: string
  editionId: string
  speakerId: string
  requestNumber: string
  status: string
  totalAmount: number
  currency: string
  notes: string
  adminNotes: string
  reviewedBy: string
  reviewedAt: string
  transactionId: string
  submittedAt: string
  createdAt: string
  updatedAt: string
  speakerName: string
  speakerEmail: string
  itemCount: number
  items: MappedItem[]
}

async function fetchSpeaker(
  pb: App.Locals['pb'],
  speakerId: string
): Promise<{ name: string; email: string }> {
  try {
    const speaker = await pb.collection('speakers').getOne(speakerId)
    const firstName = (speaker.firstName as string) || ''
    const lastName = (speaker.lastName as string) || ''
    return {
      name: `${firstName} ${lastName}`.trim() || 'Unknown Speaker',
      email: (speaker.email as string) || ''
    }
  } catch {
    return { name: 'Unknown Speaker', email: '' }
  }
}

async function fetchItemsForRequest(
  pb: App.Locals['pb'],
  requestId: string
): Promise<MappedItem[]> {
  const records = await pb.collection('reimbursement_items').getFullList({
    filter: `requestId = "${requestId}"`,
    sort: 'date',
    requestKey: null
  })

  return records.map((record) => {
    const receiptFilename = (record.receipt as string) || ''
    return {
      id: record.id as string,
      expenseType: (record.expenseType as string) || 'other',
      description: (record.description as string) || '',
      amount: (record.amount as number) || 0,
      date: (record.date as string) || '',
      receipt: receiptFilename,
      receiptUrl: receiptFilename
        ? buildFileUrl('reimbursement_items', record.id as string, receiptFilename)
        : '',
      notes: (record.notes as string) || ''
    }
  })
}

function mapRequest(
  record: Record<string, unknown>,
  speakerName: string,
  speakerEmail: string,
  items: MappedItem[]
): MappedRequest {
  return {
    id: record.id as string,
    editionId: record.editionId as string,
    speakerId: record.speakerId as string,
    requestNumber: (record.requestNumber as string) || '',
    status: (record.status as string) || 'draft',
    totalAmount: (record.totalAmount as number) || 0,
    currency: (record.currency as string) || 'EUR',
    notes: (record.notes as string) || '',
    adminNotes: (record.adminNotes as string) || '',
    reviewedBy: (record.reviewedBy as string) || '',
    reviewedAt: (record.reviewedAt as string) || '',
    transactionId: (record.transactionId as string) || '',
    submittedAt: (record.submittedAt as string) || '',
    createdAt: (record.created as string) || '',
    updatedAt: (record.updated as string) || '',
    speakerName,
    speakerEmail,
    itemCount: items.length,
    items
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

  const requestRecords = await locals.pb.collection('reimbursement_requests').getFullList({
    filter: `editionId = "${editionId}"`,
    sort: '-created'
  })

  const speakerCache = new Map<string, { name: string; email: string }>()
  const requests: MappedRequest[] = []

  for (const record of requestRecords) {
    const speakerId = record.speakerId as string

    if (!speakerCache.has(speakerId)) {
      speakerCache.set(speakerId, await fetchSpeaker(locals.pb, speakerId))
    }

    const speaker = speakerCache.get(speakerId) || { name: 'Unknown Speaker', email: '' }
    const items = await fetchItemsForRequest(locals.pb, record.id as string)

    requests.push(mapRequest(record, speaker.name, speaker.email, items))
  }

  const categoryRecords = await locals.pb.collection('budget_categories').getFullList({
    filter: `budgetId = "${budgetId}"`,
    sort: 'name'
  })

  const categories = categoryRecords.map((cat) => ({
    id: cat.id as string,
    name: cat.name as string
  }))

  return {
    edition: {
      id: editionId,
      name: edition.name as string,
      slug: edition.slug as string
    },
    budget: {
      id: budgetId,
      currency: ((budget.currency as string) || 'EUR') as 'EUR' | 'USD' | 'GBP'
    },
    requests,
    categories
  }
}

export const actions: Actions = {
  markUnderReview: async ({ request, locals }) => {
    const formData = await request.formData()
    const id = formData.get('id') as string

    if (!id) {
      return fail(400, { error: 'Request ID is required', action: 'markUnderReview' })
    }

    try {
      const reimbursement = await locals.pb.collection('reimbursement_requests').getOne(id)
      const editionId = reimbursement.editionId as string
      const requestNumber = reimbursement.requestNumber as string

      const auditService = createFinancialAuditService(locals.pb, {
        editionId,
        userId: locals.user?.id
      })

      await locals.pb.collection('reimbursement_requests').update(id, {
        status: 'under_review'
      })

      auditService.logReimbursementSubmit(id, requestNumber, {
        totalAmount: reimbursement.totalAmount,
        status: 'under_review'
      })

      return { success: true, action: 'markUnderReview' }
    } catch (err) {
      console.error('Failed to mark as under review:', err)
      return fail(500, { error: 'Failed to update status', action: 'markUnderReview' })
    }
  },

  approve: async ({ request, locals }) => {
    const formData = await request.formData()
    const id = formData.get('id') as string
    const categoryId = formData.get('categoryId') as string
    const adminNotes = formData.get('adminNotes') as string

    if (!id) {
      return fail(400, { error: 'Request ID is required', action: 'approve' })
    }
    if (!categoryId) {
      return fail(400, { error: 'Budget category is required', action: 'approve' })
    }

    try {
      const reimbursementRequest = await locals.pb.collection('reimbursement_requests').getOne(id)
      const editionId = reimbursementRequest.editionId as string
      const requestNumber = (reimbursementRequest.requestNumber as string) || id

      const auditService = createFinancialAuditService(locals.pb, {
        editionId,
        userId: locals.user?.id
      })

      const items = await locals.pb.collection('reimbursement_items').getFullList({
        filter: `requestId = "${id}"`,
        fields: 'amount'
      })

      const totalAmount = items.reduce((sum, item) => sum + ((item.amount as number) || 0), 0)

      const speakerId = reimbursementRequest.speakerId as string
      let speakerName = 'Unknown Speaker'
      try {
        const speaker = await locals.pb.collection('speakers').getOne(speakerId)
        const firstName = (speaker.firstName as string) || ''
        const lastName = (speaker.lastName as string) || ''
        speakerName = `${firstName} ${lastName}`.trim() || 'Unknown Speaker'
      } catch {
        // Speaker not found, use default name
      }

      const transaction = await locals.pb.collection('budget_transactions').create({
        categoryId,
        type: 'expense',
        amount: totalAmount,
        description: `Speaker reimbursement - ${requestNumber}`,
        vendor: speakerName,
        date: new Date().toISOString(),
        status: 'pending'
      })

      await locals.pb.collection('reimbursement_requests').update(id, {
        status: 'approved',
        adminNotes: adminNotes?.trim() || null,
        reviewedBy: locals.user?.id || '',
        reviewedAt: new Date().toISOString(),
        transactionId: transaction.id,
        totalAmount
      })

      auditService.logReimbursementApprove(id, requestNumber, transaction.id as string, {
        totalAmount,
        speakerName
      })

      auditService.logTransactionCreate(transaction.id as string, {
        type: 'expense',
        amount: totalAmount,
        description: `Speaker reimbursement - ${requestNumber}`,
        vendor: speakerName,
        status: 'pending',
        sourceReimbursement: requestNumber
      })

      return { success: true, action: 'approve' }
    } catch (err) {
      console.error('Failed to approve reimbursement:', err)
      return fail(500, { error: 'Failed to approve reimbursement', action: 'approve' })
    }
  },

  reject: async ({ request, locals }) => {
    const formData = await request.formData()
    const id = formData.get('id') as string
    const adminNotes = formData.get('adminNotes') as string

    if (!id) {
      return fail(400, { error: 'Request ID is required', action: 'reject' })
    }

    try {
      const reimbursement = await locals.pb.collection('reimbursement_requests').getOne(id)
      const editionId = reimbursement.editionId as string
      const requestNumber = (reimbursement.requestNumber as string) || id

      const auditService = createFinancialAuditService(locals.pb, {
        editionId,
        userId: locals.user?.id
      })

      await locals.pb.collection('reimbursement_requests').update(id, {
        status: 'rejected',
        adminNotes: adminNotes?.trim() || null,
        reviewedBy: locals.user?.id || '',
        reviewedAt: new Date().toISOString()
      })

      auditService.logReimbursementReject(id, requestNumber, {
        totalAmount: reimbursement.totalAmount,
        adminNotes: adminNotes?.trim() || null
      })

      return { success: true, action: 'reject' }
    } catch (err) {
      console.error('Failed to reject reimbursement:', err)
      return fail(500, { error: 'Failed to reject reimbursement', action: 'reject' })
    }
  },

  markPaid: async ({ request, locals }) => {
    const formData = await request.formData()
    const id = formData.get('id') as string

    if (!id) {
      return fail(400, { error: 'Request ID is required', action: 'markPaid' })
    }

    try {
      const reimbursement = await locals.pb.collection('reimbursement_requests').getOne(id)
      const editionId = reimbursement.editionId as string
      const requestNumber = (reimbursement.requestNumber as string) || id

      const auditService = createFinancialAuditService(locals.pb, {
        editionId,
        userId: locals.user?.id
      })

      await locals.pb.collection('reimbursement_requests').update(id, {
        status: 'paid'
      })

      auditService.logReimbursementMarkPaid(id, requestNumber, {
        totalAmount: reimbursement.totalAmount
      })

      return { success: true, action: 'markPaid' }
    } catch (err) {
      console.error('Failed to mark as paid:', err)
      return fail(500, { error: 'Failed to update status', action: 'markPaid' })
    }
  },

  exportCsv: async ({ params, locals }) => {
    const { editionSlug } = params

    const editions = await locals.pb.collection('editions').getList(1, 1, {
      filter: `slug = "${editionSlug}"`
    })

    if (editions.items.length === 0) {
      return fail(404, { error: 'Edition not found', action: 'exportCsv' })
    }

    const editionId = editions.items[0].id as string

    try {
      const requestRecords = await locals.pb.collection('reimbursement_requests').getFullList({
        filter: `editionId = "${editionId}"`,
        sort: '-created'
      })

      const speakerCache = new Map<string, string>()
      const csvRows: string[] = [
        'Request Number,Speaker,Status,Expense Type,Description,Amount,Date,Currency'
      ]

      for (const record of requestRecords) {
        const speakerName = await getSpeakerName(
          locals.pb,
          record.speakerId as string,
          speakerCache
        )
        const items = await locals.pb.collection('reimbursement_items').getFullList({
          filter: `requestId = "${record.id}"`,
          sort: 'date'
        })

        const rows = buildCsvRowsForRequest(
          (record.requestNumber as string) || '',
          speakerName,
          (record.status as string) || 'draft',
          (record.currency as string) || 'EUR',
          (record.totalAmount as number) || 0,
          items
        )
        csvRows.push(...rows)
      }

      return { csv: csvRows.join('\n'), action: 'exportCsv' }
    } catch (err) {
      console.error('Failed to export CSV:', err)
      return fail(500, { error: 'Failed to export reimbursements', action: 'exportCsv' })
    }
  }
}
