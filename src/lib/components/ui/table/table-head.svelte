<script lang="ts">
import { cn } from '$lib/utils'
import type { Snippet } from 'svelte'
import type { HTMLThAttributes } from 'svelte/elements'

interface Props extends HTMLThAttributes {
  class?: string
  children?: Snippet
}

const { class: className, children, ...restProps }: Props = $props()
</script>

<th
  class={cn(
    'h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0',
    className
  )}
  {...restProps}
>
  {#if children}
    {@render children()}
  {/if}
</th>
