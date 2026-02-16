<script lang="ts">
import { invalidateAll } from '$app/navigation'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { DashboardGrid, HorizontalBarChart, MetricCard } from '$lib/features/reporting/ui'
import {
  ArrowLeft,
  Bell,
  Calendar,
  Check,
  CreditCard,
  DollarSign,
  FileText,
  Loader2,
  Mail,
  MessageSquare,
  RefreshCw,
  Settings,
  Target,
  Ticket,
  Users
} from 'lucide-svelte'
import type { PageData } from './$types'

interface Props {
  data: PageData
}

const { data }: Props = $props()

let isRefreshing = $state(false)

async function refreshDashboard() {
  isRefreshing = true
  await invalidateAll()
  isRefreshing = false
}

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date)
}

// Chart colors palette
const chartColors = [
  'hsl(221 83% 53%)', // blue
  'hsl(142 76% 36%)', // green
  'hsl(48 96% 53%)', // yellow
  'hsl(0 84% 60%)', // red
  'hsl(262 83% 58%)', // purple
  'hsl(316 72% 52%)', // pink
  'hsl(25 95% 53%)', // orange
  'hsl(173 80% 40%)' // teal
]

const getColor = (index: number) => chartColors[index % chartColors.length]

// Ticket type distribution chart
const ticketTypeChartData = $derived(
  data.distributions?.ticketTypes?.map((item, index) => ({
    label: item.name,
    value: item.count,
    color: getColor(index)
  })) ?? []
)

// CFP status chart
const cfpStatusChartData = $derived(
  data.metrics
    ? [
        { label: 'Accepted', value: data.metrics.cfp.acceptedTalks, color: 'hsl(142 76% 36%)' },
        { label: 'Pending', value: data.metrics.cfp.pendingReviews, color: 'hsl(48 96% 53%)' },
        { label: 'Rejected', value: data.metrics.cfp.rejectedTalks, color: 'hsl(0 84% 60%)' }
      ]
    : []
)

// Talk category distribution chart
const talkCategoryChartData = $derived(
  data.distributions?.talkCategories?.map((item, index) => ({
    label: item.name,
    value: item.count,
    color: getColor(index)
  })) ?? []
)

// Talk format distribution chart
const talkFormatChartData = $derived(
  data.distributions?.talkFormats?.map((item, index) => ({
    label: item.name,
    value: item.count,
    color: getColor(index)
  })) ?? []
)

// Session track distribution chart
const sessionTrackChartData = $derived(
  data.distributions?.sessionTracks?.map((item, index) => ({
    label: item.name,
    value: item.count,
    color: getColor(index)
  })) ?? []
)

// Sponsor status chart
const sponsorStatusChartData = $derived(
  data.metrics
    ? [
        {
          label: 'Confirmed',
          value: data.metrics.sponsoring.confirmedSponsors,
          color: 'hsl(142 76% 36%)'
        },
        {
          label: 'Pending',
          value: data.metrics.sponsoring.pendingSponsors,
          color: 'hsl(48 96% 53%)'
        }
      ]
    : []
)

// Sponsor tier distribution
const sponsorTierChartData = $derived(
  data.distributions?.sponsorTiers?.map((item, index) => ({
    label: item.name,
    value: item.count,
    color: getColor(index)
  })) ?? []
)

// Revenue sources for bar chart
const revenueChartItems = $derived(
  data.metrics
    ? [
        {
          label: 'Ticket Revenue',
          value: data.metrics.billing.totalRevenue,
          color: 'hsl(221 83% 53%)'
        },
        {
          label: 'Sponsorship Value',
          value: data.metrics.sponsoring.totalSponsorshipValue,
          color: 'hsl(142 76% 36%)'
        }
      ]
    : []
)

// Check-in progress chart
const checkInChartData = $derived(
  data.metrics
    ? [
        {
          label: 'Checked In',
          value: data.metrics.billing.ticketsCheckedIn,
          color: 'hsl(142 76% 36%)'
        },
        {
          label: 'Not Checked In',
          value: data.metrics.billing.ticketsSold - data.metrics.billing.ticketsCheckedIn,
          color: 'hsl(var(--muted))'
        }
      ]
    : []
)

// Sessions scheduled chart
const sessionsScheduledChartData = $derived(
  data.metrics
    ? [
        {
          label: 'Scheduled',
          value: data.metrics.planning.scheduledSessions,
          color: 'hsl(221 83% 53%)'
        },
        {
          label: 'Unscheduled',
          value: data.metrics.planning.unscheduledSessions,
          color: 'hsl(48 96% 53%)'
        }
      ]
    : []
)

// Budget usage chart
const budgetUsageChartData = $derived(
  data.metrics
    ? [
        { label: 'Spent', value: data.metrics.budget.spent, color: 'hsl(221 83% 53%)' },
        { label: 'Remaining', value: data.metrics.budget.remaining, color: 'hsl(142 76% 36%)' }
      ]
    : []
)
</script>

<svelte:head>
  <title>Dashboard - {data.edition.name} - Open Event Orchestrator</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-4">
      <a href="/admin/reporting">
        <Button variant="ghost" size="icon">
          <ArrowLeft class="h-5 w-5" />
        </Button>
      </a>
      <div>
        <h2 class="text-3xl font-bold tracking-tight">{data.edition.name}</h2>
        <p class="text-muted-foreground">
          {data.event.name} - {formatDate(data.edition.startDate)} to {formatDate(data.edition.endDate)}
        </p>
      </div>
    </div>

    <div class="flex items-center gap-2">
      <a href="/admin/reporting/{data.edition.slug}/alerts">
        <Button variant="outline" class="gap-2">
          <Bell class="h-4 w-4" />
          Alerts
        </Button>
      </a>
      <a href="/admin/reporting/{data.edition.slug}/reports">
        <Button variant="outline" class="gap-2">
          <Mail class="h-4 w-4" />
          Reports
        </Button>
      </a>
      <Button variant="outline" onclick={refreshDashboard} disabled={isRefreshing}>
        {#if isRefreshing}
          <Loader2 class="mr-2 h-4 w-4 animate-spin" />
        {:else}
          <RefreshCw class="mr-2 h-4 w-4" />
        {/if}
        Refresh
      </Button>
    </div>
  </div>

  <!-- Notifications Summary -->
  <Card.Root>
    <Card.Header class="pb-3">
      <div class="flex items-center justify-between">
        <Card.Title class="flex items-center gap-2 text-base font-medium">
          <Settings class="h-4 w-4" />
          Notification Settings
        </Card.Title>
      </div>
    </Card.Header>
    <Card.Content>
      <div class="grid gap-4 md:grid-cols-2">
        <!-- Alert Thresholds -->
        <a href="/admin/reporting/{data.edition.slug}/alerts" class="group">
          <div
            class="flex items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50"
          >
            <div class="rounded-lg bg-orange-100 p-2 dark:bg-orange-900/30">
              <Bell class="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div class="flex-1">
              <h4 class="font-medium group-hover:underline">Alert Thresholds</h4>
              <p class="text-sm text-muted-foreground">
                {#if data.notifications.alertThresholds.total === 0}
                  No alerts configured
                {:else}
                  {data.notifications.alertThresholds.enabled} active / {data.notifications
                    .alertThresholds.total} configured
                  {#if data.notifications.alertThresholds.withEmail > 0}
                    <span class="ml-1 text-xs"
                      >({data.notifications.alertThresholds.withEmail} with email)</span
                    >
                  {/if}
                {/if}
              </p>
            </div>
            <div class="text-muted-foreground">
              <ArrowLeft class="h-4 w-4 rotate-180" />
            </div>
          </div>
        </a>

        <!-- Automated Reports -->
        <a href="/admin/reporting/{data.edition.slug}/reports" class="group">
          <div
            class="flex items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50"
          >
            <div class="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30">
              <Mail class="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div class="flex-1">
              <h4 class="font-medium group-hover:underline">Automated Reports</h4>
              <p class="text-sm text-muted-foreground">
                {#if data.notifications.reportConfigs.total === 0}
                  No reports configured
                {:else}
                  {data.notifications.reportConfigs.enabled} active / {data.notifications
                    .reportConfigs.total} configured
                  {#if data.notifications.reportConfigs.enabled > 0}
                    <span class="ml-1 text-xs">
                      ({#if data.notifications.reportConfigs.daily > 0}
                        {data.notifications.reportConfigs.daily} daily
                      {/if}
                      {#if data.notifications.reportConfigs.weekly > 0}
                        {data.notifications.reportConfigs.daily > 0 ? ', ' : ''}{data.notifications
                          .reportConfigs.weekly} weekly
                      {/if}
                      {#if data.notifications.reportConfigs.monthly > 0}
                        {data.notifications.reportConfigs.daily > 0 ||
                        data.notifications.reportConfigs.weekly > 0
                          ? ', '
                          : ''}{data.notifications.reportConfigs.monthly} monthly
                      {/if})
                    </span>
                  {/if}
                {/if}
              </p>
            </div>
            <div class="text-muted-foreground">
              <ArrowLeft class="h-4 w-4 rotate-180" />
            </div>
          </div>
        </a>
      </div>
    </Card.Content>
  </Card.Root>

  {#if !data.metrics}
    <Card.Root>
      <Card.Content class="flex flex-col items-center justify-center py-12">
        <Calendar class="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 class="text-lg font-semibold">No data available</h3>
        <p class="text-sm text-muted-foreground">
          Metrics will be available once data has been added.
        </p>
      </Card.Content>
    </Card.Root>
  {:else}
    <!-- Ticketing Section -->
    <section>
      <h3 class="mb-4 text-lg font-semibold">Ticketing</h3>
      <DashboardGrid columns={4}>
        <MetricCard
          data={{
            value: data.metrics.billing.totalRevenue,
            label: 'Revenue',
            format: 'currency',
            unit: data.metrics.billing.currency
          }}
        >
          {#snippet icon()}
            <DollarSign class="h-4 w-4" />
          {/snippet}
        </MetricCard>

        <MetricCard
          data={{
            value: data.metrics.billing.ticketsSold,
            label: 'Tickets Sold',
            format: 'number'
          }}
        >
          {#snippet icon()}
            <Ticket class="h-4 w-4" />
          {/snippet}
        </MetricCard>

        <MetricCard
          data={{
            value: data.metrics.billing.checkInRate,
            label: 'Check-in Rate',
            format: 'percentage'
          }}
        >
          {#snippet icon()}
            <Check class="h-4 w-4" />
          {/snippet}
        </MetricCard>

        <MetricCard
          data={{
            value: data.metrics.billing.ordersCount,
            label: 'Orders',
            format: 'number'
          }}
        >
          {#snippet icon()}
            <CreditCard class="h-4 w-4" />
          {/snippet}
        </MetricCard>
      </DashboardGrid>

      <div class="mt-4 grid gap-4 md:grid-cols-2">
        {#if ticketTypeChartData.length > 0}
          <HorizontalBarChart title="Tickets by Type" items={ticketTypeChartData}>
            {#snippet icon()}
              <Ticket class="h-4 w-4" />
            {/snippet}
          </HorizontalBarChart>
        {:else}
          <Card.Root>
            <Card.Header class="pb-2">
              <Card.Title class="text-sm font-medium">Tickets by Type</Card.Title>
            </Card.Header>
            <Card.Content class="flex items-center justify-center py-8">
              <p class="text-sm text-muted-foreground">No ticket sales yet</p>
            </Card.Content>
          </Card.Root>
        {/if}

        <HorizontalBarChart title="Check-in Progress" items={checkInChartData}>
          {#snippet icon()}
            <Check class="h-4 w-4" />
          {/snippet}
        </HorizontalBarChart>
      </div>
    </section>

    <!-- CFP Section -->
    <section>
      <h3 class="mb-4 text-lg font-semibold">Call for Papers</h3>
      <DashboardGrid columns={4}>
        <MetricCard
          data={{
            value: data.metrics.cfp.totalSubmissions,
            label: 'Submissions',
            format: 'number'
          }}
        >
          {#snippet icon()}
            <FileText class="h-4 w-4" />
          {/snippet}
        </MetricCard>

        <MetricCard
          data={{
            value: data.metrics.cfp.pendingReviews,
            label: 'Pending Reviews',
            format: 'number'
          }}
        >
          {#snippet icon()}
            <MessageSquare class="h-4 w-4" />
          {/snippet}
        </MetricCard>

        <MetricCard
          data={{
            value: data.metrics.cfp.acceptedTalks,
            label: 'Accepted',
            format: 'number'
          }}
        >
          {#snippet icon()}
            <Check class="h-4 w-4" />
          {/snippet}
        </MetricCard>

        <MetricCard
          data={{
            value: data.metrics.cfp.speakersCount,
            label: 'Speakers',
            format: 'number'
          }}
        >
          {#snippet icon()}
            <Users class="h-4 w-4" />
          {/snippet}
        </MetricCard>
      </DashboardGrid>

      <div class="mt-4 grid gap-4 md:grid-cols-3">
        <HorizontalBarChart title="Submission Status" items={cfpStatusChartData}>
          {#snippet icon()}
            <FileText class="h-4 w-4" />
          {/snippet}
        </HorizontalBarChart>

        {#if talkCategoryChartData.length > 0}
          <HorizontalBarChart title="Talks by Category" items={talkCategoryChartData}>
            {#snippet icon()}
              <Target class="h-4 w-4" />
            {/snippet}
          </HorizontalBarChart>
        {:else}
          <Card.Root>
            <Card.Header class="pb-2">
              <Card.Title class="text-sm font-medium">Talks by Category</Card.Title>
            </Card.Header>
            <Card.Content class="flex items-center justify-center py-8">
              <p class="text-sm text-muted-foreground">No categories defined</p>
            </Card.Content>
          </Card.Root>
        {/if}

        {#if talkFormatChartData.length > 0}
          <HorizontalBarChart title="Talks by Format" items={talkFormatChartData}>
            {#snippet icon()}
              <Calendar class="h-4 w-4" />
            {/snippet}
          </HorizontalBarChart>
        {:else}
          <Card.Root>
            <Card.Header class="pb-2">
              <Card.Title class="text-sm font-medium">Talks by Format</Card.Title>
            </Card.Header>
            <Card.Content class="flex items-center justify-center py-8">
              <p class="text-sm text-muted-foreground">No formats defined</p>
            </Card.Content>
          </Card.Root>
        {/if}
      </div>
    </section>

    <!-- Planning Section -->
    <section>
      <h3 class="mb-4 text-lg font-semibold">Planning</h3>
      <DashboardGrid columns={4}>
        <MetricCard
          data={{
            value: data.metrics.planning.totalSessions,
            label: 'Total Sessions',
            format: 'number'
          }}
        >
          {#snippet icon()}
            <Calendar class="h-4 w-4" />
          {/snippet}
        </MetricCard>

        <MetricCard
          data={{
            value: data.metrics.planning.tracksCount,
            label: 'Tracks',
            format: 'number'
          }}
        >
          {#snippet icon()}
            <Target class="h-4 w-4" />
          {/snippet}
        </MetricCard>

        <MetricCard
          data={{
            value: data.metrics.planning.roomsCount,
            label: 'Rooms',
            format: 'number'
          }}
        />

        <MetricCard
          data={{
            value: data.metrics.planning.unscheduledSessions,
            label: 'Unscheduled',
            format: 'number'
          }}
        />
      </DashboardGrid>

      <div class="mt-4 grid gap-4 md:grid-cols-2">
        <HorizontalBarChart title="Scheduling Progress" items={sessionsScheduledChartData}>
          {#snippet icon()}
            <Calendar class="h-4 w-4" />
          {/snippet}
        </HorizontalBarChart>

        {#if sessionTrackChartData.length > 0}
          <HorizontalBarChart title="Sessions by Track" items={sessionTrackChartData}>
            {#snippet icon()}
              <Target class="h-4 w-4" />
            {/snippet}
          </HorizontalBarChart>
        {:else}
          <Card.Root>
            <Card.Header class="pb-2">
              <Card.Title class="text-sm font-medium">Sessions by Track</Card.Title>
            </Card.Header>
            <Card.Content class="flex items-center justify-center py-8">
              <p class="text-sm text-muted-foreground">No tracks defined</p>
            </Card.Content>
          </Card.Root>
        {/if}
      </div>
    </section>

    <!-- Sponsoring Section -->
    <section>
      <h3 class="mb-4 text-lg font-semibold">Sponsoring</h3>
      <DashboardGrid columns={4}>
        <MetricCard
          data={{
            value: data.metrics.sponsoring.totalSponsorshipValue,
            label: 'Sponsorship Value',
            format: 'currency',
            unit: data.metrics.sponsoring.currency
          }}
        >
          {#snippet icon()}
            <DollarSign class="h-4 w-4" />
          {/snippet}
        </MetricCard>

        <MetricCard
          data={{
            value: data.metrics.sponsoring.confirmedSponsors,
            label: 'Confirmed',
            format: 'number'
          }}
        >
          {#snippet icon()}
            <Check class="h-4 w-4" />
          {/snippet}
        </MetricCard>

        <MetricCard
          data={{
            value: data.metrics.sponsoring.pendingSponsors,
            label: 'Pending',
            format: 'number'
          }}
        />

        <MetricCard
          data={{
            value: data.metrics.sponsoring.totalSponsors,
            label: 'Total Sponsors',
            format: 'number'
          }}
        />
      </DashboardGrid>

      <div class="mt-4 grid gap-4 md:grid-cols-2">
        <HorizontalBarChart title="Sponsor Status" items={sponsorStatusChartData}>
          {#snippet icon()}
            <Users class="h-4 w-4" />
          {/snippet}
        </HorizontalBarChart>

        {#if sponsorTierChartData.length > 0}
          <HorizontalBarChart title="Sponsors by Tier" items={sponsorTierChartData}>
            {#snippet icon()}
              <Target class="h-4 w-4" />
            {/snippet}
          </HorizontalBarChart>
        {:else}
          <HorizontalBarChart title="Revenue Sources" items={revenueChartItems} unit="EUR">
            {#snippet icon()}
              <DollarSign class="h-4 w-4" />
            {/snippet}
          </HorizontalBarChart>
        {/if}
      </div>
    </section>

    <!-- Budget Section -->
    <section>
      <h3 class="mb-4 text-lg font-semibold">Budget</h3>
      <DashboardGrid columns={4}>
        <MetricCard
          data={{
            value: data.metrics.budget.totalBudget,
            label: 'Total Budget',
            format: 'currency',
            unit: data.metrics.budget.currency
          }}
        >
          {#snippet icon()}
            <DollarSign class="h-4 w-4" />
          {/snippet}
        </MetricCard>

        <MetricCard
          data={{
            value: data.metrics.budget.spent,
            label: 'Spent',
            format: 'currency',
            unit: data.metrics.budget.currency
          }}
        />

        <MetricCard
          data={{
            value: data.metrics.budget.remaining,
            label: 'Remaining',
            format: 'currency',
            unit: data.metrics.budget.currency
          }}
        />

        <MetricCard
          data={{
            value: data.metrics.crm.totalContacts,
            label: 'Contacts (CRM)',
            format: 'number'
          }}
        >
          {#snippet icon()}
            <Users class="h-4 w-4" />
          {/snippet}
        </MetricCard>
      </DashboardGrid>

      <div class="mt-4 grid gap-4 md:grid-cols-2">
        <HorizontalBarChart title="Budget Usage" items={budgetUsageChartData} unit="EUR">
          {#snippet icon()}
            <DollarSign class="h-4 w-4" />
          {/snippet}
        </HorizontalBarChart>

        <HorizontalBarChart title="Revenue Sources" items={revenueChartItems} unit="EUR">
          {#snippet icon()}
            <DollarSign class="h-4 w-4" />
          {/snippet}
        </HorizontalBarChart>
      </div>
    </section>

    <!-- Last Updated -->
    {#if data.metrics.lastUpdated}
      <p class="text-right text-xs text-muted-foreground">
        Last updated: {new Intl.DateTimeFormat('en-US', {
          dateStyle: 'medium',
          timeStyle: 'short'
        }).format(data.metrics.lastUpdated)}
      </p>
    {/if}
  {/if}
</div>
