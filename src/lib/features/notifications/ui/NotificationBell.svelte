<script lang="ts">
import { Button } from '$lib/components/ui/button'
import { cn } from '$lib/utils'
import { Bell } from 'lucide-svelte'
import type { Notification } from '../domain'
import { NotificationDropdown } from './index'

type Props = {
  unreadCount: number
  notifications: Notification[]
  onMarkAsRead: (id: string) => void | Promise<void>
  onMarkAllAsRead: () => void | Promise<void>
  onDelete: (id: string) => void | Promise<void>
  onOpen?: () => void
  loading?: boolean
  class?: string
}

const {
  unreadCount,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onOpen,
  loading = false,
  class: className
}: Props = $props()

let isOpen = $state(false)

function toggleDropdown(): void {
  isOpen = !isOpen
  if (isOpen && onOpen) {
    onOpen()
  }
}

function closeDropdown(): void {
  isOpen = false
}

const badgeColor = $derived(() => {
  if (unreadCount === 0) return 'bg-muted text-muted-foreground'
  if (unreadCount <= 3) return 'bg-yellow-500 text-white'
  return 'bg-red-500 text-white'
})

const displayCount = $derived(() => {
  if (unreadCount > 99) return '99+'
  return String(unreadCount)
})
</script>

<svelte:window
  onclick={(e) => {
    const target = e.target as HTMLElement
    if (!target.closest('.notification-bell-container')) {
      closeDropdown()
    }
  }}
/>

<div class={cn('notification-bell-container relative', className)}>
  <Button
    variant="ghost"
    size="icon"
    onclick={toggleDropdown}
    aria-expanded={isOpen}
    aria-haspopup="true"
    aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
  >
    <div class="relative">
      <Bell class="h-5 w-5" />
      {#if unreadCount > 0}
        <span
          class={cn(
            'absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-bold',
            badgeColor()
          )}
        >
          {displayCount()}
        </span>
      {/if}
    </div>
  </Button>

  {#if isOpen}
    <NotificationDropdown
      {notifications}
      {onMarkAsRead}
      {onMarkAllAsRead}
      {onDelete}
      onClose={closeDropdown}
      {loading}
    />
  {/if}
</div>
