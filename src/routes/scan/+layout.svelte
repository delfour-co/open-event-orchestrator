<script lang="ts">
import '../../app.css'
import { offlineSyncService } from '$lib/features/billing/services/offline-sync-service'
import { onMount } from 'svelte'

interface Props {
  children: import('svelte').Snippet
}

const { children }: Props = $props()

let isOnline = $state(true)
let pendingCount = $state(0)
let isSyncing = $state(false)

onMount(() => {
  // Register service worker
  offlineSyncService.registerServiceWorker()

  // Check initial state
  isOnline = navigator.onLine
  updatePendingCount()

  // Setup connectivity listeners
  const cleanup = offlineSyncService.setupConnectivityListeners(
    async () => {
      isOnline = true
      // Auto-sync when back online
      await syncNow()
    },
    () => {
      isOnline = false
    }
  )

  // Periodic pending count update
  const interval = setInterval(updatePendingCount, 5000)

  return () => {
    cleanup()
    clearInterval(interval)
  }
})

async function updatePendingCount() {
  pendingCount = await offlineSyncService.getPendingCount()
}

async function syncNow() {
  if (isSyncing || !isOnline) return
  isSyncing = true
  try {
    await offlineSyncService.syncPendingCheckIns(window.location.origin)
    await updatePendingCount()
  } finally {
    isSyncing = false
  }
}
</script>

<svelte:head>
  <link rel="manifest" href="/manifest.json" />
  <meta name="theme-color" content="#0ea5e9" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="OEO Scanner" />
</svelte:head>

<div class="min-h-screen bg-background">
  <!-- Status bar -->
  <div class="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2 text-sm {isOnline ? 'bg-green-600' : 'bg-amber-600'} text-white">
    <div class="flex items-center gap-2">
      <span class="h-2 w-2 rounded-full {isOnline ? 'bg-green-300' : 'bg-amber-300'}"></span>
      <span>{isOnline ? 'Online' : 'Offline'}</span>
    </div>
    {#if pendingCount > 0}
      <button
        onclick={syncNow}
        disabled={isSyncing || !isOnline}
        class="flex items-center gap-1 rounded bg-white/20 px-2 py-1 text-xs hover:bg-white/30 disabled:opacity-50"
      >
        {#if isSyncing}
          <svg class="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Syncing...
        {:else}
          {pendingCount} pending
        {/if}
      </button>
    {/if}
  </div>

  <div class="pt-10">
    {@render children()}
  </div>
</div>
