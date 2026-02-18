<script lang="ts">
import * as Card from '$lib/components/ui/card'
import { getLocale } from '$lib/paraglide/runtime'
import { cn } from '$lib/utils'
import type { Snippet } from 'svelte'

type BarItem = {
  label: string
  value: number
  color?: string
}

type Props = {
  title: string
  items: BarItem[]
  icon?: Snippet
  unit?: string
  class?: string
}

const { title, items, icon, unit, class: className }: Props = $props()

const maxValue = $derived(Math.max(...items.map((i) => i.value), 1))

const formatValue = (value: number): string => {
  const locale = getLocale() === 'fr' ? 'fr-FR' : 'en-US'
  if (unit === 'EUR') {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(value)
  }
  return new Intl.NumberFormat(locale).format(value)
}
</script>

<Card.Root class={cn('', className)}>
  <Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
    <Card.Title class="text-sm font-medium">{title}</Card.Title>
    {#if icon}
      <div class="text-muted-foreground">
        {@render icon()}
      </div>
    {/if}
  </Card.Header>
  <Card.Content>
    <div class="space-y-3">
      {#each items as item}
        <div class="space-y-1">
          <div class="flex items-center justify-between text-sm">
            <span class="text-muted-foreground">{item.label}</span>
            <span class="font-medium">{formatValue(item.value)}</span>
          </div>
          <div class="relative h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              class="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
              style="width: {(item.value / maxValue) * 100}%; background-color: {item.color || 'hsl(var(--primary))'}"
            ></div>
          </div>
        </div>
      {/each}
    </div>
  </Card.Content>
</Card.Root>
