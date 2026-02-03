<script lang="ts">
import { Button } from '$lib/components/ui/button'
import { Bell, LogOut, Menu } from 'lucide-svelte'
import ThemeToggle from './theme-toggle.svelte'

type Props = {
  onMenuClick?: () => void
  title?: string
  userName?: string
}

const { onMenuClick, title = 'Dashboard', userName }: Props = $props()
</script>

<header class="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
  <Button variant="ghost" size="icon" class="md:hidden" onclick={onMenuClick}>
    <Menu class="h-5 w-5" />
    <span class="sr-only">Toggle menu</span>
  </Button>

  <div class="flex-1">
    <h1 class="text-lg font-semibold">{title}</h1>
  </div>

  <div class="flex items-center gap-2">
    {#if userName}
      <span class="hidden text-sm text-muted-foreground md:inline">{userName}</span>
    {/if}
    <Button variant="ghost" size="icon">
      <Bell class="h-5 w-5" />
      <span class="sr-only">Notifications</span>
    </Button>
    <ThemeToggle />
    <form action="/auth/logout" method="POST">
      <Button type="submit" variant="ghost" size="icon" title="Logout">
        <LogOut class="h-5 w-5" />
        <span class="sr-only">Logout</span>
      </Button>
    </form>
  </div>
</header>
