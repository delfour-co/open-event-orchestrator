<script lang="ts">
import { cn } from '$lib/utils'
import { Bell } from 'lucide-svelte'

type Props = {
  count: number
  class?: string
}

const { count, class: className }: Props = $props()

const badgeColor = $derived(() => {
  if (count === 0) return 'bg-muted text-muted-foreground'
  if (count <= 3) return 'bg-yellow-500 text-white'
  return 'bg-red-500 text-white'
})
</script>

<div class={cn('relative inline-flex', className)}>
  <Bell class="h-5 w-5" />
  {#if count > 0}
    <span
      class={cn(
        'absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs font-bold',
        badgeColor()
      )}
    >
      {count > 99 ? '99+' : count}
    </span>
  {/if}
</div>
