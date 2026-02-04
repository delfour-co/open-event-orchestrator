<script lang="ts">
import { Header, Sidebar } from '$lib/components/layout'
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
    }
    isReviewerOnly: boolean
  }
}

const { children, data }: Props = $props()

let sidebarCollapsed = $state(false)

function toggleSidebar() {
  sidebarCollapsed = !sidebarCollapsed
}
</script>

<div class="flex h-screen overflow-hidden">
  <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} isReviewerOnly={data.isReviewerOnly} />

  <div class="flex flex-1 flex-col overflow-hidden">
    <Header onMenuClick={toggleSidebar} userName={data.user.name} />

    <main class="flex-1 overflow-y-auto p-4 md:p-6">
      {@render children()}
    </main>
  </div>
</div>
