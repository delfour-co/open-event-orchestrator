<script lang="ts">
import { Badge } from '$lib/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card'
import { formatBudgetAmount } from '$lib/features/budget/domain/budget'
import type {
  BudgetOverview,
  CashFlowSummary,
  CategoryExpense,
  RecentTransaction
} from '$lib/features/budget/services/budget-stats-service'

interface Props {
  budgetOverview: BudgetOverview | null
  cashFlow: CashFlowSummary | null
  categoryExpenses: CategoryExpense[]
  recentTransactions: RecentTransaction[]
  loading?: boolean
  error?: string | null
}

const {
  budgetOverview,
  cashFlow,
  categoryExpenses,
  recentTransactions,
  loading = false,
  error = null
}: Props = $props()

const getStatusColor = (status: 'under' | 'on_track' | 'over'): string => {
  if (status === 'over') return 'text-red-600'
  if (status === 'under') return 'text-green-600'
  return 'text-blue-600'
}

const getStatusBadgeVariant = (
  status: 'under' | 'on_track' | 'over'
): 'default' | 'secondary' | 'destructive' => {
  if (status === 'over') return 'destructive'
  if (status === 'under') return 'default'
  return 'secondary'
}

const getStatusLabel = (status: 'under' | 'on_track' | 'over'): string => {
  if (status === 'over') return 'Over Budget'
  if (status === 'under') return 'Under Budget'
  return 'On Track'
}

const getTransactionStatusColor = (
  status: 'pending' | 'paid' | 'cancelled'
): 'default' | 'secondary' | 'destructive' => {
  if (status === 'paid') return 'default'
  if (status === 'cancelled') return 'destructive'
  return 'secondary'
}

const currency = $derived(budgetOverview?.currency || cashFlow?.currency || 'EUR')

const formatAmount = (amount: number): string => {
  return formatBudgetAmount(amount, currency)
}

const budgetUsagePercentage = $derived(
  budgetOverview && budgetOverview.totalPlanned > 0
    ? Math.min(
        100,
        Math.round((budgetOverview.totalActualExpenses / budgetOverview.totalPlanned) * 100)
      )
    : 0
)
</script>

<Card class="h-full">
  <CardHeader class="pb-2">
    <CardTitle class="text-lg">Budget Overview</CardTitle>
  </CardHeader>
  <CardContent class="space-y-6">
    {#if loading}
      <div class="flex items-center justify-center py-8">
        <div class="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        <span class="ml-2 text-sm text-muted-foreground">Loading...</span>
      </div>
    {:else if error}
      <div class="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
        {error}
      </div>
    {:else}
      <!-- Budget Overview Section -->
      {#if budgetOverview}
        <div>
          <div class="mb-3 flex items-center justify-between">
            <h4 class="text-sm font-medium text-muted-foreground">Budget Status</h4>
            <Badge variant={getStatusBadgeVariant(budgetOverview.status)}>
              {getStatusLabel(budgetOverview.status)}
            </Badge>
          </div>

          <!-- Budget Progress Bar -->
          <div class="mb-4">
            <div class="mb-1 flex justify-between text-xs">
              <span class="text-muted-foreground">Spent</span>
              <span class="font-medium">{formatAmount(budgetOverview.totalActualExpenses)} / {formatAmount(budgetOverview.totalPlanned)}</span>
            </div>
            <div class="h-3 overflow-hidden rounded-full bg-muted">
              <div
                class="h-full rounded-full transition-all"
                class:bg-green-500={budgetOverview.status === 'under'}
                class:bg-blue-500={budgetOverview.status === 'on_track'}
                class:bg-red-500={budgetOverview.status === 'over'}
                style="width: {budgetUsagePercentage}%"
              ></div>
            </div>
            <div class="mt-1 text-right text-xs text-muted-foreground">
              {budgetUsagePercentage}% used
            </div>
          </div>

          <!-- Variance Display -->
          <div class="grid grid-cols-2 gap-4">
            <div class="rounded-lg bg-muted/50 p-3">
              <div class={`text-xl font-bold ${getStatusColor(budgetOverview.status)}`}>
                {budgetOverview.budgetVariance >= 0 ? '+' : ''}{formatAmount(budgetOverview.budgetVariance)}
              </div>
              <div class="text-xs text-muted-foreground">Variance</div>
            </div>
            <div class="rounded-lg bg-muted/50 p-3">
              <div class="text-xl font-bold text-green-600">
                {formatAmount(budgetOverview.totalActualIncome)}
              </div>
              <div class="text-xs text-muted-foreground">Income</div>
            </div>
          </div>
        </div>
      {/if}

      <!-- Cash Flow Section -->
      {#if cashFlow}
        <div>
          <h4 class="mb-3 text-sm font-medium text-muted-foreground">Cash Flow</h4>
          <div class="space-y-2">
            <div class="flex items-center justify-between rounded-lg bg-green-50 p-2 dark:bg-green-950">
              <span class="text-sm text-green-700 dark:text-green-300">Income (Paid)</span>
              <span class="font-semibold text-green-700 dark:text-green-300">{formatAmount(cashFlow.totalIncome)}</span>
            </div>
            <div class="flex items-center justify-between rounded-lg bg-red-50 p-2 dark:bg-red-950">
              <span class="text-sm text-red-700 dark:text-red-300">Expenses (Paid)</span>
              <span class="font-semibold text-red-700 dark:text-red-300">-{formatAmount(cashFlow.totalExpenses)}</span>
            </div>
            <div class="flex items-center justify-between rounded-lg bg-muted p-2">
              <span class="text-sm font-medium">Net Cash Flow</span>
              <span class={`font-bold ${cashFlow.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {cashFlow.netCashFlow >= 0 ? '+' : ''}{formatAmount(cashFlow.netCashFlow)}
              </span>
            </div>
            {#if cashFlow.pendingIncome > 0 || cashFlow.pendingExpenses > 0}
              <div class="mt-2 rounded border border-dashed p-2 text-xs text-muted-foreground">
                <div class="flex justify-between">
                  <span>Pending Income:</span>
                  <span class="text-green-600">{formatAmount(cashFlow.pendingIncome)}</span>
                </div>
                <div class="flex justify-between">
                  <span>Pending Expenses:</span>
                  <span class="text-red-600">{formatAmount(cashFlow.pendingExpenses)}</span>
                </div>
              </div>
            {/if}
          </div>
        </div>
      {/if}

      <!-- Category Expenses Section -->
      {#if categoryExpenses.length > 0}
        <div>
          <h4 class="mb-3 text-sm font-medium text-muted-foreground">Expenses by Category</h4>
          <div class="space-y-2">
            {#each categoryExpenses.slice(0, 4) as category}
              {@const usagePercent = category.plannedAmount > 0 ? Math.min(100, Math.round((category.actualAmount / category.plannedAmount) * 100)) : 0}
              <div class="rounded-lg border p-2">
                <div class="flex items-center justify-between text-sm">
                  <span class="font-medium">{category.categoryName}</span>
                  <span class="text-muted-foreground">{formatAmount(category.actualAmount)} / {formatAmount(category.plannedAmount)}</span>
                </div>
                <div class="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    class="h-full rounded-full transition-all"
                    class:bg-green-500={usagePercent <= 80}
                    class:bg-yellow-500={usagePercent > 80 && usagePercent <= 100}
                    class:bg-red-500={usagePercent > 100}
                    style="width: {usagePercent}%"
                  ></div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Recent Transactions Section -->
      {#if recentTransactions.length > 0}
        <div>
          <h4 class="mb-3 text-sm font-medium text-muted-foreground">Recent Transactions</h4>
          <div class="space-y-2">
            {#each recentTransactions.slice(0, 4) as tx}
              <div class="flex items-center justify-between rounded border p-2 text-xs">
                <div class="flex-1 truncate">
                  <div class="font-medium">{tx.description}</div>
                  <div class="text-muted-foreground">{tx.categoryName}</div>
                </div>
                <div class="flex items-center gap-2">
                  <span class={tx.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                    {tx.type === 'income' ? '+' : '-'}{formatAmount(tx.amount)}
                  </span>
                  <Badge variant={getTransactionStatusColor(tx.status)} class="text-[10px]">
                    {tx.status}
                  </Badge>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      {#if !budgetOverview && !cashFlow && categoryExpenses.length === 0 && recentTransactions.length === 0}
        <div class="py-8 text-center text-sm text-muted-foreground">
          No budget data available
        </div>
      {/if}
    {/if}
  </CardContent>
</Card>
