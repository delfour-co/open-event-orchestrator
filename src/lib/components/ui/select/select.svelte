<script lang="ts">
import { cn } from '$lib/utils'
import type { Snippet } from 'svelte'
import type { HTMLSelectAttributes } from 'svelte/elements'

interface Props extends HTMLSelectAttributes {
  class?: string
  value?: string
  children: Snippet
}

let { class: className, value = $bindable(''), children, ...restProps }: Props = $props()
</script>

<select
  class={cn(
    'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
    className
  )}
  bind:value
  {...restProps}
>
  {@render children()}
</select>
