<script lang="ts">
import { cn } from '$lib/utils'
import type { Snippet } from 'svelte'
import type { HTMLTdAttributes } from 'svelte/elements'

interface Props extends HTMLTdAttributes {
  class?: string
  children?: Snippet
}

const { class: className, children, ...restProps }: Props = $props()
</script>

<td class={cn('p-4 align-middle [&:has([role=checkbox])]:pr-0', className)} {...restProps}>
  {#if children}
    {@render children()}
  {/if}
</td>
