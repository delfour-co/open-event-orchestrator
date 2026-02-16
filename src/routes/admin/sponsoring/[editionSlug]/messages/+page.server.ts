import {
  createEditionSponsorRepository,
  createSponsorMessageRepository,
  createSponsorRepository
} from '$lib/features/sponsoring/infra'
import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

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

  // Get event info
  const event = await locals.pb.collection('events').getOne(edition.eventId as string)

  const sponsorRepo = createSponsorRepository(locals.pb)
  const editionSponsorRepo = createEditionSponsorRepository(locals.pb)
  const messageRepo = createSponsorMessageRepository(locals.pb)

  // Get all edition sponsors with their sponsor info
  const editionSponsors = await editionSponsorRepo.findByEditionWithExpand(editionId)

  // Get unread counts for all conversations
  const unreadCounts = await messageRepo.getUnreadCountsForEdition(editionId, 'organizer')

  // Build conversation list with unread counts and logos
  const conversations = editionSponsors.map((es) => ({
    editionSponsor: {
      ...es,
      sponsor: es.sponsor
        ? {
            ...es.sponsor,
            logoUrl: es.sponsor.logo ? sponsorRepo.getLogoThumbUrl(es.sponsor, '100x100') : null
          }
        : undefined
    },
    unreadCount: unreadCounts.byEditionSponsor[es.id] || 0
  }))

  // Sort by unread count (most unread first), then by sponsor name
  conversations.sort((a, b) => {
    if (b.unreadCount !== a.unreadCount) {
      return b.unreadCount - a.unreadCount
    }
    const nameA = a.editionSponsor.sponsor?.name || ''
    const nameB = b.editionSponsor.sponsor?.name || ''
    return nameA.localeCompare(nameB)
  })

  return {
    edition: {
      id: editionId,
      name: edition.name as string,
      slug: edition.slug as string
    },
    event: {
      name: event.name as string
    },
    conversations,
    totalUnread: unreadCounts.total
  }
}
