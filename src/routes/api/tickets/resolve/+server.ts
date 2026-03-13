import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

/**
 * Resolve a ticket QR code to attendee contact information.
 * Used by the badge scanner in the attendee app (networking feature).
 */
export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const { ticketNumber } = await request.json()

    if (!ticketNumber) {
      return json({ success: false, error: 'Ticket number is required' }, { status: 400 })
    }

    const tickets = await locals.pb.collection('billing_tickets').getList(1, 1, {
      filter: `ticketNumber = "${ticketNumber}" && status != "cancelled"`
    })

    if (tickets.items.length === 0) {
      return json({ success: false, error: 'Ticket not found' }, { status: 404 })
    }

    const ticket = tickets.items[0]

    return json({
      success: true,
      contact: {
        firstName: ticket.attendeeFirstName || '',
        lastName: ticket.attendeeLastName || '',
        email: ticket.attendeeEmail || ''
      }
    })
  } catch (err) {
    console.error('Ticket resolve error:', err)
    return json({ success: false, error: 'Failed to resolve ticket' }, { status: 500 })
  }
}
