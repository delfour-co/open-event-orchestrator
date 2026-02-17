<script lang="ts">
import { invalidateAll } from '$app/navigation'
import { Button } from '$lib/components/ui/button'
import { type Notification, NotificationBell } from '$lib/features/notifications'
import * as m from '$lib/paraglide/messages.js'
import { cn } from '$lib/utils'
import { ChevronDown, LogOut, Menu, User } from 'lucide-svelte'
import LanguageSelector from './language-selector.svelte'
import ThemeToggle from './theme-toggle.svelte'

type Props = {
  onMenuClick?: () => void
  title?: string
  userName?: string
  userAvatar?: string | null
  notificationCount?: number
  notifications?: Notification[]
  onRefreshNotifications?: () => Promise<void>
}

const {
  onMenuClick,
  title = 'Dashboard',
  userName,
  userAvatar,
  notificationCount = 0,
  notifications = [],
  onRefreshNotifications
}: Props = $props()

let notificationLoading = $state(false)

async function handleMarkAsRead(id: string): Promise<void> {
  notificationLoading = true
  const formData = new FormData()
  formData.append('id', id)

  try {
    await fetch('/api/notifications/mark-read', {
      method: 'POST',
      body: formData
    })
    if (onRefreshNotifications) {
      await onRefreshNotifications()
    } else {
      await invalidateAll()
    }
  } finally {
    notificationLoading = false
  }
}

async function handleMarkAllAsRead(): Promise<void> {
  notificationLoading = true

  try {
    await fetch('/api/notifications/mark-all-read', {
      method: 'POST'
    })
    if (onRefreshNotifications) {
      await onRefreshNotifications()
    } else {
      await invalidateAll()
    }
  } finally {
    notificationLoading = false
  }
}

async function handleDeleteNotification(id: string): Promise<void> {
  notificationLoading = true
  const formData = new FormData()
  formData.append('id', id)

  try {
    await fetch('/api/notifications/delete', {
      method: 'POST',
      body: formData
    })
    if (onRefreshNotifications) {
      await onRefreshNotifications()
    } else {
      await invalidateAll()
    }
  } finally {
    notificationLoading = false
  }
}

async function handleNotificationOpen(): Promise<void> {
  if (onRefreshNotifications) {
    await onRefreshNotifications()
  }
}

let userMenuOpen = $state(false)

function toggleUserMenu(): void {
  userMenuOpen = !userMenuOpen
}

function closeUserMenu(): void {
  userMenuOpen = false
}

// Get initials for avatar fallback
function getInitials(name: string | undefined): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
</script>

<svelte:window
  onclick={(e) => {
    const target = e.target as HTMLElement
    if (!target.closest('.user-menu-container')) {
      closeUserMenu()
    }
  }}
/>

<header class="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
  <Button variant="ghost" size="icon" class="md:hidden" onclick={onMenuClick}>
    <Menu class="h-5 w-5" />
    <span class="sr-only">{m.header_toggle_menu()}</span>
  </Button>

  <div class="flex-1">
    <h1 class="text-lg font-semibold">{title}</h1>
  </div>

  <div class="flex items-center gap-2">
    <NotificationBell
      unreadCount={notificationCount}
      {notifications}
      onMarkAsRead={handleMarkAsRead}
      onMarkAllAsRead={handleMarkAllAsRead}
      onDelete={handleDeleteNotification}
      onOpen={handleNotificationOpen}
      loading={notificationLoading}
    />
    <LanguageSelector />
    <ThemeToggle />

    <!-- User Menu -->
    <div class="user-menu-container relative">
      <button
        type="button"
        class="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent"
        onclick={toggleUserMenu}
        aria-expanded={userMenuOpen}
        aria-haspopup="true"
      >
        {#if userAvatar}
          <img
            src={userAvatar}
            alt={userName || 'User'}
            class="h-8 w-8 rounded-full object-cover"
          />
        {:else}
          <div
            class="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground"
          >
            {getInitials(userName)}
          </div>
        {/if}
        <span class="hidden text-sm font-medium md:inline">{userName || 'User'}</span>
        <ChevronDown class={cn('h-4 w-4 transition-transform', userMenuOpen && 'rotate-180')} />
      </button>

      {#if userMenuOpen}
        <div
          class="absolute right-0 top-full z-50 mt-1 w-48 rounded-md border bg-popover p-1 shadow-md"
        >
          <a
            href="/profile"
            class="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
            onclick={closeUserMenu}
          >
            <User class="h-4 w-4" />
            Profile
          </a>
          <div class="my-1 h-px bg-border"></div>
          <form action="/auth/logout" method="POST" class="w-full">
            <button
              type="submit"
              class="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive hover:bg-accent"
            >
              <LogOut class="h-4 w-4" />
              {m.header_logout()}
            </button>
          </form>
        </div>
      {/if}
    </div>
  </div>
</header>
