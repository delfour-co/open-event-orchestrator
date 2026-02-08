import { redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals, url }) => {
  // Authentication check
  if (!locals.user) {
    throw redirect(303, '/auth/login')
  }

  const selectedEditionId = url.searchParams.get('edition') || ''

  // Get all editions
  const editions = await locals.pb.collection('editions').getFullList({
    sort: '-year'
  })

  // Get talks count per edition
  const talks = await locals.pb.collection('talks').getFullList()

  // Get recent submissions (last 5)
  const recentTalks = await locals.pb.collection('talks').getList(1, 5, {
    sort: '-created',
    expand: 'speakerId'
  })

  // Calculate stats
  const selectedEdition = selectedEditionId
    ? editions.find((e) => e.id === selectedEditionId)
    : null

  const filteredTalks = selectedEditionId
    ? talks.filter((t) => t.editionId === selectedEditionId)
    : talks

  const stats = {
    totalTalks: filteredTalks.length,
    submittedTalks: filteredTalks.filter((t) => t.status === 'submitted').length,
    acceptedTalks: filteredTalks.filter((t) => t.status === 'accepted').length,
    rejectedTalks: filteredTalks.filter((t) => t.status === 'rejected').length,
    underReviewTalks: filteredTalks.filter((t) => t.status === 'under_review').length
  }

  // Billing data
  const editionFilter = selectedEditionId ? `editionId = "${selectedEditionId}"` : ''

  let orders: Array<Record<string, unknown>> = []
  let tickets: Array<Record<string, unknown>> = []
  try {
    orders = await locals.pb.collection('orders').getFullList({
      filter: editionFilter || undefined,
      sort: '-created'
    })
    tickets = await locals.pb.collection('billing_tickets').getFullList({
      filter: editionFilter || undefined
    })
  } catch {
    // Collections may not exist yet
  }

  const paidOrders = orders.filter((o) => o.status === 'paid')
  const totalRevenue = paidOrders.reduce((sum, o) => sum + ((o.totalAmount as number) || 0), 0)
  const ticketsCheckedIn = tickets.filter((t) => t.status === 'used').length

  const billingStats = {
    totalRevenue,
    totalOrders: orders.length,
    paidOrders: paidOrders.length,
    pendingOrders: orders.filter((o) => o.status === 'pending').length,
    cancelledOrders: orders.filter((o) => o.status === 'cancelled').length,
    ticketsSold: tickets.filter((t) => t.status !== 'cancelled').length,
    ticketsCheckedIn,
    checkInRate: tickets.length > 0 ? Math.round((ticketsCheckedIn / tickets.length) * 100) : 0
  }

  // Budget data
  let budgetRecords: Array<Record<string, unknown>> = []
  let budgetTransactions: Array<Record<string, unknown>> = []
  let budgetCategories: Array<Record<string, unknown>> = []
  try {
    const budgetFilter = selectedEditionId ? `editionId = "${selectedEditionId}"` : ''
    budgetRecords = await locals.pb.collection('edition_budgets').getFullList({
      filter: budgetFilter || undefined
    })

    if (budgetRecords.length > 0) {
      const budgetIds = budgetRecords.map((b) => b.id as string)
      const catFilter = budgetIds.map((id) => `budgetId = "${id}"`).join(' || ')
      budgetCategories = await locals.pb.collection('budget_categories').getFullList({
        filter: catFilter
      })

      if (budgetCategories.length > 0) {
        const catIds = budgetCategories.map((c) => c.id as string)
        const txFilter = catIds.map((id) => `categoryId = "${id}"`).join(' || ')
        budgetTransactions = await locals.pb.collection('budget_transactions').getFullList({
          filter: txFilter
        })
      }
    }
  } catch {
    // Collections may not exist yet
  }

  const totalBudgetAmount = budgetRecords.reduce(
    (sum, b) => sum + ((b.totalBudget as number) || 0),
    0
  )
  let budgetExpenses = 0
  let budgetIncome = 0
  for (const t of budgetTransactions) {
    if (t.status === 'paid') {
      if (t.type === 'expense') budgetExpenses += (t.amount as number) || 0
      if (t.type === 'income') budgetIncome += (t.amount as number) || 0
    }
  }
  const budgetBalance = totalBudgetAmount - budgetExpenses + budgetIncome
  const budgetUsagePercent =
    totalBudgetAmount > 0 ? Math.round((budgetExpenses / totalBudgetAmount) * 100) : 0

  const budgetStats = {
    totalBudget: totalBudgetAmount,
    expenses: budgetExpenses,
    income: budgetIncome,
    balance: budgetBalance,
    usagePercent: Math.min(budgetUsagePercent, 100),
    categoriesCount: budgetCategories.length,
    transactionsCount: budgetTransactions.length,
    budgetCount: budgetRecords.length,
    currency: ((budgetRecords[0]?.currency as string) || 'EUR') as string
  }

  // Sponsoring data
  let editionSponsors: Array<Record<string, unknown>> = []
  let sponsorPackages: Array<Record<string, unknown>> = []
  try {
    const sponsorFilter = selectedEditionId ? `editionId = "${selectedEditionId}"` : ''
    editionSponsors = await locals.pb.collection('edition_sponsors').getFullList({
      filter: sponsorFilter || undefined,
      expand: 'packageId'
    })
    sponsorPackages = await locals.pb.collection('sponsor_packages').getFullList({
      filter: sponsorFilter || undefined
    })
  } catch {
    // Collections may not exist yet
  }

  const confirmedSponsors = editionSponsors.filter((s) => s.status === 'confirmed')
  const sponsorRevenue = confirmedSponsors.reduce((sum, s) => sum + ((s.amount as number) || 0), 0)
  const paidSponsors = confirmedSponsors.filter((s) => s.paidAt).length
  const pipelineValue = editionSponsors
    .filter((s) => s.status === 'negotiating' || s.status === 'contacted')
    .reduce((sum, s) => {
      const expand = s.expand as Record<string, Record<string, unknown>> | undefined
      const pkg = expand?.packageId
      return sum + ((s.amount as number) || (pkg?.price as number) || 0)
    }, 0)

  const sponsoringStats = {
    totalSponsors: editionSponsors.length,
    confirmedSponsors: confirmedSponsors.length,
    paidSponsors,
    prospects: editionSponsors.filter((s) => s.status === 'prospect').length,
    contacted: editionSponsors.filter((s) => s.status === 'contacted').length,
    negotiating: editionSponsors.filter((s) => s.status === 'negotiating').length,
    declined: editionSponsors.filter((s) => s.status === 'declined').length,
    revenue: sponsorRevenue,
    pipelineValue,
    packagesCount: sponsorPackages.length,
    currency: ((sponsorPackages[0]?.currency as string) || 'EUR') as string
  }

  const recentOrders = orders.slice(0, 5).map((o) => ({
    id: o.id as string,
    orderNumber: o.orderNumber as string,
    email: o.email as string,
    firstName: o.firstName as string,
    lastName: o.lastName as string,
    status: o.status as string,
    totalAmount: (o.totalAmount as number) || 0,
    currency: ((o.currency as string) || 'EUR') as string,
    createdAt: new Date(o.created as string)
  }))

  return {
    editions: editions.map((e) => ({
      id: e.id as string,
      name: e.name as string,
      slug: e.slug as string,
      year: e.year as number,
      status: e.status as string
    })),
    selectedEditionId,
    selectedEdition: selectedEdition
      ? {
          id: selectedEdition.id as string,
          name: selectedEdition.name as string,
          slug: selectedEdition.slug as string
        }
      : null,
    stats,
    billingStats,
    budgetStats,
    sponsoringStats,
    recentOrders,
    recentSubmissions: recentTalks.items.map((t) => ({
      id: t.id as string,
      title: t.title as string,
      status: t.status as string,
      createdAt: new Date(t.created as string),
      speakerName: t.expand?.speakerId
        ? `${(t.expand.speakerId as Record<string, unknown>).firstName} ${(t.expand.speakerId as Record<string, unknown>).lastName}`
        : 'Unknown'
    })),
    upcomingEditions: editions
      .filter((e) => new Date(e.startDate as string) > new Date())
      .slice(0, 3)
      .map((e) => ({
        id: e.id as string,
        name: e.name as string,
        slug: e.slug as string,
        startDate: new Date(e.startDate as string),
        status: e.status as string
      }))
  }
}
