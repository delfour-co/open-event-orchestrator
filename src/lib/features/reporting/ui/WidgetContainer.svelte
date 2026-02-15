<script lang="ts">
import * as Card from '$lib/components/ui/card'
import { cn } from '$lib/utils'
import { AlertCircle, GripVertical, Loader2 } from 'lucide-svelte'
import type { Snippet } from 'svelte'
import type { WidgetSize } from '../domain/widget'

type Props = {
  title: string
  size?: WidgetSize
  loading?: boolean
  error?: string
  draggable?: boolean
  lastUpdated?: Date
  children: Snippet
  actions?: Snippet
  class?: string
}

const {
  title,
  size = 'small',
  loading = false,
  error,
  draggable = false,
  lastUpdated,
  children,
  actions,
  class: className
}: Props = $props()

const sizeClasses: Record<WidgetSize, string> = {
  small: 'col-span-1',
  medium: 'col-span-1 md:col-span-2',
  large: 'col-span-1 md:col-span-2 lg:col-span-3',
  full: 'col-span-full'
}

const formatTime = (date: Date): string => {
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}
</script>

<Card.Root class={cn(sizeClasses[size], className)}>
  <Card.Header class="pb-2">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        {#if draggable}
          <GripVertical class="h-4 w-4 cursor-grab text-muted-foreground" />
        {/if}
        <Card.Title class="text-sm font-medium">{title}</Card.Title>
      </div>
      <div class="flex items-center gap-2">
        {#if lastUpdated}
          <span class="text-xs text-muted-foreground">
            {formatTime(lastUpdated)}
          </span>
        {/if}
        {#if actions}
          {@render actions()}
        {/if}
      </div>
    </div>
  </Card.Header>
  <Card.Content>
    {#if loading}
      <div class="flex h-24 items-center justify-center">
        <Loader2 class="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    {:else if error}
      <div class="flex h-24 items-center justify-center gap-2 text-destructive">
        <AlertCircle class="h-5 w-5" />
        <span class="text-sm">{error}</span>
      </div>
    {:else}
      {@render children()}
    {/if}
  </Card.Content>
</Card.Root>
