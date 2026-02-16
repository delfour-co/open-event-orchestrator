import type { DeliverableStatus } from '$lib/features/sponsoring/domain'
import {
  createEditionSponsorRepository,
  createSponsorDeliverableRepository,
  createSponsorRepository
} from '$lib/features/sponsoring/infra'
import { createSponsorDeliverableService } from '$lib/features/sponsoring/services'
import { getEmailService } from '$lib/server/app-settings'
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

  // Get event info for name
  const event = await locals.pb.collection('events').getOne(edition.eventId as string)

  const deliverableRepo = createSponsorDeliverableRepository(locals.pb)
  const editionSponsorRepo = createEditionSponsorRepository(locals.pb)
  const sponsorRepo = createSponsorRepository(locals.pb)

  // Get all deliverables for this edition
  const deliverables = await deliverableRepo.findByEdition(editionId)

  // Get confirmed sponsors for generating deliverables
  const confirmedSponsors = await editionSponsorRepo.findConfirmed(editionId)

  // Build logo URLs for sponsors
  const confirmedSponsorsWithLogos = confirmedSponsors.map((es) => ({
    ...es,
    sponsor: es.sponsor
      ? {
          ...es.sponsor,
          logoUrl: es.sponsor.logo ? sponsorRepo.getLogoThumbUrl(es.sponsor, '100x100') : null
        }
      : undefined
  }))

  // Calculate stats
  const now = new Date()
  let pending = 0
  let inProgress = 0
  let delivered = 0
  let overdue = 0

  for (const d of deliverables) {
    if (d.status === 'pending') pending++
    else if (d.status === 'in_progress') inProgress++
    else if (d.status === 'delivered') delivered++

    if (d.dueDate && d.status !== 'delivered' && now > d.dueDate) {
      overdue++
    }
  }

  const total = deliverables.length
  const completionPercent = total > 0 ? Math.round((delivered / total) * 100) : 0

  // Group deliverables by sponsor
  const deliverablesBySponsor = new Map<
    string,
    {
      editionSponsor: (typeof confirmedSponsorsWithLogos)[0]
      deliverables: typeof deliverables
    }
  >()

  for (const es of confirmedSponsorsWithLogos) {
    const sponsorDeliverables = deliverables.filter((d) => d.editionSponsorId === es.id)
    deliverablesBySponsor.set(es.id, {
      editionSponsor: es,
      deliverables: sponsorDeliverables
    })
  }

  return {
    edition: {
      id: editionId,
      name: edition.name as string,
      slug: edition.slug as string,
      startDate: new Date(edition.startDate as string),
      endDate: new Date(edition.endDate as string)
    },
    event: {
      name: event.name as string
    },
    confirmedSponsors: confirmedSponsorsWithLogos,
    deliverables: deliverables.map((d) => ({
      ...d,
      isOverdue: d.dueDate && d.status !== 'delivered' && now > d.dueDate
    })),
    deliverablesBySponsor: Array.from(deliverablesBySponsor.entries()).map(([id, data]) => ({
      editionSponsorId: id,
      ...data,
      deliverables: data.deliverables.map((d) => ({
        ...d,
        isOverdue: d.dueDate && d.status !== 'delivered' && now > d.dueDate
      }))
    })),
    stats: {
      total,
      pending,
      inProgress,
      delivered,
      overdue,
      completionPercent
    }
  }
}

export const actions: Actions = {
  generateForSponsor: async ({ request, locals }) => {
    const formData = await request.formData()
    const editionSponsorId = formData.get('editionSponsorId') as string
    const dueDateStr = formData.get('dueDate') as string

    if (!editionSponsorId) {
      return fail(400, { error: 'Edition sponsor ID is required', action: 'generateForSponsor' })
    }

    try {
      const deliverableService = createSponsorDeliverableService(locals.pb)
      const dueDate = dueDateStr ? new Date(dueDateStr) : undefined
      const result = await deliverableService.generateDeliverablesForSponsor(
        editionSponsorId,
        dueDate
      )

      return {
        success: true,
        action: 'generateForSponsor',
        created: result.created,
        skipped: result.skipped
      }
    } catch (err) {
      console.error('Failed to generate deliverables:', err)
      return fail(500, {
        error: 'Failed to generate deliverables',
        action: 'generateForSponsor'
      })
    }
  },

  generateForAll: async ({ request, locals, params }) => {
    const { editionSlug } = params
    const formData = await request.formData()
    const dueDateStr = formData.get('dueDate') as string

    // Get edition ID
    const editions = await locals.pb.collection('editions').getList(1, 1, {
      filter: `slug = "${editionSlug}"`
    })

    if (editions.items.length === 0) {
      return fail(404, { error: 'Edition not found', action: 'generateForAll' })
    }

    const editionId = editions.items[0].id as string

    try {
      const deliverableService = createSponsorDeliverableService(locals.pb)
      const dueDate = dueDateStr ? new Date(dueDateStr) : undefined
      const result = await deliverableService.generateDeliverablesForEdition(editionId, dueDate)

      return {
        success: true,
        action: 'generateForAll',
        sponsorsProcessed: result.sponsorsProcessed,
        deliverablesCreated: result.deliverablesCreated
      }
    } catch (err) {
      console.error('Failed to generate deliverables for all:', err)
      return fail(500, {
        error: 'Failed to generate deliverables',
        action: 'generateForAll'
      })
    }
  },

  updateStatus: async ({ request, locals, params }) => {
    const formData = await request.formData()
    const deliverableId = formData.get('deliverableId') as string
    const status = formData.get('status') as DeliverableStatus
    const notes = formData.get('notes') as string

    if (!deliverableId || !status) {
      return fail(400, { error: 'Deliverable ID and status are required', action: 'updateStatus' })
    }

    try {
      const deliverableRepo = createSponsorDeliverableRepository(locals.pb)

      // Get event name for email
      const { editionSlug } = params
      const editions = await locals.pb.collection('editions').getList(1, 1, {
        filter: `slug = "${editionSlug}"`
      })

      if (editions.items.length === 0) {
        return fail(404, { error: 'Edition not found', action: 'updateStatus' })
      }

      const edition = editions.items[0]
      const event = await locals.pb.collection('events').getOne(edition.eventId as string)
      const eventName = event.name as string

      // Update with service to handle email notification
      const emailService = await getEmailService(locals.pb)
      const deliverableService = createSponsorDeliverableService(locals.pb, emailService)

      if (notes) {
        await deliverableRepo.update(deliverableId, { notes })
      }

      await deliverableService.updateDeliverableStatus(deliverableId, status, eventName)

      return { success: true, action: 'updateStatus' }
    } catch (err) {
      console.error('Failed to update deliverable status:', err)
      return fail(500, {
        error: 'Failed to update status',
        action: 'updateStatus'
      })
    }
  },

  updateDeliverable: async ({ request, locals }) => {
    const formData = await request.formData()
    const deliverableId = formData.get('deliverableId') as string
    const description = formData.get('description') as string
    const dueDateStr = formData.get('dueDate') as string
    const notes = formData.get('notes') as string

    if (!deliverableId) {
      return fail(400, { error: 'Deliverable ID is required', action: 'updateDeliverable' })
    }

    try {
      const deliverableRepo = createSponsorDeliverableRepository(locals.pb)
      await deliverableRepo.update(deliverableId, {
        description: description?.trim() || undefined,
        dueDate: dueDateStr ? new Date(dueDateStr) : undefined,
        notes: notes?.trim() || undefined
      })

      return { success: true, action: 'updateDeliverable' }
    } catch (err) {
      console.error('Failed to update deliverable:', err)
      return fail(500, {
        error: 'Failed to update deliverable',
        action: 'updateDeliverable'
      })
    }
  },

  deleteDeliverable: async ({ request, locals }) => {
    const formData = await request.formData()
    const deliverableId = formData.get('deliverableId') as string

    if (!deliverableId) {
      return fail(400, { error: 'Deliverable ID is required', action: 'deleteDeliverable' })
    }

    try {
      const deliverableRepo = createSponsorDeliverableRepository(locals.pb)
      await deliverableRepo.delete(deliverableId)

      return { success: true, action: 'deleteDeliverable' }
    } catch (err) {
      console.error('Failed to delete deliverable:', err)
      return fail(500, {
        error: 'Failed to delete deliverable',
        action: 'deleteDeliverable'
      })
    }
  },

  createDeliverable: async ({ request, locals }) => {
    const formData = await request.formData()
    const editionSponsorId = formData.get('editionSponsorId') as string
    const benefitName = formData.get('benefitName') as string
    const description = formData.get('description') as string
    const dueDateStr = formData.get('dueDate') as string

    if (!editionSponsorId || !benefitName) {
      return fail(400, {
        error: 'Edition sponsor ID and benefit name are required',
        action: 'createDeliverable'
      })
    }

    try {
      const deliverableRepo = createSponsorDeliverableRepository(locals.pb)
      await deliverableRepo.create({
        editionSponsorId,
        benefitName: benefitName.trim(),
        description: description?.trim() || undefined,
        status: 'pending',
        dueDate: dueDateStr ? new Date(dueDateStr) : undefined
      })

      return { success: true, action: 'createDeliverable' }
    } catch (err) {
      console.error('Failed to create deliverable:', err)
      return fail(500, {
        error: 'Failed to create deliverable',
        action: 'createDeliverable'
      })
    }
  }
}
