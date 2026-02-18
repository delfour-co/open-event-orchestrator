<script lang="ts">
import { invalidateAll } from '$app/navigation'
import { AdminSubNav } from '$lib/components/shared'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import type { NavItem } from '$lib/config'
import { DashboardGrid, HorizontalBarChart, MetricCard } from '$lib/features/reporting/ui'
import * as m from '$lib/paraglide/messages'
import { getLocale } from '$lib/paraglide/runtime'
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

// Navigation items with badges
const navItems = $derived<NavItem[]>([
  { href: `/admin/reporting/${data.edition.slug}`, label: m.reporting_dashboard_nav() },
  {
    href: `/admin/reporting/${data.edition.slug}/alerts`,
    label: m.reporting_alerts_nav(),
    badge: data.navBadges?.alerts ?? 0
  },
  {
    href: `/admin/reporting/${data.edition.slug}/reports`,
    label: m.reporting_reports_nav(),
    badge: data.navBadges?.reports ?? 0
  }
])

async function refreshDashboard() {
  isRefreshing = true
  await invalidateAll()
  isRefreshing = false
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
        {
          label: m.reporting_chart_status_accepted(),
          value: data.metrics.cfp.acceptedTalks,
          color: 'hsl(142 76% 36%)'
        },
        {
          label: m.reporting_chart_status_pending(),
          value: data.metrics.cfp.pendingReviews,
          color: 'hsl(48 96% 53%)'
        },
        {
          label: m.reporting_chart_status_rejected(),
          value: data.metrics.cfp.rejectedTalks,
          color: 'hsl(0 84% 60%)'
        }
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
          label: m.reporting_metric_confirmed(),
          value: data.metrics.sponsoring.confirmedSponsors,
          color: 'hsl(142 76% 36%)'
        },
        {
          label: m.reporting_metric_pending(),
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
          label: m.reporting_chart_ticket_revenue(),
          value: data.metrics.billing.totalRevenue,
          color: 'hsl(221 83% 53%)'
        },
        {
          label: m.reporting_metric_sponsorship_value(),
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
          label: m.reporting_chart_checked_in(),
          value: data.metrics.billing.ticketsCheckedIn,
          color: 'hsl(142 76% 36%)'
        },
        {
          label: m.reporting_chart_not_checked_in(),
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
          label: m.reporting_chart_scheduled(),
          value: data.metrics.planning.scheduledSessions,
          color: 'hsl(221 83% 53%)'
        },
        {
          label: m.reporting_metric_unscheduled(),
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
        {
          label: m.reporting_metric_spent(),
          value: data.metrics.budget.spent,
          color: 'hsl(221 83% 53%)'
        },
        {
          label: m.reporting_metric_remaining(),
          value: data.metrics.budget.remaining,
          color: 'hsl(142 76% 36%)'
        }
      ]
    : []
)
</script>

<svelte:head>
  <title>{m.reporting_dashboard_title({ name: data.edition.name })}</title>
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
      </div>
    </div>

    <Button variant="outline" onclick={refreshDashboard} disabled={isRefreshing}>
      {#if isRefreshing}
        <Loader2 class="mr-2 h-4 w-4 animate-spin" />
      {:else}
        <RefreshCw class="mr-2 h-4 w-4" />
      {/if}
      {m.reporting_refresh()}
    </Button>
  </div>

  <!-- Sub-navigation -->
  <AdminSubNav basePath="/admin/reporting/{data.edition.slug}" items={navItems} />

  <!-- Notifications Summary -->
  <Card.Root>
    <Card.Header class="pb-3">
      <div class="flex items-center justify-between">
        <Card.Title class="flex items-center gap-2 text-base font-medium">
          <Settings class="h-4 w-4" />
          {m.reporting_notification_settings()}
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
              <h4 class="font-medium group-hover:underline">{m.reporting_alert_thresholds()}</h4>
              <p class="text-sm text-muted-foreground">
                {#if data.notifications.alertThresholds.total === 0}
                  {m.reporting_no_alerts_configured()}
                {:else}
                  {m.reporting_alerts_active_total({ enabled: data.notifications.alertThresholds.enabled, total: data.notifications.alertThresholds.total })}
                  {#if data.notifications.alertThresholds.withEmail > 0}
                    <span class="ml-1 text-xs"
                      >{m.reporting_alerts_with_email({ count: data.notifications.alertThresholds.withEmail })}</span
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
              <h4 class="font-medium group-hover:underline">{m.reporting_automated_reports()}</h4>
              <p class="text-sm text-muted-foreground">
                {#if data.notifications.reportConfigs.total === 0}
                  {m.reporting_no_reports_configured()}
                {:else}
                  {m.reporting_reports_active_total({ enabled: data.notifications.reportConfigs.enabled, total: data.notifications.reportConfigs.total })}
                  {#if data.notifications.reportConfigs.enabled > 0}
                    <span class="ml-1 text-xs">
                      ({#if data.notifications.reportConfigs.daily > 0}
                        {m.reporting_reports_daily({ count: data.notifications.reportConfigs.daily })}
                      {/if}
                      {#if data.notifications.reportConfigs.weekly > 0}
                        {data.notifications.reportConfigs.daily > 0 ? ', ' : ''}{m.reporting_reports_weekly({ count: data.notifications.reportConfigs.weekly })}
                      {/if}
                      {#if data.notifications.reportConfigs.monthly > 0}
                        {data.notifications.reportConfigs.daily > 0 ||
                        data.notifications.reportConfigs.weekly > 0
                          ? ', '
                          : ''}{m.reporting_reports_monthly({ count: data.notifications.reportConfigs.monthly })}
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
        <h3 class="text-lg font-semibold">{m.reporting_no_data()}</h3>
        <p class="text-sm text-muted-foreground">
          {m.reporting_no_data_hint()}
        </p>
      </Card.Content>
    </Card.Root>
  {:else}
    <!-- Ticketing Section -->
    <section>
      <h3 class="mb-4 text-lg font-semibold">{m.reporting_section_ticketing()}</h3>
      <DashboardGrid columns={4}>
        <MetricCard
          data={{
            value: data.metrics.billing.totalRevenue,
            label: m.reporting_metric_revenue(),
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
            label: m.reporting_metric_tickets_sold(),
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
            label: m.reporting_metric_check_in_rate(),
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
            label: m.reporting_metric_orders(),
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
          <HorizontalBarChart title={m.reporting_chart_tickets_by_type()} items={ticketTypeChartData}>
            {#snippet icon()}
              <Ticket class="h-4 w-4" />
            {/snippet}
          </HorizontalBarChart>
        {:else}
          <Card.Root>
            <Card.Header class="pb-2">
              <Card.Title class="text-sm font-medium">{m.reporting_chart_tickets_by_type()}</Card.Title>
            </Card.Header>
            <Card.Content class="flex items-center justify-center py-8">
              <p class="text-sm text-muted-foreground">{m.reporting_chart_no_sales()}</p>
            </Card.Content>
          </Card.Root>
        {/if}

        <HorizontalBarChart title={m.reporting_chart_check_in_progress()} items={checkInChartData}>
          {#snippet icon()}
            <Check class="h-4 w-4" />
          {/snippet}
        </HorizontalBarChart>
      </div>
    </section>

    <!-- CFP Section -->
    <section>
      <h3 class="mb-4 text-lg font-semibold">{m.reporting_section_cfp()}</h3>
      <DashboardGrid columns={4}>
        <MetricCard
          data={{
            value: data.metrics.cfp.totalSubmissions,
            label: m.reporting_metric_submissions(),
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
            label: m.reporting_metric_pending_reviews(),
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
            label: m.reporting_metric_accepted(),
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
            label: m.reporting_metric_speakers(),
            format: 'number'
          }}
        >
          {#snippet icon()}
            <Users class="h-4 w-4" />
          {/snippet}
        </MetricCard>
      </DashboardGrid>

      <div class="mt-4 grid gap-4 md:grid-cols-3">
        <HorizontalBarChart title={m.reporting_chart_submission_status()} items={cfpStatusChartData}>
          {#snippet icon()}
            <FileText class="h-4 w-4" />
          {/snippet}
        </HorizontalBarChart>

        {#if talkCategoryChartData.length > 0}
          <HorizontalBarChart title={m.reporting_chart_talks_by_category()} items={talkCategoryChartData}>
            {#snippet icon()}
              <Target class="h-4 w-4" />
            {/snippet}
          </HorizontalBarChart>
        {:else}
          <Card.Root>
            <Card.Header class="pb-2">
              <Card.Title class="text-sm font-medium">{m.reporting_chart_talks_by_category()}</Card.Title>
            </Card.Header>
            <Card.Content class="flex items-center justify-center py-8">
              <p class="text-sm text-muted-foreground">{m.reporting_chart_no_categories()}</p>
            </Card.Content>
          </Card.Root>
        {/if}

        {#if talkFormatChartData.length > 0}
          <HorizontalBarChart title={m.reporting_chart_talks_by_format()} items={talkFormatChartData}>
            {#snippet icon()}
              <Calendar class="h-4 w-4" />
            {/snippet}
          </HorizontalBarChart>
        {:else}
          <Card.Root>
            <Card.Header class="pb-2">
              <Card.Title class="text-sm font-medium">{m.reporting_chart_talks_by_format()}</Card.Title>
            </Card.Header>
            <Card.Content class="flex items-center justify-center py-8">
              <p class="text-sm text-muted-foreground">{m.reporting_chart_no_formats()}</p>
            </Card.Content>
          </Card.Root>
        {/if}
      </div>
    </section>

    <!-- Planning Section -->
    <section>
      <h3 class="mb-4 text-lg font-semibold">{m.reporting_section_planning()}</h3>
      <DashboardGrid columns={4}>
        <MetricCard
          data={{
            value: data.metrics.planning.totalSessions,
            label: m.reporting_metric_total_sessions(),
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
            label: m.reporting_metric_tracks(),
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
            label: m.reporting_metric_rooms(),
            format: 'number'
          }}
        />

        <MetricCard
          data={{
            value: data.metrics.planning.unscheduledSessions,
            label: m.reporting_metric_unscheduled(),
            format: 'number'
          }}
        />
      </DashboardGrid>

      <div class="mt-4 grid gap-4 md:grid-cols-2">
        <HorizontalBarChart title={m.reporting_chart_scheduling_progress()} items={sessionsScheduledChartData}>
          {#snippet icon()}
            <Calendar class="h-4 w-4" />
          {/snippet}
        </HorizontalBarChart>

        {#if sessionTrackChartData.length > 0}
          <HorizontalBarChart title={m.reporting_chart_sessions_by_track()} items={sessionTrackChartData}>
            {#snippet icon()}
              <Target class="h-4 w-4" />
            {/snippet}
          </HorizontalBarChart>
        {:else}
          <Card.Root>
            <Card.Header class="pb-2">
              <Card.Title class="text-sm font-medium">{m.reporting_chart_sessions_by_track()}</Card.Title>
            </Card.Header>
            <Card.Content class="flex items-center justify-center py-8">
              <p class="text-sm text-muted-foreground">{m.reporting_chart_no_tracks()}</p>
            </Card.Content>
          </Card.Root>
        {/if}
      </div>
    </section>

    <!-- Sponsoring Section -->
    <section>
      <h3 class="mb-4 text-lg font-semibold">{m.reporting_section_sponsoring()}</h3>
      <DashboardGrid columns={4}>
        <MetricCard
          data={{
            value: data.metrics.sponsoring.totalSponsorshipValue,
            label: m.reporting_metric_sponsorship_value(),
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
            label: m.reporting_metric_confirmed(),
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
            label: m.reporting_metric_pending(),
            format: 'number'
          }}
        />

        <MetricCard
          data={{
            value: data.metrics.sponsoring.totalSponsors,
            label: m.reporting_metric_total_sponsors(),
            format: 'number'
          }}
        />
      </DashboardGrid>

      <div class="mt-4 grid gap-4 md:grid-cols-2">
        <HorizontalBarChart title={m.reporting_chart_sponsor_status()} items={sponsorStatusChartData}>
          {#snippet icon()}
            <Users class="h-4 w-4" />
          {/snippet}
        </HorizontalBarChart>

        {#if sponsorTierChartData.length > 0}
          <HorizontalBarChart title={m.reporting_chart_sponsors_by_tier()} items={sponsorTierChartData}>
            {#snippet icon()}
              <Target class="h-4 w-4" />
            {/snippet}
          </HorizontalBarChart>
        {:else}
          <HorizontalBarChart title={m.reporting_chart_revenue_sources()} items={revenueChartItems} unit="EUR">
            {#snippet icon()}
              <DollarSign class="h-4 w-4" />
            {/snippet}
          </HorizontalBarChart>
        {/if}
      </div>
    </section>

    <!-- Budget Section -->
    <section>
      <h3 class="mb-4 text-lg font-semibold">{m.reporting_section_budget()}</h3>
      <DashboardGrid columns={4}>
        <MetricCard
          data={{
            value: data.metrics.budget.totalBudget,
            label: m.reporting_metric_total_budget(),
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
            label: m.reporting_metric_spent(),
            format: 'currency',
            unit: data.metrics.budget.currency
          }}
        />

        <MetricCard
          data={{
            value: data.metrics.budget.remaining,
            label: m.reporting_metric_remaining(),
            format: 'currency',
            unit: data.metrics.budget.currency
          }}
        />

        <MetricCard
          data={{
            value: data.metrics.crm.totalContacts,
            label: m.reporting_metric_contacts_crm(),
            format: 'number'
          }}
        >
          {#snippet icon()}
            <Users class="h-4 w-4" />
          {/snippet}
        </MetricCard>
      </DashboardGrid>

      <div class="mt-4 grid gap-4 md:grid-cols-2">
        <HorizontalBarChart title={m.reporting_chart_budget_usage()} items={budgetUsageChartData} unit="EUR">
          {#snippet icon()}
            <DollarSign class="h-4 w-4" />
          {/snippet}
        </HorizontalBarChart>

        <HorizontalBarChart title={m.reporting_chart_revenue_sources()} items={revenueChartItems} unit="EUR">
          {#snippet icon()}
            <DollarSign class="h-4 w-4" />
          {/snippet}
        </HorizontalBarChart>
      </div>
    </section>

    <!-- Last Updated -->
    {#if data.metrics.lastUpdated}
      {@const locale = getLocale() === 'fr' ? 'fr-FR' : 'en-US'}
      <p class="text-right text-xs text-muted-foreground">
        {m.reporting_last_updated({ date: new Intl.DateTimeFormat(locale, {
          dateStyle: 'medium',
          timeStyle: 'short'
        }).format(data.metrics.lastUpdated) })}
      </p>
    {/if}
  {/if}
</div>
