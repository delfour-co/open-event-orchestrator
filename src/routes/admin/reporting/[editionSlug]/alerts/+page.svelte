<script lang="ts">
import { enhance } from '$app/forms'
import { invalidateAll } from '$app/navigation'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import type { Alert } from '$lib/features/reporting/domain/alert'
import type {
  AlertThreshold,
  CreateAlertThreshold
} from '$lib/features/reporting/domain/alert-threshold'
import { AlertBadge, AlertList } from '$lib/features/reporting/ui'
import AlertThresholdConfig from '$lib/features/reporting/ui/AlertThresholdConfig.svelte'
import { cn } from '$lib/utils'
import { AlertCircle, AlertTriangle, ArrowLeft, Bell, Info, Settings } from 'lucide-svelte'
import type { PageData } from './$types'

interface Props {
  data: PageData
}

const { data }: Props = $props()

let activeTab = $state('alerts')

// Form refs for programmatic submission
let createThresholdForm: HTMLFormElement
let toggleThresholdForm: HTMLFormElement
let deleteThresholdForm: HTMLFormElement
let acknowledgeForm: HTMLFormElement
let resolveForm: HTMLFormElement
let dismissForm: HTMLFormElement

// Hidden input refs
let createDataInput: HTMLInputElement
let toggleIdInput: HTMLInputElement
let toggleEnabledInput: HTMLInputElement
let deleteIdInput: HTMLInputElement
let acknowledgeIdInput: HTMLInputElement
let resolveIdInput: HTMLInputElement
let dismissIdInput: HTMLInputElement

async function handleAddThreshold(thresholdData: CreateAlertThreshold) {
  if (createDataInput && createThresholdForm) {
    createDataInput.value = JSON.stringify(thresholdData)
    createThresholdForm.requestSubmit()
  }
}

async function handleToggleThreshold(id: string, enabled: boolean) {
  if (toggleIdInput && toggleEnabledInput && toggleThresholdForm) {
    toggleIdInput.value = id
    toggleEnabledInput.value = String(enabled)
    toggleThresholdForm.requestSubmit()
  }
}

async function handleDeleteThreshold(id: string) {
  if (deleteIdInput && deleteThresholdForm) {
    deleteIdInput.value = id
    deleteThresholdForm.requestSubmit()
  }
}

async function handleAcknowledge(alert: Alert) {
  if (acknowledgeIdInput && acknowledgeForm) {
    acknowledgeIdInput.value = alert.id
    acknowledgeForm.requestSubmit()
  }
}

async function handleResolve(alert: Alert) {
  if (resolveIdInput && resolveForm) {
    resolveIdInput.value = alert.id
    resolveForm.requestSubmit()
  }
}

async function handleDismiss(alert: Alert) {
  if (dismissIdInput && dismissForm) {
    dismissIdInput.value = alert.id
    dismissForm.requestSubmit()
  }
}

const activeAlerts = $derived(
  (data.alerts as Alert[]).filter((a) => a.status === 'active' || a.status === 'acknowledged')
)
const resolvedAlerts = $derived(
  (data.alerts as Alert[]).filter((a) => a.status === 'resolved' || a.status === 'dismissed')
)
</script>

<svelte:head>
  <title>Alerts - {data.edition?.name ?? 'Reporting'} - Open Event Orchestrator</title>
</svelte:head>

<!-- Hidden forms for programmatic submission -->
<form
  bind:this={createThresholdForm}
  method="POST"
  action="?/createThreshold"
  use:enhance={() => {
    return async ({ result }) => {
      if (result.type === 'success') {
        await invalidateAll()
      }
    }
  }}
  class="hidden"
>
  <input bind:this={createDataInput} type="hidden" name="data" />
</form>

<form
  bind:this={toggleThresholdForm}
  method="POST"
  action="?/toggleThreshold"
  use:enhance={() => {
    return async ({ result }) => {
      if (result.type === 'success') {
        await invalidateAll()
      }
    }
  }}
  class="hidden"
>
  <input bind:this={toggleIdInput} type="hidden" name="id" />
  <input bind:this={toggleEnabledInput} type="hidden" name="enabled" />
</form>

<form
  bind:this={deleteThresholdForm}
  method="POST"
  action="?/deleteThreshold"
  use:enhance={() => {
    return async ({ result }) => {
      if (result.type === 'success') {
        await invalidateAll()
      }
    }
  }}
  class="hidden"
>
  <input bind:this={deleteIdInput} type="hidden" name="id" />
</form>

<form
  bind:this={acknowledgeForm}
  method="POST"
  action="?/acknowledgeAlert"
  use:enhance={() => {
    return async ({ result }) => {
      if (result.type === 'success') {
        await invalidateAll()
      }
    }
  }}
  class="hidden"
>
  <input bind:this={acknowledgeIdInput} type="hidden" name="id" />
</form>

<form
  bind:this={resolveForm}
  method="POST"
  action="?/resolveAlert"
  use:enhance={() => {
    return async ({ result }) => {
      if (result.type === 'success') {
        await invalidateAll()
      }
    }
  }}
  class="hidden"
>
  <input bind:this={resolveIdInput} type="hidden" name="id" />
</form>

<form
  bind:this={dismissForm}
  method="POST"
  action="?/dismissAlert"
  use:enhance={() => {
    return async ({ result }) => {
      if (result.type === 'success') {
        await invalidateAll()
      }
    }
  }}
  class="hidden"
>
  <input bind:this={dismissIdInput} type="hidden" name="id" />
</form>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-4">
      <a href="/admin/reporting/{data.edition?.slug ?? ''}">
        <Button variant="ghost" size="icon">
          <ArrowLeft class="h-5 w-5" />
        </Button>
      </a>
      <div>
        <div class="flex items-center gap-3">
          <h2 class="text-3xl font-bold tracking-tight">Alerts</h2>
          <AlertBadge count={data.alertCounts.active} />
        </div>
        <p class="text-muted-foreground">
          {data.event.name}
          {#if data.edition}
            - {data.edition.name}
          {/if}
        </p>
      </div>
    </div>
  </div>

  {#if !data.edition}
    <Card.Root>
      <Card.Content class="flex flex-col items-center justify-center py-12">
        <Bell class="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 class="text-lg font-semibold">No edition available</h3>
        <p class="text-sm text-muted-foreground">
          Create an edition for this event to configure alerts.
        </p>
      </Card.Content>
    </Card.Root>
  {:else}
    <!-- Summary cards -->
    <div class="grid gap-4 sm:grid-cols-4">
      <Card.Root>
        <Card.Content class="pt-6">
          <div class="flex items-center gap-2">
            <Bell class="h-5 w-5 text-muted-foreground" />
            <span class="text-2xl font-bold">{data.alertCounts.active}</span>
          </div>
          <p class="text-sm text-muted-foreground">Active Alerts</p>
        </Card.Content>
      </Card.Root>

      <Card.Root class="border-l-4 border-l-blue-500">
        <Card.Content class="pt-6">
          <div class="flex items-center gap-2">
            <Info class="h-5 w-5 text-blue-500" />
            <span class="text-2xl font-bold">{data.alertCounts.byLevel.info}</span>
          </div>
          <p class="text-sm text-muted-foreground">Info</p>
        </Card.Content>
      </Card.Root>

      <Card.Root class="border-l-4 border-l-yellow-500">
        <Card.Content class="pt-6">
          <div class="flex items-center gap-2">
            <AlertTriangle class="h-5 w-5 text-yellow-500" />
            <span class="text-2xl font-bold">{data.alertCounts.byLevel.warning}</span>
          </div>
          <p class="text-sm text-muted-foreground">Warning</p>
        </Card.Content>
      </Card.Root>

      <Card.Root class="border-l-4 border-l-red-500">
        <Card.Content class="pt-6">
          <div class="flex items-center gap-2">
            <AlertCircle class="h-5 w-5 text-red-500" />
            <span class="text-2xl font-bold">{data.alertCounts.byLevel.critical}</span>
          </div>
          <p class="text-sm text-muted-foreground">Critical</p>
        </Card.Content>
      </Card.Root>
    </div>

    <!-- Tabs -->
    <div>
      <div class="flex gap-2 border-b">
        <button
          onclick={() => (activeTab = 'alerts')}
          class={cn(
            'flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors',
            activeTab === 'alerts'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          <Bell class="h-4 w-4" />
          Alerts
          {#if activeAlerts.length > 0}
            <span class="rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">
              {activeAlerts.length}
            </span>
          {/if}
        </button>
        <button
          onclick={() => (activeTab = 'thresholds')}
          class={cn(
            'flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors',
            activeTab === 'thresholds'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          <Settings class="h-4 w-4" />
          Thresholds
          <span class="rounded-full bg-muted px-2 py-0.5 text-xs">
            {data.thresholds.length}
          </span>
        </button>
        <button
          onclick={() => (activeTab = 'history')}
          class={cn(
            'flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors',
            activeTab === 'history'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          History
          <span class="rounded-full bg-muted px-2 py-0.5 text-xs">
            {resolvedAlerts.length}
          </span>
        </button>
      </div>

      <div class="mt-6">
        {#if activeTab === 'alerts'}
          <AlertList
            alerts={activeAlerts}
            onAcknowledge={handleAcknowledge}
            onResolve={handleResolve}
            onDismiss={handleDismiss}
          />
        {:else if activeTab === 'thresholds'}
          <AlertThresholdConfig
            thresholds={data.thresholds as AlertThreshold[]}
            editionId={data.edition.id}
            onAdd={handleAddThreshold}
            onToggle={handleToggleThreshold}
            onDelete={handleDeleteThreshold}
          />
        {:else if activeTab === 'history'}
          {#if resolvedAlerts.length === 0}
            <Card.Root>
              <Card.Content class="flex flex-col items-center justify-center py-8 text-center">
                <Bell class="mb-2 h-10 w-10 text-muted-foreground" />
                <p class="text-sm text-muted-foreground">No resolved alerts yet</p>
              </Card.Content>
            </Card.Root>
          {:else}
            <AlertList alerts={resolvedAlerts} />
          {/if}
        {/if}
      </div>
    </div>
  {/if}
</div>
