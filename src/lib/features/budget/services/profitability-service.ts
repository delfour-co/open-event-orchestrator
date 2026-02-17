import { safeFilter } from '$lib/server/safe-filter'
import type PocketBase from 'pocketbase'

export interface ProfitabilityMetrics {
  ticketRevenue: number
  sponsorshipRevenue: number
  otherIncome: number
  totalRevenue: number
  plannedCosts: number
  actualCosts: number
  pendingCosts: number
  totalCosts: number
  grossProfit: number
  grossMargin: number
  netProfit: number
  netMargin: number
  breakEvenAttendees: number
  breakEvenProgress: number
  currentAttendees: number
  averageTicketPrice: number
  costVariance: number
  costVariancePercentage: number
  revenueVariance: number
  revenueVariancePercentage: number
}

export interface BreakEvenParams {
  fixedCosts: number
  variableCostPerAttendee: number
  ticketPrice: number
  sponsorshipRevenue: number
}

export interface BreakEvenResult {
  breakEvenAttendees: number
  breakEvenRevenue: number
  safetyMargin: number
  contributionMargin: number
}

export interface ProfitabilityService {
  calculateProfitability(editionId: string): Promise<ProfitabilityMetrics>
  calculateBreakEven(params: BreakEvenParams): BreakEvenResult
}

// Helper functions to reduce cognitive complexity
async function getTicketData(pb: PocketBase, editionId: string) {
  const orders = await pb.collection('orders').getFullList({
    filter: safeFilter`editionId = ${editionId} && status = "completed"`,
    fields: 'totalAmount'
  })
  const ticketRevenue = orders.reduce((sum, o) => sum + ((o.totalAmount as number) || 0), 0)

  const ticketsResult = await pb.collection('billing_tickets').getList(1, 1, {
    filter: safeFilter`editionId = ${editionId}`,
    fields: 'id'
  })
  const currentAttendees = ticketsResult.totalItems
  const averageTicketPrice = currentAttendees > 0 ? Math.round(ticketRevenue / currentAttendees) : 0

  return { ticketRevenue, currentAttendees, averageTicketPrice }
}

async function getSponsorshipRevenue(pb: PocketBase, editionId: string) {
  const sponsors = await pb.collection('edition_sponsors').getFullList({
    filter: safeFilter`editionId = ${editionId} && status = "confirmed"`,
    fields: 'amount'
  })
  return sponsors.reduce((sum, s) => sum + ((s.amount as number) || 0), 0)
}

async function getBudgetData(pb: PocketBase, editionId: string) {
  let budget = null
  try {
    budget = await pb
      .collection('edition_budgets')
      .getFirstListItem(safeFilter`editionId = ${editionId}`)
  } catch {
    // No budget found
  }

  const plannedBudget = (budget?.plannedBudget as number) || 0
  const budgetId = budget?.id as string

  let categories: Array<{ id: string; plannedAmount: number }> = []
  if (budgetId) {
    const categoryRecords = await pb.collection('budget_categories').getFullList({
      filter: safeFilter`budgetId = ${budgetId}`,
      fields: 'id,plannedAmount'
    })
    categories = categoryRecords.map((c) => ({
      id: c.id as string,
      plannedAmount: (c.plannedAmount as number) || 0
    }))
  }

  const plannedCosts = categories.reduce((sum, c) => sum + c.plannedAmount, 0) || plannedBudget

  return { plannedBudget, plannedCosts, categories }
}

async function getTransactionData(
  pb: PocketBase,
  categories: Array<{ id: string; plannedAmount: number }>
) {
  let actualCosts = 0
  let pendingCosts = 0
  let otherIncome = 0

  if (categories.length === 0) {
    return { actualCosts, pendingCosts, otherIncome }
  }

  const categoryIds = categories.map((c) => c.id)
  const categoryFilter = categoryIds.map((id) => `categoryId = "${id}"`).join(' || ')

  const transactions = await pb.collection('budget_transactions').getFullList({
    filter: `(${categoryFilter})`,
    fields: 'type,amount,status'
  })

  for (const t of transactions) {
    const amount = (t.amount as number) || 0
    const isExpense = t.type === 'expense'
    const isPaid = t.status === 'paid'
    const isPending = t.status === 'pending'

    if (isExpense && isPaid) actualCosts += amount
    else if (isExpense && isPending) pendingCosts += amount
    else if (!isExpense && isPaid) otherIncome += amount
  }

  return { actualCosts, pendingCosts, otherIncome }
}

function calculateProfitMetrics(totalRevenue: number, actualCosts: number, totalCosts: number) {
  const grossProfit = totalRevenue - actualCosts
  const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0
  const netProfit = totalRevenue - totalCosts
  const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

  return {
    grossProfit,
    grossMargin: Math.round(grossMargin * 100) / 100,
    netProfit,
    netMargin: Math.round(netMargin * 100) / 100
  }
}

function calculateVariances(
  plannedCosts: number,
  totalCosts: number,
  plannedBudget: number,
  totalRevenue: number
) {
  const costVariance = plannedCosts - totalCosts
  const costVariancePercentage = plannedCosts > 0 ? (costVariance / plannedCosts) * 100 : 0

  const expectedRevenue = plannedBudget > 0 ? plannedBudget : totalRevenue
  const revenueVariance = totalRevenue - expectedRevenue
  const revenueVariancePercentage =
    expectedRevenue > 0 ? (revenueVariance / expectedRevenue) * 100 : 0

  return {
    costVariance,
    costVariancePercentage: Math.round(costVariancePercentage * 100) / 100,
    revenueVariance,
    revenueVariancePercentage: Math.round(revenueVariancePercentage * 100) / 100
  }
}

function calculateBreakEvenMetrics(
  currentAttendees: number,
  actualCosts: number,
  averageTicketPrice: number,
  sponsorshipRevenue: number
) {
  const variableCostPerAttendee =
    currentAttendees > 0 ? Math.round((actualCosts * 0.3) / currentAttendees) : 0
  const fixedCosts = Math.round(actualCosts * 0.7)
  const contributionMargin = averageTicketPrice - variableCostPerAttendee

  const breakEvenAttendees =
    contributionMargin > 0 ? Math.ceil((fixedCosts - sponsorshipRevenue) / contributionMargin) : 0

  const breakEvenProgress =
    breakEvenAttendees > 0 ? Math.min(100, (currentAttendees / breakEvenAttendees) * 100) : 100

  return {
    breakEvenAttendees: Math.max(0, breakEvenAttendees),
    breakEvenProgress: Math.round(breakEvenProgress * 100) / 100
  }
}

export function createProfitabilityService(pb: PocketBase): ProfitabilityService {
  return {
    async calculateProfitability(editionId: string): Promise<ProfitabilityMetrics> {
      const ticketData = await getTicketData(pb, editionId)
      const sponsorshipRevenue = await getSponsorshipRevenue(pb, editionId)
      const budgetData = await getBudgetData(pb, editionId)
      const transactionData = await getTransactionData(pb, budgetData.categories)

      const totalCosts = transactionData.actualCosts + transactionData.pendingCosts
      const totalRevenue =
        ticketData.ticketRevenue + sponsorshipRevenue + transactionData.otherIncome

      const profitMetrics = calculateProfitMetrics(
        totalRevenue,
        transactionData.actualCosts,
        totalCosts
      )
      const variances = calculateVariances(
        budgetData.plannedCosts,
        totalCosts,
        budgetData.plannedBudget,
        totalRevenue
      )
      const breakEven = calculateBreakEvenMetrics(
        ticketData.currentAttendees,
        transactionData.actualCosts,
        ticketData.averageTicketPrice,
        sponsorshipRevenue
      )

      return {
        ticketRevenue: ticketData.ticketRevenue,
        sponsorshipRevenue,
        otherIncome: transactionData.otherIncome,
        totalRevenue,
        plannedCosts: budgetData.plannedCosts,
        actualCosts: transactionData.actualCosts,
        pendingCosts: transactionData.pendingCosts,
        totalCosts,
        ...profitMetrics,
        ...breakEven,
        currentAttendees: ticketData.currentAttendees,
        averageTicketPrice: ticketData.averageTicketPrice,
        ...variances
      }
    },

    calculateBreakEven(params: BreakEvenParams): BreakEvenResult {
      const { fixedCosts, variableCostPerAttendee, ticketPrice, sponsorshipRevenue } = params
      const contributionMargin = ticketPrice - variableCostPerAttendee

      if (contributionMargin <= 0) {
        return {
          breakEvenAttendees: Number.POSITIVE_INFINITY,
          breakEvenRevenue: Number.POSITIVE_INFINITY,
          safetyMargin: -100,
          contributionMargin: 0
        }
      }

      const costsToRecover = Math.max(0, fixedCosts - sponsorshipRevenue)
      const breakEvenAttendees = Math.ceil(costsToRecover / contributionMargin)
      const breakEvenRevenue = breakEvenAttendees * ticketPrice

      return {
        breakEvenAttendees,
        breakEvenRevenue,
        safetyMargin: (contributionMargin / ticketPrice) * 100,
        contributionMargin
      }
    }
  }
}
