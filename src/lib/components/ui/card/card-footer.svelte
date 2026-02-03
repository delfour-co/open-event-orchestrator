<script lang="ts">
import { cn } from '$lib/utils'
import type { Snippet } from 'svelte'
import type { HTMLAttributes } from 'svelte/elements'

type Props = HTMLAttributes<HTMLDivElement> & {
  children: Snippet
  class?: string
}

const { children, class: className, ...restProps }: Props = $props()
</script>

<div class={cn('flex items-center p-6 pt-0', className)} {...restProps}>
  {@render children()}
</div>
