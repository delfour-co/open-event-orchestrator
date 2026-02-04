<script lang="ts">
import { enhance } from '$app/forms'
import { invalidateAll } from '$app/navigation'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import { Textarea } from '$lib/components/ui/textarea'
import { AlertTriangle, ArrowLeft, Loader2 } from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

let isSubmitting = $state(false)
let showDeleteConfirm = $state(false)

const generateSlug = (name: string) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
</script>

<svelte:head>
  <title>Event Settings - {data.event.name} - Open Event Orchestrator</title>
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
      <h2 class="text-3xl font-bold tracking-tight">{data.event.name}</h2>
      <p class="text-muted-foreground">
        Event settings - {data.event.organizationName}
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

  <!-- Event Details Card -->
  <Card.Root>
    <Card.Header>
      <Card.Title>Event Details</Card.Title>
      <Card.Description>Basic information about this event</Card.Description>
    </Card.Header>
    <Card.Content>
      <form
        method="POST"
        action="?/updateEvent"
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
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-2">
            <Label for="event-name">Name</Label>
            <Input
              id="event-name"
              name="name"
              value={data.event.name}
              required
              oninput={(e) => {
                const slugInput = document.getElementById('event-slug') as HTMLInputElement
                if (slugInput && !slugInput.dataset.modified) {
                  slugInput.value = generateSlug((e.target as HTMLInputElement).value)
                }
              }}
            />
          </div>
          <div class="space-y-2">
            <Label for="event-slug">Slug</Label>
            <Input
              id="event-slug"
              name="slug"
              value={data.event.slug}
              required
              pattern="[a-z0-9-]+"
              oninput={(e) => {
                (e.target as HTMLInputElement).dataset.modified = 'true'
              }}
            />
            <p class="text-xs text-muted-foreground">URL: /events/{data.event.slug}</p>
          </div>
        </div>

        <div class="space-y-2">
          <Label for="event-description">Description</Label>
          <Textarea
            id="event-description"
            name="description"
            value={data.event.description}
            rows={3}
            placeholder="A brief description of this event..."
          />
        </div>

        <div class="space-y-2">
          <Label for="event-website">Website</Label>
          <Input
            id="event-website"
            name="website"
            type="url"
            value={data.event.website}
            placeholder="https://myconference.com"
          />
        </div>

        <input type="hidden" name="defaultVenue" value={data.event.defaultVenue} />
        <input type="hidden" name="defaultCity" value={data.event.defaultCity} />
        <input type="hidden" name="defaultCountry" value={data.event.defaultCountry} />

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

  <!-- Default Settings Card -->
  <Card.Root>
    <Card.Header>
      <Card.Title>Default Settings for Editions</Card.Title>
      <Card.Description>
        These values will be pre-filled when creating new editions
      </Card.Description>
    </Card.Header>
    <Card.Content>
      <form
        method="POST"
        action="?/updateEvent"
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
        <input type="hidden" name="name" value={data.event.name} />
        <input type="hidden" name="slug" value={data.event.slug} />
        <input type="hidden" name="description" value={data.event.description} />
        <input type="hidden" name="website" value={data.event.website} />

        <div class="grid gap-4 sm:grid-cols-3">
          <div class="space-y-2">
            <Label for="default-venue">Default Venue</Label>
            <Input
              id="default-venue"
              name="defaultVenue"
              value={data.event.defaultVenue}
              placeholder="Convention Center"
            />
          </div>
          <div class="space-y-2">
            <Label for="default-city">Default City</Label>
            <Input
              id="default-city"
              name="defaultCity"
              value={data.event.defaultCity}
              placeholder="Paris"
            />
          </div>
          <div class="space-y-2">
            <Label for="default-country">Default Country</Label>
            <Input
              id="default-country"
              name="defaultCountry"
              value={data.event.defaultCountry}
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
              Save Defaults
            {/if}
          </Button>
        </div>
      </form>
    </Card.Content>
  </Card.Root>

  <!-- Danger Zone -->
  <Card.Root class="border-destructive">
    <Card.Header>
      <Card.Title class="flex items-center gap-2 text-destructive">
        <AlertTriangle class="h-5 w-5" />
        Danger Zone
      </Card.Title>
      <Card.Description>Irreversible actions for this event</Card.Description>
    </Card.Header>
    <Card.Content>
      <div class="flex items-center justify-between">
        <div>
          <p class="font-medium">Delete this event</p>
          <p class="text-sm text-muted-foreground">
            {#if data.editionsCount > 0}
              Cannot delete: {data.editionsCount} edition(s) exist. Delete editions first.
            {:else}
              Permanently delete this event and all associated data.
            {/if}
          </p>
        </div>
        {#if showDeleteConfirm}
          <form method="POST" action="?/deleteEvent" use:enhance class="flex gap-2">
            <Button type="submit" variant="destructive" size="sm">
              Confirm Delete
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onclick={() => (showDeleteConfirm = false)}
            >
              Cancel
            </Button>
          </form>
        {:else}
          <Button
            variant="destructive"
            size="sm"
            disabled={data.editionsCount > 0}
            onclick={() => (showDeleteConfirm = true)}
          >
            Delete Event
          </Button>
        {/if}
      </div>
    </Card.Content>
  </Card.Root>
</div>
