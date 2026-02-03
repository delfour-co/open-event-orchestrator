<script lang="ts">
import { page } from '$app/stores'
import { cn } from '$lib/utils'
import type { Snippet } from 'svelte'

type Props = {
  children: Snippet
}

const { children }: Props = $props()

const navItems = [
  { href: 'settings', label: 'General' },
  { href: 'settings/categories', label: 'Categories' },
  { href: 'settings/formats', label: 'Formats' }
]

function isActive(href: string): boolean {
  const currentPath = $page.url.pathname
  const basePath = currentPath.split('/settings')[0]
  const fullHref = `${basePath}/${href}`
  return currentPath === fullHref || (href !== 'settings' && currentPath.startsWith(fullHref))
}
</script>

<div class="space-y-6">
  <div>
    <h2 class="text-3xl font-bold tracking-tight">CFP Settings</h2>
    <p class="text-muted-foreground">Configure your Call for Papers</p>
  </div>

  <div class="flex gap-6">
    <!-- Sidebar Navigation -->
    <nav class="w-48 shrink-0">
      <ul class="space-y-1">
        {#each navItems as item}
          <li>
            <a
              href="{$page.url.pathname.split('/settings')[0]}/{item.href}"
              class={cn(
                'block rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive(item.href)
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              )}
            >
              {item.label}
            </a>
          </li>
        {/each}
      </ul>
    </nav>

    <!-- Content -->
    <div class="flex-1">
      {@render children()}
    </div>
  </div>
</div>
