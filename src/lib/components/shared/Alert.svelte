<script lang="ts">
import { cn } from '$lib/utils'
import type { Snippet } from 'svelte'
import type { HTMLAttributes } from 'svelte/elements'

type AlertVariant = 'success' | 'error' | 'warning' | 'info'

type Props = HTMLAttributes<HTMLDivElement> & {
  variant?: AlertVariant
  title?: string
  dismissible?: boolean
  onDismiss?: () => void
  icon?: Snippet
  children: Snippet
  class?: string
}

const {
  variant = 'info',
  title,
  dismissible = false,
  onDismiss,
  icon,
  children,
  class: className,
  ...restProps
}: Props = $props()

const variantClasses: Record<AlertVariant, { container: string; icon: string }> = {
  success: {
    container:
      'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300',
    icon: 'text-green-500'
  },
  error: {
    container:
      'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300',
    icon: 'text-red-500'
  },
  warning: {
    container:
      'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300',
    icon: 'text-yellow-500'
  },
  info: {
    container:
      'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300',
    icon: 'text-blue-500'
  }
}

const icons: Record<AlertVariant, string> = {
  success: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  error: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
  warning:
    'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
}
</script>

<div
  class={cn(
    'flex gap-3 rounded-lg border p-4',
    variantClasses[variant].container,
    className
  )}
  role="alert"
  {...restProps}
>
  {#if icon}
    <div class={cn('flex-shrink-0', variantClasses[variant].icon)}>
      {@render icon()}
    </div>
  {:else}
    <svg
      class={cn('h-5 w-5 flex-shrink-0', variantClasses[variant].icon)}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={icons[variant]} />
    </svg>
  {/if}

  <div class="flex-1">
    {#if title}
      <h3 class="mb-1 font-medium">{title}</h3>
    {/if}
    <div class="text-sm">
      {@render children()}
    </div>
  </div>

  {#if dismissible && onDismiss}
    <button
      type="button"
      aria-label="Dismiss alert"
      class="flex-shrink-0 rounded p-1 opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2"
      onclick={onDismiss}
    >
      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  {/if}
</div>
