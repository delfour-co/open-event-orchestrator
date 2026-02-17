<script lang="ts">
import * as m from '$lib/paraglide/messages.js'
import { cn } from '$lib/utils'
import type { HTMLAttributes } from 'svelte/elements'

type Props = HTMLAttributes<HTMLElement> & {
  currentPage: number
  totalPages: number
  totalItems?: number
  perPage?: number
  onPageChange: (page: number) => void
  showInfo?: boolean
  class?: string
}

const {
  currentPage,
  totalPages,
  totalItems,
  perPage = 10,
  onPageChange,
  showInfo = true,
  class: className,
  ...restProps
}: Props = $props()

const pages = $derived.by(() => {
  const delta = 2
  const range: (number | 'ellipsis')[] = []

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
      range.push(i)
    } else if (range[range.length - 1] !== 'ellipsis') {
      range.push('ellipsis')
    }
  }

  return range
})

const startItem = $derived((currentPage - 1) * perPage + 1)
const endItem = $derived(Math.min(currentPage * perPage, totalItems || 0))
</script>

<nav
  class={cn('flex items-center justify-between', className)}
  aria-label="Pagination"
  {...restProps}
>
  {#if showInfo && totalItems}
    <p class="text-sm text-muted-foreground">
      {m.pagination_showing_results({ start: startItem, end: endItem, total: totalItems })}
    </p>
  {:else}
    <div></div>
  {/if}

  <div class="flex items-center gap-1">
    <button
      type="button"
      class={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-md border text-sm font-medium',
        'hover:bg-accent hover:text-accent-foreground',
        'disabled:pointer-events-none disabled:opacity-50'
      )}
      disabled={currentPage === 1}
      onclick={() => onPageChange(currentPage - 1)}
      aria-label={m.pagination_previous()}
    >
      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
    </button>

    {#each pages as page}
      {#if page === 'ellipsis'}
        <span class="px-2 text-muted-foreground">...</span>
      {:else}
        <button
          type="button"
          class={cn(
            'inline-flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium',
            page === currentPage
              ? 'bg-primary text-primary-foreground'
              : 'border hover:bg-accent hover:text-accent-foreground'
          )}
          onclick={() => onPageChange(page)}
          aria-current={page === currentPage ? 'page' : undefined}
        >
          {page}
        </button>
      {/if}
    {/each}

    <button
      type="button"
      class={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-md border text-sm font-medium',
        'hover:bg-accent hover:text-accent-foreground',
        'disabled:pointer-events-none disabled:opacity-50'
      )}
      disabled={currentPage === totalPages}
      onclick={() => onPageChange(currentPage + 1)}
      aria-label={m.pagination_next()}
    >
      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
    </button>
  </div>
</nav>
