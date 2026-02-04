<script lang="ts">
import { cn } from '$lib/utils'
import { X } from 'lucide-svelte'
import type { Snippet } from 'svelte'
import type { HTMLAttributes } from 'svelte/elements'

interface Props extends HTMLAttributes<HTMLDivElement> {
  class?: string
  children?: Snippet
  onClose?: () => void
}

let { class: className, children, onClose, ...restProps }: Props = $props()

function handleBackdropClick(e: MouseEvent) {
  if (e.target === e.currentTarget && onClose) {
    onClose()
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && onClose) {
    onClose()
  }
}
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- Backdrop -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="fixed inset-0 z-50 bg-black/80 animate-in fade-in-0"
  onclick={handleBackdropClick}
>
  <!-- Content -->
  <div
    class={cn(
      'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg animate-in fade-in-0 zoom-in-95 sm:rounded-lg',
      className
    )}
    role="dialog"
    aria-modal="true"
    {...restProps}
  >
    {@render children?.()}
    {#if onClose}
      <button
        type="button"
        onclick={onClose}
        class="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        <X class="h-4 w-4" />
        <span class="sr-only">Close</span>
      </button>
    {/if}
  </div>
</div>
