import { safeFilter } from '$lib/server/safe-filter'
import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

interface TicketWithDetails {
  id: string
  status: string
  ticketTypeId: string
  checkedInAt: string | null
}

interface TicketTypeInfo {
  id: string
  name: string
}

interface HourlyStats {
  hour: number
  count: number
}

interface TicketTypeStats {
  id: string
  name: string
  total: number
  checkedIn: number
  percentage: number
}

export const load: PageServerLoad = async ({ params, locals }) => {
  const { editionSlug } = params

  // Get edition
  const editions = await locals.pb.collection('editions').getList(1, 1, {
    filter: safeFilter`slug = ${editionSlug}`
  })

  if (editions.items.length === 0) {
    throw error(404, 'Edition not found')
  }

  const edition = editions.items[0]
  const editionId = edition.id as string

  // Get all tickets with details
  const tickets = (await locals.pb.collection('billing_tickets').getFullList({
    filter: safeFilter`editionId = ${editionId}`,
    fields: 'id,status,ticketTypeId,checkedInAt'
  })) as TicketWithDetails[]

  // Get ticket types for names
  const ticketTypes = (await locals.pb.collection('ticket_types').getFullList({
    filter: safeFilter`editionId = ${editionId}`,
    fields: 'id,name'
  })) as TicketTypeInfo[]

  const ticketTypeMap = new Map(ticketTypes.map((tt) => [tt.id, tt.name]))

  // Calculate overall stats
  let totalValid = 0
  let totalCheckedIn = 0
  const byTicketType = new Map<string, { total: number; checkedIn: number }>()
  const hourlyCheckins: number[] = new Array(24).fill(0)

  for (const ticket of tickets) {
    if (ticket.status === 'cancelled') continue

    totalValid++
    const typeId = ticket.ticketTypeId

    let typeStats = byTicketType.get(typeId)
    if (!typeStats) {
      typeStats = { total: 0, checkedIn: 0 }
      byTicketType.set(typeId, typeStats)
    }
    typeStats.total++

    if (ticket.status === 'used') {
      totalCheckedIn++
      typeStats.checkedIn++

      // Track hourly check-ins
      if (ticket.checkedInAt) {
        const hour = new Date(ticket.checkedInAt).getHours()
        hourlyCheckins[hour]++
      }
    }
  }

  // Build ticket type stats array
  const ticketTypeStats: TicketTypeStats[] = []
  for (const [typeId, stats] of byTicketType) {
    ticketTypeStats.push({
      id: typeId,
      name: ticketTypeMap.get(typeId) || 'Unknown',
      total: stats.total,
      checkedIn: stats.checkedIn,
      percentage: stats.total > 0 ? Math.round((stats.checkedIn / stats.total) * 100) : 0
    })
  }

  // Sort by total descending
  ticketTypeStats.sort((a, b) => b.total - a.total)

  // Build hourly stats (only hours with check-ins)
  const hourlyStats: HourlyStats[] = []
  for (let hour = 0; hour < 24; hour++) {
    if (hourlyCheckins[hour] > 0) {
      hourlyStats.push({ hour, count: hourlyCheckins[hour] })
    }
  }

  // Find peak hour
  let peakHour = 0
  let peakCount = 0
  for (let hour = 0; hour < 24; hour++) {
    if (hourlyCheckins[hour] > peakCount) {
      peakCount = hourlyCheckins[hour]
      peakHour = hour
    }
  }

  // Calculate check-in rate (per hour average)
  const hoursWithCheckins = hourlyStats.length
  const averagePerHour = hoursWithCheckins > 0 ? Math.round(totalCheckedIn / hoursWithCheckins) : 0

  return {
    edition: {
      id: editionId,
      name: edition.name as string,
      slug: edition.slug as string
    },
    stats: {
      totalValid,
      totalCheckedIn,
      percentage: totalValid > 0 ? Math.round((totalCheckedIn / totalValid) * 100) : 0,
      averagePerHour,
      peakHour,
      peakCount
    },
    ticketTypeStats,
    hourlyStats,
    lastUpdated: new Date().toISOString()
  }
}
