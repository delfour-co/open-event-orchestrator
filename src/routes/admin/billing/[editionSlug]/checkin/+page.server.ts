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

  // Get all tickets for stats
  const tickets = await locals.pb.collection('billing_tickets').getFullList({
    filter: `editionId = "${editionId}"`,
    fields: 'status,checkedInBy,checkedInAt'
  })

  let total = 0
  let checkedIn = 0
  const scannerStats = new Map<string, { count: number; lastActivity: string }>()

  for (const ticket of tickets) {
    if (ticket.status !== 'cancelled') total++
    if (ticket.status === 'used') {
      checkedIn++
      const scannerId = ticket.checkedInBy as string
      if (scannerId) {
        const existing = scannerStats.get(scannerId)
        const checkedInAt = ticket.checkedInAt as string
        if (existing) {
          existing.count++
          if (checkedInAt > existing.lastActivity) {
            existing.lastActivity = checkedInAt
          }
        } else {
          scannerStats.set(scannerId, { count: 1, lastActivity: checkedInAt })
        }
      }
    }
  }

  // Get recent check-ins
  const recentCheckIns = await locals.pb.collection('billing_tickets').getList(1, 15, {
    filter: `editionId = "${editionId}" && status = "used"`,
    sort: '-checkedInAt',
    fields: 'attendeeFirstName,attendeeLastName,ticketNumber,checkedInAt,checkedInBy'
  })

  // Get scanner user names
  const scannerIds = [...scannerStats.keys()]
  const scannerNames = new Map<string, string>()
  if (scannerIds.length > 0) {
    try {
      const users = await locals.pb.collection('users').getFullList({
        filter: scannerIds.map((id) => `id = "${id}"`).join(' || '),
        fields: 'id,name,email'
      })
      for (const user of users) {
        scannerNames.set(user.id, (user.name as string) || (user.email as string) || user.id)
      }
    } catch {
      // If we can't fetch users, use IDs
    }
  }

  // Build scanner list with names
  const scanners = Array.from(scannerStats.entries()).map(([id, stats]) => ({
    id,
    name: scannerNames.get(id) || id.slice(0, 8),
    count: stats.count,
    lastActivity: stats.lastActivity
  }))
  scanners.sort((a, b) => b.count - a.count)

  return {
    edition: {
      id: editionId,
      name: edition.name as string,
      slug: edition.slug as string
    },
    stats: {
      total,
      checkedIn
    },
    scanners,
    recentCheckIns: recentCheckIns.items.map((t) => ({
      name: `${t.attendeeFirstName} ${t.attendeeLastName}`,
      ticketNumber: t.ticketNumber as string,
      checkedInAt: t.checkedInAt as string,
      checkedInBy:
        scannerNames.get(t.checkedInBy as string) ||
        (t.checkedInBy as string)?.slice(0, 8) ||
        'Unknown'
    }))
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
