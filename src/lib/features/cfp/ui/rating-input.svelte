<script lang="ts">
import { getRatingLabel } from '$lib/features/cfp/domain'
import { cn } from '$lib/utils'
import { Star } from 'lucide-svelte'

interface Props {
  value?: number
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  onValueChange?: (value: number) => void
}

let {
  value = $bindable(0),
  readonly = false,
  size = 'md',
  showLabel = false,
  onValueChange
}: Props = $props()

let hoverValue = $state<number | null>(null)

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6'
}

const displayValue = $derived(hoverValue !== null ? hoverValue : value)
const label = $derived(displayValue > 0 ? getRatingLabel(displayValue) : '')

function handleClick(rating: number) {
  if (readonly) return
  value = rating
  onValueChange?.(rating)
}

function handleMouseEnter(rating: number) {
  if (readonly) return
  hoverValue = rating
}

function handleMouseLeave() {
  hoverValue = null
}
</script>

<div class="flex items-center gap-1">
  <div
    class="flex gap-0.5"
    role={readonly ? 'img' : 'radiogroup'}
    aria-label="Rating"
  >
    {#each [1, 2, 3, 4, 5] as rating}
      <button
        type="button"
        class={cn(
          'transition-colors focus:outline-none',
          readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
        )}
        onclick={() => handleClick(rating)}
        onmouseenter={() => handleMouseEnter(rating)}
        onmouseleave={handleMouseLeave}
        disabled={readonly}
        aria-label={`${rating} star${rating === 1 ? '' : 's'}`}
        aria-checked={value === rating}
        role={readonly ? undefined : 'radio'}
      >
        <Star
          class={cn(
            sizeClasses[size],
            displayValue >= rating
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-gray-300 dark:text-gray-600'
          )}
        />
      </button>
    {/each}
  </div>
  {#if showLabel && label}
    <span class="ml-2 text-sm text-muted-foreground">{label}</span>
  {/if}
</div>
