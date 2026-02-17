<script lang="ts">
import { StatusBadge } from '$lib/components/shared'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import * as m from '$lib/paraglide/messages'
import { ArrowRight, Calendar, Eye, EyeOff, FileText, Settings } from 'lucide-svelte'
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
  <title>{m.cfp_management_title()} - {m.common_app_name()}</title>
</svelte:head>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-3xl font-bold tracking-tight">{m.cfp_management_title()}</h2>
      <p class="text-muted-foreground">{m.cfp_management_description()}</p>
    </div>
    {#if archivedCount > 0}
      <Button variant="outline" onclick={() => (showArchived = !showArchived)}>
        {#if showArchived}
          <EyeOff class="mr-2 h-4 w-4" />
          {m.cfp_hide_archived()} ({archivedCount})
        {:else}
          <Eye class="mr-2 h-4 w-4" />
          {m.cfp_show_archived()} ({archivedCount})
        {/if}
      </Button>
    {/if}
  </div>

  {#if filteredEditions.length === 0}
    <Card.Root>
      <Card.Content class="flex flex-col items-center justify-center py-12">
        <FileText class="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 class="text-lg font-semibold">{m.cfp_no_editions()}</h3>
        <p class="text-sm text-muted-foreground">
          {#if !showArchived && archivedCount > 0}
            {m.cfp_all_editions_archived()}
            <button class="text-primary underline" onclick={() => (showArchived = true)}>
              {m.cfp_show_archived_editions()}
            </button>
          {:else}
            {m.cfp_create_edition_hint()}
          {/if}
        </p>
      </Card.Content>
    </Card.Root>
  {:else}
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {#each filteredEditions as edition}
        <Card.Root class="transition-shadow hover:shadow-md {edition.status === 'archived' ? 'opacity-60' : ''}">
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
                  <a href="/admin/cfp/{edition.slug}/settings" title={m.cfp_settings()}>
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
                {m.cfp_manage_submissions()}
                <ArrowRight class="ml-2 h-4 w-4" />
              </Button>
            </a>
          </Card.Content>
        </Card.Root>
      {/each}
    </div>
  {/if}
</div>
