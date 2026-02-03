<script lang="ts">
import { cn } from '$lib/utils'
import {
  Calendar,
  CalendarDays,
  ChevronLeft,
  Home,
  Mail,
  Settings,
  Ticket,
  Users
} from 'lucide-svelte'
import type { Snippet } from 'svelte'

type Props = {
  collapsed?: boolean
  onToggle?: () => void
  children?: Snippet
}

const { collapsed = false, onToggle }: Props = $props()

type NavItem = {
  href: string
  icon: typeof Home
  label: string
  badge?: number
}

const navItems: NavItem[] = [
  { href: '/admin', icon: Home, label: 'Dashboard' },
  { href: '/admin/events', icon: CalendarDays, label: 'Events' },
  { href: '/admin/cfp', icon: Calendar, label: 'CFP' },
  { href: '/admin/planning', icon: Calendar, label: 'Planning' },
  { href: '/admin/tickets', icon: Ticket, label: 'Billetterie' },
  { href: '/admin/crm', icon: Users, label: 'CRM' },
  { href: '/admin/emails', icon: Mail, label: 'Emails' }
]
</script>

<aside
  class={cn(
    'flex h-screen flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-300',
    collapsed ? 'w-16' : 'w-64'
  )}
>
  <!-- Header -->
  <div class="flex h-16 items-center justify-between border-b px-4">
    {#if !collapsed}
      <span class="text-lg font-semibold">OEO</span>
    {/if}
    <button
      onclick={onToggle}
      class="rounded-md p-2 hover:bg-sidebar-accent"
      aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
    >
      <ChevronLeft class={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} />
    </button>
  </div>

  <!-- Navigation -->
  <nav class="flex-1 space-y-1 p-2">
    {#each navItems as item}
      <a
        href={item.href}
        class={cn(
          'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
          collapsed && 'justify-center'
        )}
      >
        <item.icon class="h-5 w-5 shrink-0" />
        {#if !collapsed}
          <span>{item.label}</span>
          {#if item.badge}
            <span
              class="ml-auto rounded-full bg-sidebar-primary px-2 py-0.5 text-xs text-sidebar-primary-foreground"
            >
              {item.badge}
            </span>
          {/if}
        {/if}
      </a>
    {/each}
  </nav>

  <!-- Footer -->
  <div class="border-t p-2">
    <a
      href="/admin/settings"
      class={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        collapsed && 'justify-center'
      )}
    >
      <Settings class="h-5 w-5 shrink-0" />
      {#if !collapsed}
        <span>Settings</span>
      {/if}
    </a>
  </div>
</aside>
