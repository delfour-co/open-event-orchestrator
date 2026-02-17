<script lang="ts">
import { AdminSubNav } from '$lib/components/shared'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { getBudgetNavItems } from '$lib/config'
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle,
  DollarSign,
  Lightbulb,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  XCircle
} from 'lucide-svelte'
import type { PageData } from './$types'

interface Props {
  data: PageData
}

const { data }: Props = $props()

const formatAmount = (amount: number) => {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: data.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

const formatPercent = (value: number) => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
}

const riskColors: Record<string, string> = {
  low: 'text-green-600 dark:text-green-400',
  medium: 'text-yellow-600 dark:text-yellow-400',
  high: 'text-red-600 dark:text-red-400'
}

const riskBgColors: Record<string, string> = {
  low: 'bg-green-100 dark:bg-green-900',
  medium: 'bg-yellow-100 dark:bg-yellow-900',
  high: 'bg-red-100 dark:bg-red-900'
}
</script>

<svelte:head>
  <title>Profitability - {data.edition.name} - Open Event Orchestrator</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-4">
      <a href="/admin/budget">
        <Button variant="ghost" size="icon">
          <ArrowLeft class="h-5 w-5" />
        </Button>
      </a>
      <div>
        <h2 class="text-3xl font-bold tracking-tight">{data.edition.name}</h2>
        <p class="text-muted-foreground">Profitability & Forecasting</p>
      </div>
    </div>
    <div class="flex items-center gap-2">
      <div class="flex items-center gap-2 rounded-full px-3 py-1 {riskBgColors[data.forecast.riskLevel]}">
        {#if data.forecast.riskLevel === 'high'}
          <AlertTriangle class="h-4 w-4 {riskColors[data.forecast.riskLevel]}" />
        {:else if data.forecast.riskLevel === 'low'}
          <CheckCircle class="h-4 w-4 {riskColors[data.forecast.riskLevel]}" />
        {:else}
          <AlertTriangle class="h-4 w-4 {riskColors[data.forecast.riskLevel]}" />
        {/if}
        <span class="text-sm font-medium {riskColors[data.forecast.riskLevel]}">
          {data.forecast.riskLevel.charAt(0).toUpperCase() + data.forecast.riskLevel.slice(1)} Risk
        </span>
      </div>
    </div>
  </div>

  <!-- Sub-navigation -->
  <AdminSubNav basePath="/admin/budget/{data.edition.slug}" items={getBudgetNavItems(data.edition.slug)} />

  <!-- Introduction -->
  <Card.Root class="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/20">
    <Card.Content class="p-4">
      <div class="flex items-start gap-3">
        <Lightbulb class="h-5 w-5 text-blue-600 mt-0.5" />
        <div class="text-sm">
          <p class="font-medium text-blue-900 dark:text-blue-100">Understanding Your Event's Financial Health</p>
          <p class="mt-1 text-blue-700 dark:text-blue-300">
            This dashboard shows your event's profitability based on ticket sales, sponsorships, and planned expenses.
            The <strong>break-even point</strong> tells you how many attendees you need to cover your costs.
            Use the <strong>forecast</strong> to see if you're on track to meet your financial goals.
          </p>
        </div>
      </div>
    </Card.Content>
  </Card.Root>

  <!-- Key Metrics -->
  <div class="grid gap-4 md:grid-cols-4">
    <Card.Root class={data.metrics.netProfit >= 0 ? 'border-green-200 dark:border-green-800' : 'border-red-200 dark:border-red-800'}>
      <Card.Header class="flex flex-row items-center justify-between pb-2">
        <Card.Title class="text-sm font-medium">Net Profit</Card.Title>
        {#if data.metrics.netProfit >= 0}
          <TrendingUp class="h-4 w-4 text-green-600" />
        {:else}
          <TrendingDown class="h-4 w-4 text-red-600" />
        {/if}
      </Card.Header>
      <Card.Content>
        <div class="text-2xl font-bold {data.metrics.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}">
          {formatAmount(data.metrics.netProfit)}
        </div>
        <p class="text-xs text-muted-foreground">
          {data.metrics.netMargin.toFixed(1)}% margin
        </p>
        <p class="mt-2 text-xs text-muted-foreground">
          Total revenue minus all costs. A positive number means profit.
        </p>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Header class="flex flex-row items-center justify-between pb-2">
        <Card.Title class="text-sm font-medium">Total Revenue</Card.Title>
        <DollarSign class="h-4 w-4 text-muted-foreground" />
      </Card.Header>
      <Card.Content>
        <div class="text-2xl font-bold text-green-600">
          {formatAmount(data.metrics.totalRevenue)}
        </div>
        <p class="text-xs text-muted-foreground">
          {formatPercent(data.metrics.revenueVariancePercentage)} vs target
        </p>
        <p class="mt-2 text-xs text-muted-foreground">
          Tickets + Sponsorships + Other income combined.
        </p>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Header class="flex flex-row items-center justify-between pb-2">
        <Card.Title class="text-sm font-medium">Total Costs</Card.Title>
        <TrendingDown class="h-4 w-4 text-muted-foreground" />
      </Card.Header>
      <Card.Content>
        <div class="text-2xl font-bold text-orange-600">
          {formatAmount(data.metrics.totalCosts)}
        </div>
        <p class="text-xs text-muted-foreground">
          {formatPercent(-data.metrics.costVariancePercentage)} vs budget
        </p>
        <p class="mt-2 text-xs text-muted-foreground">
          All expenses including venue, catering, speakers, etc.
        </p>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Header class="flex flex-row items-center justify-between pb-2">
        <Card.Title class="text-sm font-medium">Break-even Point</Card.Title>
        <Target class="h-4 w-4 text-muted-foreground" />
      </Card.Header>
      <Card.Content>
        <div class="text-2xl font-bold">{data.metrics.breakEvenAttendees} attendees</div>
        <div class="mt-1">
          <div class="h-2 w-full rounded-full bg-muted">
            <div
              class="h-2 rounded-full {data.metrics.breakEvenProgress >= 100 ? 'bg-green-500' : 'bg-primary'} transition-all"
              style="width: {Math.min(data.metrics.breakEvenProgress, 100)}%"
            ></div>
          </div>
          <p class="mt-1 text-xs text-muted-foreground">
            {data.metrics.currentAttendees} registered ({data.metrics.breakEvenProgress.toFixed(0)}% of goal)
          </p>
        </div>
        <p class="mt-2 text-xs text-muted-foreground">
          {#if data.metrics.breakEvenProgress >= 100}
            You've reached break-even! Every additional ticket is pure profit.
          {:else}
            {data.metrics.breakEvenAttendees - data.metrics.currentAttendees} more attendees needed to cover costs.
          {/if}
        </p>
      </Card.Content>
    </Card.Root>
  </div>

  <div class="grid gap-6 lg:grid-cols-2">
    <!-- Revenue Breakdown -->
    <Card.Root>
      <Card.Header>
        <Card.Title>Revenue Breakdown</Card.Title>
      </Card.Header>
      <Card.Content class="space-y-4">
        <div class="space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-muted-foreground">Ticket Revenue</span>
            <span class="font-medium">{formatAmount(data.metrics.ticketRevenue)}</span>
          </div>
          <div class="h-2 rounded-full bg-muted">
            <div
              class="h-2 rounded-full bg-blue-500"
              style="width: {data.metrics.totalRevenue > 0 ? (data.metrics.ticketRevenue / data.metrics.totalRevenue * 100) : 0}%"
            ></div>
          </div>
        </div>

        <div class="space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-muted-foreground">Sponsorship Revenue</span>
            <span class="font-medium">{formatAmount(data.metrics.sponsorshipRevenue)}</span>
          </div>
          <div class="h-2 rounded-full bg-muted">
            <div
              class="h-2 rounded-full bg-purple-500"
              style="width: {data.metrics.totalRevenue > 0 ? (data.metrics.sponsorshipRevenue / data.metrics.totalRevenue * 100) : 0}%"
            ></div>
          </div>
        </div>

        <div class="space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-muted-foreground">Other Income</span>
            <span class="font-medium">{formatAmount(data.metrics.otherIncome)}</span>
          </div>
          <div class="h-2 rounded-full bg-muted">
            <div
              class="h-2 rounded-full bg-green-500"
              style="width: {data.metrics.totalRevenue > 0 ? (data.metrics.otherIncome / data.metrics.totalRevenue * 100) : 0}%"
            ></div>
          </div>
        </div>
      </Card.Content>
    </Card.Root>

    <!-- Cost Breakdown -->
    <Card.Root>
      <Card.Header>
        <Card.Title>Cost Breakdown</Card.Title>
        <p class="text-xs text-muted-foreground mt-1">
          Track your expenses against your budget. Green is good, red means over budget.
        </p>
      </Card.Header>
      <Card.Content class="space-y-4">
        <div class="space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-muted-foreground">Total Budget (Planned)</span>
            <span class="font-medium">{formatAmount(data.metrics.plannedCosts)}</span>
          </div>
          <p class="text-xs text-muted-foreground">Your original expense budget</p>
        </div>

        <div class="space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-muted-foreground">Already Paid</span>
            <span class="font-medium text-orange-600">{formatAmount(data.metrics.actualCosts)}</span>
          </div>
          <div class="h-2 rounded-full bg-muted">
            <div
              class="h-2 rounded-full bg-orange-500"
              style="width: {data.metrics.plannedCosts > 0 ? (data.metrics.actualCosts / data.metrics.plannedCosts * 100) : 0}%"
            ></div>
          </div>
          <p class="text-xs text-muted-foreground">Expenses already paid out</p>
        </div>

        <div class="space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-muted-foreground">Pending (To Pay)</span>
            <span class="font-medium text-yellow-600">{formatAmount(data.metrics.pendingCosts)}</span>
          </div>
          <div class="h-2 rounded-full bg-muted">
            <div
              class="h-2 rounded-full bg-yellow-500"
              style="width: {data.metrics.plannedCosts > 0 ? (data.metrics.pendingCosts / data.metrics.plannedCosts * 100) : 0}%"
            ></div>
          </div>
          <p class="text-xs text-muted-foreground">Approved expenses not yet paid</p>
        </div>

        <div class="border-t pt-4">
          <div class="flex justify-between">
            <div>
              <span class="font-medium">Budget Variance</span>
              <p class="text-xs text-muted-foreground">
                {data.metrics.costVariance >= 0
                  ? 'You have room in your budget'
                  : 'You are spending more than planned'}
              </p>
            </div>
            <span class="font-bold text-xl {data.metrics.costVariance >= 0 ? 'text-green-600' : 'text-red-600'}">
              {data.metrics.costVariance >= 0 ? '+' : ''}{formatAmount(data.metrics.costVariance)}
            </span>
          </div>
        </div>
      </Card.Content>
    </Card.Root>

    <!-- Forecast -->
    <Card.Root>
      <Card.Header>
        <Card.Title class="flex items-center gap-2">
          <Calendar class="h-5 w-5" />
          Forecast & Projections
        </Card.Title>
        <p class="text-xs text-muted-foreground mt-1">
          Based on current trends, here's where your event is heading financially.
        </p>
      </Card.Header>
      <Card.Content class="space-y-4">
        <div class="flex items-center justify-between">
          <span class="text-muted-foreground">Overall Status</span>
          <div class="flex items-center gap-2">
            {#if data.forecast.isOnTrack}
              <CheckCircle class="h-4 w-4 text-green-600" />
              <span class="text-green-600">On Track</span>
            {:else}
              <XCircle class="h-4 w-4 text-red-600" />
              <span class="text-red-600">At Risk</span>
            {/if}
          </div>
        </div>

        <div class="flex items-center justify-between">
          <span class="text-muted-foreground">Days Remaining</span>
          <span class="font-medium">{data.forecast.daysRemaining}</span>
        </div>

        <div class="space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-muted-foreground">Revenue Progress</span>
            <span>{data.forecast.revenueProgress.toFixed(0)}%</span>
          </div>
          <div class="h-2 rounded-full bg-muted">
            <div
              class="h-2 rounded-full bg-green-500"
              style="width: {Math.min(data.forecast.revenueProgress, 100)}%"
            ></div>
          </div>
        </div>

        <div class="space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-muted-foreground">Cost Progress</span>
            <span>{data.forecast.costProgress.toFixed(0)}%</span>
          </div>
          <div class="h-2 rounded-full bg-muted">
            <div
              class="h-2 rounded-full bg-orange-500"
              style="width: {Math.min(data.forecast.costProgress, 100)}%"
            ></div>
          </div>
        </div>

        <div class="border-t pt-4">
          <h4 class="mb-2 text-sm font-medium">Projected Final</h4>
          <div class="space-y-1 text-sm">
            <div class="flex justify-between">
              <span class="text-muted-foreground">Revenue</span>
              <span>{formatAmount(data.forecast.projectedFinalRevenue)}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Costs</span>
              <span>{formatAmount(data.forecast.projectedFinalCosts)}</span>
            </div>
            <div class="flex justify-between font-medium">
              <span>Profit</span>
              <span class={data.forecast.projectedFinalProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                {formatAmount(data.forecast.projectedFinalProfit)}
              </span>
            </div>
          </div>
        </div>
      </Card.Content>
    </Card.Root>

    <!-- Alerts & Suggestions -->
    <Card.Root>
      <Card.Header>
        <Card.Title>Alerts & Suggestions</Card.Title>
      </Card.Header>
      <Card.Content class="space-y-4">
        <!-- Alerts -->
        {#if data.forecast.alerts.length > 0}
          <div class="space-y-2">
            <h4 class="text-sm font-medium">Active Alerts</h4>
            {#each data.forecast.alerts as alert}
              <div class="flex items-start gap-2 rounded-lg border p-3 {
                alert.type === 'danger' ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20' :
                alert.type === 'warning' ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20' :
                'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
              }">
                <AlertTriangle class="h-4 w-4 mt-0.5 {
                  alert.type === 'danger' ? 'text-red-600' :
                  alert.type === 'warning' ? 'text-yellow-600' :
                  'text-blue-600'
                }" />
                <div class="text-sm">
                  <p class="font-medium">{alert.message}</p>
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <div class="flex items-center gap-2 text-green-600">
            <CheckCircle class="h-4 w-4" />
            <span class="text-sm">No active alerts</span>
          </div>
        {/if}

        <!-- Suggestions -->
        {#if data.suggestions.length > 0}
          <div class="space-y-2">
            <h4 class="flex items-center gap-2 text-sm font-medium">
              <Lightbulb class="h-4 w-4" />
              Budget Suggestions
            </h4>
            {#each data.suggestions.slice(0, 3) as suggestion}
              <div class="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p class="text-sm font-medium">{suggestion.name}</p>
                  <p class="text-xs text-muted-foreground">{suggestion.reason}</p>
                </div>
                <span class="text-sm font-medium">{formatAmount(suggestion.estimatedAmount)}</span>
              </div>
            {/each}
          </div>
        {/if}
      </Card.Content>
    </Card.Root>
  </div>

  <!-- Additional Metrics -->
  <div class="grid gap-4 md:grid-cols-4">
    <Card.Root>
      <Card.Content class="p-4">
        <div class="flex items-center gap-2">
          <Users class="h-4 w-4 text-muted-foreground" />
          <span class="text-sm text-muted-foreground">Attendees</span>
        </div>
        <div class="mt-2 text-2xl font-bold">{data.metrics.currentAttendees}</div>
        <p class="text-xs text-muted-foreground">
          Avg ticket: {formatAmount(data.metrics.averageTicketPrice)}
        </p>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Content class="p-4">
        <div class="text-sm text-muted-foreground">Gross Profit</div>
        <div class="mt-2 text-2xl font-bold {data.metrics.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}">
          {formatAmount(data.metrics.grossProfit)}
        </div>
        <p class="text-xs text-muted-foreground">
          {data.metrics.grossMargin.toFixed(1)}% margin
        </p>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Content class="p-4">
        <div class="text-sm text-muted-foreground">Ticket Revenue</div>
        <div class="mt-2 text-2xl font-bold text-blue-600">
          {formatAmount(data.metrics.ticketRevenue)}
        </div>
        <p class="text-xs text-muted-foreground">
          {data.metrics.currentAttendees} tickets
        </p>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Content class="p-4">
        <div class="text-sm text-muted-foreground">Sponsorship</div>
        <div class="mt-2 text-2xl font-bold text-purple-600">
          {formatAmount(data.metrics.sponsorshipRevenue)}
        </div>
        <p class="text-xs text-muted-foreground">
          Confirmed sponsors
        </p>
      </Card.Content>
    </Card.Root>
  </div>
</div>
