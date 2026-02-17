<script lang="ts">
import { cn } from '$lib/utils'
import { Loader2 } from 'lucide-svelte'
import type { Notification } from '../domain'
import { NotificationItem } from './index'

type Props = {
  notifications: Notification[]
  onMarkAsRead: (id: string) => void | Promise<void>
  onDelete: (id: string) => void | Promise<void>
  loading?: boolean
  emptyMessage?: string
  class?: string
}

const {
  notifications,
  onMarkAsRead,
  onDelete,
  loading = false,
  emptyMessage = 'No notifications',
  class: className
}: Props = $props()

const hasNotifications = $derived(notifications.length > 0)

async function handleMarkAsRead(id: string): Promise<void> {
  await onMarkAsRead(id)
}

async function handleDelete(id: string): Promise<void> {
  await onDelete(id)
}
</script>

<div class={cn('', className)}>
  {#if loading}
    <div class="flex items-center justify-center py-12">
      <Loader2 class="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  {:else if hasNotifications}
    <div class="divide-y rounded-lg border">
      {#each notifications as notification (notification.id)}
        <NotificationItem
          {notification}
          onRead={handleMarkAsRead}
          onDelete={handleDelete}
        />
      {/each}
    </div>
  {:else}
    <div class="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
      <svg
        class="mb-3 h-16 w-16 text-muted-foreground/30"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.5"
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
      <p class="text-sm text-muted-foreground">{emptyMessage}</p>
    </div>
  {/if}
</div>
