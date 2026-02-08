<script lang="ts">
import { cn } from '$lib/utils'
import type { Snippet } from 'svelte'
import type { HTMLAttributes } from 'svelte/elements'

type Props = HTMLAttributes<HTMLDivElement> & {
  title: string
  description?: string
  icon?: Snippet
  action?: Snippet
  class?: string
}

const { title, description, icon, action, class: className, ...restProps }: Props = $props()
</script>

<div
  class={cn(
    'flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center',
    className
  )}
  {...restProps}
>
  {#if icon}
    <div class="mb-4 text-muted-foreground">
      {@render icon()}
    </div>
  {:else}
    <svg
      class="mb-4 h-12 w-12 text-muted-foreground"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="1.5"
        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
      />
    </svg>
  {/if}

  <h3 class="mb-1 text-lg font-medium text-foreground">{title}</h3>

  {#if description}
    <p class="mb-4 max-w-sm text-sm text-muted-foreground">{description}</p>
  {/if}

  {#if action}
    <div class="mt-2">
      {@render action()}
    </div>
  {/if}
</div>
