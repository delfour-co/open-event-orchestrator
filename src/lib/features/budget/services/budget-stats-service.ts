/**
 * Budget Stats Service
 *
 * Provides statistics for the Budget reporting widget.
 */

import { safeFilter } from '$lib/server/safe-filter'
import type PocketBase from 'pocketbase'
import type { BudgetCurrency } from '../domain/budget'

export interface BudgetOverview {
  totalPlanned: number
  totalActualExpenses: number
  totalActualIncome: number
  budgetVariance: number
  budgetVariancePercentage: number
  currency: BudgetCurrency
  status: 'under' | 'on_track' | 'over'
}

export interface CategoryExpense {
  categoryId: string
  categoryName: string
  plannedAmount: number
  actualAmount: number
  variance: number
  variancePercentage: number
}

export interface CashFlowSummary {
  totalIncome: number
  totalExpenses: number
  netCashFlow: number
  pendingIncome: number
  pendingExpenses: number
  currency: BudgetCurrency
}

export interface RecentTransaction {
  id: string
  description: string
  amount: number
  type: 'expense' | 'income'
  categoryName: string
  date: Date
  status: 'pending' | 'paid' | 'cancelled'
}

export interface BudgetStatsService {
  getBudgetOverview(editionId: string): Promise<BudgetOverview | null>
  getExpensesByCategory(editionId: string): Promise<CategoryExpense[]>
  getCashFlow(editionId: string): Promise<CashFlowSummary | null>
  getRecentTransactions(editionId: string, limit?: number): Promise<RecentTransaction[]>
}

const DEFAULT_TRANSACTION_LIMIT = 5
const VARIANCE_THRESHOLD = 0.05 // 5% variance is considered "on track"

export function createBudgetStatsService(pb: PocketBase): BudgetStatsService {
  async function getBudgetForEdition(editionId: string) {
    try {
      const records = await pb.collection('edition_budgets').getList(1, 1, {
        filter: safeFilter`editionId = ${editionId}`
      })
      if (records.items.length === 0) return null
      return records.items[0]
    } catch {
      return null
    }
  }

  async function getCategoriesForBudget(budgetId: string) {
    try {
      const records = await pb.collection('budget_categories').getFullList({
        filter: safeFilter`budgetId = ${budgetId}`,
        sort: 'name'
      })
      return records
    } catch {
      return []
    }
  }

  async function getTransactionsForCategory(categoryId: string) {
    try {
      const records = await pb.collection('budget_transactions').getFullList({
        filter: safeFilter`categoryId = ${categoryId}`,
        sort: '-date'
      })
      return records
    } catch {
      return []
    }
  }

  return {
    async getBudgetOverview(editionId: string): Promise<BudgetOverview | null> {
      const budget = await getBudgetForEdition(editionId)
      if (!budget) return null

      const budgetId = budget.id as string
      const currency = (budget.currency as BudgetCurrency) || 'EUR'
      const totalPlanned = (budget.totalBudget as number) || 0

      const categories = await getCategoriesForBudget(budgetId)

      let totalActualExpenses = 0
      let totalActualIncome = 0

      for (const category of categories) {
        const transactions = await getTransactionsForCategory(category.id)

        for (const tx of transactions) {
          const amount = (tx.amount as number) || 0
          const type = tx.type as string
          const status = tx.status as string

          if (status !== 'cancelled') {
            if (type === 'expense') {
              totalActualExpenses += amount
            } else if (type === 'income') {
              totalActualIncome += amount
            }
          }
        }
      }

      const budgetVariance = totalPlanned - totalActualExpenses
      const budgetVariancePercentage =
        totalPlanned > 0
          ? Math.round(((totalPlanned - totalActualExpenses) / totalPlanned) * 1000) / 10
          : 0

      let status: 'under' | 'on_track' | 'over' = 'on_track'
      if (budgetVariancePercentage < -VARIANCE_THRESHOLD * 100) {
        status = 'over'
      } else if (budgetVariancePercentage > VARIANCE_THRESHOLD * 100) {
        status = 'under'
      }

      return {
        totalPlanned,
        totalActualExpenses,
        totalActualIncome,
        budgetVariance,
        budgetVariancePercentage,
        currency,
        status
      }
    },

    async getExpensesByCategory(editionId: string): Promise<CategoryExpense[]> {
      const budget = await getBudgetForEdition(editionId)
      if (!budget) return []

      const budgetId = budget.id as string
      const categories = await getCategoriesForBudget(budgetId)

      const expenses: CategoryExpense[] = []

      for (const category of categories) {
        const categoryId = category.id as string
        const categoryName = category.name as string
        const plannedAmount = (category.plannedAmount as number) || 0

        const transactions = await getTransactionsForCategory(categoryId)

        let actualAmount = 0
        for (const tx of transactions) {
          const amount = (tx.amount as number) || 0
          const type = tx.type as string
          const status = tx.status as string

          if (status !== 'cancelled' && type === 'expense') {
            actualAmount += amount
          }
        }

        const variance = plannedAmount - actualAmount
        const variancePercentage =
          plannedAmount > 0
            ? Math.round(((plannedAmount - actualAmount) / plannedAmount) * 1000) / 10
            : 0

        expenses.push({
          categoryId,
          categoryName,
          plannedAmount,
          actualAmount,
          variance,
          variancePercentage
        })
      }

      return expenses.sort((a, b) => b.actualAmount - a.actualAmount)
    },

    async getCashFlow(editionId: string): Promise<CashFlowSummary | null> {
      const budget = await getBudgetForEdition(editionId)
      if (!budget) return null

      const budgetId = budget.id as string
      const currency = (budget.currency as BudgetCurrency) || 'EUR'
      const categories = await getCategoriesForBudget(budgetId)

      let totalIncome = 0
      let totalExpenses = 0
      let pendingIncome = 0
      let pendingExpenses = 0

      for (const category of categories) {
        const transactions = await getTransactionsForCategory(category.id)

        for (const tx of transactions) {
          const amount = (tx.amount as number) || 0
          const type = tx.type as string
          const status = tx.status as string

          if (status === 'cancelled') continue

          if (type === 'income') {
            if (status === 'paid') {
              totalIncome += amount
            } else if (status === 'pending') {
              pendingIncome += amount
            }
          } else if (type === 'expense') {
            if (status === 'paid') {
              totalExpenses += amount
            } else if (status === 'pending') {
              pendingExpenses += amount
            }
          }
        }
      }

      return {
        totalIncome,
        totalExpenses,
        netCashFlow: totalIncome - totalExpenses,
        pendingIncome,
        pendingExpenses,
        currency
      }
    },

    async getRecentTransactions(
      editionId: string,
      limit = DEFAULT_TRANSACTION_LIMIT
    ): Promise<RecentTransaction[]> {
      const budget = await getBudgetForEdition(editionId)
      if (!budget) return []

      const budgetId = budget.id as string
      const categories = await getCategoriesForBudget(budgetId)

      if (categories.length === 0) return []

      const categoryIds = categories.map((c) => c.id as string)
      const categoryNameMap = new Map(categories.map((c) => [c.id as string, c.name as string]))

      // Build filter for all categories
      const categoryFilters = categoryIds.map((id) => safeFilter`categoryId = ${id}`)
      const filter = categoryFilters.join(' || ')

      try {
        const transactions = await pb.collection('budget_transactions').getList(1, limit, {
          filter,
          sort: '-date,-created'
        })

        return transactions.items.map((tx) => ({
          id: tx.id as string,
          description: tx.description as string,
          amount: (tx.amount as number) || 0,
          type: (tx.type as 'expense' | 'income') || 'expense',
          categoryName: categoryNameMap.get(tx.categoryId as string) || 'Unknown',
          date: new Date(tx.date as string),
          status: ((tx.status as string) || 'pending') as 'pending' | 'paid' | 'cancelled'
        }))
      } catch {
        return []
      }
    }
  }
}
