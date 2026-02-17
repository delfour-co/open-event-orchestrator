<script lang="ts">
import * as m from '$lib/paraglide/messages.js'
import { cn } from '$lib/utils'
import {
  BarChart3,
  Building2,
  Calendar,
  CalendarDays,
  ChevronLeft,
  Code2,
  Handshake,
  Home,
  LayoutGrid,
  Mail,
  Settings,
  Smartphone,
  Ticket,
  Users,
  Wallet
} from 'lucide-svelte'
import type { Snippet } from 'svelte'

type Props = {
  collapsed?: boolean
  onToggle?: () => void
  children?: Snippet
  isReviewerOnly?: boolean
}

const { collapsed = false, onToggle, isReviewerOnly = false }: Props = $props()

type NavItem = {
  href: string
  icon: typeof Home
  labelKey: keyof typeof navLabels
  badge?: number
  requiresOrganizerAccess?: boolean
}

// Translation functions for navigation labels
const navLabels = {
  dashboard: () => m.nav_dashboard(),
  organizations: () => m.nav_organizations(),
  events: () => m.nav_events(),
  cfp: () => m.nav_cfp(),
  planning: () => m.nav_planning(),
  attendeeApp: () => m.nav_attendee_app(),
  billing: () => m.nav_billing(),
  sponsoring: () => m.nav_sponsoring(),
  budget: () => m.nav_budget(),
  crm: () => m.nav_crm(),
  emails: () => m.nav_emails(),
  reporting: () => m.nav_reporting(),
  api: () => m.nav_api(),
  settings: () => m.nav_settings()
}

const allNavItems: NavItem[] = [
  { href: '/admin', icon: Home, labelKey: 'dashboard' },
  {
    href: '/admin/organizations',
    icon: Building2,
    labelKey: 'organizations',
    requiresOrganizerAccess: true
  },
  { href: '/admin/events', icon: CalendarDays, labelKey: 'events', requiresOrganizerAccess: true },
  { href: '/admin/cfp', icon: Calendar, labelKey: 'cfp' },
  {
    href: '/admin/planning',
    icon: LayoutGrid,
    labelKey: 'planning',
    requiresOrganizerAccess: true
  },
  {
    href: '/admin/app',
    icon: Smartphone,
    labelKey: 'attendeeApp',
    requiresOrganizerAccess: true
  },
  { href: '/admin/billing', icon: Ticket, labelKey: 'billing', requiresOrganizerAccess: true },
  {
    href: '/admin/sponsoring',
    icon: Handshake,
    labelKey: 'sponsoring',
    requiresOrganizerAccess: true
  },
  { href: '/admin/budget', icon: Wallet, labelKey: 'budget', requiresOrganizerAccess: true },
  { href: '/admin/crm', icon: Users, labelKey: 'crm', requiresOrganizerAccess: true },
  { href: '/admin/emails', icon: Mail, labelKey: 'emails', requiresOrganizerAccess: true },
  {
    href: '/admin/reporting',
    icon: BarChart3,
    labelKey: 'reporting',
    requiresOrganizerAccess: true
  },
  { href: '/admin/api', icon: Code2, labelKey: 'api', requiresOrganizerAccess: true }
]

// Filter nav items based on role
const navItems = $derived(
  isReviewerOnly ? allNavItems.filter((item) => !item.requiresOrganizerAccess) : allNavItems
)

// Get translated label for a nav item
function getLabel(labelKey: keyof typeof navLabels): string {
  return navLabels[labelKey]()
}
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
      <span class="text-lg font-semibold">{m.common_app_short_name()}</span>
    {/if}
    <button
      onclick={onToggle}
      class="rounded-md p-2 hover:bg-sidebar-accent"
      aria-label={collapsed ? m.sidebar_expand() : m.sidebar_collapse()}
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
          <span>{getLabel(item.labelKey)}</span>
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

  <!-- Footer - Settings only visible for organizers/admins -->
  {#if !isReviewerOnly}
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
          <span>{m.nav_settings()}</span>
        {/if}
      </a>
    </div>
  {/if}
</aside>
