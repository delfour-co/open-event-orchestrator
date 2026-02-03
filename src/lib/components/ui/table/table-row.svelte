<script lang="ts">
import { cn } from '$lib/utils'
import type { Snippet } from 'svelte'
import type { HTMLAttributes } from 'svelte/elements'

interface Props extends HTMLAttributes<HTMLTableRowElement> {
  class?: string
  children: Snippet
}

const { class: className, children, ...restProps }: Props = $props()
</script>

<tr
  class={cn(
    'border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted',
    className
  )}
  {...restProps}
>
  {@render children()}
</tr>
