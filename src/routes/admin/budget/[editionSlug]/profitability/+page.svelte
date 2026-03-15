<script lang="ts">
import { AdminSubNav } from '$lib/components/shared'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { getBudgetNavItems } from '$lib/config'
import * as m from '$lib/paraglide/messages'
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
  <title>{m.budget_profitability_title({ name: data.edition.name })}</title>
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
        <p class="text-muted-foreground">{m.budget_profitability_subtitle()}</p>
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
          {data.forecast.riskLevel === 'high' ? m.budget_profitability_risk_high() : data.forecast.riskLevel === 'low' ? m.budget_profitability_risk_low() : m.budget_profitability_risk_medium()}
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
          <p class="font-medium text-blue-900 dark:text-blue-100">{m.budget_profitability_intro_title()}</p>
          <p class="mt-1 text-blue-700 dark:text-blue-300">
            {m.budget_profitability_intro_text()}
          </p>
        </div>
      </div>
    </Card.Content>
  </Card.Root>

  <!-- Key Metrics -->
  <div class="grid gap-4 md:grid-cols-4">
    <Card.Root class={data.metrics.netProfit >= 0 ? 'border-green-200 dark:border-green-800' : 'border-red-200 dark:border-red-800'}>
      <Card.Header class="flex flex-row items-center justify-between pb-2">
        <Card.Title class="text-sm font-medium">{m.budget_profitability_net_profit()}</Card.Title>
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
          {m.budget_profitability_margin({ percent: data.metrics.netMargin.toFixed(1) })}
        </p>
        <p class="mt-2 text-xs text-muted-foreground">
          {m.budget_profitability_profit_description()}
        </p>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Header class="flex flex-row items-center justify-between pb-2">
        <Card.Title class="text-sm font-medium">{m.budget_profitability_total_revenue()}</Card.Title>
        <DollarSign class="h-4 w-4 text-muted-foreground" />
      </Card.Header>
      <Card.Content>
        <div class="text-2xl font-bold text-green-600">
          {formatAmount(data.metrics.totalRevenue)}
        </div>
        <p class="text-xs text-muted-foreground">
          {m.budget_profitability_vs_target({ percent: formatPercent(data.metrics.revenueVariancePercentage) })}
        </p>
        <p class="mt-2 text-xs text-muted-foreground">
          {m.budget_profitability_revenue_description()}
        </p>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Header class="flex flex-row items-center justify-between pb-2">
        <Card.Title class="text-sm font-medium">{m.budget_profitability_total_costs()}</Card.Title>
        <TrendingDown class="h-4 w-4 text-muted-foreground" />
      </Card.Header>
      <Card.Content>
        <div class="text-2xl font-bold text-orange-600">
          {formatAmount(data.metrics.totalCosts)}
        </div>
        <p class="text-xs text-muted-foreground">
          {m.budget_profitability_vs_budget({ percent: formatPercent(-data.metrics.costVariancePercentage) })}
        </p>
        <p class="mt-2 text-xs text-muted-foreground">
          {m.budget_profitability_costs_description()}
        </p>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Header class="flex flex-row items-center justify-between pb-2">
        <Card.Title class="text-sm font-medium">{m.budget_profitability_breakeven()}</Card.Title>
        <Target class="h-4 w-4 text-muted-foreground" />
      </Card.Header>
      <Card.Content>
        <div class="text-2xl font-bold">{m.budget_profitability_breakeven_attendees({ count: data.metrics.breakEvenAttendees })}</div>
        <div class="mt-1">
          <div class="h-2 w-full rounded-full bg-muted">
            <div
              class="h-2 rounded-full {data.metrics.breakEvenProgress >= 100 ? 'bg-green-500' : 'bg-primary'} transition-all"
              style="width: {Math.min(data.metrics.breakEvenProgress, 100)}%"
            ></div>
          </div>
          <p class="mt-1 text-xs text-muted-foreground">
            {m.budget_profitability_registered({ count: data.metrics.currentAttendees, percent: data.metrics.breakEvenProgress.toFixed(0) })}
          </p>
        </div>
        <p class="mt-2 text-xs text-muted-foreground">
          {#if data.metrics.breakEvenProgress >= 100}
            {m.budget_profitability_breakeven_reached()}
          {:else}
            {m.budget_profitability_breakeven_needed({ count: data.metrics.breakEvenAttendees - data.metrics.currentAttendees })}
          {/if}
        </p>
      </Card.Content>
    </Card.Root>
  </div>

  <div class="grid gap-6 lg:grid-cols-2">
    <!-- Revenue Breakdown -->
    <Card.Root>
      <Card.Header>
        <Card.Title>{m.budget_profitability_revenue_breakdown()}</Card.Title>
      </Card.Header>
      <Card.Content class="space-y-4">
        <div class="space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-muted-foreground">{m.budget_profitability_ticket_revenue()}</span>
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
            <span class="text-muted-foreground">{m.budget_profitability_sponsorship_revenue()}</span>
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
            <span class="text-muted-foreground">{m.budget_profitability_other_income()}</span>
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
        <Card.Title>{m.budget_profitability_cost_breakdown()}</Card.Title>
        <p class="text-xs text-muted-foreground mt-1">
          {m.budget_profitability_cost_breakdown_hint()}
        </p>
      </Card.Header>
      <Card.Content class="space-y-4">
        <div class="space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-muted-foreground">{m.budget_profitability_planned_costs()}</span>
            <span class="font-medium">{formatAmount(data.metrics.plannedCosts)}</span>
          </div>
          <p class="text-xs text-muted-foreground">{m.budget_profitability_planned_hint()}</p>
        </div>

        <div class="space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-muted-foreground">{m.budget_profitability_actual_costs()}</span>
            <span class="font-medium text-orange-600">{formatAmount(data.metrics.actualCosts)}</span>
          </div>
          <div class="h-2 rounded-full bg-muted">
            <div
              class="h-2 rounded-full bg-orange-500"
              style="width: {data.metrics.plannedCosts > 0 ? (data.metrics.actualCosts / data.metrics.plannedCosts * 100) : 0}%"
            ></div>
          </div>
          <p class="text-xs text-muted-foreground">{m.budget_profitability_actual_hint()}</p>
        </div>

        <div class="space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-muted-foreground">{m.budget_profitability_pending_costs()}</span>
            <span class="font-medium text-yellow-600">{formatAmount(data.metrics.pendingCosts)}</span>
          </div>
          <div class="h-2 rounded-full bg-muted">
            <div
              class="h-2 rounded-full bg-yellow-500"
              style="width: {data.metrics.plannedCosts > 0 ? (data.metrics.pendingCosts / data.metrics.plannedCosts * 100) : 0}%"
            ></div>
          </div>
          <p class="text-xs text-muted-foreground">{m.budget_profitability_pending_hint()}</p>
        </div>

        <div class="border-t pt-4">
          <div class="flex justify-between">
            <div>
              <span class="font-medium">{m.budget_profitability_variance()}</span>
              <p class="text-xs text-muted-foreground">
                {data.metrics.costVariance >= 0
                  ? m.budget_profitability_variance_positive()
                  : m.budget_profitability_variance_negative()}
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
          {m.budget_profitability_forecast()}
        </Card.Title>
        <p class="text-xs text-muted-foreground mt-1">
          {m.budget_profitability_forecast_hint()}
        </p>
      </Card.Header>
      <Card.Content class="space-y-4">
        <div class="flex items-center justify-between">
          <span class="text-muted-foreground">{m.budget_profitability_overall_status()}</span>
          <div class="flex items-center gap-2">
            {#if data.forecast.isOnTrack}
              <CheckCircle class="h-4 w-4 text-green-600" />
              <span class="text-green-600">{m.budget_profitability_on_track()}</span>
            {:else}
              <XCircle class="h-4 w-4 text-red-600" />
              <span class="text-red-600">{m.budget_profitability_at_risk()}</span>
            {/if}
          </div>
        </div>

        <div class="flex items-center justify-between">
          <span class="text-muted-foreground">{m.budget_profitability_days_remaining()}</span>
          <span class="font-medium">{data.forecast.daysRemaining}</span>
        </div>

        <div class="space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-muted-foreground">{m.budget_profitability_revenue_progress()}</span>
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
            <span class="text-muted-foreground">{m.budget_profitability_cost_progress()}</span>
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
          <h4 class="mb-2 text-sm font-medium">{m.budget_profitability_projected_final()}</h4>
          <div class="space-y-1 text-sm">
            <div class="flex justify-between">
              <span class="text-muted-foreground">{m.budget_profitability_revenue()}</span>
              <span>{formatAmount(data.forecast.projectedFinalRevenue)}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">{m.budget_profitability_costs()}</span>
              <span>{formatAmount(data.forecast.projectedFinalCosts)}</span>
            </div>
            <div class="flex justify-between font-medium">
              <span>{m.budget_profitability_profit()}</span>
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
        <Card.Title>{m.budget_profitability_alerts()}</Card.Title>
      </Card.Header>
      <Card.Content class="space-y-4">
        <!-- Alerts -->
        {#if data.forecast.alerts.length > 0}
          <div class="space-y-2">
            <h4 class="text-sm font-medium">{m.budget_profitability_active_alerts()}</h4>
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
            <span class="text-sm">{m.budget_profitability_no_alerts()}</span>
          </div>
        {/if}

        <!-- Suggestions -->
        {#if data.suggestions.length > 0}
          <div class="space-y-2">
            <h4 class="flex items-center gap-2 text-sm font-medium">
              <Lightbulb class="h-4 w-4" />
              {m.budget_profitability_suggestions()}
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
          <span class="text-sm text-muted-foreground">{m.budget_profitability_attendees()}</span>
        </div>
        <div class="mt-2 text-2xl font-bold">{data.metrics.currentAttendees}</div>
        <p class="text-xs text-muted-foreground">
          {m.budget_profitability_avg_ticket({ amount: formatAmount(data.metrics.averageTicketPrice) })}
        </p>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Content class="p-4">
        <div class="text-sm text-muted-foreground">{m.budget_profitability_gross_profit()}</div>
        <div class="mt-2 text-2xl font-bold {data.metrics.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}">
          {formatAmount(data.metrics.grossProfit)}
        </div>
        <p class="text-xs text-muted-foreground">
          {m.budget_profitability_margin({ percent: data.metrics.grossMargin.toFixed(1) })}
        </p>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Content class="p-4">
        <div class="text-sm text-muted-foreground">{m.budget_profitability_ticket_revenue()}</div>
        <div class="mt-2 text-2xl font-bold text-blue-600">
          {formatAmount(data.metrics.ticketRevenue)}
        </div>
        <p class="text-xs text-muted-foreground">
          {m.budget_profitability_tickets({ count: data.metrics.currentAttendees })}
        </p>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Content class="p-4">
        <div class="text-sm text-muted-foreground">{m.budget_profitability_sponsorship()}</div>
        <div class="mt-2 text-2xl font-bold text-purple-600">
          {formatAmount(data.metrics.sponsorshipRevenue)}
        </div>
        <p class="text-xs text-muted-foreground">
          {m.budget_profitability_confirmed_sponsors()}
        </p>
      </Card.Content>
    </Card.Root>
  </div>
</div>
