import { canManageEvents } from '$lib/server/permissions'
import { fail, redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals, url }) => {
  // Authentication check
  if (!locals.user) {
    throw redirect(303, '/auth/login')
  }

  const selectedEditionId = url.searchParams.get('edition') || ''

  // Get all organizations for the quick setup wizard
  const organizations = await locals.pb.collection('organizations').getFullList({
    sort: 'name'
  })

  // Get all editions
  const editions = await locals.pb.collection('editions').getFullList({
    sort: '-year'
  })

  // Get recent submissions (last 5), filtered by edition if selected
  const recentTalksFilter = selectedEditionId ? `editionId = "${selectedEditionId}"` : ''
  const recentTalks = await locals.pb.collection('talks').getList(1, 5, {
    sort: '-created',
    expand: 'speakerId',
    filter: recentTalksFilter || undefined
  })

  // Calculate stats using count queries instead of loading all talks
  const selectedEdition = selectedEditionId
    ? editions.find((e) => e.id === selectedEditionId)
    : null

  const talksBaseFilter = selectedEditionId ? `editionId = "${selectedEditionId}"` : ''
  const talksFilterPrefix = talksBaseFilter ? `${talksBaseFilter} && ` : ''

  const [totalTalksResult, submittedResult, acceptedResult, rejectedResult, underReviewResult] =
    await Promise.all([
      locals.pb.collection('talks').getList(1, 1, {
        filter: talksBaseFilter || undefined,
        requestKey: 'talks-total'
      }),
      locals.pb.collection('talks').getList(1, 1, {
        filter: `${talksFilterPrefix}status = "submitted"`,
        requestKey: 'talks-submitted'
      }),
      locals.pb.collection('talks').getList(1, 1, {
        filter: `${talksFilterPrefix}status = "accepted"`,
        requestKey: 'talks-accepted'
      }),
      locals.pb.collection('talks').getList(1, 1, {
        filter: `${talksFilterPrefix}status = "rejected"`,
        requestKey: 'talks-rejected'
      }),
      locals.pb.collection('talks').getList(1, 1, {
        filter: `${talksFilterPrefix}status = "under_review"`,
        requestKey: 'talks-review'
      })
    ])

  const stats = {
    totalTalks: totalTalksResult.totalItems,
    submittedTalks: submittedResult.totalItems,
    acceptedTalks: acceptedResult.totalItems,
    rejectedTalks: rejectedResult.totalItems,
    underReviewTalks: underReviewResult.totalItems
  }

  // Billing data - use count queries instead of loading all records
  const editionFilter = selectedEditionId ? `editionId = "${selectedEditionId}"` : ''
  const editionFilterPrefix = editionFilter ? `${editionFilter} && ` : ''

  let recentOrdersList: Array<Record<string, unknown>> = []
  let billingStats = {
    totalRevenue: 0,
    totalOrders: 0,
    paidOrders: 0,
    pendingOrders: 0,
    cancelledOrders: 0,
    ticketsSold: 0,
    ticketsCheckedIn: 0,
    checkInRate: 0
  }
  try {
    const [
      allOrdersResult,
      paidOrdersResult,
      pendingOrdersResult,
      cancelledOrdersResult,
      allTicketsResult,
      usedTicketsResult,
      nonCancelledTicketsResult,
      recentOrdersResult
    ] = await Promise.all([
      locals.pb.collection('orders').getList(1, 1, {
        filter: editionFilter || undefined,
        requestKey: 'orders-total'
      }),
      locals.pb.collection('orders').getList(1, 1, {
        filter: `${editionFilterPrefix}status = "paid"`,
        requestKey: 'orders-paid'
      }),
      locals.pb.collection('orders').getList(1, 1, {
        filter: `${editionFilterPrefix}status = "pending"`,
        requestKey: 'orders-pending'
      }),
      locals.pb.collection('orders').getList(1, 1, {
        filter: `${editionFilterPrefix}status = "cancelled"`,
        requestKey: 'orders-cancelled'
      }),
      locals.pb.collection('billing_tickets').getList(1, 1, {
        filter: editionFilter || undefined,
        requestKey: 'tickets-total'
      }),
      locals.pb.collection('billing_tickets').getList(1, 1, {
        filter: `${editionFilterPrefix}status = "used"`,
        requestKey: 'tickets-used'
      }),
      locals.pb.collection('billing_tickets').getList(1, 1, {
        filter: `${editionFilterPrefix}status != "cancelled"`,
        requestKey: 'tickets-active'
      }),
      locals.pb.collection('orders').getList(1, 5, {
        filter: editionFilter || undefined,
        sort: '-created',
        requestKey: 'orders-recent'
      })
    ])

    // For total revenue, we still need paid orders with amounts
    const paidOrdersForRevenue = await locals.pb.collection('orders').getFullList({
      filter: `${editionFilterPrefix}status = "paid"`,
      fields: 'totalAmount'
    })
    const totalRevenue = paidOrdersForRevenue.reduce(
      (sum, o) => sum + ((o.totalAmount as number) || 0),
      0
    )

    const ticketsCheckedIn = usedTicketsResult.totalItems
    const totalTickets = allTicketsResult.totalItems

    billingStats = {
      totalRevenue,
      totalOrders: allOrdersResult.totalItems,
      paidOrders: paidOrdersResult.totalItems,
      pendingOrders: pendingOrdersResult.totalItems,
      cancelledOrders: cancelledOrdersResult.totalItems,
      ticketsSold: nonCancelledTicketsResult.totalItems,
      ticketsCheckedIn,
      checkInRate: totalTickets > 0 ? Math.round((ticketsCheckedIn / totalTickets) * 100) : 0
    }

    recentOrdersList = recentOrdersResult.items
  } catch {
    // Collections may not exist yet
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

  const recentOrders = recentOrdersList.map((o) => ({
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
    organizations: organizations.map((o) => ({
      id: o.id as string,
      name: o.name as string,
      slug: o.slug as string
    })),
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

export const actions: Actions = {
  quickSetup: async ({ request, locals }) => {
    // Check permission
    const userRole = locals.user?.role as string | undefined
    if (!canManageEvents(userRole)) {
      return fail(403, { error: 'You do not have permission to create events' })
    }

    const data = await request.formData()

    // Organization data
    const createNewOrg = data.get('createNewOrg') === 'true'
    const selectedOrgId = data.get('selectedOrgId') as string
    const newOrgName = data.get('newOrgName') as string
    const newOrgSlug = data.get('newOrgSlug') as string
    const newOrgDescription = data.get('newOrgDescription') as string

    // Event data
    const eventName = data.get('eventName') as string
    const eventSlug = data.get('eventSlug') as string
    const eventDescription = data.get('eventDescription') as string

    // Edition data
    const editionName = data.get('editionName') as string
    const editionSlug = data.get('editionSlug') as string
    const editionYear = Number.parseInt(data.get('editionYear') as string)
    const editionStartDate = data.get('editionStartDate') as string
    const editionEndDate = data.get('editionEndDate') as string
    const editionVenue = data.get('editionVenue') as string
    const editionCity = data.get('editionCity') as string
    const editionCountry = data.get('editionCountry') as string

    // Validation
    if (createNewOrg) {
      if (!newOrgName || newOrgName.length < 2) {
        return fail(400, { error: 'Organization name must be at least 2 characters' })
      }
      if (!newOrgSlug || newOrgSlug.length < 2) {
        return fail(400, { error: 'Organization slug must be at least 2 characters' })
      }
    } else if (!selectedOrgId) {
      return fail(400, { error: 'Please select an organization' })
    }

    if (!eventName || eventName.length < 2) {
      return fail(400, { error: 'Event name must be at least 2 characters' })
    }
    if (!eventSlug || eventSlug.length < 2) {
      return fail(400, { error: 'Event slug must be at least 2 characters' })
    }

    if (!editionName || editionName.length < 2) {
      return fail(400, { error: 'Edition name must be at least 2 characters' })
    }
    if (!editionSlug || editionSlug.length < 2) {
      return fail(400, { error: 'Edition slug must be at least 2 characters' })
    }
    if (!editionYear || editionYear < 2000 || editionYear > 2100) {
      return fail(400, { error: 'Edition year must be between 2000 and 2100' })
    }
    if (!editionStartDate || !editionEndDate) {
      return fail(400, { error: 'Start and end dates are required' })
    }
    if (new Date(editionStartDate) > new Date(editionEndDate)) {
      return fail(400, { error: 'End date must be on or after start date' })
    }

    try {
      let organizationId = selectedOrgId

      // Step 1: Create organization if needed
      if (createNewOrg) {
        // Check if slug already exists
        try {
          const existing = await locals.pb
            .collection('organizations')
            .getFirstListItem(`slug="${newOrgSlug}"`)
          if (existing) {
            return fail(400, { error: 'An organization with this slug already exists' })
          }
        } catch {
          // No existing organization, continue
        }

        const org = await locals.pb.collection('organizations').create({
          name: newOrgName,
          slug: newOrgSlug,
          description: newOrgDescription || undefined
        })
        organizationId = org.id

        // Add user as organization owner (unless super_admin who has global access)
        if (locals.user && userRole !== 'super_admin') {
          await locals.pb.collection('organization_members').create({
            userId: locals.user.id,
            organizationId: org.id,
            role: 'owner'
          })
        }
      }

      // Step 2: Create event
      // Check if event slug already exists
      try {
        const existing = await locals.pb
          .collection('events')
          .getFirstListItem(`slug="${eventSlug}"`)
        if (existing) {
          return fail(400, { error: 'An event with this slug already exists' })
        }
      } catch {
        // No existing event, continue
      }

      const event = await locals.pb.collection('events').create({
        organizationId,
        name: eventName,
        slug: eventSlug,
        description: eventDescription || undefined
      })

      // Step 3: Create edition
      // Check if edition slug already exists
      try {
        const existing = await locals.pb
          .collection('editions')
          .getFirstListItem(`slug="${editionSlug}"`)
        if (existing) {
          return fail(400, { error: 'An edition with this slug already exists' })
        }
      } catch {
        // No existing edition, continue
      }

      await locals.pb.collection('editions').create({
        eventId: event.id,
        name: editionName,
        slug: editionSlug,
        year: editionYear,
        startDate: editionStartDate,
        endDate: editionEndDate,
        venue: editionVenue || undefined,
        city: editionCity || undefined,
        country: editionCountry || undefined,
        status: 'draft'
      })

      return { success: true, editionSlug }
    } catch (e) {
      console.error('Failed to complete quick setup:', e)
      return fail(500, { error: 'Failed to complete setup. Please try again.' })
    }
  }
}
