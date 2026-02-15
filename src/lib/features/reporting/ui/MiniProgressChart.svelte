<script lang="ts">
import * as Card from '$lib/components/ui/card'
import { cn } from '$lib/utils'
import type { Snippet } from 'svelte'

type Props = {
  title: string
  current: number
  total: number
  icon?: Snippet
  color?: string
  class?: string
}

const {
  title,
  current,
  total,
  icon,
  color = 'hsl(var(--primary))',
  class: className
}: Props = $props()

const percentage = $derived(total > 0 ? Math.round((current / total) * 100) : 0)
const circumference = 2 * Math.PI * 40
const strokeDashoffset = $derived(circumference - (percentage / 100) * circumference)
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
    <div class="flex items-center gap-4">
      <div class="relative h-20 w-20 shrink-0">
        <svg viewBox="0 0 100 100" class="h-full w-full -rotate-90">
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="currentColor"
            stroke-width="12"
            class="text-muted"
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke={color}
            stroke-width="12"
            stroke-linecap="round"
            stroke-dasharray={circumference}
            stroke-dashoffset={strokeDashoffset}
            class="transition-all duration-500"
          />
        </svg>
        <div class="absolute inset-0 flex items-center justify-center">
          <span class="text-lg font-bold">{percentage}%</span>
        </div>
      </div>
      <div class="flex flex-col">
        <span class="text-2xl font-bold">{current.toLocaleString('en-US')}</span>
        <span class="text-sm text-muted-foreground">of {total.toLocaleString('en-US')}</span>
      </div>
    </div>
  </Card.Content>
</Card.Root>
