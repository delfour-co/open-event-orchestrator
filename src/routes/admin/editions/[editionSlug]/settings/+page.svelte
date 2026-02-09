<script lang="ts">
import { enhance } from '$app/forms'
import { invalidateAll } from '$app/navigation'
import { StatusBadge } from '$lib/components/shared'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import { AlertTriangle, ArrowLeft, Loader2, Trash2 } from 'lucide-svelte'
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
        <StatusBadge status={data.edition.status} />
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
      <div class="flex flex-wrap gap-2">
        <a href="/admin/editions/{data.edition.slug}/team">
          <Button variant="outline">Team Members</Button>
        </a>
        <a href="/admin/cfp/{data.edition.slug}/settings">
          <Button variant="outline">CFP Settings</Button>
        </a>
        <a href="/admin/cfp/{data.edition.slug}/submissions">
          <Button variant="outline">View Submissions</Button>
        </a>
      </div>
    </Card.Content>
  </Card.Root>

  <!-- Danger Zone -->
  <Card.Root class="border-destructive">
    <Card.Header>
      <Card.Title class="flex items-center gap-2 text-destructive">
        <AlertTriangle class="h-5 w-5" />
        Danger Zone
      </Card.Title>
      <Card.Description>
        Irreversible actions that affect this edition
      </Card.Description>
    </Card.Header>
    <Card.Content>
      <div class="flex items-center justify-between rounded-lg border border-destructive/50 p-4">
        <div>
          <h4 class="font-medium">Delete this edition</h4>
          <p class="text-sm text-muted-foreground">
            Permanently delete this edition and all its associated data. This action cannot be undone.
          </p>
        </div>
        <form
          method="POST"
          action="?/deleteEdition"
          use:enhance={() => {
            return async ({ update }) => {
              await update()
            }
          }}
        >
          <Button
            type="submit"
            variant="destructive"
            onclick={(e) => {
              if (!confirm(`Are you sure you want to delete "${data.edition.name}"? This action cannot be undone.`)) {
                e.preventDefault()
              }
            }}
          >
            <Trash2 class="mr-2 h-4 w-4" />
            Delete Edition
          </Button>
        </form>
      </div>
    </Card.Content>
  </Card.Root>
</div>
