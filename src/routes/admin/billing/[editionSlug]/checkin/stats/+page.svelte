<script lang="ts">
import { invalidateAll } from '$app/navigation'
import { AdminSubNav } from '$lib/components/shared'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { getBillingNavItems } from '$lib/config'
import * as m from '$lib/paraglide/messages'
import {
  Activity,
  ArrowLeft,
  BarChart3,
  Clock,
  RefreshCw,
  Ticket,
  TrendingUp,
  Users
} from 'lucide-svelte'
import type { PageData } from './$types'

interface Props {
  data: PageData
}

const { data }: Props = $props()

let refreshing = $state(false)
let autoRefresh = $state(false)
let refreshInterval: ReturnType<typeof setInterval> | null = null

async function refresh() {
  refreshing = true
  await invalidateAll()
  refreshing = false
}

function toggleAutoRefresh() {
  autoRefresh = !autoRefresh
  if (autoRefresh) {
    refreshInterval = setInterval(refresh, 15000) // 15 seconds
  } else if (refreshInterval) {
    clearInterval(refreshInterval)
    refreshInterval = null
  }
}

function formatHour(hour: number): string {
  return `${hour.toString().padStart(2, '0')}:00`
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// Calculate max for chart scaling
const maxHourlyCount = $derived(
  data.hourlyStats.length > 0 ? Math.max(...data.hourlyStats.map((h) => h.count)) : 1
)

$effect(() => {
  return () => {
    if (refreshInterval) {
      clearInterval(refreshInterval)
    }
  }
})
</script>

<svelte:head>
  <title>{m.billing_stats_title()} - {data.edition.name} - Open Event Orchestrator</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-4">
      <a href="/admin/billing/{data.edition.slug}">
        <Button variant="ghost" size="icon">
          <ArrowLeft class="h-5 w-5" />
        </Button>
      </a>
      <div>
        <h2 class="text-3xl font-bold tracking-tight">{data.edition.name}</h2>
      </div>
    </div>
    <div class="flex items-center gap-2">
      <Button
        variant={autoRefresh ? 'default' : 'outline'}
        size="sm"
        onclick={toggleAutoRefresh}
        class="gap-2"
      >
        <Activity class="h-4 w-4 {autoRefresh ? 'animate-pulse' : ''}" />
        {autoRefresh ? m.billing_stats_auto_refresh_on() : m.billing_stats_auto_refresh()}
      </Button>
      <Button variant="outline" size="sm" onclick={refresh} disabled={refreshing} class="gap-2">
        <RefreshCw class="h-4 w-4 {refreshing ? 'animate-spin' : ''}" />
        {m.action_refresh()}
      </Button>
    </div>
  </div>

  <!-- Sub-navigation -->
  <AdminSubNav basePath="/admin/billing/{data.edition.slug}" items={getBillingNavItems(data.edition.slug)} />

  <!-- Last updated -->
  <p class="text-sm text-muted-foreground">
    {m.billing_stats_last_updated({ time: formatTime(data.lastUpdated) })}
  </p>

  <!-- Overview Stats -->
  <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
    <Card.Root>
      <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
        <Card.Title class="text-sm font-medium">{m.billing_stats_checked_in()}</Card.Title>
        <Users class="h-4 w-4 text-muted-foreground" />
      </Card.Header>
      <Card.Content>
        <div class="text-2xl font-bold">
          {data.stats.totalCheckedIn}
          <span class="text-lg font-normal text-muted-foreground">
            / {data.stats.totalValid}
          </span>
        </div>
        <div class="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div
            class="h-full bg-primary transition-all duration-500"
            style="width: {data.stats.percentage}%"
          ></div>
        </div>
        <p class="mt-1 text-xs text-muted-foreground">
          {m.billing_stats_complete({ percent: data.stats.percentage })}
        </p>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
        <Card.Title class="text-sm font-medium">{m.billing_stats_remaining()}</Card.Title>
        <Ticket class="h-4 w-4 text-muted-foreground" />
      </Card.Header>
      <Card.Content>
        <div class="text-2xl font-bold">
          {data.stats.totalValid - data.stats.totalCheckedIn}
        </div>
        <p class="text-xs text-muted-foreground">{m.billing_stats_tickets_to_checkin()}</p>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
        <Card.Title class="text-sm font-medium">{m.billing_stats_average_rate()}</Card.Title>
        <TrendingUp class="h-4 w-4 text-muted-foreground" />
      </Card.Header>
      <Card.Content>
        <div class="text-2xl font-bold">{data.stats.averagePerHour}</div>
        <p class="text-xs text-muted-foreground">{m.billing_stats_checkins_per_hour()}</p>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
        <Card.Title class="text-sm font-medium">{m.billing_stats_peak_hour()}</Card.Title>
        <Clock class="h-4 w-4 text-muted-foreground" />
      </Card.Header>
      <Card.Content>
        {#if data.stats.peakCount > 0}
          <div class="text-2xl font-bold">{formatHour(data.stats.peakHour)}</div>
          <p class="text-xs text-muted-foreground">
            {data.stats.peakCount} {m.billing_stats_checkins()}
          </p>
        {:else}
          <div class="text-2xl font-bold text-muted-foreground">--</div>
          <p class="text-xs text-muted-foreground">{m.billing_stats_no_checkins()}</p>
        {/if}
      </Card.Content>
    </Card.Root>
  </div>

  <div class="grid gap-6 lg:grid-cols-2">
    <!-- By Ticket Type -->
    <Card.Root>
      <Card.Header>
        <Card.Title class="flex items-center gap-2">
          <Ticket class="h-5 w-5" />
          {m.billing_stats_by_ticket_type()}
        </Card.Title>
        <Card.Description>{m.billing_stats_by_ticket_type_desc()}</Card.Description>
      </Card.Header>
      <Card.Content>
        {#if data.ticketTypeStats.length === 0}
          <p class="py-8 text-center text-muted-foreground">{m.billing_stats_no_tickets()}</p>
        {:else}
          <div class="space-y-4">
            {#each data.ticketTypeStats as ticketType}
              <div class="space-y-1">
                <div class="flex items-center justify-between text-sm">
                  <span class="font-medium">{ticketType.name}</span>
                  <span class="text-muted-foreground">
                    {ticketType.checkedIn} / {ticketType.total}
                    <span class="ml-1 text-xs">({ticketType.percentage}%)</span>
                  </span>
                </div>
                <div class="h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    class="h-full bg-primary transition-all duration-500"
                    style="width: {ticketType.percentage}%"
                  ></div>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </Card.Content>
    </Card.Root>

    <!-- Hourly Distribution -->
    <Card.Root>
      <Card.Header>
        <Card.Title class="flex items-center gap-2">
          <BarChart3 class="h-5 w-5" />
          {m.billing_stats_hourly_distribution()}
        </Card.Title>
        <Card.Description>{m.billing_stats_hourly_distribution_desc()}</Card.Description>
      </Card.Header>
      <Card.Content>
        {#if data.hourlyStats.length === 0}
          <p class="py-8 text-center text-muted-foreground">{m.billing_stats_no_checkins()}</p>
        {:else}
          <div class="flex h-48 items-end gap-1">
            {#each data.hourlyStats as hourData}
              {@const heightPercent = (hourData.count / maxHourlyCount) * 100}
              <div class="group relative flex flex-1 flex-col items-center">
                <div
                  class="w-full rounded-t bg-primary transition-all duration-300 hover:bg-primary/80"
                  style="height: {heightPercent}%"
                ></div>
                <span class="mt-1 text-xs text-muted-foreground">
                  {formatHour(hourData.hour).slice(0, 2)}
                </span>
                <!-- Tooltip -->
                <div
                  class="absolute -top-8 hidden rounded bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md group-hover:block"
                >
                  {hourData.count} at {formatHour(hourData.hour)}
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </Card.Content>
    </Card.Root>
  </div>

  <!-- Quick Actions -->
  <Card.Root>
    <Card.Header>
      <Card.Title>{m.billing_stats_quick_actions()}</Card.Title>
    </Card.Header>
    <Card.Content class="flex gap-4">
      <a href="/admin/billing/{data.edition.slug}/checkin">
        <Button variant="outline">
          <Users class="mr-2 h-4 w-4" />
          {m.billing_stats_back_to_scanner()}
        </Button>
      </a>
      <a href="/admin/billing/{data.edition.slug}/participants">
        <Button variant="outline">
          <Ticket class="mr-2 h-4 w-4" />
          {m.billing_stats_view_participants()}
        </Button>
      </a>
    </Card.Content>
  </Card.Root>
</div>
