import { error, fail } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params, locals, url }) => {
  const { editionSlug } = params

  const editions = await locals.pb.collection('editions').getList(1, 1, {
    filter: `slug = "${editionSlug}"`
  })

  if (editions.items.length === 0) {
    throw error(404, 'Edition not found')
  }

  const edition = editions.items[0]
  const editionId = edition.id as string

  const [ticketTypes, orders, tickets] = await Promise.all([
    locals.pb.collection('ticket_types').getFullList({
      filter: `editionId = "${editionId}"`,
      sort: 'order,name'
    }),
    locals.pb.collection('orders').getFullList({
      filter: `editionId = "${editionId}"`,
      fields: 'status,totalAmount'
    }),
    locals.pb.collection('billing_tickets').getFullList({
      filter: `editionId = "${editionId}"`,
      fields: 'status'
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

  let ticketsSold = 0
  let ticketsCheckedIn = 0
  for (const ticket of tickets) {
    if (ticket.status !== 'cancelled') ticketsSold++
    if (ticket.status === 'used') ticketsCheckedIn++
  }

  const publicUrl = `${url.origin}/tickets/${edition.slug}`
  const scannerUrl = `${url.origin}/scan/${editionId}`

  return {
    edition: {
      id: editionId,
      name: edition.name as string,
      slug: edition.slug as string,
      startDate: new Date(edition.startDate as string),
      endDate: new Date(edition.endDate as string)
    },
    publicUrl,
    scannerUrl,
    ticketTypes: ticketTypes.map((tt) => ({
      id: tt.id as string,
      name: tt.name as string,
      description: (tt.description as string) || '',
      price: tt.price as number,
      currency: ((tt.currency as string) || 'EUR') as 'EUR' | 'USD' | 'GBP',
      quantity: tt.quantity as number,
      quantitySold: (tt.quantitySold as number) || 0,
      salesStartDate: tt.salesStartDate ? new Date(tt.salesStartDate as string) : undefined,
      salesEndDate: tt.salesEndDate ? new Date(tt.salesEndDate as string) : undefined,
      isActive: tt.isActive as boolean,
      order: (tt.order as number) || 0
    })),
    stats: {
      totalRevenue,
      paidOrders,
      totalOrders: orders.length,
      ticketsSold,
      ticketsCheckedIn
    }
  }
}

export const actions: Actions = {
  createTicketType: async ({ request, locals }) => {
    const formData = await request.formData()
    const editionId = formData.get('editionId') as string
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const price = formData.get('price') as string
    const currency = formData.get('currency') as string
    const quantity = formData.get('quantity') as string
    const salesStartDate = formData.get('salesStartDate') as string
    const salesEndDate = formData.get('salesEndDate') as string
    const isActive = formData.get('isActive') === 'on'

    if (!name || name.trim().length === 0) {
      return fail(400, { error: 'Name is required', action: 'createTicketType' })
    }
    if (!price || Number.isNaN(Number(price))) {
      return fail(400, { error: 'Valid price is required', action: 'createTicketType' })
    }
    if (!quantity || Number.isNaN(Number(quantity))) {
      return fail(400, {
        error: 'Valid quantity is required',
        action: 'createTicketType'
      })
    }

    try {
      await locals.pb.collection('ticket_types').create({
        editionId,
        name: name.trim(),
        description: description?.trim() || null,
        price: Math.round(Number(price) * 100),
        currency: currency || 'EUR',
        quantity: Number.parseInt(quantity, 10),
        quantitySold: 0,
        salesStartDate: salesStartDate ? new Date(salesStartDate).toISOString() : null,
        salesEndDate: salesEndDate ? new Date(salesEndDate).toISOString() : null,
        isActive,
        order: 0
      })

      return { success: true, action: 'createTicketType' }
    } catch (err) {
      console.error('Failed to create ticket type:', err)
      return fail(500, {
        error: 'Failed to create ticket type',
        action: 'createTicketType'
      })
    }
  },

  updateTicketType: async ({ request, locals }) => {
    const formData = await request.formData()
    const id = formData.get('id') as string
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const price = formData.get('price') as string
    const currency = formData.get('currency') as string
    const quantity = formData.get('quantity') as string
    const salesStartDate = formData.get('salesStartDate') as string
    const salesEndDate = formData.get('salesEndDate') as string
    const isActive = formData.get('isActive') === 'on'

    if (!id) {
      return fail(400, { error: 'ID is required', action: 'updateTicketType' })
    }
    if (!name || name.trim().length === 0) {
      return fail(400, { error: 'Name is required', action: 'updateTicketType' })
    }

    try {
      await locals.pb.collection('ticket_types').update(id, {
        name: name.trim(),
        description: description?.trim() || null,
        price: Math.round(Number(price) * 100),
        currency: currency || 'EUR',
        quantity: Number.parseInt(quantity, 10),
        salesStartDate: salesStartDate ? new Date(salesStartDate).toISOString() : null,
        salesEndDate: salesEndDate ? new Date(salesEndDate).toISOString() : null,
        isActive
      })

      return { success: true, action: 'updateTicketType' }
    } catch (err) {
      console.error('Failed to update ticket type:', err)
      return fail(500, {
        error: 'Failed to update ticket type',
        action: 'updateTicketType'
      })
    }
  },

  deleteTicketType: async ({ request, locals }) => {
    const formData = await request.formData()
    const id = formData.get('id') as string

    if (!id) {
      return fail(400, {
        error: 'Ticket type ID is required',
        action: 'deleteTicketType'
      })
    }

    try {
      // Check if ticket type has been sold
      const ticketType = await locals.pb.collection('ticket_types').getOne(id)
      if ((ticketType.quantitySold as number) > 0) {
        return fail(400, {
          error: 'Cannot delete a ticket type that has been sold. Deactivate it instead.',
          action: 'deleteTicketType'
        })
      }

      await locals.pb.collection('ticket_types').delete(id)
      return { success: true, action: 'deleteTicketType' }
    } catch (err) {
      console.error('Failed to delete ticket type:', err)
      return fail(500, {
        error: 'Failed to delete ticket type',
        action: 'deleteTicketType'
      })
    }
  }
}
