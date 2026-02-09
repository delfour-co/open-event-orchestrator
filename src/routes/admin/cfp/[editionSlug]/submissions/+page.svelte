<script lang="ts">
import { enhance } from '$app/forms'
import { goto } from '$app/navigation'
import { page } from '$app/stores'
import { StatusBadge } from '$lib/components/shared'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Checkbox } from '$lib/components/ui/checkbox'
import { Input } from '$lib/components/ui/input'
import { Select } from '$lib/components/ui/select'
import * as Table from '$lib/components/ui/table'
import { talkStatusSchema } from '$lib/features/cfp/domain'
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Search,
  Settings,
  X
} from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

let selectedIds = $state<Set<string>>(new Set())
let search = $state('')
let isExporting = $state(false)
let copiedUrl = $state(false)

// Get public CFP URL
const publicCfpUrl = $derived(
  `${typeof window !== 'undefined' ? window.location.origin : ''}/cfp/${data.edition.slug}`
)

async function copyCfpUrl() {
  try {
    await navigator.clipboard.writeText(publicCfpUrl)
    copiedUrl = true
    setTimeout(() => {
      copiedUrl = false
    }, 2000)
  } catch {
    // Fallback for older browsers
    const input = document.createElement('input')
    input.value = publicCfpUrl
    document.body.appendChild(input)
    input.select()
    document.execCommand('copy')
    document.body.removeChild(input)
    copiedUrl = true
    setTimeout(() => {
      copiedUrl = false
    }, 2000)
  }
}

$effect(() => {
  search = data.filters.search
})

const allStatuses = talkStatusSchema.options

const allSelected = $derived(data.talks.length > 0 && selectedIds.size === data.talks.length)
const someSelected = $derived(selectedIds.size > 0 && !allSelected)

function toggleAll() {
  if (allSelected) {
    selectedIds = new Set()
  } else {
    selectedIds = new Set(data.talks.map((t) => t.id))
  }
}

function toggleOne(id: string) {
  const next = new Set(selectedIds)
  if (next.has(id)) {
    next.delete(id)
  } else {
    next.add(id)
  }
  selectedIds = next
}

function updateFilter(key: string, value: string) {
  const url = new URL($page.url)
  if (value === 'all' || value === '') {
    url.searchParams.delete(key)
  } else {
    url.searchParams.set(key, value)
  }
  url.searchParams.delete('page')
  goto(url.toString(), { replaceState: true })
}

function handleSearch() {
  updateFilter('search', search)
}

function clearSelection() {
  selectedIds = new Set()
}

function formatSpeakerNames(
  speakers: ({ firstName: string; lastName: string } | undefined)[]
): string {
  return speakers
    .filter((s): s is { firstName: string; lastName: string } => s !== undefined)
    .map((s) => `${s.firstName} ${s.lastName}`)
    .join(', ')
}

function formatDate(date: Date | undefined): string {
  if (!date) return '-'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const totalSubmissions = $derived(Object.values(data.statusCounts).reduce((a, b) => a + b, 0))

$effect(() => {
  if (form?.csv) {
    const blob = new Blob([form.csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = form.filename || 'export.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }
})
</script>

<svelte:head>
  <title>CFP Submissions - {data.edition.name} - Open Event Orchestrator</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-4">
      <a href="/admin/cfp">
        <Button variant="ghost" size="icon">
          <ArrowLeft class="h-4 w-4" />
        </Button>
      </a>
      <div>
        <h2 class="text-3xl font-bold tracking-tight">CFP Submissions</h2>
        <p class="text-muted-foreground">{data.edition.name}</p>
      </div>
    </div>
    <div class="flex items-center gap-4">
      <!-- Public CFP URL -->
      <div class="flex items-center gap-2">
        <div class="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-1.5">
          <span class="text-sm text-muted-foreground">Public URL:</span>
          <code class="text-sm">/cfp/{data.edition.slug}</code>
        </div>
        <Button variant="outline" size="sm" onclick={copyCfpUrl} class="gap-2">
          {#if copiedUrl}
            <Check class="h-4 w-4 text-green-500" />
            Copied
          {:else}
            <Copy class="h-4 w-4" />
            Copy
          {/if}
        </Button>
        <a href="/cfp/{data.edition.slug}" target="_blank">
          <Button variant="outline" size="sm" class="gap-2">
            <ExternalLink class="h-4 w-4" />
            Open
          </Button>
        </a>
      </div>
    {#if data.permissions.canExport}
      <form method="POST" action="?/export" use:enhance={() => {
        isExporting = true
        return async ({ update }) => {
          isExporting = false
          await update()
        }
      }}>
        <Button variant="outline" type="submit" disabled={isExporting}>
          <Download class="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </form>
    {/if}
      <a href="/admin/cfp/{data.edition.slug}/settings" title="CFP Settings">
        <Button variant="ghost" size="icon">
          <Settings class="h-4 w-4" />
        </Button>
      </a>
    </div>
  </div>

  {#if form?.error}
    <div class="rounded-lg border border-destructive bg-destructive/10 p-4">
      <p class="text-sm text-destructive">{form.error}</p>
    </div>
  {/if}

  {#if form?.success}
    <div class="rounded-lg border border-green-500 bg-green-500/10 p-4">
      <p class="text-sm text-green-700 dark:text-green-400">{form.message}</p>
    </div>
  {/if}

  <!-- Stats Cards -->
  <div class="grid gap-4 md:grid-cols-4 lg:grid-cols-8">
    <Card.Root class="col-span-2">
      <Card.Header class="pb-2">
        <Card.Title class="text-sm font-medium">Total</Card.Title>
      </Card.Header>
      <Card.Content>
        <div class="text-2xl font-bold">{totalSubmissions}</div>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Header class="pb-2">
        <Card.Title class="text-sm font-medium text-blue-600">Submitted</Card.Title>
      </Card.Header>
      <Card.Content>
        <div class="text-2xl font-bold">{data.statusCounts.submitted}</div>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Header class="pb-2">
        <Card.Title class="text-sm font-medium text-yellow-600">Review</Card.Title>
      </Card.Header>
      <Card.Content>
        <div class="text-2xl font-bold">{data.statusCounts.under_review}</div>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Header class="pb-2">
        <Card.Title class="text-sm font-medium text-green-600">Accepted</Card.Title>
      </Card.Header>
      <Card.Content>
        <div class="text-2xl font-bold">{data.statusCounts.accepted}</div>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Header class="pb-2">
        <Card.Title class="text-sm font-medium text-red-600">Rejected</Card.Title>
      </Card.Header>
      <Card.Content>
        <div class="text-2xl font-bold">{data.statusCounts.rejected}</div>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Header class="pb-2">
        <Card.Title class="text-sm font-medium text-emerald-600">Confirmed</Card.Title>
      </Card.Header>
      <Card.Content>
        <div class="text-2xl font-bold">{data.statusCounts.confirmed}</div>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Header class="pb-2">
        <Card.Title class="text-sm font-medium text-gray-600">Draft</Card.Title>
      </Card.Header>
      <Card.Content>
        <div class="text-2xl font-bold">{data.statusCounts.draft}</div>
      </Card.Content>
    </Card.Root>
  </div>

  <!-- Filters -->
  <Card.Root>
    <Card.Content class="pt-6">
      <div class="flex flex-wrap items-end gap-4">
        <!-- Search -->
        <div class="flex-1">
          <label for="search" class="mb-2 block text-sm font-medium">Search</label>
          <div class="flex gap-2">
            <div class="relative flex-1">
              <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="search"
                type="text"
                placeholder="Search by title or speaker..."
                class="pl-10"
                bind:value={search}
                onkeydown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onclick={handleSearch}>Search</Button>
          </div>
        </div>

        <!-- Status Filter -->
        <div class="w-40">
          <label for="status-filter" class="mb-2 block text-sm font-medium">Status</label>
          <Select
            id="status-filter"
            value={data.filters.status}
            onchange={(e) => updateFilter('status', e.currentTarget.value)}
          >
            <option value="all">All statuses</option>
            {#each allStatuses as status}
              <option value={status}>{status}</option>
            {/each}
          </Select>
        </div>

        <!-- Category Filter -->
        <div class="w-40">
          <label for="category-filter" class="mb-2 block text-sm font-medium">Category</label>
          <Select
            id="category-filter"
            value={data.filters.category}
            onchange={(e) => updateFilter('category', e.currentTarget.value)}
          >
            <option value="all">All categories</option>
            {#each data.categories as category}
              <option value={category.id}>{category.name}</option>
            {/each}
          </Select>
        </div>

        <!-- Format Filter -->
        <div class="w-40">
          <label for="format-filter" class="mb-2 block text-sm font-medium">Format</label>
          <Select
            id="format-filter"
            value={data.filters.format}
            onchange={(e) => updateFilter('format', e.currentTarget.value)}
          >
            <option value="all">All formats</option>
            {#each data.formats as format}
              <option value={format.id}>{format.name}</option>
            {/each}
          </Select>
        </div>
      </div>
    </Card.Content>
  </Card.Root>

  <!-- Bulk Actions (only for organizers/admins) -->
  {#if selectedIds.size > 0 && data.permissions.canChangeStatus}
    <Card.Root class="border-primary bg-primary/5">
      <Card.Content class="flex items-center justify-between py-3">
        <span class="text-sm font-medium">{selectedIds.size} talk(s) selected</span>
        <div class="flex items-center gap-2">
          <form method="POST" action="?/updateStatus" use:enhance>
            {#each [...selectedIds] as id}
              <input type="hidden" name="talkIds" value={id} />
            {/each}
            <div class="flex gap-2">
              <Button type="submit" name="status" value="under_review" variant="outline" size="sm">
                Start Review
              </Button>
              <Button type="submit" name="status" value="accepted" variant="outline" size="sm" class="text-green-600">
                <Check class="mr-1 h-3 w-3" />
                Accept
              </Button>
              <Button type="submit" name="status" value="rejected" variant="outline" size="sm" class="text-red-600">
                <X class="mr-1 h-3 w-3" />
                Reject
              </Button>
            </div>
          </form>
          <Button variant="ghost" size="sm" onclick={clearSelection}>
            Clear selection
          </Button>
        </div>
      </Card.Content>
    </Card.Root>
  {/if}

  <!-- Table -->
  <Card.Root>
    <Table.Root>
      <Table.Header>
        <Table.Row>
          {#if data.permissions.canChangeStatus}
            <Table.Head class="w-12">
              <Checkbox
                checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                onCheckedChange={toggleAll}
              />
            </Table.Head>
          {/if}
          <Table.Head>Title</Table.Head>
          <Table.Head>Speaker(s)</Table.Head>
          <Table.Head>Category</Table.Head>
          <Table.Head>Format</Table.Head>
          <Table.Head>Status</Table.Head>
          <Table.Head>Submitted</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {#if data.talks.length === 0}
          <Table.Row>
            <Table.Cell colspan={data.permissions.canChangeStatus ? 7 : 6}>
              <div class="flex flex-col items-center justify-center py-12">
                <FileText class="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 class="text-lg font-semibold">No submissions found</h3>
                <p class="text-sm text-muted-foreground">
                  {data.filters.search || data.filters.status !== 'all' || data.filters.category !== 'all'
                    ? 'Try adjusting your filters.'
                    : 'Submissions will appear here once speakers submit talks.'}
                </p>
              </div>
            </Table.Cell>
          </Table.Row>
        {:else}
          {#each data.talks as talk}
            <Table.Row data-state={selectedIds.has(talk.id) ? 'selected' : ''}>
              {#if data.permissions.canChangeStatus}
                <Table.Cell>
                  <Checkbox
                    checked={selectedIds.has(talk.id)}
                    onCheckedChange={() => toggleOne(talk.id)}
                  />
                </Table.Cell>
              {/if}
              <Table.Cell>
                <a
                  href="/admin/cfp/{data.edition.slug}/submissions/{talk.id}"
                  class="font-medium hover:underline"
                >
                  {talk.title}
                </a>
              </Table.Cell>
              <Table.Cell>
                <span class="text-muted-foreground">
                  {formatSpeakerNames(talk.speakers)}
                </span>
              </Table.Cell>
              <Table.Cell>
                {talk.category?.name || '-'}
              </Table.Cell>
              <Table.Cell>
                {talk.format?.name || '-'}
              </Table.Cell>
              <Table.Cell>
                <StatusBadge status={talk.status} />
              </Table.Cell>
              <Table.Cell class="text-muted-foreground">
                {formatDate(talk.submittedAt)}
              </Table.Cell>
            </Table.Row>
          {/each}
        {/if}
      </Table.Body>
    </Table.Root>
  </Card.Root>
</div>
