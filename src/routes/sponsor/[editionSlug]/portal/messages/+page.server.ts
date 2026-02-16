import { createSponsorMessageRepository } from '$lib/features/sponsoring/infra'
import { createSponsorTokenService } from '$lib/features/sponsoring/services'
import { validateDocumentFile } from '$lib/server/file-validation'
import { getSponsorToken } from '$lib/server/token-cookies'
import { error, fail } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params, url, locals, cookies }) => {
  const { editionSlug } = params
  const token = getSponsorToken(cookies, url, editionSlug)

  if (!token) {
    throw error(400, 'Token is required')
  }

  const editions = await locals.pb.collection('editions').getList(1, 1, {
    filter: `slug = "${editionSlug}"`
  })

  if (editions.items.length === 0) {
    throw error(404, 'Edition not found')
  }

  const edition = editions.items[0]
  const event = await locals.pb.collection('events').getOne(edition.eventId as string)

  const tokenService = createSponsorTokenService(locals.pb)
  const result = await tokenService.validateToken(token)

  if (!result.valid || !result.editionSponsor) {
    throw error(403, result.error || 'Invalid or expired token')
  }

  const messageRepo = createSponsorMessageRepository(locals.pb)
  const messages = await messageRepo.findByEditionSponsorWithAttachmentUrls(
    result.editionSponsor.id
  )

  const unreadCount = await messageRepo.countUnreadByEditionSponsor(
    result.editionSponsor.id,
    'sponsor'
  )

  return {
    token,
    edition: {
      id: edition.id as string,
      name: edition.name as string,
      slug: edition.slug as string,
      year: edition.year as number
    },
    event: {
      name: event.name as string
    },
    editionSponsor: result.editionSponsor,
    messages,
    unreadCount
  }
}

const extractAttachments = (formData: FormData): { files: File[]; error?: string } => {
  const attachmentFiles: File[] = []
  const attachments = formData.getAll('attachments')

  for (const attachment of attachments) {
    if (!(attachment instanceof File) || attachment.size === 0) continue

    const validation = validateDocumentFile(attachment, { maxSizeMB: 10 })
    if (!validation.valid) {
      return { files: [], error: `Invalid attachment: ${validation.error}` }
    }
    attachmentFiles.push(attachment)
  }

  if (attachmentFiles.length > 10) {
    return { files: [], error: 'Maximum 10 attachments allowed' }
  }

  return { files: attachmentFiles }
}

export const actions: Actions = {
  sendMessage: async ({ request, url, locals, cookies, params }) => {
    const formData = await request.formData()
    const token =
      getSponsorToken(cookies, url, params.editionSlug) || (formData.get('token') as string)
    const subject = formData.get('subject') as string | null
    const content = formData.get('content') as string

    if (!token) {
      return fail(400, { error: 'Token is required' })
    }

    if (!content?.trim()) {
      return fail(400, { error: 'Message content is required' })
    }

    if (content.length > 10000) {
      return fail(400, { error: 'Message content is too long (max 10000 characters)' })
    }

    const tokenService = createSponsorTokenService(locals.pb)
    const result = await tokenService.validateToken(token)

    if (!result.valid || !result.editionSponsor) {
      return fail(403, { error: 'Invalid or expired token' })
    }

    const attachmentResult = extractAttachments(formData)
    if (attachmentResult.error) {
      return fail(400, { error: attachmentResult.error })
    }

    try {
      const messageRepo = createSponsorMessageRepository(locals.pb)
      const senderName =
        result.editionSponsor.sponsor?.contactName ||
        result.editionSponsor.sponsor?.name ||
        'Sponsor'

      await messageRepo.createWithAttachments(
        {
          editionSponsorId: result.editionSponsor.id,
          senderType: 'sponsor',
          senderName,
          subject: subject?.trim() || undefined,
          content: content.trim(),
          attachments: []
        },
        attachmentResult.files
      )

      return { success: true }
    } catch (err) {
      console.error('Failed to send message:', err)
      return fail(500, { error: 'Failed to send message' })
    }
  },

  markAsRead: async ({ request, url, locals, cookies, params }) => {
    const formData = await request.formData()
    const token =
      getSponsorToken(cookies, url, params.editionSlug) || (formData.get('token') as string)

    if (!token) {
      return fail(400, { error: 'Token is required' })
    }

    const tokenService = createSponsorTokenService(locals.pb)
    const result = await tokenService.validateToken(token)

    if (!result.valid || !result.editionSponsor) {
      return fail(403, { error: 'Invalid or expired token' })
    }

    try {
      const messageRepo = createSponsorMessageRepository(locals.pb)
      await messageRepo.markAllAsReadForEditionSponsor(result.editionSponsor.id, 'sponsor')
      return { success: true, action: 'markAsRead' }
    } catch (err) {
      console.error('Failed to mark messages as read:', err)
      return fail(500, { error: 'Failed to mark messages as read' })
    }
  }
}
