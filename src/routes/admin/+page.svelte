<script lang="ts">
import { goto } from '$app/navigation'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { QuickSetupWizard } from '$lib/features/core/ui'
import * as m from '$lib/paraglide/messages'
import { getLocale } from '$lib/paraglide/runtime'
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  FileText,
  Handshake,
  Rocket,
  Send,
  ShoppingCart,
  Ticket,
  TrendingUp,
  Users,
  Wallet,
  XCircle
} from 'lucide-svelte'
import type { PageData } from './$types'

interface Props {
  data: PageData
}

const { data }: Props = $props()

// Extract initial value to avoid state_referenced_locally warning
const initSelectedEditionId = data.selectedEditionId

let showWizard = $state(false)

const handleWizardSuccess = (editionSlug: string) => {
  goto(`/admin/editions/${editionSlug}/settings`)
}

let selectedEditionId = $state(initSelectedEditionId)

function handleEditionChange(e: Event) {
  const value = (e.target as HTMLSelectElement).value
  selectedEditionId = value
  if (value) {
    goto(`/admin?edition=${value}`)
  } else {
    goto('/admin')
  }
}

const formatDate = (date: Date) => {
  const locale = getLocale() === 'fr' ? 'fr-FR' : 'en-US'
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date)
}

const formatTimeAgo = (date: Date) => {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 60) return m.time_minutes_ago({ count: diffMins })
  if (diffHours < 24) return m.time_hours_ago({ count: diffHours })
  return m.time_days_ago({ count: diffDays })
}

const formatPrice = (priceInCents: number, currency: string) => {
  if (priceInCents === 0) return m.billing_free()
  const locale = getLocale() === 'fr' ? 'fr-FR' : 'en-US'
  const amount = priceInCents / 100
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency
  }).format(amount)
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'submitted':
      return 'text-blue-600 dark:text-blue-400'
    case 'accepted':
      return 'text-green-600 dark:text-green-400'
    case 'rejected':
      return 'text-red-600 dark:text-red-400'
    case 'under_review':
      return 'text-yellow-600 dark:text-yellow-400'
    default:
      return 'text-gray-600 dark:text-gray-400'
  }
}

const formatBudgetAmount = (amount: number, currency: string) => {
  const locale = getLocale() === 'fr' ? 'fr-FR' : 'en-US'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency
  }).format(amount)
}

const getOrderStatusColor = (status: string) => {
  switch (status) {
    case 'paid':
      return 'text-green-600 dark:text-green-400'
    case 'pending':
      return 'text-yellow-600 dark:text-yellow-400'
    case 'cancelled':
      return 'text-red-600 dark:text-red-400'
    case 'refunded':
      return 'text-orange-600 dark:text-orange-400'
    default:
      return 'text-gray-600 dark:text-gray-400'
  }
}

const getSubmissionStatusLabel = (status: string) => {
  switch (status) {
    case 'submitted':
      return m.cfp_status_submitted()
    case 'accepted':
      return m.cfp_status_accepted()
    case 'rejected':
      return m.cfp_status_rejected()
    case 'under_review':
      return m.cfp_status_under_review()
    default:
      return status
  }
}

const getOrderStatusLabel = (status: string) => {
  switch (status) {
    case 'paid':
      return m.billing_order_status_paid()
    case 'pending':
      return m.billing_order_status_pending()
    case 'cancelled':
      return m.billing_order_status_cancelled()
    case 'refunded':
      return m.billing_order_status_refunded()
    default:
      return status
  }
}
</script>

<svelte:head>
  <title>{m.admin_dashboard_title()}</title>
</svelte:head>

<!-- Quick Setup Wizard -->
{#if showWizard}
  <QuickSetupWizard
    organizations={data.organizations}
    onClose={() => (showWizard = false)}
    onSuccess={handleWizardSuccess}
  />
{/if}

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-3xl font-bold tracking-tight">{m.admin_dashboard_heading()}</h2>
      <p class="text-muted-foreground">
        {#if data.selectedEdition}
          {m.admin_dashboard_stats_for({ name: data.selectedEdition.name })}
        {:else}
          {m.admin_dashboard_overview()}
        {/if}
      </p>
    </div>

    <div class="flex items-center gap-4">
      <!-- Quick Setup Button -->
      <Button onclick={() => (showWizard = true)} data-testid="quick-setup-button">
        <Rocket class="mr-2 h-4 w-4" />
        {m.admin_dashboard_quick_setup()}
      </Button>

      <!-- Edition Filter -->
      {#if data.editions.length > 0}
        <div class="flex items-center gap-2">
          <label for="edition-filter" class="text-sm text-muted-foreground">{m.admin_dashboard_filter_edition()}</label>
          <select
            id="edition-filter"
            class="rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={selectedEditionId}
            onchange={handleEditionChange}
          >
            <option value="">{m.admin_dashboard_all_editions()}</option>
            {#each data.editions.filter((e) => e.status !== 'archived') as edition}
              <option value={edition.id}>{edition.name}</option>
            {/each}
            {#if data.editions.some((e) => e.status === 'archived')}
              <option disabled>── {m.admin_dashboard_archived()} ──</option>
              {#each data.editions.filter((e) => e.status === 'archived') as edition}
                <option value={edition.id}>{edition.name}</option>
              {/each}
            {/if}
          </select>
        </div>
      {/if}
    </div>
  </div>

  <!-- CFP Stats -->
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold">{m.admin_dashboard_cfp_title()}</h3>
      {#if data.selectedEdition}
        <a
          href="/admin/cfp/{data.selectedEdition.slug}/submissions"
          class="text-sm text-primary hover:underline"
        >
          {m.admin_dashboard_manage_cfp()}
        </a>
      {/if}
    </div>
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
    <Card.Root>
      <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
        <Card.Title class="text-sm font-medium">{m.admin_dashboard_total_talks()}</Card.Title>
        <FileText class="h-4 w-4 text-muted-foreground" />
      </Card.Header>
      <Card.Content>
        <div class="text-2xl font-bold">{data.stats.totalTalks}</div>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
        <Card.Title class="text-sm font-medium">{m.admin_dashboard_submitted()}</Card.Title>
        <Send class="h-4 w-4 text-blue-500" />
      </Card.Header>
      <Card.Content>
        <div class="text-2xl font-bold">{data.stats.submittedTalks}</div>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
        <Card.Title class="text-sm font-medium">{m.admin_dashboard_under_review()}</Card.Title>
        <Clock class="h-4 w-4 text-yellow-500" />
      </Card.Header>
      <Card.Content>
        <div class="text-2xl font-bold">{data.stats.underReviewTalks}</div>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
        <Card.Title class="text-sm font-medium">{m.admin_dashboard_accepted()}</Card.Title>
        <CheckCircle class="h-4 w-4 text-green-500" />
      </Card.Header>
      <Card.Content>
        <div class="text-2xl font-bold">{data.stats.acceptedTalks}</div>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
        <Card.Title class="text-sm font-medium">{m.admin_dashboard_rejected()}</Card.Title>
        <XCircle class="h-4 w-4 text-red-500" />
      </Card.Header>
      <Card.Content>
        <div class="text-2xl font-bold">{data.stats.rejectedTalks}</div>
      </Card.Content>
    </Card.Root>
    </div>
  </div>

  <!-- Billing Stats -->
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold">{m.admin_dashboard_billing_title()}</h3>
      {#if data.selectedEdition}
        <a
          href="/admin/billing/{data.selectedEdition.slug}"
          class="text-sm text-primary hover:underline"
        >
          {m.admin_dashboard_manage_billing()}
        </a>
      {/if}
    </div>
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card.Root>
        <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
          <Card.Title class="text-sm font-medium">{m.admin_dashboard_revenue()}</Card.Title>
          <DollarSign class="h-4 w-4 text-muted-foreground" />
        </Card.Header>
        <Card.Content>
          <div class="text-2xl font-bold">
            {formatPrice(data.billingStats.totalRevenue, 'EUR')}
          </div>
          <p class="text-xs text-muted-foreground">
            {m.admin_dashboard_paid_orders({ count: data.billingStats.paidOrders })}
          </p>
        </Card.Content>
      </Card.Root>

      <Card.Root>
        <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
          <Card.Title class="text-sm font-medium">{m.admin_dashboard_tickets_sold()}</Card.Title>
          <Ticket class="h-4 w-4 text-muted-foreground" />
        </Card.Header>
        <Card.Content>
          <div class="text-2xl font-bold">{data.billingStats.ticketsSold}</div>
          <p class="text-xs text-muted-foreground">
            {m.admin_dashboard_checked_in({ count: data.billingStats.ticketsCheckedIn, rate: data.billingStats.checkInRate })}
          </p>
        </Card.Content>
      </Card.Root>

      <Card.Root>
        <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
          <Card.Title class="text-sm font-medium">{m.admin_dashboard_orders()}</Card.Title>
          <ShoppingCart class="h-4 w-4 text-muted-foreground" />
        </Card.Header>
        <Card.Content>
          <div class="text-2xl font-bold">{data.billingStats.totalOrders}</div>
          <p class="text-xs text-muted-foreground">
            {m.admin_dashboard_pending_cancelled({ pending: data.billingStats.pendingOrders, cancelled: data.billingStats.cancelledOrders })}
          </p>
        </Card.Content>
      </Card.Root>

      <Card.Root>
        <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
          <Card.Title class="text-sm font-medium">{m.admin_dashboard_checkin_rate()}</Card.Title>
          <Users class="h-4 w-4 text-muted-foreground" />
        </Card.Header>
        <Card.Content>
          <div class="text-2xl font-bold">{data.billingStats.checkInRate}%</div>
          <div class="mt-2 h-2 w-full rounded-full bg-muted">
            <div
              class="h-2 rounded-full bg-green-500 transition-all"
              style="width: {data.billingStats.checkInRate}%"
            ></div>
          </div>
        </Card.Content>
      </Card.Root>
    </div>
  </div>

  <!-- Budget Stats -->
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold">{m.admin_dashboard_budget_title()}</h3>
      {#if data.selectedEdition}
        <a
          href="/admin/budget/{data.selectedEdition.slug}"
          class="text-sm text-primary hover:underline"
        >
          {m.admin_dashboard_manage_budget()}
        </a>
      {/if}
    </div>
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card.Root>
        <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
          <Card.Title class="text-sm font-medium">{m.admin_dashboard_total_budget()}</Card.Title>
          <Wallet class="h-4 w-4 text-muted-foreground" />
        </Card.Header>
        <Card.Content>
          <div class="text-2xl font-bold">
            {formatBudgetAmount(data.budgetStats.totalBudget, data.budgetStats.currency)}
          </div>
          <p class="text-xs text-muted-foreground">
            {m.admin_dashboard_used_percent({ percent: data.budgetStats.usagePercent })}
          </p>
          <div class="mt-2 h-2 w-full rounded-full bg-muted">
            <div
              class="h-2 rounded-full transition-all {data.budgetStats.usagePercent > 90 ? 'bg-red-500' : data.budgetStats.usagePercent > 70 ? 'bg-yellow-500' : 'bg-blue-500'}"
              style="width: {data.budgetStats.usagePercent}%"
            ></div>
          </div>
        </Card.Content>
      </Card.Root>

      <Card.Root>
        <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
          <Card.Title class="text-sm font-medium">{m.admin_dashboard_expenses()}</Card.Title>
          <ArrowDownCircle class="h-4 w-4 text-red-500" />
        </Card.Header>
        <Card.Content>
          <div class="text-2xl font-bold">
            {formatBudgetAmount(data.budgetStats.expenses, data.budgetStats.currency)}
          </div>
          <p class="text-xs text-muted-foreground">
            {m.admin_dashboard_transactions({ count: data.budgetStats.transactionsCount })}
          </p>
        </Card.Content>
      </Card.Root>

      <Card.Root>
        <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
          <Card.Title class="text-sm font-medium">{m.admin_dashboard_income()}</Card.Title>
          <ArrowUpCircle class="h-4 w-4 text-green-500" />
        </Card.Header>
        <Card.Content>
          <div class="text-2xl font-bold">
            {formatBudgetAmount(data.budgetStats.income, data.budgetStats.currency)}
          </div>
          <p class="text-xs text-muted-foreground">
            {m.admin_dashboard_categories({ count: data.budgetStats.categoriesCount })}
          </p>
        </Card.Content>
      </Card.Root>

      <Card.Root>
        <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
          <Card.Title class="text-sm font-medium">{m.admin_dashboard_balance()}</Card.Title>
          <TrendingUp class="h-4 w-4 text-muted-foreground" />
        </Card.Header>
        <Card.Content>
          <div class="text-2xl font-bold {data.budgetStats.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">
            {formatBudgetAmount(data.budgetStats.balance, data.budgetStats.currency)}
          </div>
          <p class="text-xs text-muted-foreground">
            {m.admin_dashboard_balance_formula()}
          </p>
        </Card.Content>
      </Card.Root>
    </div>
  </div>

  <!-- Sponsoring Stats -->
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold">{m.admin_dashboard_sponsoring_title()}</h3>
      {#if data.selectedEdition}
        <a
          href="/admin/sponsoring/{data.selectedEdition.slug}"
          class="text-sm text-primary hover:underline"
        >
          {m.admin_dashboard_manage_sponsors()}
        </a>
      {/if}
    </div>
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card.Root>
        <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
          <Card.Title class="text-sm font-medium">{m.admin_dashboard_total_sponsors()}</Card.Title>
          <Building2 class="h-4 w-4 text-muted-foreground" />
        </Card.Header>
        <Card.Content>
          <div class="text-2xl font-bold">{data.sponsoringStats.totalSponsors}</div>
          <p class="text-xs text-muted-foreground">
            {m.admin_dashboard_confirmed({ count: data.sponsoringStats.confirmedSponsors })}
          </p>
        </Card.Content>
      </Card.Root>

      <Card.Root>
        <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
          <Card.Title class="text-sm font-medium">{m.admin_dashboard_sponsoring_revenue()}</Card.Title>
          <Handshake class="h-4 w-4 text-green-500" />
        </Card.Header>
        <Card.Content>
          <div class="text-2xl font-bold">
            {formatBudgetAmount(data.sponsoringStats.revenue, data.sponsoringStats.currency)}
          </div>
          <p class="text-xs text-muted-foreground">
            {m.admin_dashboard_paid({ count: data.sponsoringStats.paidSponsors })}
          </p>
        </Card.Content>
      </Card.Root>

      <Card.Root>
        <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
          <Card.Title class="text-sm font-medium">{m.admin_dashboard_pipeline()}</Card.Title>
          <TrendingUp class="h-4 w-4 text-blue-500" />
        </Card.Header>
        <Card.Content>
          <div class="text-2xl font-bold">
            {formatBudgetAmount(data.sponsoringStats.pipelineValue, data.sponsoringStats.currency)}
          </div>
          <p class="text-xs text-muted-foreground">
            {m.admin_dashboard_in_progress({ count: data.sponsoringStats.contacted + data.sponsoringStats.negotiating })}
          </p>
        </Card.Content>
      </Card.Root>

      <Card.Root>
        <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
          <Card.Title class="text-sm font-medium">{m.admin_dashboard_pipeline_status()}</Card.Title>
          <Users class="h-4 w-4 text-muted-foreground" />
        </Card.Header>
        <Card.Content>
          <div class="space-y-1">
            <div class="flex justify-between text-xs">
              <span class="text-muted-foreground">{m.admin_dashboard_prospects()}</span>
              <span class="font-medium">{data.sponsoringStats.prospects}</span>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-muted-foreground">{m.admin_dashboard_contacted()}</span>
              <span class="font-medium">{data.sponsoringStats.contacted}</span>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-muted-foreground">{m.admin_dashboard_negotiating()}</span>
              <span class="font-medium">{data.sponsoringStats.negotiating}</span>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-muted-foreground">{m.admin_dashboard_declined()}</span>
              <span class="font-medium">{data.sponsoringStats.declined}</span>
            </div>
          </div>
        </Card.Content>
      </Card.Root>
    </div>
  </div>

  <!-- Recent Activity -->
  <div class="grid gap-4 md:grid-cols-3">
    <Card.Root>
      <Card.Header>
        <Card.Title>{m.admin_dashboard_recent_submissions()}</Card.Title>
        <Card.Description>{m.admin_dashboard_latest_cfp()}</Card.Description>
      </Card.Header>
      <Card.Content>
        {#if data.recentSubmissions.length === 0}
          <p class="text-sm text-muted-foreground">{m.admin_dashboard_no_submissions()}</p>
        {:else}
          <div class="space-y-3">
            {#each data.recentSubmissions as submission}
              <div class="flex items-center justify-between">
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-medium">{submission.title}</p>
                  <p class="text-xs text-muted-foreground">
                    {m.admin_dashboard_by_speaker({ name: submission.speakerName, time: formatTimeAgo(submission.createdAt) })}
                  </p>
                </div>
                <span class="ml-2 text-xs font-medium {getStatusColor(submission.status)}">
                  {getSubmissionStatusLabel(submission.status)}
                </span>
              </div>
            {/each}
          </div>
        {/if}
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Header>
        <Card.Title>{m.admin_dashboard_recent_orders()}</Card.Title>
        <Card.Description>{m.admin_dashboard_latest_orders()}</Card.Description>
      </Card.Header>
      <Card.Content>
        {#if data.recentOrders.length === 0}
          <p class="text-sm text-muted-foreground">{m.admin_dashboard_no_orders()}</p>
        {:else}
          <div class="space-y-3">
            {#each data.recentOrders as order}
              <div class="flex items-center justify-between">
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-medium">
                    {order.firstName} {order.lastName}
                  </p>
                  <p class="text-xs text-muted-foreground">
                    {order.orderNumber} - {formatPrice(order.totalAmount, order.currency)}
                  </p>
                </div>
                <span class="ml-2 text-xs font-medium {getOrderStatusColor(order.status)}">
                  {getOrderStatusLabel(order.status)}
                </span>
              </div>
            {/each}
          </div>
        {/if}
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Header>
        <Card.Title>{m.admin_dashboard_upcoming_events()}</Card.Title>
        <Card.Description>{m.admin_dashboard_next_editions()}</Card.Description>
      </Card.Header>
      <Card.Content>
        {#if data.upcomingEditions.length === 0}
          <p class="text-sm text-muted-foreground">{m.admin_dashboard_no_upcoming()}</p>
        {:else}
          <div class="space-y-3">
            {#each data.upcomingEditions as edition}
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <Calendar class="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p class="text-sm font-medium">{edition.name}</p>
                    <p class="text-xs text-muted-foreground">{formatDate(edition.startDate)}</p>
                  </div>
                </div>
                <a
                  href="/admin/cfp/{edition.slug}/submissions"
                  class="text-xs text-primary hover:underline"
                >
                  {m.admin_dashboard_view_cfp()}
                </a>
              </div>
            {/each}
          </div>
        {/if}
      </Card.Content>
    </Card.Root>
  </div>
</div>
