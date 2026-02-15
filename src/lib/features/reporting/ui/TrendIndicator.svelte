<script lang="ts">
import { cn } from '$lib/utils'
import { ArrowDown, ArrowUp, Minus } from 'lucide-svelte'
import type { TrendDirection } from '../domain/widget'

type Props = {
  direction: TrendDirection
  value: number
  label?: string
  class?: string
}

const { direction, value, label, class: className }: Props = $props()

const directionStyles: Record<TrendDirection, string> = {
  up: 'text-green-600 dark:text-green-400',
  down: 'text-red-600 dark:text-red-400',
  neutral: 'text-muted-foreground'
}

const formattedValue = $derived(() => {
  const prefix = direction === 'up' ? '+' : direction === 'down' ? '-' : ''
  return `${prefix}${Math.abs(value)}%`
})
</script>

<div class={cn('inline-flex items-center gap-1 text-sm', directionStyles[direction], className)}>
  {#if direction === 'up'}
    <ArrowUp class="h-4 w-4" />
  {:else if direction === 'down'}
    <ArrowDown class="h-4 w-4" />
  {:else}
    <Minus class="h-4 w-4" />
  {/if}
  <span class="font-medium">{formattedValue()}</span>
  {#if label}
    <span class="text-muted-foreground">{label}</span>
  {/if}
</div>
