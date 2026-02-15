<script lang="ts">
import { Button } from '$lib/components/ui/button'
import { Select } from '$lib/components/ui/select'
import { cn } from '$lib/utils'
import { Loader2, Maximize2, Minimize2, RefreshCw, Settings } from 'lucide-svelte'
import type { RefreshInterval } from '../domain/dashboard'

type Props = {
  title: string
  subtitle?: string
  isRefreshing?: boolean
  refreshInterval?: RefreshInterval
  isFullscreen?: boolean
  showSettings?: boolean
  lastUpdated?: Date
  onRefresh?: () => void
  onRefreshIntervalChange?: (interval: RefreshInterval) => void
  onToggleFullscreen?: () => void
  onOpenSettings?: () => void
  class?: string
}

const {
  title,
  subtitle,
  isRefreshing = false,
  refreshInterval = 'off',
  isFullscreen = false,
  showSettings = false,
  lastUpdated,
  onRefresh,
  onRefreshIntervalChange,
  onToggleFullscreen,
  onOpenSettings,
  class: className
}: Props = $props()

const refreshOptions: { value: RefreshInterval; label: string }[] = [
  { value: 'off', label: 'Manual' },
  { value: '30s', label: '30 seconds' },
  { value: '1m', label: '1 minute' },
  { value: '5m', label: '5 minutes' },
  { value: '15m', label: '15 minutes' }
]

const formatLastUpdated = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(date)
}

const handleIntervalChange = (e: Event) => {
  const target = e.target as HTMLSelectElement
  if (onRefreshIntervalChange) {
    onRefreshIntervalChange(target.value as RefreshInterval)
  }
}
</script>

<div class={cn('flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between', className)}>
  <div>
    <h2 class="text-2xl font-bold tracking-tight">{title}</h2>
    {#if subtitle}
      <p class="text-sm text-muted-foreground">{subtitle}</p>
    {/if}
  </div>

  <div class="flex flex-wrap items-center gap-2">
    {#if lastUpdated}
      <span class="text-xs text-muted-foreground">Last updated: {formatLastUpdated(lastUpdated)}</span
      >
    {/if}

    {#if onRefreshIntervalChange}
      <Select class="w-[140px]" value={refreshInterval} onchange={handleIntervalChange}>
        {#each refreshOptions as option}
          <option value={option.value}>{option.label}</option>
        {/each}
      </Select>
    {/if}

    {#if onRefresh}
      <Button variant="outline" size="icon" onclick={onRefresh} disabled={isRefreshing}>
        {#if isRefreshing}
          <Loader2 class="h-4 w-4 animate-spin" />
        {:else}
          <RefreshCw class="h-4 w-4" />
        {/if}
      </Button>
    {/if}

    {#if onToggleFullscreen}
      <Button variant="outline" size="icon" onclick={onToggleFullscreen}>
        {#if isFullscreen}
          <Minimize2 class="h-4 w-4" />
        {:else}
          <Maximize2 class="h-4 w-4" />
        {/if}
      </Button>
    {/if}

    {#if showSettings && onOpenSettings}
      <Button variant="outline" size="icon" onclick={onOpenSettings}>
        <Settings class="h-4 w-4" />
      </Button>
    {/if}
  </div>
</div>
