<script lang="ts">
import { cn } from '$lib/utils'
import type { Snippet } from 'svelte'

type Props = {
  children: Snippet
  columns?: 1 | 2 | 3 | 4
  class?: string
}

const { children, columns = 4, class: className }: Props = $props()

const columnClasses: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
}
</script>

<div class={cn('grid gap-4', columnClasses[columns], className)}>
  {@render children()}
</div>
