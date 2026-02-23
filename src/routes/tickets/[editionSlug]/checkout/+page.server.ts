import {
  createOrderItemRepository,
  createOrderRepository,
  createTicketRepository,
  createTicketTypeRepository
} from '$lib/features/billing/infra'
import { generateQrCodeDataUrl } from '$lib/features/billing/services'
import { getPaymentProvider } from '$lib/features/billing/services/payment-providers/factory'
import { createCompleteOrderUseCase } from '$lib/features/billing/usecases/complete-order'
import { createCreateOrderUseCase } from '$lib/features/billing/usecases/create-order'
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
    const billingAddress = (formData.get('billingAddress') as string) || ''
    const billingCity = (formData.get('billingCity') as string) || ''
    const billingPostalCode = (formData.get('billingPostalCode') as string) || ''
    const billingCountry = (formData.get('billingCountry') as string) || ''

    if (!email || !firstName || !lastName) {
      return fail(400, { error: 'All fields are required' })
    }

    // Validate legal document consent
    const editionsForConsent = await locals.pb.collection('editions').getList(1, 1, {
      filter: `slug = "${params.editionSlug}"`
    })
    if (editionsForConsent.items.length > 0) {
      const ed = editionsForConsent.items[0]
      const legalFields = [
        { key: 'termsOfSale', value: ed.termsOfSale as string },
        { key: 'codeOfConduct', value: ed.codeOfConduct as string },
        { key: 'privacyPolicy', value: ed.privacyPolicy as string }
      ]
      for (const field of legalFields) {
        if (field.value?.trim()) {
          const accepted = formData.get(`${field.key}Accepted`) as string
          if (accepted !== 'on') {
            return fail(400, { error: 'You must accept all required documents before proceeding.' })
          }
        }
      }
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
        billingAddress: billingAddress || undefined,
        billingCity: billingCity || undefined,
        billingPostalCode: billingPostalCode || undefined,
        billingCountry: billingCountry || undefined,
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

      // Paid order: use payment provider
      const provider = await getPaymentProvider(locals.pb)

      if (provider.type === 'none') {
        // No provider configured: auto-complete for development
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

      // Get order items for line items
      const orderItems = await orderItemRepo.findByOrder(result.orderId)

      const checkout = await provider.createCheckout({
        referenceId: result.orderId,
        referenceNumber: result.orderNumber,
        customerEmail: email,
        lineItems: orderItems.map((item) => ({
          name: item.ticketTypeName,
          unitAmount: item.unitPrice,
          quantity: item.quantity
        })),
        successUrl: `${url.origin}/tickets/${params.editionSlug}/confirmation?order=${result.orderId}&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${url.origin}/tickets/${params.editionSlug}`,
        metadata: {
          orderId: result.orderId,
          orderNumber: result.orderNumber
        },
        currency: 'EUR'
      })

      // Update order with session ID and provider info
      await orderRepo.updatePaymentInfo(result.orderId, {
        stripeSessionId: checkout.sessionId
      })

      // Track which provider was used
      await locals.pb.collection('orders').update(result.orderId, {
        paymentProvider: provider.type
      })

      throw redirect(302, checkout.redirectUrl)
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
