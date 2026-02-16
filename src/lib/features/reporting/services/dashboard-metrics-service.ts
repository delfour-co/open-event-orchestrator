import type PocketBase from 'pocketbase'
import type { EditionMetrics } from '../domain/metrics'

/**
 * Creates a dashboard metrics service for fetching edition metrics
 */
export const createDashboardMetricsService = (pb: PocketBase) => {
  async function getEditionMetrics(editionId: string): Promise<EditionMetrics> {
    const edition = await pb.collection('editions').getOne(editionId)
    const eventId = edition.eventId as string

    const [
      ticketTypes,
      orders,
      tickets,
      talks,
      sessions,
      tracks,
      rooms,
      contacts,
      sponsors,
      budget
    ] = await Promise.all([
      pb
        .collection('ticket_types')
        .getFullList({ filter: `editionId = "${editionId}"` })
        .catch(() => []),
      pb
        .collection('orders')
        .getFullList({ filter: `editionId = "${editionId}"` })
        .catch(() => []),
      pb
        .collection('billing_tickets')
        .getFullList({ filter: `editionId = "${editionId}"` })
        .catch(() => []),
      pb
        .collection('talks')
        .getFullList({ filter: `editionId = "${editionId}"` })
        .catch(() => []),
      pb
        .collection('sessions')
        .getFullList({ filter: `editionId = "${editionId}"` })
        .catch(() => []),
      pb
        .collection('tracks')
        .getFullList({ filter: `editionId = "${editionId}"` })
        .catch(() => []),
      pb
        .collection('rooms')
        .getFullList({ filter: `editionId = "${editionId}"` })
        .catch(() => []),
      pb
        .collection('contacts')
        .getFullList({ filter: `eventId = "${eventId}"` })
        .catch(() => []),
      pb
        .collection('edition_sponsors')
        .getFullList({ filter: `editionId = "${editionId}"` })
        .catch(() => []),
      pb
        .collection('edition_budgets')
        .getList(1, 1, { filter: `editionId = "${editionId}"` })
        .catch(() => ({ items: [] }))
    ])

    // Calculate billing metrics
    let totalRevenue = 0
    let paidOrdersCount = 0
    for (const order of orders) {
      if (order.status === 'paid') {
        totalRevenue += (order.totalAmount as number) || 0
        paidOrdersCount++
      }
    }

    let ticketsSold = 0
    let ticketsCheckedIn = 0
    for (const ticket of tickets) {
      if (ticket.status !== 'cancelled') ticketsSold++
      if (ticket.status === 'used') ticketsCheckedIn++
    }

    let ticketsAvailable = 0
    for (const tt of ticketTypes) {
      ticketsAvailable += ((tt.quantity as number) || 0) - ((tt.quantitySold as number) || 0)
    }

    // Calculate CFP metrics
    let pendingReviews = 0
    let acceptedTalks = 0
    let rejectedTalks = 0
    for (const talk of talks) {
      const status = talk.status as string
      if (status === 'submitted' || status === 'in_review') pendingReviews++
      if (status === 'accepted') acceptedTalks++
      if (status === 'rejected') rejectedTalks++
    }

    // Calculate planning metrics
    let scheduledSessions = 0
    let unscheduledSessions = 0
    for (const session of sessions) {
      if (session.slotId) scheduledSessions++
      else unscheduledSessions++
    }

    // Calculate sponsor metrics
    let confirmedSponsors = 0
    let pendingSponsors = 0
    let totalSponsorshipValue = 0
    for (const sponsor of sponsors) {
      const status = sponsor.status as string
      if (status === 'confirmed') {
        confirmedSponsors++
        totalSponsorshipValue += (sponsor.amount as number) || 0
      }
      if (status === 'pending' || status === 'contacted') pendingSponsors++
    }

    // Calculate budget metrics
    const budgetData = budget.items[0]
    const totalBudget = budgetData ? (budgetData.totalBudget as number) || 0 : 0
    const spent = budgetData ? (budgetData.spent as number) || 0 : 0

    return {
      billing: {
        totalRevenue,
        currency: 'EUR',
        ticketsSold,
        ticketsAvailable,
        ordersCount: orders.length,
        paidOrdersCount,
        checkInRate: ticketsSold > 0 ? Math.round((ticketsCheckedIn / ticketsSold) * 100) : 0,
        ticketsCheckedIn
      },
      cfp: {
        totalSubmissions: talks.length,
        pendingReviews,
        acceptedTalks,
        rejectedTalks,
        speakersCount: new Set(talks.map((t) => t.speakerId)).size,
        averageRating: 0
      },
      planning: {
        totalSessions: sessions.length,
        scheduledSessions,
        unscheduledSessions,
        tracksCount: tracks.length,
        roomsCount: rooms.length,
        slotsUsed: scheduledSessions,
        slotsAvailable: rooms.length * 10 - scheduledSessions
      },
      crm: {
        totalContacts: contacts.length,
        newContactsThisWeek: 0,
        emailsSent: 0,
        openRate: 0,
        clickRate: 0
      },
      sponsoring: {
        totalSponsors: sponsors.length,
        confirmedSponsors,
        pendingSponsors,
        totalSponsorshipValue,
        currency: 'EUR'
      },
      budget: {
        totalBudget,
        spent,
        remaining: totalBudget - spent,
        currency: 'EUR',
        transactionsCount: 0
      },
      lastUpdated: new Date()
    }
  }

  return {
    getEditionMetrics
  }
}

export type DashboardMetricsService = ReturnType<typeof createDashboardMetricsService>
