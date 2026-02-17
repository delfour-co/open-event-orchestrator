<script lang="ts">
import { invalidateAll } from '$app/navigation'
import { page } from '$app/stores'
import { Header, Sidebar } from '$lib/components/layout'
import type { Notification } from '$lib/features/notifications'
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
  if (path.startsWith('/admin/reporting')) return 'Reporting'
  if (path.startsWith('/admin/billing')) return 'Billing'
  if (path.startsWith('/admin/budget')) return 'Budget'
  if (path.startsWith('/admin/planning')) return 'Planning'
  if (path.startsWith('/admin/cfp')) return 'Call for Papers'
  if (path.startsWith('/admin/sponsoring')) return 'Sponsoring'
  if (path.startsWith('/admin/crm')) return 'CRM'
  if (path.startsWith('/admin/emails')) return 'Emails'
  if (path.startsWith('/admin/events')) return 'Events'
  if (path.startsWith('/admin/editions')) return 'Editions'
  if (path.startsWith('/admin/organizations')) return 'Organizations'
  if (path.startsWith('/admin/settings')) return 'Settings'
  if (path.startsWith('/admin/app')) return 'Attendee App'
  return 'Dashboard'
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
