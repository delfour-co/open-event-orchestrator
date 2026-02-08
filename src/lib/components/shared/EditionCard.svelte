<script lang="ts">
import { cn } from '$lib/utils'
import StatusBadge from './StatusBadge.svelte'
import { formatDate } from './utils'

type Edition = {
  id: string
  name: string
  slug: string
  year?: number
  status: string
  startDate?: Date | string
  endDate?: Date | string
}

type Props = {
  edition: Edition
  href?: string
  selected?: boolean
  class?: string
}

const { edition, href, selected = false, class: className }: Props = $props()

const dateRange = $derived.by(() => {
  if (!edition.startDate) return null
  const start = formatDate(edition.startDate, { month: 'short', day: 'numeric' })
  if (!edition.endDate) return start
  const end = formatDate(edition.endDate, { month: 'short', day: 'numeric', year: 'numeric' })
  return `${start} - ${end}`
})
</script>

{#if href}
  <a
    {href}
    class={cn(
      'block rounded-lg border bg-card p-4 transition-all hover:border-primary hover:shadow-md',
      selected && 'border-primary ring-2 ring-primary/20',
      className
    )}
      >
    <div class="flex items-start justify-between gap-2">
      <div class="flex-1 min-w-0">
        <h3 class="font-medium text-foreground truncate">{edition.name}</h3>
        {#if dateRange}
          <p class="mt-1 text-sm text-muted-foreground">{dateRange}</p>
        {:else if edition.year}
          <p class="mt-1 text-sm text-muted-foreground">{edition.year}</p>
        {/if}
      </div>
      <StatusBadge status={edition.status} size="sm" />
    </div>
  </a>
{:else}
  <div
    class={cn(
      'rounded-lg border bg-card p-4',
      selected && 'border-primary ring-2 ring-primary/20',
      className
    )}
      >
    <div class="flex items-start justify-between gap-2">
      <div class="flex-1 min-w-0">
        <h3 class="font-medium text-foreground truncate">{edition.name}</h3>
        {#if dateRange}
          <p class="mt-1 text-sm text-muted-foreground">{dateRange}</p>
        {:else if edition.year}
          <p class="mt-1 text-sm text-muted-foreground">{edition.year}</p>
        {/if}
      </div>
      <StatusBadge status={edition.status} size="sm" />
    </div>
  </div>
{/if}
