<script lang="ts">
import { StatusBadge } from '$lib/components/shared'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { ArrowRight, Calendar, FileText, Settings } from 'lucide-svelte'
import type { PageData } from './$types'

interface Props {
  data: PageData
}

const { data }: Props = $props()

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date)
}
</script>

<svelte:head>
  <title>CFP Management - Open Event Orchestrator</title>
</svelte:head>

<div class="space-y-6">
  <div>
    <h2 class="text-3xl font-bold tracking-tight">CFP Management</h2>
    <p class="text-muted-foreground">Select an edition to manage its Call for Papers submissions.</p>
  </div>

  {#if data.editions.length === 0}
    <Card.Root>
      <Card.Content class="flex flex-col items-center justify-center py-12">
        <FileText class="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 class="text-lg font-semibold">No editions available</h3>
        <p class="text-sm text-muted-foreground">
          Create and publish an edition to start managing CFP submissions.
        </p>
      </Card.Content>
    </Card.Root>
  {:else}
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {#each data.editions as edition}
        <Card.Root class="transition-shadow hover:shadow-md">
          <Card.Header>
            <div class="flex items-start justify-between">
              <Card.Title class="flex items-center gap-2">
                <Calendar class="h-5 w-5" />
                {edition.name}
              </Card.Title>
              <div class="flex items-center gap-2">
                <a href="/admin/editions/{edition.slug}/settings" title="Change edition status">
                  <StatusBadge status={edition.status} size="sm" />
                </a>
                {#if data.permissions.canManageSettings}
                  <a href="/admin/cfp/{edition.slug}/settings" title="CFP Settings">
                    <Button variant="ghost" size="icon" class="h-8 w-8">
                      <Settings class="h-4 w-4" />
                    </Button>
                  </a>
                {/if}
              </div>
            </div>
            <Card.Description>
              {formatDate(edition.startDate)} - {formatDate(edition.endDate)}
            </Card.Description>
          </Card.Header>
          <Card.Content>
            <a href="/admin/cfp/{edition.slug}/submissions">
              <Button class="w-full" variant="outline">
                Manage Submissions
                <ArrowRight class="ml-2 h-4 w-4" />
              </Button>
            </a>
          </Card.Content>
        </Card.Root>
      {/each}
    </div>
  {/if}
</div>
