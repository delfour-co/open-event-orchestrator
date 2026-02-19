import {
  createOrderItemRepository,
  createOrderRepository,
  createTicketRepository,
  createTicketTypeRepository
} from '$lib/features/billing/infra'
import { generateQrCodeDataUrl } from '$lib/features/billing/services'
import { createCancelOrderUseCase } from '$lib/features/billing/usecases/cancel-order'
import { createCompleteOrderUseCase } from '$lib/features/billing/usecases/complete-order'
import { createRefundOrderUseCase } from '$lib/features/billing/usecases/refund-order'
import { getStripeSettings } from '$lib/server/app-settings'
import { sendOrderConfirmationEmail, sendOrderRefundEmail } from '$lib/server/billing-notifications'
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
  const editionName = edition.name as string

  // Get event name for emails
  let eventName = editionName
  if (edition.eventId) {
    try {
      const event = await locals.pb.collection('events').getOne(edition.eventId as string)
      eventName = event.name as string
    } catch {
      // Use edition name as fallback
    }
  }

  const [orders, tickets, ticketTypes] = await Promise.all([
    locals.pb.collection('orders').getFullList({
      filter: `editionId = "${editionId}"`,
      sort: '-created'
    }),
    locals.pb.collection('billing_tickets').getFullList({
      filter: `editionId = "${editionId}"`,
      sort: '-created'
    }),
    locals.pb.collection('ticket_types').getFullList({
      filter: `editionId = "${editionId}"`,
      sort: 'order,name'
    })
  ])

  // Compute stats
  let totalRevenue = 0
  let paidOrders = 0
  for (const order of orders) {
    if (order.status === 'paid') {
      totalRevenue += order.totalAmount as number
      paidOrders++
    }
  }

  let totalTickets = 0
  let checkedIn = 0
  for (const ticket of tickets) {
    if (ticket.status !== 'cancelled') totalTickets++
    if (ticket.status === 'used') checkedIn++
  }

  return {
    edition: {
      id: editionId,
      name: editionName,
      slug: edition.slug as string,
      eventName
    },
    stats: {
      totalRevenue,
      paidOrders,
      totalOrders: orders.length,
      totalTickets,
      checkedIn,
      checkInRate: totalTickets > 0 ? Math.round((checkedIn / totalTickets) * 100) : 0
    },
    orders: orders.map((o) => ({
      id: o.id as string,
      orderNumber: o.orderNumber as string,
      email: o.email as string,
      firstName: o.firstName as string,
      lastName: o.lastName as string,
      status: o.status as string,
      totalAmount: o.totalAmount as number,
      currency: (o.currency as string) || 'EUR',
      stripePaymentIntentId: (o.stripePaymentIntentId as string) || '',
      createdAt: new Date(o.created as string)
    })),
    tickets: tickets.map((t) => ({
      id: t.id as string,
      orderId: t.orderId as string,
      ticketNumber: t.ticketNumber as string,
      attendeeEmail: t.attendeeEmail as string,
      attendeeFirstName: t.attendeeFirstName as string,
      attendeeLastName: t.attendeeLastName as string,
      ticketTypeId: t.ticketTypeId as string,
      status: t.status as string,
      checkedInAt: t.checkedInAt ? new Date(t.checkedInAt as string) : undefined,
      createdAt: new Date(t.created as string)
    })),
    ticketTypes: ticketTypes.map((tt) => ({
      id: tt.id as string,
      name: tt.name as string
    }))
  }
}

export const actions: Actions = {
  cancelTicket: async ({ request, locals }) => {
    const formData = await request.formData()
    const ticketId = formData.get('ticketId') as string

    if (!ticketId) {
      return fail(400, { error: 'Ticket ID is required' })
    }

    try {
      const ticket = await locals.pb.collection('billing_tickets').getOne(ticketId)
      if (ticket.status !== 'valid') {
        return fail(400, { error: 'Only valid tickets can be cancelled' })
      }

      await locals.pb.collection('billing_tickets').update(ticketId, {
        status: 'cancelled'
      })

      return { success: true, action: 'cancelTicket' }
    } catch (err) {
      console.error('Failed to cancel ticket:', err)
      return fail(500, { error: 'Failed to cancel ticket' })
    }
  },

  cancelOrder: async ({ request, locals }) => {
    const formData = await request.formData()
    const orderId = formData.get('orderId') as string

    if (!orderId) {
      return fail(400, { error: 'Order ID is required' })
    }

    try {
      const orderRepo = createOrderRepository(locals.pb)
      const orderItemRepo = createOrderItemRepository(locals.pb)
      const ticketTypeRepo = createTicketTypeRepository(locals.pb)
      const ticketRepo = createTicketRepository(locals.pb)

      const cancelOrder = createCancelOrderUseCase(
        orderRepo,
        orderItemRepo,
        ticketTypeRepo,
        ticketRepo
      )
      await cancelOrder(orderId)

      return { success: true, action: 'cancelOrder' }
    } catch (err) {
      console.error('Failed to cancel order:', err)
      return fail(400, {
        error: err instanceof Error ? err.message : 'Failed to cancel order'
      })
    }
  },

  refundOrder: async ({ request, locals, params }) => {
    const formData = await request.formData()
    const orderId = formData.get('orderId') as string

    if (!orderId) {
      return fail(400, { error: 'Order ID is required' })
    }

    try {
      const orderRepo = createOrderRepository(locals.pb)
      const orderItemRepo = createOrderItemRepository(locals.pb)
      const ticketTypeRepo = createTicketTypeRepository(locals.pb)
      const ticketRepo = createTicketRepository(locals.pb)

      // Try Stripe refund if configured and payment intent exists
      const order = await orderRepo.findById(orderId)
      const stripeSettings = await getStripeSettings(locals.pb)
      if (order?.stripePaymentIntentId && stripeSettings.isConfigured) {
        const { createStripeService } = await import(
          '$lib/features/billing/services/stripe-service'
        )
        const stripe = createStripeService(
          stripeSettings.stripeSecretKey,
          stripeSettings.stripeApiBase || undefined
        )
        await stripe.createRefund(order.stripePaymentIntentId)
      }

      const refundOrder = createRefundOrderUseCase(
        orderRepo,
        orderItemRepo,
        ticketTypeRepo,
        ticketRepo
      )
      await refundOrder(orderId)

      // Send refund notification email
      const editions = await locals.pb.collection('editions').getList(1, 1, {
        filter: `slug = "${params.editionSlug}"`
      })
      const editionRecord = editions.items[0]
      let evName = editionRecord.name as string
      if (editionRecord.eventId) {
        try {
          const ev = await locals.pb.collection('events').getOne(editionRecord.eventId as string)
          evName = ev.name as string
        } catch {
          // fallback
        }
      }
      await sendOrderRefundEmail({
        pb: locals.pb,
        orderId,
        editionName: editionRecord.name as string,
        eventName: evName
      })

      return { success: true, action: 'refundOrder' }
    } catch (err) {
      console.error('Failed to refund order:', err)
      return fail(400, {
        error: err instanceof Error ? err.message : 'Failed to refund order'
      })
    }
  },

  resendEmail: async ({ request, locals, params }) => {
    const formData = await request.formData()
    const orderId = formData.get('orderId') as string

    if (!orderId) {
      return fail(400, { error: 'Order ID is required' })
    }

    try {
      // Get edition info
      const editions = await locals.pb.collection('editions').getList(1, 1, {
        filter: `slug = "${params.editionSlug}"`
      })
      const editionRecord = editions.items[0]
      const edName = editionRecord.name as string
      let evName = edName
      if (editionRecord.eventId) {
        try {
          const ev = await locals.pb.collection('events').getOne(editionRecord.eventId as string)
          evName = ev.name as string
        } catch {
          // fallback
        }
      }

      const result = await sendOrderConfirmationEmail({
        pb: locals.pb,
        orderId,
        editionName: edName,
        eventName: evName
      })

      if (!result.success) {
        return fail(500, { error: result.error || 'Failed to send email' })
      }

      return { success: true, action: 'resendEmail' }
    } catch (err) {
      console.error('Failed to resend email:', err)
      return fail(500, { error: 'Failed to send confirmation email' })
    }
  },

  markAsPaid: async ({ request, locals }) => {
    const formData = await request.formData()
    const orderId = formData.get('orderId') as string

    if (!orderId) {
      return fail(400, { error: 'Order ID is required' })
    }

    try {
      const orderRepo = createOrderRepository(locals.pb)
      const orderItemRepo = createOrderItemRepository(locals.pb)
      const ticketTypeRepo = createTicketTypeRepository(locals.pb)
      const ticketRepo = createTicketRepository(locals.pb)

      const completeOrder = createCompleteOrderUseCase(
        orderRepo,
        orderItemRepo,
        ticketTypeRepo,
        ticketRepo,
        generateQrCodeDataUrl
      )
      await completeOrder(orderId)

      return { success: true, action: 'markAsPaid' }
    } catch (err) {
      console.error('Failed to mark order as paid:', err)
      return fail(400, {
        error: err instanceof Error ? err.message : 'Failed to mark order as paid'
      })
    }
  }
}
