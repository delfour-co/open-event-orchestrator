<script lang="ts">
import { cn } from '$lib/utils'
import { Star } from 'lucide-svelte'

interface Props {
  average: number | null
  count: number
  size?: 'sm' | 'md' | 'lg'
  class?: string
}

const { average, count, size = 'md', class: className }: Props = $props()

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6'
}

const textSizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg'
}
</script>

<div class={cn('flex items-center gap-2', className)}>
  {#if average !== null}
    <div class="flex items-center gap-0.5">
      {#each [1, 2, 3, 4, 5] as rating}
        {@const filled = average >= rating}
        {@const partial = !filled && average >= rating - 0.5}
        <Star
          class={cn(
            sizeClasses[size],
            filled
              ? 'fill-yellow-400 text-yellow-400'
              : partial
                ? 'fill-yellow-400/50 text-yellow-400'
                : 'text-gray-300 dark:text-gray-600'
          )}
        />
      {/each}
    </div>
    <span class={cn('font-semibold', textSizeClasses[size])}>{average.toFixed(1)}</span>
    <span class={cn('text-muted-foreground', textSizeClasses[size])}>
      ({count} review{count === 1 ? '' : 's'})
    </span>
  {:else}
    <span class={cn('text-muted-foreground', textSizeClasses[size])}>
      No reviews yet
    </span>
  {/if}
</div>
