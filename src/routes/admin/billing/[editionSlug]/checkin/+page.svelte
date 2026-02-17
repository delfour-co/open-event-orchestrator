<script lang="ts">
import { enhance } from '$app/forms'
import { invalidateAll } from '$app/navigation'
import { AdminSubNav } from '$lib/components/shared'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { getBillingNavItems } from '$lib/config'
import {
  Activity,
  ArrowLeft,
  BarChart3,
  Camera,
  CheckCircle,
  Keyboard,
  Loader2,
  RefreshCw,
  User,
  Users,
  XCircle
} from 'lucide-svelte'
import { onMount } from 'svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

let mode = $state<'manual' | 'scanner'>('manual')
let ticketInput = $state('')
let isSubmitting = $state(false)
let scannerContainer = $state<HTMLDivElement | null>(null)
let html5QrCode: unknown = null
let isRefreshing = $state(false)

// Auto-refresh interval
let refreshInterval: ReturnType<typeof setInterval> | null = null
const REFRESH_INTERVAL_MS = 10000 // 10 seconds

// Auto-clear result after delay
let showResult = $state(false)

$effect(() => {
  if (form) {
    showResult = true
    if (form.success) {
      ticketInput = ''
      invalidateAll()
    }
    const timer = setTimeout(() => {
      showResult = false
    }, 5000)
    return () => {
      clearTimeout(timer)
    }
  }
  return undefined
})

async function refreshData() {
  isRefreshing = true
  await invalidateAll()
  isRefreshing = false
}

function startAutoRefresh() {
  if (refreshInterval) return
  refreshInterval = setInterval(refreshData, REFRESH_INTERVAL_MS)
}

function stopAutoRefresh() {
  if (refreshInterval) {
    clearInterval(refreshInterval)
    refreshInterval = null
  }
}

async function startScanner() {
  if (!scannerContainer) return

  try {
    const { Html5Qrcode } = await import('html5-qrcode')
    html5QrCode = new Html5Qrcode('qr-scanner')

    await (
      html5QrCode as {
        start: (
          facingMode: { facingMode: string },
          config: { fps: number; qrbox: { width: number; height: number } },
          onSuccess: (text: string) => void,
          onFailure: () => void
        ) => Promise<void>
      }
    ).start(
      { facingMode: 'environment' },
      {
        fps: 10,
        qrbox: { width: 250, height: 250 }
      },
      (decodedText: string) => {
        ticketInput = decodedText
        stopScanner()
        const formEl = document.getElementById('checkin-form') as HTMLFormElement
        if (formEl) formEl.requestSubmit()
      },
      () => {}
    )
  } catch (err) {
    console.error('Failed to start scanner:', err)
    mode = 'manual'
  }
}

async function stopScanner() {
  if (html5QrCode) {
    try {
      await (html5QrCode as { stop: () => Promise<void> }).stop()
    } catch {}
    html5QrCode = null
  }
}

$effect(() => {
  if (mode === 'scanner' && scannerContainer) {
    startScanner()
  } else {
    stopScanner()
  }
})

onMount(() => {
  startAutoRefresh()
  return () => {
    stopScanner()
    stopAutoRefresh()
  }
})

function formatTime(isoDate: string): string {
  const date = new Date(isoDate)
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function formatTimeAgo(isoDate: string): string {
  const date = new Date(isoDate)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'just now'
  if (diffMins === 1) return '1 min ago'
  if (diffMins < 60) return `${diffMins} min ago`

  const diffHours = Math.floor(diffMins / 60)
  if (diffHours === 1) return '1 hour ago'
  return `${diffHours} hours ago`
}
</script>

<svelte:head>
	<title>Check-in Control - {data.edition.name} - Open Event Orchestrator</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-4">
			<a href="/admin/billing/{data.edition.slug}">
				<Button variant="ghost" size="icon">
					<ArrowLeft class="h-5 w-5" />
				</Button>
			</a>
			<div>
				<h2 class="text-3xl font-bold tracking-tight">Check-in Control</h2>
				<p class="text-muted-foreground">{data.edition.name}</p>
			</div>
		</div>
		<div class="flex items-center gap-2">
			<Button variant="outline" size="sm" onclick={refreshData} disabled={isRefreshing} class="gap-2">
				<RefreshCw class="h-4 w-4 {isRefreshing ? 'animate-spin' : ''}" />
				Refresh
			</Button>
			<a href="/admin/billing/{data.edition.slug}/checkin/stats">
				<Button variant="outline" size="sm" class="gap-2">
					<BarChart3 class="h-4 w-4" />
					Stats
				</Button>
			</a>
		</div>
	</div>

	<!-- Sub-navigation -->
	<AdminSubNav basePath="/admin/billing/{data.edition.slug}" items={getBillingNavItems(data.edition.slug)} />

	<!-- Global Stats -->
	<Card.Root>
		<Card.Content class="flex items-center justify-between p-6">
			<div>
				<div class="text-sm text-muted-foreground">Checked in</div>
				<div class="text-3xl font-bold">
					{data.stats.checkedIn} / {data.stats.total}
				</div>
			</div>
			<div class="text-center">
				<div class="text-sm text-muted-foreground">Active Scanners</div>
				<div class="text-3xl font-bold">{data.scanners.length}</div>
			</div>
			<div class="text-right">
				<div class="text-sm text-muted-foreground">Progress</div>
				<div class="text-3xl font-bold">
					{data.stats.total > 0
						? Math.round((data.stats.checkedIn / data.stats.total) * 100)
						: 0}%
				</div>
			</div>
		</Card.Content>
		<div class="px-6 pb-4">
			<div class="h-3 w-full rounded-full bg-muted">
				<div
					class="h-3 rounded-full bg-green-500 transition-all"
					style="width: {data.stats.total > 0
						? (data.stats.checkedIn / data.stats.total) * 100
						: 0}%"
				></div>
			</div>
		</div>
	</Card.Root>

	<!-- Two Column Layout -->
	<div class="grid gap-6 lg:grid-cols-2">
		<!-- Left Column: Scanner -->
		<div class="space-y-4">
			<h3 class="flex items-center gap-2 text-lg font-semibold">
				<Camera class="h-5 w-5" />
				Scanner Station
			</h3>

			<!-- Mode Toggle -->
			<div class="flex gap-2">
				<Button
					variant={mode === 'manual' ? 'default' : 'outline'}
					onclick={() => (mode = 'manual')}
					class="flex-1 gap-2"
				>
					<Keyboard class="h-4 w-4" />
					Manual
				</Button>
				<Button
					variant={mode === 'scanner' ? 'default' : 'outline'}
					onclick={() => (mode = 'scanner')}
					class="flex-1 gap-2"
				>
					<Camera class="h-4 w-4" />
					Scan QR
				</Button>
			</div>

			<!-- Scanner View -->
			{#if mode === 'scanner'}
				<Card.Root>
					<Card.Content class="p-4">
						<div id="qr-scanner" bind:this={scannerContainer} class="overflow-hidden rounded-lg"></div>
						<p class="mt-2 text-center text-sm text-muted-foreground">
							Point camera at the QR code
						</p>
					</Card.Content>
				</Card.Root>
			{/if}

			<!-- Manual Entry Form -->
			{#if mode === 'manual'}
				<Card.Root>
					<Card.Content class="p-6">
						<form
							id="checkin-form"
							method="POST"
							action="?/checkIn"
							use:enhance={() => {
								isSubmitting = true
								return async ({ update }) => {
									isSubmitting = false
									await update()
								}
							}}
							class="flex gap-2"
						>
							<Input
								name="ticketInput"
								placeholder="Enter ticket number..."
								bind:value={ticketInput}
								class="flex-1"
								autofocus
							/>
							<Button type="submit" disabled={isSubmitting || !ticketInput.trim()}>
								{#if isSubmitting}
									<Loader2 class="h-4 w-4 animate-spin" />
								{:else}
									Check In
								{/if}
							</Button>
						</form>
					</Card.Content>
				</Card.Root>
			{/if}

			<!-- Hidden form for scanner auto-submit -->
			{#if mode === 'scanner'}
				<form
					id="checkin-form"
					method="POST"
					action="?/checkIn"
					use:enhance={() => {
						isSubmitting = true
						return async ({ update }) => {
							isSubmitting = false
							await update()
						}
					}}
					class="hidden"
				>
					<input type="hidden" name="ticketInput" bind:value={ticketInput} />
				</form>
			{/if}

			<!-- Result -->
			{#if showResult && form}
				{#if form.success}
					<Card.Root class="border-green-500 bg-green-50 dark:bg-green-950">
						<Card.Content class="flex items-center gap-4 p-6">
							<CheckCircle class="h-12 w-12 text-green-600" />
							<div>
								<div class="text-lg font-bold text-green-800 dark:text-green-200">
									Check-in Successful
								</div>
								<div class="text-green-700 dark:text-green-300">
									{form.attendeeName}
								</div>
								<div class="text-sm text-green-600 dark:text-green-400">
									{form.ticketNumber}
								</div>
							</div>
						</Card.Content>
					</Card.Root>
				{:else}
					<Card.Root class="border-red-500 bg-red-50 dark:bg-red-950">
						<Card.Content class="flex items-center gap-4 p-6">
							<XCircle class="h-12 w-12 text-red-600" />
							<div>
								<div class="text-lg font-bold text-red-800 dark:text-red-200">
									Check-in Failed
								</div>
								<div class="text-red-700 dark:text-red-300">
									{form.error}
								</div>
								{#if form.attendeeName}
									<div class="text-sm text-red-600 dark:text-red-400">
										{form.attendeeName}
									</div>
								{/if}
							</div>
						</Card.Content>
					</Card.Root>
				{/if}
			{/if}
		</div>

		<!-- Right Column: Control Tower -->
		<div class="space-y-4">
			<!-- Field Scanners -->
			<div>
				<h3 class="mb-3 flex items-center gap-2 text-lg font-semibold">
					<Users class="h-5 w-5" />
					Field Scanners
				</h3>
				<Card.Root>
					<Card.Content class="p-0">
						{#if data.scanners.length === 0}
							<div class="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
								<User class="mb-2 h-8 w-8" />
								<p>No scanners active yet</p>
								<p class="text-sm">Check-ins will appear here</p>
							</div>
						{:else}
							<div class="divide-y">
								{#each data.scanners as scanner}
									<div class="flex items-center justify-between px-4 py-3">
										<div class="flex items-center gap-3">
											<div class="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
												<User class="h-4 w-4 text-primary" />
											</div>
											<div>
												<div class="font-medium">{scanner.name}</div>
												<div class="text-xs text-muted-foreground">
													Last: {formatTimeAgo(scanner.lastActivity)}
												</div>
											</div>
										</div>
										<div class="text-right">
											<div class="text-xl font-bold text-green-600">{scanner.count}</div>
											<div class="text-xs text-muted-foreground">scans</div>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</Card.Content>
				</Card.Root>
			</div>

			<!-- Recent Activity -->
			<div>
				<h3 class="mb-3 flex items-center gap-2 text-lg font-semibold">
					<Activity class="h-5 w-5" />
					Recent Activity
				</h3>
				<Card.Root>
					<Card.Content class="p-0">
						{#if data.recentCheckIns.length === 0}
							<div class="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
								<Activity class="mb-2 h-8 w-8" />
								<p>No check-ins yet</p>
							</div>
						{:else}
							<div class="max-h-[400px] divide-y overflow-y-auto">
								{#each data.recentCheckIns as checkIn}
									<div class="flex items-center justify-between px-4 py-2">
										<div class="flex items-center gap-3">
											<CheckCircle class="h-4 w-4 text-green-500" />
											<div>
												<div class="text-sm font-medium">{checkIn.name}</div>
												<div class="text-xs text-muted-foreground">
													{checkIn.ticketNumber}
												</div>
											</div>
										</div>
										<div class="text-right">
											<div class="text-xs text-muted-foreground">
												{formatTime(checkIn.checkedInAt)}
											</div>
											<div class="text-xs text-muted-foreground">
												by {checkIn.checkedInBy}
											</div>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</Card.Content>
				</Card.Root>
			</div>
		</div>
	</div>
</div>
