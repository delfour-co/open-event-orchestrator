import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const { email, editionId } = await request.json()

		if (!email || !editionId) {
			return json({ success: false, error: 'Email and edition are required' }, { status: 400 })
		}

		// Find tickets for this email and edition
		const tickets = await locals.pb.collection('tickets').getFullList({
			filter: `attendeeEmail = "${email}" && editionId = "${editionId}" && status != "cancelled"`,
			expand: 'ticketTypeId,orderId'
		})

		if (tickets.length === 0) {
			return json({ success: false, error: 'No tickets found for this email' }, { status: 404 })
		}

		// Get edition info
		const edition = await locals.pb.collection('editions').getOne(editionId)

		// Map tickets to response format
		const ticketData = tickets.map((ticket) => {
			const ticketType = ticket.expand?.ticketTypeId as Record<string, unknown> | undefined
			const order = ticket.expand?.orderId as Record<string, unknown> | undefined

			return {
				id: ticket.id,
				ticketNumber: ticket.ticketNumber,
				status: ticket.status,
				attendeeFirstName: ticket.attendeeFirstName,
				attendeeLastName: ticket.attendeeLastName,
				attendeeEmail: ticket.attendeeEmail,
				qrCode: ticket.qrCode,
				checkedInAt: ticket.checkedInAt,
				ticketType: ticketType
					? {
							name: ticketType.name,
							description: ticketType.description
						}
					: null,
				order: order
					? {
							orderNumber: order.orderNumber,
							status: order.status
						}
					: null
			}
		})

		return json({
			success: true,
			tickets: ticketData,
			edition: {
				name: edition.name,
				startDate: edition.startDate,
				endDate: edition.endDate,
				venue: edition.venue,
				city: edition.city,
				country: edition.country
			}
		})
	} catch (err) {
		console.error('Ticket lookup error:', err)
		return json({ success: false, error: 'Failed to lookup tickets' }, { status: 500 })
	}
}
