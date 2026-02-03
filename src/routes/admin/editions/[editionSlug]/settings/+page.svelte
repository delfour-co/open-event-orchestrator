<script lang="ts">
import { enhance } from '$app/forms'
import { invalidateAll } from '$app/navigation'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import { ArrowLeft, Loader2 } from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

let isSubmitting = $state(false)

function formatDateForInput(date: Date): string {
  return date.toISOString().split('T')[0]
}

const statuses = ['draft', 'published', 'archived'] as const

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
</script>

<svelte:head>
  <title>Edition Settings - {data.edition.name} - Open Event Orchestrator</title>
</svelte:head>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center gap-4">
    <a href="/admin/events">
      <Button variant="ghost" size="icon">
        <ArrowLeft class="h-4 w-4" />
      </Button>
    </a>
    <div>
      <h2 class="text-3xl font-bold tracking-tight">{data.edition.name}</h2>
      <p class="text-muted-foreground">
        Edition settings for {data.edition.eventName}
      </p>
    </div>
  </div>

  {#if form?.error}
    <div class="rounded-md border border-destructive bg-destructive/10 p-4 text-destructive">
      {form.error}
    </div>
  {/if}

  {#if form?.success}
    <div class="rounded-md border border-green-500 bg-green-500/10 p-4 text-green-700 dark:text-green-400">
      {form.message}
    </div>
  {/if}

  <!-- Status Card -->
  <Card.Root>
    <Card.Header>
      <Card.Title>Edition Status</Card.Title>
      <Card.Description>
        Control whether this edition is visible publicly
      </Card.Description>
    </Card.Header>
    <Card.Content>
      <div class="flex items-center gap-4">
        <span class="text-sm text-muted-foreground">Current status:</span>
        <span
          class="rounded-full px-3 py-1 text-sm font-medium {getStatusColor(data.edition.status)}"
        >
          {data.edition.status}
        </span>
      </div>
      <div class="mt-4 flex items-center gap-2">
        <span class="mr-2 text-sm text-muted-foreground">Change to:</span>
        {#each statuses as status}
          <form
            method="POST"
            action="?/updateStatus"
            use:enhance={() => {
              return async ({ update }) => {
                await update()
                await invalidateAll()
              }
            }}
            class="inline"
          >
            <input type="hidden" name="status" value={status} />
            <Button
              type="submit"
              variant={data.edition.status === status ? 'default' : 'outline'}
              size="sm"
              disabled={data.edition.status === status}
            >
              {status}
            </Button>
          </form>
        {/each}
      </div>
      <p class="mt-3 text-xs text-muted-foreground">
        <strong>Draft:</strong> Edition not visible publicly.
        <strong>Published:</strong> Edition visible and active.
        <strong>Archived:</strong> Edition closed, data preserved.
      </p>
    </Card.Content>
  </Card.Root>

  <!-- Edition Details Card -->
  <Card.Root>
    <Card.Header>
      <Card.Title>Edition Details</Card.Title>
      <Card.Description>Update the basic information for this edition</Card.Description>
    </Card.Header>
    <Card.Content>
      <form
        method="POST"
        action="?/updateEdition"
        use:enhance={() => {
          isSubmitting = true
          return async ({ update }) => {
            isSubmitting = false
            await update()
            await invalidateAll()
          }
        }}
        class="space-y-4"
      >
        <div class="space-y-2">
          <Label for="edition-name">Name</Label>
          <Input
            id="edition-name"
            name="name"
            value={data.edition.name}
            required
          />
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-2">
            <Label for="edition-startDate">Start Date</Label>
            <Input
              id="edition-startDate"
              name="startDate"
              type="date"
              value={formatDateForInput(data.edition.startDate)}
              required
            />
          </div>
          <div class="space-y-2">
            <Label for="edition-endDate">End Date</Label>
            <Input
              id="edition-endDate"
              name="endDate"
              type="date"
              value={formatDateForInput(data.edition.endDate)}
              required
            />
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-3">
          <div class="space-y-2">
            <Label for="edition-venue">Venue</Label>
            <Input
              id="edition-venue"
              name="venue"
              value={data.edition.venue}
              placeholder="Convention Center"
            />
          </div>
          <div class="space-y-2">
            <Label for="edition-city">City</Label>
            <Input
              id="edition-city"
              name="city"
              value={data.edition.city}
              placeholder="Paris"
            />
          </div>
          <div class="space-y-2">
            <Label for="edition-country">Country</Label>
            <Input
              id="edition-country"
              name="country"
              value={data.edition.country}
              placeholder="France"
            />
          </div>
        </div>

        <div class="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {#if isSubmitting}
              <Loader2 class="mr-2 h-4 w-4 animate-spin" />
              Saving...
            {:else}
              Save Details
            {/if}
          </Button>
        </div>
      </form>
    </Card.Content>
  </Card.Root>

  <!-- Quick Links -->
  <Card.Root>
    <Card.Header>
      <Card.Title>Related Settings</Card.Title>
      <Card.Description>Manage other aspects of this edition</Card.Description>
    </Card.Header>
    <Card.Content>
      <div class="flex gap-2">
        <a href="/admin/cfp/{data.edition.slug}/settings">
          <Button variant="outline">CFP Settings</Button>
        </a>
        <a href="/admin/cfp/{data.edition.slug}/submissions">
          <Button variant="outline">View Submissions</Button>
        </a>
      </div>
    </Card.Content>
  </Card.Root>
</div>
