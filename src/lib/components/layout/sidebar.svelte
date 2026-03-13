<script lang="ts">
import { browser } from '$app/environment'
import * as m from '$lib/paraglide/messages.js'
import { cn } from '$lib/utils'
import {
  BarChart3,
  Building2,
  Calendar,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  Code2,
  Handshake,
  Home,
  LayoutGrid,
  Mail,
  MessageSquare,
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

type NavSection = {
  id: string
  labelFn: () => string
  items: NavItem[]
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
  feedback: () => m.nav_feedback(),
  reporting: () => m.nav_reporting(),
  api: () => m.nav_api(),
  settings: () => m.nav_settings()
}

const STORAGE_KEY = 'oeo-sidebar-sections'

function loadCollapsedSections(): Set<string> {
  if (!browser) return new Set()
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return new Set(JSON.parse(stored))
  } catch {
    // Ignore
  }
  return new Set()
}

function saveCollapsedSections(sections: Set<string>): void {
  if (!browser) return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...sections]))
  } catch {
    // Ignore
  }
}

let collapsedSections = $state(loadCollapsedSections())

function toggleSection(sectionId: string): void {
  const next = new Set(collapsedSections)
  if (next.has(sectionId)) {
    next.delete(sectionId)
  } else {
    next.add(sectionId)
  }
  collapsedSections = next
  saveCollapsedSections(next)
}

// Dashboard stands alone at the top
const dashboardItem: NavItem = { href: '/admin', icon: Home, labelKey: 'dashboard' }

const allSections: NavSection[] = [
  {
    id: 'setup',
    labelFn: () => m.sidebar_section_setup(),
    requiresOrganizerAccess: true,
    items: [
      {
        href: '/admin/organizations',
        icon: Building2,
        labelKey: 'organizations',
        requiresOrganizerAccess: true
      },
      {
        href: '/admin/events',
        icon: CalendarDays,
        labelKey: 'events',
        requiresOrganizerAccess: true
      }
    ]
  },
  {
    id: 'pre-event',
    labelFn: () => m.sidebar_section_pre_event(),
    items: [
      { href: '/admin/cfp', icon: Calendar, labelKey: 'cfp' },
      {
        href: '/admin/planning',
        icon: LayoutGrid,
        labelKey: 'planning',
        requiresOrganizerAccess: true
      },
      { href: '/admin/billing', icon: Ticket, labelKey: 'billing', requiresOrganizerAccess: true },
      {
        href: '/admin/sponsoring',
        icon: Handshake,
        labelKey: 'sponsoring',
        requiresOrganizerAccess: true
      }
    ]
  },
  {
    id: 'event',
    labelFn: () => m.sidebar_section_event(),
    requiresOrganizerAccess: true,
    items: [
      {
        href: '/admin/app',
        icon: Smartphone,
        labelKey: 'attendeeApp',
        requiresOrganizerAccess: true
      }
    ]
  },
  {
    id: 'post-event',
    labelFn: () => m.sidebar_section_post_event(),
    requiresOrganizerAccess: true,
    items: [
      {
        href: '/admin/feedback',
        icon: MessageSquare,
        labelKey: 'feedback',
        requiresOrganizerAccess: true
      },
      {
        href: '/admin/reporting',
        icon: BarChart3,
        labelKey: 'reporting',
        requiresOrganizerAccess: true
      }
    ]
  },
  {
    id: 'management',
    labelFn: () => m.sidebar_section_management(),
    requiresOrganizerAccess: true,
    items: [
      { href: '/admin/budget', icon: Wallet, labelKey: 'budget', requiresOrganizerAccess: true },
      { href: '/admin/crm', icon: Users, labelKey: 'crm', requiresOrganizerAccess: true },
      { href: '/admin/emails', icon: Mail, labelKey: 'emails', requiresOrganizerAccess: true }
    ]
  },
  {
    id: 'developer',
    labelFn: () => m.sidebar_section_developer(),
    requiresOrganizerAccess: true,
    items: [{ href: '/admin/api', icon: Code2, labelKey: 'api', requiresOrganizerAccess: true }]
  }
]

// Filter sections based on role
const sections = $derived(
  isReviewerOnly
    ? allSections
        .filter((s) => !s.requiresOrganizerAccess)
        .map((s) => ({
          ...s,
          items: s.items.filter((item) => !item.requiresOrganizerAccess)
        }))
        .filter((s) => s.items.length > 0)
    : allSections
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
  <nav class="flex-1 overflow-y-auto p-2">
    <!-- Dashboard (always visible, standalone) -->
    <a
      href={dashboardItem.href}
      title={collapsed ? getLabel(dashboardItem.labelKey) : undefined}
      class={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        collapsed && 'justify-center'
      )}
    >
      <dashboardItem.icon class="h-5 w-5 shrink-0" />
      {#if !collapsed}
        <span>{getLabel(dashboardItem.labelKey)}</span>
      {/if}
    </a>

    <!-- Sections -->
    {#each sections as section}
      <div class="mt-3">
        <!-- Section header -->
        {#if !collapsed}
          <button
            onclick={() => toggleSection(section.id)}
            class="flex w-full items-center justify-between px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 transition-colors hover:text-muted-foreground"
          >
            <span>{section.labelFn()}</span>
            <ChevronDown
              class={cn(
                'h-3 w-3 transition-transform',
                collapsedSections.has(section.id) && '-rotate-90'
              )}
            />
          </button>
        {:else}
          <div class="mx-auto my-1 h-px w-8 bg-sidebar-accent"></div>
        {/if}

        <!-- Section items -->
        {#if !collapsedSections.has(section.id) || collapsed}
          <div class="mt-0.5 space-y-0.5">
            {#each section.items as item}
              <a
                href={item.href}
                title={collapsed ? getLabel(item.labelKey) : undefined}
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
          </div>
        {/if}
      </div>
    {/each}
  </nav>

  <!-- Footer - Settings only visible for organizers/admins -->
  {#if !isReviewerOnly}
    <div class="border-t p-2">
      <a
        href="/admin/settings"
        title={collapsed ? m.nav_settings() : undefined}
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
