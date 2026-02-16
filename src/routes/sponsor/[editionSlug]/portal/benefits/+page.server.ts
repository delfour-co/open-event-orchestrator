import type { SponsorDeliverable } from '$lib/features/sponsoring/domain'
import { createSponsorDeliverableRepository } from '$lib/features/sponsoring/infra'
import { createSponsorTokenService } from '$lib/features/sponsoring/services'
import { getSponsorToken } from '$lib/server/token-cookies'
import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

interface DeliverableStats {
  total: number
  pending: number
  inProgress: number
  delivered: number
  overdue: number
  completionPercent: number
}

const calculateStats = (deliverables: SponsorDeliverable[], now: Date): DeliverableStats => {
  let pending = 0
  let inProgress = 0
  let delivered = 0
  let overdue = 0

  for (const d of deliverables) {
    switch (d.status) {
      case 'pending':
        pending++
        break
      case 'in_progress':
        inProgress++
        break
      case 'delivered':
        delivered++
        break
    }

    if (d.dueDate && d.status !== 'delivered' && now > d.dueDate) {
      overdue++
    }
  }

  const total = deliverables.length
  const completionPercent = total > 0 ? Math.round((delivered / total) * 100) : 0

  return { total, pending, inProgress, delivered, overdue, completionPercent }
}

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

  const deliverableRepo = createSponsorDeliverableRepository(locals.pb)
  const deliverables = await deliverableRepo.findByEditionSponsor(result.editionSponsor.id)

  const now = new Date()
  const stats = calculateStats(deliverables, now)

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
    deliverables: deliverables.map((d) => ({
      ...d,
      isOverdue: d.dueDate && d.status !== 'delivered' && now > d.dueDate
    })),
    stats
  }
}
