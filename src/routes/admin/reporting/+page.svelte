<script lang="ts">
import { StatusBadge } from '$lib/components/shared'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { ArrowRight, BarChart3, Calendar, Eye, EyeOff } from 'lucide-svelte'
import type { PageData } from './$types'

interface Props {
  data: PageData
}

const { data }: Props = $props()

let showArchived = $state(false)

// Filter editions by archived status
const filteredEditions = $derived(
  showArchived ? data.editions : data.editions.filter((e) => e.status !== 'archived')
)

// Count archived editions
const archivedCount = $derived(data.editions.filter((e) => e.status === 'archived').length)

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date)
}
</script>

<svelte:head>
  <title>Reporting - Open Event Orchestrator</title>
</svelte:head>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-3xl font-bold tracking-tight">Reporting</h2>
      <p class="text-muted-foreground">
        Select an edition to view its dashboard and metrics.
      </p>
    </div>
    {#if archivedCount > 0}
      <Button variant="outline" onclick={() => (showArchived = !showArchived)}>
        {#if showArchived}
          <EyeOff class="mr-2 h-4 w-4" />
          Hide Archived ({archivedCount})
        {:else}
          <Eye class="mr-2 h-4 w-4" />
          Show Archived ({archivedCount})
        {/if}
      </Button>
    {/if}
  </div>

  {#if filteredEditions.length === 0}
    <Card.Root>
      <Card.Content class="flex flex-col items-center justify-center py-12">
        <BarChart3 class="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 class="text-lg font-semibold">No editions available</h3>
        <p class="text-sm text-muted-foreground">
          {#if !showArchived && archivedCount > 0}
            All editions are archived.
            <button class="text-primary underline" onclick={() => (showArchived = true)}>
              Show archived editions
            </button>
          {:else}
            Create and publish an edition to start tracking metrics.
          {/if}
        </p>
      </Card.Content>
    </Card.Root>
  {:else}
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {#each filteredEditions as edition}
        <Card.Root
          class="transition-shadow hover:shadow-md {edition.status === 'archived'
            ? 'opacity-60'
            : ''}"
        >
          <Card.Header>
            <div class="flex items-start justify-between">
              <Card.Title class="flex items-center gap-2">
                <Calendar class="h-5 w-5" />
                {edition.name}
              </Card.Title>
              <a href="/admin/editions/{edition.slug}/settings" title="Change edition status">
                <StatusBadge status={edition.status} size="sm" />
              </a>
            </div>
            <Card.Description>
              {formatDate(edition.startDate)} - {formatDate(edition.endDate)}
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <a href="/admin/reporting/{edition.slug}">
              <Button class="w-full" variant="outline">
                <BarChart3 class="mr-2 h-4 w-4" />
                View Dashboard
                <ArrowRight class="ml-2 h-4 w-4" />
              </Button>
            </a>
          </Card.Content>
        </Card.Root>
      {/each}
    </div>
  {/if}
</div>
