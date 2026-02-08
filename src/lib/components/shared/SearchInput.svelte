<script lang="ts">
import { cn } from '$lib/utils'

type Props = {
  value?: string
  placeholder?: string
  loading?: boolean
  onSearch?: (value: string) => void
  debounceMs?: number
  class?: string
}

let {
  value = $bindable(''),
  placeholder = 'Search...',
  loading = false,
  onSearch,
  debounceMs = 300,
  class: className
}: Props = $props()

let timeoutId: ReturnType<typeof setTimeout> | null = null

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  value = target.value

  if (onSearch) {
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      onSearch(value)
    }, debounceMs)
  }
}

function handleClear() {
  value = ''
  if (onSearch) onSearch('')
}
</script>

<div class={cn('relative', className)}>
  <svg
    class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>

  <input
    type="search"
    {value}
    {placeholder}
    oninput={handleInput}
    class={cn(
      'h-10 w-full rounded-md border border-input bg-background pl-10 pr-10 text-sm ring-offset-background',
      'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      'disabled:cursor-not-allowed disabled:opacity-50'
    )}
  />

  {#if loading}
    <div class="absolute right-3 top-1/2 -translate-y-1/2">
      <svg class="h-4 w-4 animate-spin text-muted-foreground" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  {:else if value}
    <button
      type="button"
      class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
      onclick={handleClear}
    >
      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  {/if}
</div>
