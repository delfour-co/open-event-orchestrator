import {
  createEditionSponsorRepository,
  createSponsorMessageRepository,
  createSponsorRepository
} from '$lib/features/sponsoring/infra'
import { validateDocumentFile } from '$lib/server/file-validation'
import { error, fail } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params, locals }) => {
  const { editionSlug, editionSponsorId } = params

  const editions = await locals.pb.collection('editions').getList(1, 1, {
    filter: `slug = "${editionSlug}"`
  })

  if (editions.items.length === 0) {
    throw error(404, 'Edition not found')
  }

  const edition = editions.items[0]

  // Get event info
  const event = await locals.pb.collection('events').getOne(edition.eventId as string)

  const sponsorRepo = createSponsorRepository(locals.pb)
  const editionSponsorRepo = createEditionSponsorRepository(locals.pb)
  const messageRepo = createSponsorMessageRepository(locals.pb)

  // Get edition sponsor with expand
  const editionSponsor = await editionSponsorRepo.findByIdWithExpand(editionSponsorId)

  if (!editionSponsor) {
    throw error(404, 'Sponsor not found')
  }

  // Verify it belongs to this edition
  if (editionSponsor.editionId !== edition.id) {
    throw error(403, 'Sponsor does not belong to this edition')
  }

  // Get messages
  const messages = await messageRepo.findByEditionSponsorWithAttachmentUrls(editionSponsorId)

  // Count unread messages from sponsor
  const unreadCount = await messageRepo.countUnreadByEditionSponsor(editionSponsorId, 'organizer')

  // Build logo URL
  const logoUrl = editionSponsor.sponsor?.logo
    ? sponsorRepo.getLogoThumbUrl(editionSponsor.sponsor, '100x100')
    : null

  return {
    edition: {
      id: edition.id as string,
      name: edition.name as string,
      slug: edition.slug as string
    },
    event: {
      name: event.name as string
    },
    editionSponsor: {
      ...editionSponsor,
      sponsor: editionSponsor.sponsor
        ? {
            ...editionSponsor.sponsor,
            logoUrl
          }
        : undefined
    },
    messages,
    unreadCount
  }
}

export const actions: Actions = {
  sendMessage: async ({ request, params, locals }) => {
    const { editionSponsorId } = params
    const formData = await request.formData()
    const subject = formData.get('subject') as string | null
    const content = formData.get('content') as string

    if (!content?.trim()) {
      return fail(400, { error: 'Message content is required' })
    }

    if (content.length > 10000) {
      return fail(400, { error: 'Message content is too long (max 10000 characters)' })
    }

    // Verify edition sponsor exists
    const editionSponsorRepo = createEditionSponsorRepository(locals.pb)
    const editionSponsor = await editionSponsorRepo.findById(editionSponsorId)

    if (!editionSponsor) {
      return fail(404, { error: 'Sponsor not found' })
    }

    // Get attachments
    const attachmentFiles: File[] = []
    const attachments = formData.getAll('attachments')
    for (const attachment of attachments) {
      if (attachment instanceof File && attachment.size > 0) {
        const validation = validateDocumentFile(attachment, { maxSizeMB: 10 })
        if (!validation.valid) {
          return fail(400, { error: `Invalid attachment: ${validation.error}` })
        }
        attachmentFiles.push(attachment)
      }
    }

    if (attachmentFiles.length > 10) {
      return fail(400, { error: 'Maximum 10 attachments allowed' })
    }

    try {
      const messageRepo = createSponsorMessageRepository(locals.pb)

      // Get current user info for sender name
      const currentUser = locals.pb.authStore.record
      const senderName = currentUser?.name || currentUser?.email || 'Event Team'

      await messageRepo.createWithAttachments(
        {
          editionSponsorId,
          senderType: 'organizer',
          senderUserId: currentUser?.id,
          senderName,
          subject: subject?.trim() || undefined,
          content: content.trim(),
          attachments: []
        },
        attachmentFiles
      )

      return { success: true }
    } catch (err) {
      console.error('Failed to send message:', err)
      return fail(500, { error: 'Failed to send message' })
    }
  },

  markAsRead: async ({ params, locals }) => {
    const { editionSponsorId } = params

    try {
      const messageRepo = createSponsorMessageRepository(locals.pb)
      await messageRepo.markAllAsReadForEditionSponsor(editionSponsorId, 'organizer')
      return { success: true, action: 'markAsRead' }
    } catch (err) {
      console.error('Failed to mark messages as read:', err)
      return fail(500, { error: 'Failed to mark messages as read' })
    }
  }
}
