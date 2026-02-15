<script lang="ts">
import { Badge } from '$lib/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card'
import type { SponsoringStats } from '$lib/features/sponsoring/services/sponsoring-stats-service'
import { cn } from '$lib/utils'

type Props = {
  stats: SponsoringStats
  class?: string
}

const { stats, class: className }: Props = $props()

const formatCurrency = (amount: number, currency: string): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

const progressColor = (percent: number): string => {
  if (percent >= 80) return 'bg-green-500'
  if (percent >= 50) return 'bg-yellow-500'
  return 'bg-red-500'
}

const pipelineStages = $derived([
  { label: 'Prospects', value: stats.pipeline.prospects, color: 'bg-gray-400' },
  { label: 'Contacted', value: stats.pipeline.contacted, color: 'bg-blue-400' },
  { label: 'Negotiating', value: stats.pipeline.negotiating, color: 'bg-yellow-400' },
  { label: 'Confirmed', value: stats.pipeline.confirmed, color: 'bg-green-500' }
])

const pipelineTotal = $derived(pipelineStages.reduce((sum, stage) => sum + stage.value, 0))
</script>

<Card class={cn('w-full', className)}>
  <CardHeader>
    <CardTitle class="flex items-center justify-between">
      <span>Sponsoring</span>
      <Badge variant="outline">
        {stats.sponsors.confirmed} confirmed
      </Badge>
    </CardTitle>
  </CardHeader>
  <CardContent class="space-y-6">
    <!-- Sponsors by Package -->
    <div>
      <h4 class="text-sm font-medium text-muted-foreground mb-2">Sponsors by Level</h4>
      <div class="space-y-2">
        {#each stats.sponsors.byPackage as pkg (pkg.packageId)}
          <div class="flex items-center justify-between text-sm">
            <div class="flex items-center gap-2">
              <span class="font-medium">{pkg.packageName}</span>
              <span class="text-muted-foreground">(Tier {pkg.tier})</span>
            </div>
            <div class="flex items-center gap-2">
              <span>{pkg.count}</span>
              {#if pkg.maxSponsors !== null}
                <span class="text-muted-foreground">/ {pkg.maxSponsors}</span>
                {#if pkg.availableSlots !== null && pkg.availableSlots > 0}
                  <Badge variant="outline" class="text-xs">
                    {pkg.availableSlots} available
                  </Badge>
                {:else if pkg.availableSlots === 0}
                  <Badge variant="secondary" class="text-xs">Full</Badge>
                {/if}
              {/if}
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- Revenue -->
    <div>
      <h4 class="text-sm font-medium text-muted-foreground mb-2">Revenue</h4>
      <div class="space-y-3">
        <div class="flex items-baseline justify-between">
          <span class="text-2xl font-bold">
            {formatCurrency(stats.revenue.totalRevenue, stats.revenue.currency)}
          </span>
          {#if stats.revenue.targetRevenue !== null}
            <span class="text-sm text-muted-foreground">
              / {formatCurrency(stats.revenue.targetRevenue, stats.revenue.currency)}
            </span>
          {/if}
        </div>

        {#if stats.revenue.targetRevenue !== null}
          <div>
            <div class="flex justify-between text-sm mb-1">
              <span>Progress</span>
              <span class="font-medium">{stats.revenue.progressPercent}%</span>
            </div>
            <div class="h-2 bg-muted rounded-full overflow-hidden">
              <div
                class={cn('h-full transition-all', progressColor(stats.revenue.progressPercent))}
                style="width: {Math.min(stats.revenue.progressPercent, 100)}%"
              ></div>
            </div>
          </div>
        {/if}

        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p class="text-muted-foreground">Paid</p>
            <p class="font-medium text-green-600">
              {formatCurrency(stats.revenue.paidRevenue, stats.revenue.currency)}
            </p>
          </div>
          <div>
            <p class="text-muted-foreground">Pending</p>
            <p class="font-medium text-yellow-600">
              {formatCurrency(stats.revenue.pendingRevenue, stats.revenue.currency)}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Pipeline -->
    <div>
      <h4 class="text-sm font-medium text-muted-foreground mb-2">Pipeline</h4>
      {#if pipelineTotal > 0}
        <div class="flex h-4 rounded-full overflow-hidden">
          {#each pipelineStages as stage}
            {#if stage.value > 0}
              <div
                class={cn('transition-all', stage.color)}
                style="width: {(stage.value / pipelineTotal) * 100}%"
                title="{stage.label}: {stage.value}"
              ></div>
            {/if}
          {/each}
        </div>
        <div class="flex flex-wrap gap-x-4 gap-y-1 mt-2">
          {#each pipelineStages as stage}
            <div class="flex items-center gap-1.5 text-xs">
              <div class={cn('w-2 h-2 rounded-full', stage.color)}></div>
              <span class="text-muted-foreground">{stage.label}</span>
              <span class="font-medium">{stage.value}</span>
            </div>
          {/each}
        </div>
      {:else}
        <p class="text-sm text-muted-foreground">No sponsors in pipeline</p>
      {/if}

      <div class="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
        <div>
          <p class="text-xs text-muted-foreground">Conversion Rate</p>
          <p class="text-lg font-semibold">{stats.pipeline.conversionRate}%</p>
        </div>
        <div>
          <p class="text-xs text-muted-foreground">Avg Deal Size</p>
          <p class="text-lg font-semibold">
            {formatCurrency(stats.pipeline.averageDealSize, stats.revenue.currency)}
          </p>
        </div>
      </div>
    </div>

    <!-- Declined/Cancelled -->
    {#if stats.pipeline.declined > 0 || stats.pipeline.cancelled > 0}
      <div class="flex gap-4 text-sm text-muted-foreground">
        {#if stats.pipeline.declined > 0}
          <span>Declined: {stats.pipeline.declined}</span>
        {/if}
        {#if stats.pipeline.cancelled > 0}
          <span>Cancelled: {stats.pipeline.cancelled}</span>
        {/if}
      </div>
    {/if}

    <!-- Pending Deliverables -->
    {#if stats.pendingDeliverables.length > 0}
      <div>
        <h4 class="text-sm font-medium text-muted-foreground mb-2">Pending Deliverables</h4>
        <div class="rounded-lg bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 p-3">
          <div class="flex items-start gap-2">
            <svg class="w-5 h-5 text-orange-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
            </svg>
            <div class="flex-1">
              <p class="text-sm font-medium text-orange-800 dark:text-orange-200">
                {stats.pendingDeliverables.length} sponsor{stats.pendingDeliverables.length > 1 ? 's' : ''} with pending deliverables
              </p>
              <ul class="text-xs text-orange-700 dark:text-orange-300 mt-1 space-y-1">
                {#each stats.pendingDeliverables.slice(0, 3) as deliverable}
                  <li>
                    {deliverable.sponsorName}: {deliverable.pendingBenefits.length} item{deliverable.pendingBenefits.length > 1 ? 's' : ''}
                  </li>
                {/each}
                {#if stats.pendingDeliverables.length > 3}
                  <li class="text-orange-600">
                    +{stats.pendingDeliverables.length - 3} more...
                  </li>
                {/if}
              </ul>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </CardContent>
</Card>
