import {
  createOrderItemRepository,
  createOrderRepository,
  createTicketRepository,
  createTicketTypeRepository
} from '$lib/features/billing/infra'
import { generateQrCodeDataUrl } from '$lib/features/billing/services'
import { createHelloAssoApiClient } from '$lib/features/billing/services/helloasso/api-client'
import { createHelloAssoPaymentProvider } from '$lib/features/billing/services/helloasso/helloasso-provider'
import { createHelloAssoTokenManager } from '$lib/features/billing/services/helloasso/token-manager'
import {
  isAlreadyProcessed,
  markProcessed
} from '$lib/features/billing/services/payment-resilience'
import { createCancelOrderUseCase } from '$lib/features/billing/usecases/cancel-order'
import { createCompleteOrderUseCase } from '$lib/features/billing/usecases/complete-order'
import {
  handleSponsorCheckoutCompleted,
  isSponsorCheckoutMetadata
} from '$lib/features/sponsoring/services/sponsor-checkout-handler'
import { getHelloAssoSettings } from '$lib/server/app-settings'
import { sendOrderConfirmationEmail } from '$lib/server/billing-notifications'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const POST: RequestHandler = async ({ request, locals, url }) => {
  const helloassoSettings = await getHelloAssoSettings(locals.pb)

  if (!helloassoSettings.helloassoEnabled) {
    return json({ error: 'HelloAsso not configured' }, { status: 500 })
  }

  const body = await request.text()

  try {
    const tokenManager = createHelloAssoTokenManager(
      helloassoSettings.helloassoClientId,
      helloassoSettings.helloassoClientSecret,
      helloassoSettings.helloassoApiBase
    )
    const apiClient = createHelloAssoApiClient(
      tokenManager,
      helloassoSettings.helloassoOrgSlug,
      helloassoSettings.helloassoApiBase
    )
    const provider = createHelloAssoPaymentProvider(apiClient)

    const headers: Record<string, string> = {}
    request.headers.forEach((value, key) => {
      headers[key] = value
    })

    const event = await provider.parseWebhookEvent({ body, headers })

    console.log(`[helloasso-webhook] Received event: ${event.type} (${event.eventId})`)

    // Idempotence check
    if (await isAlreadyProcessed(locals.pb, event.eventId)) {
      console.log(`[helloasso-webhook] Event ${event.eventId} already processed, skipping`)
      return json({ received: true, duplicate: true })
    }

    const orderRepo = createOrderRepository(locals.pb)
    const orderItemRepo = createOrderItemRepository(locals.pb)
    const ticketTypeRepo = createTicketTypeRepository(locals.pb)
    const ticketRepo = createTicketRepository(locals.pb)

    switch (event.type) {
      case 'checkout.completed': {
        if (isSponsorCheckoutMetadata(event.metadata as Record<string, unknown>)) {
          console.log('[helloasso-webhook] Routing to sponsor checkout handler')
          await handleSponsorCheckoutCompleted(
            locals.pb,
            event.metadata as Record<string, unknown>,
            url.origin,
            event.paymentReference
          )
          break
        }

        const orderId = event.metadata.orderId
        if (!orderId) break

        if (event.paymentReference) {
          await orderRepo.updatePaymentInfo(orderId, {
            stripePaymentIntentId: event.paymentReference
          })
        }

        const completeOrder = createCompleteOrderUseCase(
          orderRepo,
          orderItemRepo,
          ticketTypeRepo,
          ticketRepo,
          generateQrCodeDataUrl
        )
        await completeOrder(orderId)

        const order = await orderRepo.findById(orderId)
        if (order) {
          let editionName = 'Event'
          let eventName = 'Event'
          try {
            const editions = await locals.pb.collection('editions').getList(1, 1, {
              filter: `id = "${order.editionId}"`
            })
            if (editions.items.length > 0) {
              editionName = editions.items[0].name as string
              if (editions.items[0].eventId) {
                const evt = await locals.pb
                  .collection('events')
                  .getOne(editions.items[0].eventId as string)
                eventName = evt.name as string
              }
            }
          } catch {
            // Use defaults
          }
          sendOrderConfirmationEmail({
            pb: locals.pb,
            orderId,
            editionName,
            eventName
          }).catch((err) => console.error('Failed to send confirmation email:', err))
        }
        break
      }

      case 'checkout.expired': {
        const orderId = event.metadata.orderId
        if (!orderId) break

        const cancelOrder = createCancelOrderUseCase(
          orderRepo,
          orderItemRepo,
          ticketTypeRepo,
          ticketRepo
        )
        await cancelOrder(orderId)
        break
      }

      case 'payment.refunded': {
        console.log(`[helloasso-webhook] Payment refunded: ${event.paymentReference || 'unknown'}`)
        break
      }
    }

    await markProcessed(locals.pb, event.eventId, 'helloasso')

    return json({ received: true })
  } catch (err) {
    console.error('HelloAsso webhook error:', err)
    return json(
      { error: err instanceof Error ? err.message : 'Webhook processing failed' },
      { status: 400 }
    )
  }
}
