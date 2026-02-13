<script lang="ts">
import '../../../app.css'
import { page } from '$app/stores'
import { scheduleCacheService } from '$lib/features/planning/services/schedule-cache-service'
import { onMount } from 'svelte'

interface Props {
  children: import('svelte').Snippet
}

const { children }: Props = $props()

let isOnline = $state(true)
let cacheStatus = $state<{ cached: boolean; lastUpdated: number | null }>({
  cached: false,
  lastUpdated: null
})

onMount(() => {
  // Register service worker
  registerServiceWorker()

  // Check initial state
  isOnline = navigator.onLine

  // Update cache status
  updateCacheStatus()

  // Setup connectivity listeners
  const handleOnline = () => {
    isOnline = true
  }
  const handleOffline = () => {
    isOnline = false
  }

  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
})

async function registerServiceWorker(): Promise<void> {
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('/sw-app.js')
    } catch (err) {
      console.error('Service worker registration failed:', err)
    }
  }
}

async function updateCacheStatus(): Promise<void> {
  const editionSlug = $page.params.editionSlug
  if (editionSlug) {
    cacheStatus = await scheduleCacheService.getCacheStats(editionSlug)
  }
}

function formatLastUpdated(timestamp: number | null): string {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}
</script>

<svelte:head>
  <link rel="manifest" href="/manifest-app.json" />
  <meta name="theme-color" content="#3b82f6" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="Event Schedule" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
</svelte:head>

<div class="min-h-screen bg-background">
  <!-- Status bar -->
  <div class="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2 text-sm {isOnline ? 'bg-blue-600' : 'bg-amber-600'} text-white">
    <div class="flex items-center gap-2">
      <span class="h-2 w-2 rounded-full {isOnline ? 'bg-blue-300' : 'bg-amber-300'}"></span>
      <span>{isOnline ? 'Online' : 'Offline'}</span>
    </div>
    {#if cacheStatus.cached && cacheStatus.lastUpdated}
      <span class="text-xs opacity-80">
        Cached {formatLastUpdated(cacheStatus.lastUpdated)}
      </span>
    {/if}
  </div>

  <div class="pt-10">
    {@render children()}
  </div>
</div>
