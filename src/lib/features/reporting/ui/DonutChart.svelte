<script lang="ts">
import * as Card from '$lib/components/ui/card'
import { cn } from '$lib/utils'
import type { Snippet } from 'svelte'

type ChartSegment = {
  label: string
  value: number
  color: string
}

type Props = {
  title: string
  segments: ChartSegment[]
  icon?: Snippet
  class?: string
}

const { title, segments, icon, class: className }: Props = $props()

const total = $derived(segments.reduce((sum, s) => sum + s.value, 0))

const segmentsWithAngles = $derived(() => {
  let startAngle = 0
  return segments.map((segment) => {
    const percentage = total > 0 ? segment.value / total : 0
    const angle = percentage * 360
    const result = {
      ...segment,
      percentage: Math.round(percentage * 100),
      startAngle,
      endAngle: startAngle + angle
    }
    startAngle += angle
    return result
  })
})

const describeArc = (
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number
): string => {
  const start = polarToCartesian(cx, cy, radius, endAngle)
  const end = polarToCartesian(cx, cy, radius, startAngle)
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'
  return ['M', start.x, start.y, 'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y].join(' ')
}

const polarToCartesian = (
  cx: number,
  cy: number,
  radius: number,
  angleInDegrees: number
): { x: number; y: number } => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0
  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians)
  }
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
    <div class="flex items-center gap-4">
      <div class="relative h-24 w-24 shrink-0">
        <svg viewBox="0 0 100 100" class="h-full w-full -rotate-90">
          {#if total === 0}
            <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" stroke-width="16" class="text-muted" />
          {:else}
            {#each segmentsWithAngles() as segment}
              {#if segment.percentage > 0}
                <path
                  d={describeArc(50, 50, 40, segment.startAngle, segment.endAngle - 0.5)}
                  fill="none"
                  stroke={segment.color}
                  stroke-width="16"
                  stroke-linecap="round"
                />
              {/if}
            {/each}
          {/if}
        </svg>
        <div class="absolute inset-0 flex items-center justify-center">
          <span class="text-lg font-bold">{total}</span>
        </div>
      </div>
      <div class="flex flex-col gap-1.5">
        {#each segments as segment}
          <div class="flex items-center gap-2 text-sm">
            <span class="h-3 w-3 rounded-full shrink-0" style="background-color: {segment.color}"></span>
            <span class="text-muted-foreground">{segment.label}</span>
            <span class="font-medium">{segment.value}</span>
          </div>
        {/each}
      </div>
    </div>
  </Card.Content>
</Card.Root>
