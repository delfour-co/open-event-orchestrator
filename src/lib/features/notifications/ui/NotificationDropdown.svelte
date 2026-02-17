<script lang="ts">
import { Button } from '$lib/components/ui/button'
import { cn } from '$lib/utils'
import { Check, ExternalLink, Loader2 } from 'lucide-svelte'
import type { Notification } from '../domain'
import { NotificationItem } from './index'

type Props = {
  notifications: Notification[]
  onMarkAsRead: (id: string) => void | Promise<void>
  onMarkAllAsRead: () => void | Promise<void>
  onDelete: (id: string) => void | Promise<void>
  onClose: () => void
  loading?: boolean
  class?: string
}

const {
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onClose,
  loading = false,
  class: className
}: Props = $props()

const unreadCount = $derived(notifications.filter((n) => !n.isRead).length)
const hasNotifications = $derived(notifications.length > 0)

async function handleMarkAllAsRead(): Promise<void> {
  await onMarkAllAsRead()
}

async function handleMarkAsRead(id: string): Promise<void> {
  await onMarkAsRead(id)
}

async function handleDelete(id: string): Promise<void> {
  await onDelete(id)
}
</script>

<div
  class={cn(
    'absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border bg-popover shadow-lg sm:w-96',
    className
  )}
  role="dialog"
  aria-label="Notifications"
>
  <!-- Header -->
  <div class="flex items-center justify-between border-b px-4 py-3">
    <h3 class="text-sm font-semibold">Notifications</h3>
    <div class="flex items-center gap-2">
      {#if unreadCount > 0}
        <Button
          variant="ghost"
          size="sm"
          class="h-7 gap-1 px-2 text-xs"
          onclick={handleMarkAllAsRead}
          disabled={loading}
        >
          <Check class="h-3 w-3" />
          Mark all read
        </Button>
      {/if}
    </div>
  </div>

  <!-- Notifications List -->
  <div class="max-h-96 overflow-y-auto">
    {#if loading}
      <div class="flex items-center justify-center py-8">
        <Loader2 class="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    {:else if hasNotifications}
      <div class="divide-y">
        {#each notifications as notification (notification.id)}
          <NotificationItem
            {notification}
            onRead={handleMarkAsRead}
            onDelete={handleDelete}
            compact
          />
        {/each}
      </div>
    {:else}
      <div class="flex flex-col items-center justify-center py-8 text-center">
        <svg
          class="mb-2 h-12 w-12 text-muted-foreground/50"
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
        <p class="text-sm text-muted-foreground">No notifications yet</p>
        <p class="mt-1 text-xs text-muted-foreground">We'll notify you when something happens</p>
      </div>
    {/if}
  </div>

  <!-- Footer -->
  <div class="border-t px-4 py-2">
    <a
      href="/notifications"
      class="flex items-center justify-center gap-2 rounded-md py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      onclick={onClose}
    >
      View all notifications
      <ExternalLink class="h-3.5 w-3.5" />
    </a>
  </div>
</div>
