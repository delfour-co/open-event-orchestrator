<script lang="ts">
import { page } from '$app/stores'

export interface NavItem {
  href: string
  label: string
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
      class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors {isActive(item.href)
        ? 'bg-background shadow-sm'
        : 'text-muted-foreground hover:bg-background hover:shadow-sm'}"
    >
      {item.label}
    </a>
  {/each}
</nav>
