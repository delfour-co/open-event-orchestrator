<script lang="ts">
import { cn } from '$lib/utils'
import type { Snippet } from 'svelte'
import type { HTMLAttributes } from 'svelte/elements'

type Props = HTMLAttributes<HTMLParagraphElement> & {
  children: Snippet
  class?: string
}

const { children, class: className, ...restProps }: Props = $props()
</script>

<p class={cn('text-sm text-muted-foreground', className)} {...restProps}>
  {@render children()}
</p>
