import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ url, locals, parent }) => {
  const parentData = await parent()
  const orderId = url.searchParams.get('order')

  if (!orderId) {
    throw error(400, 'Missing order ID')
  }

  try {
    const order = await locals.pb.collection('orders').getOne(orderId)

    // Verify order belongs to this edition
    const editions = await locals.pb.collection('editions').getList(1, 1, {
      filter: `slug = "${parentData.edition.slug}"`
    })
    if (editions.items.length === 0 || order.editionId !== editions.items[0].id) {
      throw error(404, 'Order not found')
    }

    // Get order items
    const orderItems = await locals.pb.collection('order_items').getFullList({
      filter: `orderId = "${orderId}"`,
      sort: 'created'
    })

    // Get tickets
    const tickets = await locals.pb.collection('billing_tickets').getFullList({
      filter: `orderId = "${orderId}"`,
      sort: 'created'
    })

    return {
      order: {
        id: order.id as string,
        orderNumber: order.orderNumber as string,
        email: order.email as string,
        firstName: order.firstName as string,
        lastName: order.lastName as string,
        status: order.status as string,
        totalAmount: order.totalAmount as number,
        currency: (order.currency as string) || 'EUR'
      },
      orderItems: orderItems.map((item) => ({
        id: item.id as string,
        ticketTypeName: item.ticketTypeName as string,
        quantity: item.quantity as number,
        unitPrice: item.unitPrice as number,
        totalPrice: item.totalPrice as number
      })),
      tickets: tickets.map((t) => ({
        id: t.id as string,
        ticketNumber: t.ticketNumber as string,
        attendeeFirstName: t.attendeeFirstName as string,
        attendeeLastName: t.attendeeLastName as string,
        attendeeEmail: t.attendeeEmail as string,
        qrCode: (t.qrCode as string) || '',
        status: t.status as string
      }))
    }
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) {
      throw err
    }
    console.error('Failed to load order:', err)
    throw error(404, 'Order not found')
  }
}
