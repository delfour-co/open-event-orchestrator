<script lang="ts">
import * as Card from '$lib/components/ui/card'
import { cn } from '$lib/utils'
import { Loader2 } from 'lucide-svelte'
import type { Snippet } from 'svelte'
import type { ProgressData } from '../domain/widget'

type Props = {
  data: ProgressData
  loading?: boolean
  icon?: Snippet
  class?: string
}

const { data, loading = false, icon, class: className }: Props = $props()

const percentage = $derived(() => {
  if (data.total === 0) return 0
  return Math.min(Math.round((data.current / data.total) * 100), 100)
})

const formatValue = (value: number, unit?: string): string => {
  const formatted = new Intl.NumberFormat('fr-FR').format(value)
  return unit ? `${formatted} ${unit}` : formatted
}
</script>

<Card.Root class={cn('', className)}>
  <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
    <Card.Title class="text-sm font-medium">{data.label}</Card.Title>
    {#if icon}
      <div class="text-muted-foreground">
        {@render icon()}
      </div>
    {/if}
  </Card.Header>
  <Card.Content>
    {#if loading}
      <div class="flex items-center gap-2">
        <Loader2 class="h-4 w-4 animate-spin" />
        <span class="text-muted-foreground">Loading...</span>
      </div>
    {:else}
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <span class="text-2xl font-bold">
            {formatValue(data.current, data.unit)}
          </span>
          <span class="text-sm text-muted-foreground">
            / {formatValue(data.total, data.unit)}
          </span>
        </div>
        <div class="relative h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            class="absolute left-0 top-0 h-full rounded-full bg-primary transition-all duration-300"
            style="width: {percentage()}%"
          ></div>
        </div>
        <p class="text-xs text-muted-foreground">
          {percentage()}% complete
        </p>
      </div>
    {/if}
  </Card.Content>
</Card.Root>
