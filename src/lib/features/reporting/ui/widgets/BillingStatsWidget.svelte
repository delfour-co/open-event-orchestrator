<script lang="ts">
import * as Card from '$lib/components/ui/card'
import type {
  LowStockAlert,
  RevenueByTicketType,
  SalesStats,
  SalesTrend
} from '$lib/features/billing/services'
import { cn } from '$lib/utils'
import { AlertTriangle, DollarSign, Ticket, TrendingUp } from 'lucide-svelte'
import { MetricCard } from '../index'

type Props = {
  salesStats: SalesStats | null
  revenueByTicketType: RevenueByTicketType[] | null
  salesTrend: SalesTrend | null
  lowStockAlerts: LowStockAlert[] | null
  currency?: string
  loading?: boolean
  error?: string
  class?: string
}

const {
  salesStats,
  revenueByTicketType,
  salesTrend,
  lowStockAlerts,
  currency = 'EUR',
  loading = false,
  error,
  class: className
}: Props = $props()

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency
  }).format(amount / 100)
}

const getProgressColor = (percentage: number): string => {
  if (percentage >= 90) return 'bg-red-500'
  if (percentage >= 75) return 'bg-orange-500'
  if (percentage >= 50) return 'bg-yellow-500'
  return 'bg-green-500'
}

const chartBarColors = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-cyan-500'
]

const getMaxRevenue = (data: RevenueByTicketType[] | null): number => {
  if (!data || data.length === 0) return 0
  return Math.max(...data.map((d) => d.revenue))
}
</script>

<div class={cn('grid gap-4', className)}>
  {#if error}
    <Card.Root class="col-span-full">
      <Card.Content class="pt-6">
        <p class="text-center text-destructive">{error}</p>
      </Card.Content>
    </Card.Root>
  {:else}
    <!-- Metrics Row -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        {loading}
        data={{
          label: 'Tickets Sold',
          value: salesStats?.totalSales ?? 0,
          format: 'number'
        }}
      >
        {#snippet icon()}
          <Ticket class="h-4 w-4" />
        {/snippet}
      </MetricCard>

      <MetricCard
        {loading}
        data={{
          label: 'Total Revenue',
          value: salesStats ? formatCurrency(salesStats.totalRevenue) : '0',
          format: 'number'
        }}
      >
        {#snippet icon()}
          <DollarSign class="h-4 w-4" />
        {/snippet}
      </MetricCard>

      <MetricCard
        {loading}
        data={{
          label: 'Capacity Used',
          value: salesStats?.soldPercentage ?? 0,
          format: 'percentage'
        }}
      >
        {#snippet icon()}
          <TrendingUp class="h-4 w-4" />
        {/snippet}
      </MetricCard>

      <MetricCard
        {loading}
        data={{
          label: 'Sales/day (average)',
          value: salesTrend?.averageDailySales ?? 0,
          format: 'number'
        }}
      >
        {#snippet icon()}
          <TrendingUp class="h-4 w-4" />
        {/snippet}
      </MetricCard>
    </div>

    <!-- Sales vs Capacity Progress -->
    <Card.Root>
      <Card.Header>
        <Card.Title class="text-sm font-medium">Sales vs Capacity</Card.Title>
      </Card.Header>
      <Card.Content>
        {#if loading}
          <div class="h-8 animate-pulse rounded bg-muted"></div>
        {:else if salesStats}
          <div class="space-y-2">
            <div class="flex justify-between text-sm">
              <span>{salesStats.totalSales} sold</span>
              <span>{salesStats.totalCapacity} total</span>
            </div>
            <div class="h-4 overflow-hidden rounded-full bg-muted">
              <div
                class={cn('h-full rounded-full transition-all', getProgressColor(salesStats.soldPercentage))}
                style="width: {salesStats.soldPercentage}%"
              ></div>
            </div>
            <p class="text-center text-sm text-muted-foreground">
              {salesStats.totalCapacity - salesStats.totalSales} remaining
            </p>
          </div>
        {/if}
      </Card.Content>
    </Card.Root>

    <!-- Revenue by Ticket Type -->
    <Card.Root>
      <Card.Header>
        <Card.Title class="text-sm font-medium">Revenue by Ticket Type</Card.Title>
      </Card.Header>
      <Card.Content>
        {#if loading}
          <div class="space-y-3">
            <div class="h-8 animate-pulse rounded bg-muted"></div>
            <div class="h-8 animate-pulse rounded bg-muted"></div>
          </div>
        {:else if revenueByTicketType && revenueByTicketType.length > 0}
          {@const maxRevenue = getMaxRevenue(revenueByTicketType)}
          <div class="space-y-3">
            {#each revenueByTicketType as ticketType, index}
              <div class="space-y-1">
                <div class="flex justify-between text-sm">
                  <span>{ticketType.ticketTypeName}</span>
                  <span class="font-medium">
                    {formatCurrency(ticketType.revenue)}
                    <span class="text-muted-foreground">({ticketType.percentage}%)</span>
                  </span>
                </div>
                <div class="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    class={cn('h-full rounded-full transition-all', chartBarColors[index % chartBarColors.length])}
                    style="width: {maxRevenue > 0 ? (ticketType.revenue / maxRevenue) * 100 : 0}%"
                  ></div>
                </div>
                <p class="text-xs text-muted-foreground">
                  {ticketType.quantitySold} sold
                </p>
              </div>
            {/each}
          </div>
        {:else}
          <p class="text-center text-sm text-muted-foreground">
            No sales yet
          </p>
        {/if}
      </Card.Content>
    </Card.Root>

    <!-- Sales Trend Chart (simplified bar chart) -->
    <Card.Root>
      <Card.Header>
        <Card.Title class="text-sm font-medium">Sales Evolution (Last 30 Days)</Card.Title>
      </Card.Header>
      <Card.Content>
        {#if loading}
          <div class="h-32 animate-pulse rounded bg-muted"></div>
        {:else if salesTrend && salesTrend.dailySales.length > 0}
          {@const maxQuantity = Math.max(...salesTrend.dailySales.map((d) => d.quantity), 1)}
          <div class="flex h-32 items-end gap-1">
            {#each salesTrend.dailySales as day}
              <div
                class="flex-1 rounded-t bg-blue-500 transition-all hover:bg-blue-600"
                style="height: {(day.quantity / maxQuantity) * 100}%"
                title="{day.date}: {day.quantity} sales"
              ></div>
            {/each}
          </div>
          <div class="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>{salesTrend.dailySales[0]?.date}</span>
            <span>{salesTrend.dailySales[salesTrend.dailySales.length - 1]?.date}</span>
          </div>
        {:else}
          <p class="text-center text-sm text-muted-foreground">
            No data available
          </p>
        {/if}
      </Card.Content>
    </Card.Root>

    <!-- Low Stock Alerts -->
    {#if lowStockAlerts && lowStockAlerts.length > 0}
      <Card.Root class="border-orange-500/50">
        <Card.Header>
          <Card.Title class="flex items-center gap-2 text-sm font-medium text-orange-600 dark:text-orange-400">
            <AlertTriangle class="h-4 w-4" />
            Low Stock Alerts
          </Card.Title>
        </Card.Header>
        <Card.Content>
          <ul class="space-y-2">
            {#each lowStockAlerts as alert}
              <li class="flex items-center justify-between rounded-lg bg-orange-50 p-2 dark:bg-orange-950/30">
                <span class="text-sm font-medium">{alert.ticketTypeName}</span>
                <span class="text-sm">
                  <span class="font-bold text-orange-600 dark:text-orange-400">
                    {alert.remaining}
                  </span>
                  <span class="text-muted-foreground">/ {alert.total} remaining</span>
                </span>
              </li>
            {/each}
          </ul>
        </Card.Content>
      </Card.Root>
    {/if}

    <!-- Order Status Summary -->
    <Card.Root>
      <Card.Header>
        <Card.Title class="text-sm font-medium">Orders by Status</Card.Title>
      </Card.Header>
      <Card.Content>
        {#if loading}
          <div class="h-16 animate-pulse rounded bg-muted"></div>
        {:else if salesStats}
          <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div class="text-center">
              <div class="text-2xl font-bold text-yellow-600">{salesStats.ordersByStatus.pending}</div>
              <div class="text-xs text-muted-foreground">Pending</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-green-600">{salesStats.ordersByStatus.paid}</div>
              <div class="text-xs text-muted-foreground">Paid</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-gray-600">{salesStats.ordersByStatus.cancelled}</div>
              <div class="text-xs text-muted-foreground">Cancelled</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-orange-600">{salesStats.ordersByStatus.refunded}</div>
              <div class="text-xs text-muted-foreground">Refunded</div>
            </div>
          </div>
        {/if}
      </Card.Content>
    </Card.Root>
  {/if}
</div>
