<script lang="ts">
import * as Card from '$lib/components/ui/card'
import { cn } from '$lib/utils'
import { AlertCircle, Loader2 } from 'lucide-svelte'
import type { Snippet } from 'svelte'
import type { WidgetConfig, WidgetData } from '../domain/widget'

type Props = {
  config: WidgetConfig
  data: WidgetData
  children: Snippet
  class?: string
}

const { config, data, children, class: className }: Props = $props()

const sizeClasses: Record<WidgetConfig['size'], string> = {
  small: 'col-span-1',
  medium: 'col-span-1 md:col-span-2',
  large: 'col-span-1 md:col-span-2 lg:col-span-3',
  full: 'col-span-full'
}
</script>

<Card.Root class={cn(sizeClasses[config.size], className)}>
  <Card.Header class="pb-2">
    <div class="flex items-center justify-between">
      <Card.Title class="text-sm font-medium">{config.title}</Card.Title>
      {#if data.lastUpdated}
        <span class="text-xs text-muted-foreground">
          {new Intl.DateTimeFormat('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
          }).format(data.lastUpdated)}
        </span>
      {/if}
    </div>
  </Card.Header>
  <Card.Content>
    {#if data.loading}
      <div class="flex h-24 items-center justify-center">
        <Loader2 class="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    {:else if data.error}
      <div class="flex h-24 items-center justify-center gap-2 text-destructive">
        <AlertCircle class="h-5 w-5" />
        <span class="text-sm">{data.error}</span>
      </div>
    {:else}
      {@render children()}
    {/if}
  </Card.Content>
</Card.Root>
