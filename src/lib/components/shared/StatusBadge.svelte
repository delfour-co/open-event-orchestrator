<script lang="ts">
import { cn } from '$lib/utils'
import type { HTMLAttributes } from 'svelte/elements'
import { getStatusClasses } from './utils'

type Props = HTMLAttributes<HTMLSpanElement> & {
  status: string
  label?: string
  size?: 'sm' | 'md' | 'lg'
  class?: string
}

const { status, label, size = 'md', class: className, ...restProps }: Props = $props()

const displayLabel = $derived(label || status.replace(/_/g, ' '))
const classes = $derived(getStatusClasses(status))

const sizeClasses = {
  sm: 'px-1.5 py-0.5 text-xs',
  md: 'px-2.5 py-0.5 text-xs',
  lg: 'px-3 py-1 text-sm'
}
</script>

<span
  class={cn(
    'inline-flex items-center rounded-full font-medium capitalize',
    classes.bg,
    classes.text,
    sizeClasses[size],
    className
  )}
  {...restProps}
>
  {displayLabel}
</span>
