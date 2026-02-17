<script lang="ts">
import { cn } from '$lib/utils'
import { AlertCircle, AlertTriangle, Clock, Info } from 'lucide-svelte'
import type { Notification, NotificationType } from '../domain'
import { formatNotificationDate } from '../domain'

type Props = {
  notification: Notification
  onRead?: (id: string) => void
  onDelete?: (id: string) => void
  compact?: boolean
  class?: string
}

const { notification, onRead, onDelete, compact = false, class: className }: Props = $props()

const typeColors: Record<NotificationType, string> = {
  system: 'text-blue-500',
  alert: 'text-red-500',
  reminder: 'text-yellow-500',
  action: 'text-purple-500'
}

const typeBgColors: Record<NotificationType, string> = {
  system: 'bg-blue-50 dark:bg-blue-950',
  alert: 'bg-red-50 dark:bg-red-950',
  reminder: 'bg-yellow-50 dark:bg-yellow-950',
  action: 'bg-purple-50 dark:bg-purple-950'
}

const iconComponent = $derived(() => {
  switch (notification.type) {
    case 'alert':
      return AlertCircle
    case 'reminder':
      return Clock
    case 'action':
      return AlertTriangle
    default:
      return Info
  }
})

function handleClick(): void {
  if (!notification.isRead && onRead) {
    onRead(notification.id)
  }

  if (notification.link) {
    window.location.href = notification.link
  }
}

function handleKeyDown(event: KeyboardEvent): void {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    handleClick()
  }
}

function handleDelete(event: MouseEvent | KeyboardEvent): void {
  event.stopPropagation()
  if (onDelete) {
    onDelete(notification.id)
  }
}
</script>

<div
  class={cn(
    'group relative flex cursor-pointer items-start gap-3 rounded-md p-3 transition-colors',
    !notification.isRead && typeBgColors[notification.type],
    notification.isRead && 'hover:bg-accent',
    !notification.isRead && 'hover:opacity-90',
    className
  )}
  onclick={handleClick}
  onkeydown={handleKeyDown}
  role="button"
  tabindex="0"
  aria-label={notification.title}
>
  <!-- Icon -->
  <div class={cn('mt-0.5 flex-shrink-0', typeColors[notification.type])}>
    <svelte:component this={iconComponent()} class="h-5 w-5" />
  </div>

  <!-- Content -->
  <div class="min-w-0 flex-1">
    <div class="flex items-start justify-between gap-2">
      <p
        class={cn(
          'text-sm font-medium leading-tight',
          !notification.isRead && 'text-foreground',
          notification.isRead && 'text-muted-foreground'
        )}
      >
        {notification.title}
      </p>
      {#if !notification.isRead}
        <span class="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500"></span>
      {/if}
    </div>

    {#if !compact}
      <p class="mt-1 line-clamp-2 text-sm text-muted-foreground">
        {notification.message}
      </p>
    {/if}

    <p class="mt-1 text-xs text-muted-foreground">
      {formatNotificationDate(notification.createdAt)}
    </p>
  </div>

  <!-- Delete button (visible on hover) -->
  {#if onDelete}
    <button
      type="button"
      class="absolute right-2 top-2 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
      onclick={handleDelete}
      onkeydown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleDelete(e)
        }
      }}
      aria-label="Delete notification"
    >
      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  {/if}
</div>
