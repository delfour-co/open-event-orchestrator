import { type WebhookEventType, getWebhookEventLabel } from '$lib/features/api/domain/webhook'
import { error, fail } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params, locals, url }) => {
  const { id } = params
  const page = Number(url.searchParams.get('page')) || 1
  const perPage = 20

  // Load webhook
  let webhook: Record<string, unknown>
  try {
    webhook = await locals.pb.collection('webhooks').getOne(id, {
      expand: 'organizationId,eventId,editionId,createdBy'
    })
  } catch {
    throw error(404, 'Webhook not found')
  }

  // Load deliveries with pagination
  const deliveries = await locals.pb.collection('webhook_deliveries').getList(page, perPage, {
    filter: `webhookId = "${id}"`,
    sort: '-created'
  })

  // Compute stats
  const allDeliveries = await locals.pb.collection('webhook_deliveries').getFullList({
    filter: `webhookId = "${id}"`,
    fields: 'statusCode,deliveredAt,error'
  })

  const stats = {
    total: allDeliveries.length,
    success: allDeliveries.filter((d) => d.deliveredAt).length,
    failed: allDeliveries.filter((d) => !d.deliveredAt && d.error).length,
    pending: allDeliveries.filter((d) => !d.deliveredAt && !d.error).length
  }

  return {
    webhook: {
      id: webhook.id as string,
      name: webhook.name as string,
      url: webhook.url as string,
      events: (webhook.events as string[]).map((e) => ({
        code: e,
        label: getWebhookEventLabel(e as WebhookEventType)
      })),
      isActive: webhook.isActive as boolean,
      retryCount: (webhook.retryCount as number) || 3,
      headers: webhook.headers as Record<string, string> | null,
      createdAt: new Date(webhook.created as string),
      updatedAt: new Date(webhook.updated as string),
      organization: (webhook.expand as Record<string, unknown> | undefined)?.organizationId
        ? {
            id: (
              (webhook.expand as Record<string, unknown>).organizationId as Record<string, unknown>
            ).id as string,
            name: (
              (webhook.expand as Record<string, unknown>).organizationId as Record<string, unknown>
            ).name as string
          }
        : null,
      event: (webhook.expand as Record<string, unknown> | undefined)?.eventId
        ? {
            id: ((webhook.expand as Record<string, unknown>).eventId as Record<string, unknown>)
              .id as string,
            name: ((webhook.expand as Record<string, unknown>).eventId as Record<string, unknown>)
              .name as string
          }
        : null,
      edition: (webhook.expand as Record<string, unknown> | undefined)?.editionId
        ? {
            id: ((webhook.expand as Record<string, unknown>).editionId as Record<string, unknown>)
              .id as string,
            name: ((webhook.expand as Record<string, unknown>).editionId as Record<string, unknown>)
              .name as string
          }
        : null,
      createdBy: (webhook.expand as Record<string, unknown> | undefined)?.createdBy
        ? {
            id: ((webhook.expand as Record<string, unknown>).createdBy as Record<string, unknown>)
              .id as string,
            name: ((webhook.expand as Record<string, unknown>).createdBy as Record<string, unknown>)
              .name as string
          }
        : null
    },
    deliveries: {
      items: deliveries.items.map((d) => ({
        id: d.id as string,
        event: d.event as string,
        eventLabel: getWebhookEventLabel(d.event as WebhookEventType),
        statusCode: d.statusCode as number | null,
        responseBody: d.responseBody as string | null,
        attempt: d.attempt as number,
        nextRetryAt: d.nextRetryAt ? new Date(d.nextRetryAt as string) : null,
        deliveredAt: d.deliveredAt ? new Date(d.deliveredAt as string) : null,
        error: d.error as string | null,
        createdAt: new Date(d.created as string)
      })),
      page,
      perPage,
      totalItems: deliveries.totalItems,
      totalPages: deliveries.totalPages
    },
    stats
  }
}

export const actions: Actions = {
  retryDelivery: async ({ request, locals }) => {
    const formData = await request.formData()
    const deliveryId = formData.get('deliveryId') as string
    const webhookId = formData.get('webhookId') as string

    if (!deliveryId) {
      return fail(400, { error: 'Delivery ID is required' })
    }

    try {
      // Get delivery and webhook
      const [delivery, webhook] = await Promise.all([
        locals.pb.collection('webhook_deliveries').getOne(deliveryId),
        locals.pb.collection('webhooks').getOne(webhookId)
      ])

      // Create a new delivery attempt
      const payload = delivery.payload as Record<string, unknown>
      const secret = webhook.secret as string
      const url = webhook.url as string
      const payloadString = JSON.stringify(payload)

      // Calculate HMAC signature
      const encoder = new TextEncoder()
      const keyData = encoder.encode(secret)
      const messageData = encoder.encode(payloadString)
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      )
      const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, messageData)
      const signatureArray = Array.from(new Uint8Array(signatureBuffer))
      const signature = signatureArray.map((b) => b.toString(16).padStart(2, '0')).join('')

      // Send webhook
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-OEO-Event': delivery.event as string,
          'X-OEO-Timestamp': new Date().toISOString(),
          'X-OEO-Signature': `sha256=${signature}`
        },
        body: payloadString
      })

      // Update delivery record
      if (response.ok) {
        await locals.pb.collection('webhook_deliveries').update(deliveryId, {
          statusCode: response.status,
          deliveredAt: new Date().toISOString(),
          error: null,
          nextRetryAt: null
        })
        return { success: true, message: 'Delivery successful' }
      }

      await locals.pb.collection('webhook_deliveries').update(deliveryId, {
        statusCode: response.status,
        error: `HTTP ${response.status}: ${response.statusText}`,
        attempt: (delivery.attempt as number) + 1
      })
      return fail(400, { error: `Delivery failed with status ${response.status}` })
    } catch (err) {
      console.error('Failed to retry delivery:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      return fail(500, { error: `Failed to retry: ${errorMessage}` })
    }
  },

  toggleActive: async ({ request, locals }) => {
    const formData = await request.formData()
    const id = formData.get('id') as string
    const isActive = formData.get('isActive') === 'true'

    if (!id) {
      return fail(400, { error: 'Webhook ID is required' })
    }

    try {
      await locals.pb.collection('webhooks').update(id, {
        isActive: !isActive
      })
      return { success: true }
    } catch (err) {
      console.error('Failed to toggle webhook:', err)
      return fail(500, { error: 'Failed to toggle webhook status' })
    }
  }
}
