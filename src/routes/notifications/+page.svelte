<script lang="ts">
import { goto, invalidateAll } from '$app/navigation'
import { page } from '$app/stores'
import { Pagination } from '$lib/components/shared'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import {
  NotificationFilters,
  NotificationList,
  type NotificationType
} from '$lib/features/notifications'
import { Check } from 'lucide-svelte'
import type { PageData } from './$types.js'

const { data }: { data: PageData } = $props()

let loading = $state(false)

async function handleMarkAsRead(id: string): Promise<void> {
  loading = true
  const formData = new FormData()
  formData.append('id', id)

  try {
    const response = await fetch('?/markAsRead', {
      method: 'POST',
      body: formData
    })

    if (response.ok) {
      await invalidateAll()
    }
  } finally {
    loading = false
  }
}

async function handleMarkAllAsRead(): Promise<void> {
  loading = true

  try {
    const response = await fetch('?/markAllAsRead', {
      method: 'POST'
    })

    if (response.ok) {
      await invalidateAll()
    }
  } finally {
    loading = false
  }
}

async function handleDelete(id: string): Promise<void> {
  loading = true
  const formData = new FormData()
  formData.append('id', id)

  try {
    const response = await fetch('?/delete', {
      method: 'POST',
      body: formData
    })

    if (response.ok) {
      await invalidateAll()
    }
  } finally {
    loading = false
  }
}

function handleTypeChange(type: NotificationType | 'all'): void {
  const url = new URL($page.url)
  if (type === 'all') {
    url.searchParams.delete('type')
  } else {
    url.searchParams.set('type', type)
  }
  url.searchParams.set('page', '1')
  goto(url.toString())
}

function handleStatusChange(status: 'all' | 'unread' | 'read'): void {
  const url = new URL($page.url)
  if (status === 'all') {
    url.searchParams.delete('status')
  } else {
    url.searchParams.set('status', status)
  }
  url.searchParams.set('page', '1')
  goto(url.toString())
}

function handlePageChange(newPage: number): void {
  const url = new URL($page.url)
  url.searchParams.set('page', String(newPage))
  goto(url.toString())
}
</script>

<svelte:head>
  <title>Notifications | Open Event Orchestrator</title>
</svelte:head>

<div class="container mx-auto max-w-4xl px-4 py-8">
  <!-- Header -->
  <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h1 class="text-2xl font-bold">Notifications</h1>
      <p class="text-muted-foreground">
        {#if data.stats.unread > 0}
          You have {data.stats.unread} unread notification{data.stats.unread !== 1 ? 's' : ''}
        {:else}
          All caught up!
        {/if}
      </p>
    </div>

    {#if data.stats.unread > 0}
      <Button
        variant="outline"
        class="gap-2"
        onclick={handleMarkAllAsRead}
        disabled={loading}
      >
        <Check class="h-4 w-4" />
        Mark all as read
      </Button>
    {/if}
  </div>

  <!-- Stats Cards -->
  <div class="mb-6 grid gap-4 sm:grid-cols-4">
    <Card.Root>
      <Card.Content class="pt-4">
        <div class="text-2xl font-bold">{data.stats.total}</div>
        <p class="text-xs text-muted-foreground">Total</p>
      </Card.Content>
    </Card.Root>
    <Card.Root>
      <Card.Content class="pt-4">
        <div class="text-2xl font-bold text-blue-500">{data.stats.unread}</div>
        <p class="text-xs text-muted-foreground">Unread</p>
      </Card.Content>
    </Card.Root>
    <Card.Root>
      <Card.Content class="pt-4">
        <div class="text-2xl font-bold text-red-500">{data.stats.byType.alert}</div>
        <p class="text-xs text-muted-foreground">Alerts</p>
      </Card.Content>
    </Card.Root>
    <Card.Root>
      <Card.Content class="pt-4">
        <div class="text-2xl font-bold text-purple-500">{data.stats.byType.action}</div>
        <p class="text-xs text-muted-foreground">Actions Required</p>
      </Card.Content>
    </Card.Root>
  </div>

  <!-- Filters -->
  <div class="mb-4">
    <NotificationFilters
      selectedType={data.filters.type as NotificationType | 'all'}
      selectedStatus={data.filters.status as 'all' | 'unread' | 'read'}
      onTypeChange={handleTypeChange}
      onStatusChange={handleStatusChange}
    />
  </div>

  <!-- Notifications List -->
  <NotificationList
    notifications={data.notifications}
    onMarkAsRead={handleMarkAsRead}
    onDelete={handleDelete}
    {loading}
    emptyMessage={data.filters.type !== 'all' || data.filters.status !== 'all'
      ? 'No notifications match your filters'
      : 'No notifications yet'}
  />

  <!-- Pagination -->
  {#if data.pagination.totalPages > 1}
    <div class="mt-6">
      <Pagination
        currentPage={data.pagination.currentPage}
        totalPages={data.pagination.totalPages}
        totalItems={data.pagination.totalItems}
        perPage={data.pagination.perPage}
        onPageChange={handlePageChange}
      />
    </div>
  {/if}
</div>
