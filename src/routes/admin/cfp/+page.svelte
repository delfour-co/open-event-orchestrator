<script lang="ts">
import { enhance } from '$app/forms'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { ArrowRight, Calendar, FileText } from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date)
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'published':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    case 'draft':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    case 'archived':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
  }
}

const statuses = ['draft', 'published', 'archived'] as const
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
              <span
                class="rounded-full px-2 py-0.5 text-xs font-medium {getStatusColor(edition.status)}"
              >
                {edition.status}
              </span>
            </div>
            <Card.Description>
              {formatDate(edition.startDate)} - {formatDate(edition.endDate)}
            </Card.Description>
          </Card.Header>
          <Card.Content class="space-y-3">
            <div class="flex items-center gap-1">
              <span class="mr-2 text-xs text-muted-foreground">Status:</span>
              {#each statuses as status}
                <form method="POST" action="?/updateStatus" use:enhance class="inline">
                  <input type="hidden" name="editionId" value={edition.id} />
                  <input type="hidden" name="status" value={status} />
                  <Button
                    type="submit"
                    variant={edition.status === status ? 'default' : 'outline'}
                    size="sm"
                    class="h-7 px-2 text-xs"
                    disabled={edition.status === status}
                  >
                    {status}
                  </Button>
                </form>
              {/each}
            </div>
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
