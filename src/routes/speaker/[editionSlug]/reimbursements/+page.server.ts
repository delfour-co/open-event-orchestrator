import { env } from '$env/dynamic/public'
import { getEmailService } from '$lib/server/app-settings'
import {
  buildReimbursementsUrl,
  generateSpeakerToken,
  validateSpeakerToken
} from '$lib/server/speaker-tokens'
import { getSpeakerToken } from '$lib/server/token-cookies'
import { error, fail } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

function buildFileUrl(collectionName: string, recordId: string, filename: string): string {
  const baseUrl = env.PUBLIC_POCKETBASE_URL || 'http://localhost:8090'
  return `${baseUrl}/api/files/${collectionName}/${recordId}/${filename}`
}

export const load: PageServerLoad = async ({ params, url, locals, cookies }) => {
  const { editionSlug } = params

  const editions = await locals.pb.collection('editions').getList(1, 1, {
    filter: `slug = "${editionSlug}"`
  })

  if (editions.items.length === 0) {
    throw error(404, 'Edition not found')
  }

  const edition = editions.items[0]
  const editionId = edition.id as string

  if (edition.status !== 'published') {
    throw error(404, 'Edition not available')
  }

  // Get token from cookie or URL (backwards compatibility)
  const token = getSpeakerToken(cookies, url, editionSlug)
  if (!token) {
    return {
      edition: { id: editionId, name: edition.name as string, slug: editionSlug },
      needsToken: true,
      speaker: null,
      requests: []
    }
  }

  const validation = await validateSpeakerToken(locals.pb, token, editionId)
  if (!validation.valid || !validation.speakerId) {
    return {
      edition: { id: editionId, name: edition.name as string, slug: editionSlug },
      needsToken: true,
      speaker: null,
      requests: []
    }
  }

  const speakerId = validation.speakerId
  let speaker = null
  try {
    const speakerRecord = await locals.pb.collection('speakers').getOne(speakerId)
    speaker = {
      id: speakerRecord.id as string,
      firstName: speakerRecord.firstName as string,
      lastName: speakerRecord.lastName as string,
      email: speakerRecord.email as string
    }
  } catch {
    return {
      edition: { id: editionId, name: edition.name as string, slug: editionSlug },
      needsToken: true,
      speaker: null,
      requests: []
    }
  }

  const requestRecords = await locals.pb.collection('reimbursement_requests').getFullList({
    filter: `speakerId = "${speakerId}" && editionId = "${editionId}"`,
    sort: '-created',
    requestKey: null
  })

  const requests = await Promise.all(
    requestRecords.map(async (r) => {
      const itemRecords = await locals.pb.collection('reimbursement_items').getFullList({
        filter: `requestId = "${r.id}"`,
        sort: 'date',
        requestKey: null
      })

      return {
        id: r.id as string,
        requestNumber: (r.requestNumber as string) || '',
        status: ((r.status as string) || 'draft') as string,
        totalAmount: (r.totalAmount as number) || 0,
        currency: ((r.currency as string) || 'EUR') as string,
        notes: (r.notes as string) || '',
        adminNotes: (r.adminNotes as string) || '',
        submittedAt: r.submittedAt ? new Date(r.submittedAt as string) : undefined,
        createdAt: new Date(r.created as string),
        items: itemRecords.map((item) => {
          const receiptFilename = item.receipt as string | undefined
          return {
            id: item.id as string,
            expenseType: (item.expenseType as string) || 'other',
            description: item.description as string,
            amount: (item.amount as number) || 0,
            date: new Date(item.date as string),
            receipt: receiptFilename || undefined,
            receiptUrl: receiptFilename
              ? buildFileUrl('reimbursement_items', item.id as string, receiptFilename)
              : undefined,
            notes: (item.notes as string) || ''
          }
        })
      }
    })
  )

  return {
    edition: { id: editionId, name: edition.name as string, slug: editionSlug },
    needsToken: false,
    speaker,
    requests,
    token
  }
}

async function validateTokenForAction(
  locals: App.Locals,
  url: URL,
  editionId: string,
  cookies: import('@sveltejs/kit').Cookies,
  editionSlug: string
): Promise<{ speakerId: string | null; error: string | null }> {
  const token = getSpeakerToken(cookies, url, editionSlug)
  if (!token) return { speakerId: null, error: 'Authentication token is required' }

  const validation = await validateSpeakerToken(locals.pb, token, editionId)
  if (!validation.valid || !validation.speakerId) {
    return { speakerId: null, error: 'Invalid or expired token' }
  }
  return { speakerId: validation.speakerId, error: null }
}

export const actions: Actions = {
  createRequest: async ({ request, locals, url, params, cookies }) => {
    const editions = await locals.pb.collection('editions').getList(1, 1, {
      filter: `slug = "${params.editionSlug}"`
    })
    if (editions.items.length === 0) return fail(404, { error: 'Edition not found' })
    const editionId = editions.items[0].id as string

    const { speakerId, error: authError } = await validateTokenForAction(
      locals,
      url,
      editionId,
      cookies,
      params.editionSlug
    )
    if (authError || !speakerId) return fail(401, { error: authError || 'Authentication required' })

    const formData = await request.formData()
    const notes = (formData.get('notes') as string) || ''
    const currency = (formData.get('currency') as string) || 'EUR'

    try {
      const existing = await locals.pb.collection('reimbursement_requests').getList(1, 1, {
        filter: `editionId = "${editionId}"`,
        sort: '-created',
        fields: 'id'
      })
      const seq = existing.totalItems + 1
      const slug = params.editionSlug.toUpperCase().slice(0, 8)
      const requestNumber = `RB-${slug}-${String(seq).padStart(4, '0')}`

      await locals.pb.collection('reimbursement_requests').create({
        editionId,
        speakerId,
        requestNumber,
        status: 'draft',
        totalAmount: 0,
        currency,
        notes
      })

      return { success: true, message: 'Reimbursement request created' }
    } catch (err) {
      console.error('Failed to create reimbursement request:', err)
      return fail(500, { error: 'Failed to create request' })
    }
  },

  addItem: async ({ request, locals, url, params, cookies }) => {
    const editions = await locals.pb.collection('editions').getList(1, 1, {
      filter: `slug = "${params.editionSlug}"`
    })
    if (editions.items.length === 0) return fail(404, { error: 'Edition not found' })
    const editionId = editions.items[0].id as string

    const { speakerId, error: authError } = await validateTokenForAction(
      locals,
      url,
      editionId,
      cookies,
      params.editionSlug
    )
    if (authError || !speakerId) return fail(401, { error: authError || 'Authentication required' })

    const formData = await request.formData()
    const requestId = formData.get('requestId') as string
    if (!requestId) return fail(400, { error: 'Request ID is required' })

    // Verify ownership
    try {
      const req = await locals.pb.collection('reimbursement_requests').getOne(requestId)
      if (req.speakerId !== speakerId) return fail(403, { error: 'Not authorized' })
      if (req.status !== 'draft')
        return fail(400, { error: 'Can only add items to draft requests' })
    } catch {
      return fail(404, { error: 'Request not found' })
    }

    try {
      // Get form values
      const expenseType = formData.get('expenseType') as string
      const description = formData.get('description') as string
      const amount = Number(formData.get('amount')) || 0
      const date = formData.get('date') as string
      const notes = formData.get('itemNotes') as string
      const receiptFile = formData.get('receipt')

      // Create FormData for PocketBase to handle file upload
      const pbData = new FormData()
      pbData.append('requestId', requestId)
      pbData.append('expenseType', expenseType || 'other')
      pbData.append('description', description)
      pbData.append('amount', String(amount))
      pbData.append('date', date || new Date().toISOString().split('T')[0])
      if (notes) pbData.append('notes', notes)

      // Check if receiptFile is a File with content
      if (receiptFile instanceof File && receiptFile.size > 0) {
        pbData.append('receipt', receiptFile)
      }

      await locals.pb.collection('reimbursement_items').create(pbData)

      // Recalculate total
      const items = await locals.pb.collection('reimbursement_items').getFullList({
        filter: `requestId = "${requestId}"`,
        fields: 'amount'
      })
      const total = items.reduce((sum, item) => sum + ((item.amount as number) || 0), 0)
      await locals.pb.collection('reimbursement_requests').update(requestId, { totalAmount: total })

      return { success: true, message: 'Item added' }
    } catch (err) {
      console.error('Failed to add item:', err)
      return fail(500, { error: 'Failed to add item' })
    }
  },

  removeItem: async ({ request, locals, url, params, cookies }) => {
    const editions = await locals.pb.collection('editions').getList(1, 1, {
      filter: `slug = "${params.editionSlug}"`
    })
    if (editions.items.length === 0) return fail(404, { error: 'Edition not found' })
    const editionId = editions.items[0].id as string

    const { speakerId, error: authError } = await validateTokenForAction(
      locals,
      url,
      editionId,
      cookies,
      params.editionSlug
    )
    if (authError || !speakerId) return fail(401, { error: authError || 'Authentication required' })

    const formData = await request.formData()
    const itemId = formData.get('itemId') as string
    const requestId = formData.get('requestId') as string
    if (!itemId || !requestId) return fail(400, { error: 'Item ID and Request ID are required' })

    try {
      const req = await locals.pb.collection('reimbursement_requests').getOne(requestId)
      if (req.speakerId !== speakerId) return fail(403, { error: 'Not authorized' })
      if (req.status !== 'draft')
        return fail(400, { error: 'Can only remove items from draft requests' })

      await locals.pb.collection('reimbursement_items').delete(itemId)

      // Recalculate total
      const items = await locals.pb.collection('reimbursement_items').getFullList({
        filter: `requestId = "${requestId}"`,
        fields: 'amount'
      })
      const total = items.reduce((sum, item) => sum + ((item.amount as number) || 0), 0)
      await locals.pb.collection('reimbursement_requests').update(requestId, { totalAmount: total })

      return { success: true, message: 'Item removed' }
    } catch (err) {
      console.error('Failed to remove item:', err)
      return fail(500, { error: 'Failed to remove item' })
    }
  },

  submitRequest: async ({ request, locals, url, params, cookies }) => {
    const editions = await locals.pb.collection('editions').getList(1, 1, {
      filter: `slug = "${params.editionSlug}"`
    })
    if (editions.items.length === 0) return fail(404, { error: 'Edition not found' })
    const editionId = editions.items[0].id as string

    const { speakerId, error: authError } = await validateTokenForAction(
      locals,
      url,
      editionId,
      cookies,
      params.editionSlug
    )
    if (authError || !speakerId) return fail(401, { error: authError || 'Authentication required' })

    const formData = await request.formData()
    const requestId = formData.get('requestId') as string
    if (!requestId) return fail(400, { error: 'Request ID is required' })

    try {
      const req = await locals.pb.collection('reimbursement_requests').getOne(requestId)
      if (req.speakerId !== speakerId) return fail(403, { error: 'Not authorized' })
      if (req.status !== 'draft') return fail(400, { error: 'Can only submit draft requests' })

      // Check that there are items
      const items = await locals.pb.collection('reimbursement_items').getList(1, 1, {
        filter: `requestId = "${requestId}"`,
        fields: 'id'
      })
      if (items.totalItems === 0)
        return fail(400, { error: 'Add at least one expense item before submitting' })

      await locals.pb.collection('reimbursement_requests').update(requestId, {
        status: 'submitted',
        submittedAt: new Date().toISOString()
      })

      return { success: true, message: 'Request submitted for review' }
    } catch (err) {
      console.error('Failed to submit request:', err)
      return fail(500, { error: 'Failed to submit request' })
    }
  },

  deleteRequest: async ({ request, locals, url, params, cookies }) => {
    const editions = await locals.pb.collection('editions').getList(1, 1, {
      filter: `slug = "${params.editionSlug}"`
    })
    if (editions.items.length === 0) return fail(404, { error: 'Edition not found' })
    const editionId = editions.items[0].id as string

    const { speakerId, error: authError } = await validateTokenForAction(
      locals,
      url,
      editionId,
      cookies,
      params.editionSlug
    )
    if (authError || !speakerId) return fail(401, { error: authError || 'Authentication required' })

    const formData = await request.formData()
    const requestId = formData.get('requestId') as string
    if (!requestId) return fail(400, { error: 'Request ID is required' })

    try {
      const req = await locals.pb.collection('reimbursement_requests').getOne(requestId)
      if (req.speakerId !== speakerId) return fail(403, { error: 'Not authorized' })
      if (req.status !== 'draft') return fail(400, { error: 'Can only delete draft requests' })

      // Items will be cascade deleted
      await locals.pb.collection('reimbursement_requests').delete(requestId)

      return { success: true, message: 'Request deleted' }
    } catch (err) {
      console.error('Failed to delete request:', err)
      return fail(500, { error: 'Failed to delete request' })
    }
  },

  requestAccess: async ({ request, locals, params }) => {
    const formData = await request.formData()
    const email = formData.get('email') as string

    if (!email) {
      return fail(400, { accessError: 'Email is required' })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return fail(400, { accessError: 'Please enter a valid email address' })
    }

    // Get edition
    const editions = await locals.pb.collection('editions').getList(1, 1, {
      filter: `slug = "${params.editionSlug}"`
    })
    if (editions.items.length === 0) return fail(404, { error: 'Edition not found' })
    const edition = editions.items[0]
    const editionId = edition.id as string

    // Find speaker by email
    let speaker = null
    try {
      speaker = await locals.pb
        .collection('speakers')
        .getFirstListItem(`email = "${email}"`, { requestKey: null })
    } catch {
      // Speaker not found - don't reveal this for security
    }

    if (!speaker) {
      // Don't reveal if the email exists or not for security
      return {
        accessRequested: true,
        message: 'If you are a registered speaker, you will receive an access link shortly.'
      }
    }

    // Check if this speaker has any talks for this edition (to verify they're a speaker for this event)
    let hasTalks = false
    try {
      const talks = await locals.pb.collection('talks').getList(1, 1, {
        filter: `editionId = "${editionId}" && speakerIds ~ "${speaker.id}"`,
        requestKey: null
      })
      hasTalks = talks.totalItems > 0
    } catch {
      // Error checking talks
    }

    if (!hasTalks) {
      // Don't reveal if they have talks or not
      return {
        accessRequested: true,
        message: 'If you are a registered speaker, you will receive an access link shortly.'
      }
    }

    // Generate token and send email
    const token = await generateSpeakerToken(locals.pb, speaker.id as string, editionId)

    // Get event name
    let eventName = edition.name as string
    try {
      const event = await locals.pb.collection('events').getOne(edition.eventId as string)
      eventName = event.name as string
    } catch {
      // Use edition name as fallback
    }

    // Build access URL
    const baseUrl = request.url.split('/speaker')[0]
    const accessUrl = buildReimbursementsUrl(baseUrl, params.editionSlug, token)

    // Send email with access link
    try {
      const emailService = await getEmailService(locals.pb)
      await emailService.send({
        to: email,
        subject: `Access your expense reimbursements - ${eventName}`,
        text: `Hello ${speaker.firstName} ${speaker.lastName},

You requested access to manage your expense reimbursements for ${edition.name}.

Click the link below to access your reimbursements:
${accessUrl}

This link is valid for 30 days.

Best regards,
The ${eventName} Team`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #1a1a1a;">Access Your Expense Reimbursements</h2>
    <p>Hello ${speaker.firstName} ${speaker.lastName},</p>
    <p>You requested access to manage your expense reimbursements for <strong>${edition.name}</strong>.</p>
    <p style="margin: 30px 0;">
      <a href="${accessUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
        Access Reimbursements
      </a>
    </p>
    <p style="color: #666; font-size: 14px;">This link is valid for 30 days.</p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
    <p style="color: #666; font-size: 14px;">
      Best regards,<br>
      The ${eventName} Team
    </p>
  </div>
</body>
</html>`
      })
    } catch (err) {
      console.error('Failed to send reimbursement access email:', err)
      // Still return success to not reveal email existence
    }

    return {
      accessRequested: true,
      message: 'If you are a registered speaker, you will receive an access link shortly.'
    }
  }
}
