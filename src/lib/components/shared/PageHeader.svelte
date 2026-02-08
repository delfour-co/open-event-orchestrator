<script lang="ts">
import { cn } from '$lib/utils'
import type { Snippet } from 'svelte'
import type { HTMLAttributes } from 'svelte/elements'

type Props = HTMLAttributes<HTMLDivElement> & {
  title: string
  description?: string
  actions?: Snippet
  breadcrumbs?: Snippet
  class?: string
}

const { title, description, actions, breadcrumbs, class: className, ...restProps }: Props = $props()
</script>

<div class={cn('mb-6', className)} {...restProps}>
  {#if breadcrumbs}
    <div class="mb-2">
      {@render breadcrumbs()}
    </div>
  {/if}

  <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h1 class="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
      {#if description}
        <p class="mt-1 text-sm text-muted-foreground">{description}</p>
      {/if}
    </div>

    {#if actions}
      <div class="flex flex-shrink-0 gap-2">
        {@render actions()}
      </div>
    {/if}
  </div>
</div>
