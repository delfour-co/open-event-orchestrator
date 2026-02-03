<script lang="ts">
import { cn } from '$lib/utils'
import type { Snippet } from 'svelte'
import type { HTMLAttributes } from 'svelte/elements'

interface Props extends HTMLAttributes<HTMLTableSectionElement> {
  class?: string
  children: Snippet
}

const { class: className, children, ...restProps }: Props = $props()
</script>

<thead class={cn('[&_tr]:border-b', className)} {...restProps}>
  {@render children()}
</thead>
