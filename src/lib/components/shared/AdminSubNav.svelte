<script lang="ts">
import { page } from '$app/stores'

export interface NavItem {
  href: string
  label: string
  badge?: number
}

interface Props {
  basePath: string
  items: NavItem[]
}

const { basePath, items }: Props = $props()

const isActive = (href: string): boolean => {
  const currentPath = $page.url.pathname
  // Exact match for dashboard (base path)
  if (href === basePath) {
    return currentPath === basePath
  }
  // For other items, check if current path starts with the href
  return currentPath.startsWith(href)
}
</script>

<nav class="flex gap-1 rounded-lg border bg-muted/40 p-1">
  {#each items as item}
    <a
      href={item.href}
      class="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors {isActive(item.href)
        ? 'bg-background shadow-sm'
        : 'text-muted-foreground hover:bg-background hover:shadow-sm'}"
    >
      {item.label}
      {#if item.badge !== undefined && item.badge > 0}
        <span class="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-medium text-primary-foreground">
          {item.badge}
        </span>
      {/if}
    </a>
  {/each}
</nav>
