import {
  createOrderItemRepository,
  createOrderRepository,
  createTicketRepository,
  createTicketTypeRepository
} from '$lib/features/billing/infra'
import { generateQrCodeDataUrl } from '$lib/features/billing/services'
import { createCompleteOrderUseCase } from '$lib/features/billing/usecases/complete-order'
import { createCreateOrderUseCase } from '$lib/features/billing/usecases/create-order'
import { getStripeSettings } from '$lib/server/app-settings'
import { sendOrderConfirmationEmail } from '$lib/server/billing-notifications'
import { error, fail, redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ url, parent }) => {
  const parentData = await parent()

  // Parse ticket quantities from URL params
  const selectedItems: Array<{
    ticketTypeId: string
    ticketTypeName: string
    price: number
    currency: string
    quantity: number
  }> = []

  for (const tt of parentData.ticketTypes) {
    const qty = url.searchParams.get(tt.id)
    if (qty && Number.parseInt(qty, 10) > 0) {
      selectedItems.push({
        ticketTypeId: tt.id,
        ticketTypeName: tt.name,
        price: tt.price,
        currency: tt.currency,
        quantity: Number.parseInt(qty, 10)
      })
    }
  }

  if (selectedItems.length === 0) {
    throw redirect(302, `/tickets/${parentData.edition.slug}`)
  }

  const totalAmount = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return {
    selectedItems,
    totalAmount,
    isFree: totalAmount === 0
  }
}

export const actions: Actions = {
  default: async ({ request, locals, url, params }) => {
    const formData = await request.formData()
    const email = formData.get('email') as string
    const firstName = formData.get('firstName') as string
    const lastName = formData.get('lastName') as string
    const itemsJson = formData.get('items') as string

    if (!email || !firstName || !lastName) {
      return fail(400, { error: 'All fields are required' })
    }

    let items: Array<{ ticketTypeId: string; quantity: number }>
    try {
      items = JSON.parse(itemsJson)
    } catch {
      return fail(400, { error: 'Invalid ticket selection' })
    }

    // Get edition
    const editions = await locals.pb.collection('editions').getList(1, 1, {
      filter: `slug = "${params.editionSlug}"`
    })
    if (editions.items.length === 0) {
      throw error(404, 'Edition not found')
    }
    const editionRecord = editions.items[0]
    const editionId = editionRecord.id as string
    const editionName = editionRecord.name as string

    // Get event name for email
    let eventName = editionName
    if (editionRecord.eventId) {
      try {
        const event = await locals.pb.collection('events').getOne(editionRecord.eventId as string)
        eventName = event.name as string
      } catch {
        // Use edition name as fallback
      }
    }

    const orderRepo = createOrderRepository(locals.pb)
    const orderItemRepo = createOrderItemRepository(locals.pb)
    const ticketTypeRepo = createTicketTypeRepository(locals.pb)
    const ticketRepo = createTicketRepository(locals.pb)

    const createOrder = createCreateOrderUseCase(orderRepo, orderItemRepo, ticketTypeRepo)

    try {
      const result = await createOrder({
        editionId,
        email,
        firstName,
        lastName,
        currency: 'EUR',
        items
      })

      if (result.isFree) {
        // Free order: complete immediately
        const completeOrder = createCompleteOrderUseCase(
          orderRepo,
          orderItemRepo,
          ticketTypeRepo,
          ticketRepo,
          generateQrCodeDataUrl
        )
        await completeOrder(result.orderId)

        // Send confirmation email (non-blocking)
        sendOrderConfirmationEmail({
          pb: locals.pb,
          orderId: result.orderId,
          editionName,
          eventName
        }).catch((err) => console.error('Failed to send confirmation email:', err))

        throw redirect(302, `/tickets/${params.editionSlug}/confirmation?order=${result.orderId}`)
      }

      // Paid order: create Stripe checkout session
      const stripeSettings = await getStripeSettings(locals.pb)
      if (!stripeSettings.isConfigured) {
        // No Stripe configured: auto-complete for development
        const completeOrder = createCompleteOrderUseCase(
          orderRepo,
          orderItemRepo,
          ticketTypeRepo,
          ticketRepo,
          generateQrCodeDataUrl
        )
        await completeOrder(result.orderId)

        // Send confirmation email (non-blocking)
        sendOrderConfirmationEmail({
          pb: locals.pb,
          orderId: result.orderId,
          editionName,
          eventName
        }).catch((err) => console.error('Failed to send confirmation email:', err))

        throw redirect(302, `/tickets/${params.editionSlug}/confirmation?order=${result.orderId}`)
      }

      // Create Stripe checkout session
      const { createStripeService } = await import('$lib/features/billing/services/stripe-service')
      const stripe = createStripeService(
        stripeSettings.stripeSecretKey,
        stripeSettings.stripeApiBase || undefined
      )

      // Get order items for line items
      const orderItems = await orderItemRepo.findByOrder(result.orderId)

      const session = await stripe.createCheckoutSession({
        orderId: result.orderId,
        orderNumber: result.orderNumber,
        customerEmail: email,
        lineItems: orderItems.map((item) => ({
          name: item.ticketTypeName,
          unitAmount: item.unitPrice,
          quantity: item.quantity,
          currency: 'EUR'
        })),
        successUrl: `${url.origin}/tickets/${params.editionSlug}/confirmation?order=${result.orderId}&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${url.origin}/tickets/${params.editionSlug}`
      })

      // Update order with Stripe session ID
      await orderRepo.updatePaymentInfo(result.orderId, {
        stripeSessionId: session.sessionId
      })

      throw redirect(302, session.url)
    } catch (err) {
      if (err && typeof err === 'object' && 'status' in err) {
        throw err // Re-throw redirects
      }
      console.error('Failed to create order:', err)
      return fail(500, {
        error: err instanceof Error ? err.message : 'Failed to create order'
      })
    }
  }
}
