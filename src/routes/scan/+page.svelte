<script lang="ts">
import { goto } from '$app/navigation'
import { onMount } from 'svelte'
import type { PageData } from './$types'

interface Props {
  data: PageData
}

const { data }: Props = $props()

let loadingEdition = $state<string | null>(null)

function goToScanner(editionId: string) {
  loadingEdition = editionId
  goto(`/scan/${editionId}`)
}

onMount(() => {
  // If only one edition, auto-navigate
  if (data.editions.length === 1) {
    goToScanner(data.editions[0].id)
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
      <div class="space-y-3">
        {#each data.editions as edition}
          <button
            onclick={() => goToScanner(edition.id)}
            disabled={loadingEdition !== null}
            class="w-full rounded-lg border bg-card p-4 text-left transition-colors hover:bg-accent disabled:opacity-50"
          >
            <div class="flex items-center justify-between">
              <span class="text-lg font-medium">{edition.name}</span>
              {#if loadingEdition === edition.id}
                <svg class="h-5 w-5 animate-spin text-muted-foreground" viewBox="0 0 24 24" fill="none">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              {:else}
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m9 18 6-6-6-6"/>
                </svg>
              {/if}
            </div>
          </button>
        {/each}
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
