<script lang="ts">
import * as Card from '$lib/components/ui/card'
import { cn } from '$lib/utils'
import { Loader2 } from 'lucide-svelte'
import type { Snippet } from 'svelte'
import type { MetricData } from '../domain/widget'
import { TrendIndicator } from './index'

type Props = {
  data: MetricData
  loading?: boolean
  icon?: Snippet
  class?: string
}

const { data, loading = false, icon, class: className }: Props = $props()

const formatValue = (
  value: number | string,
  format?: MetricData['format'],
  unit?: string
): string => {
  if (typeof value === 'string') return value

  if (format === 'currency') {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: unit || 'EUR'
    }).format(value)
  }

  if (format === 'percentage') {
    return `${value.toFixed(1)}%`
  }

  if (format === 'number' || !format) {
    return new Intl.NumberFormat('fr-FR').format(value)
  }

  return String(value)
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
      <div class="text-2xl font-bold">
        {formatValue(data.value, data.format, data.unit)}
      </div>
      {#if data.trend}
        <div class="mt-1">
          <TrendIndicator
            direction={data.trend.direction}
            value={data.trend.value}
            label={data.trend.label}
          />
        </div>
      {/if}
    {/if}
  </Card.Content>
</Card.Root>
