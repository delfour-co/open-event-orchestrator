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

  // Get check-in stats
  const tickets = await locals.pb.collection('billing_tickets').getFullList({
    filter: `editionId = "${editionId}"`,
    fields: 'status'
  })

  let total = 0
  let checkedIn = 0
  for (const ticket of tickets) {
    if (ticket.status !== 'cancelled') total++
    if (ticket.status === 'used') checkedIn++
  }

  return {
    edition: {
      id: editionId,
      name: edition.name as string,
      slug: edition.slug as string
    },
    stats: {
      total,
      checkedIn
    }
  }
}

export const actions: Actions = {
  checkIn: async ({ request, locals, params }) => {
    const formData = await request.formData()
    const ticketInput = (formData.get('ticketInput') as string)?.trim()

    if (!ticketInput) {
      return fail(400, { error: 'Please enter a ticket number or scan a QR code' })
    }

    // Try to parse QR code JSON payload
    let ticketNumber = ticketInput
    try {
      const qrData = JSON.parse(ticketInput)
      if (qrData.ticketNumber) {
        ticketNumber = qrData.ticketNumber
      }
    } catch {
      // Not JSON, treat as ticket number directly
    }

    try {
      // Find ticket
      const tickets = await locals.pb.collection('billing_tickets').getList(1, 1, {
        filter: `ticketNumber = "${ticketNumber}"`
      })

      if (tickets.items.length === 0) {
        return fail(404, {
          error: 'Ticket not found',
          ticketInput
        })
      }

      const ticket = tickets.items[0]

      // Get edition to verify
      const editions = await locals.pb.collection('editions').getList(1, 1, {
        filter: `slug = "${params.editionSlug}"`
      })
      if (editions.items.length === 0 || ticket.editionId !== editions.items[0].id) {
        return fail(400, {
          error: 'This ticket is for a different edition',
          ticketInput
        })
      }

      if (ticket.status === 'used') {
        const checkedInAt = ticket.checkedInAt
          ? new Date(ticket.checkedInAt as string).toLocaleString()
          : 'unknown time'
        return fail(400, {
          error: `Ticket already used (checked in at ${checkedInAt})`,
          ticketInput,
          attendeeName: `${ticket.attendeeFirstName} ${ticket.attendeeLastName}`,
          status: 'already_used' as const
        })
      }

      if (ticket.status === 'cancelled') {
        return fail(400, {
          error: 'This ticket has been cancelled',
          ticketInput,
          status: 'cancelled' as const
        })
      }

      // Check in
      const userId = locals.pb.authStore.record?.id || 'system'
      await locals.pb.collection('billing_tickets').update(ticket.id, {
        status: 'used',
        checkedInAt: new Date().toISOString(),
        checkedInBy: userId
      })

      return {
        success: true,
        attendeeName: `${ticket.attendeeFirstName} ${ticket.attendeeLastName}`,
        attendeeEmail: ticket.attendeeEmail,
        ticketNumber: ticket.ticketNumber
      }
    } catch (err) {
      if (err && typeof err === 'object' && 'status' in err) {
        throw err
      }
      console.error('Check-in failed:', err)
      return fail(500, { error: 'Check-in failed. Please try again.' })
    }
  }
}
