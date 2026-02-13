import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

/**
 * Returns ticket status updates for synchronization.
 * Only returns ticketNumber and status for minimal bandwidth.
 */
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
    // Get all tickets with their current status
    const records = await locals.pb.collection('billing_tickets').getFullList({
      filter: `editionId = "${editionId}"`,
      fields: 'ticketNumber,status'
    })

    const tickets = records.map((record) => ({
      ticketNumber: record.ticketNumber as string,
      status: record.status as 'valid' | 'used' | 'cancelled'
    }))

    return json({ tickets })
  } catch (err) {
    console.error('Failed to fetch ticket updates:', err)
    throw error(500, 'Failed to fetch ticket updates')
  }
}
