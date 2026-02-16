<script lang="ts">
import { goto } from '$app/navigation'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { QuickSetupWizard } from '$lib/features/core/ui'
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
  return new Intl.DateTimeFormat('en-US', {
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

  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

const formatPrice = (priceInCents: number, currency: string) => {
  if (priceInCents === 0) return 'Free'
  const amount = priceInCents / 100
  return new Intl.NumberFormat('fr-FR', {
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
  return new Intl.NumberFormat('fr-FR', {
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
</script>

<svelte:head>
  <title>Dashboard - Open Event Orchestrator</title>
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
      <h2 class="text-3xl font-bold tracking-tight">Dashboard</h2>
      <p class="text-muted-foreground">
        {#if data.selectedEdition}
          Stats for <strong>{data.selectedEdition.name}</strong>
        {:else}
          Overview of all your events
        {/if}
      </p>
    </div>

    <div class="flex items-center gap-4">
      <!-- Quick Setup Button -->
      <Button onclick={() => (showWizard = true)} data-testid="quick-setup-button">
        <Rocket class="mr-2 h-4 w-4" />
        Quick Setup
      </Button>

      <!-- Edition Filter -->
      {#if data.editions.length > 0}
        <div class="flex items-center gap-2">
          <label for="edition-filter" class="text-sm text-muted-foreground">Filter by edition:</label>
          <select
            id="edition-filter"
            class="rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={selectedEditionId}
            onchange={handleEditionChange}
          >
            <option value="">All editions</option>
            {#each data.editions.filter((e) => e.status !== 'archived') as edition}
              <option value={edition.id}>{edition.name}</option>
            {/each}
            {#if data.editions.some((e) => e.status === 'archived')}
              <option disabled>── Archived ──</option>
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
      <h3 class="text-lg font-semibold">Call for Papers</h3>
      {#if data.selectedEdition}
        <a
          href="/admin/cfp/{data.selectedEdition.slug}/submissions"
          class="text-sm text-primary hover:underline"
        >
          Manage CFP
        </a>
      {/if}
    </div>
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
    <Card.Root>
      <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
        <Card.Title class="text-sm font-medium">Total Talks</Card.Title>
        <FileText class="h-4 w-4 text-muted-foreground" />
      </Card.Header>
      <Card.Content>
        <div class="text-2xl font-bold">{data.stats.totalTalks}</div>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
        <Card.Title class="text-sm font-medium">Submitted</Card.Title>
        <Send class="h-4 w-4 text-blue-500" />
      </Card.Header>
      <Card.Content>
        <div class="text-2xl font-bold">{data.stats.submittedTalks}</div>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
        <Card.Title class="text-sm font-medium">Under Review</Card.Title>
        <Clock class="h-4 w-4 text-yellow-500" />
      </Card.Header>
      <Card.Content>
        <div class="text-2xl font-bold">{data.stats.underReviewTalks}</div>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
        <Card.Title class="text-sm font-medium">Accepted</Card.Title>
        <CheckCircle class="h-4 w-4 text-green-500" />
      </Card.Header>
      <Card.Content>
        <div class="text-2xl font-bold">{data.stats.acceptedTalks}</div>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
        <Card.Title class="text-sm font-medium">Rejected</Card.Title>
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
      <h3 class="text-lg font-semibold">Billing</h3>
      {#if data.selectedEdition}
        <a
          href="/admin/billing/{data.selectedEdition.slug}"
          class="text-sm text-primary hover:underline"
        >
          Manage Billing
        </a>
      {/if}
    </div>
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card.Root>
        <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
          <Card.Title class="text-sm font-medium">Revenue</Card.Title>
          <DollarSign class="h-4 w-4 text-muted-foreground" />
        </Card.Header>
        <Card.Content>
          <div class="text-2xl font-bold">
            {formatPrice(data.billingStats.totalRevenue, 'EUR')}
          </div>
          <p class="text-xs text-muted-foreground">
            {data.billingStats.paidOrders} paid order{data.billingStats.paidOrders !== 1
              ? 's'
              : ''}
          </p>
        </Card.Content>
      </Card.Root>

      <Card.Root>
        <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
          <Card.Title class="text-sm font-medium">Tickets Sold</Card.Title>
          <Ticket class="h-4 w-4 text-muted-foreground" />
        </Card.Header>
        <Card.Content>
          <div class="text-2xl font-bold">{data.billingStats.ticketsSold}</div>
          <p class="text-xs text-muted-foreground">
            {data.billingStats.ticketsCheckedIn} checked in ({data.billingStats.checkInRate}%)
          </p>
        </Card.Content>
      </Card.Root>

      <Card.Root>
        <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
          <Card.Title class="text-sm font-medium">Orders</Card.Title>
          <ShoppingCart class="h-4 w-4 text-muted-foreground" />
        </Card.Header>
        <Card.Content>
          <div class="text-2xl font-bold">{data.billingStats.totalOrders}</div>
          <p class="text-xs text-muted-foreground">
            {data.billingStats.pendingOrders} pending, {data.billingStats.cancelledOrders} cancelled
          </p>
        </Card.Content>
      </Card.Root>

      <Card.Root>
        <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
          <Card.Title class="text-sm font-medium">Check-in Rate</Card.Title>
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
      <h3 class="text-lg font-semibold">Budget</h3>
      {#if data.selectedEdition}
        <a
          href="/admin/budget/{data.selectedEdition.slug}"
          class="text-sm text-primary hover:underline"
        >
          Manage Budget
        </a>
      {/if}
    </div>
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card.Root>
        <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
          <Card.Title class="text-sm font-medium">Total Budget</Card.Title>
          <Wallet class="h-4 w-4 text-muted-foreground" />
        </Card.Header>
        <Card.Content>
          <div class="text-2xl font-bold">
            {formatBudgetAmount(data.budgetStats.totalBudget, data.budgetStats.currency)}
          </div>
          <p class="text-xs text-muted-foreground">
            {data.budgetStats.usagePercent}% used
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
          <Card.Title class="text-sm font-medium">Expenses</Card.Title>
          <ArrowDownCircle class="h-4 w-4 text-red-500" />
        </Card.Header>
        <Card.Content>
          <div class="text-2xl font-bold">
            {formatBudgetAmount(data.budgetStats.expenses, data.budgetStats.currency)}
          </div>
          <p class="text-xs text-muted-foreground">
            {data.budgetStats.transactionsCount} transaction{data.budgetStats.transactionsCount !== 1 ? 's' : ''}
          </p>
        </Card.Content>
      </Card.Root>

      <Card.Root>
        <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
          <Card.Title class="text-sm font-medium">Income</Card.Title>
          <ArrowUpCircle class="h-4 w-4 text-green-500" />
        </Card.Header>
        <Card.Content>
          <div class="text-2xl font-bold">
            {formatBudgetAmount(data.budgetStats.income, data.budgetStats.currency)}
          </div>
          <p class="text-xs text-muted-foreground">
            {data.budgetStats.categoriesCount} categor{data.budgetStats.categoriesCount !== 1 ? 'ies' : 'y'}
          </p>
        </Card.Content>
      </Card.Root>

      <Card.Root>
        <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
          <Card.Title class="text-sm font-medium">Balance</Card.Title>
          <TrendingUp class="h-4 w-4 text-muted-foreground" />
        </Card.Header>
        <Card.Content>
          <div class="text-2xl font-bold {data.budgetStats.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">
            {formatBudgetAmount(data.budgetStats.balance, data.budgetStats.currency)}
          </div>
          <p class="text-xs text-muted-foreground">
            budget - expenses + income
          </p>
        </Card.Content>
      </Card.Root>
    </div>
  </div>

  <!-- Sponsoring Stats -->
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold">Sponsoring</h3>
      {#if data.selectedEdition}
        <a
          href="/admin/sponsoring/{data.selectedEdition.slug}"
          class="text-sm text-primary hover:underline"
        >
          Manage Sponsors
        </a>
      {/if}
    </div>
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card.Root>
        <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
          <Card.Title class="text-sm font-medium">Total Sponsors</Card.Title>
          <Building2 class="h-4 w-4 text-muted-foreground" />
        </Card.Header>
        <Card.Content>
          <div class="text-2xl font-bold">{data.sponsoringStats.totalSponsors}</div>
          <p class="text-xs text-muted-foreground">
            {data.sponsoringStats.confirmedSponsors} confirmed
          </p>
        </Card.Content>
      </Card.Root>

      <Card.Root>
        <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
          <Card.Title class="text-sm font-medium">Revenue</Card.Title>
          <Handshake class="h-4 w-4 text-green-500" />
        </Card.Header>
        <Card.Content>
          <div class="text-2xl font-bold">
            {formatBudgetAmount(data.sponsoringStats.revenue, data.sponsoringStats.currency)}
          </div>
          <p class="text-xs text-muted-foreground">
            {data.sponsoringStats.paidSponsors} paid
          </p>
        </Card.Content>
      </Card.Root>

      <Card.Root>
        <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
          <Card.Title class="text-sm font-medium">Pipeline</Card.Title>
          <TrendingUp class="h-4 w-4 text-blue-500" />
        </Card.Header>
        <Card.Content>
          <div class="text-2xl font-bold">
            {formatBudgetAmount(data.sponsoringStats.pipelineValue, data.sponsoringStats.currency)}
          </div>
          <p class="text-xs text-muted-foreground">
            {data.sponsoringStats.contacted + data.sponsoringStats.negotiating} in progress
          </p>
        </Card.Content>
      </Card.Root>

      <Card.Root>
        <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
          <Card.Title class="text-sm font-medium">Pipeline Status</Card.Title>
          <Users class="h-4 w-4 text-muted-foreground" />
        </Card.Header>
        <Card.Content>
          <div class="space-y-1">
            <div class="flex justify-between text-xs">
              <span class="text-muted-foreground">Prospects</span>
              <span class="font-medium">{data.sponsoringStats.prospects}</span>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-muted-foreground">Contacted</span>
              <span class="font-medium">{data.sponsoringStats.contacted}</span>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-muted-foreground">Negotiating</span>
              <span class="font-medium">{data.sponsoringStats.negotiating}</span>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-muted-foreground">Declined</span>
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
        <Card.Title>Recent Submissions</Card.Title>
        <Card.Description>Latest CFP submissions</Card.Description>
      </Card.Header>
      <Card.Content>
        {#if data.recentSubmissions.length === 0}
          <p class="text-sm text-muted-foreground">No submissions yet.</p>
        {:else}
          <div class="space-y-3">
            {#each data.recentSubmissions as submission}
              <div class="flex items-center justify-between">
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-medium">{submission.title}</p>
                  <p class="text-xs text-muted-foreground">
                    by {submission.speakerName} - {formatTimeAgo(submission.createdAt)}
                  </p>
                </div>
                <span class="ml-2 text-xs font-medium {getStatusColor(submission.status)}">
                  {submission.status}
                </span>
              </div>
            {/each}
          </div>
        {/if}
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Header>
        <Card.Title>Recent Orders</Card.Title>
        <Card.Description>Latest ticket orders</Card.Description>
      </Card.Header>
      <Card.Content>
        {#if data.recentOrders.length === 0}
          <p class="text-sm text-muted-foreground">No orders yet.</p>
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
                  {order.status}
                </span>
              </div>
            {/each}
          </div>
        {/if}
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Header>
        <Card.Title>Upcoming Events</Card.Title>
        <Card.Description>Your next scheduled editions</Card.Description>
      </Card.Header>
      <Card.Content>
        {#if data.upcomingEditions.length === 0}
          <p class="text-sm text-muted-foreground">No upcoming events.</p>
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
                  View CFP
                </a>
              </div>
            {/each}
          </div>
        {/if}
      </Card.Content>
    </Card.Root>
  </div>
</div>
