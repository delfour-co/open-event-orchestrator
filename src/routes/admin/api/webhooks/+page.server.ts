import { fail } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
  const webhooks = await locals.pb.collection('webhooks').getFullList({
    sort: '-created',
    expand: 'organizationId,eventId,editionId,createdBy'
  })

  // Get recent delivery stats for each webhook
  const webhookIds = webhooks.map((wh) => wh.id as string)
  const recentDeliveries =
    webhookIds.length > 0
      ? await locals.pb.collection('webhook_deliveries').getFullList({
          filter: webhookIds.map((id) => `webhookId = "${id}"`).join(' || '),
          sort: '-created',
          fields: 'webhookId,statusCode,deliveredAt,error'
        })
      : []

  // Compute stats per webhook
  const deliveryStats = new Map<string, { total: number; success: number; failed: number }>()
  for (const delivery of recentDeliveries) {
    const whId = delivery.webhookId as string
    const stats = deliveryStats.get(whId) || { total: 0, success: 0, failed: 0 }
    stats.total++
    if (delivery.deliveredAt) {
      stats.success++
    } else if (delivery.error) {
      stats.failed++
    }
    deliveryStats.set(whId, stats)
  }

  return {
    webhooks: webhooks.map((wh) => ({
      id: wh.id as string,
      name: wh.name as string,
      url: wh.url as string,
      events: wh.events as string[],
      isActive: wh.isActive as boolean,
      retryCount: (wh.retryCount as number) || 3,
      createdAt: new Date(wh.created as string),
      organization: wh.expand?.organizationId
        ? {
            id: (wh.expand.organizationId as Record<string, unknown>).id as string,
            name: (wh.expand.organizationId as Record<string, unknown>).name as string
          }
        : null,
      event: wh.expand?.eventId
        ? {
            id: (wh.expand.eventId as Record<string, unknown>).id as string,
            name: (wh.expand.eventId as Record<string, unknown>).name as string
          }
        : null,
      edition: wh.expand?.editionId
        ? {
            id: (wh.expand.editionId as Record<string, unknown>).id as string,
            name: (wh.expand.editionId as Record<string, unknown>).name as string
          }
        : null,
      createdBy: wh.expand?.createdBy
        ? {
            id: (wh.expand.createdBy as Record<string, unknown>).id as string,
            name: (wh.expand.createdBy as Record<string, unknown>).name as string
          }
        : null,
      stats: deliveryStats.get(wh.id as string) || { total: 0, success: 0, failed: 0 }
    }))
  }
}

export const actions: Actions = {
  toggleActive: async ({ request, locals }) => {
    const formData = await request.formData()
    const id = formData.get('id') as string
    const isActive = formData.get('isActive') === 'true'

    if (!id) {
      return fail(400, { error: 'Webhook ID is required', action: 'toggleActive' })
    }

    try {
      await locals.pb.collection('webhooks').update(id, {
        isActive: !isActive
      })

      return { success: true, action: 'toggleActive' }
    } catch (err) {
      console.error('Failed to toggle webhook:', err)
      return fail(500, { error: 'Failed to toggle webhook', action: 'toggleActive' })
    }
  },

  deleteWebhook: async ({ request, locals }) => {
    const formData = await request.formData()
    const id = formData.get('id') as string

    if (!id) {
      return fail(400, { error: 'Webhook ID is required', action: 'deleteWebhook' })
    }

    try {
      // Delete associated deliveries first
      const deliveries = await locals.pb.collection('webhook_deliveries').getFullList({
        filter: `webhookId = "${id}"`
      })
      for (const delivery of deliveries) {
        await locals.pb.collection('webhook_deliveries').delete(delivery.id)
      }

      // Delete webhook
      await locals.pb.collection('webhooks').delete(id)
      return { success: true, action: 'deleteWebhook' }
    } catch (err) {
      console.error('Failed to delete webhook:', err)
      return fail(500, { error: 'Failed to delete webhook', action: 'deleteWebhook' })
    }
  }
}
