<script lang="ts">
import { goto } from '$app/navigation'
import { page } from '$app/stores'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import * as Dialog from '$lib/components/ui/dialog'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import {
  buildAuditDescription,
  extractAmount,
  getActionColor,
  getActionLabel,
  getEntityTypeLabel
} from '$lib/features/budget/domain/audit-log'
import type {
  AuditAction,
  AuditEntityType,
  FinancialAuditLog
} from '$lib/features/budget/domain/audit-log'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileText,
  Filter,
  X
} from 'lucide-svelte'
import type { PageData } from './$types'

interface Props {
  data: PageData
}

const { data }: Props = $props()

const ACTIONS: AuditAction[] = [
  'create',
  'update',
  'delete',
  'status_change',
  'send',
  'accept',
  'reject',
  'convert',
  'submit',
  'approve',
  'mark_paid'
]

const ENTITY_TYPES: AuditEntityType[] = [
  'transaction',
  'quote',
  'invoice',
  'reimbursement',
  'category',
  'budget'
]

let selectedLog = $state<(typeof data.logs)[0] | null>(null)
let showDetailDialog = $state(false)

// Filter states bound to URL params
let filterAction = $state(data.filters.action)
let filterEntityType = $state(data.filters.entityType)
let filterStartDate = $state(data.filters.startDate)
let filterEndDate = $state(data.filters.endDate)
let filterSearch = $state(data.filters.search)

const formatDate = (dateStr: string): string => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(dateStr))
}

const formatAmount = (amount: number | null): string => {
  if (amount === null) return '-'
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount)
}

const getActionBadgeClass = (action: AuditAction): string => {
  const color = getActionColor(action)
  switch (color) {
    case 'green':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    case 'blue':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    case 'red':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    case 'purple':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    case 'cyan':
      return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200'
    case 'orange':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
  }
}

function applyFilters(): void {
  const params = new URLSearchParams()
  if (filterAction) params.set('action', filterAction)
  if (filterEntityType) params.set('entityType', filterEntityType)
  if (filterStartDate) params.set('startDate', filterStartDate)
  if (filterEndDate) params.set('endDate', filterEndDate)
  if (filterSearch) params.set('search', filterSearch)
  goto(`?${params.toString()}`)
}

function clearFilters(): void {
  filterAction = ''
  filterEntityType = ''
  filterStartDate = ''
  filterEndDate = ''
  filterSearch = ''
  goto('?')
}

function goToPage(pageNum: number): void {
  const params = new URLSearchParams($page.url.searchParams)
  params.set('page', pageNum.toString())
  goto(`?${params.toString()}`)
}

function openDetail(log: (typeof data.logs)[0]): void {
  selectedLog = log
  showDetailDialog = true
}

function buildLogDescription(log: (typeof data.logs)[0]): string {
  const fullLog: FinancialAuditLog = {
    id: log.id,
    editionId: data.edition.id,
    action: log.action as AuditAction,
    entityType: log.entityType as AuditEntityType,
    entityId: log.entityId,
    entityReference: log.entityReference,
    oldValue: log.oldValue as Record<string, unknown> | undefined,
    newValue: log.newValue as Record<string, unknown> | undefined,
    metadata: log.metadata as Record<string, unknown> | undefined,
    created: new Date(log.created)
  }
  return buildAuditDescription(fullLog)
}

const hasFilters = $derived(
  filterAction || filterEntityType || filterStartDate || filterEndDate || filterSearch
)
</script>

<svelte:head>
  <title>Audit Journal - {data.edition.name} - Open Event Orchestrator</title>
</svelte:head>

<div class="container mx-auto space-y-6 py-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-4">
      <a href="/admin/budget/{data.edition.slug}">
        <Button variant="ghost" size="icon">
          <ArrowLeft class="h-4 w-4" />
        </Button>
      </a>
      <div>
        <p class="text-sm text-muted-foreground">{data.edition.name}</p>
        <h2 class="text-3xl font-bold tracking-tight">Audit Journal</h2>
      </div>
    </div>
    <div class="flex gap-2">
      <a
        href="/admin/budget/{data.edition.slug}/journal/export?format=csv{hasFilters ? `&${new URLSearchParams(data.filters as Record<string, string>).toString()}` : ''}"
        download
      >
        <Button variant="outline" size="sm">
          <Download class="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </a>
      <a
        href="/admin/budget/{data.edition.slug}/journal/export?format=pdf{hasFilters ? `&${new URLSearchParams(data.filters as Record<string, string>).toString()}` : ''}"
        target="_blank"
      >
        <Button variant="outline" size="sm">
          <FileText class="mr-2 h-4 w-4" />
          Export PDF
        </Button>
      </a>
    </div>
  </div>

  <!-- Sub-navigation -->
  <nav class="flex gap-1 rounded-lg border bg-muted/40 p-1">
    <a
      href="/admin/budget/{data.edition.slug}"
      class="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-background hover:shadow-sm"
    >
      Dashboard
    </a>
    <a
      href="/admin/budget/{data.edition.slug}/quotes"
      class="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-background hover:shadow-sm"
    >
      Quotes
    </a>
    <a
      href="/admin/budget/{data.edition.slug}/invoices"
      class="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-background hover:shadow-sm"
    >
      Invoices
    </a>
    <a
      href="/admin/budget/{data.edition.slug}/reimbursements"
      class="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-background hover:shadow-sm"
    >
      Reimbursements
    </a>
    <a
      href="/admin/budget/{data.edition.slug}/journal"
      class="rounded-md bg-background px-3 py-1.5 text-sm font-medium shadow-sm"
    >
      Journal
    </a>
  </nav>

  <!-- Filters -->
  <Card.Root>
    <Card.Header class="pb-3">
      <Card.Title class="flex items-center gap-2 text-base">
        <Filter class="h-4 w-4" />
        Filters
      </Card.Title>
    </Card.Header>
    <Card.Content>
      <div class="grid gap-4 md:grid-cols-5">
        <div class="space-y-2">
          <Label for="action">Action</Label>
          <select
            id="action"
            bind:value={filterAction}
            class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="" class="bg-background text-foreground">All Actions</option>
            {#each ACTIONS as action}
              <option value={action} class="bg-background text-foreground">{getActionLabel(action)}</option>
            {/each}
          </select>
        </div>

        <div class="space-y-2">
          <Label for="entityType">Entity Type</Label>
          <select
            id="entityType"
            bind:value={filterEntityType}
            class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="" class="bg-background text-foreground">All Types</option>
            {#each ENTITY_TYPES as type}
              <option value={type} class="bg-background text-foreground">{getEntityTypeLabel(type)}</option>
            {/each}
          </select>
        </div>

        <div class="space-y-2">
          <Label for="startDate">From Date</Label>
          <Input type="date" id="startDate" bind:value={filterStartDate} />
        </div>

        <div class="space-y-2">
          <Label for="endDate">To Date</Label>
          <Input type="date" id="endDate" bind:value={filterEndDate} />
        </div>

        <div class="space-y-2">
          <Label for="search">Reference</Label>
          <Input
            type="text"
            id="search"
            placeholder="Search reference..."
            bind:value={filterSearch}
          />
        </div>
      </div>

      <div class="mt-4 flex gap-2">
        <Button onclick={applyFilters}>Apply Filters</Button>
        {#if hasFilters}
          <Button variant="outline" onclick={clearFilters}>
            <X class="mr-2 h-4 w-4" />
            Clear
          </Button>
        {/if}
      </div>
    </Card.Content>
  </Card.Root>

  <!-- Results -->
  {#if data.logs.length === 0}
    <Card.Root>
      <Card.Content class="flex flex-col items-center justify-center py-12">
        <FileText class="h-12 w-12 text-muted-foreground/50" />
        <p class="mt-4 text-lg font-medium text-muted-foreground">No audit logs found</p>
        <p class="text-sm text-muted-foreground">
          {hasFilters ? 'Try adjusting your filters' : 'Financial operations will be logged here'}
        </p>
      </Card.Content>
    </Card.Root>
  {:else}
    <Card.Root>
      <Card.Content class="p-0">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b bg-muted/50">
                <th class="px-4 py-3 text-left text-sm font-medium">Date/Time</th>
                <th class="px-4 py-3 text-left text-sm font-medium">User</th>
                <th class="px-4 py-3 text-left text-sm font-medium">Action</th>
                <th class="px-4 py-3 text-left text-sm font-medium">Entity</th>
                <th class="px-4 py-3 text-left text-sm font-medium">Reference</th>
                <th class="px-4 py-3 text-right text-sm font-medium">Amount</th>
                <th class="px-4 py-3 text-center text-sm font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {#each data.logs as log}
                <tr class="border-b hover:bg-muted/30">
                  <td class="px-4 py-3 text-sm">{formatDate(log.created)}</td>
                  <td class="px-4 py-3 text-sm text-muted-foreground">{log.userEmail}</td>
                  <td class="px-4 py-3">
                    <span
                      class="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium {getActionBadgeClass(log.action as AuditAction)}"
                    >
                      {getActionLabel(log.action as AuditAction)}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-sm">
                    {getEntityTypeLabel(log.entityType as AuditEntityType)}
                  </td>
                  <td class="px-4 py-3 text-sm font-mono">
                    {log.entityReference || '-'}
                  </td>
                  <td class="px-4 py-3 text-right text-sm">
                    {formatAmount(extractAmount(log.newValue as Record<string, unknown> | undefined))}
                  </td>
                  <td class="px-4 py-3 text-center">
                    <Button variant="ghost" size="sm" onclick={() => openDetail(log)}>
                      <Eye class="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </Card.Content>
    </Card.Root>

    <!-- Pagination -->
    {#if data.pagination.totalPages > 1}
      <div class="flex items-center justify-between">
        <p class="text-sm text-muted-foreground">
          Showing {(data.pagination.page - 1) * data.pagination.perPage + 1} to {Math.min(
            data.pagination.page * data.pagination.perPage,
            data.pagination.totalItems
          )} of {data.pagination.totalItems} entries
        </p>
        <div class="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            disabled={data.pagination.page <= 1}
            onclick={() => goToPage(data.pagination.page - 1)}
          >
            <ChevronLeft class="h-4 w-4" />
          </Button>
          {#each Array(Math.min(5, data.pagination.totalPages)) as _, i}
            {@const pageNum = Math.max(1, Math.min(data.pagination.page - 2, data.pagination.totalPages - 4)) + i}
            {#if pageNum <= data.pagination.totalPages}
              <Button
                variant={pageNum === data.pagination.page ? 'default' : 'outline'}
                size="sm"
                onclick={() => goToPage(pageNum)}
              >
                {pageNum}
              </Button>
            {/if}
          {/each}
          <Button
            variant="outline"
            size="sm"
            disabled={data.pagination.page >= data.pagination.totalPages}
            onclick={() => goToPage(data.pagination.page + 1)}
          >
            <ChevronRight class="h-4 w-4" />
          </Button>
        </div>
      </div>
    {/if}
  {/if}
</div>

<!-- Detail Dialog -->
{#if showDetailDialog && selectedLog}
  <Dialog.Content class="max-w-2xl" onClose={() => (showDetailDialog = false)}>
    <Dialog.Header>
      <Dialog.Title>Audit Log Details</Dialog.Title>
      <Dialog.Description>
        {buildLogDescription(selectedLog)}
      </Dialog.Description>
    </Dialog.Header>
    <div class="space-y-4">
      <div class="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p class="font-medium text-muted-foreground">Date/Time</p>
          <p>{formatDate(selectedLog.created)}</p>
        </div>
        <div>
          <p class="font-medium text-muted-foreground">User</p>
          <p>{selectedLog.userEmail}</p>
        </div>
        <div>
          <p class="font-medium text-muted-foreground">Action</p>
          <span
            class="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium {getActionBadgeClass(selectedLog.action as AuditAction)}"
          >
            {getActionLabel(selectedLog.action as AuditAction)}
          </span>
        </div>
        <div>
          <p class="font-medium text-muted-foreground">Entity</p>
          <p>
            {getEntityTypeLabel(selectedLog.entityType as AuditEntityType)}
            {#if selectedLog.entityReference}
              ({selectedLog.entityReference})
            {/if}
          </p>
        </div>
      </div>

      {#if selectedLog.oldValue}
        <div>
          <p class="mb-2 font-medium text-muted-foreground">Old Value</p>
          <pre class="rounded-md bg-muted p-3 text-xs overflow-auto max-h-40">{JSON.stringify(selectedLog.oldValue, null, 2)}</pre>
        </div>
      {/if}

      {#if selectedLog.newValue}
        <div>
          <p class="mb-2 font-medium text-muted-foreground">New Value</p>
          <pre class="rounded-md bg-muted p-3 text-xs overflow-auto max-h-40">{JSON.stringify(selectedLog.newValue, null, 2)}</pre>
        </div>
      {/if}

      {#if selectedLog.metadata}
        <div>
          <p class="mb-2 font-medium text-muted-foreground">Metadata</p>
          <pre class="rounded-md bg-muted p-3 text-xs overflow-auto max-h-40">{JSON.stringify(selectedLog.metadata, null, 2)}</pre>
        </div>
      {/if}
    </div>
    <Dialog.Footer>
      <Button variant="outline" onclick={() => (showDetailDialog = false)}>Close</Button>
    </Dialog.Footer>
  </Dialog.Content>
{/if}
