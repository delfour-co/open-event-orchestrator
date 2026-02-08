<script lang="ts">
import { cn } from '$lib/utils'
import type { Snippet } from 'svelte'
import type { HTMLAttributes } from 'svelte/elements'
import { formatCurrency, formatNumber } from './utils'

type Props = HTMLAttributes<HTMLDivElement> & {
  title: string
  value: number | string
  description?: string
  icon?: Snippet
  trend?: { value: number; label?: string }
  format?: 'number' | 'currency' | 'percent' | 'none'
  currency?: string
  class?: string
}

const {
  title,
  value,
  description,
  icon,
  trend,
  format = 'none',
  currency = 'EUR',
  class: className,
  ...restProps
}: Props = $props()

const formattedValue = $derived.by(() => {
  if (typeof value === 'string') return value
  switch (format) {
    case 'number':
      return formatNumber(value)
    case 'currency':
      return formatCurrency(value, currency)
    case 'percent':
      return `${value}%`
    default:
      return String(value)
  }
})

const trendColor = $derived(
  trend
    ? trend.value > 0
      ? 'text-green-600'
      : trend.value < 0
        ? 'text-red-600'
        : 'text-gray-500'
    : ''
)
</script>

<div
  class={cn('rounded-lg border bg-card p-6 shadow-sm', className)}
  {...restProps}
>
  <div class="flex items-start justify-between">
    <div class="flex-1">
      <p class="text-sm font-medium text-muted-foreground">{title}</p>
      <p class="mt-2 text-3xl font-bold tracking-tight text-foreground">{formattedValue}</p>

      {#if description || trend}
        <div class="mt-2 flex items-center gap-2 text-sm">
          {#if trend}
            <span class={cn('font-medium', trendColor)}>
              {trend.value > 0 ? '+' : ''}{trend.value}%
            </span>
            {#if trend.label}
              <span class="text-muted-foreground">{trend.label}</span>
            {/if}
          {/if}
          {#if description}
            <span class="text-muted-foreground">{description}</span>
          {/if}
        </div>
      {/if}
    </div>

    {#if icon}
      <div class="rounded-full bg-primary/10 p-3 text-primary">
        {@render icon()}
      </div>
    {/if}
  </div>
</div>
