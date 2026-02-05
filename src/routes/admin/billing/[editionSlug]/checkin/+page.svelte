<script lang="ts">
import { enhance } from '$app/forms'
import { invalidateAll } from '$app/navigation'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { ArrowLeft, Camera, CheckCircle, Keyboard, Loader2, XCircle } from 'lucide-svelte'
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
        // Auto-submit
        const formEl = document.getElementById('checkin-form') as HTMLFormElement
        if (formEl) formEl.requestSubmit()
      },
      () => {
        // QR code scan error - ignore
      }
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
    } catch {
      // Ignore stop errors
    }
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
  return () => {
    stopScanner()
  }
})
</script>

<svelte:head>
	<title>Check-in - {data.edition.name} - Open Event Orchestrator</title>
</svelte:head>

<div class="mx-auto max-w-xl space-y-6">
	<div class="flex items-center gap-4">
		<a href="/admin/billing/{data.edition.slug}">
			<Button variant="ghost" size="icon">
				<ArrowLeft class="h-5 w-5" />
			</Button>
		</a>
		<div>
			<h2 class="text-3xl font-bold tracking-tight">Check-in</h2>
			<p class="text-muted-foreground">{data.edition.name}</p>
		</div>
	</div>

	<!-- Stats -->
	<Card.Root>
		<Card.Content class="flex items-center justify-between p-6">
			<div>
				<div class="text-sm text-muted-foreground">Checked in</div>
				<div class="text-3xl font-bold">
					{data.stats.checkedIn} / {data.stats.total}
				</div>
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

	<!-- Mode Toggle -->
	<div class="flex gap-2">
		<Button
			variant={mode === 'manual' ? 'default' : 'outline'}
			onclick={() => (mode = 'manual')}
			class="flex-1 gap-2"
		>
			<Keyboard class="h-4 w-4" />
			Manual Entry
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
				<div id="qr-scanner" bind:this={scannerContainer} class="overflow-hidden rounded-lg">
				</div>
				<p class="mt-2 text-center text-sm text-muted-foreground">
					Point camera at the QR code on the ticket
				</p>
			</Card.Content>
		</Card.Root>
	{/if}

	<!-- Manual Entry Form -->
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
					placeholder="Enter ticket number or scan QR..."
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
