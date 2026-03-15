<script lang="ts">
import { StatusBadge } from '$lib/components/shared'
import { formatDate } from '$lib/components/shared/utils'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { ArrowRight, Calendar, CalendarDays, Eye, EyeOff, Settings } from 'lucide-svelte'
import type { Component } from 'svelte'

interface Edition {
  id: string
  name: string
  slug: string
  status: string
  startDate: Date
  endDate: Date
}

interface Props {
  editions: Edition[]
  basePath: string
  title: string
  description: string
  manageLabel: string
  emptyIcon?: Component
  emptyTitle: string
  emptyDescription: string
  allArchivedText: string
  showArchivedLinkText: string
  hideArchivedText: (count: number) => string
  showArchivedText: (count: number) => string
  settingsPath?: string
  settingsTitle?: string
  manageSuffix?: string
  manageIcon?: Component
  showSettingsIcon?: boolean
  linkStatusBadge?: boolean
}

const {
  editions,
  basePath,
  title,
  description,
  manageLabel,
  emptyIcon: EmptyIcon = CalendarDays,
  emptyTitle,
  emptyDescription,
  allArchivedText,
  showArchivedLinkText,
  hideArchivedText,
  showArchivedText,
  settingsPath = 'settings',
  settingsTitle = 'Settings',
  manageSuffix = '',
  manageIcon: ManageIcon,
  showSettingsIcon = false,
  linkStatusBadge = true
}: Props = $props()

let showArchived = $state(false)

const filteredEditions = $derived(
  showArchived ? editions : editions.filter((e) => e.status !== 'archived')
)

const archivedCount = $derived(editions.filter((e) => e.status === 'archived').length)
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-3xl font-bold tracking-tight">{title}</h2>
      <p class="text-muted-foreground">{description}</p>
    </div>
    {#if archivedCount > 0}
      <Button variant="outline" onclick={() => (showArchived = !showArchived)}>
        {#if showArchived}
          <EyeOff class="mr-2 h-4 w-4" />
          {hideArchivedText(archivedCount)}
        {:else}
          <Eye class="mr-2 h-4 w-4" />
          {showArchivedText(archivedCount)}
        {/if}
      </Button>
    {/if}
  </div>

  {#if filteredEditions.length === 0}
    <Card.Root>
      <Card.Content class="flex flex-col items-center justify-center py-12">
        <EmptyIcon class="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 class="text-lg font-semibold">{emptyTitle}</h3>
        <p class="text-sm text-muted-foreground">
          {#if !showArchived && archivedCount > 0}
            {allArchivedText}
            <button class="text-primary underline" onclick={() => (showArchived = true)}>
              {showArchivedLinkText}
            </button>
          {:else}
            {emptyDescription}
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
                {#if linkStatusBadge}
                  <a href="/admin/editions/{edition.slug}/settings" title="Change edition status">
                    <StatusBadge status={edition.status} size="sm" />
                  </a>
                {:else}
                  <StatusBadge status={edition.status} size="sm" />
                {/if}
                {#if showSettingsIcon}
                  <a href="{basePath}/{edition.slug}/{settingsPath}" title={settingsTitle}>
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
            <a href="{basePath}/{edition.slug}{manageSuffix}">
              <Button class="w-full" variant="outline">
                {#if ManageIcon}
                  <ManageIcon class="mr-2 h-4 w-4" />
                {/if}
                {manageLabel}
                <ArrowRight class="ml-2 h-4 w-4" />
              </Button>
            </a>
          </Card.Content>
        </Card.Root>
      {/each}
    </div>
  {/if}
</div>
