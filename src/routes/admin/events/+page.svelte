<script lang="ts">
import { enhance } from '$app/forms'
import { page } from '$app/stores'
import { Button } from '$lib/components/ui/button'
import * as Card from '$lib/components/ui/card'
import { Input } from '$lib/components/ui/input'
import { Label } from '$lib/components/ui/label'
import { Textarea } from '$lib/components/ui/textarea'
import {
  Building2,
  Calendar,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2
} from 'lucide-svelte'
import type { ActionData, PageData } from './$types'

interface Props {
  data: PageData
  form: ActionData
}

const { data, form }: Props = $props()

let showNewEvent = $state(false)
let showNewEdition = $state<string | null>(null)
let expandedEvents = $state<Set<string>>(new Set())
let selectedOrgId = $state<string>($page.url.searchParams.get('org') || '')

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date)
}

const generateSlug = (name: string) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function toggleEvent(eventId: string) {
  if (expandedEvents.has(eventId)) {
    expandedEvents.delete(eventId)
  } else {
    expandedEvents.add(eventId)
  }
  expandedEvents = new Set(expandedEvents)
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

// Filter events by selected organization
const filteredEvents = $derived(
  selectedOrgId ? data.events.filter((e) => e.organizationId === selectedOrgId) : data.events
)

const selectedOrg = $derived(data.organizations.find((o) => o.id === selectedOrgId))
</script>

<svelte:head>
  <title>Events - Open Event Orchestrator</title>
</svelte:head>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-3xl font-bold tracking-tight">Events</h2>
      <p class="text-muted-foreground">
        Manage your events and their editions.
        {#if selectedOrg}
          Filtered by <strong>{selectedOrg.name}</strong>.
          <button class="text-primary underline" onclick={() => (selectedOrgId = '')}>
            Show all
          </button>
        {/if}
      </p>
    </div>
    <Button onclick={() => (showNewEvent = !showNewEvent)}>
      <Plus class="mr-2 h-4 w-4" />
      New Event
    </Button>
  </div>

  {#if form?.error}
    <div class="rounded-md border border-destructive bg-destructive/10 p-4 text-destructive">
      {form.error}
    </div>
  {/if}

  <!-- New Event Form -->
  {#if showNewEvent}
    <Card.Root>
      <Card.Header>
        <Card.Title class="flex items-center gap-2">
          <CalendarDays class="h-5 w-5" />
          Create Event
        </Card.Title>
        <Card.Description>
          Events can have multiple editions (yearly occurrences). Each edition has its own CFP.
        </Card.Description>
      </Card.Header>
      <Card.Content>
        {#if data.organizations.length === 0}
          <div class="flex flex-col items-center py-6">
            <Building2 class="mb-2 h-8 w-8 text-muted-foreground" />
            <p class="mb-4 text-center text-muted-foreground">
              Please create an organization first before creating an event.
            </p>
            <a href="/admin/organizations">
              <Button variant="outline">Go to Organizations</Button>
            </a>
          </div>
        {:else}
          <form
            method="POST"
            action="?/createEvent"
            use:enhance={() => {
              return async ({ update }) => {
                await update()
                showNewEvent = false
              }
            }}
            class="space-y-4"
          >
            <div class="space-y-2">
              <Label for="event-org">Organization</Label>
              <select
                id="event-org"
                name="organizationId"
                required
                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {#each data.organizations as org}
                  <option value={org.id} selected={org.id === selectedOrgId}>{org.name}</option>
                {/each}
              </select>
            </div>
            <div class="grid gap-4 md:grid-cols-2">
              <div class="space-y-2">
                <Label for="event-name">Event Name</Label>
                <Input
                  id="event-name"
                  name="name"
                  placeholder="DevFest"
                  required
                  oninput={(e) => {
                    const slugInput = document.getElementById('event-slug') as HTMLInputElement
                    if (slugInput)
                      slugInput.value = generateSlug((e.target as HTMLInputElement).value)
                  }}
                />
              </div>
              <div class="space-y-2">
                <Label for="event-slug">Slug</Label>
                <Input id="event-slug" name="slug" placeholder="devfest" required />
              </div>
            </div>
            <div class="space-y-2">
              <Label for="event-description">Description</Label>
              <Textarea
                id="event-description"
                name="description"
                placeholder="The biggest developer festival..."
              />
            </div>
            <div class="flex gap-2">
              <Button type="submit">Create Event</Button>
              <Button type="button" variant="ghost" onclick={() => (showNewEvent = false)}>
                Cancel
              </Button>
            </div>
          </form>
        {/if}
      </Card.Content>
    </Card.Root>
  {/if}

  <!-- Organization Filter -->
  {#if data.organizations.length > 1 && !selectedOrgId}
    <div class="flex items-center gap-2">
      <Label class="text-sm text-muted-foreground">Filter by organization:</Label>
      <select
        class="rounded-md border border-input bg-background px-3 py-1 text-sm"
        onchange={(e) => (selectedOrgId = (e.target as HTMLSelectElement).value)}
      >
        <option value="">All organizations</option>
        {#each data.organizations as org}
          <option value={org.id}>{org.name}</option>
        {/each}
      </select>
    </div>
  {/if}

  <!-- Events List -->
  {#if filteredEvents.length === 0}
    <Card.Root>
      <Card.Content class="flex flex-col items-center justify-center py-12">
        <CalendarDays class="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 class="text-lg font-semibold">No events yet</h3>
        <p class="mb-4 text-sm text-muted-foreground">
          {#if data.organizations.length === 0}
            Create an organization first, then add events.
          {:else}
            Create your first event to get started.
          {/if}
        </p>
        {#if data.organizations.length === 0}
          <a href="/admin/organizations">
            <Button>
              <Building2 class="mr-2 h-4 w-4" />
              Create Organization
            </Button>
          </a>
        {:else}
          <Button onclick={() => (showNewEvent = true)}>
            <Plus class="mr-2 h-4 w-4" />
            Create Event
          </Button>
        {/if}
      </Card.Content>
    </Card.Root>
  {:else}
    <div class="space-y-4">
      {#each filteredEvents as event}
        <Card.Root>
          <Card.Header class="pb-3">
            <div class="flex items-center justify-between">
              <button
                class="flex flex-1 items-center gap-2 text-left"
                onclick={() => toggleEvent(event.id)}
              >
                {#if expandedEvents.has(event.id)}
                  <ChevronDown class="h-5 w-5 text-muted-foreground" />
                {:else}
                  <ChevronRight class="h-5 w-5 text-muted-foreground" />
                {/if}
                <div>
                  <Card.Title class="flex items-center gap-2">
                    <CalendarDays class="h-5 w-5" />
                    {event.name}
                  </Card.Title>
                  <Card.Description>
                    {event.organizationName} - {event.editions.length} edition(s)
                  </Card.Description>
                </div>
              </button>
              <div class="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onclick={() => {
                    showNewEdition = showNewEdition === event.id ? null : event.id
                    expandedEvents.add(event.id)
                    expandedEvents = new Set(expandedEvents)
                  }}
                >
                  <Plus class="mr-2 h-4 w-4" />
                  Add Edition
                </Button>
                <form method="POST" action="?/deleteEvent" use:enhance>
                  <input type="hidden" name="eventId" value={event.id} />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="sm"
                    class="text-destructive hover:text-destructive"
                    onclick={(e) => {
                      if (!confirm('Delete this event and all its editions?')) {
                        e.preventDefault()
                      }
                    }}
                  >
                    <Trash2 class="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </div>
          </Card.Header>

          {#if expandedEvents.has(event.id) || showNewEdition === event.id}
            <Card.Content>
              <!-- New Edition Form -->
              {#if showNewEdition === event.id}
                <div class="mb-4 rounded-md border bg-muted/50 p-4">
                  <h4 class="mb-3 font-semibold">Create New Edition</h4>
                  <form
                    method="POST"
                    action="?/createEdition"
                    use:enhance={() => {
                      return async ({ update }) => {
                        await update()
                        showNewEdition = null
                        expandedEvents.add(event.id)
                        expandedEvents = new Set(expandedEvents)
                      }
                    }}
                    class="space-y-4"
                  >
                    <input type="hidden" name="eventId" value={event.id} />
                    <div class="grid gap-4 md:grid-cols-3">
                      <div class="space-y-2">
                        <Label for="edition-name-{event.id}">Name</Label>
                        <Input
                          id="edition-name-{event.id}"
                          name="name"
                          placeholder="{event.name} Paris 2025"
                          required
                          oninput={(e) => {
                            const slugInput = document.getElementById(
                              `edition-slug-${event.id}`
                            ) as HTMLInputElement
                            if (slugInput)
                              slugInput.value = generateSlug((e.target as HTMLInputElement).value)
                          }}
                        />
                      </div>
                      <div class="space-y-2">
                        <Label for="edition-slug-{event.id}">Slug</Label>
                        <Input
                          id="edition-slug-{event.id}"
                          name="slug"
                          placeholder="{event.slug}-paris-2025"
                          required
                        />
                      </div>
                      <div class="space-y-2">
                        <Label for="edition-year-{event.id}">Year</Label>
                        <Input
                          id="edition-year-{event.id}"
                          name="year"
                          type="number"
                          placeholder="2025"
                          value={new Date().getFullYear()}
                          required
                        />
                      </div>
                    </div>
                    <div class="grid gap-4 md:grid-cols-2">
                      <div class="space-y-2">
                        <Label for="edition-start-{event.id}">Start Date</Label>
                        <Input
                          id="edition-start-{event.id}"
                          name="startDate"
                          type="date"
                          required
                        />
                      </div>
                      <div class="space-y-2">
                        <Label for="edition-end-{event.id}">End Date</Label>
                        <Input id="edition-end-{event.id}" name="endDate" type="date" required />
                      </div>
                    </div>
                    <div class="grid gap-4 md:grid-cols-3">
                      <div class="space-y-2">
                        <Label for="edition-venue-{event.id}">Venue</Label>
                        <Input
                          id="edition-venue-{event.id}"
                          name="venue"
                          placeholder="Convention Center"
                        />
                      </div>
                      <div class="space-y-2">
                        <Label for="edition-city-{event.id}">City</Label>
                        <Input id="edition-city-{event.id}" name="city" placeholder="Paris" />
                      </div>
                      <div class="space-y-2">
                        <Label for="edition-country-{event.id}">Country</Label>
                        <Input id="edition-country-{event.id}" name="country" placeholder="France" />
                      </div>
                    </div>
                    <div class="flex gap-2">
                      <Button type="submit">Create Edition</Button>
                      <Button type="button" variant="ghost" onclick={() => (showNewEdition = null)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </div>
              {/if}

              <!-- Editions List -->
              {#if event.editions.length === 0}
                <p class="text-sm text-muted-foreground">
                  No editions yet. Create one to get started.
                </p>
              {:else}
                <div class="space-y-2">
                  {#each event.editions as edition}
                    <div
                      class="flex items-center justify-between rounded-md border bg-background p-3"
                    >
                      <div class="flex items-center gap-3">
                        <Calendar class="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p class="font-medium">{edition.name}</p>
                          <p class="text-sm text-muted-foreground">
                            {formatDate(edition.startDate)} - {formatDate(edition.endDate)}
                          </p>
                        </div>
                        <span
                          class="rounded-full px-2 py-0.5 text-xs font-medium {getStatusColor(edition.status)}"
                        >
                          {edition.status}
                        </span>
                      </div>
                      <div class="flex items-center gap-2">
                        <a href="/admin/cfp/{edition.slug}/submissions">
                          <Button variant="outline" size="sm">Manage CFP</Button>
                        </a>
                        <form method="POST" action="?/deleteEdition" use:enhance>
                          <input type="hidden" name="editionId" value={edition.id} />
                          <Button
                            type="submit"
                            variant="ghost"
                            size="sm"
                            class="text-destructive hover:text-destructive"
                            onclick={(e) => {
                              if (!confirm('Delete this edition?')) {
                                e.preventDefault()
                              }
                            }}
                          >
                            <Trash2 class="h-4 w-4" />
                          </Button>
                        </form>
                      </div>
                    </div>
                  {/each}
                </div>
              {/if}
            </Card.Content>
          {/if}
        </Card.Root>
      {/each}
    </div>
  {/if}
</div>
