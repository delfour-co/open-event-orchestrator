import {
  createOrderItemRepository,
  createOrderRepository,
  createTicketRepository,
  createTicketTypeRepository
} from '$lib/features/billing/infra'
import { generateQrCodeDataUrl } from '$lib/features/billing/services'
import { createCancelOrderUseCase } from '$lib/features/billing/usecases/cancel-order'
import { createCompleteOrderUseCase } from '$lib/features/billing/usecases/complete-order'
import { getStripeSettings } from '$lib/server/app-settings'
import { sendOrderConfirmationEmail } from '$lib/server/billing-notifications'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const POST: RequestHandler = async ({ request, locals }) => {
  const stripeSettings = await getStripeSettings(locals.pb)

  if (!stripeSettings.isConfigured || !stripeSettings.stripeWebhookSecret) {
    return json({ error: 'Stripe not configured' }, { status: 500 })
  }

  const payload = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  try {
    const { createStripeService } = await import('$lib/features/billing/services/stripe-service')
    const stripe = createStripeService(
      stripeSettings.stripeSecretKey,
      stripeSettings.stripeApiBase || undefined
    )
    const event = stripe.constructWebhookEvent(
      payload,
      signature,
      stripeSettings.stripeWebhookSecret
    )

    const orderRepo = createOrderRepository(locals.pb)
    const orderItemRepo = createOrderItemRepository(locals.pb)
    const ticketTypeRepo = createTicketTypeRepository(locals.pb)
    const ticketRepo = createTicketRepository(locals.pb)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as {
          metadata?: { orderId?: string }
          payment_intent?: string
        }
        const orderId = session.metadata?.orderId
        if (!orderId) break

        // Update payment info
        if (session.payment_intent) {
          await orderRepo.updatePaymentInfo(orderId, {
            stripePaymentIntentId:
              typeof session.payment_intent === 'string' ? session.payment_intent : undefined
          })
        }

        // Complete the order
        const completeOrder = createCompleteOrderUseCase(
          orderRepo,
          orderItemRepo,
          ticketTypeRepo,
          ticketRepo,
          generateQrCodeDataUrl
        )
        await completeOrder(orderId)

        // Send confirmation email (non-blocking)
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
                const event = await locals.pb
                  .collection('events')
                  .getOne(editions.items[0].eventId as string)
                eventName = event.name as string
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

      case 'checkout.session.expired': {
        const session = event.data.object as { metadata?: { orderId?: string } }
        const orderId = session.metadata?.orderId
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
    }

    return json({ received: true })
  } catch (err) {
    console.error('Webhook error:', err)
    return json(
      { error: err instanceof Error ? err.message : 'Webhook processing failed' },
      { status: 400 }
    )
  }
}
