import type PocketBase from 'pocketbase'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createBudgetStatsService } from './budget-stats-service'

describe('BudgetStatsService', () => {
  let mockPb: PocketBase
  let service: ReturnType<typeof createBudgetStatsService>

  const mockBudget = {
    id: 'budget-1',
    editionId: 'edition-1',
    totalBudget: 10000,
    currency: 'EUR',
    status: 'approved'
  }

  const mockCategories = [
    { id: 'cat-1', budgetId: 'budget-1', name: 'Venue', plannedAmount: 5000 },
    { id: 'cat-2', budgetId: 'budget-1', name: 'Catering', plannedAmount: 3000 }
  ]

  const mockTransactions = [
    {
      id: 'tx-1',
      categoryId: 'cat-1',
      type: 'expense',
      amount: 4000,
      status: 'paid',
      date: '2024-01-15',
      description: 'Venue deposit'
    },
    {
      id: 'tx-2',
      categoryId: 'cat-1',
      type: 'expense',
      amount: 500,
      status: 'pending',
      date: '2024-01-20',
      description: 'Venue extras'
    },
    {
      id: 'tx-3',
      categoryId: 'cat-2',
      type: 'expense',
      amount: 2000,
      status: 'paid',
      date: '2024-01-18',
      description: 'Catering deposit'
    },
    {
      id: 'tx-4',
      categoryId: 'cat-1',
      type: 'income',
      amount: 1000,
      status: 'paid',
      date: '2024-01-10',
      description: 'Sponsor payment'
    }
  ]

  beforeEach(() => {
    mockPb = {
      collection: vi.fn()
    } as unknown as PocketBase
    service = createBudgetStatsService(mockPb)
  })

  describe('getBudgetOverview', () => {
    it('should return budget overview for an edition', async () => {
      const cat1Transactions = mockTransactions.filter((t) => t.categoryId === 'cat-1')
      const cat2Transactions = mockTransactions.filter((t) => t.categoryId === 'cat-2')

      const mockCollection = vi.fn()
      let transactionCallCount = 0
      mockCollection.mockImplementation((name: string) => {
        if (name === 'edition_budgets') {
          return {
            getList: vi.fn().mockResolvedValue({ items: [mockBudget] })
          }
        }
        if (name === 'budget_categories') {
          return {
            getFullList: vi.fn().mockResolvedValue(mockCategories)
          }
        }
        if (name === 'budget_transactions') {
          transactionCallCount++
          // First call is for cat-1, second for cat-2
          return {
            getFullList: vi
              .fn()
              .mockResolvedValue(transactionCallCount === 1 ? cat1Transactions : cat2Transactions)
          }
        }
        return { getFullList: vi.fn().mockResolvedValue([]) }
      })

      mockPb.collection = mockCollection

      const result = await service.getBudgetOverview('edition-1')

      expect(result).not.toBeNull()
      expect(result?.totalPlanned).toBe(10000)
      expect(result?.totalActualExpenses).toBe(6500) // 4000 + 500 + 2000
      expect(result?.totalActualIncome).toBe(1000)
      expect(result?.currency).toBe('EUR')
    })

    it('should return null when no budget exists', async () => {
      vi.mocked(mockPb.collection).mockReturnValue({
        getList: vi.fn().mockResolvedValue({ items: [] })
      } as unknown as ReturnType<PocketBase['collection']>)

      const result = await service.getBudgetOverview('edition-1')

      expect(result).toBeNull()
    })

    it('should calculate variance correctly', async () => {
      const mockCollection = vi.fn()
      mockCollection.mockImplementation((name: string) => {
        if (name === 'edition_budgets') {
          return {
            getList: vi.fn().mockResolvedValue({ items: [mockBudget] })
          }
        }
        if (name === 'budget_categories') {
          return {
            getFullList: vi.fn().mockResolvedValue([mockCategories[0]])
          }
        }
        if (name === 'budget_transactions') {
          return {
            getFullList: vi.fn().mockResolvedValue([mockTransactions[0]]) // 4000 expense
          }
        }
        return { getFullList: vi.fn().mockResolvedValue([]) }
      })

      mockPb.collection = mockCollection

      const result = await service.getBudgetOverview('edition-1')

      expect(result?.budgetVariance).toBe(6000) // 10000 - 4000
      expect(result?.budgetVariancePercentage).toBe(60) // 60% under budget
      expect(result?.status).toBe('under')
    })

    it('should identify over budget status', async () => {
      const overBudgetTransactions = [
        {
          id: 'tx-1',
          categoryId: 'cat-1',
          type: 'expense',
          amount: 12000,
          status: 'paid',
          date: '2024-01-15'
        }
      ]

      const mockCollection = vi.fn()
      mockCollection.mockImplementation((name: string) => {
        if (name === 'edition_budgets') {
          return {
            getList: vi.fn().mockResolvedValue({ items: [mockBudget] })
          }
        }
        if (name === 'budget_categories') {
          return {
            getFullList: vi.fn().mockResolvedValue([mockCategories[0]])
          }
        }
        if (name === 'budget_transactions') {
          return {
            getFullList: vi.fn().mockResolvedValue(overBudgetTransactions)
          }
        }
        return { getFullList: vi.fn().mockResolvedValue([]) }
      })

      mockPb.collection = mockCollection

      const result = await service.getBudgetOverview('edition-1')

      expect(result?.status).toBe('over')
    })

    it('should exclude cancelled transactions', async () => {
      const transactionsWithCancelled = [
        {
          id: 'tx-1',
          categoryId: 'cat-1',
          type: 'expense',
          amount: 4000,
          status: 'paid',
          date: '2024-01-15'
        },
        {
          id: 'tx-2',
          categoryId: 'cat-1',
          type: 'expense',
          amount: 5000,
          status: 'cancelled',
          date: '2024-01-20'
        }
      ]

      const mockCollection = vi.fn()
      mockCollection.mockImplementation((name: string) => {
        if (name === 'edition_budgets') {
          return {
            getList: vi.fn().mockResolvedValue({ items: [mockBudget] })
          }
        }
        if (name === 'budget_categories') {
          return {
            getFullList: vi.fn().mockResolvedValue([mockCategories[0]])
          }
        }
        if (name === 'budget_transactions') {
          return {
            getFullList: vi.fn().mockResolvedValue(transactionsWithCancelled)
          }
        }
        return { getFullList: vi.fn().mockResolvedValue([]) }
      })

      mockPb.collection = mockCollection

      const result = await service.getBudgetOverview('edition-1')

      expect(result?.totalActualExpenses).toBe(4000) // Cancelled transaction excluded
    })
  })

  describe('getExpensesByCategory', () => {
    it('should return expenses grouped by category', async () => {
      const mockCollection = vi.fn()
      mockCollection.mockImplementation((name: string) => {
        if (name === 'edition_budgets') {
          return {
            getList: vi.fn().mockResolvedValue({ items: [mockBudget] })
          }
        }
        if (name === 'budget_categories') {
          return {
            getFullList: vi.fn().mockResolvedValue(mockCategories)
          }
        }
        if (name === 'budget_transactions') {
          return {
            getFullList: vi.fn().mockImplementation(async (options: { filter: string }) => {
              const filter = options.filter || ''
              if (filter.includes('cat-1')) {
                return [mockTransactions[0], mockTransactions[1]] // 4500 expense
              }
              if (filter.includes('cat-2')) {
                return [mockTransactions[2]] // 2000 expense
              }
              return []
            })
          }
        }
        return { getFullList: vi.fn().mockResolvedValue([]) }
      })

      mockPb.collection = mockCollection

      const result = await service.getExpensesByCategory('edition-1')

      expect(result).toHaveLength(2)
      expect(result[0].categoryName).toBe('Venue')
      expect(result[0].actualAmount).toBe(4500)
      expect(result[0].plannedAmount).toBe(5000)
      expect(result[0].variance).toBe(500)
    })

    it('should return empty array when no budget exists', async () => {
      vi.mocked(mockPb.collection).mockReturnValue({
        getList: vi.fn().mockResolvedValue({ items: [] })
      } as unknown as ReturnType<PocketBase['collection']>)

      const result = await service.getExpensesByCategory('edition-1')

      expect(result).toEqual([])
    })

    it('should sort by actual amount descending', async () => {
      const mockCollection = vi.fn()
      mockCollection.mockImplementation((name: string) => {
        if (name === 'edition_budgets') {
          return {
            getList: vi.fn().mockResolvedValue({ items: [mockBudget] })
          }
        }
        if (name === 'budget_categories') {
          return {
            getFullList: vi.fn().mockResolvedValue(mockCategories)
          }
        }
        if (name === 'budget_transactions') {
          return {
            getFullList: vi.fn().mockImplementation(async (options: { filter: string }) => {
              const filter = options.filter || ''
              if (filter.includes('cat-1')) {
                return [{ ...mockTransactions[0], amount: 1000 }]
              }
              if (filter.includes('cat-2')) {
                return [{ ...mockTransactions[2], amount: 3000 }]
              }
              return []
            })
          }
        }
        return { getFullList: vi.fn().mockResolvedValue([]) }
      })

      mockPb.collection = mockCollection

      const result = await service.getExpensesByCategory('edition-1')

      expect(result[0].categoryName).toBe('Catering') // Higher amount first
      expect(result[1].categoryName).toBe('Venue')
    })
  })

  describe('getCashFlow', () => {
    it('should return cash flow summary', async () => {
      const cat1Transactions = mockTransactions.filter((t) => t.categoryId === 'cat-1')
      const cat2Transactions = mockTransactions.filter((t) => t.categoryId === 'cat-2')

      const mockCollection = vi.fn()
      let transactionCallCount = 0
      mockCollection.mockImplementation((name: string) => {
        if (name === 'edition_budgets') {
          return {
            getList: vi.fn().mockResolvedValue({ items: [mockBudget] })
          }
        }
        if (name === 'budget_categories') {
          return {
            getFullList: vi.fn().mockResolvedValue(mockCategories)
          }
        }
        if (name === 'budget_transactions') {
          transactionCallCount++
          // First call is for cat-1, second for cat-2
          return {
            getFullList: vi
              .fn()
              .mockResolvedValue(transactionCallCount === 1 ? cat1Transactions : cat2Transactions)
          }
        }
        return { getFullList: vi.fn().mockResolvedValue([]) }
      })

      mockPb.collection = mockCollection

      const result = await service.getCashFlow('edition-1')

      expect(result).not.toBeNull()
      expect(result?.totalIncome).toBe(1000)
      expect(result?.totalExpenses).toBe(6000) // 4000 + 2000 (paid)
      expect(result?.pendingExpenses).toBe(500)
      expect(result?.netCashFlow).toBe(-5000)
      expect(result?.currency).toBe('EUR')
    })

    it('should return null when no budget exists', async () => {
      vi.mocked(mockPb.collection).mockReturnValue({
        getList: vi.fn().mockResolvedValue({ items: [] })
      } as unknown as ReturnType<PocketBase['collection']>)

      const result = await service.getCashFlow('edition-1')

      expect(result).toBeNull()
    })

    it('should separate paid and pending transactions', async () => {
      const mixedTransactions = [
        {
          id: 'tx-1',
          categoryId: 'cat-1',
          type: 'income',
          amount: 5000,
          status: 'paid',
          date: '2024-01-15'
        },
        {
          id: 'tx-2',
          categoryId: 'cat-1',
          type: 'income',
          amount: 2000,
          status: 'pending',
          date: '2024-01-20'
        },
        {
          id: 'tx-3',
          categoryId: 'cat-1',
          type: 'expense',
          amount: 3000,
          status: 'paid',
          date: '2024-01-18'
        },
        {
          id: 'tx-4',
          categoryId: 'cat-1',
          type: 'expense',
          amount: 1000,
          status: 'pending',
          date: '2024-01-22'
        }
      ]

      const mockCollection = vi.fn()
      mockCollection.mockImplementation((name: string) => {
        if (name === 'edition_budgets') {
          return {
            getList: vi.fn().mockResolvedValue({ items: [mockBudget] })
          }
        }
        if (name === 'budget_categories') {
          return {
            getFullList: vi.fn().mockResolvedValue([mockCategories[0]])
          }
        }
        if (name === 'budget_transactions') {
          return {
            getFullList: vi.fn().mockResolvedValue(mixedTransactions)
          }
        }
        return { getFullList: vi.fn().mockResolvedValue([]) }
      })

      mockPb.collection = mockCollection

      const result = await service.getCashFlow('edition-1')

      expect(result?.totalIncome).toBe(5000)
      expect(result?.pendingIncome).toBe(2000)
      expect(result?.totalExpenses).toBe(3000)
      expect(result?.pendingExpenses).toBe(1000)
    })
  })

  describe('getRecentTransactions', () => {
    it('should return recent transactions', async () => {
      const mockCollection = vi.fn()
      mockCollection.mockImplementation((name: string) => {
        if (name === 'edition_budgets') {
          return {
            getList: vi.fn().mockResolvedValue({ items: [mockBudget] })
          }
        }
        if (name === 'budget_categories') {
          return {
            getFullList: vi.fn().mockResolvedValue(mockCategories)
          }
        }
        if (name === 'budget_transactions') {
          return {
            getList: vi.fn().mockResolvedValue({
              items: mockTransactions.slice(0, 3)
            })
          }
        }
        return { getFullList: vi.fn().mockResolvedValue([]) }
      })

      mockPb.collection = mockCollection

      const result = await service.getRecentTransactions('edition-1', 3)

      expect(result).toHaveLength(3)
      expect(result[0].description).toBe('Venue deposit')
      expect(result[0].categoryName).toBe('Venue')
    })

    it('should return empty array when no budget exists', async () => {
      vi.mocked(mockPb.collection).mockReturnValue({
        getList: vi.fn().mockResolvedValue({ items: [] })
      } as unknown as ReturnType<PocketBase['collection']>)

      const result = await service.getRecentTransactions('edition-1')

      expect(result).toEqual([])
    })

    it('should map transaction fields correctly', async () => {
      const mockCollection = vi.fn()
      mockCollection.mockImplementation((name: string) => {
        if (name === 'edition_budgets') {
          return {
            getList: vi.fn().mockResolvedValue({ items: [mockBudget] })
          }
        }
        if (name === 'budget_categories') {
          return {
            getFullList: vi.fn().mockResolvedValue(mockCategories)
          }
        }
        if (name === 'budget_transactions') {
          return {
            getList: vi.fn().mockResolvedValue({
              items: [mockTransactions[0]]
            })
          }
        }
        return { getFullList: vi.fn().mockResolvedValue([]) }
      })

      mockPb.collection = mockCollection

      const result = await service.getRecentTransactions('edition-1', 1)

      expect(result[0].id).toBe('tx-1')
      expect(result[0].description).toBe('Venue deposit')
      expect(result[0].amount).toBe(4000)
      expect(result[0].type).toBe('expense')
      expect(result[0].status).toBe('paid')
      expect(result[0].date).toBeInstanceOf(Date)
    })
  })
})
