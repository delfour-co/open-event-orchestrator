<script lang="ts">
import { invalidateAll } from '$app/navigation'
import { page } from '$app/stores'
import { Header, Sidebar } from '$lib/components/layout'
import type { Notification } from '$lib/features/notifications'
import * as m from '$lib/paraglide/messages'
import type { Snippet } from 'svelte'

type Props = {
  children: Snippet
  data: {
    user: {
      id: string
      email: string
      name: string
      role: string
      avatar?: string
      avatarUrl: string | null
    }
    isReviewerOnly: boolean
    notificationCount: number
    notifications: Notification[]
  }
}

const { children, data }: Props = $props()

let sidebarCollapsed = $state(false)

function toggleSidebar() {
  sidebarCollapsed = !sidebarCollapsed
}

// Determine section title from URL path
const sectionTitle = $derived(() => {
  const path = $page.url.pathname
  if (path.startsWith('/admin/reporting')) return m.admin_section_reporting()
  if (path.startsWith('/admin/billing')) return m.admin_section_billing()
  if (path.startsWith('/admin/budget')) return m.admin_section_budget()
  if (path.startsWith('/admin/planning')) return m.admin_section_planning()
  if (path.startsWith('/admin/cfp')) return m.admin_section_cfp()
  if (path.startsWith('/admin/sponsoring')) return m.admin_section_sponsoring()
  if (path.startsWith('/admin/crm')) return m.admin_section_crm()
  if (path.startsWith('/admin/emails')) return m.admin_section_emails()
  if (path.startsWith('/admin/events')) return m.admin_section_events()
  if (path.startsWith('/admin/editions')) return m.admin_section_editions()
  if (path.startsWith('/admin/organizations')) return m.admin_section_organizations()
  if (path.startsWith('/admin/settings')) return m.admin_section_settings()
  if (path.startsWith('/admin/app')) return m.admin_section_attendee_app()
  return m.admin_section_dashboard()
})

async function refreshNotifications(): Promise<void> {
  await invalidateAll()
}
</script>

<div class="flex h-screen overflow-hidden">
  <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} isReviewerOnly={data.isReviewerOnly} />

  <div class="flex flex-1 flex-col overflow-hidden">
    <Header
      onMenuClick={toggleSidebar}
      userName={data.user.name}
      userAvatar={data.user.avatarUrl}
      title={sectionTitle()}
      notificationCount={data.notificationCount}
      notifications={data.notifications}
      onRefreshNotifications={refreshNotifications}
    />

    <main class="flex-1 overflow-y-auto p-4 md:p-6">
      {@render children()}
    </main>
  </div>
</div>
