import type { EditionMetrics } from '$lib/features/reporting/domain/metrics'
import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

type DistributionItem = {
  id: string
  name: string
  count: number
  color?: string
}

export const load: PageServerLoad = async ({ params, locals }) => {
  const { editionSlug } = params

  // Get edition by slug
  const editions = await locals.pb.collection('editions').getList(1, 1, {
    filter: `slug = "${editionSlug}"`,
    expand: 'eventId'
  })

  if (editions.items.length === 0) {
    throw error(404, 'Edition not found')
  }

  const edition = editions.items[0]
  const editionId = edition.id as string
  const eventId = edition.eventId as string

  // Get event info
  let eventName = 'Event'
  let eventSlug = ''
  try {
    const event = await locals.pb.collection('events').getOne(eventId)
    eventName = event.name as string
    eventSlug = event.slug as string
  } catch {
    // Event might not exist, continue with defaults
  }

  // Fetch metrics for the edition
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
    budget,
    categories,
    formats,
    alertThresholds,
    reportConfigs
  ] = await Promise.all([
    locals.pb
      .collection('ticket_types')
      .getFullList({ filter: `editionId = "${editionId}"` })
      .catch(() => []),
    locals.pb
      .collection('orders')
      .getFullList({ filter: `editionId = "${editionId}"` })
      .catch(() => []),
    locals.pb
      .collection('billing_tickets')
      .getFullList({ filter: `editionId = "${editionId}"`, expand: 'ticketTypeId' })
      .catch(() => []),
    locals.pb
      .collection('talks')
      .getFullList({ filter: `editionId = "${editionId}"` })
      .catch(() => []),
    locals.pb
      .collection('sessions')
      .getFullList({ filter: `editionId = "${editionId}"` })
      .catch(() => []),
    locals.pb
      .collection('tracks')
      .getFullList({ filter: `editionId = "${editionId}"` })
      .catch(() => []),
    locals.pb
      .collection('rooms')
      .getFullList({ filter: `editionId = "${editionId}"` })
      .catch(() => []),
    locals.pb
      .collection('contacts')
      .getFullList({ filter: `eventId = "${eventId}"` })
      .catch(() => []),
    locals.pb
      .collection('edition_sponsors')
      .getFullList({ filter: `editionId = "${editionId}"`, expand: 'packageId' })
      .catch(() => []),
    locals.pb
      .collection('edition_budgets')
      .getList(1, 1, { filter: `editionId = "${editionId}"` })
      .catch(() => ({ items: [] })),
    locals.pb
      .collection('categories')
      .getFullList({ filter: `editionId = "${editionId}"` })
      .catch(() => []),
    locals.pb
      .collection('formats')
      .getFullList({ filter: `editionId = "${editionId}"` })
      .catch(() => []),
    locals.pb
      .collection('alert_thresholds')
      .getFullList({ filter: `editionId = "${editionId}"` })
      .catch(() => []),
    locals.pb
      .collection('report_configs')
      .getFullList({ filter: `editionId = "${editionId}"` })
      .catch(() => [])
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

  // Calculate ticket type distribution
  const ticketTypeMap = new Map<string, { name: string; count: number; revenue: number }>()
  for (const tt of ticketTypes) {
    ticketTypeMap.set(tt.id, {
      name: tt.name as string,
      count: 0,
      revenue: 0
    })
  }
  for (const ticket of tickets) {
    if (ticket.status !== 'cancelled') {
      const typeId = ticket.ticketTypeId as string
      const existing = ticketTypeMap.get(typeId)
      if (existing) {
        existing.count++
        existing.revenue += (ticket.price as number) || 0
      }
    }
  }
  const ticketTypeDistribution: DistributionItem[] = Array.from(ticketTypeMap.entries())
    .map(([id, data]) => ({
      id,
      name: data.name,
      count: data.count
    }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count)

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

  // Calculate talk category distribution
  const categoryMap = new Map<string, string>()
  for (const cat of categories) {
    categoryMap.set(cat.id, cat.name as string)
  }
  const talksByCategoryCount = new Map<string, number>()
  for (const talk of talks) {
    const catId = talk.categoryId as string
    if (catId) {
      talksByCategoryCount.set(catId, (talksByCategoryCount.get(catId) || 0) + 1)
    }
  }
  const talkCategoryDistribution: DistributionItem[] = Array.from(talksByCategoryCount.entries())
    .map(([id, count]) => ({
      id,
      name: categoryMap.get(id) || 'Unknown',
      count
    }))
    .sort((a, b) => b.count - a.count)

  // Calculate talk format distribution
  const formatMap = new Map<string, string>()
  for (const fmt of formats) {
    formatMap.set(fmt.id, fmt.name as string)
  }
  const talksByFormatCount = new Map<string, number>()
  for (const talk of talks) {
    const fmtId = talk.formatId as string
    if (fmtId) {
      talksByFormatCount.set(fmtId, (talksByFormatCount.get(fmtId) || 0) + 1)
    }
  }
  const talkFormatDistribution: DistributionItem[] = Array.from(talksByFormatCount.entries())
    .map(([id, count]) => ({
      id,
      name: formatMap.get(id) || 'Unknown',
      count
    }))
    .sort((a, b) => b.count - a.count)

  // Calculate planning metrics
  let scheduledSessions = 0
  let unscheduledSessions = 0
  for (const session of sessions) {
    if (session.slotId) scheduledSessions++
    else unscheduledSessions++
  }

  // Calculate sessions by track distribution
  const trackMap = new Map<string, string>()
  for (const track of tracks) {
    trackMap.set(track.id, track.name as string)
  }
  const sessionsByTrackCount = new Map<string, number>()
  for (const session of sessions) {
    const trackId = session.trackId as string
    if (trackId) {
      sessionsByTrackCount.set(trackId, (sessionsByTrackCount.get(trackId) || 0) + 1)
    }
  }
  const sessionTrackDistribution: DistributionItem[] = Array.from(sessionsByTrackCount.entries())
    .map(([id, count]) => ({
      id,
      name: trackMap.get(id) || 'Unknown',
      count
    }))
    .sort((a, b) => b.count - a.count)

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

  // Calculate sponsor tier distribution
  const sponsorTierCount = new Map<string, number>()
  for (const sponsor of sponsors) {
    if (sponsor.status === 'confirmed') {
      const tierName =
        (sponsor.expand as Record<string, { name?: string }>)?.packageId?.name || 'Other'
      sponsorTierCount.set(tierName, (sponsorTierCount.get(tierName) || 0) + 1)
    }
  }
  const sponsorTierDistribution: DistributionItem[] = Array.from(sponsorTierCount.entries())
    .map(([name, count]) => ({
      id: name,
      name,
      count
    }))
    .sort((a, b) => b.count - a.count)

  // Calculate budget metrics
  const budgetData = budget.items[0]
  const totalBudget = budgetData ? (budgetData.totalBudget as number) || 0 : 0
  const spent = budgetData ? (budgetData.spent as number) || 0 : 0

  const metrics: EditionMetrics = {
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

  return {
    event: {
      id: eventId,
      name: eventName,
      slug: eventSlug
    },
    edition: {
      id: editionId,
      name: edition.name as string,
      slug: edition.slug as string,
      year: edition.year as number,
      startDate: new Date(edition.startDate as string),
      endDate: new Date(edition.endDate as string)
    },
    metrics,
    distributions: {
      ticketTypes: ticketTypeDistribution,
      talkCategories: talkCategoryDistribution,
      talkFormats: talkFormatDistribution,
      sessionTracks: sessionTrackDistribution,
      sponsorTiers: sponsorTierDistribution
    },
    notifications: {
      alertThresholds: {
        total: alertThresholds.length,
        enabled: alertThresholds.filter((a) => a.enabled).length,
        withEmail: alertThresholds.filter((a) => a.notifyByEmail).length
      },
      reportConfigs: {
        total: reportConfigs.length,
        enabled: reportConfigs.filter((r) => r.enabled).length,
        daily: reportConfigs.filter((r) => r.enabled && r.frequency === 'daily').length,
        weekly: reportConfigs.filter((r) => r.enabled && r.frequency === 'weekly').length,
        monthly: reportConfigs.filter((r) => r.enabled && r.frequency === 'monthly').length
      }
    }
  }
}
