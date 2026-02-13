<script lang="ts">
import { goto } from '$app/navigation'
import { onMount } from 'svelte'
import type { PageData } from './$types'

interface Props {
  data: PageData
}

const { data }: Props = $props()

let selectedEdition = $state<string>('')
let isLoading = $state(false)

function goToScanner() {
  if (!selectedEdition) return
  isLoading = true
  goto(`/scan/${selectedEdition}`)
}

onMount(() => {
  // If only one edition, auto-select
  if (data.editions.length === 1) {
    selectedEdition = data.editions[0].id
  }
})
</script>

<svelte:head>
  <title>Ticket Scanner - Open Event Orchestrator</title>
</svelte:head>

<div class="flex min-h-[calc(100vh-2.5rem)] flex-col items-center justify-center p-6">
  <div class="w-full max-w-sm space-y-6">
    <div class="text-center">
      <h1 class="text-2xl font-bold">Ticket Scanner</h1>
      <p class="mt-2 text-muted-foreground">Select an edition to start scanning</p>
    </div>

    {#if data.editions.length === 0}
      <div class="rounded-lg border bg-muted/50 p-6 text-center">
        <p class="text-muted-foreground">No editions available</p>
        <p class="mt-2 text-sm text-muted-foreground">
          Make sure you have access to at least one edition with ticketing enabled.
        </p>
      </div>
    {:else}
      <div class="space-y-4">
        <select
          bind:value={selectedEdition}
          class="w-full rounded-lg border bg-background px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Select edition...</option>
          {#each data.editions as edition}
            <option value={edition.id}>{edition.name}</option>
          {/each}
        </select>

        <button
          onclick={goToScanner}
          disabled={!selectedEdition || isLoading}
          class="w-full rounded-lg bg-primary px-6 py-4 text-lg font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {#if isLoading}
            Loading...
          {:else}
            Start Scanning
          {/if}
        </button>
      </div>
    {/if}

    {#if !data.user}
      <div class="text-center text-sm text-muted-foreground">
        <a href="/auth/login?redirect=/scan" class="text-primary underline">
          Login required
        </a>
      </div>
    {/if}
  </div>
</div>
