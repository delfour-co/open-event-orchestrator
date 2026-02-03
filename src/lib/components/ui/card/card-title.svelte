<script lang="ts">
import { cn } from '$lib/utils'
import type { Snippet } from 'svelte'
import type { HTMLAttributes } from 'svelte/elements'

type Props = HTMLAttributes<HTMLHeadingElement> & {
  children: Snippet
  class?: string
}

const { children, class: className, ...restProps }: Props = $props()
</script>

<h3 class={cn('text-2xl font-semibold leading-none tracking-tight', className)} {...restProps}>
  {@render children()}
</h3>
