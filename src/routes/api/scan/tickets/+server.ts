import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ url, locals }) => {
  const editionId = url.searchParams.get('editionId')

  if (!editionId) {
    throw error(400, 'editionId is required')
  }

  // Verify user is authenticated
  if (!locals.pb.authStore.isValid) {
    throw error(401, 'Authentication required')
  }

  try {
    // Get all valid tickets for offline caching
    const records = await locals.pb.collection('billing_tickets').getFullList({
      filter: `editionId = "${editionId}" && status != "cancelled"`,
      fields: 'ticketNumber,editionId,attendeeFirstName,attendeeLastName,attendeeEmail,status'
    })

    const tickets = records.map((record) => ({
      ticketNumber: record.ticketNumber as string,
      editionId: record.editionId as string,
      attendeeFirstName: record.attendeeFirstName as string,
      attendeeLastName: record.attendeeLastName as string,
      attendeeEmail: record.attendeeEmail as string,
      status: record.status as 'valid' | 'used' | 'cancelled'
    }))

    return json({ tickets })
  } catch (err) {
    console.error('Failed to fetch tickets:', err)
    throw error(500, 'Failed to fetch tickets')
  }
}
