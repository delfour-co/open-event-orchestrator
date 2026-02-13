<script lang="ts">
import { goto } from '$app/navigation'
import { offlineSyncService } from '$lib/features/billing/services/offline-sync-service'
import { ticketCacheService } from '$lib/features/billing/services/ticket-cache-service'
import { onMount } from 'svelte'
import type { PageData } from './$types'

interface Props {
  data: PageData
}

const { data }: Props = $props()

// Scanner state
let html5QrCode: unknown = null
let isScanning = $state(false)
let isInitializing = $state(true)
let scanError = $state<string | null>(null)

// Result state
type ScanResult = {
  success: boolean
  offline: boolean
  attendeeName: string
  ticketNumber: string
  error?: string
}
let lastResult = $state<ScanResult | null>(null)
let showResult = $state(false)

// Cache state
let cacheStats = $state<{ total: number; lastUpdated: number | null }>({
  total: 0,
  lastUpdated: null
})
let isDownloading = $state(false)
let downloadError = $state<string | null>(null)

// History
let scanHistory = $state<Array<{ time: Date; result: ScanResult }>>([])
const MAX_HISTORY = 10

// Check online status
let isOnline = $state(true)
let cleanupConnectivity: (() => void) | undefined

onMount(() => {
  console.log('[Scanner] onMount called, edition:', data.edition?.name)

  if (!data.edition) {
    console.log('[Scanner] No edition, redirecting to /scan')
    goto('/scan')
    return
  }

  isOnline = navigator.onLine
  console.log('[Scanner] Online status:', isOnline)

  cleanupConnectivity = offlineSyncService.setupConnectivityListeners(
    () => {
      isOnline = true
    },
    () => {
      isOnline = false
    }
  )

  // Load cache stats and start scanner
  console.log('[Scanner] Loading cache stats...')
  updateCacheStats().then(() => {
    console.log('[Scanner] Cache stats loaded, starting scanner...')
    startScanner()
  })

  // Cleanup on unmount
  return () => {
    console.log('[Scanner] Cleanup called')
    stopScanner()
    cleanupConnectivity?.()
  }
})

async function updateCacheStats() {
  if (!data.edition) return
  cacheStats = await ticketCacheService.getCacheStats(data.edition.id)
}

async function downloadTickets() {
  if (!data.edition || isDownloading) return

  isDownloading = true
  downloadError = null

  try {
    await offlineSyncService.downloadTickets(data.edition.id, window.location.origin)
    await updateCacheStats()
    downloadError = null
  } catch (err) {
    downloadError = err instanceof Error ? err.message : 'Download failed'
  } finally {
    isDownloading = false
  }
}

async function startScanner() {
  console.log('[Scanner] startScanner called, isScanning:', isScanning)
  if (isScanning) {
    console.log('[Scanner] Already scanning, skipping')
    return
  }

  isInitializing = true
  scanError = null
  console.log('[Scanner] Starting initialization...')

  // Wait a tick for the DOM to update and container to be ready
  await new Promise((resolve) => setTimeout(resolve, 100))

  try {
    console.log('[Scanner] Importing html5-qrcode...')
    const { Html5Qrcode } = await import('html5-qrcode')
    console.log('[Scanner] html5-qrcode imported successfully')

    // Get available cameras first
    console.log('[Scanner] Getting available cameras...')
    const devices = await Html5Qrcode.getCameras()
    console.log('[Scanner] Cameras found:', devices.length, devices)

    if (!devices || devices.length === 0) {
      throw new Error('No cameras found on this device')
    }

    console.log('[Scanner] Creating Html5Qrcode instance...')
    html5QrCode = new Html5Qrcode('qr-scanner')

    // Try to find back camera, fallback to first available
    const backCamera = devices.find(
      (d) =>
        d.label.toLowerCase().includes('back') ||
        d.label.toLowerCase().includes('rear') ||
        d.label.toLowerCase().includes('environment')
    )
    const cameraId = backCamera?.id || devices[0].id
    console.log(
      '[Scanner] Selected camera:',
      cameraId,
      backCamera ? '(back camera)' : '(first available)'
    )

    // Add timeout to prevent hanging
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        console.log('[Scanner] Timeout reached!')
        reject(new Error('Camera initialization timed out'))
      }, 10000)
    })

    console.log('[Scanner] Starting camera with ID:', cameraId)
    const startPromise = (
      html5QrCode as {
        start: (
          cameraId: string,
          config: { fps: number; qrbox: { width: number; height: number }; aspectRatio: number },
          onSuccess: (text: string) => void,
          onFailure: () => void
        ) => Promise<void>
      }
    ).start(
      cameraId,
      {
        fps: 10,
        qrbox: { width: 280, height: 280 },
        aspectRatio: 1.0
      },
      handleScan,
      () => {
        /* ignore scan errors */
      }
    )

    await Promise.race([startPromise, timeoutPromise])

    console.log('[Scanner] Camera started successfully!')
    isScanning = true
    isInitializing = false
    scanError = null
  } catch (err) {
    console.error('[Scanner] Failed to start scanner:', err)
    scanError = err instanceof Error ? err.message : 'Camera access denied or not available'
    isScanning = false
    isInitializing = false
  }
}

async function stopScanner() {
  if (html5QrCode) {
    try {
      await (html5QrCode as { stop: () => Promise<void> }).stop()
    } catch {
      // Ignore stop errors
    }
    html5QrCode = null
    isScanning = false
  }
}

async function handleScan(decodedText: string) {
  // Pause scanner during processing
  await stopScanner()

  // Parse QR code - might be JSON or plain ticket number
  let ticketNumber = decodedText
  try {
    const qrData = JSON.parse(decodedText)
    if (qrData.ticketNumber) {
      ticketNumber = qrData.ticketNumber
    }
  } catch {
    // Not JSON, use as-is
  }

  // Perform check-in
  await performCheckIn(ticketNumber)

  // Resume scanner after delay
  setTimeout(() => {
    startScanner()
  }, 2000)
}

async function performCheckIn(ticketNumber: string) {
  if (!data.edition || !data.user) return

  let result: ScanResult

  if (isOnline) {
    // Online check-in via API
    try {
      const response = await fetch('/api/scan/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketNumber,
          editionId: data.edition.id,
          checkedInBy: data.user.id
        })
      })

      const responseData = (await response.json()) as {
        success: boolean
        ticket?: { attendeeName: string; ticketNumber: string }
        error?: string
      }

      if (responseData.success) {
        result = {
          success: true,
          offline: false,
          attendeeName: responseData.ticket?.attendeeName || 'Unknown',
          ticketNumber: responseData.ticket?.ticketNumber || ticketNumber
        }
      } else {
        result = {
          success: false,
          offline: false,
          attendeeName: '',
          ticketNumber,
          error: responseData.error || 'Check-in failed'
        }
      }
    } catch {
      // Network error, fall back to offline
      result = await performOfflineCheckIn(ticketNumber)
    }
  } else {
    // Offline check-in
    result = await performOfflineCheckIn(ticketNumber)
  }

  // Update state
  lastResult = result
  showResult = true

  // Add to history
  scanHistory = [{ time: new Date(), result }, ...scanHistory.slice(0, MAX_HISTORY - 1)]

  // Auto-hide result after delay
  setTimeout(() => {
    showResult = false
  }, 3000)
}

async function performOfflineCheckIn(ticketNumber: string): Promise<ScanResult> {
  if (!data.edition || !data.user) {
    return {
      success: false,
      offline: true,
      attendeeName: '',
      ticketNumber,
      error: 'Not authenticated'
    }
  }

  const result = await offlineSyncService.checkInOffline(
    ticketNumber,
    data.edition.id,
    data.user.id
  )

  if (result.success && result.ticket) {
    return {
      success: true,
      offline: true,
      attendeeName: `${result.ticket.attendeeFirstName} ${result.ticket.attendeeLastName}`,
      ticketNumber
    }
  }

  return {
    success: false,
    offline: true,
    attendeeName: result.ticket
      ? `${result.ticket.attendeeFirstName} ${result.ticket.attendeeLastName}`
      : '',
    ticketNumber,
    error: result.error || 'Check-in failed'
  }
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}
</script>

<svelte:head>
  <title>Scanning - {data.edition?.name || 'Scanner'}</title>
</svelte:head>

<div class="flex min-h-[calc(100vh-2.5rem)] flex-col">
  <!-- Header -->
  <div class="flex items-center justify-between border-b px-4 py-3">
    <div class="flex items-center gap-3">
      <a href="/scan" class="rounded-lg p-2 hover:bg-muted" aria-label="Back to edition selection">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m15 18-6-6 6-6"/>
        </svg>
      </a>
      <div>
        <h1 class="font-semibold">{data.edition?.name || 'Unknown'}</h1>
        <p class="text-xs text-muted-foreground">
          {cacheStats.total} tickets cached
        </p>
      </div>
    </div>
    <div class="flex items-center gap-2">
      <button
        onclick={downloadTickets}
        disabled={isDownloading || !isOnline}
        class="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm hover:bg-muted/80 disabled:opacity-50"
      >
        {#if isDownloading}
          <svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Downloading...</span>
        {:else}
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" x2="12" y1="15" y2="3"/>
          </svg>
          <span>Download offline</span>
        {/if}
      </button>
      <form method="POST" action="/auth/logout">
        <button
          type="submit"
          class="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm hover:bg-muted/80"
          title="Logout"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" x2="9" y1="12" y2="12"/>
          </svg>
        </button>
      </form>
    </div>
  </div>

  {#if downloadError}
    <div class="mx-4 mt-2 rounded-lg bg-red-100 p-3 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-200">
      {downloadError}
    </div>
  {/if}

  <!-- Scanner area -->
  <div class="relative flex-1 bg-black" style="min-height: 400px;">
    <!-- Always render scanner container so it's available for html5-qrcode -->
    <div
      id="qr-scanner"
      class="h-full w-full"
    ></div>

    <!-- Scan overlay when scanning -->
    {#if isScanning && !scanError}
      <div class="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div class="h-72 w-72 rounded-2xl border-4 border-white/50"></div>
      </div>
    {/if}

    <!-- Error overlay -->
    {#if scanError}
      <div class="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-background">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24"/>
          <path d="m1 9 3-3 3 3"/>
          <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24"/>
          <path d="m17 9-3-3-3 3"/>
        </svg>
        <p class="mt-4 text-lg font-medium">{scanError}</p>
        <button
          onclick={() => { isInitializing = true; scanError = null; startScanner(); }}
          class="mt-4 rounded-lg bg-primary px-6 py-3 text-primary-foreground"
        >
          Try Again
        </button>
      </div>
    {:else if isInitializing && !isScanning}
      <!-- Loading overlay -->
      <div class="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-background">
        <svg class="h-12 w-12 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="mt-4 text-muted-foreground">Initializing camera...</p>
      </div>
    {/if}

    <!-- Result overlay -->
    {#if showResult && lastResult}
      <div
        class="absolute inset-0 flex items-center justify-center bg-black/50 transition-opacity"
        class:opacity-100={showResult}
        class:opacity-0={!showResult}
      >
        <div
          class="mx-4 w-full max-w-sm rounded-2xl p-6 text-center {lastResult.success ? 'bg-green-500' : 'bg-red-500'} text-white"
        >
          {#if lastResult.success}
            <svg xmlns="http://www.w3.org/2000/svg" class="mx-auto h-20 w-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <p class="mt-4 text-2xl font-bold">{lastResult.attendeeName}</p>
            <p class="mt-1 text-sm opacity-80">{lastResult.ticketNumber}</p>
            {#if lastResult.offline}
              <p class="mt-2 text-xs opacity-70">Checked in offline</p>
            {/if}
          {:else}
            <svg xmlns="http://www.w3.org/2000/svg" class="mx-auto h-20 w-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" x2="9" y1="9" y2="15"/>
              <line x1="9" x2="15" y1="9" y2="15"/>
            </svg>
            <p class="mt-4 text-xl font-bold">{lastResult.error}</p>
            {#if lastResult.attendeeName}
              <p class="mt-1 text-sm opacity-80">{lastResult.attendeeName}</p>
            {/if}
          {/if}
        </div>
      </div>
    {/if}
  </div>

  <!-- Recent scans -->
  {#if scanHistory.length > 0}
    <div class="border-t">
      <div class="px-4 py-2">
        <h2 class="text-sm font-medium text-muted-foreground">Recent Scans</h2>
      </div>
      <div class="max-h-40 overflow-y-auto">
        {#each scanHistory as scan}
          <div class="flex items-center gap-3 border-t px-4 py-2">
            <span class="h-3 w-3 rounded-full {scan.result.success ? 'bg-green-500' : 'bg-red-500'}"></span>
            <div class="flex-1 truncate">
              <span class="text-sm font-medium">
                {scan.result.attendeeName || scan.result.ticketNumber}
              </span>
              {#if scan.result.offline}
                <span class="ml-1 text-xs text-muted-foreground">(offline)</span>
              {/if}
            </div>
            <span class="text-xs text-muted-foreground">{formatTime(scan.time)}</span>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>
