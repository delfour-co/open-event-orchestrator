<script lang="ts">
import { cn } from '$lib/utils'
import type { Snippet } from 'svelte'
import type { HTMLTableAttributes } from 'svelte/elements'

interface Props extends HTMLTableAttributes {
  class?: string
  children: Snippet
}

const { class: className, children, ...restProps }: Props = $props()
</script>

<div class="relative w-full overflow-auto">
  <table class={cn('w-full caption-bottom text-sm', className)} {...restProps}>
    {@render children()}
  </table>
</div>
