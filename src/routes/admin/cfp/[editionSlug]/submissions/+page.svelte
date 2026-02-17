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
import * as m from '$lib/paraglide/messages'
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
  <title>{m.cfp_submissions_title()} - {data.edition.name} - {m.common_app_name()}</title>
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
        <h2 class="text-3xl font-bold tracking-tight">{m.cfp_submissions_title()}</h2>
        <p class="text-muted-foreground">{data.edition.name}</p>
      </div>
    </div>
    <div class="flex items-center gap-4">
      <!-- Public CFP URL -->
      <div class="flex items-center gap-2">
        <div class="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-1.5">
          <span class="text-sm text-muted-foreground">{m.cfp_public_url()}</span>
          <code class="text-sm">/cfp/{data.edition.slug}</code>
        </div>
        <Button variant="outline" size="sm" onclick={copyCfpUrl} class="gap-2">
          {#if copiedUrl}
            <Check class="h-4 w-4 text-green-500" />
            {m.cfp_copied()}
          {:else}
            <Copy class="h-4 w-4" />
            {m.action_copy()}
          {/if}
        </Button>
        <a href="/cfp/{data.edition.slug}" target="_blank">
          <Button variant="outline" size="sm" class="gap-2">
            <ExternalLink class="h-4 w-4" />
            {m.cfp_open()}
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
          {m.cfp_export_csv()}
        </Button>
      </form>
    {/if}
      <a href="/admin/cfp/{data.edition.slug}/settings" title={m.cfp_settings()}>
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
        <Card.Title class="text-sm font-medium">{m.cfp_status_total()}</Card.Title>
      </Card.Header>
      <Card.Content>
        <div class="text-2xl font-bold">{totalSubmissions}</div>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Header class="pb-2">
        <Card.Title class="text-sm font-medium text-blue-600">{m.cfp_status_submitted()}</Card.Title>
      </Card.Header>
      <Card.Content>
        <div class="text-2xl font-bold">{data.statusCounts.submitted}</div>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Header class="pb-2">
        <Card.Title class="text-sm font-medium text-yellow-600">{m.cfp_status_review()}</Card.Title>
      </Card.Header>
      <Card.Content>
        <div class="text-2xl font-bold">{data.statusCounts.under_review}</div>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Header class="pb-2">
        <Card.Title class="text-sm font-medium text-green-600">{m.cfp_status_accepted()}</Card.Title>
      </Card.Header>
      <Card.Content>
        <div class="text-2xl font-bold">{data.statusCounts.accepted}</div>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Header class="pb-2">
        <Card.Title class="text-sm font-medium text-red-600">{m.cfp_status_rejected()}</Card.Title>
      </Card.Header>
      <Card.Content>
        <div class="text-2xl font-bold">{data.statusCounts.rejected}</div>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Header class="pb-2">
        <Card.Title class="text-sm font-medium text-emerald-600">{m.cfp_status_confirmed()}</Card.Title>
      </Card.Header>
      <Card.Content>
        <div class="text-2xl font-bold">{data.statusCounts.confirmed}</div>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Header class="pb-2">
        <Card.Title class="text-sm font-medium text-gray-600">{m.cfp_status_draft()}</Card.Title>
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
          <label for="search" class="mb-2 block text-sm font-medium">{m.cfp_filter_search()}</label>
          <div class="flex gap-2">
            <div class="relative flex-1">
              <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="search"
                type="text"
                placeholder={m.cfp_filter_search_placeholder()}
                class="pl-10"
                bind:value={search}
                onkeydown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onclick={handleSearch}>{m.action_search()}</Button>
          </div>
        </div>

        <!-- Status Filter -->
        <div class="w-40">
          <label for="status-filter" class="mb-2 block text-sm font-medium">{m.cfp_filter_status()}</label>
          <Select
            id="status-filter"
            value={data.filters.status}
            onchange={(e) => updateFilter('status', e.currentTarget.value)}
          >
            <option value="all">{m.cfp_filter_all_statuses()}</option>
            {#each allStatuses as status}
              <option value={status}>{status}</option>
            {/each}
          </Select>
        </div>

        <!-- Category Filter -->
        <div class="w-40">
          <label for="category-filter" class="mb-2 block text-sm font-medium">{m.cfp_filter_category()}</label>
          <Select
            id="category-filter"
            value={data.filters.category}
            onchange={(e) => updateFilter('category', e.currentTarget.value)}
          >
            <option value="all">{m.cfp_filter_all_categories()}</option>
            {#each data.categories as category}
              <option value={category.id}>{category.name}</option>
            {/each}
          </Select>
        </div>

        <!-- Format Filter -->
        <div class="w-40">
          <label for="format-filter" class="mb-2 block text-sm font-medium">{m.cfp_filter_format()}</label>
          <Select
            id="format-filter"
            value={data.filters.format}
            onchange={(e) => updateFilter('format', e.currentTarget.value)}
          >
            <option value="all">{m.cfp_filter_all_formats()}</option>
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
        <span class="text-sm font-medium">{m.cfp_talks_selected({ count: selectedIds.size })}</span>
        <div class="flex items-center gap-2">
          <form method="POST" action="?/updateStatus" use:enhance>
            {#each [...selectedIds] as id}
              <input type="hidden" name="talkIds" value={id} />
            {/each}
            <div class="flex gap-2">
              <Button type="submit" name="status" value="under_review" variant="outline" size="sm">
                {m.cfp_start_review()}
              </Button>
              <Button type="submit" name="status" value="accepted" variant="outline" size="sm" class="text-green-600">
                <Check class="mr-1 h-3 w-3" />
                {m.cfp_accept()}
              </Button>
              <Button type="submit" name="status" value="rejected" variant="outline" size="sm" class="text-red-600">
                <X class="mr-1 h-3 w-3" />
                {m.cfp_reject()}
              </Button>
            </div>
          </form>
          <Button variant="ghost" size="sm" onclick={clearSelection}>
            {m.cfp_clear_selection()}
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
          <Table.Head>{m.cfp_table_title()}</Table.Head>
          <Table.Head>{m.cfp_table_speaker()}</Table.Head>
          <Table.Head>{m.cfp_table_category()}</Table.Head>
          <Table.Head>{m.cfp_table_format()}</Table.Head>
          <Table.Head>{m.cfp_table_status()}</Table.Head>
          <Table.Head>{m.cfp_table_submitted()}</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {#if data.talks.length === 0}
          <Table.Row>
            <Table.Cell colspan={data.permissions.canChangeStatus ? 7 : 6}>
              <div class="flex flex-col items-center justify-center py-12">
                <FileText class="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 class="text-lg font-semibold">{m.cfp_no_submissions()}</h3>
                <p class="text-sm text-muted-foreground">
                  {data.filters.search || data.filters.status !== 'all' || data.filters.category !== 'all'
                    ? m.cfp_filter_adjust_hint()
                    : m.cfp_submissions_appear_hint()}
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
