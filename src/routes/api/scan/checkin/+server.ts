import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

interface CheckInRequest {
  ticketNumber: string
  editionId: string
  checkedInAt?: string
  checkedInBy?: string
  offlineId?: string
}

export const POST: RequestHandler = async ({ request, locals }) => {
  // Verify user is authenticated
  if (!locals.pb.authStore.isValid) {
    throw error(401, 'Authentication required')
  }

  const body = (await request.json()) as CheckInRequest
  const { ticketNumber, editionId, checkedInAt, checkedInBy, offlineId } = body

  if (!ticketNumber) {
    return json({ success: false, error: 'ticketNumber is required' }, { status: 400 })
  }

  if (!editionId) {
    return json({ success: false, error: 'editionId is required' }, { status: 400 })
  }

  try {
    // Find ticket
    const tickets = await locals.pb.collection('billing_tickets').getList(1, 1, {
      filter: `ticketNumber = "${ticketNumber}"`
    })

    if (tickets.items.length === 0) {
      return json({ success: false, error: 'Ticket not found' }, { status: 404 })
    }

    const ticket = tickets.items[0]

    // Verify edition
    if (ticket.editionId !== editionId) {
      return json(
        { success: false, error: 'This ticket is for a different edition' },
        { status: 400 }
      )
    }

    // Check status
    if (ticket.status === 'used') {
      const checkedInAtDate = ticket.checkedInAt
        ? new Date(ticket.checkedInAt as string).toLocaleString()
        : 'unknown time'
      return json(
        {
          success: false,
          error: `Ticket already used (checked in at ${checkedInAtDate})`,
          alreadyCheckedIn: true,
          offlineId
        },
        { status: 400 }
      )
    }

    if (ticket.status === 'cancelled') {
      return json({ success: false, error: 'Ticket has been cancelled' }, { status: 400 })
    }

    // Check in the ticket
    const userId = checkedInBy || locals.pb.authStore.record?.id || 'system'
    const checkInTime = checkedInAt || new Date().toISOString()

    await locals.pb.collection('billing_tickets').update(ticket.id, {
      status: 'used',
      checkedInAt: checkInTime,
      checkedInBy: userId
    })

    return json({
      success: true,
      ticket: {
        ticketNumber: ticket.ticketNumber,
        attendeeName: `${ticket.attendeeFirstName} ${ticket.attendeeLastName}`,
        attendeeEmail: ticket.attendeeEmail
      },
      offlineId
    })
  } catch (err) {
    console.error('Check-in failed:', err)
    return json({ success: false, error: 'Check-in failed' }, { status: 500 })
  }
}
